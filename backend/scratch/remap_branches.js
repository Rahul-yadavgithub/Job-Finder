require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAPPINGS = {
  // MNC (mnc) -> MNC (circuital)
  '9a8ffd49-1b2b-4b54-b590-25d6ec1aaa21': '11111111-1111-1111-1111-111111111111',
  // CSE (cse) -> Computer Science and Engineering
  '6df40a38-c32e-4e38-aafc-521d52dfae2f': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // IT (it) -> CSE
  'a6622226-3a5d-4a99-aa7e-0f783bbcbd9a': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // MBA (mba) -> CSE (just to preserve foreign keys before deletion)
  '123371c0-2bcb-4569-9487-738f46db2e76': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // MCA (mca) -> CSE
  '7c385fe7-112c-4aed-8814-d39d13363dd8': 'd29c79ff-d7c8-4708-a64d-4551033ae874',
  // Mechanical (mech) -> Mechanical Engineering
  '3f7f583d-6d88-4b34-a8b5-fb5e72ecc482': 'f5f51327-b5b3-4d8c-9c92-1b6eaeca67af',
  // Civil (civil) -> Civil Engineering
  '3b04c9a1-4fbb-4c20-8151-8a90be71c411': '92b914e7-15ed-473a-a2ee-ad1190f964f8',
  // Electronics (ece) -> Electronics and Communication
  '77085d5d-961a-4018-90fd-f5e75717b52e': 'c3c4e083-662e-4bde-a3f9-8d5ad362e624',
};

// Canonical 9 branches
const CANONICAL_IDS = [
  '11111111-1111-1111-1111-111111111111', // MNC
  'd29c79ff-d7c8-4708-a64d-4551033ae874', // CSE
  'db3856bb-a046-4a49-988d-77c32805037f', // EE
  'c3c4e083-662e-4bde-a3f9-8d5ad362e624', // ECE
  'c1adb451-06f9-401e-9b44-1052f0b164ef', // EP
  'f5f51327-b5b3-4d8c-9c92-1b6eaeca67af', // ME
  '92b914e7-15ed-473a-a2ee-ad1190f964f8', // CE
  '8b6d81df-5612-4a49-8c71-097b10987fd5', // CH
  '495c6a66-91d2-472b-bd81-d8711ba4875c', // MSE
];

async function run() {
  console.log('Starting Supabase remap...');
  
  for (const [oldId, newId] of Object.entries(MAPPINGS)) {
    console.log(`Remapping ${oldId} -> ${newId}`);
    
    // Remap companies
    await supabase.from('companies').update({ branch_id: newId }).eq('branch_id', oldId);
    
    // Remap company_status
    await supabase.from('company_status').update({ branch_id: newId }).eq('branch_id', oldId);
    
    // Remap import_jobs
    await supabase.from('import_jobs').update({ branch_id: newId }).eq('branch_id', oldId);
    
    // Remap users
    await supabase.from('users').update({ branch_id: newId }).eq('branch_id', oldId);
  }

  console.log('All relations remapped. Now deleting old branches...');

  const { data: allBranches, error: getErr } = await supabase.from('branches').select('id');
  if (getErr) throw getErr;

  const idsToDelete = allBranches.map(b => b.id).filter(id => !CANONICAL_IDS.includes(id));
  
  console.log('Branches to delete:', idsToDelete);

  for (const id of idsToDelete) {
    const { error: delErr } = await supabase.from('branches').delete().eq('id', id);
    if (delErr) {
      console.error(`Failed to delete branch ${id}:`, delErr.message);
    } else {
      console.log(`Deleted branch ${id}`);
    }
  }

  // Update canonical names for consistency
  await supabase.from('branches').update({ name: 'MNC', code: 'MNC', sheet_tab_name: 'MNC' }).eq('id', '11111111-1111-1111-1111-111111111111');
  await supabase.from('branches').update({ name: 'CSE', code: 'CSE', sheet_tab_name: 'CSE' }).eq('id', 'd29c79ff-d7c8-4708-a64d-4551033ae874');
  await supabase.from('branches').update({ name: 'EE', code: 'EE', sheet_tab_name: 'EE' }).eq('id', 'db3856bb-a046-4a49-988d-77c32805037f');
  await supabase.from('branches').update({ name: 'ECE', code: 'ECE', sheet_tab_name: 'ECE' }).eq('id', 'c3c4e083-662e-4bde-a3f9-8d5ad362e624');
  await supabase.from('branches').update({ name: 'EP', code: 'EP', sheet_tab_name: 'EP' }).eq('id', 'c1adb451-06f9-401e-9b44-1052f0b164ef');
  await supabase.from('branches').update({ name: 'ME', code: 'ME', sheet_tab_name: 'ME' }).eq('id', 'f5f51327-b5b3-4d8c-9c92-1b6eaeca67af');
  await supabase.from('branches').update({ name: 'CE', code: 'CE', sheet_tab_name: 'CE' }).eq('id', '92b914e7-15ed-473a-a2ee-ad1190f964f8');
  await supabase.from('branches').update({ name: 'CH', code: 'CH', sheet_tab_name: 'CH' }).eq('id', '8b6d81df-5612-4a49-8c71-097b10987fd5');
  await supabase.from('branches').update({ name: 'MSE', code: 'MSE', sheet_tab_name: 'MSE' }).eq('id', '495c6a66-91d2-472b-bd81-d8711ba4875c');

  console.log('Cleanup complete!');
}

run().catch(console.error);
