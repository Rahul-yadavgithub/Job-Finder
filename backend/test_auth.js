const axios = require('axios');
async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahuljnv669@gmail.com',
      password: 'password123'
    });
    const cookie = loginRes.headers['set-cookie'][0];
    
    const dashRes = await axios.get('http://localhost:5000/api/tpr/dashboard', {
      headers: { Cookie: cookie }
    });
    console.log('Dashboard data:', dashRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
run();
