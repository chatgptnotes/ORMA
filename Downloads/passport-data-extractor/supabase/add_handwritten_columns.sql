-- Add columns for handwritten form data to passport_records table
ALTER TABLE passport_records
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS voter_id TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS form_type TEXT,
ADD COLUMN IF NOT EXISTS submission_date TEXT,
ADD COLUMN IF NOT EXISTS application_number TEXT;

-- Create indexes for commonly searched handwritten form fields
CREATE INDEX IF NOT EXISTS idx_aadhar_number ON passport_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_mobile_number ON passport_records(mobile_number);
CREATE INDEX IF NOT EXISTS idx_email ON passport_records(email);
CREATE INDEX IF NOT EXISTS idx_pan_number ON passport_records(pan_number);