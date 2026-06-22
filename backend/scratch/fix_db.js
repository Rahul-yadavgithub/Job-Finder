require('dotenv').config({path:'/home/rahul-yadav/Documents/JobFinder/backend/.env'});
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect().then(async () => {
  try {
    await client.query("ALTER TABLE staff_requests DROP CONSTRAINT staff_requests_status_check;");
    console.log("Dropped constraint");
    await client.query("ALTER TABLE staff_requests ADD CONSTRAINT staff_requests_status_check CHECK (status IN ('pending_send', 'waiting_response', 'accepted', 'rejected', 'completed'));");
    console.log("Added new constraint");
  } catch (e) {
    console.error(e);
  } finally {
    client.end();
  }
});
