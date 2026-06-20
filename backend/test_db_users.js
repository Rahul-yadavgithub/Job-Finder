require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase.from('users').select('*').eq('email', 'rahuljnv669@gmail.com').single();
  console.log('User branch_id:', user.branch_id);
}
run();
