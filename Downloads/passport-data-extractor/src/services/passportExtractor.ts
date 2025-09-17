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
  fullName?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  gender?: string;
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
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  documentType: 'passport' | 'emirates_id' | 'visa' | 'aadhar' | 'unknown';
  missingFields: string[];
  extractedFields: string[];
  confidence: number;
  message?: string;
  suggestion?: string;
}

// Overloaded function signatures
export async function extractPassportData(imageFile: File): Promise<ExtractedPassportData>;
export async function extractPassportData(base64: string, mimeType: string): Promise<ExtractedPassportData>;
export async function extractPassportData(imageFileOrBase64: File | string, mimeType?: string): Promise<ExtractedPassportData> {
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
      
      // Validate and clean the extracted data
      const cleanedData = validatePassportData(parsedResponse.structuredData || {});
      
      // Combine with any additional extracted text data
      const extractedData: ExtractedPassportData = {
        ...cleanedData,
        // Add fullName if not present but we have surname and givenName
        fullName: cleanedData.fullName || 
                 (cleanedData.surname && cleanedData.givenName ? 
                  `${cleanedData.surname} ${cleanedData.givenName}` : undefined),
      };
      
      // Validate the extracted data
      const validation = validateDocumentFields(extractedData);

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
export function validateDocumentFields(extractedData: ExtractedPassportData): ValidationResult {
  const extractedFields = Object.keys(extractedData).filter(key => extractedData[key] && extractedData[key] !== '');

  // Define required fields for each document type
  const documentRequirements = {
    passport: {
      required: ['passportNumber', 'fullName', 'dateOfBirth', 'nationality'],
      optional: ['surname', 'givenName', 'dateOfIssue', 'dateOfExpiry', 'placeOfBirth', 'placeOfIssue', 'gender'],
      identifiers: ['passportNumber']
    },
    emirates_id: {
      required: ['fullName', 'dateOfBirth', 'nationality'],
      optional: ['idNumber', 'expiryDate', 'gender'],
      identifiers: ['idNumber', 'emiratesId']
    },
    visa: {
      required: ['fullName', 'passportNumber'],
      optional: ['visaNumber', 'dateOfIssue', 'dateOfExpiry', 'visaType'],
      identifiers: ['visaNumber', 'visaType']
    },
    aadhar: {
      required: ['fullName', 'dateOfBirth'],
      optional: ['aadharNumber', 'address', 'gender'],
      identifiers: ['aadharNumber']
    }
  };

  // Determine document type based on extracted fields
  let documentType: 'passport' | 'emirates_id' | 'visa' | 'aadhar' | 'unknown' = 'unknown';
  let maxScore = 0;
  const minScoreThreshold = 10; // Minimum score to consider a document type

  for (const [type, requirements] of Object.entries(documentRequirements)) {
    const typeKey = type as keyof typeof documentRequirements;
    let score = 0;

    // Check for identifying fields
    for (const identifier of requirements.identifiers) {
      if (extractedFields.includes(identifier)) {
        score += 10; // High weight for identifiers
      }
    }

    // Check for required fields
    for (const field of requirements.required) {
      if (extractedFields.includes(field)) {
        score += 5;
      }
    }

    // Check for optional fields
    for (const field of requirements.optional) {
      if (extractedFields.includes(field)) {
        score += 2;
      }
    }

    if (score > maxScore && score >= minScoreThreshold) {
      maxScore = score;
      documentType = typeKey as any;
    }
  }

  // Special check for passport number to ensure it's a passport
  if (extractedData.passportNumber && extractedData.passportNumber.length > 5) {
    documentType = 'passport';
  }

  // If we only have basic fields like name and address, it's likely not a valid document
  if (maxScore < minScoreThreshold) {
    documentType = 'unknown';
  }

  // Validate based on detected document type
  let isValid = false;
  let missingFields: string[] = [];
  let confidence = 0;
  let suggestion = '';

  if (documentType !== 'unknown') {
    const requirements = documentRequirements[documentType];
    missingFields = requirements.required.filter(field => !extractedFields.includes(field));

    // Calculate confidence based on extracted fields
    const totalExpectedFields = requirements.required.length + requirements.optional.length;
    const extractedRelevantFields = extractedFields.filter(field =>
      requirements.required.includes(field) || requirements.optional.includes(field)
    ).length;
    confidence = extractedRelevantFields / totalExpectedFields;

    // Document is valid if it has at least 75% of required fields
    // For passport, we need at least 3 out of 4 required fields
    isValid = missingFields.length < Math.ceil(requirements.required.length * 0.25);

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

  return {
    isValid,
    documentType,
    missingFields,
    extractedFields,
    confidence,
    message: isValid ? 'Document validated successfully' : 'Document validation failed',
    suggestion
  };
}