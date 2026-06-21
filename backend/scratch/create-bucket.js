const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('templates', {
    public: true,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    if (error.message === 'The resource already exists') {
      console.log('Bucket "templates" already exists.');
      // Make sure it's public
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('templates', {
        public: true,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 10485760
      });
      if (updateError) {
         console.error('Error updating bucket:', updateError);
      } else {
         console.log('Bucket updated successfully.');
      }
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "templates" created successfully!', data);
  }
}

createBucket();
