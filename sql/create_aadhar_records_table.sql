-- Create aadhar_records table
CREATE TABLE IF NOT EXISTS aadhar_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Link to passport record (if available)
  passport_record_id UUID REFERENCES passport_records(id) ON DELETE SET NULL,

  -- Personal Information
  full_name TEXT,
  date_of_birth TEXT,
  gender TEXT,

  -- Aadhaar Identification
  aadhar_number TEXT UNIQUE,

  -- Address Information
  address TEXT,
  pin_code TEXT,
  district TEXT,
  state TEXT,

  -- Document Processing Information
  source_file_name TEXT,
  extraction_timestamp TIMESTAMP WITH TIME ZONE,
  extraction_confidence DECIMAL,
  page_type TEXT,

  -- Biometric Information (for verification)
  has_photo BOOLEAN,
  has_signature BOOLEAN
);

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_aadhar_number ON aadhar_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_aadhar_full_name ON aadhar_records(full_name);
CREATE INDEX IF NOT EXISTS idx_aadhar_created_at ON aadhar_records(created_at);
CREATE INDEX IF NOT EXISTS idx_aadhar_passport_record_id ON aadhar_records(passport_record_id);

-- Enable Row Level Security
ALTER TABLE aadhar_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON aadhar_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON aadhar_records;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON aadhar_records
  FOR ALL USING (true);

-- Create a policy that allows read access for anonymous users (optional)
CREATE POLICY "Enable read access for all users" ON aadhar_records
  FOR SELECT USING (true);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_aadhar_records_updated_at ON aadhar_records;
CREATE TRIGGER update_aadhar_records_updated_at BEFORE UPDATE ON aadhar_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
