import { supabase } from './src/config/supabase';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const email = 'aksinup93@gmail.com';
  
  // 1. Get user
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email)
    .single();
    
  if (error || !user) {
    console.log('User not found:', error);
    return;
  }
  console.log('User found:', user.id);
  
  // 2. Generate token
  const secret = process.env.JWT_SECRET + user.password_hash;
  const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });
  console.log('Generated token:', token);
  
  // 3. Verify token
  try {
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully:', decoded);
  } catch (err) {
    console.log('Token verification failed:', err);
  }
}

run();
