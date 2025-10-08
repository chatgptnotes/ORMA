import { supabase } from '../config/supabase';

// Interface for extracted Aadhaar data
export interface ExtractedAadharData {
  // Personal Information
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;

  // Aadhaar Identification
  aadharNumber?: string;

  // Address Information (from back side)
  address?: string;
  pinCode?: string;
  district?: string;
  state?: string;

  // Photo and signature detection
  hasPhoto?: boolean;
  hasSignature?: boolean;

  // Any other extracted fields
  [key: string]: string | boolean | undefined;
}

// Interface for Aadhaar record in database
export interface AadharRecord {
  id: string;
  created_at: string;
  updated_at: string;
  passport_record_id: string | null;

  // Personal Information
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;

  // Aadhaar Identification
  aadhar_number: string | null;

  // Address Information
  address: string | null;
  pin_code: string | null;
  district: string | null;
  state: string | null;

  // Document Processing
  source_file_name: string | null;
  extraction_timestamp: string | null;
  extraction_confidence: number | null;
  page_type: string | null;
  has_photo: boolean | null;
  has_signature: boolean | null;
}

/**
 * Save Aadhaar record to database
 */
export async function saveAadharRecord(
  extractedData: ExtractedAadharData,
  sourceFileName: string,
  confidence: number,
  pageType: string,
  passportRecordId?: string
): Promise<string> {
  try {
    console.log('💾 Saving Aadhaar record to database...');
    console.log('📊 Extracted data:', extractedData);

    // Prepare record for insertion
    const aadharRecord: Partial<AadharRecord> = {
      passport_record_id: passportRecordId || null,

      // Personal Information
      full_name: extractedData.fullName || null,
      date_of_birth: extractedData.dateOfBirth || null,
      gender: extractedData.gender || null,

      // Aadhaar Identification
      aadhar_number: extractedData.aadharNumber || null,

      // Address Information
      address: extractedData.address || null,
      pin_code: extractedData.pinCode || null,
      district: extractedData.district || null,
      state: extractedData.state || null,

      // Document Processing
      source_file_name: sourceFileName,
      extraction_timestamp: new Date().toISOString(),
      extraction_confidence: confidence,
      page_type: pageType,
      has_photo: extractedData.hasPhoto || null,
      has_signature: extractedData.hasSignature || null,
    };

    console.log('💾 Inserting Aadhaar record:', aadharRecord);

    const { data, error } = await supabase
      .from('aadhar_records')
      .insert(aadharRecord)
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving Aadhaar record:', error);
      throw new Error(`Failed to save Aadhaar record: ${error.message}`);
    }

    console.log('✅ Aadhaar record saved successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error in saveAadharRecord:', error);
    throw error;
  }
}

/**
 * Update existing Aadhaar record
 */
export async function updateAadharRecord(
  recordId: string,
  extractedData: ExtractedAadharData,
  sourceFileName: string,
  confidence: number,
  pageType: string
): Promise<void> {
  try {
    console.log('🔄 Updating Aadhaar record:', recordId);

    // Prepare update data
    const updateData: Partial<AadharRecord> = {
      // Personal Information
      full_name: extractedData.fullName || null,
      date_of_birth: extractedData.dateOfBirth || null,
      gender: extractedData.gender || null,

      // Aadhaar Identification
      aadhar_number: extractedData.aadharNumber || null,

      // Address Information
      address: extractedData.address || null,
      pin_code: extractedData.pinCode || null,
      district: extractedData.district || null,
      state: extractedData.state || null,

      // Document Processing
      source_file_name: sourceFileName,
      extraction_timestamp: new Date().toISOString(),
      extraction_confidence: confidence,
      page_type: pageType,
      has_photo: extractedData.hasPhoto || null,
      has_signature: extractedData.hasSignature || null,
    };

    const { error } = await supabase
      .from('aadhar_records')
      .update(updateData)
      .eq('id', recordId);

    if (error) {
      console.error('❌ Error updating Aadhaar record:', error);
      throw new Error(`Failed to update Aadhaar record: ${error.message}`);
    }

    console.log('✅ Aadhaar record updated successfully');
  } catch (error) {
    console.error('❌ Error in updateAadharRecord:', error);
    throw error;
  }
}

/**
 * Find Aadhaar record by Aadhaar number
 */
export async function findAadharByNumber(aadharNumber: string): Promise<AadharRecord | null> {
  try {
    console.log('🔍 Searching for Aadhaar record with number:', aadharNumber);

    const { data, error } = await supabase
      .from('aadhar_records')
      .select('*')
      .eq('aadhar_number', aadharNumber)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error finding Aadhaar record:', error);
      throw new Error(`Failed to find Aadhaar record: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No Aadhaar record found with number:', aadharNumber);
      return null;
    }

    console.log('✅ Found Aadhaar record:', data[0].id);
    return data[0] as AadharRecord;
  } catch (error) {
    console.error('❌ Error in findAadharByNumber:', error);
    throw error;
  }
}

/**
 * Get latest Aadhaar record
 */
export async function getLatestAadharRecord(): Promise<AadharRecord | null> {
  try {
    console.log('🔍 Fetching latest Aadhaar record...');

    const { data, error } = await supabase
      .from('aadhar_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching latest Aadhaar record:', error);
      throw new Error(`Failed to fetch latest Aadhaar record: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No Aadhaar records found');
      return null;
    }

    console.log('✅ Found latest Aadhaar record:', data[0].id);
    return data[0] as AadharRecord;
  } catch (error) {
    console.error('❌ Error in getLatestAadharRecord:', error);
    throw error;
  }
}
