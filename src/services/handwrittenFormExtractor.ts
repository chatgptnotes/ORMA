import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface HandwrittenFormData {
  // Personal Information
  fullName?: string;
  applicantName?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;

  // Contact Information
  mobileNumber?: string;
  email?: string;
  alternatePhone?: string;
  uaePhoneNumber?: string;
  whatsappNumber?: string;
  mobileNumberNativePlace?: string;

  // Address Information
  currentAddress?: string;
  permanentAddress?: string;
  permanentAddressKerala?: string;
  abroadAddress?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  taluk?: string;
  village?: string;
  panchayath?: string;
  municipality?: string;
  corporation?: string;

  // Educational Information
  education?: string;
  schoolName?: string;

  // Identity Information
  aadharNumber?: string;
  panNumber?: string;
  voterIdNumber?: string;

  // Banking Information
  nroAccountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  branch?: string;

  // Family Information
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  maritalStatus?: string;

  // Nominee Information
  nomineeName?: string;
  relationshipWithNominee?: string;
  nomineeCurrentPlace?: string;
  isNomineeWorking?: string;
  nomineeMobileNumber?: string;

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
  personCollectingForm?: string;

  // Form Metadata
  formType?: string;
  submissionDate?: string;
  applicationNumber?: string;
  signature?: string;

  // Raw extracted text for reference
  rawExtractedText?: string;
}

export interface HandwrittenFormValidation {
  isValid: boolean;
  missingFields: string[];
  extractedFields: string[];
  confidence: number;
  message?: string;
  suggestion?: string;
}

// Validate handwritten form data
export function validateHandwrittenForm(data: HandwrittenFormData): HandwrittenFormValidation {
  const requiredFields = [
    'applicantName',
    'dateOfBirth',
    'permanentAddressKerala',
    'uaePhoneNumber',
    'nomineeName'
  ];

  const optionalFields = [
    'email',
    'mobileNumberNativePlace',
    'aadharNumber',
    'nroAccountNumber',
    'ifscCode',
    'district',
    'taluk',
    'village',
    'fatherName',
    'motherName',
    'relationshipWithNominee'
  ];

  const extractedFields = Object.keys(data).filter(key =>
    data[key as keyof HandwrittenFormData] &&
    data[key as keyof HandwrittenFormData] !== '' &&
    key !== 'rawExtractedText'
  );

  const missingFields = requiredFields.filter(field =>
    !data[field as keyof HandwrittenFormData] ||
    data[field as keyof HandwrittenFormData] === ''
  );

  // Calculate confidence
  const totalFields = requiredFields.length + optionalFields.length;
  const extractedRelevantFields = extractedFields.filter(field =>
    requiredFields.includes(field) || optionalFields.includes(field)
  ).length;
  const confidence = extractedRelevantFields / totalFields;

  // Valid if at least 60% of required fields are present
  const isValid = missingFields.length <= Math.ceil(requiredFields.length * 0.4);

  let suggestion = '';
  if (!isValid) {
    if (missingFields.includes('applicantName')) {
      suggestion = 'The applicant name is not readable. Please ensure the handwritten form is filled clearly.';
    } else if (missingFields.includes('nomineeName')) {
      suggestion = 'Nominee information is missing. Please ensure all sections of the form are filled.';
    } else if (missingFields.length > 3) {
      suggestion = 'Multiple required fields are missing. Please upload a complete, clearly filled ORMA Kshemanidhi application form.';
    } else {
      suggestion = `Missing fields: ${missingFields.join(', ')}. Please ensure these sections are filled in the form.`;
    }
  }

  return {
    isValid,
    missingFields,
    extractedFields,
    confidence,
    message: isValid ? 'Handwritten form validated successfully' : 'Form validation failed',
    suggestion
  };
}

