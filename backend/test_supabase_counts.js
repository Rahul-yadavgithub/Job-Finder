require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const branchId = '11111111-1111-1111-1111-111111111111';
  
  const [totalRes, pendingRes] = await Promise.all([
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
    supabase.from('company_status').select('*', { count: 'exact', head: true }).eq('branch_id', branchId).or('base_status.eq.not_contacted,base_status.eq.pending,base_status.is.null'),
  ]);
  
  console.log('Total:', totalRes.count, 'Error:', totalRes.error);
  console.log('Pending:', pendingRes.count, 'Error:', pendingRes.error);
}

run();
