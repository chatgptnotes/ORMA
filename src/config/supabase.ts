import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table types
export interface PassportRecord {
  id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Personal Information
  full_name?: string;
  given_name?: string;
  surname?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  
  // Family Information
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  
  // Passport Details
  passport_number?: string;
  date_of_issue?: string;
  date_of_expiry?: string;
  place_of_issue?: string;
  place_of_birth?: string;
  
  // Address Information
  address?: string;
  permanent_address?: string;
  pin_code?: string;
  district?: string;

  // Contact Information
  mobile_number?: string;
  email?: string;
  alternate_phone?: string;

  // Additional Personal Information
  aadhar_number?: string;
  occupation?: string;
  application_number?: string;

  // Form Data
  form_data?: any; // Complete form data as JSON
  
  // Metadata
  extraction_confidence?: number;
  source_file_name?: string;
  extraction_timestamp?: string;
}