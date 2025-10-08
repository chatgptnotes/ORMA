import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  console.log('🔍 Checking if aadhar_records table exists...\n');

  // Try to query the table
  const { data, error } = await supabase
    .from('aadhar_records')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Table does NOT exist');
    console.log('   Error:', error.message);
    console.log('\n   The table needs to be created.');
    return false;
  } else {
    console.log('✅ Table EXISTS!');
    console.log('   Current record count:', data.length);

    // Get table structure
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'aadhar_records' })
      .select();

    console.log('\n📊 Table is ready to use!');
    return true;
  }
}

checkTable();
