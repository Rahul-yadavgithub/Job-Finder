const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not using glob package to keep it simple, I'll just use the list

const filesToUpdate = [
    "src/app/history/page.tsx",
    "src/app/sync/page.tsx",
    "src/app/sources/page.tsx",
    "src/app/scan-history/[scanId]/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/companies/page.tsx",
    "src/app/api-config/page.tsx",
    "src/features/communicationTPR/components/Layout.tsx"
];

for (const file of filesToUpdate) {
    const fullPath = path.join('c:/Users/aksv4/Desktop/Job-Finder/frontend', file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/max-w-7xl mx-auto/g, 'w-full max-w-none');
        content = content.replace(/mx-auto max-w-7xl/g, 'w-full max-w-none');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
}
