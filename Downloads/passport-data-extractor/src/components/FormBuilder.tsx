import React, { useState, useEffect } from 'react';
import { FormField } from '../types/formTypes';
import { extractPassportData, mapPassportToFormFields } from '../services/passportExtractor';
import { extractTextFromPDF } from '../services/pdfExtractor';
import ExtractedTextDisplay from './ExtractedTextDisplay';
import './FormBuilder.css';

interface FormBuilderProps {
  formData: {
    inputForm?: {
      title?: string;
      fields: FormField[];
    };
  };
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formData, onSubmit, initialValues = {} }) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState<{ [key: string]: boolean }>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [extractedText, setExtractedText] = useState<string>('');
  const [lastPDFName, setLastPDFName] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>(formData?.inputForm?.fields || []);
  
  // Debug logging
  console.log('FormBuilder received formData:', formData);
  console.log('Fields available:', formData?.inputForm?.fields);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    setFields(formData?.inputForm?.fields || []);
  }, [formData]);

  const moveFieldUp = (index: number) => {
    if (index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    }
  };

  const moveFieldDown = (index: number) => {
    if (index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      setFields(newFields);
    }
  };

  const handleChange = (fieldLabel: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
    // Clear error when user starts typing
    if (errors[fieldLabel]) {
      setErrors(prev => ({
        ...prev,
        [fieldLabel]: ''
      }));
    }
  };

  const handleCheckboxChange = (fieldLabel: string, option: string, checked: boolean) => {
    const currentValues = formValues[fieldLabel] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter((v: string) => v !== option);
    }
    
    handleChange(fieldLabel, newValues);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    formData.fields.forEach(field => {
      // Skip optional fields
      if (field.type.includes('optional')) return;
      
      const value = formValues[field.label];
      
      if (!value || (Array.isArray(value) && value.length === 0)) {
        if (field.inputType !== 'file') {
          newErrors[field.label] = `${field.label} is required`;
        }
      }
      
      // Email validation
      if (field.inputType === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.label] = 'Please enter a valid email address';
        }
      }
      
      // Phone validation
      if (field.inputType === 'tel' && value) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.label] = 'Please enter a valid phone number';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePassportUpload = async (file: File, pageType: string) => {
    setIsExtracting({ ...isExtracting, [pageType]: true });
    setExtractionError(null);
    setUploadedFiles({ ...uploadedFiles, [pageType]: file });
    
    try {
      // If it's a PDF, also extract and display the text
      if (file.type === 'application/pdf') {
        const pdfText = await extractTextFromPDF(file);
        setExtractedText(pdfText);
        setLastPDFName(file.name);
      }
      
      const extractedData = await extractPassportData(file);
      const mappedData = mapPassportToFormFields(extractedData, formValues);
      setFormValues(mappedData);
      setIsExtracting({ ...isExtracting, [pageType]: false });
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract data');
      setIsExtracting({ ...isExtracting, [pageType]: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formValues);
    }
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.label] || '';
    
    switch (field.inputType) {
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map(option => (
              <label key={option} className="radio-label">
                <input
                  type="radio"
                  name={field.label}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(field.label, e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="checkbox-group">
            {field.options?.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => handleCheckboxChange(field.label, option, e.target.checked)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'select':
        return (
          <>
            <select
              className="form-select"
              value={value}
              onChange={(e) => handleChange(field.label, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {field.options?.includes('OTHERs') && value === 'OTHERs' && (
              <input
                type="text"
                placeholder="Please specify"
                className="form-input other-input"
                style={{ marginTop: '0.5rem' }}
                onChange={(e) => handleChange(`${field.label}_other`, e.target.value)}
              />
            )}
          </>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="form-input"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
          />
        );
      
      case 'tel':
        return (
          <input
            type="tel"
            className="form-input"
            placeholder={field.comment || 'Enter phone number'}
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            className="form-input"
            placeholder="Enter email address"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
          />
        );
      
      case 'file':
        return (
          <input
            type="file"
            className="form-input"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleChange(field.label, file.name);
              }
            }}
          />
        );
      
      default:
        return (
          <input
            type="text"
            className="form-input"
            placeholder={field.comment || ''}
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="form-builder">
      <h2>{formData.title}</h2>
      
      {/* Passport Upload Section */}
      <div className="passport-upload-section">
        <div className="upload-header">
          <h3>Quick Fill from Document</h3>
          <p>Upload passport pages or ID documents to automatically fill the form</p>
        </div>
        
        <div className="upload-grid">
          {/* Front Page Upload */}
          <div className="upload-card">
            <h4>📘 Front Page</h4>
            <p>Main page with photo & details</p>
            <input
              type="file"
              id="passport-front"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePassportUpload(file, 'front');
                }
              }}
              disabled={isExtracting.front}
              style={{ display: 'none' }}
            />
            <label htmlFor="passport-front" className={`upload-btn ${isExtracting.front ? 'disabled' : ''} ${uploadedFiles.front ? 'uploaded' : ''}`}>
              {isExtracting.front ? (
                <>
                  <span className="spinner"></span>
                  Extracting...
                </>
              ) : uploadedFiles.front ? (
                <>✅ {uploadedFiles.front.name}</>
              ) : (
                <>📷 Upload Front</>
              )}
            </label>
          </div>

          {/* Back Page Upload */}
          <div className="upload-card">
            <h4>📗 Back Page</h4>
            <p>Address & additional info</p>
            <input
              type="file"
              id="passport-back"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePassportUpload(file, 'back');
                }
              }}
              disabled={isExtracting.back}
              style={{ display: 'none' }}
            />
            <label htmlFor="passport-back" className={`upload-btn ${isExtracting.back ? 'disabled' : ''} ${uploadedFiles.back ? 'uploaded' : ''}`}>
              {isExtracting.back ? (
                <>
                  <span className="spinner"></span>
                  Extracting...
                </>
              ) : uploadedFiles.back ? (
                <>✅ {uploadedFiles.back.name}</>
              ) : (
                <>📷 Upload Back</>
              )}
            </label>
          </div>

          {/* Visa/Stamp Page Upload */}
          <div className="upload-card">
            <h4>📙 Visa/Stamps</h4>
            <p>Visa or entry stamps page</p>
            <input
              type="file"
              id="passport-visa"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePassportUpload(file, 'visa');
                }
              }}
              disabled={isExtracting.visa}
              style={{ display: 'none' }}
            />
            <label htmlFor="passport-visa" className={`upload-btn ${isExtracting.visa ? 'disabled' : ''} ${uploadedFiles.visa ? 'uploaded' : ''}`}>
              {isExtracting.visa ? (
                <>
                  <span className="spinner"></span>
                  Extracting...
                </>
              ) : uploadedFiles.visa ? (
                <>✅ {uploadedFiles.visa.name}</>
              ) : (
                <>📷 Upload Visa</>
              )}
            </label>
          </div>

          {/* Other Documents */}
          <div className="upload-card">
            <h4>📄 Other Docs</h4>
            <p>ID card, license, etc.</p>
            <input
              type="file"
              id="passport-other"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePassportUpload(file, 'other');
                }
              }}
              disabled={isExtracting.other}
              style={{ display: 'none' }}
            />
            <label htmlFor="passport-other" className={`upload-btn ${isExtracting.other ? 'disabled' : ''} ${uploadedFiles.other ? 'uploaded' : ''}`}>
              {isExtracting.other ? (
                <>
                  <span className="spinner"></span>
                  Extracting...
                </>
              ) : uploadedFiles.other ? (
                <>✅ {uploadedFiles.other.name}</>
              ) : (
                <>📷 Upload Other</>
              )}
            </label>
          </div>
        </div>
        
        <div className="upload-hint">
          Supports: JPG, PNG, WebP, PDF • Max 10MB per file
        </div>
        
        {extractionError && (
          <div className="extraction-error">
            ⚠️ {extractionError}
          </div>
        )}
        
        {Object.keys(uploadedFiles).length > 0 && !extractionError && (
          <div className="extraction-success">
            ✅ {Object.keys(uploadedFiles).length} document(s) processed successfully!
          </div>
        )}
      </div>
      
      {/* Display extracted passport data */}
      {Object.keys(formValues).filter(key => formValues[key] && formValues[key] !== '').length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '2rem 0',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'white' }}>
            📋 Extracted Passport Data
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '8px'
          }}>
            {Object.entries(formValues)
              .filter(([key, value]) => value && value !== '')
              .map(([key, value]) => (
                <div key={key} style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px'
                }}>
                  <span style={{ fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {key}:
                  </span>{' '}
                  <span style={{ color: 'white' }}>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
            ))}
          </div>
        </div>
      )}
      
      <hr className="divider" />
      
      {/* Display extracted text from PDF */}
      {extractedText && (
        <ExtractedTextDisplay text={extractedText} fileName={lastPDFName} />
      )}
      
      <form onSubmit={handleSubmit}>
        {fields && fields.length > 0 ? (
          fields.map((field, index) => (
          <div key={index} className="form-field" style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              right: '0', 
              top: '0',
              display: 'flex',
              gap: '0.25rem'
            }}>
              <button
                type="button"
                onClick={() => moveFieldUp(index)}
                disabled={index === 0}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: index === 0 ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveFieldDown(index)}
                disabled={index === fields.length - 1}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: index === fields.length - 1 ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
                title="Move down"
              >
                ↓
              </button>
            </div>
            <label className="form-label">
              {field.label}
              {!field.type.includes('optional') && <span className="required">*</span>}
            </label>
            {field.type && field.type !== field.label && (
              <small className="field-description">{field.type}</small>
            )}
            {renderField(field)}
            {errors[field.label] && (
              <span className="error-message">{errors[field.label]}</span>
            )}
            {field.comment && (
              <small className="field-comment">{field.comment}</small>
            )}
          </div>
        ))
        ) : (
          <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>⚠️ No form fields available</h3>
            <p>Please check that the form data is loaded correctly.</p>
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Preview & Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder;