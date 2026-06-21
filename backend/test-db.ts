import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/home/rahul-yadav/Documents/JobFinder/backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: requests, error } = await supabase
    .from('communication_requests')
    .select('id, created_at, status');
  console.log('Communication Requests:', requests);
}

test();
