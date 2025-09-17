import { supabase } from '../config/supabase';

// Interface for VISA record from database
export interface VisaRecord {
  id: string;
  created_at: string;
  updated_at: string;
  passport_record_id: string | null;
  passport_number: string | null;
  
  // Visa Identification
  visa_number: string | null;
  visa_reference_number: string | null;
  visa_type: string | null;
  visa_category: string | null;
  visa_class: string | null;
  
  // Personal Information
  full_name: string | null;
  passport_holder_name: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  
  // Visa Validity and Dates
  issue_date: string | null;
  expiry_date: string | null;
  valid_from_date: string | null;
  valid_until_date: string | null;
  duration_of_stay: string | null;
  
  // Entry Information
  port_of_entry: string | null;
  purpose_of_visit: string | null;
  sponsor_information: string | null;
  
  // Issuing Information
  issuing_country: string | null;
  issuing_authority: string | null;
  issuing_location: string | null;
  
  // Entry/Exit Tracking
  entries_allowed: string | null;
  entries_used: number | null;
  max_entries: number | null;
  
  // Visa Status and Validity
  visa_status: string | null;
  is_valid: boolean | null;
  cancellation_reason: string | null;
  
  // Additional Visa Information
  visa_fee_paid: number | null;
  currency_code: string | null;
  processing_time: string | null;
  
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
  
  // JSON storage
  raw_extracted_data: any | null;
  additional_fields: any | null;
  extraction_notes: string | null;
  admin_notes: string | null;
}

// Interface for VISA extracted data
export interface ExtractedVisaData {
  fullName?: string;
  passportHolderName?: string;
  passportNumber?: string;
  visaNumber?: string;
  visaReferenceNumber?: string;
  visaType?: string;
  visaCategory?: string;
  visaClass?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  issueDate?: string;
  expiryDate?: string;
  validFromDate?: string;
  validUntilDate?: string;
  durationOfStay?: string;
  portOfEntry?: string;
  purposeOfVisit?: string;
  sponsorInformation?: string;
  issuingCountry?: string;
  issuingAuthority?: string;
  issuingLocation?: string;
  entriesAllowed?: string;
  visaFeePaid?: number;
  currencyCode?: string;
  processingTime?: string;
  [key: string]: string | number | undefined;
}

// Helper function to format VISA data for database
const formatVisaDataForSupabase = (extractedData: ExtractedVisaData, sourceFileName?: string): Partial<VisaRecord> => {
  console.log('🔄 Formatting VISA data for Supabase:', extractedData);
  
  const dbData: Partial<VisaRecord> = {
    // Visa Identification
    visa_number: extractedData.visaNumber || null,
    visa_reference_number: extractedData.visaReferenceNumber || null,
    visa_type: extractedData.visaType || null,
    visa_category: extractedData.visaCategory || null,
    visa_class: extractedData.visaClass || null,
    
    // Personal Information
    full_name: extractedData.fullName || null,
    passport_holder_name: extractedData.passportHolderName || null,
    passport_number: extractedData.passportNumber || null,
    nationality: extractedData.nationality || null,
    date_of_birth: extractedData.dateOfBirth || null,
    place_of_birth: extractedData.placeOfBirth || null,
    
    // Visa Validity and Dates
    issue_date: extractedData.issueDate || null,
    expiry_date: extractedData.expiryDate || null,
    valid_from_date: extractedData.validFromDate || null,
    valid_until_date: extractedData.validUntilDate || null,
    duration_of_stay: extractedData.durationOfStay || null,
    
    // Entry Information
    port_of_entry: extractedData.portOfEntry || null,
    purpose_of_visit: extractedData.purposeOfVisit || null,
    sponsor_information: extractedData.sponsorInformation || null,
    
    // Issuing Information
    issuing_country: extractedData.issuingCountry || null,
    issuing_authority: extractedData.issuingAuthority || null,
    issuing_location: extractedData.issuingLocation || null,
    
    // Entry/Exit Tracking
    entries_allowed: extractedData.entriesAllowed || null,
    entries_used: 0,
    max_entries: extractedData.entriesAllowed === 'Multiple' ? null : 1,
    
    // Visa Status and Validity
    visa_status: 'active',
    is_valid: true,
    
    // Additional Visa Information
    visa_fee_paid: extractedData.visaFeePaid || null,
    currency_code: extractedData.currencyCode || 'USD',
    processing_time: extractedData.processingTime || null,
    
    // Document Processing Information
    source_file_name: sourceFileName || null,
    extraction_timestamp: new Date().toISOString(),
    extraction_confidence: 0.8, // Default confidence, should be updated based on actual extraction
    page_type: 'visa',
    
    // Verification and Status defaults
    is_verified: false,
    
    // Store raw extracted data
    raw_extracted_data: extractedData,
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('🎯 Formatted VISA data for database:', dbData);
  return dbData;
};

// Save VISA record to database
export async function saveVisaRecord(extractedData: ExtractedVisaData, sourceFileName?: string): Promise<VisaRecord> {
  console.log('💾 Saving VISA record to database');
  
  const dbData = formatVisaDataForSupabase(extractedData, sourceFileName);
  
  const { data, error } = await supabase
    .from('visa_records')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to save VISA record:', error);
    throw new Error(`Failed to save VISA record: ${error.message}`);
  }

  console.log('✅ Successfully saved VISA record:', data.id);
  return data as VisaRecord;
}

