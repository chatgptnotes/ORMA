import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface HandwrittenFormData {
  // Personal Information
  fullName?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;

  // Contact Information
  mobileNumber?: string;
  email?: string;
  alternatePhone?: string;

  // Address Information
  currentAddress?: string;
  permanentAddress?: string;
  district?: string;
  state?: string;
  pinCode?: string;

  // Educational Information
  education?: string;
  schoolName?: string;

  // Identity Information
  aadharNumber?: string;
  panNumber?: string;
  voterIdNumber?: string;

  // Family Information
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  maritalStatus?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  emergencyContactAddress?: string;

  // Additional Information
  nationality?: string;
  religion?: string;
  bloodGroup?: string;
  occupation?: string;

  // Form Metadata
  formType?: string;
  submissionDate?: string;
  applicationNumber?: string;

  // Raw extracted text for reference
  rawExtractedText?: string;
}

export async function extractHandwrittenFormData(imageFile: File): Promise<HandwrittenFormData> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(imageFile);

    const prompt = `You are an expert at extracting information from handwritten forms, especially forms in Malayalam and English.

    Please extract ALL the following information from this handwritten form image:

    1. Personal Information:
       - Full Name (in English)
       - Date of Birth
       - Age
       - Gender

    2. Contact Information:
       - Mobile Number
       - Email Address
       - Alternate Phone Number

    3. Address Information:
       - Current Address
       - Permanent Address
       - District
       - State
       - PIN Code

    4. Educational Information:
       - Education Level/Qualification
       - School/Institution Name

    5. Identity Documents:
       - Aadhar Number
       - PAN Number
       - Voter ID Number

    6. Family Information:
       - Father's Name
       - Mother's Name
       - Spouse's Name (if applicable)
       - Marital Status

    7. Emergency Contact:
       - Emergency Contact Name
       - Relationship with Emergency Contact
       - Emergency Contact Number
       - Emergency Contact Address

    8. Additional Information:
       - Nationality
       - Religion
       - Blood Group
       - Occupation

    9. Form Details:
       - Form Type/Purpose
       - Submission Date
       - Application Number (if any)

    IMPORTANT INSTRUCTIONS:
    - Extract text from both Malayalam and English sections
    - For Malayalam text, provide the English translation or transliteration
    - If a field is not present or not readable, mark it as "Not Available"
    - For dates, use format: DD/MM/YYYY
    - For phone numbers, include all digits without spaces
    - Be careful with handwritten numbers - distinguish between similar looking digits

    Return the data in the following JSON format:
    {
      "fullName": "extracted name",
      "dateOfBirth": "DD/MM/YYYY",
      "age": "extracted age",
      "gender": "Male/Female/Other",
      "mobileNumber": "phone number",
      "email": "email address",
      "alternatePhone": "alternate number",
      "currentAddress": "current address",
      "permanentAddress": "permanent address",
      "district": "district name",
      "state": "state name",
      "pinCode": "pin code",
      "education": "education level",
      "schoolName": "school/institution name",
      "aadharNumber": "aadhar number",
      "panNumber": "PAN number",
      "voterIdNumber": "voter ID",
      "fatherName": "father's name",
      "motherName": "mother's name",
      "spouseName": "spouse's name",
      "maritalStatus": "marital status",
      "emergencyContactName": "emergency contact name",
      "emergencyContactRelation": "relationship",
      "emergencyContactNumber": "emergency phone",
      "emergencyContactAddress": "emergency address",
      "nationality": "nationality",
      "religion": "religion",
      "bloodGroup": "blood group",
      "occupation": "occupation",
      "formType": "type of form",
      "submissionDate": "submission date",
      "applicationNumber": "application number",
      "rawExtractedText": "complete raw text from the form"
    }`;

    const imagePart = {
      inlineData: {
        data: base64Data.split(',')[1],
        mimeType: imageFile.type
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extractedData = JSON.parse(jsonMatch[0]);

      // Clean up the data - remove "Not Available" values
      Object.keys(extractedData).forEach(key => {
        if (extractedData[key] === "Not Available" ||
            extractedData[key] === "not available" ||
            extractedData[key] === "N/A") {
          extractedData[key] = "";
        }
      });

      return extractedData;
    }

    return { rawExtractedText: text };
  } catch (error) {
    console.error('Error extracting handwritten form data:', error);
    throw new Error('Failed to extract handwritten form data');
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Map handwritten form data to standard form fields
export function mapHandwrittenToFormFields(handwrittenData: HandwrittenFormData): Record<string, any> {
  const mappedData: Record<string, any> = {};

  // Map personal information
  if (handwrittenData.fullName) {
    mappedData['Full_Name'] = handwrittenData.fullName;
    mappedData['Applicant_Full_Name'] = handwrittenData.fullName;

    // Try to split into given name and surname
    const nameParts = handwrittenData.fullName.split(' ');
    if (nameParts.length > 1) {
      mappedData['Given_Name'] = nameParts.slice(0, -1).join(' ');
      mappedData['Surname'] = nameParts[nameParts.length - 1];
    }
  }

  if (handwrittenData.dateOfBirth) {
    mappedData['Date_of_Birth'] = handwrittenData.dateOfBirth;
  }

  if (handwrittenData.gender) {
    mappedData['Gender'] = handwrittenData.gender;
  }

  // Map contact information
  if (handwrittenData.mobileNumber) {
    mappedData['Mobile_Number'] = handwrittenData.mobileNumber;
    mappedData['Contact_Number'] = handwrittenData.mobileNumber;
  }

  if (handwrittenData.email) {
    mappedData['Email'] = handwrittenData.email;
    mappedData['Email_Address'] = handwrittenData.email;
  }

  // Map address information
  if (handwrittenData.currentAddress) {
    mappedData['Address'] = handwrittenData.currentAddress;
    mappedData['Current_Address'] = handwrittenData.currentAddress;
  }

  if (handwrittenData.pinCode) {
    mappedData['PIN_Code'] = handwrittenData.pinCode;
  }

  if (handwrittenData.district) {
    mappedData['District'] = handwrittenData.district;
  }

  if (handwrittenData.state) {
    mappedData['State'] = handwrittenData.state;
  }

  // Map family information
  if (handwrittenData.fatherName) {
    mappedData['Father_Name'] = handwrittenData.fatherName;
  }

  if (handwrittenData.motherName) {
    mappedData['Mother_Name'] = handwrittenData.motherName;
  }

  if (handwrittenData.spouseName) {
    mappedData['Spouse_Name'] = handwrittenData.spouseName;
  }

  // Map identity information
  if (handwrittenData.aadharNumber) {
    mappedData['Aadhar_Number'] = handwrittenData.aadharNumber;
  }

  if (handwrittenData.panNumber) {
    mappedData['PAN_Number'] = handwrittenData.panNumber;
  }

  if (handwrittenData.voterIdNumber) {
    mappedData['Voter_ID'] = handwrittenData.voterIdNumber;
  }

  // Map additional information
  if (handwrittenData.nationality) {
    mappedData['Nationality'] = handwrittenData.nationality;
  }

  if (handwrittenData.occupation) {
    mappedData['Occupation'] = handwrittenData.occupation;
  }

  if (handwrittenData.education) {
    mappedData['Education'] = handwrittenData.education;
  }

  // Add metadata
  mappedData['Document_Type'] = 'Handwritten Form';
  mappedData['Form_Type'] = handwrittenData.formType || 'General Application';

  return mappedData;
}

// Format handwritten data for Supabase storage
export function formatHandwrittenDataForSupabase(handwrittenData: HandwrittenFormData, formData: Record<string, any>) {
  return {
    // Personal Information
    full_name: handwrittenData.fullName || formData['Full_Name'] || '',
    given_name: formData['Given_Name'] || '',
    surname: formData['Surname'] || '',
    date_of_birth: handwrittenData.dateOfBirth || formData['Date_of_Birth'] || '',
    gender: handwrittenData.gender || formData['Gender'] || '',
    nationality: handwrittenData.nationality || formData['Nationality'] || '',

    // Family Information
    father_name: handwrittenData.fatherName || formData['Father_Name'] || '',
    mother_name: handwrittenData.motherName || formData['Mother_Name'] || '',
    spouse_name: handwrittenData.spouseName || formData['Spouse_Name'] || '',

    // Contact Information
    address: handwrittenData.currentAddress || formData['Address'] || '',
    pin_code: handwrittenData.pinCode || formData['PIN_Code'] || '',

    // Additional handwritten form specific fields
    mobile_number: handwrittenData.mobileNumber || '',
    email: handwrittenData.email || '',
    aadhar_number: handwrittenData.aadharNumber || '',
    pan_number: handwrittenData.panNumber || '',
    voter_id: handwrittenData.voterIdNumber || '',
    education: handwrittenData.education || '',
    occupation: handwrittenData.occupation || '',

    // Form metadata
    form_data: {
      ...formData,
      handwritten_data: handwrittenData,
      document_type: 'Handwritten Form',
      form_type: handwrittenData.formType || 'General Application'
    },

    // Extraction metadata
    extraction_confidence: 0.85, // Handwritten forms typically have lower confidence
    source_file_name: 'Handwritten Form',
    extraction_timestamp: new Date().toISOString()
  };
}