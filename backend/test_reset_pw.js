require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'rahuljnv669@gmail.com';
  const newPassword = 'password123';
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  await supabase.from('users').update({ password_hash: passwordHash }).eq('email', email);
  console.log('Password updated for', email);
}
run();
