const jwt = require('jsonwebtoken');

const JWT_SECRET = 'fb3b8a34d8e578a1bc40289d3c5f216da1117532d84784a956d354b2382c49c2';
const password_hash = '$2a$12$12345678901234567890123456789012345678901234567890123';

const secret = JWT_SECRET + password_hash;

const token = jwt.sign({ id: '123', email: 'test@example.com' }, secret, { expiresIn: '15m' });
console.log("Token:", token);

try {
  const decoded = jwt.verify(token, secret);
  console.log("Verified successfully:", decoded);
} catch (err) {
  console.error("Verification failed:", err.message);
}
