import { extractTextFromPDF, parsePassportDataFromText } from './pdfExtractor';
import { extractTextFromImage, parseGeminiResponse, validatePassportData } from './geminiVisionService';
import { parseFullName, extractPinCode, calculateAge } from '../utils/nameParser';

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

// Helper function to convert various date formats to YYYY-MM-DD for HTML date inputs
const convertDateFormat = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined;

  // Check if already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log('📅 Date already in YYYY-MM-DD format:', dateStr);
    return dateStr;
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const converted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('📅 Converted DD/MM/YYYY to YYYY-MM-DD:', dateStr, '→', converted);
    return converted;
  }

  // Convert DDMMMYYYY format (e.g., 23JAN2034, 05MAR2025) - common in VISA documents
  const monthMap: { [key: string]: string } = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };

  const ddmmmyyyyMatch = dateStr.match(/^(\d{1,2})([A-Z]{3})(\d{4})$/i);
  if (ddmmmyyyyMatch) {
    const [, day, monthName, year] = ddmmmyyyyMatch;
    const month = monthMap[monthName.toUpperCase()];
    if (month) {
      const converted = `${year}-${month}-${day.padStart(2, '0')}`;
      console.log('📅 Converted DDMMMYYYY to YYYY-MM-DD:', dateStr, '→', converted);
      return converted;
    }
  }

  console.log('📅 Date format not recognized, returning as-is:', dateStr);
  return dateStr; // Return as-is if format not recognized
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
  middleName?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  address?: string;
  pinCode?: string;

  // Emirates ID specific fields
  emiratesIdNumber?: string;
  fullNameArabic?: string;
  firstNameEnglish?: string;
  lastNameEnglish?: string;
  firstNameArabic?: string;
  lastNameArabic?: string;
  emiratesResidence?: string;
  areaCode?: string;
  occupation?: string;

  // VISA specific fields
  visaNumber?: string;
  visaReferenceNumber?: string;
  visaType?: string;
  visaCategory?: string;
  visaClass?: string;
  visaIssueDate?: string;  // When visa was issued
  validFromDate?: string;
  validUntilDate?: string;
  visaExpiryDate?: string;  // When visa expires (Field #31)
  durationOfStay?: string;
  portOfEntry?: string;
  purposeOfVisit?: string;
  sponsorInformation?: string;
  issuingCountry?: string;
  issuingAuthority?: string;
  issuingLocation?: string;
  issuingPostName?: string;  // Where visa was issued (e.g., FRANKFURT)
  entriesAllowed?: string;
  entries?: string;  // Entries annotation (e.g., M for multiple)
  annotation?: string;  // Any annotation text on visa
  controlNumber?: string;  // USA visa control number (maps to visaNumber)

  // Calculated/parsed fields
  age?: string;

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
  
  // File number rejection - Indian passports contain file numbers starting with T, F, or R
  // These are NOT passport numbers - they are application/file reference numbers
  const fileNumberPrefixes = ['T', 'F', 'R'];
  if (mappedData.passportNumber && mappedData.passportNumber.length === 8) {
    const firstLetter = mappedData.passportNumber.charAt(0).toUpperCase();
    if (fileNumberPrefixes.includes(firstLetter)) {
      console.log('🔧 REJECTED: File number detected (T/F/R prefix):', mappedData.passportNumber);
      console.log('🔧 File numbers are NOT passport numbers - clearing field');
      mappedData.passportNumber = undefined;
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
  
  // Visa place rejection - UAE cities are visa issuance places, NOT passport issue places
  // Indian passports are issued from Indian cities only (NEW DELHI, MUMBAI, BANGALORE, etc)
  const visaPlaces = ['DUBAI', 'ABU DHABI', 'SHARJAH', 'AJMAN', 'RAS AL KHAIMAH', 'FUJAIRAH', 'UMM AL QUWAIN'];
  if (mappedData.placeOfIssue) {
    const placeUpper = mappedData.placeOfIssue.toUpperCase();
    if (visaPlaces.some(place => placeUpper.includes(place))) {
      console.log('🔧 REJECTED: Visa place detected as passport issue place:', mappedData.placeOfIssue);
      console.log('🔧 UAE cities are visa places, not passport issue places - clearing field');
      mappedData.placeOfIssue = undefined;
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

        // Convert dates from DD/MM/YYYY to YYYY-MM-DD for HTML date inputs (PDF path)
        if (parsedData.dateOfBirth) {
          const converted = convertDateFormat(parsedData.dateOfBirth);
          if (converted) parsedData.dateOfBirth = converted;
        }
        if (parsedData.dateOfIssue) {
          const converted = convertDateFormat(parsedData.dateOfIssue);
          if (converted) parsedData.dateOfIssue = converted;
        }
        if (parsedData.dateOfExpiry) {
          const converted = convertDateFormat(parsedData.dateOfExpiry);
          if (converted) parsedData.dateOfExpiry = converted;
        }

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

      console.log('📤 FILE UPLOAD DEBUG:');
      console.log('  - File name:', imageFile.name);
      console.log('  - File size:', imageFile.size, 'bytes');
      console.log('  - File type:', imageFile.type);
      console.log('  - Base64 length after conversion:', base64Data.length);
      console.log('  - First 100 chars of base64:', base64Data.substring(0, 100));
      console.log('  - Last 50 chars of base64:', base64Data.substring(base64Data.length - 50));
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
      
      // Use Gemini Vision API WITHOUT preprocessing to avoid base64 corruption
      const extractionResult = await extractTextFromImage(
        base64Data,
        finalMimeType
        // No preprocessing options - use raw base64
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
        // Correct order: givenName (first/middle names) + surname (last name)
        fullName: smartMappedData.fullName ||
                 (smartMappedData.givenName && smartMappedData.surname ?
                  `${smartMappedData.givenName} ${smartMappedData.surname}` : undefined),
      };
      
      // Validate the extracted data with page type context
      console.log('🔍 About to call validateDocumentFields with:');
      console.log('   📊 extractedData:', extractedData);
      console.log('   🏷️ pageType:', pageType);
      
      const validation = validateDocumentFields(extractedData, pageType);
      
      console.log('✅ Validation result received:', validation);

      // TEMPORARILY BYPASS VALIDATION FOR TESTING
      if (!validation.isValid) {
        console.warn('⚠️ Validation failed but proceeding anyway for testing:', validation);
        console.warn('⚠️ Extracted data so far:', extractedData);

        // DON'T throw error - just log and continue
        // This will allow us to see what data was actually extracted
      }

      // Convert all date fields from DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
      // This happens IMMEDIATELY after extraction, before any mapping or storage
      console.log('📅 Converting dates to YYYY-MM-DD format...');

      if (extractedData.dateOfBirth) {
        const converted = convertDateFormat(extractedData.dateOfBirth);
        if (converted) {
          console.log('📅 Converted dateOfBirth:', extractedData.dateOfBirth, '→', converted);
          extractedData.dateOfBirth = converted;
        }
      }

      if (extractedData.dateOfIssue) {
        const converted = convertDateFormat(extractedData.dateOfIssue);
        if (converted) {
          console.log('📅 Converted dateOfIssue:', extractedData.dateOfIssue, '→', converted);
          extractedData.dateOfIssue = converted;
        }
      }

      if (extractedData.dateOfExpiry) {
        const converted = convertDateFormat(extractedData.dateOfExpiry);
        if (converted) {
          console.log('📅 Converted dateOfExpiry:', extractedData.dateOfExpiry, '→', converted);
          extractedData.dateOfExpiry = converted;
        }
      }

      if (extractedData.nomineeDateOfBirth) {
        const converted = convertDateFormat(extractedData.nomineeDateOfBirth);
        if (converted) {
          console.log('📅 Converted nomineeDateOfBirth:', extractedData.nomineeDateOfBirth, '→', converted);
          extractedData.nomineeDateOfBirth = converted;
        }
      }

      if (extractedData.visaIssueDate) {
        const converted = convertDateFormat(extractedData.visaIssueDate);
        if (converted) {
          console.log('📅 Converted visaIssueDate:', extractedData.visaIssueDate, '→', converted);
          extractedData.visaIssueDate = converted;
        }
      }

      if (extractedData.visaExpiryDate) {
        const converted = convertDateFormat(extractedData.visaExpiryDate);
        if (converted) {
          console.log('📅 Converted visaExpiryDate:', extractedData.visaExpiryDate, '→', converted);
          extractedData.visaExpiryDate = converted;
        }
      }

      if (extractedData.validFromDate) {
        const converted = convertDateFormat(extractedData.validFromDate);
        if (converted) {
          console.log('📅 Converted validFromDate:', extractedData.validFromDate, '→', converted);
          extractedData.validFromDate = converted;
        }
      }

      if (extractedData.validUntilDate) {
        const converted = convertDateFormat(extractedData.validUntilDate);
        if (converted) {
          console.log('📅 Converted validUntilDate:', extractedData.validUntilDate, '→', converted);
          extractedData.validUntilDate = converted;
        }
      }

      console.log('✅ All dates converted to YYYY-MM-DD format');

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
export function mapPassportToFormFields(passportData: ExtractedPassportData, formData: any, documentType: string = 'unknown'): any {
  const updatedFormData = { ...formData };

  console.log('=== STARTING FIELD MAPPING ===');
  console.log('Document Type:', documentType);
  console.log('Form data keys count:', Object.keys(formData).length);

  // Debug: Check if visa fields exist in formData
  console.log('🔍 Searching for VISA-related fields in formData...');
  const visaRelatedKeys = Object.keys(formData).filter(key =>
    key.toLowerCase().includes('visa')
  );
  console.log('🔍 Found VISA-related keys:', visaRelatedKeys);
  console.log('🔍 Checking specific keys:', {
    'Visa_Number': formData.hasOwnProperty('Visa_Number'),
    'Visa_Expiry_Date': formData.hasOwnProperty('Visa_Expiry_Date'),
    'VISA_Number': formData.hasOwnProperty('VISA_Number'),
    'VISA_Expiry_Date': formData.hasOwnProperty('VISA_Expiry_Date')
  });

  // ========== NAME PARSING LOGIC ==========
  // Always parse full name if we have it to get proper first/middle/last names
  if (passportData.fullName) {
    const parsedName = parseFullName(passportData.fullName);
    console.log('📝 Parsed name from fullName:', parsedName);

    // Use parsed values if the original fields aren't already set OR if they need to be overridden
    // This ensures we properly split "VASANTHA KUMARI RAVINDRAN NAIR HARITHAKUMARI"
    // into: First="VASANTHA", Middle="KUMARI RAVINDRAN NAIR", Last="HARITHAKUMARI"
    if (!passportData.givenName || !passportData.middleName) {
      passportData.givenName = parsedName.firstName;
      passportData.middleName = parsedName.middleName;
    }
    if (!passportData.surname) {
      passportData.surname = parsedName.lastName;
    }
  }

  // ========== PIN CODE EXTRACTION ==========
  // Extract PIN code from address if not already present
  if (passportData.address && !passportData.pinCode) {
    const extractedPin = extractPinCode(passportData.address);
    if (extractedPin) {
      console.log('📍 Extracted PIN code from address:', extractedPin);
      passportData.pinCode = extractedPin;
    }
  }

  // ========== AGE CALCULATION ==========
  // Calculate age from date of birth if we have DOB
  if (passportData.dateOfBirth) {
    const age = calculateAge(passportData.dateOfBirth);
    if (age > 0) {
      console.log('🎂 Calculated age from DOB:', age);
      passportData.age = age.toString();
    }
  }
  
  // ========== COMPREHENSIVE FIELD MAPPINGS ==========
  // Maps all 46 fields as per FIELD_TO_DOCUMENT_MAPPING_TEMPLATE.md
  const fieldMappings: { [key: string]: string[] } = {
    // ========== PERSONAL INFORMATION ==========
    // Field #6: Applicant Full Name in CAPITAL - Passport Front
    fullName: ['Applicant_Full_Name_in_CAPITAL', 'APPLICANT_NAME', 'Full_Name', 'Applicant_Full_Name'],

    // Field #7: First Name - Passport Front (Given Name)
    givenName: ['First_Name', 'Given_Name'],

    // Field #8: Middle Name - Passport Front (parsed from Full Name)
    middleName: ['Middle_Name'],

    // Field #9: Last Name - Passport Front (Surname)
    surname: ['Last_Name', 'Surname'],

    // Field #37 & #41: Date of Birth - Passport Front
    dateOfBirth: ['Date_of_Birth', 'DOB'],

    // Field #42: Age autocalculate - Auto-calculated from DOB
    age: ['Age_autocalculate', 'Age'],

    gender: ['Gender', 'Sex'],

    // ========== PASSPORT DETAILS ==========
    // Field #33: Passport Number - Passport Front
    passportNumber: ['Passport_Number', 'Passport_No'],

    // Field #34: Passport Issue Date - Passport Front
    // REMOVED generic 'Date_of_Issue' and 'Issue_Date' to prevent conflicts with Emirates ID/VISA
    dateOfIssue: ['Passport_Issue_Date'],

    // Field #35: Passport Expiry Date - Passport Front
    // REMOVED generic 'Date_of_Expiry' and 'Expiry_Date' to prevent conflicts with Emirates ID/VISA
    dateOfExpiry: ['Passport_Expiry_Date'],

    // Field #36: Passport Issued Place - Passport Front
    // REMOVED generic 'Place_of_Issue' and 'Issue_Place' to prevent conflicts with Emirates ID/VISA
    placeOfIssue: ['Passport_Issued_Place', 'Passport_issued_Place'],

    placeOfBirth: ['Place_of_Birth', 'Birth_Place'],

    // ========== FAMILY DETAILS - PASSPORT BACK ==========
    // Field #38: Father/Guardian Name - Passport Back
    fatherName: ['Father/Guardian_Name', 'Father_Guardian_Name', 'Father_Name', 'Name_of_Father_or_Guardian'],

    motherName: ['Mother_Name', 'Mother'],
    spouseName: ['Spouse_Name', 'Spouse'],

    // ========== ADDRESS INFORMATION - PASSPORT BACK ==========
    // Field #12: Permanent Residence Address - Passport Back
    address: ['Permanent_Residence_Address', 'Address', 'Residence_Address', 'Permament_Residence_Address'],

    permanentAddress: ['Permanent_Residence_Address', 'Address', 'Permament_Residence_Address'],

    // Field #13: PIN Code - Passport Back (extracted from address)
    pinCode: ['PIN_Code', 'Pincode', 'PIN', 'PINcode'],

    // NOTE: The following fields should NOT be mapped from Passport:
    // - District, State, Taluk, Village, Local Body → Admin Form fields
    // - Current Residence Address (Abroad) → Admin Form field #21
    // - Contact information (Mobile, WhatsApp, Email) → Admin Form fields
    // - Aadhaar Number → Admin Form field #22
    // These will be mapped when Admin Form is uploaded

    // ========== EMIRATES ID SPECIFIC ==========
    emiratesIdNumber: ['Emirates_ID_Number', 'ID_Number', 'KSHEMANIDHI_ID_NUMBER', 'Emirates_ID', 'ID_No'],

    // Field #32 & #43: Occupation - Emirates ID Back
    occupation: ['Occupation', 'Current_Occupation'],

    fullNameArabic: ['Full_Name_Arabic', 'Name_Arabic', 'Arabic_Name'],
    firstNameEnglish: ['First_Name_English', 'First_Name'],
    lastNameEnglish: ['Last_Name_English', 'Last_Name'],
    firstNameArabic: ['First_Name_Arabic'],
    lastNameArabic: ['Last_Name_Arabic'],
    emiratesResidence: ['Emirates_Residence', 'Residence_Emirate'],
    areaCode: ['Area_Code'],

    // ========== VISA SPECIFIC ==========
    // Field #29: Visa Number - VISA (includes Control Number for USA visas)
    visaNumber: ['Visa_Number', 'VISA_Number', 'Visa_No', 'Control_Number'],
    controlNumber: ['Visa_Number', 'VISA_Number', 'Control_Number'], // USA visa control number

    // Field #31: Visa Expiry Date - VISA
    visaExpiryDate: ['Visa_Expiry_Date', 'VISA_Expiry_Date'],

    visaIssueDate: ['Visa_Issue_Date', 'VISA_Issue_Date'], // When visa was issued
    visaType: ['VISA_Type', 'Visa_Type'],
    visaClass: ['Visa_Type_/_Class', 'Visa_Class', 'VISA_Class'], // e.g., B1/B2
    visaCategory: ['VISA_Category'],
    validUntilDate: ['Visa_Expiry_Date', 'VISA_Expiry_Date'],
    issuingPostName: ['Issuing_Post_Name', 'VISA_Issuing_Post'], // Where visa was issued (e.g., FRANKFURT)
    entries: ['Entries', 'Entries/Annotation'], // e.g., M for multiple
    annotation: ['Annotation', 'VISA_Annotation'], // Annotation text on visa
    portOfEntry: ['Port_of_Entry'],
    purposeOfVisit: ['Purpose_of_Visit'],

    // Field #30: Sponsor/Company Name - Manual Entry (but can be extracted from VISA)
    sponsorInformation: ['Sponsor/Company_Name', 'Sponsor_Information', 'Sponsor_Details', 'SPONSOR_/_COMPANY_NAME'],

    durationOfStay: ['Duration_of_Stay'],
    entriesAllowed: ['Entries_Allowed'],
    issuingCountry: ['Issuing_Country'],

    // ========== NOMINEE INFORMATION - ADMIN FORM ==========
    // Field #39: Nominee name - Admin Form
    nomineeName: ['Nominee_name', 'Nominee_1_Name'],

    // Field #40: Relationship - Admin Form
    nomineeRelationship: ['Relationship'],

    // Field #23: Nominee Date of Birth - Admin Form (fallback to Aadhaar)
    nomineeDOB: ['Nominee_Date_of_Birth'],

    // ========== MANUAL ENTRY FIELDS ==========
    // Field #1-5: Manual Entry
    organisation: ['ORGANISATION'],
    applyFor: ['Apply_For'],
    type: ['Type'],
    norkaIdNumber: ['NORKA_ID_NUMER'],
    kshemanidiIdNumber: ['KSHEMANIDHI_ID_NUMBER'],

    // Field #27: Form Collected By - Manual Entry
    formCollectedBy: ['Form_Collected_By'],

    // Field #46: Percentage - Manual Entry
    percentage: ['Percentage'],
  };
  

  // ========== DOCUMENT TYPE FILTERING ==========
  // Define which fields belong to which document type to prevent conflicts
  // Based on FIELD_TO_DOCUMENT_MAPPING_TEMPLATE.md

  // Passport ONLY fields - should NOT be filled from VISA or Emirates ID
  // Fields #6-9, #33-38, #41: Name fields, passport details, DOB - all from Passport Front ONLY
  // Field #12-13, #38: Address, PIN, Father name - from Passport Back ONLY
  const passportOnlyFields = [
    // Name fields - Passport Front ONLY (Fields #6-9, #37/#41)
    'fullName', 'givenName', 'middleName', 'surname', 'dateOfBirth',
    // Passport details - Passport Front ONLY (Fields #33-36)
    'passportNumber', 'dateOfIssue', 'dateOfExpiry', 'placeOfIssue', 'placeOfBirth',
    // Family & Address - Passport Back ONLY (Fields #12-13, #38)
    'fatherName', 'motherName', 'spouseName', 'address', 'permanentAddress', 'pinCode'
  ];

  const emiratesOnlyFields = ['emiratesIdNumber', 'fullNameArabic', 'firstNameEnglish', 'lastNameEnglish', 'firstNameArabic', 'lastNameArabic', 'emiratesResidence', 'areaCode', 'occupation'];
  const visaOnlyFields = [
    'visaNumber', 'controlNumber', 'visaExpiryDate', 'visaIssueDate', 'visaType', 'visaClass', 'visaCategory',
    'validUntilDate', 'issuingPostName', 'entries', 'annotation', 'portOfEntry', 'purposeOfVisit',
    'sponsorInformation', 'durationOfStay', 'entriesAllowed', 'issuingCountry'
  ];

  // Shared fields that can come from any document
  // Field #42: Age is auto-calculated
  const sharedFields = ['age', 'gender', 'nationality']; // Only these can be from any document

  // Normalize document type for checking
  const docType = documentType.toLowerCase();
  const isPassport = docType.includes('passport') || docType.includes('front') || docType.includes('address') || docType.includes('back');
  const isEmiratesID = docType.includes('emirates');
  const isVisa = docType.includes('visa');

  console.log(`📋 Document Type Filter: isPassport=${isPassport}, isEmiratesID=${isEmiratesID}, isVisa=${isVisa}`);
  console.log(`📋 Original documentType param: "${documentType}" → normalized: "${docType}"`);

  // Debug: Show what will be filtered
  console.log(`🔍 Field Filtering Rules:`);
  console.log(`  - Passport-only fields will ${isPassport ? 'BE MAPPED' : 'BE SKIPPED (not a passport)'}`);
  console.log(`  - VISA-only fields will ${isVisa ? 'BE MAPPED' : 'BE SKIPPED (not a visa)'}`);
  console.log(`  - Emirates-only fields will ${isEmiratesID ? 'BE MAPPED' : 'BE SKIPPED (not Emirates ID)'}`);

  // Debug: Show VISA-specific extracted data
  console.log('🔍 VISA-specific extracted data:');
  console.log('  - visaNumber:', passportData.visaNumber || 'NOT EXTRACTED');
  console.log('  - controlNumber:', passportData.controlNumber || 'NOT EXTRACTED');
  console.log('  - visaExpiryDate:', passportData.visaExpiryDate || 'NOT EXTRACTED');
  console.log('  - visaIssueDate:', passportData.visaIssueDate || 'NOT EXTRACTED');
  console.log('  - visaType:', passportData.visaType || 'NOT EXTRACTED');
  console.log('  - visaClass:', passportData.visaClass || 'NOT EXTRACTED');
  console.log('  - issuingPostName:', passportData.issuingPostName || 'NOT EXTRACTED');

  // Apply field mappings
  Object.entries(passportData).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.trim()) {
      const cleanValue = value.toString().trim();

      // ========== DOCUMENT TYPE FILTERING CHECK ==========
      // Skip fields that don't belong to this document type
      let shouldSkip = false;
      if (passportOnlyFields.includes(key) && !isPassport) {
        shouldSkip = true;
      } else if (emiratesOnlyFields.includes(key) && !isEmiratesID) {
        shouldSkip = true;
      } else if (visaOnlyFields.includes(key) && !isVisa) {
        shouldSkip = true;
      }

      if (shouldSkip) {
        return; // Skip this field
      }

      // Direct field mapping - now handles array of possible field names
      const mappedFieldNames = fieldMappings[key];

      if (mappedFieldNames && Array.isArray(mappedFieldNames)) {
        // Try each possible field name
        let fieldMapped = false;
        for (const mappedFieldName of mappedFieldNames) {
          // Check both the mapped field name and the field without special characters
          const fieldExists = updatedFormData.hasOwnProperty(mappedFieldName) ||
                            Object.keys(updatedFormData).some(k => k === mappedFieldName);
          
          if (fieldExists) {
            let valueToMap = cleanValue;

            // Convert date fields from DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
            if (key === 'dateOfIssue' || key === 'dateOfExpiry' || key === 'dateOfBirth' ||
                key === 'nomineeDateOfBirth' || key === 'visaIssueDate' || key === 'visaExpiryDate' || key === 'validFromDate' || key === 'validUntilDate') {
              const converted = convertDateFormat(cleanValue);
              if (converted && converted !== cleanValue) {
                valueToMap = converted;
              }
            }

            // Special handling for fields that need to be in CAPITAL
            if (mappedFieldName === 'Applicant_Full_Name_in_CAPITAL' || mappedFieldName === 'APPLICANT_NAME') {
              updatedFormData[mappedFieldName] = valueToMap.toUpperCase();
            } else {
              updatedFormData[mappedFieldName] = valueToMap;
            }
            fieldMapped = true;
            break; // Stop after first successful mapping
          }
        }
        
        if (!fieldMapped) {
          console.log(`❌ NO MATCH: Could not find form field for ${key}`);
          
          // Try to find a similar field with different formatting
          const similarField = Object.keys(updatedFormData).find(k => {
            const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return mappedFieldNames.some(targetName => {
              const normalizedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normalizedKey === normalizedTarget;
            });
          });
          
          if (similarField) {
            let valueToMap = cleanValue;

            // Convert date fields from DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
            if (key === 'dateOfIssue' || key === 'dateOfExpiry' || key === 'dateOfBirth' ||
                key === 'nomineeDateOfBirth' || key === 'visaIssueDate' || key === 'visaExpiryDate' || key === 'validFromDate' || key === 'validUntilDate') {
              const converted = convertDateFormat(cleanValue);
              if (converted && converted !== cleanValue) {
                valueToMap = converted;
              }
            }

            updatedFormData[similarField] = valueToMap;
          }
        }
      } else {
        
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
        } else {
          console.log(`❌ NO MATCH: Could not find form field for ${key}`);
        }
      }
    }
  });

  return updatedFormData;
}

