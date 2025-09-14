# Supabase Schema Migration Instructions

## Overview
The application now supports handwritten form extraction (Document 4) and requires additional columns in the `passport_records` table to store this data.

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/add_handwritten_columns.sql`
4. Click "Run" to execute the migration

### Option 2: Fresh Installation

If you're setting up a new database:

1. Use the updated `supabase/schema.sql` file which includes all columns
2. Run the entire schema file in your Supabase SQL Editor

### Option 3: Manual Column Addition

Add the following columns to your `passport_records` table:

#### Address Information
- `district` (TEXT)
- `state` (TEXT)
- `permanent_address` (TEXT)

#### Contact Information
- `mobile_number` (TEXT)
- `email` (TEXT)
- `alternate_phone` (TEXT)

#### Identity Documents
- `aadhar_number` (TEXT)
- `pan_number` (TEXT)
- `voter_id` (TEXT)

#### Educational and Professional Information
- `education` (TEXT)
- `school_name` (TEXT)
- `occupation` (TEXT)

#### Additional Personal Information
- `age` (TEXT)
- `marital_status` (TEXT)
- `religion` (TEXT)
- `blood_group` (TEXT)

#### Emergency Contact
- `emergency_contact_name` (TEXT)
- `emergency_contact_relation` (TEXT)
- `emergency_contact_number` (TEXT)
- `emergency_contact_address` (TEXT)

#### Form Metadata
- `form_type` (TEXT)
- `submission_date` (TEXT)
- `application_number` (TEXT)

## Verification

After running the migration, verify that all columns have been added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'passport_records'
ORDER BY ordinal_position;
```

## Indexes

The migration also creates indexes for commonly searched fields:
- `idx_aadhar_number`
- `idx_mobile_number`
- `idx_email`
- `idx_pan_number`

## Notes

- All new columns are nullable to maintain backward compatibility
- Existing data will not be affected
- The `form_data` JSONB column continues to store the complete form data
- Handwritten form data will be stored with `form_type = 'Handwritten Form'`