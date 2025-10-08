# Supabase Setup Guide for ORMA

## Quick Setup: Apply Aadhaar Table Schema

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Or directly: https://wbbvhmmhhjgleoyvuxtq.supabase.co

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Copy and Paste Schema**
   - Open the file: `sql/create_aadhar_records_table.sql`
   - Copy all contents
   - Paste into the SQL Editor

4. **Execute**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message
   - You should see "Query returned successfully"

5. **Verify Table Creation**
   - Go to "Table Editor" in left sidebar
   - You should now see `aadhar_records` table listed
   - Click on it to see the table structure

### Option 2: Using Node.js Script

Create a file `scripts/apply-schema.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applySchema() {
  try {
    console.log('📋 Reading SQL file...');
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_aadhar_records_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error applying schema:', error);
      process.exit(1);
    }

    console.log('✅ Schema applied successfully!');
    console.log('📊 You can now view the aadhar_records table in Supabase dashboard');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applySchema();
```

Then run:
```bash
node scripts/apply-schema.js
```

### Option 3: Using psql (PostgreSQL CLI)

If you have PostgreSQL client installed:

```bash
# Get your connection string from Supabase dashboard:
# Settings > Database > Connection string > URI

psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  -f sql/create_aadhar_records_table.sql
```

## Verify Installation

### Check Table Exists

Run this SQL in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'aadhar_records';
```

Expected result:
```
table_name
--------------
aadhar_records
```

### Check Table Structure

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'aadhar_records'
ORDER BY ordinal_position;
```

You should see columns:
- id (uuid)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
- passport_record_id (uuid)
- full_name (text)
- date_of_birth (text)
- gender (text)
- aadhar_number (text)
- address (text)
- pin_code (text)
- district (text)
- state (text)
- source_file_name (text)
- extraction_timestamp (timestamp with time zone)
- extraction_confidence (numeric)
- page_type (text)
- has_photo (boolean)
- has_signature (boolean)

### Test Insert

```sql
INSERT INTO aadhar_records (
  full_name,
  aadhar_number,
  date_of_birth,
  gender
) VALUES (
  'Test User',
  '1234 5678 9012',
  '01/01/1990',
  'M'
) RETURNING *;
```

If successful, you should see the inserted record with a generated UUID.

### Clean Up Test Data

```sql
DELETE FROM aadhar_records WHERE full_name = 'Test User';
```

## Database Tables Overview

After setup, you should have these tables:

```
public
├── passport_records         ✅ Already exists
├── emirates_id_records      ✅ Already exists
├── visa_records             ✅ Already exists
├── aadhar_records           🆕 NEW (just created)
├── applications             ✅ Already exists
├── documents                ✅ Already exists
└── users                    ✅ Already exists
```

## Troubleshooting

### Error: "relation already exists"
**Solution**: Table already created! You're good to go.

### Error: "permission denied"
**Solution**: Make sure you're using SUPABASE_SERVICE_ROLE_KEY (not ANON_KEY) for admin operations.

### Error: "function update_updated_at_column does not exist"
**Solution**: The function is created in `supabase/schema.sql`. Run that file first:
```sql
-- From supabase/schema.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "Cannot connect to Supabase"
**Solution**: Check your .env file has correct credentials:
```
VITE_SUPABASE_URL=https://wbbvhmmhhjgleoyvuxtq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Test the Integration

After applying schema, test the full flow:

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Go to Application Form**
   - Navigate to http://localhost:5173/application

3. **Upload Aadhaar Card**
   - Upload front and/or back image
   - Wait for extraction
   - Check browser console for logs

4. **Verify Database**
   - Go to Supabase Dashboard → Table Editor
   - Select `aadhar_records` table
   - You should see a new record with extracted data

## Next Steps

After successful setup:
1. ✅ Schema applied
2. 📤 Upload test documents
3. 🔍 Verify data extraction
4. 💾 Check database records
5. 📋 Fill remaining form fields
6. ✅ Submit form

Your ORMA application is now ready for production use! 🎉
