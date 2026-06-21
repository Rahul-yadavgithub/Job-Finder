const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ userId: 'mock', role: 'head', isSuperAdmin: true, tokenVersion: 0 }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
console.log(token);
