import { supabase } from '../config/supabase';

// Interface for passport record from database
export interface PassportRecord {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  given_name: string | null;
  surname: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  father_name: string | null;
  mother_name: string | null;
  spouse_name: string | null;
  passport_number: string | null;
  date_of_issue: string | null;
  date_of_expiry: string | null;
  place_of_issue: string | null;
  place_of_birth: string | null;
  address: string | null;
  permanent_address: string | null;
  pin_code: string | null;
  mobile_number: string | null;
  email: string | null;
  alternate_phone: string | null;
  aadhar_number: string | null;
  district: string | null;
  occupation: string | null;
  application_number: string | null;
  form_data: any;
  extraction_confidence: number | null;
  source_file_name: string | null;
  extraction_timestamp: string | null;
}

// Interface for form field data
export interface FormFieldData {
  [key: string]: string | null;
}

// Helper function to convert DD/MM/YYYY to YYYY-MM-DD format for HTML date inputs
const convertDateFormat = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  
  console.log('Converting date format for:', dateStr);
  
  // Check if it's already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log('Date already in YYYY-MM-DD format:', dateStr);
    return dateStr;
  }
  
  // Check if it's in DD/MM/YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const convertedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('Converted DD/MM/YYYY to YYYY-MM-DD:', dateStr, '->', convertedDate);
    return convertedDate;
  }
  
  console.log('Date format not recognized, returning as-is:', dateStr);
  return dateStr;
};

// Fetch the latest passport record for the current user
export async function fetchLatestPassportRecord(): Promise<PassportRecord | null> {
  try {
    console.log('Fetching latest passport record...');

    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching passport records:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('No passport records found');
      return null;
    }

    console.log('Latest passport record found:', data[0]);
    return data[0] as PassportRecord;
  } catch (error) {
    console.error('Error in fetchLatestPassportRecord:', error);
    throw error;
  }
}

// Get count of passport records
export async function getPassportRecordCount(): Promise<number> {
  try {
    console.log('Getting passport record count...');

    const { count, error } = await supabase
      .from('passport_records')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting passport record count:', error);
      return 0;
    }

    console.log('Passport record count:', count);
    return count || 0;
  } catch (error) {
    console.error('Error in getPassportRecordCount:', error);
    return 0;
  }
}

