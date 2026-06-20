import { supabase } from '../src/config/supabase';
async function run() {
  const { data, error } = await supabase.from('import_jobs').select('status, error_details, created_at').order('created_at', { ascending: false }).limit(2);
  console.log(JSON.stringify({data, error}, null, 2));
}
run();
