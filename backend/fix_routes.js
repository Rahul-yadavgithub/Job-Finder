const fs = require('fs');
const file = 'src/routes/api.ts';
let code = fs.readFileSync(file, 'utf8');

const regex1 = /(router\.post\('\/sync\/:branch_id',[\s\S]*?router\.get\('\/sync\/history\/:branch_id\/companies',[\s\S]*?}\);\n)/;
const match1 = code.match(regex1);
if (!match1) {
  console.log("Could not find block 1");
  process.exit(1);
}
const block1 = match1[0];

// Remove block 1 from the original position
code = code.replace(block1, '');

// Find where to insert it: right before "// --- BRANCH PORTAL & CONTACTS ---"
const insertPoint = '// --- BRANCH PORTAL & CONTACTS ---';
if (code.includes(insertPoint)) {
  code = code.replace(insertPoint, block1 + '\n' + insertPoint);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Could not find insert point");
}
