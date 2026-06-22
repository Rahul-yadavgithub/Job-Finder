import { supabase } from '../src/config/supabase';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('[Migration] Starting database migrations...');
  
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id),
      type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      meta jsonb,
      is_read boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
  `;

  try {
    // The Supabase JS client doesn't support raw SQL out of the box unless an RPC is created.
    // Assuming 'exec_sql' RPC is available as per common Supabase migration setups.
    // If it's not available, you can create it in Supabase SQL editor:
    // create or replace function exec_sql(query text) returns void language plpgsql as $$ begin execute query; end; $$;
    const { error } = await supabase.rpc('exec_sql', { query: createTableSql });
    
    if (error) {
      // Fallback if 'exec_sql' isn't named that, let's try 'run_sql'
      if (error.message.includes('Could not find the function')) {
        const fallback = await supabase.rpc('run_sql', { sql: createTableSql });
        if (fallback.error) throw fallback.error;
      } else {
        throw error;
      }
    }
    
    console.log('[Migration] Successfully created notifications table.');
  } catch (error: any) {
    console.error('[Migration] Failed to run migration. If you do not have an RPC to execute raw SQL, please run this query manually in the Supabase Dashboard SQL Editor:\n');
    console.error(createTableSql);
    console.error('\nError details:', error.message || error);
    process.exit(1);
  }
}

runMigrations();
