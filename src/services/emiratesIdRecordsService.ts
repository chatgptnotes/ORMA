import { supabase } from '../config/supabase';

// Interface for Emirates ID record from database
export interface EmiratesIdRecord {
  id: string;
  created_at: string;
  updated_at: string;
  passport_record_id: string | null;
  
  // Emirates ID Identification
  emirates_id_number: string | null;
  id_number_segments: any | null;
  
  // Personal Information (English)
  full_name_english: string | null;
  first_name_english: string | null;
  middle_name_english: string | null;
  last_name_english: string | null;
  
  // Personal Information (Arabic)
  full_name_arabic: string | null;
  first_name_arabic: string | null;
  middle_name_arabic: string | null;
  last_name_arabic: string | null;
  
  // Personal Details
  date_of_birth: string | null;
  nationality: string | null;
  gender: string | null;
  
  // Document Information
  issuing_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  
  // Biometric Information
  has_photo: boolean | null;
  has_signature: boolean | null;
  photo_quality_score: number | null;
  
  // Residential Information
  emirates_residence: string | null;
  area_code: string | null;
  
  // Document Processing Information
  source_file_name: string | null;
  extraction_timestamp: string | null;
  extraction_confidence: number | null;
  page_type: string | null;
  
  // Verification and Status
  is_verified: boolean | null;
  verified_by: string | null;
  verification_date: string | null;
  verification_notes: string | null;
  
  // Status tracking
  document_status: string | null;
  renewal_date: string | null;
  
  // JSON storage
  raw_extracted_data: any | null;
  additional_fields: any | null;
  extraction_notes: string | null;
  admin_notes: string | null;
}

// Interface for Emirates ID extracted data
export interface ExtractedEmiratesIdData {
  fullNameEnglish?: string;
  fullNameArabic?: string;
  firstNameEnglish?: string;
  lastNameEnglish?: string;
  firstNameArabic?: string;
  lastNameArabic?: string;
  emiratesIdNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  issuingDate?: string;
  expiryDate?: string;
  emiratesResidence?: string;
  areaCode?: string;
  [key: string]: string | undefined;
}

