import { extractTextFromPDF, parsePassportDataFromText } from './pdfExtractor';
import { extractTextFromImage, parseGeminiResponse, validatePassportData } from './geminiVisionService';

// Helper function to convert file to base64
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

export interface ExtractedPassportData {
  // Common fields
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  
  // Passport specific fields
  passportNumber?: string;
  placeOfBirth?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  placeOfIssue?: string;
  surname?: string;
  givenName?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  address?: string;
  
  // Emirates ID specific fields
  emiratesIdNumber?: string;
  fullNameArabic?: string;
  firstNameEnglish?: string;
  lastNameEnglish?: string;
  firstNameArabic?: string;
  lastNameArabic?: string;
  emiratesResidence?: string;
  areaCode?: string;
  
  // VISA specific fields
  visaNumber?: string;
  visaReferenceNumber?: string;
  visaType?: string;
  visaCategory?: string;
  visaClass?: string;
  validFromDate?: string;
  validUntilDate?: string;
  durationOfStay?: string;
  portOfEntry?: string;
  purposeOfVisit?: string;
  sponsorInformation?: string;
  issuingCountry?: string;
  issuingAuthority?: string;
  issuingLocation?: string;
  entriesAllowed?: string;
  
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  documentType: 'passport' | 'passport-front' | 'passport-back' | 'passport-address' | 'passport-last' | 'emirates_id' | 'visa' | 'aadhar' | 'unknown';
  missingFields: string[];
  extractedFields: string[];
  confidence: number;
  message?: string;
  suggestion?: string;
}

// Smart field mapping to fix common misclassifications
function smartFieldMapping(extractedData: any): ExtractedPassportData {
  console.log('🔧 Running smart field mapping on:', extractedData);
  
  const mappedData = { ...extractedData };
  
  // Emirates ID number pattern detection and correction
  const emiratesIdPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
  
  // Check if passportNumber field contains Emirates ID number
  if (mappedData.passportNumber && emiratesIdPattern.test(mappedData.passportNumber)) {
    console.log('🔧 Found Emirates ID number in passportNumber field:', mappedData.passportNumber);
    
    // Move Emirates ID number to correct field
    mappedData.emiratesIdNumber = mappedData.passportNumber;
    // Clear the passport number field since it's not a real passport number
    mappedData.passportNumber = undefined;
    
    console.log('🔧 Moved to emiratesIdNumber field:', mappedData.emiratesIdNumber);
  }
  
  // Check for Emirates ID number in any other text field
  const allTextFields = [mappedData.fullName, mappedData.address, mappedData.placeOfIssue, mappedData.nationality];
  for (const field of allTextFields) {
    if (field && emiratesIdPattern.test(field)) {
      const match = field.match(emiratesIdPattern);
      if (match && !mappedData.emiratesIdNumber) {
        console.log('🔧 Found Emirates ID number in text field:', match[0]);
        mappedData.emiratesIdNumber = match[0];
      }
    }
  }
  
  // Passport number validation - should start with a letter followed by digits
  const passportPattern = /^[A-Z]\d{7,8}$/i;
  if (mappedData.passportNumber && !passportPattern.test(mappedData.passportNumber)) {
    console.log('🔧 Invalid passport number format detected:', mappedData.passportNumber);
    // Don't clear it entirely, but mark it for review
    if (!emiratesIdPattern.test(mappedData.passportNumber)) {
      console.log('🔧 Keeping invalid passport number for manual review');
    }
  }
  
  // VISA number detection in passport field
  const visaKeywords = ['visa', 'tourist', 'business', 'entry'];
  if (mappedData.passportNumber && 
      visaKeywords.some(keyword => 
        mappedData.passportNumber?.toLowerCase().includes(keyword))) {
    console.log('🔧 Found VISA-related content in passportNumber field');
    mappedData.visaNumber = mappedData.passportNumber;
    mappedData.passportNumber = undefined;
  }
  
  // Arabic name detection and mapping
  const arabicPattern = /[\u0600-\u06FF]/;
  if (mappedData.fullName && arabicPattern.test(mappedData.fullName)) {
    console.log('🔧 Detected Arabic text in fullName, mapping to fullNameArabic');
    if (!mappedData.fullNameArabic) {
      mappedData.fullNameArabic = mappedData.fullName;
    }
  }
  
  // ULTRA-AGGRESSIVE Emirates ID Detection
  if (!mappedData.emiratesIdNumber) {
    console.log('🔧 ULTRA-AGGRESSIVE SCAN: Starting comprehensive Emirates ID detection...');
    
    // Multiple pattern variations for Emirates ID
    const emiratesIdPatterns = [
      /\b\d{3}-\d{4}-\d{7}-\d{1}\b/,           // Standard: 784-1970-5109524-4
      /\b\d{3}\s*-\s*\d{4}\s*-\s*\d{7}\s*-\s*\d{1}\b/,  // With spaces
      /\b\d{15}\b/,                             // All digits together: 784197051095244
      /\b\d{3}\d{4}\d{7}\d{1}\b/,              // No separators: 784197051095244
      /ID.*?(\d{3}[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1})/i,  // Preceded by "ID"
      /Number.*?(\d{3}[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1})/i, // Preceded by "Number"
    ];
    
    // Scan ALL fields with ALL patterns
    for (const [key, value] of Object.entries(mappedData)) {
      if (typeof value === 'string' && value.trim()) {
        console.log(`🔧 Scanning field "${key}": "${value}"`);
        
        for (const pattern of emiratesIdPatterns) {
          const match = value.match(pattern);
          if (match) {
            let extractedId = match[1] || match[0]; // Use capture group if available
            
            // Clean up the extracted ID
            extractedId = extractedId.replace(/\s+/g, ''); // Remove spaces
            
            // Add hyphens if missing (for 15-digit format)
            if (/^\d{15}$/.test(extractedId)) {
              extractedId = `${extractedId.slice(0,3)}-${extractedId.slice(3,7)}-${extractedId.slice(7,14)}-${extractedId.slice(14)}`;
            }
            
            console.log(`🔧 ✅ FOUND Emirates ID in field "${key}":`, extractedId);
            mappedData.emiratesIdNumber = extractedId;
            break;
          }
        }
        
        if (mappedData.emiratesIdNumber) break;
      }
    }
    
    // If still not found, check for potential field name variations
    if (!mappedData.emiratesIdNumber) {
      console.log('🔧 Checking for Emirates ID in alternative field names...');
      const possibleIdFields = [
        'id', 'idNumber', 'ID', 'emiratesId', 'emirates_id', 'nationalId', 
        'identityNumber', 'cardNumber', 'documentNumber', 'residenceId',
        'uaeId', 'federalId', 'civilId', 'personalId'
      ];
      
      for (const fieldName of possibleIdFields) {
        const fieldValue = mappedData[fieldName];
        if (fieldValue && typeof fieldValue === 'string') {
          for (const pattern of emiratesIdPatterns) {
            const match = fieldValue.match(pattern);
            if (match) {
              let extractedId = match[1] || match[0];
              extractedId = extractedId.replace(/\s+/g, '');
              if (/^\d{15}$/.test(extractedId)) {
                extractedId = `${extractedId.slice(0,3)}-${extractedId.slice(3,7)}-${extractedId.slice(7,14)}-${extractedId.slice(14)}`;
              }
              console.log(`🔧 ✅ FOUND Emirates ID in alternative field "${fieldName}":`, extractedId);
              mappedData.emiratesIdNumber = extractedId;
              break;
            }
          }
          if (mappedData.emiratesIdNumber) break;
        }
      }
    }
  }
  
  console.log('🔧 Smart field mapping completed:', mappedData);
  console.log('🔧 Emirates ID Number final result:', mappedData.emiratesIdNumber);
  return mappedData;
}

