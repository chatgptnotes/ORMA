import React, { useState, useEffect } from 'react';
import { FormField } from '../types/formTypes';
import { extractPassportData, mapPassportToFormFields } from '../services/passportExtractor';
import { extractTextFromPDF } from '../services/pdfExtractor';
import ExtractedTextDisplay from './ExtractedTextDisplay';
import { savePassportData, formatPassportDataForSupabase, updatePassportData } from '../services/supabaseService';
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
  isAdmin?: boolean;
  preloadedDocuments?: any[];
  isReadOnly?: boolean;
  initialData?: Record<string, any>;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formData, onSubmit, initialValues = {}, isAdmin = false, preloadedDocuments = [], isReadOnly = false, initialData = {} }) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({...initialValues, ...initialData});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState<{ [key: string]: boolean }>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [uploadedFilesPreviews, setUploadedFilesPreviews] = useState<{ [key: string]: string }>({});
  const [uploadedFilesData, setUploadedFilesData] = useState<{ [key: string]: { file: File, preview: string, name: string, size: string } }>({});
  const [extractedText, setExtractedText] = useState<string>('');
  const [lastPDFName, setLastPDFName] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>(formData?.inputForm?.fields || []);
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [isEditingPassportData, setIsEditingPassportData] = useState(false);
  const [editedPassportData, setEditedPassportData] = useState<any>(null);

  // Create a consistent field key generation function
  const getFieldKey = (field: FormField, fieldIndex?: number) => {
    let key = field.label?.trim().replace(/\s+/g, '_') || field.type?.replace(/\s+/g, '_') || `field_${fieldIndex || 0}`;
    return key;
  };

  useEffect(() => {
    const newFields = formData?.inputForm?.fields || [];

    // Ensure organization fields are at the top
    // Find organization-related fields
    const orgFields = newFields.filter(field =>
      field.label === 'ORGANISATION' ||
      field.label === 'Apply For' ||
      field.label === 'Type' ||
      field.label === 'NORKA ID NUMER' ||
      field.label === 'KSHEMANIDHI ID NUMBER'
    );

    // Find upload fields
    const uploadFields = newFields.filter(field =>
      field.inputType === 'file'
    );

    // Find all other fields
    const otherFields = newFields.filter(field =>
      !orgFields.includes(field) && !uploadFields.includes(field)
    );

    // Reorder: Organization fields first, then upload fields, then others
    const reorderedFields = [...orgFields, ...uploadFields, ...otherFields];
    setFields(reorderedFields);

    // Initialize checkbox fields with empty arrays if not already set
    setFormValues(prev => {
      const updates: Record<string, any> = {};
      reorderedFields.forEach((field, index) => {
        const fieldKey = getFieldKey(field, index);

        if (field.inputType === 'checkbox' && !prev[fieldKey]) {
          updates[fieldKey] = [];
        }
      });

      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
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

  const handleChange = (fieldKey: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }
  };

  const handleCheckboxChange = (fieldKey: string, option: string, checked: boolean) => {
    const currentValues = Array.isArray(formValues[fieldKey]) ? formValues[fieldKey] : [];
    let newValues: string[];
    
    if (checked) {
      // Add option if not already present
      if (!currentValues.includes(option)) {
        newValues = [...currentValues, option];
      } else {
        newValues = currentValues;
      }
    } else {
      // Remove option
      newValues = currentValues.filter((v: string) => v !== option);
    }
    
    
    // Update form values immediately
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: newValues
    }));
    
    // Clear error when user interacts
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field, index) => {
      // Skip optional fields
      if (field.type.includes('optional')) return;
      
      const fieldKey = getFieldKey(field, index);
      const value = formValues[fieldKey];
      
      if (!value || (Array.isArray(value) && value.length === 0)) {
        if (field.inputType !== 'file') {
          newErrors[fieldKey] = `${field.label || field.type} is required`;
        }
      }
      
      // Email validation
      if (field.inputType === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[fieldKey] = 'Please enter a valid email address';
        }
      }
      
      // Phone validation
      if (field.inputType === 'tel' && value) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[fieldKey] = 'Please enter a valid phone number';
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

      // Store extracted data in the documents array
      const newDoc = {
        id: Date.now(),
        name: `Document ${extractedDocuments.length + 1}`,
        fileName: file.name,
        pageType,
        data: extractedData,
        timestamp: new Date().toISOString()
      };

      setExtractedDocuments(prev => {
        const updated = [...prev, newDoc];
        // Keep only last 6 documents
        if (updated.length > 6) {
          return updated.slice(-6);
        }
        return updated;
      });

      // Set as current extracted data for backward compatibility
      setExtractedPassportData(extractedData);

      // Switch to the new document tab
      setActiveDocumentTab(Math.min(extractedDocuments.length, 5));
      
      // Save extracted data to Supabase
      const supabaseData = formatPassportDataForSupabase(extractedData, file.name);
      const saveResult = await savePassportData(supabaseData);

      if (saveResult.success) {
        console.log('Data saved to Supabase successfully:', saveResult.data);
        setCurrentRecordId(saveResult.data?.id || null);
        setSupabaseSaveStatus({
          type: 'success',
          message: 'Data saved to database successfully!'
        });
        // Clear status after 3 seconds
        setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
      } else {
        console.error('Failed to save to Supabase:', saveResult.error);
        setSupabaseSaveStatus({
          type: 'error',
          message: `Failed to save: ${saveResult.error}`
        });
      }
      
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

  // Handler for editing passport data
  const handleEditPassportData = () => {
    setIsEditingPassportData(true);
    setEditedPassportData({ ...extractedPassportData });
  };

  // Handler for canceling edit
  const handleCancelEdit = () => {
    setIsEditingPassportData(false);
    setEditedPassportData(null);
  };

  // Handler for saving edited passport data
  const handleSavePassportData = async () => {
    if (!currentRecordId || !editedPassportData) return;

    try {
      // Format the data for Supabase
      const supabaseData = formatPassportDataForSupabase(editedPassportData);

      // Update in Supabase
      const updateResult = await updatePassportData(currentRecordId, supabaseData);

      if (updateResult.success) {
        // Update local state
        setExtractedPassportData(editedPassportData);
        setIsEditingPassportData(false);

        // Also update form values
        const mappedData = mapPassportToFormFields(editedPassportData, formValues);
        setFormValues(mappedData);

        // Show success message
        setSupabaseSaveStatus({
          type: 'success',
          message: 'Data updated successfully!'
        });
        setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
      } else {
        setSupabaseSaveStatus({
          type: 'error',
          message: `Failed to update: ${updateResult.error}`
        });
      }
    } catch (error) {
      console.error('Error saving passport data:', error);
      setSupabaseSaveStatus({
        type: 'error',
        message: 'Failed to save changes'
      });
    }
  };

  // Handler for updating edited passport field
  const handleEditFieldChange = (field: string, value: string) => {
    setEditedPassportData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save form data to local storage or backend
    localStorage.setItem('orma-form-data', JSON.stringify(formValues));
    alert('Form data saved successfully!');
  };

  const handlePrint = () => {
    // Create a printable version of the form
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <h1>ORMA Kshemanidhi Application Form</h1>
      <div style="margin: 20px 0;">
        ${Object.entries(formValues)
          .filter(([key, value]) => value && value !== '')
          .map(([key, value]) => `
            <div style="margin: 10px 0; border-bottom: 1px solid #eee; padding: 10px 0;">
              <strong>${key}:</strong> ${Array.isArray(value) ? value.join(', ') : String(value)}
            </div>
          `).join('')}
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ORMA Application Form</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              strong { color: #666; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file upload with preview
  const handleFileUpload = async (fieldKey: string, file: File) => {
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update form values
      handleChange(fieldKey, file.name);
      
      // Store file data with metadata
      setUploadedFilesData(prev => ({
        ...prev,
        [fieldKey]: {
          file: file,
          preview: previewUrl,
          name: file.name,
          size: formatFileSize(file.size)
        }
      }));

      // Legacy compatibility
      setUploadedFiles(prev => ({ ...prev, [fieldKey]: file }));
      setUploadedFilesPreviews(prev => ({ ...prev, [fieldKey]: previewUrl }));
      
      // Check if this is a passport field and extract data
      const field = fields.find(f => getFieldKey(f) === fieldKey);
      const isPassportField = field?.label?.toLowerCase().includes('passport') || 
                             field?.label?.toLowerCase().includes('Upload Passport') ||
                             fieldKey.toLowerCase().includes('passport');
      
      if (isPassportField) {
        console.log('Passport field detected, extracting data...');
        setIsExtracting({ ...isExtracting, [fieldKey]: true });
        setExtractionError(null);
        
        try {
          // If it's a PDF, also extract and display the text
          if (file.type === 'application/pdf') {
            const pdfText = await extractTextFromPDF(file);
            setExtractedText(pdfText);
            setLastPDFName(file.name);
          }
          
          const extractedData = await extractPassportData(file);
          console.log('Extracted passport data:', extractedData);

          // Store extracted data in the documents array for file uploads
          const newDoc = {
            id: Date.now(),
            name: `Document ${extractedDocuments.length + 1}`,
            fileName: file.name,
            pageType: 'file',
            data: extractedData,
            timestamp: new Date().toISOString()
          };

          setExtractedDocuments(prev => {
            const updated = [...prev, newDoc];
            // Keep only last 6 documents
            if (updated.length > 6) {
              return updated.slice(-6);
            }
            return updated;
          });

          // Set as current extracted data for backward compatibility
          setExtractedPassportData(extractedData);

          // Switch to the new document tab
          setActiveDocumentTab(Math.min(extractedDocuments.length, 5));
          
          // Save extracted data to Supabase (updated to include record ID tracking)
          const supabaseData = formatPassportDataForSupabase(extractedData, file.name);
          const saveResult = await savePassportData(supabaseData);

          if (saveResult.success) {
            console.log('Data saved to Supabase successfully:', saveResult.data);
            setCurrentRecordId(saveResult.data?.id || null);
            setSupabaseSaveStatus({
              type: 'success',
              message: 'Data saved to database successfully!'
            });
            setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
          } else {
            console.error('Failed to save to Supabase:', saveResult.error);
            setSupabaseSaveStatus({
              type: 'error',
              message: `Failed to save: ${saveResult.error}`
            });
          }
          
          // Initialize form structure with all field keys if not already done
          let currentFormValues = { ...formValues };
          console.log('Current form values before initialization:', currentFormValues);
          console.log('Fields count:', fields.length);
          
          // Always initialize to ensure we have all field keys
          fields.forEach((field, index) => {
            const key = getFieldKey(field, index);
            if (!currentFormValues.hasOwnProperty(key)) {
              currentFormValues[key] = '';
            }
          });
          console.log('Form values after initialization:', Object.keys(currentFormValues));
          
          const mappedData = mapPassportToFormFields(extractedData, currentFormValues);
          console.log('Mapped data to form fields:', mappedData);
          console.log('Sample mapped values:', {
            First_Name: mappedData['First_Name'],
            Last_Name: mappedData['Last_Name'],
            Permanent_Residence_Address: mappedData['Permanent_Residence_Address']
          });
          
          // TEST: Directly set some values to verify form works
          const testData = { ...currentFormValues };
          
          // Map extracted data directly to form fields
          if (extractedData.fatherName) {
            testData['Father/Guardian_Name'] = extractedData.fatherName;
            // Also try alternative field key patterns
            testData['Father_Guardian_Name'] = extractedData.fatherName;
          }
          if (extractedData.motherName) {
            testData['Mother_Name'] = extractedData.motherName;
          }
          if (extractedData.address) {
            testData['Permanent_Residence_Address'] = extractedData.address;
          }
          if (extractedData.fullName) {
            testData['Applicant_Full_Name_in_CAPITAL'] = extractedData.fullName;
          }
          if (extractedData.givenName && extractedData.givenName !== '[UNCLEAR]') {
            testData['First_Name'] = extractedData.givenName;
          } else if (extractedData.fullName) {
            // Try to extract first name from full name
            const nameParts = extractedData.fullName.split(' ');
            if (nameParts.length > 0) {
              testData['First_Name'] = nameParts[0];
            }
          }
          if (extractedData.surname && extractedData.surname !== '[UNCLEAR]') {
            testData['Last_Name'] = extractedData.surname;
          } else if (extractedData.fullName) {
            // Try to extract last name from full name
            const nameParts = extractedData.fullName.split(' ');
            if (nameParts.length > 1) {
              testData['Last_Name'] = nameParts[nameParts.length - 1];
            }
          }
          // Map more passport fields
          if (extractedData.passportNumber) {
            testData['Passport_Number'] = extractedData.passportNumber;
          }
          if (extractedData.dateOfBirth) {
            testData['Date_of_Birth'] = extractedData.dateOfBirth;
          }
          if (extractedData.dateOfIssue) {
            testData['Passport_Issue_Date'] = extractedData.dateOfIssue;
            testData['Date_of_Issue'] = extractedData.dateOfIssue;
          }
          if (extractedData.dateOfExpiry) {
            testData['Passport_Expiry_Date'] = extractedData.dateOfExpiry;
            testData['Date_of_Expiry'] = extractedData.dateOfExpiry;
          }
          if (extractedData.placeOfIssue) {
            testData['Passport_Issued_Place'] = extractedData.placeOfIssue;
            testData['Place_of_Issue'] = extractedData.placeOfIssue;
          }
          if (extractedData.spouseName) {
            testData['Spouse_Name'] = extractedData.spouseName;
          }
          
          console.log('Test data being set:', testData);
          
          // Force update the form values
          setFormValues(prevValues => {
            console.log('Previous form values:', prevValues);
            console.log('New form values being set:', testData);
            return testData;
          });
          setIsExtracting({ ...isExtracting, [fieldKey]: false });
        } catch (error) {
          console.error('Error extracting passport data:', error);
          setExtractionError(error instanceof Error ? error.message : 'Failed to extract data');
          setIsExtracting({ ...isExtracting, [fieldKey]: false });
        }
      }
    }
  };

  // Handle file deletion
  const handleFileDelete = (fieldKey: string) => {
    // Clean up object URL to prevent memory leaks
    if (uploadedFilesData[fieldKey]?.preview) {
      URL.revokeObjectURL(uploadedFilesData[fieldKey].preview);
    }

    // Remove from all states
    setUploadedFilesData(prev => {
      const newData = { ...prev };
      delete newData[fieldKey];
      return newData;
    });

    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldKey];
      return newFiles;
    });

    setUploadedFilesPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[fieldKey];
      return newPreviews;
    });

    // Clear form value
    handleChange(fieldKey, '');
  };


  const renderField = (field: FormField, fieldIndex?: number) => {
    const fieldKey = getFieldKey(field, fieldIndex);
    const value = formValues[fieldKey];
    
    // Debug logging for specific fields
    if (fieldKey === 'First_Name' || fieldKey === 'Last_Name' || fieldKey === 'Permanent_Residence_Address') {
      console.log(`Rendering field ${fieldKey}:`, {
        fieldLabel: field.label,
        fieldKey: fieldKey,
        value: value,
        formValues: formValues
      });
    }
    
    // Field validation
    if (!field.label || field.label.trim() === '') {
      // Skip fields with empty labels
      return null;
    }
    
    switch (field.inputType) {
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map(option => {
              const isChecked = value === option;
              return (
                <label key={option} className="radio-label">
                  <input
                    type="radio"
                    name={fieldKey}
                    value={option}
                    checked={isChecked}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        );
      
      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="checkbox-group">
            {field.options?.map(option => {
              const isChecked = checkboxValues.includes(option);
              return (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={option}
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(fieldKey, option, e.target.checked)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        );
      
      case 'select':
        return (
          <>
            <select
              className="form-select"
              value={value}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
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
                onChange={(e) => handleChange(`${fieldKey}_other`, e.target.value)}
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
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      case 'tel':
        return (
          <input
            type="tel"
            className="form-input"
            placeholder={field.comment || 'Enter phone number'}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            className="form-input"
            placeholder="Enter email address"
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      case 'file':
        const uploadedFileData = uploadedFilesData[fieldKey];
        return (
          <div className="file-upload-container">
            {!uploadedFileData ? (
              // Upload area when no file is uploaded
              <div className="file-upload-area">
                <input
                  type="file"
                  id={`file-${fieldKey}`}
                  className="file-input-hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(fieldKey, file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label htmlFor={`file-${fieldKey}`} className="file-upload-button">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <strong>Choose File</strong>
                    <small>PDF, JPG, PNG, DOC (Max 10MB)</small>
                  </div>
                </label>
              </div>
            ) : (
              // File preview and management area when file is uploaded
              <div className="file-preview-container">
                <div className="file-preview">
                  {uploadedFileData.file.type.startsWith('image/') ? (
                    <div className="image-preview">
                      <img 
                        src={uploadedFileData.preview} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '150px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e0e0e0'
                        }} 
                      />
                    </div>
                  ) : (
                    <div className="file-icon">
                      {uploadedFileData.file.type === 'application/pdf' ? '📄' : '📎'}
                    </div>
                  )}
                  
                  <div className="file-info">
                    <div className="file-name">{uploadedFileData.name}</div>
                    <div className="file-size">{uploadedFileData.size}</div>
                    <div className="file-status">✅ Upload successful</div>
                  </div>
                </div>
                
                <div className="file-actions">
                  <button
                    type="button"
                    onClick={() => window.open(uploadedFileData.preview, '_blank')}
                    className="file-action-btn view-btn"
                    title="View file"
                  >
                    👁️ View
                  </button>
                  
                  <input
                    type="file"
                    id={`replace-${fieldKey}`}
                    className="file-input-hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(fieldKey, file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor={`replace-${fieldKey}`} className="file-action-btn replace-btn" title="Replace file">
                    🔄 Replace
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => handleFileDelete(fieldKey)}
                    className="file-action-btn delete-btn"
                    title="Delete file"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'number':
        return (
          <input
            type="number"
            className="form-input"
            placeholder={field.comment || 'Enter number'}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      default:
        return (
          <input
            type="text"
            className="form-input"
            placeholder={field.comment || ''}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
    }
  };

  // Add state for multiple extracted documents
  const [extractedDocuments, setExtractedDocuments] = useState<any[]>(preloadedDocuments);
  const [activeDocumentTab, setActiveDocumentTab] = useState<number>(0);
  const [extractedPassportData, setExtractedPassportData] = useState<any>(
    preloadedDocuments.length > 0 ? preloadedDocuments[0].data : null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Function to copy and paste to a specific form field
  const copyToFormField = (value: string, targetFieldKey: string, sourceFieldName: string) => {
    // Update the form field value
    handleChange(targetFieldKey, value);

    // Copy to clipboard as well
    navigator.clipboard.writeText(value);

    // Show feedback
    setCopiedField(`${sourceFieldName}->${targetFieldKey}`);
    setShowFieldSelector(null);

    // Reset feedback after 2 seconds
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Get list of form fields for dropdown
  const getFormFieldOptions = () => {
    return fields.map((field, index) => ({
      key: getFieldKey(field, index),
      label: field.label || field.type || `Field ${index + 1}`,
      type: field.inputType
    })).filter(f => f.type !== 'file' && f.type !== 'checkbox');
  };

  // Component for copy/paste button with field selector (admin only)
  const CopyPasteButton = ({ value, fieldName, label }: { value: string; fieldName: string; label: string }) => {
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          if (showFieldSelector === fieldName) {
            setShowFieldSelector(null);
          }
        }
      };

      if (showFieldSelector === fieldName) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [showFieldSelector, fieldName]);

    // Only show copy/paste buttons for admin users
    if (!value || !isAdmin) return null;

    return (
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', marginLeft: '0.5rem' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(value, fieldName);
            setShowFieldSelector(showFieldSelector === fieldName ? null : fieldName);
          }}
          className="copy-btn"
          style={{
            padding: '0.25rem 0.5rem',
            background: copiedField?.includes(fieldName) ? '#10b981' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          title="Copy or paste to form field"
        >
          {copiedField?.includes(fieldName) ? '✓' : '📋'} {copiedField?.includes(fieldName) ? 'Copied' : 'Copy/Paste'}
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '0.5rem',
              borderBottom: '1px solid #e0e0e0',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#666'
            }}>
              Select field to paste "{label}":
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
                  padding: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#333',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ➤ {field.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper component for editable data fields
  const DataField = ({ label, field, value }: { label: string; field: string; value?: string }) => {
    if (!value && !isEditingPassportData) return null;

    return (
      <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <span className="data-label">{label}:</span>
          {isEditingPassportData ? (
            <input
              type="text"
              className="data-input"
              value={editedPassportData?.[field] || ''}
              onChange={(e) => handleEditFieldChange(field, e.target.value)}
            />
          ) : (
            <span className="data-value">{value}</span>
          )}
        </div>
        {!isEditingPassportData && value && (
          <button
            type="button"
            onClick={() => copyToClipboard(value, field)}
            className="copy-btn"
            style={{
              padding: '0.25rem 0.5rem',
              background: copiedField === field ? '#10b981' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              marginLeft: '0.5rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            title={copiedField === field ? 'Copied!' : `Copy ${label}`}
          >
            {copiedField === field ? '✓ Copied' : '📋 Copy'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="form-container-wrapper">
      {/* Left Sidebar - Extracted Data with Tabs */}
      {extractedDocuments.length > 0 && (
        <div className="extracted-data-sidebar">
          <div className="extracted-data-card">
            {/* Document Tabs */}
            <div className="document-tabs" style={{
              display: 'flex',
              borderBottom: '2px solid #e0e0e0',
              marginBottom: '1rem',
              overflowX: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '0.5rem 0.5rem 0 0.5rem',
              alignItems: 'center'
            }}>
              <div style={{
                marginRight: '0.5rem',
                padding: '0.5rem',
                color: '#666',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                📚 Documents ({extractedDocuments.length}/6):
              </div>
              {extractedDocuments.map((doc, index) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setActiveDocumentTab(index);
                    setExtractedPassportData(doc.data);
                    setIsEditingPassportData(false);
                  }}
                  className={`tab-button ${activeDocumentTab === index ? 'active' : ''}`}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: activeDocumentTab === index ? '#667eea' : 'white',
                    color: activeDocumentTab === index ? 'white' : '#666',
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    marginRight: '0.25rem',
                    fontWeight: activeDocumentTab === index ? 'bold' : 'normal',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    boxShadow: activeDocumentTab === index ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={doc.fileName}
                >
                  <span style={{ marginRight: '0.5rem' }}>📄</span>
                  {doc.name}
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Remove the document
                      setExtractedDocuments(prev => {
                        const updated = prev.filter((_, i) => i !== index);
                        // Adjust active tab if needed
                        if (activeDocumentTab >= updated.length && updated.length > 0) {
                          setActiveDocumentTab(updated.length - 1);
                          setExtractedPassportData(updated[updated.length - 1].data);
                        } else if (updated.length === 0) {
                          setExtractedPassportData(null);
                        } else if (activeDocumentTab === index && updated.length > 0) {
                          setActiveDocumentTab(0);
                          setExtractedPassportData(updated[0].data);
                        }
                        return updated;
                      });
                    }}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.1rem 0.3rem',
                      background: 'transparent',
                      color: activeDocumentTab === index ? 'white' : '#999',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      lineHeight: '1',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                    title="Remove document"
                  >
                    ×
                  </button>
                  {activeDocumentTab === index && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      background: '#667eea'
                    }}></span>
                  )}
                </button>
              ))}
            </div>
            <div className="card-header">
              <div>
                <h3>📋 {extractedDocuments[activeDocumentTab]?.name || 'Extracted Document Data'}</h3>
                <span className="card-subtitle" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  {extractedDocuments[activeDocumentTab]?.fileName || 'Auto-filled from uploaded documents'}
                </span>
              </div>
              <div className="card-actions">
                {!isEditingPassportData ? (
                  <button
                    className="edit-btn"
                    onClick={handleEditPassportData}
                    title="Edit extracted data"
                    type="button"
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  <>
                    <button
                      className="save-btn"
                      onClick={handleSavePassportData}
                      title="Save changes"
                      type="button"
                    >
                      💾 Save
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                      title="Cancel changes"
                      type="button"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Status Message */}
            {supabaseSaveStatus.type && (
              <div className={`status-message ${supabaseSaveStatus.type}`}>
                {supabaseSaveStatus.message}
              </div>
            )}
            <div className="card-body">
              {/* Display active document data */}
              {extractedDocuments[activeDocumentTab] && (() => {
                const currentData = extractedDocuments[activeDocumentTab].data;
                return (
                  <>
                    {/* Personal Information */}
                    {(currentData.fullName || currentData.givenName || currentData.surname) && (
                      <div className="data-section">
                  <h4>👤 Personal Information</h4>
                  {(currentData.fullName || isEditingPassportData) && (
                    <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span className="data-label">Full Name:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.fullName || ''}
                            onChange={(e) => handleEditFieldChange('fullName', e.target.value)}
                          />
                        ) : (
                          <span className="data-value">{currentData.fullName}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.fullName && (
                        <CopyPasteButton value={currentData.fullName} fieldName="fullName" label="Full Name" />
                      )}
                    </div>
                  )}
                  {(currentData.givenName || isEditingPassportData) && currentData.givenName !== '[UNCLEAR]' && (
                    <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span className="data-label">Given Name:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.givenName || ''}
                            onChange={(e) => handleEditFieldChange('givenName', e.target.value)}
                          />
                        ) : (
                          <span className="data-value">{currentData.givenName}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.givenName && (
                        <CopyPasteButton value={currentData.givenName} fieldName="givenName" label="Given Name" />
                      )}
                    </div>
                  )}
                  {(currentData.surname || isEditingPassportData) && currentData.surname !== '[UNCLEAR]' && (
                    <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span className="data-label">Surname:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.surname || ''}
                            onChange={(e) => handleEditFieldChange('surname', e.target.value)}
                          />
                        ) : (
                          <span className="data-value">{currentData.surname}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.surname && (
                        <CopyPasteButton value={currentData.surname} fieldName="surname" label="Surname" />
                      )}
                    </div>
                  )}
                  {(currentData.dateOfBirth || isEditingPassportData) && (
                    <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span className="data-label">Date of Birth:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.dateOfBirth || ''}
                            onChange={(e) => handleEditFieldChange('dateOfBirth', e.target.value)}
                          />
                        ) : (
                          <span className="data-value">{currentData.dateOfBirth}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.dateOfBirth && (
                        <CopyPasteButton value={currentData.dateOfBirth} fieldName="dateOfBirth" label="Date of Birth" />
                      )}
                    </div>
                  )}
                  {(currentData.gender || isEditingPassportData) && (
                    <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span className="data-label">Gender:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.gender || ''}
                            onChange={(e) => handleEditFieldChange('gender', e.target.value)}
                          />
                        ) : (
                          <span className="data-value">{currentData.gender}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.gender && (
                        <CopyPasteButton value={currentData.gender} fieldName="gender" label="Gender" />
                      )}
                    </div>
                  )}
                      </div>
                    )}

                    {/* Family Information */}
                    {(currentData.fatherName || currentData.motherName || currentData.spouseName) && (
                      <div className="data-section">
                        <h4>👨‍👩‍👧 Family Information</h4>
                        {currentData.fatherName && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Father's Name:</span>
                              <span className="data-value">{currentData.fatherName}</span>
                            </div>
                            <CopyPasteButton value={currentData.fatherName} fieldName="fatherName" label="Father's Name" />
                          </div>
                        )}
                        {currentData.motherName && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Mother's Name:</span>
                              <span className="data-value">{currentData.motherName}</span>
                            </div>
                            <CopyPasteButton value={currentData.motherName} fieldName="motherName" label="Mother's Name" />
                          </div>
                        )}
                        {currentData.spouseName && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Spouse Name:</span>
                              <span className="data-value">{currentData.spouseName}</span>
                            </div>
                            <CopyPasteButton value={currentData.spouseName} fieldName="spouseName" label="Spouse Name" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Passport Details */}
                    {(currentData.passportNumber || currentData.dateOfIssue || currentData.dateOfExpiry) && (
                      <div className="data-section">
                        <h4>📘 Passport Details</h4>
                        {currentData.passportNumber && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Passport No:</span>
                              <span className="data-value">{currentData.passportNumber}</span>
                            </div>
                            <CopyPasteButton value={currentData.passportNumber} fieldName="passportNumber" label="Passport Number" />
                          </div>
                        )}
                        {currentData.dateOfIssue && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Issue Date:</span>
                              <span className="data-value">{currentData.dateOfIssue}</span>
                            </div>
                            <CopyPasteButton value={currentData.dateOfIssue} fieldName="dateOfIssue" label="Issue Date" />
                          </div>
                        )}
                        {currentData.dateOfExpiry && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Expiry Date:</span>
                              <span className="data-value">{currentData.dateOfExpiry}</span>
                            </div>
                            <CopyPasteButton value={currentData.dateOfExpiry} fieldName="dateOfExpiry" label="Expiry Date" />
                          </div>
                        )}
                        {currentData.placeOfIssue && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Place of Issue:</span>
                              <span className="data-value">{currentData.placeOfIssue}</span>
                            </div>
                            <CopyPasteButton value={currentData.placeOfIssue} fieldName="placeOfIssue" label="Place of Issue" />
                          </div>
                        )}
                        {currentData.placeOfBirth && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">Place of Birth:</span>
                              <span className="data-value">{currentData.placeOfBirth}</span>
                            </div>
                            <CopyPasteButton value={currentData.placeOfBirth} fieldName="placeOfBirth" label="Place of Birth" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address Information */}
                    {currentData.address && (
                      <div className="data-section">
                        <h4>🏠 Address</h4>
                        <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <span className="data-label">Address:</span>
                            <span className="data-value">{currentData.address}</span>
                          </div>
                          <CopyPasteButton value={currentData.address} fieldName="address" label="Address" />
                        </div>
                        {currentData.pinCode && (
                          <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <span className="data-label">PIN Code:</span>
                              <span className="data-value">{currentData.pinCode}</span>
                            </div>
                            <CopyPasteButton value={currentData.pinCode} fieldName="pinCode" label="PIN Code" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Data */}
                    {currentData.nationality && (
                      <div className="data-section">
                        <h4>🌍 Other Details</h4>
                        <div className="data-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <span className="data-label">Nationality:</span>
                            <span className="data-value">{currentData.nationality}</span>
                          </div>
                          <CopyPasteButton value={currentData.nationality} fieldName="nationality" label="Nationality" />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Right Side - Main Form */}
      <div className="form-builder">
        <h2>{formData.inputForm?.title || 'ORMA Kshemanidhi Application Form'}</h2>

        {/* Organization Fields Section - Rendered First */}
        {fields && fields.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            {fields.filter(field =>
              field.label === 'ORGANISATION' ||
              field.label === 'Apply For' ||
              field.label === 'Type' ||
              field.label === 'NORKA ID NUMER' ||
              field.label === 'KSHEMANIDHI ID NUMBER'
            ).map((field, originalIndex) => {
              const index = fields.indexOf(field);
              return (
                <div key={index} className="form-field" style={{ position: 'relative', marginBottom: '1rem' }}>
                  {isAdmin && (
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
                  )}
                  <label className="form-label">
                    {field.label || field.type}
                    {!field.type?.includes('optional') && <span className="required">*</span>}
                  </label>
                  {field.type && field.type !== field.label && (
                    <small className="field-description">{field.type}</small>
                  )}
                  {renderField(field, index)}
                  {(() => {
                    const fieldKey = getFieldKey(field, index);
                    return errors[fieldKey] && (
                      <span className="error-message">{errors[fieldKey]}</span>
                    );
                  })()}
                  {field.comment && (
                    <small className="field-comment">{field.comment}</small>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Passport Upload Section - Rendered Second */}
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
        {/* Remaining Form Fields - Skip Organization Fields */}
        {fields && fields.length > 0 ? (
          fields.filter(field =>
            field.label !== 'ORGANISATION' &&
            field.label !== 'Apply For' &&
            field.label !== 'Type' &&
            field.label !== 'NORKA ID NUMER' &&
            field.label !== 'KSHEMANIDHI ID NUMBER'
          ).map((field, originalIndex) => {
            const index = fields.indexOf(field);
            return (
          <div key={index} className="form-field" style={{ position: 'relative' }}>
            {isAdmin && (
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
            )}
            <label className="form-label">
              {field.label || field.type}
              {!field.type.includes('optional') && <span className="required">*</span>}
            </label>
            {field.type && field.type !== field.label && (
              <small className="field-description">{field.type}</small>
            )}
            {renderField(field, index)}
            {(() => {
              const fieldKey = getFieldKey(field, index);
              return errors[fieldKey] && (
                <span className="error-message">{errors[fieldKey]}</span>
              );
            })()}
            {field.comment && (
              <small className="field-comment">{field.comment}</small>
            )}
          </div>
          );
        })
        ) : (
          <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>⚠️ No form fields available</h3>
            <p>Please check that the form data is loaded correctly.</p>
          </div>
        )}
        
        <div className="form-actions" style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          marginTop: '2rem',
          padding: '1rem'
        }}>
          <button 
            type="button" 
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.background = '#28a745'}
          >
            💾 Save Draft
          </button>
          
          <button 
            type="submit" 
            style={{
              padding: '0.75rem 1.5rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.background = '#007bff'}
          >
            📤 Submit Application
          </button>
          
          <button 
            type="button" 
            onClick={handlePrint}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#545b62'}
            onMouseOut={(e) => e.currentTarget.style.background = '#6c757d'}
          >
            🖨️ Print Form
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default FormBuilder;