const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/routes/adminRequests.routes.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add import
content = content.replace(
  "transitionWorkflowState,",
  "transitionWorkflowState,\n  addCustomWorkflowStage,"
);

// 2. Add route
content = content.replace(
  "router.get('/companies/:companyId/workflows', getCompanyWorkflows);",
  "router.get('/companies/:companyId/workflows', getCompanyWorkflows);\nrouter.post('/companies/:companyId/workflows/custom', addCustomWorkflowStage);"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Routes updated!');