export async function extractHandwrittenFormData(imageFile: File): Promise<HandwrittenFormData> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(imageFile);

    const prompt = `You are an expert at extracting information from ORMA Kshemanidhi application forms, especially handwritten forms in Malayalam and English.

    Please extract ALL the following information from this ORMA form image:

    1. Personal Information:
       - Applicant's Name / Full Name (in English)
       - Date of Birth
       - Age
       - Gender

    2. Contact Information:
       - UAE Phone Number
       - WhatsApp Number
       - Email Address
       - Mobile Number in Native Place
       - Alternate Phone Number

    3. Kerala Address Information:
       - Permanent Address in Kerala
       - Pincode
       - Taluk
       - Village
       - Panchayath / Municipality / Corporation
       - District

    4. Abroad Address:
       - Current/Abroad Address (Dubai/UAE address)

    5. Banking Information:
       - NRO Account Number
       - IFSC Code
       - Branch Name
       - Branch

    6. Identity Documents:
       - Aadhar Number
       - PAN Number (if present)
       - Voter ID Number (if present)

    7. Nominee Information:
       - Nominee Name
       - Relationship with Nominee
       - Current place of Nominee
       - Is Nominee working? (Yes/No)
       - Nominee Mobile Number (IND)

    8. Family Information:
       - Father's Name
       - Mother's Name
       - Spouse's Name
       - Marital Status

    9. Additional Information:
       - Name of Person collecting this Form
       - Signature
       - Date of submission

    10. Form Details:
       - Form Type (ORMA Kshemanidhi Application)
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
      "applicantName": "applicant's name",
      "fullName": "full name",
      "dateOfBirth": "DD/MM/YYYY",
      "age": "extracted age",
      "gender": "Male/Female/Other",
      "uaePhoneNumber": "UAE phone number",
      "whatsappNumber": "WhatsApp number",
      "email": "email address",
      "mobileNumberNativePlace": "mobile number in native place",
      "alternatePhone": "alternate number",
      "permanentAddressKerala": "permanent address in Kerala",
      "permanentAddress": "permanent address",
      "pinCode": "pincode",
      "taluk": "taluk name",
      "village": "village name",
      "panchayath": "panchayath/municipality/corporation name",
      "district": "district name",
      "abroadAddress": "abroad/Dubai address",
      "currentAddress": "current address",
      "nroAccountNumber": "NRO account number",
      "ifscCode": "IFSC code",
      "branchName": "branch name",
      "branch": "branch",
      "aadharNumber": "aadhar number",
      "panNumber": "PAN number",
      "voterIdNumber": "voter ID",
      "nomineeName": "nominee name",
      "relationshipWithNominee": "relationship with nominee",
      "nomineeCurrentPlace": "current place of nominee",
      "isNomineeWorking": "Yes/No",
      "nomineeMobileNumber": "nominee mobile number",
      "fatherName": "father's name",
      "motherName": "mother's name",
      "spouseName": "spouse's name",
      "maritalStatus": "marital status",
      "personCollectingForm": "name of person collecting form",
      "signature": "signature",
      "submissionDate": "submission date",
      "formType": "ORMA Kshemanidhi Application",
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

      // Validate the extracted data
      const validation = validateHandwrittenForm(extractedData);

      if (!validation.isValid) {
        console.warn('Handwritten form validation failed:', validation);

        // Provide detailed error message
        let errorMessage = 'Document validation failed. This does not appear to be a properly filled ORMA Kshemanidhi application form. ';

        if (validation.missingFields.length > 0) {
          errorMessage += `Missing required information: ${validation.missingFields.join(', ')}. `;
        }

        errorMessage += validation.suggestion || 'Please upload a complete, clearly filled ORMA form.';

        throw new Error(errorMessage);
      }

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
  const name = handwrittenData.applicantName || handwrittenData.fullName;
  if (name) {
    mappedData['Applicant_Full_Name_in_CAPITAL'] = name.toUpperCase();
    mappedData['Full_Name'] = name;
    mappedData['Applicant_Full_Name'] = name;

    // Try to split into given name and surname
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      mappedData['First_Name'] = nameParts[0];
      mappedData['Given_Name'] = nameParts.slice(0, -1).join(' ');
      mappedData['Last_Name'] = nameParts[nameParts.length - 1];
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
  if (handwrittenData.uaePhoneNumber) {
    mappedData['UAE_Phone_Number'] = handwrittenData.uaePhoneNumber;
    mappedData['Mobile_Number'] = handwrittenData.uaePhoneNumber;
  }

  if (handwrittenData.whatsappNumber) {
    mappedData['WhatsApp_Number'] = handwrittenData.whatsappNumber;
  }

  if (handwrittenData.mobileNumberNativePlace) {
    mappedData['Mobile_Number_in_Native_Place'] = handwrittenData.mobileNumberNativePlace;
    mappedData['Contact_Number'] = handwrittenData.mobileNumberNativePlace;
  }

  if (handwrittenData.email) {
    mappedData['Email'] = handwrittenData.email;
    mappedData['Email_Address'] = handwrittenData.email;
  }

  // Map Kerala address information
  if (handwrittenData.permanentAddressKerala || handwrittenData.permanentAddress) {
    const address = handwrittenData.permanentAddressKerala || handwrittenData.permanentAddress;
    mappedData['Permanent_Residence_Address'] = address;
    mappedData['Address_in_Kerala'] = address;
    mappedData['Address'] = address;
  }

  if (handwrittenData.pinCode) {
    mappedData['PIN_Code'] = handwrittenData.pinCode;
    mappedData['Pincode'] = handwrittenData.pinCode;
  }

  if (handwrittenData.taluk) {
    mappedData['Taluk'] = handwrittenData.taluk;
  }

  if (handwrittenData.village) {
    mappedData['Village'] = handwrittenData.village;
  }

  if (handwrittenData.panchayath) {
    mappedData['Panchayath_Municipality_Corporation'] = handwrittenData.panchayath;
  }

  if (handwrittenData.district) {
    mappedData['District'] = handwrittenData.district;
  }

  // Map abroad address
  if (handwrittenData.abroadAddress || handwrittenData.currentAddress) {
    const abroadAddr = handwrittenData.abroadAddress || handwrittenData.currentAddress;
    mappedData['Current_Residence_Address'] = abroadAddr;
    mappedData['Abroad_Address'] = abroadAddr;
  }

  // Map banking information
  if (handwrittenData.nroAccountNumber) {
    mappedData['NRO_Account_Number'] = handwrittenData.nroAccountNumber;
  }

  if (handwrittenData.ifscCode) {
    mappedData['IFSC_Code'] = handwrittenData.ifscCode;
  }

  if (handwrittenData.branchName) {
    mappedData['Branch_Name'] = handwrittenData.branchName;
  }

  // Map nominee information
  if (handwrittenData.nomineeName) {
    mappedData['Nominee_Name'] = handwrittenData.nomineeName;
  }

  if (handwrittenData.relationshipWithNominee) {
    mappedData['Relationship_with_Nominee'] = handwrittenData.relationshipWithNominee;
  }

  if (handwrittenData.nomineeCurrentPlace) {
    mappedData['Nominee_Current_Place'] = handwrittenData.nomineeCurrentPlace;
  }

  if (handwrittenData.isNomineeWorking) {
    mappedData['Is_Nominee_Working'] = handwrittenData.isNomineeWorking;
  }

  if (handwrittenData.nomineeMobileNumber) {
    mappedData['Nominee_Mobile_Number'] = handwrittenData.nomineeMobileNumber;
  }

  // Map family information
  if (handwrittenData.fatherName) {
    mappedData['Father/Guardian_Name'] = handwrittenData.fatherName;
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

  // Map additional information
  if (handwrittenData.personCollectingForm) {
    mappedData['Name_of_Person_collecting_this_Form'] = handwrittenData.personCollectingForm;
  }

  if (handwrittenData.submissionDate) {
    mappedData['Date'] = handwrittenData.submissionDate;
  }

  // Add metadata
  mappedData['Document_Type'] = 'Handwritten Form';
  mappedData['Form_Type'] = handwrittenData.formType || 'ORMA Kshemanidhi Application';

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