// Map passport record data to form field format
// Uses FormBuilder's key generation pattern: label.replace(/\s+/g, '_')
export function mapPassportRecordToFormFields(passportRecord: PassportRecord): FormFieldData {
  console.log('Mapping passport record to form fields:', passportRecord);
  console.log('Database date_of_issue value:', passportRecord.date_of_issue);
  console.log('Database date_of_expiry value:', passportRecord.date_of_expiry);
  console.log('Database date_of_issue type:', typeof passportRecord.date_of_issue);

  const mappedData: FormFieldData = {
    // Organization Fields (priority mapping)
    'ORGANISATION': passportRecord.form_data?.ORGANISATION || 'ORMA',
    'Apply_For': Array.isArray(passportRecord.form_data?.Apply_For) 
      ? passportRecord.form_data.Apply_For.join(',') 
      : passportRecord.form_data?.Apply_For || 'KSHEMANIDHI',
    'Type': passportRecord.form_data?.Type || 'NEW',
    'NORKA_ID_NUMER': passportRecord.application_number || passportRecord.form_data?.NORKA_ID_NUMER || null,
    'KSHEMANIDHI_ID_NUMBER': passportRecord.form_data?.KSHEMANIDHI_ID_NUMBER || null,

    // Name fields (priority mapping)
    'Applicant_Full_Name_in_CAPITAL': passportRecord.full_name?.toUpperCase() || null,
    'First_Name': passportRecord.given_name || null,
    'Middle_Name': passportRecord.form_data?.Middle_Name || null,
    'Last_Name': passportRecord.surname || null,
    
    // Contact Information
    'UAE_Mobile_Number': passportRecord.mobile_number || null,
    'WhatsApp_Number': passportRecord.form_data?.WhatsApp_Number || passportRecord.mobile_number || null,
    'Email_ID': passportRecord.email || null,
    'Indian_Active_Mobile_Number': passportRecord.alternate_phone || passportRecord.form_data?.Indian_Active_Mobile_Number || null,
    'Mobile_number_(IND)': passportRecord.alternate_phone || null,
    
    // Address Information
    'Permanent_Residence_Address': passportRecord.permanent_address || passportRecord.address || null,
    'Current_Residence_Address_(Abroad)': passportRecord.address || null,
    'PIN_Code': passportRecord.pin_code || null,
    'Current_Residence': passportRecord.form_data?.Current_Residence || null,

    // Location Details
    'District': passportRecord.district || null,
    'Local_Body_Type': passportRecord.form_data?.Local_Body_Type || null,
    'Taluk': passportRecord.form_data?.Taluk || null,
    'Village': passportRecord.form_data?.Village || null,
    'Local_Body_Name': passportRecord.form_data?.Local_Body_Name || null,
    
    // Personal Information with date conversion
    'Date_of_Birth': convertDateFormat(passportRecord.date_of_birth),
    'DOB': convertDateFormat(passportRecord.date_of_birth),
    'Gender': passportRecord.gender || null,
    'Nationality': passportRecord.nationality || null,
    'Place_of_Birth': passportRecord.place_of_birth || null,
    
    // Document Numbers
    'Aadhaar_Number': passportRecord.aadhar_number || null,
    
    // Passport Information (with variations and date conversion)
    'Passport_Number': passportRecord.passport_number || null,
    'Passport_Issue_Date': convertDateFormat(passportRecord.date_of_issue),
    'Date_of_Issue': convertDateFormat(passportRecord.date_of_issue),
    'Passport_Expiry_Date': convertDateFormat(passportRecord.date_of_expiry),
    'Date_of_Expiry': convertDateFormat(passportRecord.date_of_expiry),
    'Passport_Issued_Place': passportRecord.place_of_issue || null,
    
    // Family information
    'Father/Guardian_Name': passportRecord.father_name || null,
    'Father_Name': passportRecord.father_name || null,
    'Mother_Name': passportRecord.mother_name || null,
    'Spouse_Name': passportRecord.spouse_name || null,

    // Employment/Occupation
    'Occupation': passportRecord.occupation || null,
    'Current_Occupation': passportRecord.occupation || null,
    'Sponsor/Company_Name': passportRecord.form_data?.['Sponsor/Company_Name'] || null,

    // Nominee Details
    'Nominee_name': passportRecord.form_data?.Nominee_name || null,
    'Nominee_Date_of_Birth': convertDateFormat(passportRecord.form_data?.Nominee_Date_of_Birth),
    'Nominee_1_Name': passportRecord.form_data?.Nominee_1_Name || null,
    'Nominee_2_Name': passportRecord.form_data?.Nominee_2_Name || null,
    'Nominee_3_Name': passportRecord.form_data?.Nominee_3_Name || null,
    'Relationship': passportRecord.form_data?.Relationship || null,
    'Age_autocalculate': passportRecord.form_data?.Age_autocalculate || null,

    // Visa Details
    'Visa_Number': passportRecord.form_data?.Visa_Number || null,
    'Visa_Expiry_Date': convertDateFormat(passportRecord.form_data?.Visa_Expiry_Date),

    // Additional Form Fields
    'Form_Collected_By': passportRecord.form_data?.Form_Collected_By || null,
    'Uploaded_Copies': passportRecord.form_data?.Uploaded_Copies || null,
    'Percentage': passportRecord.form_data?.Percentage || null,
  };

  // Merge with any additional form_data that might not be mapped
  if (passportRecord.form_data && typeof passportRecord.form_data === 'object') {
    Object.keys(passportRecord.form_data).forEach(key => {
      // Only add if not already mapped and not an array/object
      if (!mappedData[key] && typeof passportRecord.form_data[key] !== 'object') {
        mappedData[key] = passportRecord.form_data[key];
      }
    });
  }

  // Remove null values to keep form clean
  const cleanedData: FormFieldData = {};
  Object.entries(mappedData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      cleanedData[key] = String(value);
    }
  });

  console.log('Mapped form data:', cleanedData);
  console.log('Passport_Issue_Date mapped value:', cleanedData['Passport_Issue_Date']);
  console.log('Passport_Expiry_Date mapped value:', cleanedData['Passport_Expiry_Date']);
  return cleanedData;
}

