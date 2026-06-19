const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      if (content.includes("'/admin/")) {
        content = content.replace(/'\/admin\//g, "'/");
        changed = true;
      }
      if (content.includes('"/admin/')) {
        content = content.replace(/"\/admin\//g, '"/');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir('/home/rahul-yadav/Documents/JobFinder/frontend1/src');
