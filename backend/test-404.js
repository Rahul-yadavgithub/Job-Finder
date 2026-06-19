const axios = require('axios');
async function test() {
  const api = axios.create({ baseURL: 'http://localhost:5000/api/admin', validateStatus: () => true });
  const res = await api.get('/this-path-does-not-exist');
  console.log('GET /this-path-does-not-exist ->', res.status);
}
test();
