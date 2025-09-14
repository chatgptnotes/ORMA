import { supabase, PassportRecord } from '../config/supabase';

/**
 * Save extracted passport data to Supabase
 */
export async function savePassportData(data: PassportRecord): Promise<{ success: boolean; data?: PassportRecord; error?: string }> {
  try {
    console.log('Saving passport data to Supabase:', data);
    
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
      return { success: false, error: error.message };
    }

    console.log('Successfully saved passport data:', insertedData);
    return { success: true, data: insertedData };
  } catch (error) {
    console.error('Error saving passport data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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