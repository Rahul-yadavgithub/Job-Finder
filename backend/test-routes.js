const axios = require('axios');
const http = require('http');

async function test() {
  const api = axios.create({ baseURL: 'http://localhost:5000/api/admin', validateStatus: () => true });
  const loginRes = await axios.post('http://localhost:5000/api/admin/auth/login', { email: 'abc@nith.ac.in', password: 'password123' }, { validateStatus: () => true });
  console.log('Login status:', loginRes.status);
  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
  
  const headers = { Cookie: cookie };
  
  const reqs = ['/requests/stats', '/companies/stats', '/people/stats', '/stats/audit-today', '/people/coworkers', '/requests'];
  for (const r of reqs) {
    const res = await api.get(r, { headers });
    console.log(`GET ${r} -> ${res.status}`);
  }
}
test();
