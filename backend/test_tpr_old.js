require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const branchId = '9a8ffd49-1b2b-4b54-b590-25d6ec1aaa21'; // Old MNC id
  const { data } = await supabase.from('company_status').select('id').eq('branch_id', branchId);
  console.log('Old MNC companies count:', data?.length);
}
run();