// Overloaded function signatures
export async function extractPassportData(imageFile: File, pageType?: string): Promise<ExtractedPassportData>;
export async function extractPassportData(base64: string, mimeType: string, pageType?: string): Promise<ExtractedPassportData>;
export async function extractPassportData(imageFileOrBase64: File | string, mimeType?: string, pageType?: string): Promise<ExtractedPassportData> {
  console.log('🚀 === EXTRACT PASSPORT DATA START ===');
  console.log('🔍 Function called with pageType:', pageType);
  try {
    let base64Data: string;
    let finalMimeType: string;
    
    // Handle File object
    if (imageFileOrBase64 instanceof File) {
      const imageFile = imageFileOrBase64;
      
      // Handle PDF files
      if (imageFile.type === 'application/pdf') {
        console.log('Processing PDF:', imageFile.name);
        const pdfText = await extractTextFromPDF(imageFile);
        console.log('Extracted text from PDF:', pdfText.substring(0, 500) + '...');

        // Parse passport data from text
        const parsedData = parsePassportDataFromText(pdfText);

        // If we got some data, return it
        if (Object.keys(parsedData).length > 0) {
          return parsedData;
        }

        // If no structured data was found, throw an error
        throw new Error('Unable to extract passport data from PDF. The PDF might not contain passport information or the text might not be extractable.');
      }

      // Validate file type
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedTypes.includes(imageFile.type.toLowerCase())) {
        throw new Error(`Unsupported file type: ${imageFile.type}. Please upload an image file (JPG, PNG, etc.)`);
      }

      // Convert file to base64
      base64Data = await fileToBase64(imageFile);
      finalMimeType = imageFile.type;

      console.log('Processing image:', imageFile.name);
      console.log('File size:', imageFile.size, 'bytes');
      console.log('File type:', imageFile.type);
    } else {
      // Handle base64 string input
      base64Data = imageFileOrBase64;
      finalMimeType = mimeType || 'image/jpeg';
    }
    
    // Validate we have base64 data
    if (!base64Data || base64Data.trim() === '') {
      throw new Error('No image data available for processing');
    }
    
    try {
      // Use Gemini Vision API for text extraction with preprocessing
      console.log('Processing image with Gemini Vision API...');
      console.log('MIME type:', finalMimeType);
      console.log('Base64 data length:', base64Data.length);
      
      const extractionResult = await extractTextFromImage(
        base64Data, 
        finalMimeType,
        {
          enhanceContrast: true,
          resizeForOCR: true,
          denoiseImage: true,
          maxWidth: 1920,
          maxHeight: 1080
        }
      );
      console.log('Extraction completed in', extractionResult.processingTime, 'ms');
      
      if (extractionResult.confidence === 0) {
        // API failed, but let's try to extract what we can from the error response
        console.warn('Gemini Vision API had low confidence, attempting to parse any available data');
        // Don't immediately return mock data, continue processing
      }
      
      // Parse the Gemini response
      const parsedResponse = parseGeminiResponse(extractionResult.extractedText);
      console.log('Parsed Gemini response:', parsedResponse);
      
      // FORCE EMIRATES ID EXTRACTION: Final safety net to ensure Emirates ID is captured
      if (pageType === 'emirates_id' || pageType === 'visa') {
        console.log('🔧 FORCE EXTRACTION: Emirates ID document detected, forcing Emirates ID pattern search...');
        const allText = extractionResult.extractedText;
        const emiratesPattern = /\b\d{3}-?\d{4}-?\d{7}-?\d{1}\b/g;
        const matches = allText.match(emiratesPattern);
        
        if (matches && matches.length > 0) {
          // Clean up the first match
          let forcedEmiratesId = matches[0].replace(/-/g, '');
          if (forcedEmiratesId.length === 15) {
            forcedEmiratesId = `${forcedEmiratesId.slice(0,3)}-${forcedEmiratesId.slice(3,7)}-${forcedEmiratesId.slice(7,14)}-${forcedEmiratesId.slice(14)}`;
            console.log('🔧 FORCE EXTRACTION: ✅ FOUND Emirates ID pattern in raw text:', forcedEmiratesId);
            
            // Force it into the structured data
            if (!parsedResponse.structuredData) parsedResponse.structuredData = {};
            if (!parsedResponse.structuredData.emiratesIdNumber) {
              parsedResponse.structuredData.emiratesIdNumber = forcedEmiratesId;
              console.log('🔧 FORCE EXTRACTION: Forced emiratesIdNumber into structuredData');
            }
          }
        } else {
          console.log('🔧 FORCE EXTRACTION: ❌ No Emirates ID pattern found in raw text');
        }
      }
      
      // Validate and clean the extracted data
      const cleanedData = validatePassportData(parsedResponse.structuredData || {});
      
      // Smart field mapping to fix common misclassifications
      const smartMappedData = smartFieldMapping(cleanedData);
      
      // Combine with any additional extracted text data
      const extractedData: ExtractedPassportData = {
        ...smartMappedData,
        // Add fullName if not present but we have surname and givenName
        fullName: smartMappedData.fullName || 
                 (smartMappedData.surname && smartMappedData.givenName ? 
                  `${smartMappedData.surname} ${smartMappedData.givenName}` : undefined),
      };
      
      // Validate the extracted data with page type context
      console.log('🔍 About to call validateDocumentFields with:');
      console.log('   📊 extractedData:', extractedData);
      console.log('   🏷️ pageType:', pageType);
      
      const validation = validateDocumentFields(extractedData, pageType);
      
      console.log('✅ Validation result received:', validation);

      if (!validation.isValid) {
        console.warn('Document validation failed:', validation);

        // Throw error with specific guidance
        let errorMessage = 'Document validation failed. ';
        if (validation.documentType === 'unknown') {
          errorMessage += 'The uploaded document does not appear to be a valid passport, Emirates ID, visa, or Aadhar card. ';
        } else {
          errorMessage += `Detected document type: ${validation.documentType}. `;
        }

        if (validation.missingFields.length > 0) {
          errorMessage += `Missing required fields: ${validation.missingFields.join(', ')}. `;
        }

        errorMessage += validation.suggestion || 'Please upload a clear image of the correct document page.';

        throw new Error(errorMessage);
      }

      // If we didn't extract much data, log the raw text for debugging
      if (Object.keys(extractedData).length < 3) {
        console.log('Limited data extracted. Raw text:', extractionResult.extractedText.substring(0, 500));
        console.warn('Minimal data extracted from image. The image might be unclear or in an unsupported format.');

        // Return what we have instead of mock data
        if (Object.keys(extractedData).length > 0) {
          return extractedData;
        }

        // Only return error message if absolutely no data was extracted
        throw new Error('Unable to extract passport data from the image. Please ensure the image is clear and contains passport information.');
      }

      return extractedData;

    } catch (error) {
      console.error('Error in Gemini Vision API processing:', error);
      // Instead of returning mock data, throw the error to be handled by the UI
      throw new Error(`Failed to extract passport data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error extracting passport data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to extract passport data. Please try again.');
  }
}



// Map extracted passport fields to form fields
export function mapPassportToFormFields(passportData: ExtractedPassportData, formData: any): any {
  const updatedFormData = { ...formData };
  
  console.log('=== STARTING FIELD MAPPING ===');
  console.log('Mapping passport data:', passportData);
  console.log('Current form data keys:', Object.keys(formData));
  console.log('Form data sample:', Object.keys(formData).slice(0, 10));
  
  // Map passport fields to ORMA form fields (using actual generated field keys)
  const fieldMappings: { [key: string]: string[] } = {
    // Name fields - multiple possible field keys for each
    fullName: ['Applicant_Full_Name_in_CAPITAL', 'APPLICANT_NAME', 'Full_Name', 'Applicant_Full_Name'],
    surname: ['Last_Name', 'Surname'],
    givenName: ['First_Name', 'Given_Name'],

    // Personal details
    dateOfBirth: ['Date_of_Birth', 'DOB'],

    // Passport details
    passportNumber: ['Passport_Number', 'Passport_No'],
    dateOfIssue: ['Passport_Issue_Date', 'Date_of_Issue', 'Issue_Date'],
    dateOfExpiry: ['Passport_Expiry_Date', 'Date_of_Expiry', 'Expiry_Date'],
    placeOfIssue: ['Passport_Issued_Place', 'Place_of_Issue', 'Issue_Place', 'Passport_issued_Place'],

    // Family details - using actual field keys from form
    fatherName: ['Father/Guardian_Name', 'Father_Guardian_Name', 'Father_Name'],
    motherName: ['Mother_Name', 'Mother'],
    spouseName: ['Spouse_Name', 'Spouse'],

    // Address
    address: ['Permanent_Residence_Address', 'Address', 'Residence_Address'],
    pinCode: ['PIN_Code', 'Pincode', 'PIN'],
    
    // Emirates ID specific fields
    emiratesIdNumber: ['Emirates_ID_Number', 'ID_Number', 'KSHEMANIDHI_ID_NUMBER', 'Emirates_ID', 'ID_No'],
    fullNameArabic: ['Full_Name_Arabic', 'Name_Arabic', 'Arabic_Name'],
    firstNameEnglish: ['First_Name_English', 'First_Name'],
    lastNameEnglish: ['Last_Name_English', 'Last_Name'],
    firstNameArabic: ['First_Name_Arabic'],
    lastNameArabic: ['Last_Name_Arabic'],
    emiratesResidence: ['Emirates_Residence', 'Residence_Emirate'],
    areaCode: ['Area_Code'],
    
    // VISA specific fields  
    visaNumber: ['VISA_Number', 'Visa_No'],
    visaType: ['VISA_Type', 'Visa_Type'],
    visaCategory: ['VISA_Category'],
    portOfEntry: ['Port_of_Entry'],
    purposeOfVisit: ['Purpose_of_Visit'],
    sponsorInformation: ['Sponsor_Information', 'Sponsor_Details'],
    durationOfStay: ['Duration_of_Stay'],
    entriesAllowed: ['Entries_Allowed'],
    issuingCountry: ['Issuing_Country'],
  };
  
  console.log('Available form field keys:', Object.keys(formData));
  console.log('Field mappings being used:', fieldMappings);
  
  // Apply field mappings
  Object.entries(passportData).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.trim()) {
      const cleanValue = value.toString().trim();
      console.log(`\nProcessing passport field: ${key} = "${cleanValue}"`);
      
      // Direct field mapping - now handles array of possible field names
      const mappedFieldNames = fieldMappings[key];
      console.log(`Looking for mapped field names: ${mappedFieldNames}`);
      
      if (mappedFieldNames && Array.isArray(mappedFieldNames)) {
        // Try each possible field name
        let fieldMapped = false;
        for (const mappedFieldName of mappedFieldNames) {
          console.log(`Checking if form has field: ${mappedFieldName}`);
          
          // Check both the mapped field name and the field without special characters
          const fieldExists = updatedFormData.hasOwnProperty(mappedFieldName) || 
                            Object.keys(updatedFormData).some(k => k === mappedFieldName);
          
          console.log(`Form has property "${mappedFieldName}": ${fieldExists}`);
          
          if (fieldExists) {
            // Special handling for fields that need to be in CAPITAL
            if (mappedFieldName === 'Applicant_Full_Name_in_CAPITAL' || mappedFieldName === 'APPLICANT_NAME') {
              updatedFormData[mappedFieldName] = cleanValue.toUpperCase();
              console.log(`✅ SUCCESS: Mapped ${key} -> ${mappedFieldName}: "${cleanValue.toUpperCase()}" (converted to UPPERCASE)`);
            } else {
              updatedFormData[mappedFieldName] = cleanValue;
              console.log(`✅ SUCCESS: Mapped ${key} -> ${mappedFieldName}: "${cleanValue}"`);
            }
            fieldMapped = true;
            break; // Stop after first successful mapping
          }
        }
        
        if (!fieldMapped) {
          console.log(`❌ FAILED: None of ${mappedFieldNames} found in form data`);
          console.log(`Available form fields:`, Object.keys(updatedFormData));
          
          // Try to find a similar field with different formatting
          const similarField = Object.keys(updatedFormData).find(k => {
            const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return mappedFieldNames.some(targetName => {
              const normalizedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normalizedKey === normalizedTarget;
            });
          });
          
          if (similarField) {
            updatedFormData[similarField] = cleanValue;
            console.log(`✅ FALLBACK SUCCESS: Mapped ${key} -> ${similarField}: "${cleanValue}"`);
          }
        }
      } else {
        console.log(`No direct mapping found for ${key}, trying auto-match...`);
        
        // Enhanced auto-matching logic
        const formKeys = Object.keys(formData);
        const matchingKey = formKeys.find(formKey => {
          const lowerFormKey = formKey.toLowerCase();
          
          // Enhanced matching patterns
          if (key === 'fatherName' && (lowerFormKey.includes('father') || lowerFormKey.includes('guardian'))) return true;
          if (key === 'address' && lowerFormKey.includes('address') && lowerFormKey.includes('permanent')) return true;
          if (key === 'pinCode' && lowerFormKey.includes('pin')) return true;
          if (key === 'fullName' && lowerFormKey.includes('applicant') && lowerFormKey.includes('name')) return true;
          if (key === 'givenName' && lowerFormKey.includes('first') && lowerFormKey.includes('name')) return true;
          if (key === 'surname' && lowerFormKey.includes('last') && lowerFormKey.includes('name')) return true;
          if (key === 'passportNumber' && lowerFormKey.includes('passport') && lowerFormKey.includes('number')) return true;
          if (key === 'dateOfBirth' && lowerFormKey.includes('date') && lowerFormKey.includes('birth')) return true;
          
          return false;
        });
        
        if (matchingKey) {
          updatedFormData[matchingKey] = cleanValue;
          console.log(`✅ AUTO-MATCHED: ${key} -> ${matchingKey}: "${cleanValue}"`);
        } else {
          console.log(`❌ NO MATCH: Could not find form field for ${key}`);
        }
      }
    }
  });
  
  console.log('Final mapped form data:', updatedFormData);
  return updatedFormData;
}

// Validate if the document contains expected fields based on document type
export function validateDocumentFields(extractedData: ExtractedPassportData, pageType?: string): ValidationResult {
  console.log('🚀 === VALIDATION START ===');
  console.log('🔍 Input pageType:', pageType);
  console.log('📊 Extracted data keys:', Object.keys(extractedData));
  console.log('📊 Extracted data values:', extractedData);
  
  // COMPREHENSIVE FIX: Handle address/last pages properly
  if (pageType) {
    const normalizedPageType = pageType.toLowerCase();
    console.log('🆘 PAGE TYPE OVERRIDE ACTIVATED for:', pageType);
    
    if (normalizedPageType.includes('address') || normalizedPageType.includes('last')) {
      console.log('✅ ADDRESS/LAST PAGE: Skipping dateOfBirth requirement');
      return {
        isValid: true,
        documentType: 'passport-address',
        missingFields: [],
        extractedFields: Object.keys(extractedData).filter(key => extractedData[key] && extractedData[key] !== ''),
        confidence: 1.0,
        message: 'Address/last page validated successfully - dateOfBirth not required',
        suggestion: 'Address page processing complete'
      };
    }
  }
  
  // ADDITIONAL FALLBACK: If validation detects passport but missing dateOfBirth, check if it might be address page
  const extractedFields = Object.keys(extractedData).filter(key => extractedData[key] && extractedData[key] !== '');
  const hasAddressData = extractedFields.some(field => 
    field.toLowerCase().includes('address') || 
    field.toLowerCase().includes('pin') || 
    field.toLowerCase().includes('district') ||
    field.toLowerCase().includes('emergency')
  );
  
  if (hasAddressData && !extractedData.dateOfBirth) {
    console.log('🔍 DETECTED ADDRESS PAGE: Has address data but no dateOfBirth - treating as address page');
    return {
      isValid: true,
      documentType: 'passport-address',
      missingFields: [],
      extractedFields,
      confidence: 0.9,
      message: 'Auto-detected as address page - dateOfBirth not required',
      suggestion: 'Address page processing complete'
    };
  }
  
  console.log('✅ Non-empty extracted fields:', extractedFields);
  console.log('📝 DEBUG: Full extracted data object:', extractedData);

  // Define required fields for each document type with page-specific rules
  const documentRequirements = {
    // Page-specific passport types (used when pageType is explicitly provided)
    'passport-front': {
      required: ['fullName', 'dateOfBirth', 'nationality'],
      optional: ['passportNumber', 'surname', 'givenName', 'dateOfIssue', 'dateOfExpiry', 'placeOfBirth', 'placeOfIssue', 'gender'],
      identifiers: ['passportNumber']
    },
    'passport-address': {
      required: ['fullName'], // Address pages don't have dateOfBirth
      optional: ['passportNumber', 'address', 'emergencyContact', 'phone', 'email', 'surname', 'givenName'],
      identifiers: ['passportNumber', 'fullName']
    },
    'passport-last': {
      required: ['fullName'], // Last pages don't have dateOfBirth
      optional: ['passportNumber', 'address', 'emergencyContact', 'phone', 'email', 'surname', 'givenName'],
      identifiers: ['passportNumber', 'fullName']
    },
    'passport-back': {
      required: ['fullName'],
      optional: ['passportNumber', 'family', 'spouse', 'children', 'dateOfBirth', 'nationality'],
      identifiers: ['passportNumber', 'fullName']
    },
    // General document types (used for auto-detection scoring only)
    passport: {
      required: ['fullName', 'dateOfBirth', 'nationality'],
      optional: ['passportNumber', 'surname', 'givenName', 'dateOfIssue', 'dateOfExpiry', 'placeOfBirth', 'placeOfIssue', 'gender'],
      identifiers: ['passportNumber']
    },
    emirates_id: {
      required: ['fullName'], // Only fullName is truly required, dateOfBirth can be optional
      optional: ['emiratesIdNumber', 'dateOfBirth', 'nationality', 'fullNameArabic', 'firstNameEnglish', 'lastNameEnglish', 
                'firstNameArabic', 'lastNameArabic', 'emiratesResidence', 'areaCode', 'dateOfExpiry', 'gender'],
      identifiers: ['emiratesIdNumber']
    },
    visa: {
      required: ['fullName'],
      optional: ['visaNumber', 'visaReferenceNumber', 'visaType', 'visaCategory', 'visaClass',
                'passportNumber', 'nationality', 'dateOfBirth', 'dateOfIssue', 'dateOfExpiry',
                'validFromDate', 'validUntilDate', 'durationOfStay', 'portOfEntry', 'purposeOfVisit',
                'sponsorInformation', 'issuingCountry', 'issuingAuthority', 'issuingLocation', 'entriesAllowed'],
      identifiers: ['visaNumber', 'visaType']
    },
    aadhar: {
      required: ['fullName', 'dateOfBirth'],
      optional: ['aadharNumber', 'address', 'gender'],
      identifiers: ['aadharNumber']
    }
  };

  // Determine document type based on extracted fields and pageType
  let documentType: 'passport' | 'passport-front' | 'passport-address' | 'passport-last' | 'passport-back' | 'emirates_id' | 'visa' | 'aadhar' | 'unknown' = 'unknown';
  let pageTypeExplicitlySet = false;
  
  console.log('🛤️ === DOCUMENT TYPE DETERMINATION ===');
  
  // EXPLICIT PAGETYPE PATH: If pageType is provided, use it directly (NO SCORING)
  if (pageType) {
    const normalizedPageType = pageType.toLowerCase();
    console.log('🎯 EXPLICIT PATH: PageType provided:', pageType, '-> normalized:', normalizedPageType);
    
    if (normalizedPageType.includes('address') || normalizedPageType.includes('last')) {
      documentType = 'passport-address';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = passport-address (bypassing all scoring)');
    } else if (normalizedPageType.includes('back')) {
      documentType = 'passport-back';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = passport-back (bypassing all scoring)');
    } else if (normalizedPageType.includes('front') || normalizedPageType.includes('main')) {
      documentType = 'passport-front';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = passport-front (bypassing all scoring)');
    } else if (normalizedPageType.includes('emirates') || normalizedPageType === 'emirates_id') {
      documentType = 'emirates_id';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = emirates_id (bypassing all scoring)');
    } else if (normalizedPageType.includes('visa') || normalizedPageType === 'visa') {
      documentType = 'visa';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = visa (bypassing all scoring)');
    } else if (normalizedPageType.includes('passport')) {
      documentType = 'passport';
      pageTypeExplicitlySet = true;
      console.log('✅ EXPLICIT: DocumentType FINAL = passport (bypassing all scoring)');
    } else {
      console.log('⚠️ EXPLICIT: Unknown pageType, falling back to auto-detection');
    }
  } else {
    console.log('🤖 AUTO-DETECTION PATH: No pageType provided, will run scoring algorithm');
  }
  let maxScore = 0;
  const minScoreThreshold = 10; // Minimum score to consider a document type

  // AUTO-DETECTION PATH: Only run scoring if no explicit pageType was provided
  if (!pageTypeExplicitlySet) {
    console.log('🤖 AUTO-DETECTION: Running scoring algorithm to determine documentType');
    
    // Only score general document types (exclude page-specific types from scoring)
    const generalDocumentTypes = {
      passport: documentRequirements.passport,
      emirates_id: documentRequirements.emirates_id,
      visa: documentRequirements.visa,
      aadhar: documentRequirements.aadhar
    };
    
    for (const [type, requirements] of Object.entries(generalDocumentTypes)) {
      const typeKey = type as keyof typeof generalDocumentTypes;
      let score = 0;

      console.log('📊 Scoring type:', typeKey);
      
      // Check for identifying fields
      for (const identifier of requirements.identifiers) {
        if (extractedFields.includes(identifier)) {
          score += 10; // High weight for identifiers
          console.log('  ✅ Identifier found:', identifier, '+10 points');
        }
      }
      
      // Special pattern matching for Emirates ID
      if (typeKey === 'emirates_id') {
        const emiratesIdPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
        const allValues = Object.values(extractedData).join(' ');
        if (emiratesIdPattern.test(allValues)) {
          score += 15; // Higher weight for Emirates ID pattern
          console.log('  ✅ Emirates ID pattern detected in data:', '+15 points');
        }
        
        // Check for Arabic text
        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(allValues)) {
          score += 8; // Extra points for Arabic text
          console.log('  ✅ Arabic text detected:', '+8 points');
        }
        
        // Check for UAE-related keywords
        const uaeKeywords = ['emirates', 'uae', 'federal authority', 'identity card'];
        const lowercaseValues = allValues.toLowerCase();
        for (const keyword of uaeKeywords) {
          if (lowercaseValues.includes(keyword)) {
            score += 5;
            console.log('  ✅ UAE keyword found:', keyword, '+5 points');
            break; // Only count once
          }
        }
      }

      // Check for required fields
      for (const field of requirements.required) {
        if (extractedFields.includes(field)) {
          score += 5;
          console.log('  ✅ Required field found:', field, '+5 points');
        }
      }

      // Check for optional fields
      for (const field of requirements.optional) {
        if (extractedFields.includes(field)) {
          score += 2;
          console.log('  ✅ Optional field found:', field, '+2 points');
        }
      }

      console.log('  📊 Total score for', typeKey + ':', score);
      
      if (score > maxScore && score >= minScoreThreshold) {
        maxScore = score;
        documentType = typeKey as any;
        console.log('  🏆 NEW BEST SCORE:', score, 'for type:', typeKey);
      }
    }
    console.log('🏁 AUTO-DETECTION Final result - documentType:', documentType, 'maxScore:', maxScore);
  } else {
    console.log('⏭️ SKIPPING SCORING: pageType was explicitly set, using explicit documentType:', documentType);
  }

  // AUTO-DETECTION FALLBACKS: Only apply if no explicit pageType was set
  if (!pageTypeExplicitlySet) {
    // Special check for passport number to ensure it's a passport type
    if (extractedData.passportNumber && extractedData.passportNumber.length > 5 && documentType === 'unknown') {
      documentType = 'passport'; // Always use general passport for auto-detection
      console.log('🔑 AUTO-DETECTION: Passport number detected, setting documentType to passport');
    }

    // If we only have basic fields like name and address, it's likely not a valid document
    if (maxScore < minScoreThreshold) {
      console.log('⚠️ AUTO-DETECTION: Score below threshold, setting documentType to unknown');
      documentType = 'unknown';
    }
  } else {
    console.log('🛡️ PROTECTION: Explicit pageType set, skipping all fallback logic');
  }

  console.log('🔍 === VALIDATION PHASE ===');
  console.log('🎯 Final documentType for validation:', documentType);
  console.log('🔐 pageTypeExplicitlySet:', pageTypeExplicitlySet);
  
  // Validate based on detected document type
  let isValid = false;
  let missingFields: string[] = [];
  let confidence = 0;
  let suggestion = '';

  if (documentType !== 'unknown') {
    const requirements = documentRequirements[documentType as keyof typeof documentRequirements];
    
    if (!requirements) {
      console.error('❌ ERROR: No requirements found for documentType:', documentType);
      console.log('📋 Available types:', Object.keys(documentRequirements));
      return {
        isValid: false,
        documentType: 'unknown',
        missingFields: [],
        extractedFields,
        confidence: 0,
        message: 'Internal error: Invalid document type',
        suggestion: 'Please contact support - invalid document type detected'
      };
    }
    
    missingFields = requirements.required.filter(field => !extractedFields.includes(field));
    console.log('📋 VALIDATION DETAILS:');
    console.log('  📋 Document Type:', documentType);
    console.log('  📋 Required fields:', requirements.required);
    console.log('  📋 Missing fields:', missingFields);
    console.log('  📋 Extracted fields:', extractedFields);

    // Calculate confidence based on extracted fields
    const totalExpectedFields = requirements.required.length + requirements.optional.length;
    const extractedRelevantFields = extractedFields.filter(field =>
      requirements.required.includes(field) || requirements.optional.includes(field)
    ).length;
    
    confidence = extractedRelevantFields / totalExpectedFields;

    // Special validation logic for Emirates ID
    if (documentType === 'emirates_id') {
      // Emirates ID is valid if it has emiratesIdNumber OR fullName
      const hasEmiratesId = extractedFields.includes('emiratesIdNumber') || 
                           Object.values(extractedData).some(val => 
                             val && /\b\d{3}-\d{4}-\d{7}-\d{1}\b/.test(val));
      const hasName = extractedFields.includes('fullName');
      
      isValid = hasEmiratesId || hasName;
      console.log('🆔 EMIRATES ID SPECIAL VALIDATION:');
      console.log('  hasEmiratesId:', hasEmiratesId);
      console.log('  hasName:', hasName);
      console.log('  isValid:', isValid);
      
      if (!isValid) {
        suggestion = 'Emirates ID validation failed: Please ensure the image contains either the Emirates ID number or the name clearly visible.';
      }
    } else {
      // Standard validation for other document types
      // Document is valid if it has at least 75% of required fields
      isValid = missingFields.length < Math.ceil(requirements.required.length * 0.25);
    }
    
    // EXPLICIT PAGEYPE VALIDATION: Apply lenient validation for page-specific types
    if (pageTypeExplicitlySet && documentType.startsWith('passport-')) {
      console.log('🎯 EXPLICIT VALIDATION: Applying page-specific validation rules');
      
      if ((documentType === 'passport-address' || documentType === 'passport-last')) {
        console.log('📄 ADDRESS/LAST PAGE: Applying lenient validation');
        // For address/last pages, be very lenient - only need basic identifying info
        if (extractedData.fullName || extractedData.passportNumber) {
          console.log('✅ ADDRESS PAGE OVERRIDE: Found identifying info, marking as valid');
          isValid = true;
          missingFields = []; // Clear missing fields for address pages
        } else {
          console.log('⚠️ ADDRESS PAGE: No identifying info found');
        }
      }
    } else if (!isValid && missingFields.length > 0) {
      console.log('🤖 AUTO-DETECTION: Standard validation failed, checking fallbacks');
    }

    // Generate suggestions based on document type and missing fields
    if (!isValid) {
      if (documentType === 'passport') {
        if (missingFields.includes('passportNumber')) {
          suggestion = '❌ Wrong Page: Please upload the main passport page with your photo and passport number (usually pages 1-2), not the address or visa pages.';
        } else if (missingFields.includes('fullName')) {
          suggestion = '⚠️ Poor Quality: The image quality may be poor or text is not readable. Please upload a clearer, well-lit photo of the passport data page.';
        } else {
          suggestion = '⚠️ Incomplete Data: Essential passport information is missing. Please upload the main passport page with photo and personal details.';
        }
      } else if (documentType === 'emirates_id') {
        suggestion = '📋 Emirates ID: Please upload both front and back sides of the Emirates ID for complete information.';
      } else if (documentType === 'visa') {
        suggestion = '📋 Visa Page: Please upload the visa page with all visa details, stamps, and validity dates clearly visible.';
      } else if (documentType === 'aadhar') {
        suggestion = '📋 Aadhar Card: Please upload both front and back sides of the Aadhar card with all details clearly visible.';
      }
    }
  } else {
    // Unknown document type
    isValid = false;
    confidence = 0;
    suggestion = '❌ Invalid Document: The uploaded image does not appear to be a valid passport, Emirates ID, visa, or Aadhar card.';

    // Check if it might be the wrong page and provide specific guidance
    if (extractedFields.length > 0) {
      if (extractedFields.some(field => field.includes('address'))) {
        suggestion = '❌ Wrong Page Uploaded: This appears to be the address/last page of passport. For passports, please upload the FIRST PAGE with your photo, passport number, and personal details.';
      } else if (extractedFields.some(field => field.includes('stamp') || field.includes('visa'))) {
        suggestion = '❌ Wrong Page Uploaded: This appears to be a visa/stamp page. Please upload the MAIN PASSPORT PAGE (pages 1-2) with your photo and passport number.';
      } else if (extractedData.fullName && !extractedData.passportNumber) {
        suggestion = '⚠️ Partial Information: Name detected but passport number is missing. Please ensure you upload the page with the passport number clearly visible.';
      }
    } else {
      suggestion = '❌ No Valid Information Found: The image may be blurry, upside down, or not a valid document. Please ensure:\n• The document is clearly visible\n• Photo is well-lit and in focus\n• Upload the correct page (passport data page with photo)';
    }
  }

  console.log('🏁 === VALIDATION COMPLETE ===');
  console.log('✅ Final Results:');
  console.log('  🎯 Document Type:', documentType);
  console.log('  ✅ Is Valid:', isValid);
  console.log('  ❌ Missing Fields:', missingFields);
  console.log('  📊 Confidence:', confidence);
  console.log('  💡 Suggestion:', suggestion);
  console.log('  🔐 PageType Explicitly Set:', pageTypeExplicitlySet);
  console.log('🚀 === END VALIDATION ===');

  const result = {
    isValid,
    documentType,
    missingFields,
    extractedFields,
    confidence,
    message: isValid ? 'Document validated successfully' : 'Document validation failed',
    suggestion
  };
  
  console.log('📦 Returning validation result:', result);
  return result;
}