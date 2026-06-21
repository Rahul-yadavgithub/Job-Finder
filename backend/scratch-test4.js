const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/people/communication-tprs');
    console.log(res.status);
  } catch (e) {
    console.error(e.message);
  }
}

test();
