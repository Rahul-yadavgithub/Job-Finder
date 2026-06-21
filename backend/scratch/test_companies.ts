import axios from 'axios';

async function test() {
  try {
    // Attempt to log in as head to get a cookie
    const loginRes = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'headtpo@nith.ac.in',
      password: 'password123'
    });
    const cookie = loginRes.headers['set-cookie']?.[0] || '';

    // Fetch companies
    const res = await axios.get('http://localhost:5000/api/admin/companies?filter=new&page=1&limit=20', {
      headers: { Cookie: cookie }
    });
    console.log(res.data);
  } catch (error: any) {
    if (error.response) {
      console.error('Error Data:', error.response.data);
    } else {
      console.error('Error:', error);
    }
  }
}

test();
