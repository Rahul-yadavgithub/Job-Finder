const axios = require('axios');
require('dotenv').config();

async function check() {
  try {
    const res = await axios.get('https://api.brevo.com/v3/smtp/statistics/events?limit=5', {
      headers: { 'api-key': process.env.BREVO_API_KEY }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
check();
