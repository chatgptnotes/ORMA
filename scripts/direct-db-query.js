import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection string format
// postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

const connectionString = `postgresql://postgres.wbbvhmmhhjgleoyvuxtq:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function executeSchema() {
  const client = new pg.Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📋 Reading SQL file...');
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_aadhar_records_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📝 SQL loaded:', sql.length, 'characters\n');

    console.log('🚀 Executing schema...');
    await client.query(sql);

    console.log('✅ Schema applied successfully!\n');

    // Verify table exists
    console.log('🔍 Verifying table creation...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'aadhar_records'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table created successfully with', result.rows.length, 'columns:');
      result.rows.forEach(row => {
        console.log(`   • ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Warning: Table not found in information_schema');
    }

    // Test insert
    console.log('\n🧪 Testing insert...');
    const testResult = await client.query(`
      INSERT INTO aadhar_records (full_name, aadhar_number, date_of_birth, gender)
      VALUES ('Test User', '1234 5678 9012', '01/01/1990', 'M')
      RETURNING id, full_name, aadhar_number;
    `);

    console.log('✅ Test insert successful:');
    console.log('   ID:', testResult.rows[0].id);
    console.log('   Name:', testResult.rows[0].full_name);
    console.log('   Aadhaar:', testResult.rows[0].aadhar_number);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await client.query(`DELETE FROM aadhar_records WHERE full_name = 'Test User';`);
    console.log('✅ Test data deleted\n');

    console.log('🎉 All operations completed successfully!');
    console.log('📊 You can now use the aadhar_records table in your application');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P07') {
      console.log('\n✅ Table already exists! No action needed.');
    } else {
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

console.log('🎯 ORMA - Direct Database Schema Application\n');
executeSchema();
