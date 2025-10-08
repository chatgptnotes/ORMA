import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function createTable() {
  console.log('🎯 Creating aadhar_records table using Supabase Admin\n');

  // We'll execute this via the realtime channel or use a workaround
  // Since Supabase JS doesn't have direct SQL execution, we'll create the table
  // by attempting to insert and handling the error, or use a function

  // Alternative: Create a SQL function in Supabase that we can call
  // For now, let's document the manual steps

  console.log('📋 MANUAL SETUP REQUIRED\n');
  console.log('Due to Supabase security restrictions, please apply the schema manually:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/wbbvhmmhhjgleoyvuxtq');
  console.log('2. Click "SQL Editor" in the left sidebar');
  console.log('3. Click "New Query"');
  console.log('4. Copy and paste the following SQL:\n');
  console.log('----------------------------------------');
  console.log(`
CREATE TABLE IF NOT EXISTS aadhar_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  passport_record_id UUID REFERENCES passport_records(id) ON DELETE SET NULL,
  full_name TEXT,
  date_of_birth TEXT,
  gender TEXT,
  aadhar_number TEXT UNIQUE,
  address TEXT,
  pin_code TEXT,
  district TEXT,
  state TEXT,
  source_file_name TEXT,
  extraction_timestamp TIMESTAMP WITH TIME ZONE,
  extraction_confidence DECIMAL,
  page_type TEXT,
  has_photo BOOLEAN,
  has_signature BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_aadhar_number ON aadhar_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_aadhar_full_name ON aadhar_records(full_name);
CREATE INDEX IF NOT EXISTS idx_aadhar_created_at ON aadhar_records(created_at);
CREATE INDEX IF NOT EXISTS idx_aadhar_passport_record_id ON aadhar_records(passport_record_id);

ALTER TABLE aadhar_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON aadhar_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON aadhar_records;

CREATE POLICY "Enable all operations for authenticated users" ON aadhar_records
  FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON aadhar_records
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS update_aadhar_records_updated_at ON aadhar_records;
CREATE TRIGGER update_aadhar_records_updated_at BEFORE UPDATE ON aadhar_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`);
  console.log('----------------------------------------\n');
  console.log('5. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('6. Wait for "Success" message\n');
  console.log('✅ After completing these steps, the table will be ready!');
}

createTable();
