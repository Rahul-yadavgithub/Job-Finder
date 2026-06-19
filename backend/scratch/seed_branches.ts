import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const branches = [
    { name: 'Computer Science', code: 'CSE', sheet_tab_name: 'CSE_Tab' },
    { name: 'Electronics and Communication', code: 'ECE', sheet_tab_name: 'ECE_Tab' },
    { name: 'Electrical Engineering', code: 'EE', sheet_tab_name: 'EE_Tab' },
    { name: 'Mechanical Engineering', code: 'ME', sheet_tab_name: 'ME_Tab' },
    { name: 'Civil Engineering', code: 'CE', sheet_tab_name: 'CE_Tab' }
  ];

  console.log('Seeding branches...');
  for (const b of branches) {
    const { error } = await supabase.from('branches').insert(b);
    if (error) {
      if (error.code === '23505') {
        console.log(`Branch ${b.code} already exists.`);
      } else {
        console.error('Error inserting:', error);
      }
    } else {
      console.log(`Inserted ${b.name}`);
    }
  }
  console.log('Done.');
}

seed();
