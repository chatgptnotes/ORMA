import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Save, X } from 'lucide-react';
import { getPassportRecord, updatePassportData, deletePassportRecord } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import formData from '../data/processedFormData.json';
import '../components/FormBuilder.css';
import './ApplicationDetailSplit.css';

const ApplicationDetailSplit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [extractedDocuments, setExtractedDocuments] = useState<any[]>([]);
  const [activeDocumentTab, setActiveDocumentTab] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const fields = formData?.inputForm?.fields || [];

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

        // Initialize form values from stored data
        setFormValues(result.data.form_data || {});

        // Create document tabs from stored passport data
        const docs = [];
        if (result.data.full_name || result.data.passport_number) {
          docs.push({
            id: 1,
            name: 'Document 1',
            fileName: result.data.source_file_name || 'Stored Data',
            data: {
              fullName: result.data.full_name,
              givenName: result.data.given_name,
              surname: result.data.surname,
              dateOfBirth: result.data.date_of_birth,
              gender: result.data.gender,
              nationality: result.data.nationality,
              passportNumber: result.data.passport_number,
              dateOfIssue: result.data.date_of_issue,
              dateOfExpiry: result.data.date_of_expiry,
              placeOfIssue: result.data.place_of_issue,
              placeOfBirth: result.data.place_of_birth,
              fatherName: result.data.father_name,
              motherName: result.data.mother_name,
              spouseName: result.data.spouse_name,
              address: result.data.address,
              pinCode: result.data.pin_code
            },
            timestamp: result.data.created_at
          });
        }
        setExtractedDocuments(docs);
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

  const handleSave = async () => {
    if (!id) return;

    try {
      const updatedData = {
        ...application,
        form_data: formValues,
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

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyToFormField = (value: string, targetFieldKey: string, sourceFieldName: string) => {
    setFormValues(prev => ({
      ...prev,
      [targetFieldKey]: value
    }));

    navigator.clipboard.writeText(value);
    setCopiedField(`${sourceFieldName}->${targetFieldKey}`);
    setShowFieldSelector(null);

    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFieldKey = (field: any, index: number) => {
    return field.label || field.type || `field_${index}`;
  };

  const getFormFieldOptions = () => {
    return fields.map((field, index) => ({
      key: getFieldKey(field, index),
      label: field.label || field.type || `Field ${index + 1}`,
      type: field.inputType
    })).filter(f => f.type !== 'file' && f.type !== 'checkbox');
  };

  const CopyPasteButton = ({ value, fieldName, label }: { value: string; fieldName: string; label: string }) => {
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          if (showFieldSelector === fieldName) {
            setShowFieldSelector(null);
          }
        }
      };

      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && showFieldSelector === fieldName) {
          setShowFieldSelector(null);
        }
      };

      if (showFieldSelector === fieldName) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscapeKey);
        };
      }
    }, [showFieldSelector, fieldName]);

    // Only show copy/paste buttons for admin users
    if (!value || !isAdmin) return null;

    return (
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(value, fieldName);
            setShowFieldSelector(showFieldSelector === fieldName ? null : fieldName);
          }}
          className="copy-btn"
          style={{
            padding: '0.2rem 0.4rem',
            background: copiedField?.includes(fieldName) ? '#10b981' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          title="Copy or paste to form field"
        >
          {copiedField?.includes(fieldName) ? '✓' : '📋'}
        </button>
        {showFieldSelector === fieldName && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '0.4rem',
              borderBottom: '1px solid #e0e0e0',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              color: '#666',
              background: '#f8f9fa'
            }}>
              Paste to field:
            </div>
            {getFormFieldOptions().map(field => (
              <button
                key={field.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToFormField(value, field.key, fieldName);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.4rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#333',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                → {field.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
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

  const currentDocument = extractedDocuments[activeDocumentTab];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-3">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">
                Application Details - {application.full_name || application.id}
              </h1>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
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
                    onClick={handleSave}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
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
        <div className="px-4 pt-2">
          <div className={`p-2 rounded-md text-sm ${
            saveStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus.message}
          </div>
        </div>
      )}

      {/* Split Layout */}
      <div className="split-container">
        {/* Left Side - Extracted Documents */}
        <div className="left-panel">
          {extractedDocuments.length > 0 && (
            <div className="extracted-data-panel">
              {/* Document Tabs */}
              <div className="document-tabs">
                <span className="tabs-label">📚 Documents ({extractedDocuments.length}/6):</span>
                {extractedDocuments.map((doc, index) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveDocumentTab(index)}
                    className={`tab-button ${activeDocumentTab === index ? 'active' : ''}`}
                  >
                    📄 {doc.name}
                  </button>
                ))}
              </div>

              {/* Current Document Data */}
              {currentDocument && (
                <div className="document-content">
                  <div className="document-header">
                    <h3>{currentDocument.name}</h3>
                    <span className="file-name">{currentDocument.fileName}</span>
                  </div>

                  {/* Personal Information */}
                  {(currentDocument.data.fullName || currentDocument.data.givenName || currentDocument.data.surname) && (
                    <div className="data-section">
                      <h4>👤 Personal Information</h4>
                      {currentDocument.data.fullName && (
                        <div className="data-item">
                          <span className="data-label">Full Name:</span>
                          <span className="data-value">{currentDocument.data.fullName}</span>
                          <CopyPasteButton value={currentDocument.data.fullName} fieldName="fullName" label="Full Name" />
                        </div>
                      )}
                      {currentDocument.data.givenName && (
                        <div className="data-item">
                          <span className="data-label">Given Name:</span>
                          <span className="data-value">{currentDocument.data.givenName}</span>
                          <CopyPasteButton value={currentDocument.data.givenName} fieldName="givenName" label="Given Name" />
                        </div>
                      )}
                      {currentDocument.data.surname && (
                        <div className="data-item">
                          <span className="data-label">Surname:</span>
                          <span className="data-value">{currentDocument.data.surname}</span>
                          <CopyPasteButton value={currentDocument.data.surname} fieldName="surname" label="Surname" />
                        </div>
                      )}
                      {currentDocument.data.dateOfBirth && (
                        <div className="data-item">
                          <span className="data-label">Date of Birth:</span>
                          <span className="data-value">{currentDocument.data.dateOfBirth}</span>
                          <CopyPasteButton value={currentDocument.data.dateOfBirth} fieldName="dateOfBirth" label="Date of Birth" />
                        </div>
                      )}
                      {currentDocument.data.gender && (
                        <div className="data-item">
                          <span className="data-label">Gender:</span>
                          <span className="data-value">{currentDocument.data.gender}</span>
                          <CopyPasteButton value={currentDocument.data.gender} fieldName="gender" label="Gender" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Passport Details */}
                  {(currentDocument.data.passportNumber || currentDocument.data.dateOfIssue) && (
                    <div className="data-section">
                      <h4>📘 Passport Details</h4>
                      {currentDocument.data.passportNumber && (
                        <div className="data-item">
                          <span className="data-label">Passport No:</span>
                          <span className="data-value">{currentDocument.data.passportNumber}</span>
                          <CopyPasteButton value={currentDocument.data.passportNumber} fieldName="passportNumber" label="Passport Number" />
                        </div>
                      )}
                      {currentDocument.data.dateOfIssue && (
                        <div className="data-item">
                          <span className="data-label">Issue Date:</span>
                          <span className="data-value">{currentDocument.data.dateOfIssue}</span>
                          <CopyPasteButton value={currentDocument.data.dateOfIssue} fieldName="dateOfIssue" label="Issue Date" />
                        </div>
                      )}
                      {currentDocument.data.dateOfExpiry && (
                        <div className="data-item">
                          <span className="data-label">Expiry Date:</span>
                          <span className="data-value">{currentDocument.data.dateOfExpiry}</span>
                          <CopyPasteButton value={currentDocument.data.dateOfExpiry} fieldName="dateOfExpiry" label="Expiry Date" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Form */}
        <div className="right-panel">
          <div className="form-panel">
            <h2 className="form-title">SUBMISSION FORM</h2>

            <form className="application-form">
              {fields.map((field, index) => {
                const fieldKey = getFieldKey(field, index);
                const value = formValues[fieldKey] || '';

                return (
                  <div key={index} className="form-field">
                    <label className="form-label">
                      {field.label || field.type}
                      {'required' in field && field.required && <span className="required">*</span>}
                    </label>

                    {field.inputType === 'select' ? (
                      <select
                        className="form-select"
                        value={value}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        disabled={!isEditing}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.inputType === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        value={value}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        disabled={!isEditing}
                        rows={3}
                      />
                    ) : field.inputType === 'file' ? (
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          className="form-input"
                          disabled={!isEditing}
                        />
                      </div>
                    ) : (
                      <input
                        type={field.inputType || 'text'}
                        className="form-input"
                        value={value}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        disabled={!isEditing}
                        placeholder={field.comment || ''}
                      />
                    )}

                    {field.comment && (
                      <small className="field-comment">{field.comment}</small>
                    )}
                  </div>
                );
              })}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailSplit;