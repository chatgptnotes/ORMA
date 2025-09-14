-- Add columns for handwritten form data to passport_records table
-- This migration adds missing columns to support handwritten form extraction

DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'mobile_number') THEN
        ALTER TABLE passport_records ADD COLUMN mobile_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'email') THEN
        ALTER TABLE passport_records ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'aadhar_number') THEN
        ALTER TABLE passport_records ADD COLUMN aadhar_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'pan_number') THEN
        ALTER TABLE passport_records ADD COLUMN pan_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'voter_id') THEN
        ALTER TABLE passport_records ADD COLUMN voter_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'education') THEN
        ALTER TABLE passport_records ADD COLUMN education TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'occupation') THEN
        ALTER TABLE passport_records ADD COLUMN occupation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'district') THEN
        ALTER TABLE passport_records ADD COLUMN district TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'state') THEN
        ALTER TABLE passport_records ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'alternate_phone') THEN
        ALTER TABLE passport_records ADD COLUMN alternate_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'permanent_address') THEN
        ALTER TABLE passport_records ADD COLUMN permanent_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'school_name') THEN
        ALTER TABLE passport_records ADD COLUMN school_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'marital_status') THEN
        ALTER TABLE passport_records ADD COLUMN marital_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE passport_records ADD COLUMN emergency_contact_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'emergency_contact_relation') THEN
        ALTER TABLE passport_records ADD COLUMN emergency_contact_relation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'emergency_contact_number') THEN
        ALTER TABLE passport_records ADD COLUMN emergency_contact_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'emergency_contact_address') THEN
        ALTER TABLE passport_records ADD COLUMN emergency_contact_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'religion') THEN
        ALTER TABLE passport_records ADD COLUMN religion TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'blood_group') THEN
        ALTER TABLE passport_records ADD COLUMN blood_group TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'age') THEN
        ALTER TABLE passport_records ADD COLUMN age TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'form_type') THEN
        ALTER TABLE passport_records ADD COLUMN form_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'submission_date') THEN
        ALTER TABLE passport_records ADD COLUMN submission_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'passport_records' AND column_name = 'application_number') THEN
        ALTER TABLE passport_records ADD COLUMN application_number TEXT;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_aadhar_number ON passport_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_mobile_number ON passport_records(mobile_number);
CREATE INDEX IF NOT EXISTS idx_email ON passport_records(email);
CREATE INDEX IF NOT EXISTS idx_pan_number ON passport_records(pan_number);