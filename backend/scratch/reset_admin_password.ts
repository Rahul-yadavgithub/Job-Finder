import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const hash = await bcrypt.hash('admin123', 12);
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('email', 'headtpo@nith.ac.in')
    .select();
    
  if (error) {
    console.error('Error resetting password:', error);
  } else {
    console.log('Password reset successfully to: admin123');
  }
}

resetPassword();
