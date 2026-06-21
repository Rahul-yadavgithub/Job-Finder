const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const [branchesRes] = await Promise.all([
    supabase.from('branches').select('id, name, code, users(id, status)')
  ]);
  if (branchesRes.error) {
    console.error("Error:", branchesRes.error.message);
  } else {
    console.log("Success! Data:", branchesRes.data.length);
  }
}

test();
