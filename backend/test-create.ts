import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/home/rahul-yadav/Documents/JobFinder/backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: user } = await supabase.from('users').select('id').limit(1).single();
  const { data: company } = await supabase.from('companies').select('id').limit(1).single();
  
  if (!user || !company) return console.log('Missing user or company');

  console.log('Creating draft...');
  const { data: draft, error: draftErr } = await supabase.from('communication_requests').insert({
    company_id: company.id,
    requested_by: user.id,
    request_type: 'institute_brochure',
    email_to: 'test@example.com',
    email_subject: 'Test Subject',
    email_body: 'Test Body',
    status: 'draft'
  }).select('*').single();

  console.log('Draft:', draft?.id, draft?.status, draftErr);

  console.log('Submitting for approval...');
  const { data: submitted, error: subErr } = await supabase.from('communication_requests').update({
    status: 'pending_approval'
  }).eq('id', draft.id).eq('status', 'draft').select('*').single();

  console.log('Submitted:', submitted?.id, submitted?.status, subErr);
}

run();
