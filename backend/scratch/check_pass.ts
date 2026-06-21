import bcrypt from 'bcryptjs';

const hash = '$2b$12$C.wycxOT6f6RDvD/QMtX9Oegn9.UqYMcen1l39DTTMetp9nisQBrq';
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