// Transform extracted data (camelCase) to database schema (snake_case)
function transformToDbSchema(extractedData: any): Partial<PassportRecord> {
  const dbData: Partial<PassportRecord> = {
    // Map camelCase to snake_case for database
    full_name: extractedData.fullName || extractedData.full_name,
    given_name: extractedData.givenName || extractedData.given_name, 
    surname: extractedData.surname,
    date_of_birth: extractedData.dateOfBirth || extractedData.date_of_birth,
    gender: extractedData.gender,
    nationality: extractedData.nationality,
    father_name: extractedData.fatherName || extractedData.father_name,
    mother_name: extractedData.motherName || extractedData.mother_name,
    spouse_name: extractedData.spouseName || extractedData.spouse_name,
    passport_number: extractedData.passportNumber || extractedData.passport_number,
    date_of_issue: extractedData.dateOfIssue || extractedData.date_of_issue,
    date_of_expiry: extractedData.dateOfExpiry || extractedData.date_of_expiry,
    place_of_issue: extractedData.placeOfIssue || extractedData.place_of_issue,
    place_of_birth: extractedData.placeOfBirth || extractedData.place_of_birth,
    address: extractedData.address,
    permanent_address: extractedData.permanentAddress || extractedData.permanent_address,
    pin_code: extractedData.pinCode || extractedData.pin_code,
    district: extractedData.district,
    mobile_number: extractedData.mobileNumber || extractedData.mobile_number,
    email: extractedData.email,
    alternate_phone: extractedData.alternatePhone || extractedData.alternate_phone,
    aadhar_number: extractedData.aadharNumber || extractedData.aadhar_number,
    occupation: extractedData.occupation,
    application_number: extractedData.applicationNumber || extractedData.application_number,
    form_data: extractedData, // Store complete extracted data as JSON
    extraction_confidence: extractedData.confidence || extractedData.extraction_confidence,
    source_file_name: extractedData.sourceFileName || extractedData.source_file_name
  };

  // Remove undefined values
  Object.keys(dbData).forEach(key => {
    if (dbData[key as keyof PassportRecord] === undefined) {
      delete dbData[key as keyof PassportRecord];
    }
  });

  return dbData;
}

