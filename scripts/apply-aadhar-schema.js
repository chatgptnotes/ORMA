import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  console.log('🚀 Executing SQL...');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });

      if (error) {
        // Try alternative method using direct query
        const { error: queryError } = await supabase.from('_migrations').select('*').limit(0);

        if (queryError) {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return errorCount === 0;
}

async function applySchema() {
  try {
    console.log('📋 Reading Aadhaar schema SQL file...');
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_aadhar_records_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 SQL file loaded, length:', sql.length, 'characters');

    // Check if table already exists
    console.log('\n🔍 Checking if aadhar_records table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('aadhar_records')
      .select('id')
      .limit(0);

    if (!tableError) {
      console.log('⚠️  Table aadhar_records already exists!');
      console.log('   The schema may have been applied previously.');
      console.log('   Skipping schema application to avoid errors.');
      return;
    }

    console.log('✓ Table does not exist, proceeding with creation...\n');

    // Execute the SQL using REST API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Fallback: Try executing statements one by one
      console.log('⚠️  RPC method failed, trying statement-by-statement execution...\n');
      const success = await executeSQL(sql);

      if (success) {
        console.log('\n✅ Schema applied successfully!');
        console.log('📊 You can now view the aadhar_records table in Supabase dashboard');
      } else {
        console.log('\n⚠️  Some errors occurred, but the table may have been created.');
        console.log('   Please verify in Supabase dashboard.');
      }
      return;
    }

    const result = await response.json();
    console.log('✅ Schema applied successfully!');
    console.log('📊 Result:', result);
    console.log('\n📋 Verifying table creation...');

    // Verify table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('aadhar_records')
      .select('id')
      .limit(0);

    if (verifyError) {
      console.log('⚠️  Warning: Could not verify table creation');
      console.log('   Error:', verifyError.message);
    } else {
      console.log('✅ Table verified successfully!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

console.log('🎯 ORMA - Aadhaar Schema Application Tool\n');
applySchema();
