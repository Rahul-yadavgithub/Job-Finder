import { supabase } from '../src/config/supabase';
async function run() {
  const { count, error } = await supabase.from('companies').select('*', { count: 'exact', head: true });
  console.log("Supabase companies count:", count);
}
run();
