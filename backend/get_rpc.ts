import { supabase } from './src/config/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { data, error } = await supabase.rpc('run_sql', {
     sql_query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'insert_company_safe';"
  });
  console.log(data || error);
  process.exit(0);
}
run();
