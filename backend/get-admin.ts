import { supabase } from './src/config/supabase';

async function run() {
  const { data } = await supabase.from('users').select('*').eq('role', 'head').limit(1);
  console.log(data);
}
run();
