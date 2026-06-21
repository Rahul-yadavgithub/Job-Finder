const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.next' || file === '.git') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/aksv4/Desktop/Job-Finder');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('Hamirpur, Himachal Pradesh (India)')) {
        content = content.replace(/Hamirpur, Himachal Pradesh \(India\)/g, 'Hamirpur, Himachal Pradesh (India) - 177 005');
        changed = true;
    }
    
    if (content.includes('हमीरपुर, हिमाचल प्रदेश (भारत)')) {
        content = content.replace(/हमीरपुर, हिमाचल प्रदेश \(भारत\)/g, 'हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
}
