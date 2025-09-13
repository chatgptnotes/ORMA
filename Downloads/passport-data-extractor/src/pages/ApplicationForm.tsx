import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormBuilder from '../components/FormBuilder';
import formData from '../data/processedFormData.json';
import { ArrowLeft, Home, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  // Debug: Log the imported form data
  console.log('ApplicationForm - formData imported:', formData);
  console.log('ApplicationForm - formData structure:', {
    hasInputForm: !!formData?.inputForm,
    hasFields: !!formData?.inputForm?.fields,
    fieldsCount: formData?.inputForm?.fields?.length || 0
  });

  const handleFormSubmit = (data: any) => {
    setSubmittedData(data);
    setShowPreview(true);
    // Here you would normally send the data to your backend
    console.log('Form submitted:', data);
  };

  const handleFinalSubmit = () => {
    // Send to backend/Supabase
    alert('Application submitted successfully!');
    navigate('/dashboard');
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
            <div className="flex items-center">
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {!showPreview ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kshemanidhi Welfare Fund Application</h1>
              <p className="text-gray-600">Complete all 43 required fields for your ORMA welfare application</p>
            </div>
            <FormBuilder 
              formData={formData} 
              onSubmit={handleFormSubmit}
              isAdmin={false}
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