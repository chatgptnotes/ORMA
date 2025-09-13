import React, { useState, useEffect } from 'react';
import { FormField } from '../types/formTypes';
import { extractPassportData, mapPassportToFormFields } from '../services/passportExtractor';
import './FormBuilder.css';

interface FormBuilderProps {
  formData: {
    title: string;
    fields: FormField[];
  };
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formData, onSubmit, initialValues = {} }) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

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

  const handlePassportUpload = async (file: File) => {
    setIsExtracting(true);
    setExtractionError(null);
    
    try {
      const extractedData = await extractPassportData(file);
      const mappedData = mapPassportToFormFields(extractedData, formValues);
      setFormValues(mappedData);
      setIsExtracting(false);
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract data');
      setIsExtracting(false);
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
          <select
            className="form-select"
            value={value}
            onChange={(e) => handleChange(field.label, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
            {field.options?.includes('OTHERs') && value === 'OTHERs' && (
              <input
                type="text"
                placeholder="Please specify"
                className="form-input other-input"
                onChange={(e) => handleChange(`${field.label}_other`, e.target.value)}
              />
            )}
          </select>
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
          <p>Upload a passport or ID document to automatically fill the form</p>
        </div>
        
        <div className="upload-area">
          <input
            type="file"
            id="passport-upload"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handlePassportUpload(file);
              }
            }}
            disabled={isExtracting}
            style={{ display: 'none' }}
          />
          <label htmlFor="passport-upload" className={`upload-button ${isExtracting ? 'disabled' : ''}`}>
            {isExtracting ? (
              <>
                <span className="spinner"></span>
                Extracting data...
              </>
            ) : (
              <>
                📄 Upload Document
              </>
            )}
          </label>
        </div>
        
        {extractionError && (
          <div className="extraction-error">
            ⚠️ {extractionError}
          </div>
        )}
        
        {!isExtracting && !extractionError && formValues.fullName && (
          <div className="extraction-success">
            ✅ Document data extracted successfully!
          </div>
        )}
      </div>
      
      <hr className="divider" />
      
      <form onSubmit={handleSubmit}>
        {formData.fields.map((field, index) => (
          <div key={index} className="form-field">
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
        ))}
        
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