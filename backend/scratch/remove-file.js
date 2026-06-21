const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeFile() {
  const { data, error } = await supabase
    .from('email_templates')
    .update({ attachment_url: null, attachment_filename: null })
    .eq('template_type', 'jnf_form');

  if (error) {
    console.error('Error removing file:', error);
  } else {
    console.log('File removed manually from database:', data);
  }
}

removeFile();
