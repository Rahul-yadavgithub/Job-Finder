import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const sqlPath = path.resolve(__dirname, '../../../migration.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('Running migration...');
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('Error running migration via run_sql:', error);
      console.log('If run_sql is not defined, we need the raw postgres connection string.');
    } else {
      console.log('Migration successful!', data);
    }
  } catch (err) {
    console.error('Failed to run migration:', err);
  }
}

run();
