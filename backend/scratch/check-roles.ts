import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkRoles() {
  const { data, error } = await supabase
    .from('users')
    .select('role');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const roles = new Set(data.map(d => d.role));
  console.log('Unique roles currently in DB:', Array.from(roles));
}

checkRoles();
