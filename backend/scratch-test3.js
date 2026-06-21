const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['head', 'caller', 'coordinator']);
  console.log("Error:", error);
}
test();
