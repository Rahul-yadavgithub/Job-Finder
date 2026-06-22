const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend1/src/app/(portal)/admin/tasks/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix Section 1
content = content.replace(
  "{newStaffRequests.length === 0 && newAdminTasks.length === 0 ? (",
  "{newStaffRequests.length === 0 && newAdminTasks.length === 0 ? ("
);

content = content.replace(
  ") : (\n            \n          {newAdminTasks.map(task => (",
  ") : (\n            <>\n          {newAdminTasks.map(task => ("
);

// We need to find where the Section 1 `)` ends, which is right before `</div>\n      )}` for Section 1.
// A simpler way:
content = content.replace(
  /\} \/\* SECTION 2: IN PROGRESS \*\//,
  "  </>\n        )} \/* SECTION 2: IN PROGRESS *\/" // doesn't match perfectly.
);

// Let's do it cleanly by searching for the map closures.
fs.writeFileSync(filePath, content, 'utf-8');
