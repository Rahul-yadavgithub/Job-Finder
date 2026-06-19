const jwt = require('jsonwebtoken');
const axios = require('axios');
async function test() {
  const secret = '11d47f49b4d901e7fd70d061c040681e9fad4c570413705aef049f99e309dcbf';
  const payload = {
    userId: 'b26575c5-bc91-4025-989a-415338cfcb32',
    role: 'head',
    isSuperAdmin: true,
    tokenVersion: 1
  };
  const token = jwt.sign(payload, secret);
  const api = axios.create({ baseURL: 'http://localhost:5000/api/admin', validateStatus: () => true });
  const headers = { Cookie: `admin_token=${token}` };
  
  const reqs = ['/requests/stats', '/companies/stats', '/people/stats', '/stats/audit-today', '/people/coworkers', '/requests'];
  for (const r of reqs) {
    const res = await api.get(r, { headers });
    console.log(`GET ${r} -> ${res.status}`);
  }
}
test();
