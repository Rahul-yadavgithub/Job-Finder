import { supabase } from './src/config/supabase';

async function run() {
  const branchId = '11111111-1111-1111-1111-111111111111';
  const status = 'pending';
  
  let query = supabase
    .from('companies')
    .select('*, company_status!inner(*)')
    .eq('company_status.branch_id', branchId);
    
  query = query.or('base_status.eq.not_contacted,base_status.eq.pending,base_status.is.null', { foreignTable: 'company_status' });

  const { data, error } = await query.limit(10);
  console.log('Error:', error);
  console.log('Companies:', data?.length);
}
run();
