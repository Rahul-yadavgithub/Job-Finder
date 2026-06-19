import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUser() {
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: '$2b$12$QlVEGhKNXVO.5qT6XvrXl.84RE/2fWWGtQ3SsrhiOXhDd2RPq9JMG' })
    .eq('email', 'headtpo@nith.ac.in')
    .select();
    
  console.log('Error:', error);
  console.log('Updated Data:', data);
}

updateUser();
