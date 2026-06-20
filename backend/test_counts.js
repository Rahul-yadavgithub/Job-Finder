require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const mncId = '11111111-1111-1111-1111-111111111111';
  
  const { data: companies, error: err1 } = await supabase.from('companies').select('id').eq('branch_id', mncId);
  console.log(`Total companies in companies table for MNC:`, companies?.length);
  
  const { data: status, error: err2 } = await supabase.from('company_status').select('id, base_status').eq('branch_id', mncId);
  console.log(`Total companies in company_status table for MNC:`, status?.length);
  
  if (status && status.length > 0) {
    const statuses = status.map(s => s.base_status);
    const counts = statuses.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    console.log('Status breakdown:', counts);
  }
}

run().catch(console.error);
