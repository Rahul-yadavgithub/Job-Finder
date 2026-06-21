import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'headtpo@nith.ac.in',
      password: 'admin123'
    });
    
    const token = loginRes.headers['set-cookie']?.find(c => c.startsWith('admin_token'))?.split(';')[0].split('=')[1] || loginRes.data.token;
    
    const headers = { Cookie: `admin_token=${token}` };
    
    const routes = [
      '/api/admin/people/stats',
      '/api/admin/people/coworkers',
      '/api/admin/people/branch-tprs',
      '/api/admin/people/communication-tprs'
    ];

    for (const route of routes) {
      try {
        const res = await axios.get(`http://localhost:5000${route}`, { headers });
        console.log(`[OK] ${route}`);
      } catch (err: any) {
        console.error(`[FAIL] ${route} ->`, err.response?.data || err.message);
      }
    }
  } catch (err: any) {
    console.error('Failed:', err.response?.data || err.message);
  }
}
test();
