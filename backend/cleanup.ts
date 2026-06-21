import * as dotenv from 'dotenv';
dotenv.config();

async function cleanupDatabase() {
  const { supabase } = require('./src/config/supabase');
  console.log('Starting full database cleanup of company data...');

  const tablesToClean = [
    'admin_notifications',
    'company_activities',
    'company_timeline',
    'contact_log',
    'status_history',
    'hr_contacts',
    'company_workflows',
    'admin_requests',
    'staff_requests',
    'communication_requests',
    'company_status',
    'companies'
  ];

  for (const table of tablesToClean) {
    console.log(`Cleaning table: ${table}...`);
    // Delete all records by matching where id is not null (a safe way to delete all rows via postgrest)
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Fallback for tables that might not have an 'id' column, delete by not matching a dummy UUID
    if (error) {
       console.log(`Failed deleting ${table} with id check, trying alternative...`);
       // If a table doesn't have an id, we might need a different column to filter by.
       // Usually all our tables have 'id' or 'company_id'.
       const { error: err2 } = await supabase.from(table).delete().neq('company_id', '00000000-0000-0000-0000-000000000000');
       if (err2) {
         console.error(`Error cleaning ${table}:`, err2.message);
       } else {
         console.log(`Successfully cleaned ${table}`);
       }
    } else {
      console.log(`Successfully cleaned ${table}`);
    }
  }

  console.log('\n✅ Cleanup complete! All company-related data has been removed.');
  console.log('Note: Branches, Users, and Settings were intentionally kept intact.');
}

cleanupDatabase();
