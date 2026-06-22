const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend1/src/app/(portal)/admin/tasks/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add completeTaskModal state
content = content.replace(
  "const [executingTask, setExecutingTask] = useState<string | null>(null);",
  "const [executingTask, setExecutingTask] = useState<string | null>(null);\n  const [completeModal, setCompleteModal] = useState<{ id: string, type: 'admin_task' | 'staff_request' } | null>(null);\n  const [completeNotes, setCompleteNotes] = useState('');"
);

// 2. Add handleCompleteSubmit
content = content.replace(
  "const handleArchiveTask = async (id: string) => {",
  `const handleCompleteSubmit = async () => {
    if (!completeModal) return;
    const { id, type } = completeModal;
    
    setExecutingTask(id);
    try {
      if (type === 'admin_task') {
        await adminPatch(\`/tasks/\${id}/execute\`, { status: 'completed', notes: completeNotes });
      } else {
        await adminPatch(\`/staff/requests/\${id}/archive\`, {});
        submitStaffResponse(id, 'accepted', completeNotes);
        setInProgressStaffRequests(prev => prev.filter(r => r.id !== id));
      }
      setCompleteModal(null);
      setCompleteNotes('');
      await fetchTasks();
    } catch (error) {
      console.error(error);
      alert('Failed to complete task.');
    } finally {
      setExecutingTask(null);
    }
  };

  const handleArchiveTask = async (id: string) => {`
);

// 3. Extract newAdminTasks and inProgressAdminTasks inside render
content = content.replace(
  "return (\n    <div className=\"max-w-4xl mx-auto space-y-6 pb-20\">",
  `const newAdminTasks = tasks.filter(t => t.status === 'pending');
  const inProgressAdminTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'waiting_response');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">`
);

// 4. Update Header Counts
content = content.replace(
  "{newStaffRequests.length} NEW",
  "{newStaffRequests.length + newAdminTasks.length} NEW"
);
content = content.replace(
  "{inProgressStaffRequests.length} IN PROGRESS",
  "{inProgressStaffRequests.length + inProgressAdminTasks.length} IN PROGRESS"
);

// 5. Update Head TPO Tasks Loop logic to only show if head
content = content.replace(
  "{tasks.length > 0 && (",
  "{user?.role === 'head' && tasks.length > 0 && ("
);

// 6. Tabs Header Counts
content = content.replace(
  "bg-[#FEF3C7] text-[#D97706]' : 'bg-gray-100 text-gray-500'}`}>{newStaffRequests.length}</span>",
  "bg-[#FEF3C7] text-[#D97706]' : 'bg-gray-100 text-gray-500'}`}>{newStaffRequests.length + newAdminTasks.length}</span>"
);
content = content.replace(
  "bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-gray-100 text-gray-500'}`}>{inProgressStaffRequests.length}</span>",
  "bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-gray-100 text-gray-500'}`}>{inProgressStaffRequests.length + inProgressAdminTasks.length}</span>"
);

// 7. Inject admin tasks map into SECTION 1
content = content.replace(
  "newStaffRequests.length === 0 ? (",
  "newStaffRequests.length === 0 && newAdminTasks.length === 0 ? ("
);

const newAdminTasksBlock = `
          {newAdminTasks.map(task => (
            <div key={task.id} className="bg-white rounded-r-xl border border-gray-200 border-l-4 border-l-[#D97706] shadow-sm overflow-hidden flex flex-col md:flex-row relative">
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#15335b] font-bold text-[10px] uppercase tracking-wider rounded-md border border-blue-100">
                    {task.workflow_type} Task
                  </span>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {formatDistanceToNow(new Date(task.created_at))} ago
                  </span>
                </div>
                
                <h3 className="text-[20px] font-bold text-gray-900 mb-1">{task.task_name}</h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Company: <span className="text-gray-900 font-bold">{task.company_name}</span></p>
                <p className="text-xs text-[#1b4376] font-bold bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100 mt-2">
                  Assigned by: Head TPO
                </p>
              </div>

              <div className="bg-orange-50/30 p-6 md:w-80 flex flex-col justify-center border-l border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Execute Task</p>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Action Required
                  </span>
                </div>
                
                <button 
                  onClick={() => handleExecute(task.id, 'in_progress', 'Started working on it')}
                  disabled={executingTask === task.id}
                  className="w-full py-2.5 bg-white border border-gray-200 hover:border-blue-500 hover:text-[#1b4376] text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {executingTask === task.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Start Working
                </button>
              </div>
            </div>
          ))}
`;
content = content.replace(
  "{newStaffRequests.length === 0 && newAdminTasks.length === 0 ? (",
  `{newStaffRequests.length === 0 && newAdminTasks.length === 0 ? (`
);
content = content.replace(
  "newStaffRequests.map(req => (",
  `${newAdminTasksBlock}
          {newStaffRequests.map(req => (`
);


