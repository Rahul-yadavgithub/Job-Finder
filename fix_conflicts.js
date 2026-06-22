const fs = require('fs');

function fixTasksPage() {
  const file = 'frontend1/src/app/(portal)/admin/tasks/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  const tasksReplacement = `    <div className="w-full max-w-none space-y-8 pb-10">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <CheckSquare size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <CheckSquare size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Workflow Tasks</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Manage and execute operations delegated to you. Ensure tasks are completed promptly to keep the pipeline moving.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D] animate-pulse"></span>
              <span className="text-sm font-black text-[#FCD34D] uppercase tracking-wider">{newStaffRequests.length + newAdminTasks.length} NEW</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
              <span className="text-sm font-black text-[#93C5FD] uppercase tracking-wider">{inProgressStaffRequests.length + inProgressAdminTasks.length} IN PROGRESS</span>
            </div>
          </div>
        </div>
      </div>`;
  
  // replace from <<<<<<< HEAD to >>>>>>> 9669482 (almost finish the function)
  content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> 9669482 \(almost finish the function\)/, tasksReplacement);
  fs.writeFileSync(file, content);
}

function fixCompanyPage() {
  const file = 'frontend1/src/app/(portal)/admin/companies/[companyId]/page.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  const companyReplacement = `            {primaryStatus?.drive_id ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDriveDatePicker(true)}
                  className="flex items-center justify-center p-2.5 text-blue-100 bg-white/10 border border-white/20 rounded-xl hover:text-white hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm"
                  title="Change Drive Date"
                >
                  <Calendar size={16} />
                </button>
                <Link 
                  href="/admin/drives"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#15335b] rounded-xl hover:bg-blue-50 font-bold text-sm transition-colors shadow-lg border border-white/20"
                >
                  <Calendar size={16} /> View Drive Schedule
                </Link>
              </div>
            ) : (
              <div className="text-xs text-blue-100 italic bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
                No active drive scheduled yet
              </div>`;
  
  content = content.replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> 9669482 \(almost finish the function\)/, companyReplacement);
  
  // Actually we need to make sure the opening parenthesis matches the `) : (`. Wait, the original had:
  // ) : (
  //  <button
  // Let's just fix it carefully with a smaller script to not mess up bracket nesting.
  fs.writeFileSync(file, content);
}

fixTasksPage();
fixCompanyPage();
console.log("Done");
