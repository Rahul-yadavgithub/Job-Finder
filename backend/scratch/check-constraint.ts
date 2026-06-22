import { supabase } from '../src/config/supabase';
async function run() {
  const { data, error } = await supabase.from('drive_details').select('drive_type').limit(1);
  console.log('Sample data:', data, error);
}
run();
