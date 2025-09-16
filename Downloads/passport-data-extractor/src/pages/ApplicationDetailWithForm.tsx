import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, FileText, Save, X } from 'lucide-react';
import { getPassportRecord, updatePassportData, deletePassportRecord } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import FormBuilder from '../components/FormBuilder';
import { processedFormData as formData } from '../data/processedFormData';
import '../components/FormBuilder.css';

const ApplicationDetailWithForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (id) {
      fetchApplication(id);
    }
  }, [id]);

  const fetchApplication = async (applicationId: string) => {
    try {
      const result = await getPassportRecord(applicationId);

      if (result.success && result.data) {
        setApplication(result.data);
      } else {
        alert('Application not found. Redirecting to applications list.');
        navigate('/applications');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Error loading application details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveStatus({ type: null, message: '' });
  };

  const handleSave = async (formData: any) => {
    if (!id) return;

    try {
      // Merge the form data with existing application data
      const updatedData = {
        ...application,
        form_data: formData,
        updated_at: new Date().toISOString()
      };

      const result = await updatePassportData(id, updatedData);
      if (result.success) {
        setApplication(updatedData);
        setIsEditing(false);
        setSaveStatus({
          type: 'success',
          message: 'Application updated successfully!'
        });
        setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
      } else {
        setSaveStatus({
          type: 'error',
          message: `Failed to update: ${result.error}`
        });
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: 'Failed to save changes'
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      const result = await deletePassportRecord(id);
      if (result.success) {
        navigate('/applications');
      } else {
        alert('Failed to delete application');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading application details...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Application not found</div>
      </div>
    );
  }

  // Prepare extracted documents from stored data
  const extractedDocuments = [];
  if (application.full_name || application.passport_number) {
    extractedDocuments.push({
      id: 1,
      name: 'Document 1',
      fileName: application.source_file_name || 'Stored Data',
      data: {
        fullName: application.full_name,
        givenName: application.given_name,
        surname: application.surname,
        dateOfBirth: application.date_of_birth,
        gender: application.gender,
        nationality: application.nationality,
        passportNumber: application.passport_number,
        dateOfIssue: application.date_of_issue,
        dateOfExpiry: application.date_of_expiry,
        placeOfIssue: application.place_of_issue,
        placeOfBirth: application.place_of_birth,
        fatherName: application.father_name,
        motherName: application.mother_name,
        spouseName: application.spouse_name,
        address: application.address,
        pinCode: application.pin_code
      },
      timestamp: application.created_at
    });
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Application Details - {application.full_name || application.id}
              </h1>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {saveStatus.type && (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-3 rounded-md ${
            saveStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.message}
          </div>
        </div>
      )}

      {/* Main Content - Form Builder with Extracted Documents */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            <FileText className="inline-block h-5 w-5 mr-2" />
            Application Form with Extracted Documents
          </h2>

          {/* Form Builder Component */}
          <FormBuilder
            formData={formData}
            onSubmit={handleSave}
            initialData={application.form_data || {}}
            preloadedDocuments={extractedDocuments}
            isReadOnly={!isEditing}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailWithForm;