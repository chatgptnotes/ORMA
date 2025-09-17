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

-- Enable Row Level Security
ALTER TABLE passport_records ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON passport_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON passport_records;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON passport_records
  FOR ALL USING (true);

-- Create a policy that allows read access for anonymous users
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_passport_records_updated_at ON passport_records;

-- Create the trigger
CREATE TRIGGER update_passport_records_updated_at BEFORE UPDATE ON passport_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();