import React, { useState, useCallback } from 'react';
import { PassportData, ImageFile } from '../types';
import { extractPassportData } from '../services/passportExtractor';
import { supabase, logAuditEvent } from '../lib/supabase';
import { useAuth } from '../contexts/DevAuthContext';
import Spinner from './Spinner';
import ResultDisplay from './ResultDisplay';
import { Upload, AlertCircle } from 'lucide-react';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const UploadIcon: React.FC = () => (
    <svg className="w-12 h-12 mx-auto text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ExtractorApp: React.FC = () => {
    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [extractedData, setExtractedData] = useState<PassportData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    
    const { user } = useAuth();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (PNG, JPG, etc.).');
                return;
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB.');
                return;
            }
            
            setExtractedData(null);
            setError(null);
            setSaveSuccess(false);
            
            const dataUrl = URL.createObjectURL(file);
            const base64 = await fileToBase64(file);
            setImageFile({ file, dataUrl, base64 });
        }
    };

    const uploadDocumentToSupabase = async (file: File): Promise<string | null> => {
        try {
            if (!user) throw new Error('User not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, file);

            if (error) throw error;

            // Save document metadata to database
            const { data: documentData, error: dbError } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    organization_id: null,
                    filename: fileName,
                    original_filename: file.name,
                    file_path: data.path,
                    file_size: file.size,
                    mime_type: file.type,
                    document_type: 'passport'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            return documentData?.id || null;
        } catch (error) {
            console.error('Error uploading document:', error);
            return null;
        }
    };

    const handleExtract = useCallback(async () => {
        if (!imageFile || !user) return;

        setIsLoading(true);
        setError(null);
        setExtractedData(null);
        setSaveSuccess(false);

        try {
            // Extract data using AI
            const data = await extractPassportData(imageFile.base64, imageFile.file.type);
            const completeData: PassportData = {
                surname: null,
                givenName: null,
                sex: null,
                dateOfBirth: null,
                placeOfBirth: null,
                dateOfIssue: null,
                dateOfExpiry: null,
                placeOfIssue: null,
                passportNumber: null,
                fatherName: null,
                motherName: null,
                spouseName: null,
                address: null,
                fileNumber: null,
                mrzLine1: null,
                mrzLine2: null,
                nationality: null,
                countryOfResidence: null,
                visaInformation: null,
                contactNumber: null,
                emailAddress: null,
                ...data,
            };
            
            setExtractedData(completeData);
            
            // Log the extraction event
            await logAuditEvent(
                'documents',
                '',
                'EXTRACT',
                null,
                { extractedFields: Object.keys(data).length }
            );
            
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, user]);
    
    const handleReset = () => {
        setImageFile(null);
        setExtractedData(null);
        setError(null);
        setIsLoading(false);
        setSaveSuccess(false);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const handleDataUpdate = (updatedData: PassportData) => {
        setExtractedData(updatedData);
    };

    const handleSubmit = async () => {
        if (!extractedData || !imageFile || !user) return;

        setIsSaving(true);
        setError(null);

        try {
            // Upload document to Supabase storage
            const documentId = await uploadDocumentToSupabase(imageFile.file);
            
            if (!documentId) {
                throw new Error('Failed to upload document');
            }

            // Create application record
            const { data: applicationData, error: appError } = await supabase
                .from('applications')
                .insert({
                    user_id: user.id,
                    organization_id: null,
                    document_id: documentId,
                    application_type: 'passport_extraction',
                    form_data: {},
                    extracted_data: extractedData,
                    status: 'completed'
                })
                .select()
                .single();

            if (appError) throw appError;

            // Update document with extracted data
            await supabase
                .from('documents')
                .update({
                    extracted_data: extractedData,
                    is_processed: true
                })
                .eq('id', documentId);

            // Log the submission event
            await logAuditEvent(
                'applications',
                applicationData?.id || '',
                'CREATE',
                null,
                { type: 'passport_extraction', status: 'completed' }
            );

            setSaveSuccess(true);
            
            // Reset form after successful save
            setTimeout(() => {
                handleReset();
            }, 3000);

        } catch (err: any) {
            setError(`Failed to save data: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (saveSuccess) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
                        Data Saved Successfully!
                    </h3>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Your passport data has been extracted and saved to your account. You can view all your applications in the dashboard.
                    </p>
                    <button
                        onClick={handleReset}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
                    >
                        Extract Another Document
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    Passport Data Extractor
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                    Upload a passport image and let our AI extract the information for you.
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                {!imageFile ? (
                    <div>
                        <label htmlFor="file-upload" className="relative cursor-pointer block w-full border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg p-12 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors duration-200">
                            <UploadIcon />
                            <span className="mt-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Click to upload a passport image
                            </span>
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                PNG, JPG, WEBP up to 10MB
                            </span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mb-6 relative w-full max-w-md mx-auto">
                            <img src={imageFile.dataUrl} alt="Passport preview" className="rounded-lg shadow-md w-full h-auto object-contain" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleExtract}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-sky-500"
                            >
                                {isLoading && <Spinner />}
                                <span className={isLoading ? 'ml-3' : ''}>
                                    {isLoading ? 'Extracting...' : 'Extract Information'}
                                </span>
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-sky-500"
                            >
                                Choose Different Image
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Error
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {extractedData && (
                <ResultDisplay 
                    data={extractedData} 
                    onUpdate={handleDataUpdate} 
                    onSubmit={handleSubmit}
                    isSubmitting={isSaving}
                />
            )}
        </div>
    );
};

export default ExtractorApp;