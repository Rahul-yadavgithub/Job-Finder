import bcrypt from 'bcryptjs';
const hash = '$2b$12$QlVEGhKNXVO.5qT6XvrXl.84RE/2fWWGtQ3SsrhiOXhDd2RPq9JMG';
const passwords = ['password123', 'admin123', 'headtpo', 'password', 'admin', 'HeadTPO123', 'headtpo123', 'Admin123'];

async function check() {
  for (const p of passwords) {
    if (await bcrypt.compare(p, hash)) {
      console.log('Match found:', p);
      return;
    }
  }
  console.log('No match found');
}
check();
