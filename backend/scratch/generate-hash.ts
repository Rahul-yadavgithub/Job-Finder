import bcrypt from 'bcryptjs';

async function generateHash() {
  const plain = 'HeadTPO123!';
  const hash = await bcrypt.hash(plain, 12);
  console.log('New Hash:', hash);
}

generateHash();
