import React, { useState, useCallback } from 'react';
import { PassportData, ImageFile } from './types';
import { extractPassportData } from './services/geminiService';
import Spinner from './components/Spinner';
import ResultDisplay from './components/ResultDisplay';

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


const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [extractedData, setExtractedData] = useState<PassportData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (PNG, JPG, etc.).');
                return;
            }
            setExtractedData(null);
            setError(null);
            
            const dataUrl = URL.createObjectURL(file);
            const base64 = await fileToBase64(file);
            setImageFile({ file, dataUrl, base64 });
        }
    };

    const handleExtract = useCallback(async () => {
        if (!imageFile) return;

        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        try {
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
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);
    
    const handleReset = () => {
        setImageFile(null);
        setExtractedData(null);
        setError(null);
        setIsLoading(false);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const handleDataUpdate = (updatedData: PassportData) => {
        setExtractedData(updatedData);
    };

    const handleSubmit = () => {
        if (extractedData) {
            console.log("Saving data:", extractedData);
            alert("Data saved to console!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <main className="container mx-auto px-4 py-8 md:py-16">
                <div className="max-w-4xl mx-auto mb-12 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        Overseas Malayali Association (KNRKWB)
                    </h2>
                    <p className="text-md font-semibold text-sky-600 dark:text-sky-400 mb-4">
                        Kshemanidhi: A Welfare Fund for Malayalis Abroad
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        The Overseas Malayali Association (ORMA) has established the Kshemanidhi (Welfare Fund), a savings and welfare scheme designed to provide financial security and support to Malayali expatriates and their families.
                    </p>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        Key Benefits & Features:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                        <li>Membership opportunities for all Malayali expatriates.</li>
                        <li>Financial security schemes including a pension fund and emergency financial help.</li>
                        <li>Comprehensive medical support and aid.</li>
                        <li>Family welfare assistance, including children’s education aid and support in case of accidents or death.</li>
                    </ul>
                </div>

                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                        Passport Data Extractor
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Upload a passport image and let our AI-powered tool instantly extract the information for you.
                    </p>
                </header>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                        {!imageFile ? (
                            <div>
                                <label htmlFor="file-upload" className="relative cursor-pointer block w-full border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg p-12 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors duration-200">
                                    <UploadIcon />
                                    <span className="mt-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Click to upload an image
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
                                        Choose a different image
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative text-center" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                </div>

                {extractedData && <ResultDisplay data={extractedData} onUpdate={handleDataUpdate} onSubmit={handleSubmit} />}
            </main>
        </div>
    );
};

export default App;