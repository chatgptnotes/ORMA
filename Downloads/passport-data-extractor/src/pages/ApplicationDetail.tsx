import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Download, User, Calendar, MapPin, FileText, Save, X } from 'lucide-react';
import { getPassportRecord, updatePassportData, deletePassportRecord } from '../services/supabaseService';
import FormBuilder from '../components/FormBuilder';
import formData from '../data/processedFormData.json';
import '../components/FormBuilder.css';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [showForm, setShowForm] = useState(true);
  const [extractedDocuments, setExtractedDocuments] = useState<any[]>([]);
  const [activeDocumentTab, setActiveDocumentTab] = useState<number>(0);

  useEffect(() => {
    if (id) {
      fetchApplication(id);
    }
  }, [id]);

  const fetchApplication = async (applicationId: string) => {
    try {
      console.log('Fetching application with ID:', applicationId);
      const result = await getPassportRecord(applicationId);
      console.log('Fetch result:', result);

      if (result.success && result.data) {
        console.log('Application data received:', result.data);
        setApplication(result.data);
        setEditedData(result.data);

        // If there's form_data stored, create document tabs from it
        if (result.data.form_data) {
          const doc = {
            id: Date.now(),
            name: 'Stored Application Data',
            fileName: result.data.source_file_name || 'Application Data',
            data: result.data.form_data,
            timestamp: result.data.created_at
          };
          setExtractedDocuments([doc]);
        }
      } else {
        console.error('Application not found or error:', result.error);
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
    setEditedData({ ...application });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(application);
    setSaveStatus({ type: null, message: '' });
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const result = await updatePassportData(id, editedData);
      if (result.success) {
        setApplication(editedData);
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

  const handleFieldChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Application Details</h1>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-md ${
            saveStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <h3 className="text-lg leading-6 font-medium flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {[
                    { label: 'Full Name', field: 'full_name' },
                    { label: 'Given Name', field: 'given_name' },
                    { label: 'Surname', field: 'surname' },
                    { label: 'Date of Birth', field: 'date_of_birth' },
                    { label: 'Gender', field: 'gender' },
                    { label: 'Nationality', field: 'nationality' },
                    { label: 'Place of Birth', field: 'place_of_birth' },
                  ].map((item, index) => (
                    <div key={item.field} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedData[item.field] || ''}
                              onChange={(e) => handleFieldChange(item.field, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            application[item.field] || 'N/A'
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Passport Details */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <h3 className="text-lg leading-6 font-medium flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Passport Details
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {[
                    { label: 'Passport Number', field: 'passport_number' },
                    { label: 'Date of Issue', field: 'date_of_issue' },
                    { label: 'Date of Expiry', field: 'date_of_expiry' },
                    { label: 'Place of Issue', field: 'place_of_issue' },
                  ].map((item, index) => (
                    <div key={item.field} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedData[item.field] || ''}
                              onChange={(e) => handleFieldChange(item.field, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            application[item.field] || 'N/A'
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Family Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <h3 className="text-lg leading-6 font-medium flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Family Information
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {[
                    { label: "Father's Name", field: 'father_name' },
                    { label: "Mother's Name", field: 'mother_name' },
                    { label: "Spouse's Name", field: 'spouse_name' },
                  ].map((item, index) => (
                    <div key={item.field} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedData[item.field] || ''}
                              onChange={(e) => handleFieldChange(item.field, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            application[item.field] || 'N/A'
                          )}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <h3 className="text-lg leading-6 font-medium flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <textarea
                          value={editedData.address || ''}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        application.address || 'N/A'
                      )}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">PIN Code</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.pin_code || ''}
                          onChange={(e) => handleFieldChange('pin_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      ) : (
                        application.pin_code || 'N/A'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Additional Extracted Data (if available in form_data) */}
            {application.form_data && Object.keys(application.form_data).length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                  <h3 className="text-lg leading-6 font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    All Extracted Data
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    {Object.entries(application.form_data).map(([key, value], index) => (
                      <div key={key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {value as string || 'N/A'}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Metadata */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
                <h3 className="text-lg leading-6 font-medium flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Application Metadata
                </h3>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5">
                    <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                    <dd className="mt-1 text-xs text-gray-900 font-mono">{application.id}</dd>
                  </div>
                  <div className="bg-white px-4 py-5">
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(application.created_at)}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5">
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(application.updated_at)}</dd>
                  </div>
                  <div className="bg-white px-4 py-5">
                    <dt className="text-sm font-medium text-gray-500">Source File</dt>
                    <dd className="mt-1 text-sm text-gray-900">{application.source_file_name || 'N/A'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5">
                    <dt className="text-sm font-medium text-gray-500">Extraction Confidence</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {application.extraction_confidence ?
                        `${(application.extraction_confidence * 100).toFixed(1)}%` :
                        'N/A'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 space-y-3">
                <Link
                  to="/apply"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Application
                </Link>
                <Link
                  to="/applications"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All Applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;