// Helper function to format Emirates ID data for database
const formatEmiratesIdDataForSupabase = (extractedData: ExtractedEmiratesIdData, sourceFileName?: string): Partial<EmiratesIdRecord> => {
  console.log('🔄 DATABASE FORMATTING: Input extractedData:', extractedData);
  console.log('🔄 DATABASE FORMATTING: extractedData.emiratesIdNumber =', extractedData.emiratesIdNumber);
  console.log('🔄 DATABASE FORMATTING: typeof emiratesIdNumber =', typeof extractedData.emiratesIdNumber);
  
  // COMPREHENSIVE FIELD DEBUGGING
  console.log('🔄 DATABASE FORMATTING: ALL extractedData fields:');
  Object.entries(extractedData).forEach(([key, value]) => {
    console.log(`    "${key}": "${value}" (${typeof value})`);
  });
  
  // Check for Emirates ID pattern in ANY field
  const emiratesPattern = /\b\d{3}-\d{4}-\d{7}-\d{1}\b/;
  console.log('🔄 DATABASE FORMATTING: Scanning all fields for Emirates ID pattern...');
  let foundEmiratesIdInField = null;
  
  for (const [key, value] of Object.entries(extractedData)) {
    if (typeof value === 'string' && value.trim()) {
      if (emiratesPattern.test(value)) {
        console.log(`🔄 DATABASE FORMATTING: ✅ FOUND EMIRATES ID PATTERN in field "${key}":`, value);
        foundEmiratesIdInField = { field: key, value: value.match(emiratesPattern)?.[0] };
        break;
      }
    }
  }
  
  if (!foundEmiratesIdInField) {
    console.log('🔄 DATABASE FORMATTING: ❌ NO EMIRATES ID PATTERN found in any field');
  }
  
  // CRITICAL: Fix Emirates ID number if missing but found in other fields
  if (!extractedData.emiratesIdNumber) {
    console.error('❌ DATABASE FORMATTING: NO EMIRATES ID NUMBER in emiratesIdNumber field!');
    console.error('❌ DATABASE FORMATTING: Available fields:', Object.keys(extractedData));
    
    // Use the previously found Emirates ID
    if (foundEmiratesIdInField) {
      console.log(`🔄 DATABASE FORMATTING: EMERGENCY RECOVERY - Using Emirates ID from field "${foundEmiratesIdInField.field}":`, foundEmiratesIdInField.value);
      extractedData.emiratesIdNumber = foundEmiratesIdInField.value;
    } else {
      // Final fallback: check for alternative field names
      const alternativeFields = [
        'emirates_id_number', 'Emirates_ID_Number', 'ID_Number', 'emiratesId', 
        'id', 'idNumber', 'nationalId', 'identityNumber', 'documentNumber',
        'passportNumber', 'cardNumber', 'uaeId', 'federalId'
      ];
      
      console.log('🔄 DATABASE FORMATTING: Checking alternative field names...');
      for (const fieldName of alternativeFields) {
        if (extractedData[fieldName]) {
          const fieldValue = extractedData[fieldName];
          if (typeof fieldValue === 'string' && emiratesPattern.test(fieldValue)) {
            const extractedId = fieldValue.match(emiratesPattern)?.[0];
            console.log(`🔄 DATABASE FORMATTING: FIELD RECOVERY - Found Emirates ID in "${fieldName}":`, extractedId);
            extractedData.emiratesIdNumber = extractedId;
            break;
          }
        }
      }
    }
  }
  
  // FINAL VALIDATION
  if (!extractedData.emiratesIdNumber) {
    console.error('🚨 DATABASE FORMATTING: CRITICAL - Still no Emirates ID number after all recovery attempts!');
    console.error('🚨 Full extractedData object:', JSON.stringify(extractedData, null, 2));
  } else {
    console.log('✅ DATABASE FORMATTING: Emirates ID number recovered:', extractedData.emiratesIdNumber);
  }
  
  // Parse Emirates ID number segments if available
  let idNumberSegments = null;
  if (extractedData.emiratesIdNumber) {
    console.log('🔄 DATABASE FORMATTING: Processing Emirates ID number:', extractedData.emiratesIdNumber);
    const segments = extractedData.emiratesIdNumber.split('-');
    if (segments.length === 4) {
      idNumberSegments = {
        area: segments[0],
        year: segments[1],
        sequence: segments[2],
        check_digit: segments[3]
      };
      console.log('🔄 DATABASE FORMATTING: Created segments:', idNumberSegments);
    } else {
      console.warn('🔄 DATABASE FORMATTING: Invalid Emirates ID format (not 4 segments):', extractedData.emiratesIdNumber);
    }
  } else {
    console.error('❌ DATABASE FORMATTING: STILL NO EMIRATES ID NUMBER - WILL SAVE NULL!');
  }
  
  const dbData: Partial<EmiratesIdRecord> = {
    // Emirates ID Identification
    emirates_id_number: extractedData.emiratesIdNumber || null,
    id_number_segments: idNumberSegments,
    
    // Personal Information (English)
    full_name_english: extractedData.fullNameEnglish || null,
    first_name_english: extractedData.firstNameEnglish || null,
    last_name_english: extractedData.lastNameEnglish || null,
    
    // Personal Information (Arabic)
    full_name_arabic: extractedData.fullNameArabic || null,
    first_name_arabic: extractedData.firstNameArabic || null,
    last_name_arabic: extractedData.lastNameArabic || null,
    
    // Personal Details
    date_of_birth: extractedData.dateOfBirth || null,
    nationality: extractedData.nationality || null,
    gender: extractedData.gender || null,
    
    // Document Information
    issuing_date: extractedData.issuingDate || null,
    expiry_date: extractedData.expiryDate || null,
    issuing_authority: 'Federal Authority For Identity and Citizenship',
    
    // Residential Information
    emirates_residence: extractedData.emiratesResidence || null,
    area_code: extractedData.areaCode || null,
    
    // Document Processing Information
    source_file_name: sourceFileName || null,
    extraction_timestamp: new Date().toISOString(),
    extraction_confidence: 0.8, // Default confidence, should be updated based on actual extraction
    page_type: 'emirates_id',
    
    // Verification and Status defaults
    is_verified: false,
    document_status: 'active',
    
    // Store raw extracted data
    raw_extracted_data: extractedData,
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('🎯 DATABASE FORMATTING: Final dbData object:', dbData);
  console.log('🎯 DATABASE FORMATTING: dbData.emirates_id_number =', dbData.emirates_id_number);
  console.log('🎯 DATABASE FORMATTING: dbData.id_number_segments =', dbData.id_number_segments);
  
  // FINAL VALIDATION: Ensure we're not sending NULL emirates_id_number
  if (!dbData.emirates_id_number) {
    console.error('🚨 CRITICAL ERROR: dbData.emirates_id_number is NULL! This will save NULL to database!');
    console.error('🚨 CRITICAL ERROR: Full dbData object:', JSON.stringify(dbData, null, 2));
  } else {
    console.log('✅ DATABASE FORMATTING: Emirates ID number validated, ready for database save');
  }
  
  return dbData;
};

// Save Emirates ID record to database
export async function saveEmiratesIdRecord(extractedData: ExtractedEmiratesIdData, sourceFileName?: string): Promise<EmiratesIdRecord> {
  console.log('💾 SAVE FUNCTION: Starting Emirates ID record save');
  console.log('💾 SAVE FUNCTION: Input extractedData:', extractedData);
  
  // PRE-SAVE VALIDATION
  if (!extractedData.emiratesIdNumber) {
    console.error('❌ SAVE FUNCTION: CRITICAL - No Emirates ID number provided!');
    console.error('❌ SAVE FUNCTION: extractedData keys:', Object.keys(extractedData));
    console.warn('⚠️ TEMPORARY: Proceeding with save for debugging purposes');
  }
  
  // Validate Emirates ID format
  const emiratesPattern = /^\d{3}-\d{4}-\d{7}-\d{1}$/;
  if (!emiratesPattern.test(extractedData.emiratesIdNumber)) {
    console.warn('⚠️ SAVE FUNCTION: Emirates ID format may be invalid:', extractedData.emiratesIdNumber);
  }
  
  console.log('✅ SAVE FUNCTION: Pre-save validation passed, Emirates ID:', extractedData.emiratesIdNumber);
  
  const dbData = formatEmiratesIdDataForSupabase(extractedData, sourceFileName);
  
  // POST-FORMAT VALIDATION
  if (!dbData.emirates_id_number) {
    console.error('❌ SAVE FUNCTION: CRITICAL - dbData.emirates_id_number is NULL after formatting!');
    console.error('❌ SAVE FUNCTION: dbData object:', dbData);
    throw new Error('Critical error: Emirates ID number lost during database formatting.');
  }
  
  console.log('💾 SAVE FUNCTION: About to insert into database with emirates_id_number:', dbData.emirates_id_number);
  
  const { data, error } = await supabase
    .from('emirates_id_records')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('❌ SAVE FUNCTION: Database insert failed:', error);
    console.error('❌ SAVE FUNCTION: Attempted to insert dbData:', dbData);
    throw new Error(`Failed to save Emirates ID record: ${error.message}`);
  }

  // POST-SAVE VALIDATION: Verify what actually got saved
  console.log('✅ SAVE FUNCTION: Database insert successful, record ID:', data.id);
  console.log('✅ SAVE FUNCTION: Saved emirates_id_number in database:', data.emirates_id_number);
  
  // CRITICAL CHECK: Verify the Emirates ID number was actually saved
  if (!data.emirates_id_number) {
    console.error('🚨 SAVE FUNCTION: CRITICAL ERROR - Emirates ID number is NULL in saved record!');
    console.error('🚨 SAVE FUNCTION: Full saved record:', data);
    console.error('🚨 SAVE FUNCTION: Original dbData that was sent:', dbData);
  } else {
    console.log('🎉 SAVE FUNCTION: SUCCESS - Emirates ID number correctly saved:', data.emirates_id_number);
  }
  
  return data as EmiratesIdRecord;
}