// 8. Inject admin tasks map into SECTION 2
content = content.replace(
  "inProgressStaffRequests.length === 0 ? (",
  "inProgressStaffRequests.length === 0 && inProgressAdminTasks.length === 0 ? ("
);

const inProgressAdminTasksBlock = `
          {inProgressAdminTasks.map(task => (
            <div key={task.id} className="bg-white rounded-r-xl border border-gray-200 border-l-4 border-l-[#1D4ED8] shadow-sm overflow-hidden flex flex-col md:flex-row relative">
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#15335b] font-bold text-[10px] uppercase tracking-wider rounded-md border border-blue-100">
                    {task.workflow_type} Task
                  </span>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {formatDistanceToNow(new Date(task.created_at))} ago
                  </span>
                </div>
                
                <h3 className="text-[20px] font-bold text-gray-900 mb-1">{task.task_name}</h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Company: <span className="text-gray-900 font-bold">{task.company_name}</span></p>
              </div>

              <div className="bg-blue-50/20 p-6 md:w-80 flex flex-col justify-center border-l border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Execute Task</p>
                
                <div className="space-y-2 mt-auto">
                  {task.status === 'in_progress' && (
                    <button 
                      onClick={() => handleExecute(task.id, 'waiting_response', 'Sent to company, awaiting response')}
                      disabled={executingTask === task.id}
                      className="w-full py-2 bg-blue-50 border border-indigo-200 hover:bg-blue-100 text-[#15335b] text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {executingTask === task.id ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} Mark as Sent
                    </button>
                  )}
                  {(task.status === 'in_progress' || task.status === 'waiting_response') && (
                    <button 
                      onClick={() => setCompleteModal({ id: task.id, type: 'admin_task' })}
                      disabled={executingTask === task.id}
                      className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 shadow-lg text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {executingTask === task.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
`;

content = content.replace(
  "inProgressStaffRequests.map(req => (",
  `${inProgressAdminTasksBlock}
          {inProgressStaffRequests.map(req => (`
);

// 9. Update existing Staff Request "Mark as Completed" to use the new Complete Modal
content = content.replace(
  "onClick={() => handleArchiveTask(req.id)}",
  "onClick={() => setCompleteModal({ id: req.id, type: 'staff_request' })}"
);


// 10. Add the Complete Notes Modal at the bottom
const completeModalHtml = `
      {/* Complete Note Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-in-center border border-gray-100">
            <div className="px-6 py-4 border-b flex items-center gap-3 bg-green-50/80 border-green-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-900">
                  Mark as Completed
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Confirm completion and optionally add notes
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-white">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Add Completion Notes <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="Details for the Head TPO to read..."
                className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none shadow-inner bg-gray-50/50 placeholder:text-gray-400"
                rows={4}
                autoFocus
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setCompleteModal(null);
                  setCompleteNotes('');
                }}
                disabled={executingTask === completeModal.id}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                disabled={executingTask === completeModal.id}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl flex items-center gap-2 transition-all shadow-md bg-green-600 hover:bg-green-700 shadow-green-600/20 hover:shadow-green-600/40 disabled:opacity-50"
              >
                {executingTask === completeModal.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "    </div>\n  );\n}\n",
  `${completeModalHtml}    </div>\n  );\n}\n`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update complete!');
