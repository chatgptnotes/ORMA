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
    fullName: ['Applicant_Full_Name_in_CAPITAL', 'Full_Name'],
    surname: ['Last_Name', 'Surname'], 
    givenName: ['First_Name', 'Given_Name'],
    
    // Personal details
    dateOfBirth: ['Date_of_Birth', 'DOB'],
    
    // Passport details
    passportNumber: ['Passport_Number', 'Passport_No'],
    dateOfIssue: ['Passport_Issue_Date', 'Date_of_Issue', 'Issue_Date'],
    dateOfExpiry: ['Passport_Expiry_Date', 'Date_of_Expiry', 'Expiry_Date'],
    placeOfIssue: ['Passport_Issued_Place', 'Place_of_Issue', 'Issue_Place'],
    
    // Family details - using actual field keys
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
            updatedFormData[mappedFieldName] = cleanValue;
            console.log(`✅ SUCCESS: Mapped ${key} -> ${mappedFieldName}: "${cleanValue}"`);
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