// Save passport data to database
export async function savePassportData(data: any): Promise<PassportRecord> {
  try {
    console.log('Saving passport data to database...');
    console.log('Original extracted data:', data);

    // Transform camelCase extracted data to snake_case database schema
    const dbData = transformToDbSchema(data);
    console.log('Transformed database data:', dbData);

    const { data: savedData, error } = await supabase
      .from('passport_records')
      .insert([{
        ...dbData,
        extraction_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving passport data:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to save passport data: ${error.message}`);
    }

    console.log('Successfully saved passport data:', savedData);
    return savedData as PassportRecord;
  } catch (error) {
    console.error('Error in savePassportData:', error);
    throw error;
  }
}

// Find existing record by passport number
export async function findExistingRecordByPassport(passportNumber: string): Promise<PassportRecord | null> {
  try {
    if (!passportNumber || passportNumber.trim() === '') {
      return null;
    }

    console.log('Searching for existing record with passport number:', passportNumber);

    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .eq('passport_number', passportNumber.trim())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error searching for passport record:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log('No existing record found for passport number:', passportNumber);
      return null;
    }

    console.log('Found existing record:', data[0]);
    return data[0] as PassportRecord;
  } catch (error) {
    console.error('Error in findExistingRecordByPassport:', error);
    return null;
  }
}

// Smart merge function for combining data from multiple passport pages
export function mergePassportData(existingData: PassportRecord, newData: any, pageType: string): Partial<PassportRecord> {
  console.log('Merging passport data:', { existingData, newData, pageType });

  // Create a copy of existing data
  const mergedData = { ...existingData };

  // Page-specific merge logic
  if (pageType === 'front') {
    // Front page has priority for personal information
    mergedData.full_name = newData.fullName || newData.full_name || mergedData.full_name;
    mergedData.given_name = newData.givenName || newData.given_name || mergedData.given_name;
    mergedData.surname = newData.surname || mergedData.surname;
    mergedData.date_of_birth = newData.dateOfBirth || newData.date_of_birth || mergedData.date_of_birth;
    mergedData.gender = newData.gender || mergedData.gender;
    mergedData.nationality = newData.nationality || mergedData.nationality;
    mergedData.passport_number = newData.passportNumber || newData.passport_number || mergedData.passport_number;
    mergedData.date_of_issue = newData.dateOfIssue || newData.date_of_issue || mergedData.date_of_issue;
    mergedData.date_of_expiry = newData.dateOfExpiry || newData.date_of_expiry || mergedData.date_of_expiry;
    mergedData.place_of_issue = newData.placeOfIssue || newData.place_of_issue || mergedData.place_of_issue;
    mergedData.place_of_birth = newData.placeOfBirth || newData.place_of_birth || mergedData.place_of_birth;
  } else if (pageType === 'address' || pageType === 'last_page') {
    // Address page has priority for address and contact information
    mergedData.address = newData.address || mergedData.address;
    mergedData.permanent_address = newData.permanentAddress || newData.permanent_address || mergedData.permanent_address;
    mergedData.pin_code = newData.pinCode || newData.pin_code || mergedData.pin_code;
    mergedData.district = newData.district || mergedData.district;
    mergedData.mobile_number = newData.mobileNumber || newData.mobile_number || mergedData.mobile_number;
    mergedData.email = newData.email || mergedData.email;
    mergedData.alternate_phone = newData.alternatePhone || newData.alternate_phone || mergedData.alternate_phone;
    mergedData.father_name = newData.fatherName || newData.father_name || mergedData.father_name;
    mergedData.mother_name = newData.motherName || newData.mother_name || mergedData.mother_name;
    mergedData.spouse_name = newData.spouseName || newData.spouse_name || mergedData.spouse_name;
  } else if (pageType === 'back') {
    // Back page might have additional details
    mergedData.father_name = newData.fatherName || newData.father_name || mergedData.father_name;
    mergedData.mother_name = newData.motherName || newData.mother_name || mergedData.mother_name;
    mergedData.spouse_name = newData.spouseName || newData.spouse_name || mergedData.spouse_name;
    mergedData.address = newData.address || mergedData.address;
  }

  // Always update form_data with page-specific information
  const currentFormData = mergedData.form_data || {};
  mergedData.form_data = {
    ...currentFormData,
    pageData: {
      ...currentFormData.pageData,
      [pageType]: newData
    },
    uploadHistory: [
      ...(currentFormData.uploadHistory || []),
      {
        pageType,
        timestamp: new Date().toISOString(),
        extractedFields: Object.keys(newData).length
      }
    ]
  };

  // Update metadata
  mergedData.updated_at = new Date().toISOString();
  mergedData.extraction_timestamp = new Date().toISOString();

  console.log('Merged data result:', mergedData);
  return mergedData;
}

// Update existing passport data with fallback to create new record
export async function updatePassportData(id: string, data: any): Promise<PassportRecord> {
  try {
    console.log('Updating passport data:', id);
    console.log('Original update data:', data);

    // Transform camelCase data to snake_case database schema
    const dbData = transformToDbSchema(data);
    console.log('Transformed update data:', dbData);

    // First, check if the record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('passport_records')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing record:', checkError);
      throw new Error(`Failed to check existing record: ${checkError.message}`);
    }

    if (!existingRecord) {
      console.log('Record not found, creating new record instead of updating');
      // Record doesn't exist, create a new one
      const { data: newRecord, error: createError } = await supabase
        .from('passport_records')
        .insert({
          id: id, // Use the provided ID
          ...dbData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating new passport record:', createError);
        throw new Error(`Failed to create passport data: ${createError.message}`);
      }

      console.log('Successfully created new passport data:', newRecord);
      return newRecord as PassportRecord;
    }

    // Record exists, proceed with update
    const { data: updatedData, error } = await supabase
      .from('passport_records')
      .update({
        ...dbData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating passport data:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to update passport data: ${error.message}`);
    }

    console.log('Successfully updated passport data:', updatedData);
    return updatedData as PassportRecord;
  } catch (error) {
    console.error('Error in updatePassportData:', error);
    throw error;
  }
}