import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Using gemini-2.5-flash (latest model)

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
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

  // Try DD-MM-YYYY format
  const ddmmyyyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDashMatch) {
    const [, day, month, year] = ddmmyyyyDashMatch;
    const converted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('📅 Converted DD-MM-YYYY to YYYY-MM-DD:', dateStr, '→', converted);
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
  nomineeDateOfBirth?: string;
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
       - Aadhar Number (ആധാർ നമ്പർ)
       - PAN Number (if present)
       - Voter ID Number (if present)

    CRITICAL INSTRUCTIONS FOR AADHAAR NUMBER EXTRACTION:

    **AADHAAR NUMBER IDENTIFICATION:**
    - LABEL: Look for "Aadhaar Number" or "ആധാർ നമ്പർ" (Malayalam) or "Aadhar" or "Adhaar"
    - FORMAT: EXACTLY 12 digits (e.g., 570721544490, 123456789012)
    - APPEARANCE: May be handwritten or printed, often in a dedicated field/box
    - SPACING: May appear with spaces (5707 2154 4490) but extract as continuous 12 digits

    **CRITICAL DIFFERENTIATION:**
    - ✅ AADHAAR: 12 digits (570721544490) → Extract this as aadharNumber
    - ❌ PHONE: 10 digits (9847123215) → This is a phone number, NOT Aadhaar
    - Phone numbers in India are typically 10 digits starting with 6-9
    - Aadhaar numbers are ALWAYS 12 digits and can start with any digit

    **CONCRETE EXAMPLES:**
    - ✅ CORRECT Aadhaar: 570721544490 (12 digits)
    - ✅ CORRECT Aadhaar: 5707 2154 4490 (extract as 570721544490)
    - ❌ WRONG: 9847123215 (10 digits - this is a phone number)
    - ❌ WRONG: 0558115576 (10 digits - this is a phone number)

    **EXTRACTION PRIORITY FOR AADHAAR:**
    1. Look for dedicated Aadhaar field with label "Aadhaar" or "ആധാർ നമ്പർ"
    2. Count the digits - MUST be exactly 12 digits
    3. Extract the complete 12-digit number, removing any spaces
    4. DO NOT extract 10-digit phone numbers as Aadhaar
    5. If you see both 10-digit and 12-digit numbers, the 12-digit is likely the Aadhaar

    7. Nominee Information:
       - Nominee Name
       - Nominee Date of Birth (നോമിനിയുടെ ജന്മതിയതി)
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
      "nomineeDateOfBirth": "nominee date of birth (DD/MM/YYYY)",
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
      console.log('📥 RAW Gemini extraction result:', JSON.stringify(extractedData, null, 2));

      // Clean up the data - remove "Not Available" values
      Object.keys(extractedData).forEach(key => {
        if (extractedData[key] === "Not Available" ||
            extractedData[key] === "not available" ||
            extractedData[key] === "N/A") {
          extractedData[key] = "";
        }
      });

      // Convert dates from DD/MM/YYYY to YYYY-MM-DD for HTML date inputs
      console.log('📅 Converting dates in admin form...');
      if (extractedData.dateOfBirth) {
        const converted = convertDateFormat(extractedData.dateOfBirth);
        if (converted) {
          console.log('📅 Converted dateOfBirth:', extractedData.dateOfBirth, '→', converted);
          extractedData.dateOfBirth = converted;
        }
      }

      if (extractedData.nomineeDateOfBirth) {
        const converted = convertDateFormat(extractedData.nomineeDateOfBirth);
        if (converted) {
          console.log('📅 Converted nomineeDateOfBirth:', extractedData.nomineeDateOfBirth, '→', converted);
          extractedData.nomineeDateOfBirth = converted;
        }
      }

      // Detect Aadhaar numbers misidentified as phone numbers
      // Aadhaar is 12 digits, phone numbers are typically 10 digits
      const aadhaarPattern = /^\d{12}$/;
      console.log('🔧 Checking for Aadhaar number misidentification...');
      console.log('🔍 Current Aadhaar value before pattern detection:', extractedData.aadharNumber || 'EMPTY');

      // Check alternate phone for Aadhaar pattern
      if (extractedData.alternatePhone) {
        const cleaned = extractedData.alternatePhone.replace(/\s/g, '');
        if (aadhaarPattern.test(cleaned)) {
          console.log('🔧 DETECTED: Alternate phone is actually Aadhaar number:', extractedData.alternatePhone);
          if (!extractedData.aadharNumber) {
            extractedData.aadharNumber = cleaned;
            extractedData.alternatePhone = "";
            console.log('🔧 MOVED: 12-digit number from alternatePhone to aadharNumber');
          }
        }
      }

      // Check mobile number native place for Aadhaar pattern
      if (extractedData.mobileNumberNativePlace) {
        const cleaned = extractedData.mobileNumberNativePlace.replace(/\s/g, '');
        if (aadhaarPattern.test(cleaned)) {
          console.log('🔧 DETECTED: Mobile number native place is actually Aadhaar number:', extractedData.mobileNumberNativePlace);
          if (!extractedData.aadharNumber) {
            extractedData.aadharNumber = cleaned;
            extractedData.mobileNumberNativePlace = "";
            console.log('🔧 MOVED: 12-digit number from mobileNumberNativePlace to aadharNumber');
          }
        }
      }

      // Check any other phone field for Aadhaar pattern
      if (extractedData.mobileNumber) {
        const cleaned = extractedData.mobileNumber.replace(/\s/g, '');
        if (aadhaarPattern.test(cleaned)) {
          console.log('🔧 DETECTED: Mobile number is actually Aadhaar number:', extractedData.mobileNumber);
          if (!extractedData.aadharNumber) {
            extractedData.aadharNumber = cleaned;
            extractedData.mobileNumber = "";
            console.log('🔧 MOVED: 12-digit number from mobileNumber to aadharNumber');
          }
        }
      }

      console.log('🔍 Final Aadhaar value after pattern detection:', extractedData.aadharNumber || 'EMPTY');

      // Validate Aadhaar number format
      console.log('🔧 Validating Aadhaar number format...');
      if (extractedData.aadharNumber) {
        const cleanedAadhaar = extractedData.aadharNumber.replace(/[\s-]/g, '');
        console.log('🔍 Original Aadhaar:', extractedData.aadharNumber);
        console.log('🔍 Cleaned Aadhaar:', cleanedAadhaar);

        if (/^\d{12}$/.test(cleanedAadhaar)) {
          extractedData.aadharNumber = cleanedAadhaar;
          console.log('✅ Valid Aadhaar number (12 digits):', cleanedAadhaar);
        } else {
          console.log('❌ INVALID Aadhaar number - not 12 digits:', cleanedAadhaar, '(length:', cleanedAadhaar.length, ')');
          console.log('🔧 Clearing invalid Aadhaar field');
          extractedData.aadharNumber = "";
        }
      } else {
        console.log('⚠️ No Aadhaar number extracted by Gemini');
      }

      console.log('✅ Date conversion and Aadhaar validation complete');
      console.log('📤 FINAL extracted data being returned:', {
        aadharNumber: extractedData.aadharNumber || 'EMPTY',
        alternatePhone: extractedData.alternatePhone || 'EMPTY',
        mobileNumberNativePlace: extractedData.mobileNumberNativePlace || 'EMPTY',
        applicantName: extractedData.applicantName || 'EMPTY',
        nomineeDateOfBirth: extractedData.nomineeDateOfBirth || 'EMPTY'
      });

      // Validate the extracted data
      const validation = validateHandwrittenForm(extractedData);

      if (!validation.isValid) {
        console.warn('⚠️ Handwritten form validation warning:', validation);
        console.warn(`⚠️ Extracted ${validation.extractedFields.length} fields with ${Math.round(validation.confidence * 100)}% confidence`);
        console.warn(`⚠️ Missing fields: ${validation.missingFields.join(', ')}`);

        // Instead of throwing an error, return the partial data with a warning flag
        return {
          ...extractedData,
          _validationWarning: true,
          _validationMessage: validation.message,
          _validationSuggestion: validation.suggestion,
          _missingFields: validation.missingFields,
          _confidence: validation.confidence
        };
      }

      return extractedData;
    }

    console.warn('⚠️ Could not parse JSON from handwritten form response');
    return {
      rawExtractedText: text,
      _extractionWarning: true,
      _extractionMessage: 'Partial extraction - could not parse complete form data'
    };
  } catch (error) {
    console.error('❌ Error extracting handwritten form data:', error);

    // Return a partial result instead of throwing
    // This allows the form to continue working even if handwritten extraction fails
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      _extractionFailed: true,
      _errorMessage: errorMessage,
      rawExtractedText: 'Extraction failed: ' + errorMessage
    };
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
// Maps all 21 Admin Form fields as per FIELD_TO_DOCUMENT_MAPPING_TEMPLATE.md
export function mapHandwrittenToFormFields(handwrittenData: HandwrittenFormData): Record<string, any> {
  const mappedData: Record<string, any> = {};

  console.log('=== MAPPING ADMIN FORM DATA ===');
  console.log('Handwritten data:', handwrittenData);

  // NOTE: Name fields (Applicant Full Name, First Name, Middle Name, Last Name)
  // should ONLY come from Passport Front, NOT from Admin Form
  // Admin Form provides only fields #10-22, #24, #39-40, #44-45

  // ========== ADMIN FORM FIELDS (21 total) ==========
  // Based on FIELD_TO_DOCUMENT_MAPPING_TEMPLATE.md

  // Field #10: UAE Mobile Number
  if (handwrittenData.uaePhoneNumber || handwrittenData.mobileNumber) {
    const uaeNumber = handwrittenData.uaePhoneNumber || handwrittenData.mobileNumber;
    mappedData['UAE_Mobile_Number'] = uaeNumber;
    mappedData['Mobile_Number'] = uaeNumber;
    console.log('✅ Mapped Field #10 - UAE Mobile Number:', uaeNumber);
  }

  // Field #11: WhatsApp Number
  if (handwrittenData.whatsappNumber) {
    mappedData['WhatsApp_Number'] = handwrittenData.whatsappNumber;
    console.log('✅ Mapped Field #11 - WhatsApp Number:', handwrittenData.whatsappNumber);
  }

  // Field #14: Email ID
  if (handwrittenData.email) {
    mappedData['Email_ID'] = handwrittenData.email;
    mappedData['Email'] = handwrittenData.email;
    mappedData['Email_Address'] = handwrittenData.email;
    console.log('✅ Mapped Field #14 - Email ID:', handwrittenData.email);
  }

  // Field #15: Indian Active Mobile Number
  if (handwrittenData.mobileNumberNativePlace || handwrittenData.alternatePhone) {
    const indianNumber = handwrittenData.mobileNumberNativePlace || handwrittenData.alternatePhone;
    mappedData['Indian_Active_Mobile_Number'] = indianNumber;
    mappedData['Mobile_Number_in_Native_Place'] = indianNumber;
    mappedData['Contact_Number'] = indianNumber;
    console.log('✅ Mapped Field #15 - Indian Active Mobile Number:', indianNumber);
  }

  // Field #16: Local Body Type (Panchayath/Municipality/Corporation)
  if (handwrittenData.panchayath || handwrittenData.municipality || handwrittenData.corporation) {
    let localBodyType = '';
    if (handwrittenData.panchayath) localBodyType = 'Panchayath';
    else if (handwrittenData.municipality) localBodyType = 'Municipality';
    else if (handwrittenData.corporation) localBodyType = 'Corporation';

    mappedData['Local_Body_Type'] = localBodyType;
    console.log('✅ Mapped Field #16 - Local Body Type:', localBodyType);
  }

  // Field #17: Taluk
  if (handwrittenData.taluk) {
    mappedData['Taluk'] = handwrittenData.taluk;
    console.log('✅ Mapped Field #17 - Taluk:', handwrittenData.taluk);
  }

  // Field #18: Village
  if (handwrittenData.village) {
    mappedData['Village'] = handwrittenData.village;
    console.log('✅ Mapped Field #18 - Village:', handwrittenData.village);
  }

  // Field #19: Local Body Name
  const localBodyName = handwrittenData.panchayath || handwrittenData.municipality || handwrittenData.corporation;
  if (localBodyName) {
    mappedData['Local_Body_Name'] = localBodyName;
    mappedData['Name_of_Panchayath/Municipality/Corporation'] = localBodyName;
    console.log('✅ Mapped Field #19 - Local Body Name:', localBodyName);
  }

  // Field #20: District
  if (handwrittenData.district) {
    mappedData['District'] = handwrittenData.district;
    console.log('✅ Mapped Field #20 - District:', handwrittenData.district);
  }

  // Field #21: Current Residence Address (Abroad)
  if (handwrittenData.abroadAddress || handwrittenData.currentAddress) {
    const abroadAddr = handwrittenData.abroadAddress || handwrittenData.currentAddress;
    mappedData['Current_Residence_Address_(Abroad)'] = abroadAddr;
    mappedData['Abroad_Current_Residence_address'] = abroadAddr;
    mappedData['Current_Residence_Address'] = abroadAddr;
    console.log('✅ Mapped Field #21 - Current Residence Address (Abroad):', abroadAddr);
  }

  // Field #22: Aadhaar Number
  if (handwrittenData.aadharNumber) {
    mappedData['Aadhaar_Number'] = handwrittenData.aadharNumber;
    mappedData['Aadhar_Number'] = handwrittenData.aadharNumber;
    mappedData['Aadhar_number'] = handwrittenData.aadharNumber;
    console.log('✅ Mapped Field #22 - Aadhaar Number:', handwrittenData.aadharNumber);
  }

  // Field #23: Nominee Date of Birth (from Admin Form, fallback to Aadhaar Front)
  // Note: Aadhaar fallback will be handled in the main form builder
  if (handwrittenData.nomineeDateOfBirth) {
    mappedData['Nominee_Date_of_Birth'] = handwrittenData.nomineeDateOfBirth;
    console.log('✅ Mapped Field #23 - Nominee Date of Birth:', handwrittenData.nomineeDateOfBirth);
  }

  // Field #24: Nominee 1 Name
  if (handwrittenData.nomineeName) {
    mappedData['Nominee_1_Name'] = handwrittenData.nomineeName;
    mappedData['Nominee_Name'] = handwrittenData.nomineeName;
    console.log('✅ Mapped Field #24 - Nominee 1 Name:', handwrittenData.nomineeName);
  }

  // Field #39: Nominee name (duplicate/same as #24)
  if (handwrittenData.nomineeName) {
    mappedData['Nominee_name'] = handwrittenData.nomineeName;
    console.log('✅ Mapped Field #39 - Nominee name:', handwrittenData.nomineeName);
  }

  // Field #40: Relationship
  if (handwrittenData.relationshipWithNominee) {
    mappedData['Relationship'] = handwrittenData.relationshipWithNominee;
    mappedData['Relationship_with_Nominee'] = handwrittenData.relationshipWithNominee;
    console.log('✅ Mapped Field #40 - Relationship:', handwrittenData.relationshipWithNominee);
  }

  // Field #44: Current Residence
  if (handwrittenData.currentAddress || handwrittenData.abroadAddress) {
    const currentRes = handwrittenData.currentAddress || handwrittenData.abroadAddress;
    mappedData['Current_Residence'] = currentRes;
    console.log('✅ Mapped Field #44 - Current Residence:', currentRes);
  }

  // Field #45: Mobile number (IND)
  if (handwrittenData.mobileNumberNativePlace || handwrittenData.nomineeMobileNumber) {
    const indMobile = handwrittenData.mobileNumberNativePlace || handwrittenData.nomineeMobileNumber;
    mappedData['Mobile_number_(IND)'] = indMobile;
    mappedData['Mobile_Number_(IND)'] = indMobile;
    console.log('✅ Mapped Field #45 - Mobile number (IND):', indMobile);
  }

  console.log('📊 Total Admin Form fields mapped:', Object.keys(mappedData).length);

  // NOTE: The following fields should NOT be mapped from Admin Form:
  // - Permanent Residence Address (Field #12) → Passport Back only
  // - PIN Code (Field #13) → Passport Back only
  // - Father/Guardian Name (Field #38) → Passport Back only
  // - Form Collected By (Field #27) → Manual Entry only
  // - Banking information → Not in the 46-field mapping
  // - Nominee mobile/family info → Not in the 46-field mapping or already mapped
  // - PAN Number → Not in the 46-field mapping
  // - Submission Date → Not in the 46-field mapping

  // ========== END OF ADMIN FORM MAPPING ==========
  // Admin Form should only map 21 fields as specified in FIELD_TO_DOCUMENT_MAPPING_TEMPLATE.md

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