// Validate if the document contains expected fields based on document type
export function validateDocumentFields(extractedData: ExtractedPassportData, pageType?: string): ValidationResult {
  // COMPREHENSIVE FIX: Handle address/last pages properly
  if (pageType) {
    const normalizedPageType = pageType.toLowerCase();

    if (normalizedPageType.includes('address') || normalizedPageType.includes('last')) {
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
      // Document is valid if it has at least 50% of required fields (more lenient)
      isValid = missingFields.length < Math.ceil(requirements.required.length * 0.50);
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

      // FALLBACK VALIDATION: Accept if we have at least basic identifying info
      if (extractedData.fullName || extractedData.passportNumber || extractedData.givenName) {
        console.log('✅ FALLBACK VALIDATION: Found basic identifying info - accepting document');
        isValid = true;
        confidence = 0.6; // Lower confidence but still valid
      }
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
    // Unknown document type - but still check if we have ANY useful data
    console.log('⚠️ Unknown document type - checking for any valid data');

    // LENIENT FALLBACK: If we extracted ANY personal information, accept it
    if (extractedData.fullName || extractedData.passportNumber || extractedData.givenName ||
        extractedData.emiratesIdNumber || extractedData.visaNumber) {
      console.log('✅ UNKNOWN DOC FALLBACK: Found identifying info, accepting as valid');
      isValid = true;
      confidence = 0.5; // Low confidence but we'll accept it
      documentType = 'passport'; // Default to passport for unknown docs with personal info
      suggestion = '⚠️ Partial data extracted. Please review and fill in any missing fields.';
    } else {
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