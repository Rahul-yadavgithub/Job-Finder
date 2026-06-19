const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '../src/routes/api.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// Remove imports
content = content.replace(/import CompanyStatusHistory from '\.\.\/models\/CompanyStatusHistory';\n/g, '');
content = content.replace(/import Branch from '\.\.\/models\/Branch';\n/g, '');
content = content.replace(/import ContactLog from '\.\.\/models\/ContactLog';\n/g, '');

// Remove lines 223 to 1179
const lines = content.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('router.put(\'/companies/:id/assignment\'')) {
    skip = true;
  }
  if (skip && line.includes('// --- HISTORY API ---')) {
    skip = false;
  }
  
  if (!skip) {
    newLines.push(line);
  }
}

content = newLines.join('\n');

// Replace getScanStats usage of CompanyStatusHistory
const getScanStatsRegex = /const statusChanges = await CompanyStatusHistory\.find\(historyQuery\)\.lean\(\);([\s\S]*?)totalReviewed \+= rejectedChanges\.length;/;
const replacement = `
  // Use supabase for status changes
  const { data: statusChangesData } = await supabase
    .from('status_history')
    .select('new_status')
    .gte('changed_at', fromDate ? fromDate.toISOString() : '2000-01-01T00:00:00Z')
    .lte('changed_at', toDate ? toDate.toISOString() : '2100-01-01T00:00:00Z');

  const statusChanges = statusChangesData || [];
  let totalReviewed = 0;
  let totalApproved = 0;

  statusChanges.forEach(h => {
    if (h.new_status === 'approved') {
      totalReviewed++;
      totalApproved++;
    } else if (h.new_status === 'REJECTED' || h.new_status === 'rejected') {
      totalReviewed++;
    }
  });
`;

content = content.replace(getScanStatsRegex, replacement);

// Add supabase import if not present
if (!content.includes('import { supabase }')) {
  content = content.replace("import mongoose from 'mongoose';", "import mongoose from 'mongoose';\nimport { supabase } from '../config/supabase';");
}

fs.writeFileSync(apiPath, content, 'utf8');
console.log('Cleaned api.ts');
