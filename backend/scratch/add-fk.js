require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

async function addForeignKey() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Add foreign key constraint
    const query = `
      ALTER TABLE communication_requests
      ADD CONSTRAINT fk_communication_requests_template_id
      FOREIGN KEY (template_id)
      REFERENCES email_templates (id)
      ON DELETE SET NULL;
    `;
    
    await client.query(query);
    console.log('Foreign key constraint added successfully.');

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

addForeignKey();
