import { supabase } from './src/config/supabase';

async function test() {
  const { data, error } = await supabase.from('company_status').select('base_status, count');
  console.log('Result:', data, error);
}
test();
