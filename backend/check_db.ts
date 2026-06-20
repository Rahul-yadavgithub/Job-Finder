import { supabase } from './src/config/supabase';
async function main() {
  const { data, error } = await supabase.from('company_status').insert({
    company_id: '00000000-0000-0000-0000-000000000000',
    branch_id: '00000000-0000-0000-0000-000000000000',
    base_status: 'not_contacted',
    mid_status: 'interested'
  }).select();
  console.log('interested:', error);
  const { data: d2, error: e2 } = await supabase.from('company_status').insert({
    company_id: '00000000-0000-0000-0000-000000000000',
    branch_id: '00000000-0000-0000-0000-000000000000',
    base_status: 'not_contacted',
    mid_status: 'pending_review'
  }).select();
  console.log('pending_review:', e2);
}
main();
