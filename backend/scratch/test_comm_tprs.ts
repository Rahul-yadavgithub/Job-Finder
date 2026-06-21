import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'headtpo@nith.ac.in',
      password: 'admin123'
    });
    
    const token = loginRes.headers['set-cookie']?.find(c => c.startsWith('admin_token'))?.split(';')[0].split('=')[1] || loginRes.data.token;
    
    const headers = { Cookie: `admin_token=${token}` };
    
    const res = await axios.get(`http://localhost:5000/api/admin/people/communication-tprs`, { headers });
    console.log("Comm TPRs Response:", JSON.stringify(res.data, null, 2));
    
  } catch (err: any) {
    console.error('Failed:', err.response?.data || err.message);
  }
}
test();
