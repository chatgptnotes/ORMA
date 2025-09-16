import { supabase, PassportRecord } from '../config/supabase';

/**
 * Save extracted passport data to Supabase
 */
export async function savePassportData(data: PassportRecord): Promise<{ success: boolean; data?: PassportRecord; error?: string }> {
  try {
    console.log('Saving passport data to Supabase:', data);
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase configuration missing');
      return { success: false, error: 'Database configuration missing. Please check environment variables.' };
    }

    // Insert the passport record
    const { data: insertedData, error } = await supabase
      .from('passport_records')
      .insert([{
        ...data,
        extraction_timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      // Provide more specific error messages
      if (error.message.includes('fetch')) {
        return { success: false, error: 'Network error: Unable to connect to database. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }

    console.log('Successfully saved passport data:', insertedData);
    return { success: true, data: insertedData };
  } catch (error) {
    console.error('Error saving passport data:', error);
    // Better error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Network error: Unable to connect to database. Please check your connection.' };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred while saving data' };
  }
}

/**
 * Update existing passport record
 */
export async function updatePassportData(id: string, data: Partial<PassportRecord>): Promise<{ success: boolean; data?: PassportRecord; error?: string }> {
  try {
    const { data: updatedData, error } = await supabase
      .from('passport_records')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: updatedData };
  } catch (error) {
    console.error('Error updating passport data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all passport records
 */
export async function getAllPassportRecords(): Promise<{ success: boolean; data?: PassportRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching passport records:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get passport record by ID
 */
export async function getPassportRecord(id: string): Promise<{ success: boolean; data?: PassportRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching passport record:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete passport record
 */
export async function deletePassportRecord(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('passport_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting passport record:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Search passport records by passport number
 */
export async function searchByPassportNumber(passportNumber: string): Promise<{ success: boolean; data?: PassportRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .ilike('passport_number', `%${passportNumber}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase search error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching passport records:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get the latest passport record from the database
 */
export async function getLatestPassportRecord(): Promise<{ success: boolean; data?: PassportRecord; error?: string }> {
  try {
    console.log('Fetching latest passport record from Supabase...');

    const { data, error } = await supabase
      .from('passport_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Handle no records found case
      if (error.code === 'PGRST116') {
        console.log('No passport records found in database');
        return { success: false, error: 'No records found' };
      }
      console.error('Supabase fetch error:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully fetched latest passport record:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching latest passport record:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Convert extracted passport data to Supabase record format
 */
export function formatPassportDataForSupabase(extractedData: any, fileName?: string): PassportRecord {
  return {
    full_name: extractedData.fullName,
    given_name: extractedData.givenName,
    surname: extractedData.surname,
    date_of_birth: extractedData.dateOfBirth,
    gender: extractedData.gender,
    nationality: extractedData.nationality,
    father_name: extractedData.fatherName,
    mother_name: extractedData.motherName,
    spouse_name: extractedData.spouseName,
    passport_number: extractedData.passportNumber,
    date_of_issue: extractedData.dateOfIssue,
    date_of_expiry: extractedData.dateOfExpiry,
    place_of_issue: extractedData.placeOfIssue,
    place_of_birth: extractedData.placeOfBirth,
    address: extractedData.address,
    pin_code: extractedData.pinCode,
    form_data: extractedData, // Store complete extracted data as JSON
    extraction_confidence: extractedData.confidence || 0,
    source_file_name: fileName,
    extraction_timestamp: new Date().toISOString()
  };
}

/**
 * Convert Supabase record to form field format
 */
export function mapDatabaseRecordToFormFields(record: PassportRecord): Record<string, any> {
  return {
    // Basic Name Fields
    'Applicant_Full_Name_in_CAPITAL': record.full_name || '',
    'First_Name': record.given_name || '',
    'Middle_Name': '', // No direct mapping in database
    'Last_Name': record.surname || '',

    // Contact Information
    'UAE_Mobile_Number': record.mobile_number || '',
    'WhatsApp_Number': record.mobile_number || '', // Using same as mobile
    'Email_ID': record.email || '',
    'Indian_Active_Mobile_Number': record.alternate_phone || '',

    // Address Information
    'Permanent_Residence_Address': record.permanent_address || record.address || '',
    'PIN_Code': record.pin_code || '',
    'Current_Residence_Address_(Abroad)': record.address || '',

    // Location Details
    'District': record.district || '',
    'Taluk': '', // No direct mapping
    'Village': '', // No direct mapping
    'Local_Body_Name': '', // No direct mapping
    'Local_Body_Type': '', // No direct mapping

    // Document Numbers
    'Aadhaar_Number': record.aadhar_number || '',
    'NORKA_ID_NUMER': record.application_number || '',
    'KSHEMANIDHI_ID_NUMBER': '', // No direct mapping

    // Passport Details
    'Passport_Number': record.passport_number || '',
    'Passport_Issue_Date': record.date_of_issue || '',
    'Passport_Expiry_Date': record.date_of_expiry || '',
    'Passport_Issued_Place': record.place_of_issue || '',

    // Personal Information
    'Date_of_Birth': record.date_of_birth || '',
    'Father/Guardian_Name': record.father_name || '',
    'Gender': record.gender || '',

    // Visa/Employment Details
    'Visa_Number': '', // No direct mapping
    'Sponsor/Company_Name': '', // No direct mapping
    'Visa_Expiry_Date': '', // No direct mapping
    'Occupation': record.occupation || '',

    // Additional Information from form_data JSON if available
    ...(record.form_data && typeof record.form_data === 'object' ? record.form_data : {})
  };
}