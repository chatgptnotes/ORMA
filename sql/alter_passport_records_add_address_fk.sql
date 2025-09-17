-- ===============================================
-- Alter passport_records Table to Add Foreign Key to passport_address_pages
-- ===============================================
-- This script adds a foreign key column to passport_records that references
-- the passport_address_pages table (reversed relationship)

-- Add the foreign key column to passport_records table
ALTER TABLE public.passport_records 
ADD COLUMN IF NOT EXISTS passport_address_id uuid NULL 
REFERENCES public.passport_address_pages(id) ON DELETE SET NULL;

-- Add index for optimal query performance on the new foreign key
CREATE INDEX IF NOT EXISTS idx_passport_records_address_id 
  ON public.passport_records USING btree (passport_address_id) 
  TABLESPACE pg_default;

-- Add comment for documentation
COMMENT ON COLUMN public.passport_records.passport_address_id IS 'Foreign key linking to passport address page data in passport_address_pages table';

-- ===============================================
-- Example Usage After Migration
-- ===============================================

-- Query to get passport records with their address information:
-- SELECT 
--   p.id,
--   p.full_name,
--   p.passport_number,
--   p.date_of_birth,
--   a.permanent_address,
--   a.pin_code,
--   a.district,
--   a.state,
--   a.emergency_contact_name,
--   a.emergency_contact_phone
-- FROM passport_records p
-- LEFT JOIN passport_address_pages a ON p.passport_address_id = a.id;

-- Query to find passport records that have address information:
-- SELECT * FROM passport_records WHERE passport_address_id IS NOT NULL;

-- Query to find passport records without address information:
-- SELECT * FROM passport_records WHERE passport_address_id IS NULL;

-- ===============================================
-- Data Migration Notes
-- ===============================================
-- After running this script, you may need to:
-- 1. Update existing records to link them with their address pages
-- 2. Modify your application code to use the new relationship structure
-- 3. Update any existing queries that were using the old relationship

-- Example data linking (if you have existing data):
-- UPDATE passport_records pr
-- SET passport_address_id = (
--   SELECT a.id 
--   FROM passport_address_pages a 
--   WHERE a.passport_number = pr.passport_number 
--   LIMIT 1
-- )
-- WHERE pr.passport_address_id IS NULL;

-- ===============================================
-- End of Script
-- ===============================================