import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
    ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_notification_category_check;
  `;
  const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}
run();
