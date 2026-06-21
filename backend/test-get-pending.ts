import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/home/rahul-yadav/Documents/JobFinder/backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('communication_requests')
    .select('*, users!requested_by(name), companies(company_name)')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

run();
