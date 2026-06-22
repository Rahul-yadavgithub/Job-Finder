import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRevertedCompanies() {
  console.log('Fixing reverted companies...');
  
  const { data, error } = await supabase
    .from('company_status')
    .select('company_id, mid_status, locked, base_status')
    .eq('mid_status', 'revoked');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${data.length} revoked companies.`);

  let fixedCount = 0;
  for (const company of data) {
    if (company.locked === true || company.base_status !== 'call_again') {
      console.log(`Fixing company_id: ${company.company_id}`);
      const { error: updateError } = await supabase
        .from('company_status')
        .update({
          locked: false,
          locked_by: null,
          locked_at: null,
          base_status: 'call_again'
        })
        .eq('company_id', company.company_id);

      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        fixedCount++;
      }
    }
  }

  console.log(`Successfully fixed ${fixedCount} companies.`);
}

fixRevertedCompanies();
