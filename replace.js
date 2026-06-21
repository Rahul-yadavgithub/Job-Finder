const fs = require('fs');
const path = require('path');

const filesToUpdateFrontend = [
    "src/app/history/page.tsx",
    "src/app/sync/page.tsx",
    "src/app/sources/page.tsx",
    "src/app/scan-history/[scanId]/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/companies/page.tsx",
    "src/app/api-config/page.tsx",
    "src/features/communicationTPR/components/Layout.tsx"
];

const filesToUpdateFrontend1 = [
    "src/app/(portal)/admin/requests/page.tsx",
    "src/app/(portal)/admin/people/page.tsx",
    "src/app/(portal)/admin/drives/page.tsx",
    "src/app/(portal)/admin/dashboard/page.tsx",
    "src/app/(portal)/admin/companies/page.tsx"
];

for (const file of filesToUpdateFrontend) {
    const fullPath = path.join('c:/Users/aksv4/Desktop/Job-Finder/frontend', file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/max-w-7xl mx-auto/g, 'w-full max-w-none');
        content = content.replace(/mx-auto max-w-7xl/g, 'w-full max-w-none');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated frontend ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
}

for (const file of filesToUpdateFrontend1) {
    const fullPath = path.join('c:/Users/aksv4/Desktop/Job-Finder/frontend1', file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/max-w-7xl mx-auto/g, 'w-full max-w-none');
        content = content.replace(/mx-auto max-w-7xl/g, 'w-full max-w-none');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated frontend1 ${file}`);
    } else {
        console.log(`Not found: ${file}`);
    }
}
