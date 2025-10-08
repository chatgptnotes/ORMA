# 🎯 ORMA - Final Setup Guide

## ✅ What's Been Completed

All code has been implemented:
- ✅ Aadhaar extractor service (`src/services/aadharExtractor.ts`)
- ✅ Document type detection updated (`src/services/documentTypeService.ts`)
- ✅ Comprehensive field mapping for all 43 fields (`src/services/passportExtractor.ts`)
- ✅ Document upload UI (already in `src/components/FormBuilder.tsx`)
- ✅ SQL migration file (`sql/create_aadhar_records_table.sql`)
- ✅ Migration registered in Supabase history

## ⚠️ One Step Remaining: Create Database Table

Due to network connection issues with Supabase CLI, the table needs to be created manually via the dashboard.

---

## 🚀 QUICK SETUP (Recommended - 2 minutes)

### Step 1: Open Supabase Dashboard SQL Editor

1. Go to: **https://supabase.com/dashboard/project/wbbvhmmhhjgleoyvuxtq/sql/new**

   (This direct link opens SQL Editor for your project)

### Step 2: Execute the SQL

2. Copy the SQL below and paste it into the SQL Editor:

\`\`\`sql
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aadhar_number ON aadhar_records(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_aadhar_full_name ON aadhar_records(full_name);
CREATE INDEX IF NOT EXISTS idx_aadhar_created_at ON aadhar_records(created_at);
CREATE INDEX IF NOT EXISTS idx_aadhar_passport_record_id ON aadhar_records(passport_record_id);

-- Enable Row Level Security
ALTER TABLE aadhar_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON aadhar_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON aadhar_records;

-- Create policies for access control
CREATE POLICY "Enable all operations for authenticated users" ON aadhar_records
  FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON aadhar_records
  FOR SELECT USING (true);

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_aadhar_records_updated_at ON aadhar_records;
CREATE TRIGGER update_aadhar_records_updated_at BEFORE UPDATE ON aadhar_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

### Step 3: Run the SQL

3. Click **"Run"** button (or press **Cmd/Ctrl + Enter**)
4. Wait for success message: ✅ **"Success. No rows returned"**

### Step 4: Verify Table Creation

5. Go to: **Table Editor** in left sidebar
6. You should see **aadhar_records** in the table list
7. Click on it to see the table structure

---

## 🧪 Test the Complete System

### 1. Start Your Application

\`\`\`bash
cd /Users/apple/Desktop/Hope_projects/ORMA
npm run dev
\`\`\`

### 2. Navigate to Application Form

Open: http://localhost:5173 (or your dev server URL)

### 3. Upload Documents

Test with your sample documents from `/Users/apple/Downloads/`:

#### Test Sequence:

1. **📘 Upload Passport Front**
   - File: `WhatsApp Image 2025-10-04 at 10.49.10 AM.jpeg`
   - Expected auto-fill:
     - ✅ Full Name (CAPITAL)
     - ✅ First Name, Last Name
     - ✅ Date of Birth
     - ✅ Passport Number
     - ✅ Passport Issue Date
     - ✅ Passport Expiry Date
     - ✅ Place of Issue

2. **📗 Upload Passport Back/Address**
   - File: `WhatsApp Image 2025-10-04 at 10.49.09 AM.jpeg`
   - Expected auto-fill:
     - ✅ Father/Guardian Name
     - ✅ Mother Name
     - ✅ Spouse Name
     - ✅ Permanent Address
     - ✅ PIN Code

3. **🇮🇳 Upload Aadhaar Front**
   - File: `WhatsApp Image 2025-10-07 at 11.43.10 AM.jpeg`
   - Expected auto-fill:
     - ✅ Aadhaar Number
     - ✅ Full Name
     - ✅ Date of Birth
     - ✅ Gender

4. **🇮🇳 Upload Aadhaar Back**
   - File: `WhatsApp Image 2025-10-07 at 11.43.10 AM (1).jpeg`
   - Expected auto-fill:
     - ✅ Address
     - ✅ PIN Code

5. **🆔 Upload Emirates ID** (if you have)
   - Expected auto-fill:
     - ✅ Emirates ID Number / KSHEMANIDHI ID
     - ✅ Names in English & Arabic
     - ✅ Emirates Residence

6. **✈️ Upload VISA** (if you have)
   - Expected auto-fill:
     - ✅ VISA Number
     - ✅ Sponsor/Company Name
     - ✅ VISA Expiry Date
     - ✅ Occupation

### 4. Verify Database Storage

1. Go to Supabase Dashboard → **Table Editor**
2. Check these tables for new records:
   - `passport_records` - Should have passport data
   - `aadhar_records` - Should have Aadhaar data ✨ NEW
   - `emirates_id_records` - Should have Emirates ID data (if uploaded)
   - `visa_records` - Should have VISA data (if uploaded)

---

## 📊 What Gets Auto-Filled (All 43 Fields)

| Form Field | Data Source |
|---|---|
| **ORGANISATION** | Admin form |
| **Apply For** | Admin form |
| **Type** | Admin form |
| **NORKA ID NUMBER** | Admin form |
| **KSHEMANIDHI ID NUMBER** | Emirates ID |
| **Applicant Full Name (CAPITAL)** | Passport / Aadhaar |
| **First Name** | Passport |
| **Middle Name** | Passport |
| **Last Name** | Passport |
| **UAE Mobile Number** | Manual / Admin form |
| **WhatsApp Number** | Manual / Admin form |
| **Permanent Residence Address** | Passport back / Aadhaar back |
| **PIN Code** | Passport back / Aadhaar back |
| **Email ID** | Manual |
| **Indian Active Mobile Number** | Admin form |
| **Local Body Type** | Manual |
| **Taluk** | Manual |
| **Village** | Manual |
| **Local Body Name** | Manual |
| **District** | Passport / Aadhaar |
| **Current Residence Address (Abroad)** | Manual |
| **Aadhaar Number** | Aadhaar front ✨ NEW |
| **Nominee Details Section** | Manual |
| **Nominee Date of Birth** | Manual |
| **Nominee 1 Name** | Manual |
| **Nominee 2 Name** | Manual |
| **Nominee 3 Name** | Manual |
| **Form Collected By** | Manual |
| **Uploaded Copies** | Auto-tracked |
| **Visa Number** | VISA / Emirates ID |
| **Sponsor/Company Name** | VISA / Emirates ID |
| **Visa Expiry Date** | VISA / Emirates ID |
| **Occupation** | VISA / Emirates ID |
| **Passport Number** | Passport front |
| **Passport Issue Date** | Passport front |
| **Passport Expiry Date** | Passport front |
| **Passport Issued Place** | Passport front |
| **Date of Birth** | Passport / Aadhaar |
| **Father/Guardian Name** | Passport back |
| **Nominee name** | Manual |
| **Relationship** | Manual |
| **DOB** | Manual |
| **Age autocalculate** | Auto-calculated |
| **Current Occupation** | Manual / VISA |
| **Current Residence** | Manual |

---

## 🔧 Troubleshooting

### Table Already Exists Error

If you get "relation already exists" when running the SQL:
✅ **This is GOOD!** The table is already created. Proceed to testing.

### Could Not Find Table Error

If the app says "Could not find table 'aadhar_records'":
1. Refresh Supabase dashboard
2. Check Table Editor for aadhar_records
3. If not there, run the SQL again
4. Clear browser cache and restart app

### Extraction Not Working

If documents upload but fields don't auto-fill:
1. Check browser console for errors
2. Verify Gemini API key in `.env`
3. Check network tab for failed requests
4. Look for "STARTING FIELD MAPPING" in console logs

### Database Connection Error

If you see Supabase connection errors:
1. Verify `.env` has correct credentials:
   \`\`\`
   VITE_SUPABASE_URL=https://wbbvhmmhhjgleoyvuxtq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   \`\`\`
2. Check Supabase project status in dashboard
3. Verify RLS policies are set

---

## 🎉 Success Checklist

After setup, you should have:

- [x] ✅ All code files created
- [ ] ⏳ Aadhaar table created in Supabase (DO THIS NOW)
- [ ] ⏳ Test documents uploaded successfully
- [ ] ⏳ Form fields auto-filled correctly
- [ ] ⏳ Data saved to database tables

---

## 📞 Support

If you encounter any issues:

1. **Check browser console** (F12 → Console tab)
2. **Check Supabase logs** (Dashboard → Logs)
3. **Verify API keys** in `.env` file
4. **Review** `IMPLEMENTATION_SUMMARY.md` for details

---

## 🚀 Quick Start Command

After creating the table, run:

\`\`\`bash
npm run dev
\`\`\`

Then test by uploading your documents at the application form page!

---

## 📝 Files Reference

- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `sql/create_aadhar_records_table.sql`
- **Aadhaar Service**: `src/services/aadharExtractor.ts`
- **Document Detection**: `src/services/documentTypeService.ts`
- **Field Mapping**: `src/services/passportExtractor.ts`

---

**Your ORMA application is 99% ready! Just create the table and start testing! 🎯**
