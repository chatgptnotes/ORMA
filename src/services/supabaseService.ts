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
        console.log('No passport records found in database. Creating sample data...');

        // Create sample data for demonstration
        const sampleData: PassportRecord = {
          full_name: 'JOHN DOE',
          given_name: 'John',
          surname: 'Doe',
          mobile_number: '0501234567',
          email: 'john.doe@example.com',
          address: 'Building 123, Street 45, Dubai, UAE',
          permanent_address: 'House No 123, Kerala, India',
          pin_code: '680001',
          aadhar_number: '1234 5678 9012',
          passport_number: 'A1234567',
          date_of_birth: '01/01/1990',
          date_of_issue: '01/01/2020',
          date_of_expiry: '31/12/2030',
          place_of_issue: 'Dubai',
          father_name: 'Robert Doe',
          district: 'Thrissur',
          occupation: 'Engineer',
          gender: 'Male',
          form_data: {
            ORGANISATION: 'ORMA',
            Apply_For: ['KSHEMANIDHI', 'NORKA ID'],
            Type: 'NEW',
            Middle_Name: 'Michael',
            WhatsApp_Number: '+971501234567',
            Indian_Active_Mobile_Number: '+919876543210',
            Local_Body_Type: 'Municipality',
            Taluk: 'Thrissur',
            Village: 'Ollur',
            Local_Body_Name: 'Thrissur Municipality',
            Nominee_1_Name: 'Jane Doe',
            Relationship: 'Spouse',
            Form_Collected_By: 'Admin'
          }
        };

        // Try to insert sample data
        const { data: insertedData, error: insertError } = await savePassportData(sampleData);

        if (insertedData && !insertError) {
          console.log('Sample data created successfully');
          return { success: true, data: insertedData };
        }

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
  const mappedData: Record<string, any> = {
    // Organization Fields
    'ORGANISATION': record.form_data?.ORGANISATION || 'ORMA',
    'Apply_For': record.form_data?.Apply_For || ['KSHEMANIDHI'],
    'Type': record.form_data?.Type || 'NEW',
    'NORKA_ID_NUMER': record.application_number || record.form_data?.NORKA_ID_NUMER || '',
    'KSHEMANIDHI_ID_NUMBER': record.form_data?.KSHEMANIDHI_ID_NUMBER || '',

    // Basic Name Fields (exact labels from form)
    'Applicant_Full_Name_in_CAPITAL': record.full_name?.toUpperCase() || '',
    'First_Name': record.given_name || '',
    'Middle_Name': record.form_data?.Middle_Name || '',
    'Last_Name': record.surname || '',

    // Contact Information
    'UAE_Mobile_Number': record.mobile_number || '',
    'WhatsApp_Number': record.mobile_number || record.form_data?.WhatsApp_Number || '',
    'Email_ID': record.email || '',
    'Indian_Active_Mobile_Number': record.alternate_phone || '',

    // Address Information
    'Permanent_Residence_Address': record.permanent_address || record.address || '',
    'PIN_Code': record.pin_code || '',
    'Current_Residence_Address_(Abroad)': record.address || '',

    // Location Details
    'Local_Body_Type': record.form_data?.Local_Body_Type || '',
    'Taluk': record.form_data?.Taluk || '',
    'Village': record.form_data?.Village || '',
    'Local_Body_Name': record.form_data?.Local_Body_Name || '',
    'District': record.district || '',

    // Document Numbers
    'Aadhaar_Number': record.aadhar_number || '',

    // Passport Details
    'Passport_Number': record.passport_number || '',
    'Passport_Issue_Date': record.date_of_issue || '',
    'Passport_Expiry_Date': record.date_of_expiry || '',
    'Passport_Issued_Place': record.place_of_issue || '',

    // Personal Information
    'Date_of_Birth': record.date_of_birth || '',
    'Father/Guardian_Name': record.father_name || '',

    // Nominee Details
    'Nominee_name': record.form_data?.Nominee_name || '',
    'Nominee_Date_of_Birth': record.form_data?.Nominee_Date_of_Birth || '',
    'Nominee_1_Name': record.form_data?.Nominee_1_Name || '',
    'Nominee_2_Name': record.form_data?.Nominee_2_Name || '',
    'Nominee_3_Name': record.form_data?.Nominee_3_Name || '',
    'Relationship': record.form_data?.Relationship || '',
    'Age_autocalculate': record.form_data?.Age_autocalculate || '',

    // Visa/Employment Details
    'Visa_Number': record.form_data?.Visa_Number || '',
    'Sponsor/Company_Name': record.form_data?.['Sponsor/Company_Name'] || '',
    'Visa_Expiry_Date': record.form_data?.Visa_Expiry_Date || '',
    'Occupation': record.occupation || '',
    'Current_Occupation': record.occupation || '',

    // Other fields
    'Form_Collected_By': record.form_data?.Form_Collected_By || '',
    'Uploaded_Copies': record.form_data?.Uploaded_Copies || '',
    'Gender': record.gender || '',
    'Place_of_Birth': record.place_of_birth || '',
    'Current_Residence': record.form_data?.Current_Residence || '',
    'Mobile_number_(IND)': record.alternate_phone || '',
    'Percentage': record.form_data?.Percentage || ''
  };

  // Merge with any additional form_data that might not be mapped
  if (record.form_data && typeof record.form_data === 'object') {
    Object.keys(record.form_data).forEach(key => {
      // Only add if not already mapped
      if (!mappedData[key]) {
        mappedData[key] = record.form_data[key];
      }
    });
  }

  return mappedData;
}