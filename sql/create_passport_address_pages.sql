-- ===============================================
-- Passport Address Pages Table Creation Script
-- ===============================================
-- This table stores data specifically from passport address/last pages
-- which contain different information than the main passport data page

-- Create the passport_address_pages table
CREATE TABLE public.passport_address_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  
  -- Passport identification (no foreign key - passport_records will reference this table)
  passport_number text NULL,
  
  -- Address Information (main purpose of address pages)
  address_local_language text NULL,      -- Address in Malayalam/Hindi/local script
  address_english text NULL,             -- Address in English
  permanent_address text NULL,           -- Permanent address
  present_address text NULL,             -- Present address if different
  pin_code text NULL,                    -- Postal PIN code
  district text NULL,                    -- District name
  state text NULL,                       -- State name
  country text NULL DEFAULT 'India',    -- Country (usually India for Indian passports)
  
  -- Names in local language (often present on address pages)
  name_local_language text NULL,         -- Full name in local script
  father_name_local_language text NULL,  -- Father's name in local script
  mother_name_local_language text NULL,  -- Mother's name in local script
  
  -- Reference and Issue Information specific to address pages
  issue_date text NULL,                  -- Date when address was issued/updated
  reference_number text NULL,            -- Reference numbers like TV2074185571522
  page_number text NULL,                 -- Page number if specified
  
  -- Emergency Contact Information (commonly found on address pages)
  emergency_contact_name text NULL,      -- Emergency contact person name
  emergency_contact_relation text NULL,  -- Relationship (Father, Mother, Spouse, etc.)
  emergency_contact_address text NULL,   -- Emergency contact address
  emergency_contact_phone text NULL,     -- Emergency contact phone number
  emergency_contact_email text NULL,     -- Emergency contact email
  
  -- Additional Contact Information
  applicant_phone text NULL,             -- Applicant's phone number
  applicant_email text NULL,             -- Applicant's email address
  
  -- Document Processing Information
  source_file_name text NULL,            -- Original uploaded file name
  extraction_timestamp timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  extraction_confidence numeric NULL,    -- AI extraction confidence score (0-1)
  page_type text NULL DEFAULT 'address', -- Type: 'address', 'last', 'back'
  
  -- Verification and Status
  is_verified boolean NULL DEFAULT false,    -- Manual verification status
  verified_by text NULL,                     -- Who verified the data
  verification_date timestamp with time zone NULL,
  
  -- JSON storage for flexible data and raw extraction
  raw_extracted_data jsonb NULL,         -- Complete raw extracted data from AI
  additional_fields jsonb NULL,          -- Any additional structured fields
  
  -- Notes and Comments
  extraction_notes text NULL,            -- Notes about extraction process
  admin_notes text NULL,                 -- Admin notes for manual review
  
  CONSTRAINT passport_address_pages_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ===============================================
-- Indexes for Performance Optimization
-- ===============================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_passport_address_passport_number 
  ON public.passport_address_pages USING btree (passport_number) 
  TABLESPACE pg_default;

-- Note: No passport_record_id index needed as the relationship is reversed

-- Geographic indexes for location-based searches
CREATE INDEX IF NOT EXISTS idx_passport_address_pin_code 
  ON public.passport_address_pages USING btree (pin_code) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_address_district 
  ON public.passport_address_pages USING btree (district) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_address_state 
  ON public.passport_address_pages USING btree (state) 
  TABLESPACE pg_default;

-- Timestamp indexes for chronological queries
CREATE INDEX IF NOT EXISTS idx_passport_address_created_at 
  ON public.passport_address_pages USING btree (created_at) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_address_extraction_timestamp 
  ON public.passport_address_pages USING btree (extraction_timestamp) 
  TABLESPACE pg_default;

-- Contact information indexes
CREATE INDEX IF NOT EXISTS idx_passport_address_emergency_contact_phone 
  ON public.passport_address_pages USING btree (emergency_contact_phone) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_address_applicant_phone 
  ON public.passport_address_pages USING btree (applicant_phone) 
  TABLESPACE pg_default;

-- Reference number index for tracking
CREATE INDEX IF NOT EXISTS idx_passport_address_reference_number 
  ON public.passport_address_pages USING btree (reference_number) 
  TABLESPACE pg_default;

-- Page type index for filtering
CREATE INDEX IF NOT EXISTS idx_passport_address_page_type 
  ON public.passport_address_pages USING btree (page_type) 
  TABLESPACE pg_default;

-- Verification status index
CREATE INDEX IF NOT EXISTS idx_passport_address_is_verified 
  ON public.passport_address_pages USING btree (is_verified) 
  TABLESPACE pg_default;

-- ===============================================
-- Triggers for Automatic Timestamp Updates
-- ===============================================

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_passport_address_pages_updated_at 
  BEFORE UPDATE ON public.passport_address_pages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- Row Level Security (RLS) - Optional
-- ===============================================
-- Uncomment if you want to enable row-level security

-- ALTER TABLE public.passport_address_pages ENABLE ROW LEVEL SECURITY;

-- Example policy for authenticated users
-- CREATE POLICY "Enable read access for authenticated users" ON public.passport_address_pages
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert for authenticated users" ON public.passport_address_pages
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update for authenticated users" ON public.passport_address_pages
--   FOR UPDATE USING (auth.role() = 'authenticated');

-- ===============================================
-- Comments for Documentation
-- ===============================================

COMMENT ON TABLE public.passport_address_pages IS 'Stores data extracted from passport address/last pages, which contain address, contact, and emergency contact information separate from the main passport data page';

COMMENT ON COLUMN public.passport_address_pages.passport_number IS 'Passport number for linking with main passport records (passport_records table references this table)';
COMMENT ON COLUMN public.passport_address_pages.address_local_language IS 'Address written in local language script (Malayalam, Hindi, etc.)';
COMMENT ON COLUMN public.passport_address_pages.reference_number IS 'Reference numbers like TV2074185571522 found on address pages';
COMMENT ON COLUMN public.passport_address_pages.raw_extracted_data IS 'Complete raw JSON data extracted by AI for debugging and reprocessing';
COMMENT ON COLUMN public.passport_address_pages.extraction_confidence IS 'AI confidence score between 0 and 1 for extraction quality';

-- ===============================================
-- Example Queries for Common Operations
-- ===============================================

-- Find all address records for a specific passport number
-- SELECT * FROM passport_address_pages WHERE passport_number = 'ABC1234567';

-- Find all records from a specific district
-- SELECT * FROM passport_address_pages WHERE district = 'Thiruvananthapuram';

-- Find records with low extraction confidence that need manual review
-- SELECT * FROM passport_address_pages WHERE extraction_confidence < 0.7;

-- Link address data with main passport data (using reversed foreign key)
-- SELECT p.full_name, p.passport_number, a.permanent_address, a.pin_code
-- FROM passport_records p
-- JOIN passport_address_pages a ON p.passport_address_id = a.id;

-- ===============================================
-- End of Script
-- ===============================================