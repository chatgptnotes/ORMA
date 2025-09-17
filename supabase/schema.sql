-- Create passport_records table
CREATE TABLE IF NOT EXISTS passport_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Personal Information
  full_name TEXT,
  given_name TEXT,
  surname TEXT,
  date_of_birth TEXT,
  gender TEXT,
  nationality TEXT,
  
  -- Family Information
  father_name TEXT,
  mother_name TEXT,
  spouse_name TEXT,
  
  -- Passport Details
  passport_number TEXT,
  date_of_issue TEXT,
  date_of_expiry TEXT,
  place_of_issue TEXT,
  place_of_birth TEXT,
  
  -- Address Information
  address TEXT,
  pin_code TEXT,
  district TEXT,
  state TEXT,
  permanent_address TEXT,

  -- Contact Information
  mobile_number TEXT,
  email TEXT,
  alternate_phone TEXT,

  -- Identity Documents
  aadhar_number TEXT,
  pan_number TEXT,
  voter_id TEXT,

  -- Educational and Professional Information
  education TEXT,
  school_name TEXT,
  occupation TEXT,

  -- Additional Personal Information
  age TEXT,
  marital_status TEXT,
  religion TEXT,
  blood_group TEXT,

  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_number TEXT,
  emergency_contact_address TEXT,

  -- Form Metadata
  form_type TEXT,
  submission_date TEXT,
  application_number TEXT,

  -- Form Data (stores complete form data as JSON)
  form_data JSONB,
  
  -- Metadata
  extraction_confidence DECIMAL,
  source_file_name TEXT,
  extraction_timestamp TIMESTAMP WITH TIME ZONE
);

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_passport_number ON passport_records(passport_number);
CREATE INDEX IF NOT EXISTS idx_full_name ON passport_records(full_name);
CREATE INDEX IF NOT EXISTS idx_created_at ON passport_records(created_at);
CREATE INDEX IF NOT EXISTS idx_aadhar_number ON passport_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_mobile_number ON passport_records(mobile_number);
CREATE INDEX IF NOT EXISTS idx_email ON passport_records(email);
CREATE INDEX IF NOT EXISTS idx_pan_number ON passport_records(pan_number);

-- Enable Row Level Security
ALTER TABLE passport_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON passport_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON passport_records;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON passport_records
  FOR ALL USING (true);

-- Create a policy that allows read access for anonymous users (optional)
CREATE POLICY "Enable read access for all users" ON passport_records
  FOR SELECT USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_passport_records_updated_at ON passport_records;
CREATE TRIGGER update_passport_records_updated_at BEFORE UPDATE ON passport_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();