// Update Emirates ID record
export async function updateEmiratesIdRecord(id: string, extractedData: ExtractedEmiratesIdData, sourceFileName?: string): Promise<EmiratesIdRecord> {
  console.log('🔄 Updating Emirates ID record:', id);
  
  // First, check if the record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('emirates_id_records')
    .select('id')
    .eq('id', id)
    .single();

  if (!existingRecord) {
    console.log('📝 Record does not exist, creating new Emirates ID record');
    return saveEmiratesIdRecord(extractedData, sourceFileName);
  }

  const dbData = formatEmiratesIdDataForSupabase(extractedData, sourceFileName);
  // Remove created_at from update data
  delete dbData.created_at;
  
  const { data, error } = await supabase
    .from('emirates_id_records')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to update Emirates ID record:', error);
    throw new Error(`Failed to update Emirates ID record: ${error.message}`);
  }

  console.log('✅ Successfully updated Emirates ID record:', data.id);
  return data as EmiratesIdRecord;
}

// Fetch Emirates ID record by ID
export async function fetchEmiratesIdRecord(id: string): Promise<EmiratesIdRecord | null> {
  console.log('🔍 Fetching Emirates ID record:', id);
  
  const { data, error } = await supabase
    .from('emirates_id_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('📭 Emirates ID record not found:', id);
      return null;
    }
    console.error('❌ Failed to fetch Emirates ID record:', error);
    throw new Error(`Failed to fetch Emirates ID record: ${error.message}`);
  }

  return data as EmiratesIdRecord;
}

