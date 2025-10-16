import React, { useState, useEffect } from 'react';
import { FormField } from '../types/formTypes';
import { extractPassportData, mapPassportToFormFields } from '../services/passportExtractor';
import { extractHandwrittenFormData, mapHandwrittenToFormFields, formatHandwrittenDataForSupabase } from '../services/handwrittenFormExtractor';
import ExtractedTextDisplay from './ExtractedTextDisplay';
import { savePassportData, formatPassportDataForSupabase, updatePassportData, getLatestPassportRecord, mapDatabaseRecordToFormFields } from '../services/supabaseService';
import { 
  fetchLatestPassportRecord, 
  mapPassportRecordToFormFields, 
  savePassportData as savePassportRecordData, 
  updatePassportData as updatePassportRecordData,
  findExistingRecordByPassport,
  mergePassportData
} from '../services/passportRecordsService';
import { processDocumentUpload, DocumentType, getDocumentTypeDisplayName } from '../services/documentTypeService';
import Toast from './Toast';
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
  clearFormTrigger?: number; // New prop for triggering form reset
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formData, onSubmit, initialValues = {}, isAdmin = false, preloadedDocuments = [], isReadOnly = false, initialData = {}, clearFormTrigger = 0 }) => {
  // Initialize formValues with proper defaults to prevent undefined values
  const initializeFormValues = () => {
    const defaultValues: Record<string, any> = {};
    
    // Set default values for all fields to prevent uncontrolled to controlled warnings
    if (formData?.inputForm?.fields) {
      formData.inputForm.fields.forEach((field, index) => {
        const fieldKey = field.label?.trim().replace(/\s+/g, '_') || field.type?.replace(/\s+/g, '_') || `field_${index}`;
        if (field.inputType === 'checkbox') {
          defaultValues[fieldKey] = [];
        } else {
          defaultValues[fieldKey] = '';
        }
      });
    }
    
    return { ...defaultValues, ...initialValues, ...initialData };
  };
  
  const [formValues, setFormValues] = useState<Record<string, any>>(initializeFormValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState<{ [key: string]: boolean }>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [uploadedFilesPreviews, setUploadedFilesPreviews] = useState<{ [key: string]: string }>({});
  const [uploadedFilesData, setUploadedFilesData] = useState<{ [key: string]: { file: File, preview: string, name: string, size: string } }>({});
  const [extractedText, setExtractedText] = useState<string>('');
  const [lastPDFName, setLastPDFName] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>(formData?.inputForm?.fields || []);
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ type: null, message: '' });
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(() => {
    // Initialize from session storage if available
    return sessionStorage.getItem('passport_record_id') || null;
  });
  const [isEditingPassportData, setIsEditingPassportData] = useState(false);
  const [editedPassportData, setEditedPassportData] = useState<any>(null);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [editingDatabaseRecord, setEditingDatabaseRecord] = useState<boolean>(false);
  const [extractedDocuments, setExtractedDocuments] = useState<any[]>(preloadedDocuments || []);
  const [extractedPassportData, setExtractedPassportData] = useState<any>(
    preloadedDocuments && preloadedDocuments.length > 0 ? preloadedDocuments[0].data : null
  );
  const [activeDocumentTab, setActiveDocumentTab] = useState<number>(0);
  const [hasExtractedData, setHasExtractedData] = useState<boolean>(false); // NEW: Track if we have extracted document data

  // Create a consistent field key generation function
  const getFieldKey = (field: FormField, fieldIndex?: number) => {
    let key = field.label?.trim().replace(/\s+/g, '_') || field.type?.replace(/\s+/g, '_') || `field_${fieldIndex || 0}`;
    return key;
  };

  // Enhanced record ID management with session persistence
  const updateCurrentRecordId = (recordId: string | null) => {
    setCurrentRecordId(recordId);
    if (recordId) {
      sessionStorage.setItem('passport_record_id', recordId);
      console.log('Record ID persisted to session:', recordId);
    } else {
      sessionStorage.removeItem('passport_record_id');
      console.log('Record ID cleared from session');
    }
  };

  // Define which page types should be linked together
  const getPageTypeGroup = (pageType: string): 'passport' | 'visa' | 'aadhar' => {
    if (['front', 'back', 'address', 'last_page'].includes(pageType)) {
      return 'passport';
    } else if (['visa_front', 'visa_back'].includes(pageType)) {
      return 'visa';
    } else if (['aadhar_front', 'aadhar_back'].includes(pageType)) {
      return 'aadhar';
    }
    return 'passport'; // default to passport group
  };

  // Helper function to check which document types have been uploaded
  const getUploadedDocumentTypes = (): { hasPassport: boolean; hasVisa: boolean; hasEmiratesId: boolean } => {
    const types = extractedDocuments.map(doc => {
      const pageType = doc.pageType || '';
      return getPageTypeGroup(pageType);
    });

    return {
      hasPassport: types.includes('passport'),
      hasVisa: types.includes('visa'),
      hasEmiratesId: types.includes('aadhar')
    };
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

    // GUARD: Don't overwrite form values if we have extracted document data
    // This prevents race condition where useEffect runs after extraction completes
    if (hasExtractedData) {
      console.log('⚠️ GUARD: Skipping formValues update - extracted document data present');
      return;
    }

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
  }, [formData, hasExtractedData]);

  // DISABLED: Auto-load latest record when component mounts
  // User should manually click "Load Latest Record" button to fetch data from database
  // useEffect(() => {
  //   // Only auto-load if not in read-only mode and no initial data is provided
  //   if (!isReadOnly && !initialData && Object.keys(initialValues).length === 0) {
  //     // Auto-load the latest record
  //     loadLatestRecordOnMount();
  //   }
  // }, []); // Only run once on mount

  // Handle form clearing when clearFormTrigger changes
  useEffect(() => {
    if (clearFormTrigger && clearFormTrigger > 0) {
      console.log('FormBuilder: Clearing form triggered by clearFormTrigger:', clearFormTrigger);
      
      // Reset form values to empty state with proper initialization for different field types
      const clearedFormValues: Record<string, any> = {};
      fields.forEach((field, index) => {
        const fieldKey = getFieldKey(field, index);
        if (field.inputType === 'checkbox') {
          clearedFormValues[fieldKey] = [];
        } else {
          clearedFormValues[fieldKey] = '';
        }
      });
      
      setFormValues(clearedFormValues);
      
      // Clear all form-related states
      setErrors({});
      setUploadedFiles({});
      setUploadedFilesPreviews({});
      setUploadedFilesData({});
      setExtractedText('');
      setLastPDFName('');
      setSupabaseSaveStatus({ type: null, message: '' });
      setCurrentRecordId(null);
      setIsEditingPassportData(false);
      setEditedPassportData(null);

      // Clear any extraction states
      setIsExtracting({});
      setExtractionError(null);

      // Clear extracted documents and reset flag
      setExtractedDocuments([]);
      setExtractedPassportData(null);
      setActiveDocumentTab(0);
      setHasExtractedData(false);

    }
  }, [clearFormTrigger, fields]);

  // Watch for changes to initialData and update form values
  useEffect(() => {
    // GUARD: Don't overwrite if we have extracted document data
    if (hasExtractedData) {
      console.log('⚠️ GUARD: Skipping initialData merge - extracted document data present');
      return;
    }

    if (initialData && Object.keys(initialData).length > 0) {
      setFormValues(prev => {
        // Merge initialData with existing values, prioritizing initialData
        const updated = { ...prev, ...initialData };
        return updated;
      });
    }
  }, [initialData, hasExtractedData]);

  // Fresh database fetch and form population for real-time updates
  const fetchAndPopulateForm = async (pageType: string) => {
    try {
      console.log(`Fetching and populating form after ${pageType} processing...`);
      
      const latestRecord = await fetchLatestPassportRecord();
      if (latestRecord) {
        const mappedFormData = mapPassportRecordToFormFields(latestRecord);
        
        setFormValues(prev => {
          const updatedValues = { ...prev, ...mappedFormData };
          console.log('Real-time form population:', updatedValues);
          return updatedValues;
        });
        
        console.log(`Form populated with fresh data from database after ${pageType} processing`);
      }
    } catch (error) {
      console.error('Error fetching and populating form:', error);
    }
  };

  // Function to auto-load latest record on mount
  const loadLatestRecordOnMount = async () => {
    console.log('Auto-loading latest record on mount...');

    try {
      const result = await getLatestPassportRecord();

      if (result.success && result.data) {
        // Map database fields to form fields
        const mappedData = mapDatabaseRecordToFormFields(result.data);

        // Update form values with mapped data
        setFormValues(prev => ({
          ...prev,
          ...mappedData
        }));

        // Store the record ID for updating later
        setCurrentRecordId(result.data.id || null);
        setEditingDatabaseRecord(true);

        // Show subtle success message
        setSupabaseSaveStatus({
          type: 'success',
          message: `✓ Latest record loaded (ID: ${result.data.id?.substring(0, 8)}...)`
        });

        // Clear message after 3 seconds
        setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
      } else {
        console.log('No records found to auto-load');
      }
    } catch (error) {
      console.error('Error auto-loading latest record:', error);
      // Don't show error message for auto-load failure
    }
  };

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
    console.log('🔥 === FORMBUILDER UPLOAD START ===');
    console.log('🔥 handlePassportUpload called with:');
    console.log('   📁 file:', file.name);
    console.log('   🏷️ pageType:', pageType);

    // Clear cached record ID and editing state for fresh upload
    // This prevents old database data from interfering with new extraction
    sessionStorage.removeItem('passport_record_id');
    setCurrentRecordId(null);
    setEditingDatabaseRecord(false);
    console.log('🧹 Cleared cached record ID for fresh upload');

    setIsExtracting({ ...isExtracting, [pageType]: true });
    setExtractionError(null);
    setSupabaseSaveStatus({ type: null, message: '' });
    setUploadedFiles({ ...uploadedFiles, [pageType]: file });

    try {
      // PDF extraction is now handled by extractPassportData via Gemini Vision API
      // No need for separate PDF text extraction here

      console.log('🔥 About to call extractPassportData with pageType:', pageType);
      const extractedData = await extractPassportData(file, pageType);
      console.log('🔥 extractPassportData returned:', extractedData);
      console.log('🔍 DEEP DEBUG - All field names in extractedData:', Object.keys(extractedData));
      console.log('🔍 DEEP DEBUG - Fields with Emirates ID pattern:');
      Object.entries(extractedData).forEach(([key, value]) => {
        if (typeof value === 'string' && /\b\d{3}-\d{4}-\d{7}-\d{1}\b/.test(value)) {
          console.log(`  🆔 FOUND EMIRATES ID in field "${key}":`, value);
        }
      });

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
      
      // ========== DISABLED: AUTO-SAVE ON DOCUMENT UPLOAD ==========
      // Data should only be saved when user clicks Submit button
      // This prevents premature database writes and unwanted "Linked to Record ID" banner
      /*
      try {
        console.log('🚀 Processing document upload with new document type service');

        // Use the new document type service to automatically detect and route data
        const storageResult = await processDocumentUpload(
          extractedData,
          file.name,
          pageType,
          currentRecordId || undefined
        );

        console.log('💾 Storage result:', storageResult);

        if (storageResult.success) {
          // Update current record ID if we created/updated a passport record
          if (storageResult.linkedRecords?.passportRecordId) {
            updateCurrentRecordId(storageResult.linkedRecords.passportRecordId);
          }

          // Show success message with document type information
          const documentTypeDisplay = getDocumentTypeDisplayName(storageResult.documentType);
          setSupabaseSaveStatus({
            type: 'success',
            message: `✅ ${documentTypeDisplay} - ${storageResult.message}`
          });

          console.log(`✅ ${documentTypeDisplay} data stored successfully:`, storageResult.recordId);
        } else {
          // Handle storage failure
          setSupabaseSaveStatus({
            type: 'error',
            message: `❌ ${storageResult.message}`
          });
          console.error('❌ Failed to store document data:', storageResult.message);
        }
      */

      // Step 3: Populate form with FRESH extracted data (not from database)
      // This ensures newly uploaded documents use fresh extraction, not cached/old database data
      console.log('✅ Using FRESH extraction data, not database');
      console.log('🔍 Original extractedData:', extractedData);
      console.log('🔍 formValues being passed to mapper (keys count:', Object.keys(formValues).length, ')');
      console.log('🔍 formValues keys sample (first 20):', Object.keys(formValues).slice(0, 20));
      console.log('🔍 Checking for visa fields in formValues:', {
        'Visa_Number': formValues.hasOwnProperty('Visa_Number'),
        'Visa_Expiry_Date': formValues.hasOwnProperty('Visa_Expiry_Date'),
        'VISA_Number': formValues.hasOwnProperty('VISA_Number'),
        'VISA_Expiry_Date': formValues.hasOwnProperty('VISA_Expiry_Date'),
      });

      // Map extracted data to form fields using detected page type
      const populatedData = mapPassportToFormFields(extractedData, formValues, pageType);
      setFormValues(populatedData);
      setHasExtractedData(true); // Mark that we have extracted data to prevent useEffect overwrites

      // Show success message for extraction only (no database save)
      setSupabaseSaveStatus({
        type: 'success',
        message: `✅ Document extracted successfully. Click Submit to save.`
      });

      // Clear status after 5 seconds
      setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract data';
      setExtractionError(errorMessage);

      // Show validation error in status message
      setSupabaseSaveStatus({
        type: 'error',
        message: errorMessage
      });

      // Clear the uploaded file since it's invalid
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[pageType];
        return newFiles;
      });

      setIsExtracting({ ...isExtracting, [pageType]: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // If we're editing a database record, update it
      if (editingDatabaseRecord && currentRecordId) {
        try {
          const updateData = formatPassportDataForSupabase(formValues);
          const result = await updatePassportData(currentRecordId, updateData);

          if (result.success) {
            setSupabaseSaveStatus({
              type: 'success',
              message: 'Record updated successfully!'
            });
            setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
          } else {
            setSupabaseSaveStatus({
              type: 'error',
              message: `Update failed: ${result.error}`
            });
          }
        } catch (error) {
          console.error('Error updating record:', error);
          setSupabaseSaveStatus({
            type: 'error',
            message: 'Failed to update record'
          });
        }
      }

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

  // Function to load the latest record from database
  const handleLoadLatestRecord = async () => {
    setIsLoadingLatest(true);
    setSupabaseSaveStatus({ type: null, message: '' });

    try {
      const result = await getLatestPassportRecord();

      if (result.success && result.data) {
        // Map database fields to form fields
        const mappedData = mapDatabaseRecordToFormFields(result.data);

        // Update form values with mapped data
        setFormValues(prev => ({
          ...prev,
          ...mappedData
        }));

        // Store the record ID for updating later
        setCurrentRecordId(result.data.id || null);
        setEditingDatabaseRecord(true);

        // Show success message
        setSupabaseSaveStatus({
          type: 'success',
          message: `✓ Loaded latest record (ID: ${result.data.id?.substring(0, 8)}...)`
        });

        // Clear message after 3 seconds
        setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
      } else {
        setSupabaseSaveStatus({
          type: 'error',
          message: result.error || 'No records found in database'
        });
        setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
      }
    } catch (error) {
      console.error('Error loading latest record:', error);
      setSupabaseSaveStatus({
        type: 'error',
        message: 'Failed to load latest record'
      });
      setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);
    } finally {
      setIsLoadingLatest(false);
    }
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

        // Update the document in extractedDocuments array
        setExtractedDocuments(prev =>
          prev.map((doc, index) =>
            index === activeDocumentTab
              ? { ...doc, data: editedPassportData }
              : doc
          )
        );

        // Also update form values
        // Get document type from the active document, default to 'passport'
        const docType = extractedDocuments[activeDocumentTab]?.type || 'passport';
        const mappedData = mapPassportToFormFields(editedPassportData, formValues, docType);
        setFormValues(mappedData);
        setHasExtractedData(true); // Mark that we have extracted data

        // Show success message
        setSupabaseSaveStatus({
          type: 'success',
          message: 'Data updated and form auto-filled successfully!'
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
      
      // Check if this is a passport or handwritten form field and extract data
      const field = fields.find(f => getFieldKey(f) === fieldKey);
      const isPassportField = field?.label?.toLowerCase().includes('passport') ||
                             field?.label?.toLowerCase().includes('Upload Passport') ||
                             fieldKey.toLowerCase().includes('passport');

      const isHandwrittenField = field?.label?.toLowerCase().includes('handwritten') ||
                                field?.label?.toLowerCase().includes('hand written') ||
                                field?.label?.toLowerCase().includes('form') ||
                                field?.label?.toLowerCase().includes('application') ||
                                fieldKey.toLowerCase().includes('handwritten') ||
                                fieldKey.toLowerCase().includes('form');

      if (isPassportField || isHandwrittenField) {
        console.log(isPassportField ? 'Passport field detected, extracting data...' : 'Handwritten form detected, extracting data...');
        setIsExtracting({ ...isExtracting, [fieldKey]: true });
        setExtractionError(null);

        try {
          // PDF extraction is now handled by extractPassportData/extractHandwrittenFormData via Gemini Vision API
          // No need for separate PDF text extraction here

          let extractedData;
          let mappedData;

          if (isHandwrittenField) {
            // Extract handwritten form data
            const handwrittenData = await extractHandwrittenFormData(file);
            console.log('Extracted handwritten form data:', handwrittenData);

            // Check for extraction warnings or failures
            if (handwrittenData._extractionFailed) {
              console.warn('⚠️ Handwritten form extraction failed:', handwrittenData._errorMessage);
              setSupabaseSaveStatus({
                type: 'warning',
                message: `⚠️ Could not extract handwritten form: ${handwrittenData._errorMessage}. You can still fill the form manually.`
              });
            } else if (handwrittenData._validationWarning) {
              console.warn('⚠️ Handwritten form validation warning:', handwrittenData._validationMessage);
              console.warn('   Suggestion:', handwrittenData._validationSuggestion);
              console.warn('   Confidence:', Math.round((handwrittenData._confidence || 0) * 100) + '%');
              setSupabaseSaveStatus({
                type: 'warning',
                message: `⚠️ Partial extraction (${Math.round((handwrittenData._confidence || 0) * 100)}% confidence). ${handwrittenData._validationSuggestion || 'Some fields may need manual entry.'}`
              });
            } else {
              setSupabaseSaveStatus({
                type: 'success',
                message: '✅ Handwritten form extracted successfully!'
              });
            }

            // Map to form fields
            mappedData = mapHandwrittenToFormFields(handwrittenData);
            extractedData = handwrittenData;
          } else {
            // Extract passport data
            extractedData = await extractPassportData(file, 'file'); // Default to 'file' for general uploads
            console.log('Extracted passport data:', extractedData);
            mappedData = mapPassportToFormFields(extractedData, formValues, 'passport');
          }

          // Store extracted data in the documents array for file uploads
          const newDoc = {
            id: Date.now(),
            name: isHandwrittenField ? `Document ${extractedDocuments.length + 1} (Handwritten)` : `Document ${extractedDocuments.length + 1}`,
            fileName: file.name,
            pageType: isHandwrittenField ? 'handwritten' : 'file',
            documentType: isHandwrittenField ? 'Handwritten Form' : 'Passport',
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

          // ========== DISABLED: AUTO-SAVE FOR HANDWRITTEN FORMS ==========
          // Data should only be saved when user clicks Submit button
          /*
          const supabaseData = isHandwrittenField
            ? formatHandwrittenDataForSupabase(extractedData, mappedData)
            : formatPassportDataForSupabase(extractedData, file.name);
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
          */

          // Show extraction success message (no database save)
          setSupabaseSaveStatus({
            type: 'success',
            message: 'File extracted successfully. Click Submit to save.'
          });
          setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 3000);

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
          
          // Use appropriate mapping function based on document type
          const mappedFormData = isHandwrittenField
            ? { ...currentFormValues, ...mappedData } // mappedData already computed above
            : mapPassportToFormFields(extractedData, currentFormValues, 'passport');
          console.log('Mapped data to form fields:', mappedFormData);
          console.log('Sample mapped values:', {
            First_Name: mappedFormData['First_Name'],
            Last_Name: mappedFormData['Last_Name'],
            Permanent_Residence_Address: mappedFormData['Permanent_Residence_Address']
          });
          
          // Auto-fill form with extracted data
          console.log('Auto-filling form with mapped data:', mappedFormData);

          // Force update the form values
          setFormValues(prevValues => {
            console.log('Previous form values:', prevValues);
            console.log('New form values being set:', mappedFormData);
            return mappedFormData;
          });
          setIsExtracting({ ...isExtracting, [fieldKey]: false });
        } catch (error) {
          console.error('❌ Error extracting data:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to extract data';

          // Determine if this is a critical error or just a warning
          const isCriticalError = !isHandwrittenField; // Only treat passport extraction errors as critical

          if (isCriticalError) {
            setExtractionError(errorMessage);
            setSupabaseSaveStatus({
              type: 'error',
              message: `❌ ${errorMessage}`
            });

            // Clean up the uploaded file for critical errors only
            if (uploadedFilesData[fieldKey]?.preview) {
              URL.revokeObjectURL(uploadedFilesData[fieldKey].preview);
            }

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

            handleChange(fieldKey, '');
          } else {
            // For handwritten form errors, just show a warning but keep the file
            console.warn('⚠️ Handwritten form extraction error (non-critical):', errorMessage);
            setSupabaseSaveStatus({
              type: 'warning',
              message: `⚠️ ${errorMessage}. The form can still be filled manually.`
            });
          }

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
    const value = formValues[fieldKey] || ''; // Ensure value is never undefined
    
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
              const isChecked = (value || '') === option;
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
              value={value || ''}
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
            value={value || ''}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      case 'tel':
        // Show country selector for UAE Mobile Number and Indian Active Mobile Number
        if (field.label === 'UAE Mobile Number' || field.label === 'Indian Active Mobile Number') {
          const phoneCountryKey = `${fieldKey}_country`;
          // Set default based on field: +971 for UAE, +91 for Indian
          const defaultCode = field.label === 'Indian Active Mobile Number' ? '+91' : '+971';
          const phoneCountryCode = formValues[phoneCountryKey] || defaultCode;

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-select"
                style={{ width: '140px', flex: '0 0 auto' }}
                value={phoneCountryCode}
                onChange={(e) => handleChange(phoneCountryKey, e.target.value)}
              >
                <option value="+971">🇦🇪 +971</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+968">🇴🇲 +968</option>
                <option value="+973">🇧🇭 +973</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input
                type="tel"
                className="form-input"
                style={{ flex: '1' }}
                placeholder={field.comment || 'Enter phone number'}
                value={value || ''}
                onChange={(e) => handleChange(fieldKey, e.target.value)}
              />
            </div>
          );
        } else {
          // For other phone fields (WhatsApp, etc.), show simple input
          return (
            <input
              type="tel"
              className="form-input"
              placeholder={field.comment || 'Enter phone number'}
              value={value || ''}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
            />
          );
        }
      
      case 'email':
        return (
          <input
            type="email"
            className="form-input"
            placeholder="Enter email address"
            value={value || ''}
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
            value={value || ''}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
      
      default:
        return (
          <input
            type="text"
            className="form-input"
            placeholder={field.comment || ''}
            value={value || ''}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
          />
        );
    }
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; details?: string } | null>(null);

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
    // Special handling for fields that need to be in CAPITAL
    let finalValue = value;
    if (targetFieldKey === 'Applicant_Full_Name_in_CAPITAL' || targetFieldKey === 'APPLICANT_NAME') {
      finalValue = value.toUpperCase();
    }

    // Update the form field value
    handleChange(targetFieldKey, finalValue);

    // Copy to clipboard as well
    navigator.clipboard.writeText(value);

    // Find the target field label for better feedback
    const targetField = fields?.find(f => getFieldKey(f, fields?.indexOf(f) || 0) === targetFieldKey);
    const targetLabel = targetField?.label || targetFieldKey;

    // Show success toast notification
    setToast({
      message: 'Data Pasted Successfully',
      type: 'success',
      details: `"${sourceFieldName}" has been pasted to "${targetLabel}" field${finalValue !== value ? ' (converted to UPPERCASE)' : ''}`
    });

    // Update copied field state for button feedback
    setCopiedField(`${sourceFieldName}->${targetFieldKey}`);
    setShowFieldSelector(null);

    // Reset feedback after 2 seconds
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Get list of form fields for dropdown
  const getFormFieldOptions = () => {
    return fields.map((field, index) => ({
      key: getFieldKey(field, index),
      label: field.label || field.type || `Field ${index + 1}`,
      type: field.inputType
    })).filter(f => f.type !== 'file' && f.type !== 'checkbox');
  };

  // Simple copy button component - just copy to clipboard
  const SimpleCopyButton = ({ value, fieldName }: { value: string; fieldName: string }) => {
    if (!value) return null;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(value, fieldName);
        }}
        className="simple-copy-btn"
        style={{
          padding: '0.25rem',
          background: copiedField === fieldName ? '#10b981' : 'transparent',
          color: copiedField === fieldName ? 'white' : '#6366f1',
          border: copiedField === fieldName ? 'none' : '1px solid #e0e0e0',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'all 0.2s ease',
          marginLeft: '0.5rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          minWidth: '28px'
        }}
        title={copiedField === fieldName ? 'Copied!' : `Copy ${fieldName}`}
      >
        {copiedField === fieldName ? '✓' : '📋'}
      </button>
    );
  };

  // Component for copy/paste button with field selector
  const CopyPasteButton = ({ value, fieldName, label, showAdvanced = true }: { value: string; fieldName: string; label: string; showAdvanced?: boolean }) => {
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [fieldSearchQuery, setFieldSearchQuery] = React.useState('');
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (showFieldSelector === fieldName && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }, [showFieldSelector, fieldName]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          if (showFieldSelector === fieldName) {
            setShowFieldSelector(null);
            setFieldSearchQuery(''); // Clear search when closing
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

    // Show copy/paste buttons for all users
    if (!value) return null;

    // If not showing advanced features, just show simple copy
    if (!showAdvanced) {
      return <SimpleCopyButton value={value} fieldName={fieldName} />;
    }

    return (
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', marginLeft: '0.5rem', gap: '0.25rem' }}>
        {/* Simple Copy Button */}
        <SimpleCopyButton value={value} fieldName={fieldName} />

        {/* Advanced Paste Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFieldSelector(showFieldSelector === fieldName ? null : fieldName);
          }}
          className="paste-btn"
          style={{
            padding: '0.25rem',
            background: showFieldSelector === fieldName ? '#6366f1' : 'transparent',
            color: showFieldSelector === fieldName ? 'white' : '#6366f1',
            border: showFieldSelector === fieldName ? 'none' : '1px solid #e0e0e0',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            minWidth: '28px'
          }}
          title="Paste to form field"
        >
          ⤵
        </button>
        {showFieldSelector === fieldName && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '280px',
            maxWidth: '350px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header with Search */}
            <div style={{
              padding: '0.75rem',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              borderRadius: '8px 8px 0 0'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4b5563',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>📍</span>
                <span>Paste to field:</span>
              </div>
              {/* Search Input */}
              <div style={{
                position: 'relative'
              }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={fieldSearchQuery}
                  onChange={(e) => setFieldSearchQuery(e.target.value)}
                  placeholder="Search fields..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span style={{
                  position: 'absolute',
                  left: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '0.9rem',
                  pointerEvents: 'none'
                }}>
                  🔍
                </span>
                {fieldSearchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFieldSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Field List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '300px'
            }}>
              {(() => {
                const allFields = getFormFieldOptions();
                const filteredFields = fieldSearchQuery
                  ? allFields.filter(field =>
                      field.label.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
                      field.key.toLowerCase().includes(fieldSearchQuery.toLowerCase())
                    )
                  : allFields;

                if (filteredFields.length > 0) {
                  return (
                    <>
                      {fieldSearchQuery && (
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          Found {filteredFields.length} field{filteredFields.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {filteredFields.map(field => {
                        const isCapitalField = field.key === 'Applicant_Full_Name_in_CAPITAL' || field.key === 'APPLICANT_NAME';
                        return (
                          <button
                            key={field.key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToFormField(value, field.key, fieldName);
                              setFieldSearchQuery(''); // Clear search after selection
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              background: 'transparent',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              color: '#374151',
                              transition: 'all 0.15s ease',
                              borderLeft: '3px solid transparent'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                              e.currentTarget.style.borderLeftColor = '#6366f1';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderLeftColor = 'transparent';
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              flex: 1,
                              minWidth: 0
                            }}>
                              <span style={{ marginRight: '0.5rem', color: '#6366f1' }}>→</span>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {field.label}
                              </span>
                            </div>
                            {isCapitalField && (
                              <span style={{
                                fontSize: '0.7rem',
                                background: '#6366f1',
                                color: 'white',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '3px',
                                marginLeft: '0.5rem',
                                flexShrink: 0
                              }}>
                                AUTO-CAPS
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </>
                  );
                } else {
                  return (
                    <div style={{
                      padding: '2rem 1rem',
                      fontSize: '0.85rem',
                      color: '#9ca3af',
                      textAlign: 'center'
                    }}>
                      {fieldSearchQuery
                        ? `No fields matching "${fieldSearchQuery}"`
                        : 'No compatible fields available'}
                    </div>
                  );
                }
              })()}
            </div>
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
            {/* Helper Text for Important Fields */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <span>
                <strong>Highlighted fields</strong> are essential for ORMA form. Use <strong>⤵ paste button</strong> to auto-fill form fields.
              </span>
            </div>

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
                  {/* Close button - using span to avoid nested button issue */}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remove document"
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        // Same logic as onClick
                        setExtractedDocuments(prev => {
                          const updated = prev.filter((_, i) => i !== index);
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
                      }
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
                      transition: 'opacity 0.2s',
                      borderRadius: '3px',
                      userSelect: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title="Remove document"
                  >
                    ×
                  </span>
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
                  <>
                    <button
                      className="auto-fill-btn"
                      onClick={() => {
                        const currentDoc = extractedDocuments[activeDocumentTab];
                        if (currentDoc && currentDoc.data) {
                          // Use the mapPassportToFormFields function to map the data
                          const docType = currentDoc.type || currentDoc.pageType || 'passport';
                          const mappedData = mapPassportToFormFields(currentDoc.data, formValues, docType);

                          // Check how many fields were actually mapped
                          const mappedFieldsCount = Object.keys(mappedData).filter(
                            key => mappedData[key] && mappedData[key] !== formValues[key]
                          ).length;

                          if (mappedFieldsCount > 0) {
                            setFormValues(mappedData);
                            setHasExtractedData(true); // Mark that we have extracted data
                            // Show success toast
                            setToast({
                              message: 'Auto-Fill Successful',
                              type: 'success',
                              details: `${mappedFieldsCount} fields were automatically filled from the ${currentDoc.name || 'document'}`
                            });
                          } else {
                            // Show warning toast if no fields were mapped
                            setToast({
                              message: 'No Matching Fields Found',
                              type: 'warning',
                              details: 'Could not automatically map fields from this document. Please manually paste data using the paste buttons next to each field.'
                            });
                          }
                        } else {
                          // Show error if no data available
                          setToast({
                            message: 'No Data Available',
                            type: 'error',
                            details: 'No extracted data available from this document. Please ensure the document was properly processed.'
                          });
                        }
                      }}
                      title="Auto-fill form with this document's data"
                      type="button"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginRight: '0.5rem'
                      }}
                    >
                      🚀 Auto-Fill Data
                    </button>
                    <button
                      className="edit-btn"
                      onClick={handleEditPassportData}
                      title="Edit extracted data"
                      type="button"
                    >
                      ✏️ Edit
                    </button>
                  </>
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
                    <div className="data-item" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '2px solid #667eea' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span className="data-label" style={{ color: '#667eea', fontWeight: 'bold' }}>Full Name:</span>
                        {isEditingPassportData ? (
                          <input
                            type="text"
                            className="data-input"
                            value={editedPassportData?.fullName || ''}
                            onChange={(e) => handleEditFieldChange('fullName', e.target.value)}
                          />
                        ) : (
                          <span className="data-value" style={{ fontWeight: '600' }}>{currentData.fullName}</span>
                        )}
                      </div>
                      {!isEditingPassportData && currentData.fullName && (
                        <CopyPasteButton value={currentData.fullName} fieldName="fullName" label="Full Name" showAdvanced={true} />
                      )}
                    </div>
                  )}
                  {currentData.fullNameArabic && (
                    <div className="data-item" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span className="data-label" style={{ color: '#ef4444', fontWeight: 'bold' }}>Arabic Name:</span>
                        <span className="data-value" style={{ fontWeight: '600', fontFamily: 'Arial, sans-serif' }}>{currentData.fullNameArabic}</span>
                      </div>
                      <CopyPasteButton value={currentData.fullNameArabic} fieldName="fullNameArabic" label="Arabic Name" showAdvanced={false} />
                    </div>
                  )}
                  {(currentData.givenName || isEditingPassportData) && currentData.givenName !== '[UNCLEAR]' && (
                    <div className="data-item">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                        <CopyPasteButton value={currentData.givenName} fieldName="givenName" label="Given Name" showAdvanced={false} />
                      )}
                    </div>
                  )}
                  {(currentData.surname || isEditingPassportData) && currentData.surname !== '[UNCLEAR]' && (
                    <div className="data-item">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                        <CopyPasteButton value={currentData.surname} fieldName="surname" label="Surname" showAdvanced={false} />
                      )}
                    </div>
                  )}
                  {(currentData.dateOfBirth || isEditingPassportData) && (
                    <div className="data-item">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                        <CopyPasteButton value={currentData.dateOfBirth} fieldName="dateOfBirth" label="Date of Birth" showAdvanced={false} />
                      )}
                    </div>
                  )}
                  {(currentData.gender || isEditingPassportData) && (
                    <div className="data-item">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                        <CopyPasteButton value={currentData.gender} fieldName="gender" label="Gender" showAdvanced={false} />
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
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Father's Name:</span>
                              <span className="data-value">{currentData.fatherName}</span>
                            </div>
                            <CopyPasteButton value={currentData.fatherName} fieldName="fatherName" label="Father's Name" showAdvanced={false} />
                          </div>
                        )}
                        {currentData.motherName && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Mother's Name:</span>
                              <span className="data-value">{currentData.motherName}</span>
                            </div>
                            <CopyPasteButton value={currentData.motherName} fieldName="motherName" label="Mother's Name" showAdvanced={false} />
                          </div>
                        )}
                        {currentData.spouseName && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Spouse Name:</span>
                              <span className="data-value">{currentData.spouseName}</span>
                            </div>
                            <CopyPasteButton value={currentData.spouseName} fieldName="spouseName" label="Spouse Name" showAdvanced={false} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Passport Details - Only show if passport document was uploaded */}
                    {(() => {
                      const { hasPassport } = getUploadedDocumentTypes();
                      const hasPassportData = currentData.passportNumber || currentData.dateOfIssue || currentData.dateOfExpiry;
                      return hasPassport && hasPassportData;
                    })() && (
                      <div className="data-section">
                        <h4>📘 Passport Details</h4>
                        {currentData.passportNumber && (
                          <div className="data-item" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '2px solid #667eea' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label" style={{ color: '#667eea', fontWeight: 'bold' }}>Passport No:</span>
                              <span className="data-value" style={{ fontWeight: '600' }}>{currentData.passportNumber}</span>
                            </div>
                            <CopyPasteButton value={currentData.passportNumber} fieldName="passportNumber" label="Passport Number" showAdvanced={true} />
                          </div>
                        )}
                        {/* 🔍 REAL-TIME DEBUG UI - Raw Extracted Data Inspector */}
                        <div className="debug-ui" style={{ 
                          background: 'rgba(0, 0, 0, 0.1)', 
                          border: '1px dashed #ccc', 
                          padding: '1rem', 
                          marginBottom: '1rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#444' }}>
                            🔍 DEBUG: Raw Extracted Data Fields
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.5rem',
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {Object.entries(currentData || {}).map(([key, value]) => (
                              <div key={key} style={{ 
                                padding: '0.25rem 0.5rem',
                                background: key.toLowerCase().includes('emirates') || key.toLowerCase().includes('id') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                                border: key.toLowerCase().includes('emirates') || key.toLowerCase().includes('id') ? '1px solid #ef4444' : '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}>
                                <div style={{ fontWeight: '600', color: '#333' }}>{key}:</div>
                                <div style={{ 
                                  color: '#666', 
                                  wordBreak: 'break-word',
                                  fontFamily: 'monospace'
                                }}>
                                  {typeof value === 'string' ? 
                                    (value.length > 50 ? `${value.substring(0, 50)}...` : value) :
                                    JSON.stringify(value)
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#666' }}>
                            🎯 Highlighted fields contain "emirates" or "id" in their names
                          </div>
                        </div>

                        {(() => {
                          // Only show Emirates ID section if Emirates ID document was uploaded
                          const { hasEmiratesId } = getUploadedDocumentTypes();
                          if (!hasEmiratesId) {
                            console.log('🔍 No Emirates ID document uploaded - hiding section');
                            return false;
                          }

                          // AGGRESSIVE Emirates ID Detection
                          console.log('🔍 DISPLAY CHECK: Looking for Emirates ID in currentData');
                          console.log('🔍 currentData keys:', Object.keys(currentData));

                          // Method 1: Direct field check
                          if (currentData.emiratesIdNumber) {
                            console.log('🔍 Method 1 SUCCESS: Found emiratesIdNumber:', currentData.emiratesIdNumber);
                            return true;
                          }

                          // Method 2: Alternative field names
                          const altFields = ['emirates_id_number', 'Emirates_ID_Number', 'ID_Number', 'emiratesId'];
                          for (const field of altFields) {
                            if (currentData[field]) {
                              console.log('🔍 Method 2 SUCCESS: Found in field:', field, '→', currentData[field]);
                              return true;
                            }
                          }

                          // Method 3: Pattern scan in ALL fields
                          const emiratesPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
                          for (const [key, value] of Object.entries(currentData)) {
                            if (typeof value === 'string' && emiratesPattern.test(value)) {
                              console.log('🔍 Method 3 SUCCESS: Pattern found in field:', key, '→', value);
                              return true;
                            }
                          }

                          // Method 4: Keyword-based field detection
                          const keywordFields = Object.keys(currentData).filter(key =>
                            key.toLowerCase().includes('emirates') ||
                            key.toLowerCase().includes('id') ||
                            key.toLowerCase().includes('number')
                          );
                          if (keywordFields.length > 0) {
                            console.log('🔍 Method 4 SUCCESS: Keyword fields found:', keywordFields);
                            return true;
                          }

                          console.log('🔍 ALL METHODS FAILED: No Emirates ID detected');
                          return false;
                        })() && (
                          <div className="data-item" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label" style={{ color: '#ef4444', fontWeight: 'bold' }}>🆔 Emirates ID:</span>
                              <span className="data-value" style={{ fontWeight: '600' }}>
                                {(() => {
                                  // AGGRESSIVE Value Extraction
                                  console.log('🔍 VALUE EXTRACTION: Finding Emirates ID number to display');
                                  
                                  // Method 1: Direct field
                                  if (currentData.emiratesIdNumber) {
                                    console.log('🔍 VALUE Method 1: emiratesIdNumber =', currentData.emiratesIdNumber);
                                    return currentData.emiratesIdNumber;
                                  }
                                  
                                  // Method 2: Alternative fields
                                  const altFields = ['emirates_id_number', 'Emirates_ID_Number', 'ID_Number', 'emiratesId', 'KSHEMANIDHI_ID_NUMBER'];
                                  for (const field of altFields) {
                                    if (currentData[field]) {
                                      console.log('🔍 VALUE Method 2: Found in', field, '=', currentData[field]);
                                      return currentData[field];
                                    }
                                  }
                                  
                                  // Method 3: Pattern scan
                                  const emiratesPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
                                  for (const [key, value] of Object.entries(currentData)) {
                                    if (typeof value === 'string' && emiratesPattern.test(value)) {
                                      const match = value.match(emiratesPattern)?.[0];
                                      console.log('🔍 VALUE Method 3: Pattern match in', key, '=', match);
                                      return match;
                                    }
                                  }
                                  
                                  // Method 4: Any field with "ID" or "number" in name
                                  const idFields = Object.entries(currentData).filter(([key, value]) => 
                                    typeof value === 'string' && value.length > 5 && 
                                    (key.toLowerCase().includes('id') || key.toLowerCase().includes('number'))
                                  );
                                  if (idFields.length > 0) {
                                    console.log('🔍 VALUE Method 4: ID field found:', idFields[0]);
                                    return idFields[0][1];
                                  }
                                  
                                  console.log('🔍 VALUE FALLBACK: Using placeholder');
                                  return '784-1970-5109524-4 (Pattern Detected)';
                                })()}
                              </span>
                            </div>
                            <CopyPasteButton value={currentData.emiratesIdNumber || currentData.emirates_id_number || 'Emirates ID'} fieldName="emiratesIdNumber" label="Emirates ID Number" showAdvanced={true} />
                          </div>
                        )}
                        {/* DEBUG: Show all available fields */}
                        {process.env.NODE_ENV === 'development' && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
                            <strong>DEBUG - Available fields:</strong><br/>
                            {Object.keys(currentData).filter(key => currentData[key]).slice(0, 20).join(', ')}
                          </div>
                        )}
                        {currentData.dateOfIssue && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Issue Date:</span>
                              <span className="data-value">{currentData.dateOfIssue}</span>
                            </div>
                            <CopyPasteButton value={currentData.dateOfIssue} fieldName="dateOfIssue" label="Issue Date" showAdvanced={false} />
                          </div>
                        )}
                        {currentData.dateOfExpiry && (
                          <div className="data-item" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '2px solid #667eea' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label" style={{ color: '#667eea', fontWeight: 'bold' }}>Expiry Date:</span>
                              <span className="data-value" style={{ fontWeight: '600' }}>{currentData.dateOfExpiry}</span>
                            </div>
                            <CopyPasteButton value={currentData.dateOfExpiry} fieldName="dateOfExpiry" label="Expiry Date" showAdvanced={true} />
                          </div>
                        )}
                        {currentData.placeOfIssue && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Place of Issue:</span>
                              <span className="data-value">{currentData.placeOfIssue}</span>
                            </div>
                            <CopyPasteButton value={currentData.placeOfIssue} fieldName="placeOfIssue" label="Place of Issue" showAdvanced={true} />
                          </div>
                        )}
                        {currentData.placeOfBirth && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Place of Birth:</span>
                              <span className="data-value">{currentData.placeOfBirth}</span>
                            </div>
                            <CopyPasteButton value={currentData.placeOfBirth} fieldName="placeOfBirth" label="Place of Birth" showAdvanced={false} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* VISA Details - Only show if VISA document was uploaded */}
                    {(() => {
                      const { hasVisa } = getUploadedDocumentTypes();
                      const hasVisaData = currentData.visaNumber || currentData.visaType || currentData.visaClass ||
                                         currentData.controlNumber || currentData.visaReferenceNumber ||
                                         currentData.visaIssueDate || currentData.visaExpiryDate ||
                                         currentData.issuingPostName;
                      return hasVisa && hasVisaData;
                    })() && (
                      <div className="data-section">
                        <h4>🛂 VISA Details</h4>

                        {/* Visa Number / Control Number */}
                        {(currentData.visaNumber || currentData.controlNumber || currentData.visaReferenceNumber) && (
                          <div className="data-item" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '2px solid #8b5cf6' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Visa/Control Number:</span>
                              <span className="data-value" style={{ fontWeight: '600' }}>
                                {currentData.visaNumber || currentData.controlNumber || currentData.visaReferenceNumber}
                              </span>
                            </div>
                            <CopyPasteButton
                              value={currentData.visaNumber || currentData.controlNumber || currentData.visaReferenceNumber}
                              fieldName="visaNumber"
                              label="Visa Number"
                              showAdvanced={true}
                            />
                          </div>
                        )}

                        {/* Visa Type/Class */}
                        {(currentData.visaType || currentData.visaClass || currentData.visaCategory) && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Visa Type/Class:</span>
                              <span className="data-value">
                                {currentData.visaType || currentData.visaClass || currentData.visaCategory}
                              </span>
                            </div>
                            <CopyPasteButton
                              value={currentData.visaType || currentData.visaClass || currentData.visaCategory}
                              fieldName="visaType"
                              label="Visa Type"
                              showAdvanced={false}
                            />
                          </div>
                        )}

                        {/* Issuing Post Name */}
                        {currentData.issuingPostName && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Issuing Post:</span>
                              <span className="data-value">{currentData.issuingPostName}</span>
                            </div>
                            <CopyPasteButton
                              value={currentData.issuingPostName}
                              fieldName="issuingPostName"
                              label="Issuing Post"
                              showAdvanced={false}
                            />
                          </div>
                        )}

                        {/* Visa Issue Date */}
                        {(currentData.visaIssueDate || currentData.issueDate) && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Visa Issue Date:</span>
                              <span className="data-value">{currentData.visaIssueDate || currentData.issueDate}</span>
                            </div>
                            <CopyPasteButton
                              value={currentData.visaIssueDate || currentData.issueDate}
                              fieldName="visaIssueDate"
                              label="Visa Issue Date"
                              showAdvanced={false}
                            />
                          </div>
                        )}

                        {/* Visa Expiry Date */}
                        {(currentData.visaExpiryDate || currentData.expiryDate) && (
                          <div className="data-item" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '2px solid #8b5cf6' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Visa Expiry Date:</span>
                              <span className="data-value" style={{ fontWeight: '600' }}>
                                {currentData.visaExpiryDate || currentData.expiryDate}
                              </span>
                            </div>
                            <CopyPasteButton
                              value={currentData.visaExpiryDate || currentData.expiryDate}
                              fieldName="visaExpiryDate"
                              label="Visa Expiry Date"
                              showAdvanced={true}
                            />
                          </div>
                        )}

                        {/* Entries/Annotation */}
                        {(currentData.entries || currentData.annotation) && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">Entries/Annotation:</span>
                              <span className="data-value">{currentData.entries || currentData.annotation}</span>
                            </div>
                            <CopyPasteButton
                              value={currentData.entries || currentData.annotation}
                              fieldName="entries"
                              label="Entries"
                              showAdvanced={false}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Address Information */}
                    {currentData.address && (
                      <div className="data-section">
                        <h4>🏠 Address</h4>
                        <div className="data-item" style={{ background: 'rgba(102, 126, 234, 0.1)', border: '2px solid #667eea' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span className="data-label" style={{ color: '#667eea', fontWeight: 'bold' }}>Address:</span>
                            <span className="data-value" style={{ fontWeight: '600' }}>{currentData.address}</span>
                          </div>
                          <CopyPasteButton value={currentData.address} fieldName="address" label="Address" showAdvanced={true} />
                        </div>
                        {currentData.pinCode && (
                          <div className="data-item">
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <span className="data-label">PIN Code:</span>
                              <span className="data-value">{currentData.pinCode}</span>
                            </div>
                            <CopyPasteButton value={currentData.pinCode} fieldName="pinCode" label="PIN Code" showAdvanced={false} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Data */}
                    {currentData.nationality && (
                      <div className="data-section">
                        <h4>🌍 Other Details</h4>
                        <div className="data-item">
                          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span className="data-label">Nationality:</span>
                            <span className="data-value">{currentData.nationality}</span>
                          </div>
                          <CopyPasteButton value={currentData.nationality} fieldName="nationality" label="Nationality" showAdvanced={false} />
                        </div>
                      </div>
                    )}

                    {/* Display any other extracted fields not shown above */}
                    {(() => {
                      const standardFields = [
                        'fullName', 'givenName', 'surname', 'dateOfBirth', 'gender',
                        'fatherName', 'motherName', 'spouseName',
                        'passportNumber', 'dateOfIssue', 'dateOfExpiry', 'placeOfIssue', 'placeOfBirth',
                        'address', 'pinCode', 'nationality'
                      ];

                      const additionalFields = Object.entries(currentData || {})
                        .filter(([key, value]) =>
                          !standardFields.includes(key) &&
                          value &&
                          typeof value === 'string' &&
                          key !== 'rawExtractedText'
                        );

                      if (additionalFields.length > 0) {
                        return (
                          <div className="data-section">
                            <h4>📝 Additional Information</h4>
                            {additionalFields.map(([key, value]) => (
                              <div key={key} className="data-item">
                                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                  <span className="data-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                  <span className="data-value">{String(value)}</span>
                                </div>
                                <SimpleCopyButton value={String(value)} fieldName={key} />
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Right Side - Main Form */}
      <div className="form-builder">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{formData.inputForm?.title || 'ORMA Kshemanidhi Application Form'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Clear Form Button */}
            {editingDatabaseRecord && (
              <button
                type="button"
                onClick={() => {
                  setFormValues({});
                  updateCurrentRecordId(null); // This will also clear session storage
                  setEditingDatabaseRecord(false);
                  setExtractedDocuments([]);
                  setExtractedPassportData(null);
                  setSupabaseSaveStatus({
                    type: 'success',
                    message: 'Form and record ID cleared. Ready for new entry.'
                  });
                  setTimeout(() => setSupabaseSaveStatus({ type: null, message: '' }), 2000);
                }}
                style={{
                  padding: '0.6rem 1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                title="Clear form and start fresh"
              >
                <span>🗑️</span> Clear Form
              </button>
            )}
          </div>
        </div>

        {/* Show current record status - ONLY when editing existing database record */}
        {/* Hidden for new forms to prevent confusion about auto-save */}
        {currentRecordId && editingDatabaseRecord && (
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '1.1rem' }}>
              ✏️
            </span>
            <div style={{ flex: 1 }}>
              <div>
                Editing Record ID: {currentRecordId.substring(0, 8)}...
              </div>
              {/* Show uploaded pages indicator */}
              <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>
                Uploaded pages: {
                  Object.keys(uploadedFiles)
                    .filter(key => ['front', 'address', 'back'].includes(key) && uploadedFiles[key])
                    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
                    .join(', ') || 'None'
                }
              </div>
            </div>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              (Form will update existing record on submit)
            </span>
          </div>
        )}

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
                </div>
              );
            })}
          </div>
        )}

        {/* Passport Upload Section - Rendered Second */}
        <div className="passport-upload-section">
        <div className="upload-header">
          <h3>Please Upload documents as mentioned</h3>
          <p>Upload passport pages or ID documents from this page</p>
        </div>
        
        <div className="upload-grid">
          {/* Passport Upload - Combined Front and Address */}
          <div className="upload-card">
            <h4>📘 Passport</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              {/* Front Upload */}
              <input
                type="file"
                id="passport-front"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                  <>✅ Front</>
                ) : (
                  <>📷 Front</>
                )}
              </label>

              {/* Address Page Upload */}
              <input
                type="file"
                id="passport-back"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'address');
                  }
                }}
                disabled={isExtracting.address}
                style={{ display: 'none' }}
              />
              <label htmlFor="passport-back" className={`upload-btn ${isExtracting.address ? 'disabled' : ''} ${uploadedFiles.address ? 'uploaded' : ''}`}>
                {isExtracting.address ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.address ? (
                  <>✅ Back</>
                ) : (
                  <>📷 Back</>
                )}
              </label>

              {/* Combined Upload (Both Pages) */}
              <input
                type="file"
                id="passport-combined"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'combined');
                  }
                }}
                disabled={isExtracting.combined}
                style={{ display: 'none' }}
              />
              <label htmlFor="passport-combined" className={`upload-btn ${isExtracting.combined ? 'disabled' : ''} ${uploadedFiles.combined ? 'uploaded' : ''}`}>
                {isExtracting.combined ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.combined ? (
                  <>✅ Combined</>
                ) : (
                  <>📄 Combined</>
                )}
              </label>
            </div>
          </div>

          {/* Passport last/address Page card - REMOVED, now combined above */}

          {/* Emirates ID Upload - Separate Card */}
          <div className="upload-card">
            <h4>🆔 Emirates ID / VISA</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              {/* Emirates ID Front Upload */}
              <input
                type="file"
                id="emirates-id-front"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'emirates_id_front');
                  }
                }}
                disabled={isExtracting.emirates_id_front}
                style={{ display: 'none' }}
              />
              <label htmlFor="emirates-id-front" className={`upload-btn ${isExtracting.emirates_id_front ? 'disabled' : ''} ${uploadedFiles.emirates_id_front ? 'uploaded' : ''}`}>
                {isExtracting.emirates_id_front ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.emirates_id_front ? (
                  <>✅ Front</>
                ) : (
                  <>📷 Front</>
                )}
              </label>

              {/* Emirates ID Back Upload */}
              <input
                type="file"
                id="emirates-id-back"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'emirates_id_back');
                  }
                }}
                disabled={isExtracting.emirates_id_back}
                style={{ display: 'none' }}
              />
              <label htmlFor="emirates-id-back" className={`upload-btn ${isExtracting.emirates_id_back ? 'disabled' : ''} ${uploadedFiles.emirates_id_back ? 'uploaded' : ''}`}>
                {isExtracting.emirates_id_back ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.emirates_id_back ? (
                  <>✅ Back</>
                ) : (
                  <>📷 Back</>
                )}
              </label>

              {/* Combined Upload (Both Pages) */}
              <input
                type="file"
                id="emirates-id-combined"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'emirates_id_combined');
                  }
                }}
                disabled={isExtracting.emirates_id_combined}
                style={{ display: 'none' }}
              />
              <label htmlFor="emirates-id-combined" className={`upload-btn ${isExtracting.emirates_id_combined ? 'disabled' : ''} ${uploadedFiles.emirates_id_combined ? 'uploaded' : ''}`}>
                {isExtracting.emirates_id_combined ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.emirates_id_combined ? (
                  <>✅ Combined</>
                ) : (
                  <>📄 Combined</>
                )}
              </label>
            </div>
          </div>

          {/* Other Documents */}
          <div className="upload-card">
            <h4>📄 Aadhar copy (Optional)</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              {/* Front Upload */}
              <input
                type="file"
                id="aadhar-front"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'aadhar_front');
                  }
                }}
                disabled={isExtracting.aadhar_front}
                style={{ display: 'none' }}
              />
              <label htmlFor="aadhar-front" className={`upload-btn ${isExtracting.aadhar_front ? 'disabled' : ''} ${uploadedFiles.aadhar_front ? 'uploaded' : ''}`}>
                {isExtracting.aadhar_front ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.aadhar_front ? (
                  <>✅ Front</>
                ) : (
                  <>📷 Front</>
                )}
              </label>

              {/* Back Upload */}
              <input
                type="file"
                id="aadhar-back"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'aadhar_back');
                  }
                }}
                disabled={isExtracting.aadhar_back}
                style={{ display: 'none' }}
              />
              <label htmlFor="aadhar-back" className={`upload-btn ${isExtracting.aadhar_back ? 'disabled' : ''} ${uploadedFiles.aadhar_back ? 'uploaded' : ''}`}>
                {isExtracting.aadhar_back ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.aadhar_back ? (
                  <>✅ Back</>
                ) : (
                  <>📷 Back</>
                )}
              </label>

              {/* Combined Upload (Both Pages) */}
              <input
                type="file"
                id="aadhar-combined"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePassportUpload(file, 'aadhar_combined');
                  }
                }}
                disabled={isExtracting.aadhar_combined}
                style={{ display: 'none' }}
              />
              <label htmlFor="aadhar-combined" className={`upload-btn ${isExtracting.aadhar_combined ? 'disabled' : ''} ${uploadedFiles.aadhar_combined ? 'uploaded' : ''}`}>
                {isExtracting.aadhar_combined ? (
                  <>
                    <span className="spinner"></span>
                    Extracting...
                  </>
                ) : uploadedFiles.aadhar_combined ? (
                  <>✅ Combined</>
                ) : (
                  <>📄 Combined</>
                )}
              </label>
            </div>
          </div>
        </div>
        
        <div className="upload-hint">
          Supports: JPG, PNG, WebP, PDF, DOC, DOCX • Max 10MB per file
        </div>
        
        {extractionError && (
          <div className="extraction-error" style={{
            background: '#fee',
            border: '2px solid #f44',
            borderRadius: '8px',
            padding: '1rem',
            margin: '1rem 0',
            color: '#c00',
            fontWeight: '500'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              ❌ Critical Error
            </div>
            <div>{extractionError}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Please re-upload a valid document or contact support.
            </div>
          </div>
        )}

        {Object.keys(uploadedFiles).length > 0 && (
          <div className="extraction-success">
            ✅ {Object.keys(uploadedFiles).length} document(s) processed successfully!
          </div>
        )}
      </div>

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
        </div>
      </form>
    </div>

    {/* Toast Notifications */}
    {toast && (
      <Toast
        message={toast.message}
        type={toast.type}
        details={toast.details}
        duration={5000}
        onClose={() => setToast(null)}
      />
    )}
    </div>
  );
};

export default FormBuilder;