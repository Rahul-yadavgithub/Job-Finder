require('dotenv').config();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: user } = await supabase
    .from('users')
    .select('*, branches(id, name)')
    .eq('email', 'rahuljnv669@gmail.com')
    .single();
    
  console.log('User from DB:', user);
  
  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    branchId: user.branches?.id || user.branch_id,
    branchName: user.branches?.name,
    role: user.role,
    status: user.status,
    tokenVersion: user.token_version || 0
  };
  
  console.log('Payload for JWT:', payload);
}

run().catch(console.error);
