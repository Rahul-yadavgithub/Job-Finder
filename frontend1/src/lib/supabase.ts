import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lsjqkkvpffwaqxrvrmus.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanFra3ZwZmZ3YXF4cnZybXVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgwNDY2MiwiZXhwIjoyMDk3MzgwNjYyfQ.D_q0qD6OaVwG0vZPslO6xjUhPQX5uCLduKyjpp_Pfro'; // Using service key as a fallback for local dev

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