// Find Emirates ID record by Emirates ID number
export async function findEmiratesIdByNumber(emiratesIdNumber: string): Promise<EmiratesIdRecord | null> {
  console.log('🔍 Finding Emirates ID record by number:', emiratesIdNumber);
  
  const { data, error } = await supabase
    .from('emirates_id_records')
    .select('*')
    .eq('emirates_id_number', emiratesIdNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('📭 Emirates ID record not found for number:', emiratesIdNumber);
      return null;
    }
    console.error('❌ Failed to find Emirates ID record:', error);
    throw new Error(`Failed to find Emirates ID record: ${error.message}`);
  }

  return data as EmiratesIdRecord;
}

// Get all Emirates ID records (with optional filters)
export async function getAllEmiratesIdRecords(filters?: {
  nationality?: string;
  documentStatus?: string;
  isVerified?: boolean;
  limit?: number;
}): Promise<EmiratesIdRecord[]> {
  console.log('📋 Fetching all Emirates ID records with filters:', filters);
  
  let query = supabase
    .from('emirates_id_records')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.nationality) {
    query = query.eq('nationality', filters.nationality);
  }
  if (filters?.documentStatus) {
    query = query.eq('document_status', filters.documentStatus);
  }
  if (filters?.isVerified !== undefined) {
    query = query.eq('is_verified', filters.isVerified);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch Emirates ID records:', error);
    throw new Error(`Failed to fetch Emirates ID records: ${error.message}`);
  }

  return data as EmiratesIdRecord[];
}

// Link Emirates ID record to passport record
export async function linkEmiratesIdToPassport(emiratesIdRecordId: string, passportRecordId: string): Promise<void> {
  console.log('🔗 Linking Emirates ID to passport record:', { emiratesIdRecordId, passportRecordId });
  
  const { error } = await supabase
    .from('emirates_id_records')
    .update({ passport_record_id: passportRecordId, updated_at: new Date().toISOString() })
    .eq('id', emiratesIdRecordId);

  if (error) {
    console.error('❌ Failed to link Emirates ID to passport:', error);
    throw new Error(`Failed to link Emirates ID to passport: ${error.message}`);
  }

  console.log('✅ Successfully linked Emirates ID to passport record');
}

// Search Emirates ID records by name (English or Arabic)
export async function searchEmiratesIdByName(nameQuery: string): Promise<EmiratesIdRecord[]> {
  console.log('🔍 Searching Emirates ID records by name:', nameQuery);
  
  const { data, error } = await supabase
    .from('emirates_id_records')
    .select('*')
    .or(`full_name_english.ilike.%${nameQuery}%,full_name_arabic.ilike.%${nameQuery}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to search Emirates ID records:', error);
    throw new Error(`Failed to search Emirates ID records: ${error.message}`);
  }

  return data as EmiratesIdRecord[];
}