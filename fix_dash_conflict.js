const fs = require('fs');

const file = 'frontend1/src/app/(portal)/admin/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `          
          {successor ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[200px]">
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Succession Active</p>
              <p className="text-lg font-bold truncate" title={successor.name}>{successor.name}</p>
            </div>
          ) : (
            <Link href="/admin/settings/succession" className="bg-rose-500/20 backdrop-blur-md border border-rose-500/50 hover:bg-rose-500/30 transition-colors rounded-xl p-4 min-w-[200px] cursor-pointer">
              <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Succession Warning</p>
              <p className="text-sm font-bold text-white">No Successor Set</p>
            </Link>
          )}
        </div>`;

content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> 9669482 \(almost finish the function\)/, replacement);
fs.writeFileSync(file, content);
console.log("Done");
