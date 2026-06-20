import mongoose from 'mongoose';
import { supabase } from '../src/config/supabase';
import { insertCompanyBatch } from '../src/services/company.queries';

async function test() {
  const inserts = [
    {
      company_name: 'Acme Corp',
      data_source: 'scan' as any
    }
  ];
  
  // Try inserting with a dummy userId and branchId (these must be valid in Supabase!)
  // Let's first query Supabase for a valid branchId and userId
  const { data: branch } = await supabase.from('branches').select('id').limit(1).single();
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  
  if (!branch || !user) {
    console.log('No branch or user found in Supabase');
    return;
  }
  
  console.log('Using branch:', branch.id, 'user:', user.id);
  
  try {
    const result = await insertCompanyBatch(inserts, user.id, branch.id);
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
