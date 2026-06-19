import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const plainPassword = 'password123';
  const hash = await bcrypt.hash(plainPassword, 12);
  
  const { data, error } = await supabase.from('users').insert({
    name: 'Mid-Level TPR Test',
    email: 'midtpr@nith.ac.in',
    roll_number: 'MID' + Math.floor(Math.random() * 10000),
    password_hash: hash,
    role: 'communication_tpr',
    status: 'approved'
  });
  
  if (error) {
    console.error('Error creating TPR:', error);
  } else {
    console.log('Successfully created Communication TPR!');
    console.log('Email: midtpr@nith.ac.in');
    console.log('Password: password123');
  }
}
run();