// Update VISA record
export async function updateVisaRecord(id: string, extractedData: ExtractedVisaData, sourceFileName?: string): Promise<VisaRecord> {
  console.log('🔄 Updating VISA record:', id);
  
  // First, check if the record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('visa_records')
    .select('id')
    .eq('id', id)
    .single();

  if (!existingRecord) {
    console.log('📝 Record does not exist, creating new VISA record');
    return saveVisaRecord(extractedData, sourceFileName);
  }

  const dbData = formatVisaDataForSupabase(extractedData, sourceFileName);
  // Remove created_at from update data
  delete dbData.created_at;
  
  const { data, error } = await supabase
    .from('visa_records')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to update VISA record:', error);
    throw new Error(`Failed to update VISA record: ${error.message}`);
  }

  console.log('✅ Successfully updated VISA record:', data.id);
  return data as VisaRecord;
}

// Fetch VISA record by ID
export async function fetchVisaRecord(id: string): Promise<VisaRecord | null> {
  console.log('🔍 Fetching VISA record:', id);
  
  const { data, error } = await supabase
    .from('visa_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('📭 VISA record not found:', id);
      return null;
    }
    console.error('❌ Failed to fetch VISA record:', error);
    throw new Error(`Failed to fetch VISA record: ${error.message}`);
  }

  return data as VisaRecord;
}

// Find VISA record by visa number
export async function findVisaByNumber(visaNumber: string): Promise<VisaRecord | null> {
  console.log('🔍 Finding VISA record by number:', visaNumber);
  
  const { data, error } = await supabase
    .from('visa_records')
    .select('*')
    .eq('visa_number', visaNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('📭 VISA record not found for number:', visaNumber);
      return null;
    }
    console.error('❌ Failed to find VISA record:', error);
    throw new Error(`Failed to find VISA record: ${error.message}`);
  }

  return data as VisaRecord;
}

// Find VISA records by passport number
export async function findVisasByPassportNumber(passportNumber: string): Promise<VisaRecord[]> {
  console.log('🔍 Finding VISA records by passport number:', passportNumber);
  
  const { data, error } = await supabase
    .from('visa_records')
    .select('*')
    .eq('passport_number', passportNumber)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to find VISA records:', error);
    throw new Error(`Failed to find VISA records: ${error.message}`);
  }

  return data as VisaRecord[];
}

// Get all VISA records (with optional filters)
export async function getAllVisaRecords(filters?: {
  visaType?: string;
  nationality?: string;
  visaStatus?: string;
  isValid?: boolean;
  issuingCountry?: string;
  limit?: number;
}): Promise<VisaRecord[]> {
  console.log('📋 Fetching all VISA records with filters:', filters);
  
  let query = supabase
    .from('visa_records')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.visaType) {
    query = query.eq('visa_type', filters.visaType);
  }
  if (filters?.nationality) {
    query = query.eq('nationality', filters.nationality);
  }
  if (filters?.visaStatus) {
    query = query.eq('visa_status', filters.visaStatus);
  }
  if (filters?.isValid !== undefined) {
    query = query.eq('is_valid', filters.isValid);
  }
  if (filters?.issuingCountry) {
    query = query.eq('issuing_country', filters.issuingCountry);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch VISA records:', error);
    throw new Error(`Failed to fetch VISA records: ${error.message}`);
  }

  return data as VisaRecord[];
}

// Link VISA record to passport record
export async function linkVisaToPassport(visaRecordId: string, passportRecordId: string): Promise<void> {
  console.log('🔗 Linking VISA to passport record:', { visaRecordId, passportRecordId });
  
  const { error } = await supabase
    .from('visa_records')
    .update({ passport_record_id: passportRecordId, updated_at: new Date().toISOString() })
    .eq('id', visaRecordId);

  if (error) {
    console.error('❌ Failed to link VISA to passport:', error);
    throw new Error(`Failed to link VISA to passport: ${error.message}`);
  }

  console.log('✅ Successfully linked VISA to passport record');
}

// Search VISA records by name
export async function searchVisaByName(nameQuery: string): Promise<VisaRecord[]> {
  console.log('🔍 Searching VISA records by name:', nameQuery);
  
  const { data, error } = await supabase
    .from('visa_records')
    .select('*')
    .or(`full_name.ilike.%${nameQuery}%,passport_holder_name.ilike.%${nameQuery}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to search VISA records:', error);
    throw new Error(`Failed to search VISA records: ${error.message}`);
  }

  return data as VisaRecord[];
}

// Update VISA status (for tracking entries/exits)
export async function updateVisaStatus(visaId: string, status: 'active' | 'expired' | 'cancelled' | 'used', entriesUsed?: number): Promise<void> {
  console.log('🔄 Updating VISA status:', { visaId, status, entriesUsed });
  
  const updateData: any = {
    visa_status: status,
    updated_at: new Date().toISOString()
  };
  
  if (entriesUsed !== undefined) {
    updateData.entries_used = entriesUsed;
  }
  
  const { error } = await supabase
    .from('visa_records')
    .update(updateData)
    .eq('id', visaId);

  if (error) {
    console.error('❌ Failed to update VISA status:', error);
    throw new Error(`Failed to update VISA status: ${error.message}`);
  }

  console.log('✅ Successfully updated VISA status');
}