const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { error } = await supabase.from('company_status').select('interested_by_name').limit(1);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Success! Columns exist.");
  }
}

test();
