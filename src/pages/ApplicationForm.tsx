import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormBuilder from '../components/FormBuilder';
import { processedFormData as formData } from '../data/processedFormData';
import { ArrowLeft, Home, FileText, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchLatestPassportRecord,
  mapPassportRecordToFormFields,
  getPassportRecordCount,
  type PassportRecord
} from '../services/passportRecordsService';
import {
  savePassportData,
  formatPassportDataForSupabase
} from '../services/supabaseService';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  // Auto-fill functionality states
  const [formFieldData, setFormFieldData] = useState<any>({});
  const [isLoadingPassportData, setIsLoadingPassportData] = useState(false);
  const [passportRecordCount, setPassportRecordCount] = useState<number>(0);
  const [latestPassportRecord, setLatestPassportRecord] = useState<PassportRecord | null>(null);
  const [clearFormTrigger, setClearFormTrigger] = useState<number>(0);
  const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  
  // Debug: Log the imported form data
  console.log('ApplicationForm - formData imported:', formData);
  console.log('ApplicationForm - formData structure:', {
    hasInputForm: !!formData?.inputForm,
    hasFields: !!formData?.inputForm?.fields,
    fieldsCount: formData?.inputForm?.fields?.length || 0
  });

  const handleFormSubmit = async (data: any) => {
    try {
      console.log('Form submitted, saving to database:', data);

      // Format form data for Supabase
      const supabaseData = formatPassportDataForSupabase(data);

      // Save to database
      const saveResult = await savePassportData(supabaseData);

      if (saveResult.success) {
        console.log('✅ Form data saved to database successfully:', saveResult.data);
        setSubmittedData(data);
        setShowPreview(true);
      } else {
        console.error('❌ Failed to save form data:', saveResult.error);
        alert(`Failed to save data: ${saveResult.error}\n\nPlease try again.`);
      }
    } catch (error) {
      console.error('❌ Error saving form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving form: ${errorMessage}\n\nPlease try again.`);
    }
  };

  const handleFinalSubmit = () => {
    // Send to backend/Supabase
    alert('Application submitted successfully!');
    navigate('/dashboard');
  };

  // DISABLED: Auto-load passport data on component mount
  // User should manually click the refresh button to load data from database
  // useEffect(() => {
  //   const loadPassportData = async () => {
  //     try {
  //       setIsLoadingPassportData(true);
  //       setAutoFillError(null);
  //
  //       // Get count of passport records
  //       const count = await getPassportRecordCount();
  //       setPassportRecordCount(count);
  //
  //       // Auto-load latest passport data if available
  //       if (count > 0) {
  //         console.log('Found', count, 'passport records, loading latest...');
  //         const latestRecord = await fetchLatestPassportRecord();
  //
  //         if (latestRecord) {
  //           setLatestPassportRecord(latestRecord);
  //           const mappedFormData = mapPassportRecordToFormFields(latestRecord);
  //           setFormFieldData(mappedFormData);
  //           setShowAutoFillSuccess(true);
  //           console.log('Auto-filled form with latest passport data');
  //
  //           // Auto-hide success message after 5 seconds
  //           setTimeout(() => setShowAutoFillSuccess(false), 5000);
  //         }
  //       } else {
  //         console.log('No passport records found for auto-fill');
  //       }
  //     } catch (error) {
  //       console.error('Error loading passport data:', error);
  //       let errorMessage = 'Failed to load passport data';
  //       if (error instanceof Error) {
  //         if (error.message.includes('schema cache')) {
  //           errorMessage = 'Database schema mismatch. Please check if database columns match the application requirements.';
  //         } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
  //           errorMessage = 'Network connection error. Please check your internet connection and try again.';
  //         } else if (error.message.includes('Database error')) {
  //           errorMessage = 'Database connection error. Please verify your database configuration.';
  //         } else {
  //           errorMessage = `Failed to load passport data: ${error.message}`;
  //         }
  //       }
  //       setAutoFillError(errorMessage);
  //     } finally {
  //       setIsLoadingPassportData(false);
  //     }
  //   };
  //
  //   loadPassportData();
  // }, []);

  // Manual refresh passport data
  const handleRefreshPassportData = async () => {
    try {
      setIsLoadingPassportData(true);
      setAutoFillError(null);
      setShowAutoFillSuccess(false);
      
      const latestRecord = await fetchLatestPassportRecord();
      if (latestRecord) {
        setLatestPassportRecord(latestRecord);
        const mappedFormData = mapPassportRecordToFormFields(latestRecord);
        setFormFieldData(mappedFormData);
        setShowAutoFillSuccess(true);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setShowAutoFillSuccess(false), 5000);
      } else {
        setAutoFillError('No passport records found in database');
      }
    } catch (error) {
      console.error('Error refreshing passport data:', error);
      let errorMessage = 'Failed to refresh passport data';
      if (error instanceof Error) {
        if (error.message.includes('schema cache')) {
          errorMessage = 'Database schema mismatch. Please check if database columns match the application requirements.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network error')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('Database error')) {
          errorMessage = 'Database connection error. Please verify your database configuration.';
        } else {
          errorMessage = `Failed to refresh passport data: ${error.message}`;
        }
      }
      setAutoFillError(errorMessage);
    } finally {
      setIsLoadingPassportData(false);
    }
  };

  // Clear form data (UI only, preserves database)
  const handleClearFormData = () => {
    setFormFieldData({});
    setLatestPassportRecord(null);
    setShowAutoFillSuccess(false);
    setAutoFillError(null);
    setClearFormTrigger(prev => prev + 1); // Trigger FormBuilder reset
    console.log('Form data cleared and FormBuilder reset triggered');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center mr-4 text-gray-700 hover:text-indigo-600">
                <Home className="h-5 w-5 mr-2" />
                <span className="font-medium">Home</span>
              </Link>
              <span className="text-gray-400 mx-2">|</span>
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-xl font-semibold text-gray-900">ORMA Kshemanidhi Application Form</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {!showPreview ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ORMA - NORKA KASHEMANIDHI REGESTRATION/RENEWAL DATA COLLECTION FROM</h1>
            </div>

            <FormBuilder 
              formData={formData} 
              onSubmit={handleFormSubmit}
              isAdmin={false}
              initialData={formFieldData}
              clearFormTrigger={clearFormTrigger}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Review Your Application</h2>
            <div className="space-y-4 mb-8">
              {Object.entries(submittedData).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="ml-2 text-gray-900">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Back to Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Submit Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationForm;