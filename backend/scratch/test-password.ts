import bcrypt from 'bcryptjs';

async function testPassword() {
  const hash = '$2b$12$C.wycxOT6f6RDvD/QMtX9Oegn9.UqYMcen1l39DTTMetp9nisQBrq';
  const plain = 'HeadTPO123!';
  const isMatch = await bcrypt.compare(plain, hash);
  console.log('Password Match:', isMatch);
}

testPassword();
