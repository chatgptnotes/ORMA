import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API - Note: Replace with your actual API key
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBuVcxKmBvSx6RRvJ-JrQ9H8X6r0uJMWLw';
const genAI = new GoogleGenAI({ apiKey: API_KEY });

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

export async function extractPassportData(imageFile: File): Promise<ExtractedPassportData> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    
    const prompt = `Extract all text and data from this passport/document image. 
    Return the extracted information in JSON format with the following fields if present:
    - fullName (complete name as shown)
    - surname (family name)
    - givenName (first name)
    - dateOfBirth (in DD/MM/YYYY format)
    - passportNumber
    - nationality
    - gender (M/F)
    - placeOfBirth
    - dateOfIssue (in DD/MM/YYYY format)
    - dateOfExpiry (in DD/MM/YYYY format)
    - placeOfIssue
    - fatherName
    - motherName
    - spouseName
    - address (complete address if visible)
    - Any other relevant fields you can identify
    
    Only include fields that are clearly visible in the document. 
    Return ONLY valid JSON without any markdown formatting or code blocks.`;
    
    // Use the correct API structure
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64.split(',')[1] // Remove data URL prefix
              }
            }
          ]
        }
      ]
    });
    
    const text = response.text;
    
    // Clean the response to ensure valid JSON
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const extractedData = JSON.parse(cleanedText);
      return extractedData;
    } catch (parseError) {
      console.error('Failed to parse extracted data:', parseError);
      console.log('Raw response:', text);
      return {};
    }
  } catch (error) {
    console.error('Error extracting passport data:', error);
    throw new Error('Failed to extract passport data. Please try again.');
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Map extracted passport fields to form fields
export function mapPassportToFormFields(passportData: ExtractedPassportData, formData: any): any {
  const updatedFormData = { ...formData };
  
  // Map passport fields to ORMA form fields
  const fieldMappings: { [key: string]: string } = {
    // Name fields
    fullName: 'Name (Full)',
    surname: 'NAME - SURNAME',
    givenName: 'NAME - GIVEN NAME',
    
    // Personal details
    dateOfBirth: 'Date of Birth',
    gender: 'GENDER',
    nationality: 'NATIONALITY',
    placeOfBirth: 'Place of Birth',
    
    // Passport details
    passportNumber: 'Passport No',
    dateOfIssue: 'Passport Issue Date',
    dateOfExpiry: 'Passport Expiry Date',
    placeOfIssue: 'Place of Issue',
    
    // Family details
    fatherName: 'FATHER NAME',
    motherName: 'MOTHER NAME',
    spouseName: 'Spouse/Husband/Wife name',
    
    // Address
    address: 'Address (India)',
  };
  
  // Try to match and populate form fields
  Object.entries(passportData).forEach(([key, value]) => {
    if (value) {
      // Try direct mapping first
      const mappedFieldName = fieldMappings[key];
      if (mappedFieldName && updatedFormData[mappedFieldName] !== undefined) {
        // Special handling for gender - convert to uppercase
        if (key === 'gender') {
          value = value.toString().toUpperCase();
          if (value === 'M') value = 'MALE';
          if (value === 'F') value = 'FEMALE';
        }
        
        // Special handling for dates - ensure DD/MM/YYYY format
        if (key.includes('date') || key.includes('Date')) {
          // Convert date to DD/MM/YYYY if needed
          const dateObj = new Date(value.toString());
          if (!isNaN(dateObj.getTime())) {
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            value = `${day}/${month}/${year}`;
          }
        }
        
        updatedFormData[mappedFieldName] = value;
      }
      
      // Also try exact field name match (case-sensitive)
      if (updatedFormData[key] !== undefined) {
        updatedFormData[key] = value;
      }
      
      // Try case-insensitive match as fallback
      const formFieldKeys = Object.keys(updatedFormData);
      const matchingKey = formFieldKeys.find(
        formKey => formKey.toLowerCase().replace(/[^a-z0-9]/g, '') === 
                   key.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (matchingKey && !updatedFormData[matchingKey]) {
        updatedFormData[matchingKey] = value;
      }
    }
  });
  
  return updatedFormData;
}