-- ===============================================
-- Emirates ID and VISA Records Tables Creation Script
-- ===============================================
-- This script creates separate tables for Emirates ID and VISA documents
-- with specialized fields for each document type

-- ===============================================
-- EMIRATES ID RECORDS TABLE
-- ===============================================

CREATE TABLE public.emirates_id_records (
  -- Primary and tracking fields
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  
  -- Link to main passport record (optional foreign key)
  passport_record_id uuid NULL REFERENCES public.passport_records(id) ON DELETE SET NULL,
  
  -- Emirates ID Identification
  emirates_id_number text NULL,                    -- Full ID like 784-1970-5199524-4
  id_number_segments jsonb NULL,                   -- Split parts for analysis
  
  -- Personal Information (English)
  full_name_english text NULL,                     -- Complete English name
  first_name_english text NULL,                    -- First name in English
  middle_name_english text NULL,                   -- Middle name in English  
  last_name_english text NULL,                     -- Last name in English
  
  -- Personal Information (Arabic)
  full_name_arabic text NULL,                      -- Complete Arabic name
  first_name_arabic text NULL,                     -- First name in Arabic
  middle_name_arabic text NULL,                    -- Middle name in Arabic
  last_name_arabic text NULL,                      -- Last name in Arabic
  
  -- Personal Details
  date_of_birth text NULL,                         -- Date format: DD/MM/YYYY
  nationality text NULL,                           -- Country of nationality
  gender text NULL,                                -- M/F/Male/Female
  
  -- Document Information
  issuing_date text NULL,                          -- When ID was issued
  expiry_date text NULL,                           -- When ID expires
  issuing_authority text NULL DEFAULT 'Federal Authority For Identity and Citizenship',
  
  -- Biometric Information
  has_photo boolean NULL DEFAULT false,            -- Photo extracted successfully
  has_signature boolean NULL DEFAULT false,        -- Signature extracted successfully
  photo_quality_score numeric NULL,               -- Quality assessment 0-1
  
  -- Residential Information (if available)
  emirates_residence text NULL,                    -- Which emirate
  area_code text NULL,                            -- Area/location code
  
  -- Document Processing Information
  source_file_name text NULL,                     -- Original uploaded file name
  extraction_timestamp timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  extraction_confidence numeric NULL,             -- AI extraction confidence (0-1)
  page_type text NULL DEFAULT 'emirates_id',      -- Document type identifier
  
  -- Verification and Status
  is_verified boolean NULL DEFAULT false,         -- Manual verification status
  verified_by text NULL,                         -- Who verified the document
  verification_date timestamp with time zone NULL,
  verification_notes text NULL,                  -- Verification comments
  
  -- Status tracking
  document_status text NULL DEFAULT 'active',    -- active, expired, cancelled
  renewal_date text NULL,                        -- When to renew
  
  -- JSON storage for flexible data
  raw_extracted_data jsonb NULL,                 -- Complete raw extracted data
  additional_fields jsonb NULL,                  -- Extra structured fields
  extraction_notes text NULL,                   -- Processing notes
  admin_notes text NULL,                        -- Administrative comments
  
  CONSTRAINT emirates_id_records_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ===============================================
-- VISA RECORDS TABLE  
-- ===============================================

CREATE TABLE public.visa_records (
  -- Primary and tracking fields
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  
  -- Link to main passport record
  passport_record_id uuid NULL REFERENCES public.passport_records(id) ON DELETE SET NULL,
  passport_number text NULL,                      -- For linking and reference
  
  -- Visa Identification
  visa_number text NULL,                          -- Unique visa number
  visa_reference_number text NULL,               -- Additional reference numbers
  visa_type text NULL,                           -- Tourist, Business, Transit, Work, etc.
  visa_category text NULL,                       -- Single entry, Multiple entry, etc.
  visa_class text NULL,                          -- Class/category of visa
  
  -- Personal Information (from visa document)
  full_name text NULL,                           -- Name as on visa
  passport_holder_name text NULL,               -- Name as on passport
  nationality text NULL,                        -- Nationality of holder
  date_of_birth text NULL,                      -- DOB from visa
  place_of_birth text NULL,                     -- Birth place if mentioned
  
  -- Visa Validity and Dates
  issue_date text NULL,                          -- When visa was issued
  expiry_date text NULL,                         -- When visa expires
  valid_from_date text NULL,                     -- Valid from date
  valid_until_date text NULL,                    -- Valid until date
  duration_of_stay text NULL,                    -- e.g., "30 days", "90 days"
  
  -- Entry Information
  port_of_entry text NULL,                       -- Designated port of entry
  purpose_of_visit text NULL,                    -- Tourism, Business, etc.
  sponsor_information text NULL,                 -- Sponsor details if any
  
  -- Issuing Information
  issuing_country text NULL,                     -- Country that issued visa
  issuing_authority text NULL,                   -- Embassy, Consulate, etc.
  issuing_location text NULL,                    -- City/location of issuance
  
  -- Entry/Exit Tracking
  entries_allowed text NULL,                     -- Single, Multiple, etc.
  entries_used integer NULL DEFAULT 0,           -- Number of times used
  max_entries integer NULL,                      -- Maximum allowed entries
  
  -- Visa Status and Validity
  visa_status text NULL DEFAULT 'active',        -- active, expired, cancelled, used
  is_valid boolean NULL DEFAULT true,            -- Current validity status
  cancellation_reason text NULL,                 -- If cancelled, why
  
  -- Additional Visa Information
  visa_fee_paid numeric NULL,                    -- Fee paid for visa
  currency_code text NULL DEFAULT 'USD',         -- Currency of fee
  processing_time text NULL,                     -- How long it took to process
  
  -- Document Processing Information
  source_file_name text NULL,                    -- Original uploaded file name
  extraction_timestamp timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  extraction_confidence numeric NULL,            -- AI extraction confidence (0-1)
  page_type text NULL DEFAULT 'visa',            -- visa, visa_front, visa_back
  
  -- Verification and Status
  is_verified boolean NULL DEFAULT false,        -- Manual verification status
  verified_by text NULL,                        -- Who verified the document
  verification_date timestamp with time zone NULL,
  verification_notes text NULL,                 -- Verification comments
  
  -- JSON storage for flexible data
  raw_extracted_data jsonb NULL,                -- Complete raw extracted data
  additional_fields jsonb NULL,                 -- Extra structured fields
  extraction_notes text NULL,                  -- Processing notes
  admin_notes text NULL,                       -- Administrative comments
  
  CONSTRAINT visa_records_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- ===============================================
-- INDEXES FOR EMIRATES ID RECORDS
-- ===============================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_emirates_id_number 
  ON public.emirates_id_records USING btree (emirates_id_number) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_emirates_id_passport_record 
  ON public.emirates_id_records USING btree (passport_record_id) 
  TABLESPACE pg_default;

-- Name indexes for search
CREATE INDEX IF NOT EXISTS idx_emirates_id_full_name_english 
  ON public.emirates_id_records USING btree (full_name_english) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_emirates_id_full_name_arabic 
  ON public.emirates_id_records USING btree (full_name_arabic) 
  TABLESPACE pg_default;

-- Demographic indexes
CREATE INDEX IF NOT EXISTS idx_emirates_id_nationality 
  ON public.emirates_id_records USING btree (nationality) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_emirates_id_date_of_birth 
  ON public.emirates_id_records USING btree (date_of_birth) 
  TABLESPACE pg_default;

-- Document validity indexes
CREATE INDEX IF NOT EXISTS idx_emirates_id_expiry_date 
  ON public.emirates_id_records USING btree (expiry_date) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_emirates_id_document_status 
  ON public.emirates_id_records USING btree (document_status) 
  TABLESPACE pg_default;

-- Processing indexes
CREATE INDEX IF NOT EXISTS idx_emirates_id_created_at 
  ON public.emirates_id_records USING btree (created_at) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_emirates_id_verification_status 
  ON public.emirates_id_records USING btree (is_verified) 
  TABLESPACE pg_default;

-- ===============================================
-- INDEXES FOR VISA RECORDS
-- ===============================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_visa_number 
  ON public.visa_records USING btree (visa_number) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_passport_record 
  ON public.visa_records USING btree (passport_record_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_passport_number 
  ON public.visa_records USING btree (passport_number) 
  TABLESPACE pg_default;

-- Visa classification indexes
CREATE INDEX IF NOT EXISTS idx_visa_type 
  ON public.visa_records USING btree (visa_type) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_category 
  ON public.visa_records USING btree (visa_category) 
  TABLESPACE pg_default;

-- Personal information indexes
CREATE INDEX IF NOT EXISTS idx_visa_full_name 
  ON public.visa_records USING btree (full_name) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_nationality 
  ON public.visa_records USING btree (nationality) 
  TABLESPACE pg_default;

-- Validity and status indexes
CREATE INDEX IF NOT EXISTS idx_visa_expiry_date 
  ON public.visa_records USING btree (expiry_date) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_status 
  ON public.visa_records USING btree (visa_status) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_issuing_country 
  ON public.visa_records USING btree (issuing_country) 
  TABLESPACE pg_default;

-- Processing indexes
CREATE INDEX IF NOT EXISTS idx_visa_created_at 
  ON public.visa_records USING btree (created_at) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_visa_verification_status 
  ON public.visa_records USING btree (is_verified) 
  TABLESPACE pg_default;

-- ===============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ===============================================

-- Emirates ID updated_at trigger
CREATE TRIGGER update_emirates_id_records_updated_at 
  BEFORE UPDATE ON public.emirates_id_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- VISA records updated_at trigger
CREATE TRIGGER update_visa_records_updated_at 
  BEFORE UPDATE ON public.visa_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- UPDATE PASSPORT_RECORDS TABLE
-- ===============================================
-- Add foreign key columns to passport_records to link with Emirates ID and VISA

ALTER TABLE public.passport_records 
ADD COLUMN IF NOT EXISTS emirates_id_record_id uuid NULL 
REFERENCES public.emirates_id_records(id) ON DELETE SET NULL;

ALTER TABLE public.passport_records 
ADD COLUMN IF NOT EXISTS visa_record_id uuid NULL 
REFERENCES public.visa_records(id) ON DELETE SET NULL;

-- Add indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_passport_records_emirates_id 
  ON public.passport_records USING btree (emirates_id_record_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_passport_records_visa_id 
  ON public.passport_records USING btree (visa_record_id) 
  TABLESPACE pg_default;

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================

-- Emirates ID table comments
COMMENT ON TABLE public.emirates_id_records IS 'Stores data extracted from UAE Emirates ID cards with bilingual support for English and Arabic text';

COMMENT ON COLUMN public.emirates_id_records.emirates_id_number IS 'Complete Emirates ID number like 784-1970-5199524-4';
COMMENT ON COLUMN public.emirates_id_records.id_number_segments IS 'JSON breakdown of ID number parts {area, year, sequence, check_digit}';
COMMENT ON COLUMN public.emirates_id_records.full_name_arabic IS 'Complete name in Arabic script as printed on ID';
COMMENT ON COLUMN public.emirates_id_records.extraction_confidence IS 'AI confidence score between 0 and 1 for extraction quality';

-- VISA table comments
COMMENT ON TABLE public.visa_records IS 'Stores data extracted from various types of visa documents and stamps';

COMMENT ON COLUMN public.visa_records.visa_number IS 'Unique visa number or reference as printed on visa';
COMMENT ON COLUMN public.visa_records.entries_allowed IS 'Type of entries allowed: Single, Multiple, etc.';
COMMENT ON COLUMN public.visa_records.visa_status IS 'Current status: active, expired, cancelled, used';
COMMENT ON COLUMN public.visa_records.extraction_confidence IS 'AI confidence score between 0 and 1 for extraction quality';

-- Foreign key comments
COMMENT ON COLUMN public.passport_records.emirates_id_record_id IS 'Links to Emirates ID record for the same person';
COMMENT ON COLUMN public.passport_records.visa_record_id IS 'Links to VISA record for the same person';

-- ===============================================
-- EXAMPLE QUERIES FOR COMMON OPERATIONS
-- ===============================================

-- Find all Emirates IDs for a specific nationality
-- SELECT * FROM emirates_id_records WHERE nationality = 'India';

-- Find all active visas expiring in next 30 days
-- SELECT * FROM visa_records 
-- WHERE visa_status = 'active' 
-- AND expiry_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- Get complete profile with passport, Emirates ID, and visa
-- SELECT 
--   p.full_name,
--   p.passport_number,
--   e.emirates_id_number,
--   e.expiry_date as emirates_id_expiry,
--   v.visa_number,
--   v.visa_type,
--   v.expiry_date as visa_expiry
-- FROM passport_records p
-- LEFT JOIN emirates_id_records e ON p.emirates_id_record_id = e.id
-- LEFT JOIN visa_records v ON p.visa_record_id = v.id
-- WHERE p.passport_number = 'ABC1234567';

-- Find records with low extraction confidence that need manual review
-- SELECT 'emirates_id' as type, emirates_id_number as identifier, extraction_confidence
-- FROM emirates_id_records WHERE extraction_confidence < 0.7
-- UNION ALL
-- SELECT 'visa' as type, visa_number as identifier, extraction_confidence  
-- FROM visa_records WHERE extraction_confidence < 0.7;

-- ===============================================
-- DATA RELATIONSHIP DIAGRAM
-- ===============================================
--
-- passport_records                emirates_id_records           visa_records
-- ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
-- │ id (PK)                 │    │ id (PK)                 │    │ id (PK)                 │
-- │ full_name               │    │ emirates_id_number      │    │ visa_number             │
-- │ passport_number         │    │ full_name_english       │    │ visa_type               │
-- │ date_of_birth          │    │ full_name_arabic        │    │ passport_number         │
-- │ emirates_id_record_id ──┼────→ date_of_birth          │    │ full_name               │
-- │ visa_record_id ─────────┼────┼─────────────────────────┼────→ nationality             │
-- │ ...                    │    │ nationality             │    │ expiry_date             │
-- └─────────────────────────┘    │ expiry_date             │    │ visa_status             │
--                                │ passport_record_id      │    │ passport_record_id      │
--                                │ ...                     │    │ ...                     │
--                                └─────────────────────────┘    └─────────────────────────┘
--
-- ===============================================
-- End of Script
-- ===============================================