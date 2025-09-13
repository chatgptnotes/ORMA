import { extractTextFromPDF, parsePassportDataFromText } from './pdfExtractor';

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
        
        // Otherwise return sample data with the extracted text
        return {
          fullName: 'PDF TEXT EXTRACTED',
          address: pdfText.substring(0, 200),
          ...parsedData
        };
      }

      // Validate file type
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!supportedTypes.includes(imageFile.type.toLowerCase())) {
        throw new Error(`Unsupported file type: ${imageFile.type}. Please upload an image file (JPG, PNG, etc.)`);
      }

      // Convert file to base64
      const base64 = await fileToBase64(imageFile);
      
      // For demo purposes, return mock data
      // In production, integrate with actual OCR/AI service
      console.log('Processing image:', imageFile.name);
      console.log('File size:', imageFile.size, 'bytes');
      console.log('File type:', imageFile.type);
      
      // Continue with rest of logic below
      mimeType = imageFile.type;
    }
    
    // Handle base64 string
    const base64 = typeof imageFileOrBase64 === 'string' ? imageFileOrBase64 : '';
    
    // For demo purposes, return mock data
    // In production, integrate with actual OCR/AI service
    console.log('Processing base64 image');
    console.log('MIME type:', mimeType);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return sample extracted data for demonstration
    const mockData: ExtractedPassportData = {
      fullName: 'SAMPLE JOHN DOE',
      surname: 'DOE',
      givenName: 'JOHN',
      dateOfBirth: '01/01/1990',
      passportNumber: 'P123456789',
      nationality: 'INDIAN',
      gender: 'MALE',
      placeOfBirth: 'MUMBAI',
      dateOfIssue: '01/01/2020',
      dateOfExpiry: '01/01/2030',
      placeOfIssue: 'MUMBAI',
      fatherName: 'RICHARD DOE',
      motherName: 'JANE DOE',
      address: '123 Sample Street, Mumbai, Maharashtra, India'
    };
    
    // Return different mock data based on file name for variety (if we have file access)
    if (typeof imageFileOrBase64 !== 'string' && imageFileOrBase64.name.toLowerCase().includes('back')) {
      return {
        address: '456 Example Avenue, Delhi, India',
        spouseName: 'JANE SMITH'
      };
    } else if (typeof imageFileOrBase64 !== 'string' && imageFileOrBase64.name.toLowerCase().includes('visa')) {
      return {
        dateOfIssue: '15/06/2023',
        dateOfExpiry: '15/06/2024',
        placeOfIssue: 'US EMBASSY DELHI'
      };
    }
    
    return mockData;
  } catch (error) {
    console.error('Error extracting passport data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to extract passport data. Please try again.');
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