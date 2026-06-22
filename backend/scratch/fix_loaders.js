const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend1/src/app/(portal)/admin/tasks/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add executingAction state
content = content.replace(
  "const [executingTask, setExecutingTask] = useState<string | null>(null);",
  "const [executingTask, setExecutingTask] = useState<string | null>(null);\n  const [executingAction, setExecutingAction] = useState<string | null>(null);"
);

// handleExecute
content = content.replace(
  /const handleExecute = async \(taskId: string, newStatus: string, notes: string = ''\) => \{\n    setExecutingTask\(taskId\);/g,
  `const handleExecute = async (taskId: string, newStatus: string, notes: string = '') => {
    setExecutingTask(taskId);
    setExecutingAction(newStatus === 'in_progress' ? 'start' : newStatus === 'waiting_response' ? 'send' : 'complete');`
);

// handleDeleteTask
content = content.replace(
  /const handleDeleteTask = async \(taskId: string\) => \{\n    if \(!confirm\('Are you sure you want to delete this task\?'\)\) return;\n    setExecutingTask\(taskId\);/g,
  `const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setExecutingTask(taskId);
    setExecutingAction('delete');`
);

// handleConfirmSend
content = content.replace(
  /const handleConfirmSend = async \(\) => \{\n    if \(!confirmSendReq\) return;\n    setExecutingTask\(confirmSendReq\.id\);/g,
  `const handleConfirmSend = async () => {
    if (!confirmSendReq) return;
    setExecutingTask(confirmSendReq.id);
    setExecutingAction('send');`
);

// submitStaffResponse
content = content.replace(
  /const submitStaffResponse = async \(id: string, outcome: string, notes: string\) => \{\n    setExecutingTask\(id\);/g,
  `const submitStaffResponse = async (id: string, outcome: string, notes: string) => {
    setExecutingTask(id);
    setExecutingAction(outcome);`
);

// handleCompleteSubmit
content = content.replace(
  /const handleCompleteSubmit = async \(\) => \{\n    if \(!completeModal\) return;\n    const \{ id, type \} = completeModal;\n    \n    setExecutingTask\(id\);/g,
  `const handleCompleteSubmit = async () => {
    if (!completeModal) return;
    const { id, type } = completeModal;
    
    setExecutingTask(id);
    setExecutingAction('complete');`
);


// Clear executingAction on finally
content = content.replace(/setExecutingTask\(null\);/g, "setExecutingTask(null);\n      setExecutingAction(null);");


// Replace Loaders
// 1. Admin Task Start Working
content = content.replace(
  "{executingTask === task.id ? <Loader2 size={16} className=\"animate-spin\" /> : <ArrowRight size={16} />}",
  "{executingTask === task.id && executingAction === 'start' ? <Loader2 size={16} className=\"animate-spin\" /> : <ArrowRight size={16} />}"
);
content = content.replace(
  "{executingTask === task.id ? <Loader2 size={16} className=\"animate-spin\" /> : <ArrowRight size={16} />}", // for section 2 if it existed, but start is only section 1
  "{executingTask === task.id && executingAction === 'start' ? <Loader2 size={16} className=\"animate-spin\" /> : <ArrowRight size={16} />}"
);

// 2. Admin Task Mark as Sent
content = content.replace(
  "{executingTask === task.id ? <Loader2 size={16} className=\"animate-spin\" /> : <UploadCloud size={16} />} Mark as Sent",
  "{executingTask === task.id && executingAction === 'send' ? <Loader2 size={16} className=\"animate-spin\" /> : <UploadCloud size={16} />} Mark as Sent"
);

// 3. Admin Task Mark as Completed
content = content.replace(
  "{executingTask === task.id ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                      Mark as Completed",
  "{executingTask === task.id && executingAction === 'complete' ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                      Mark as Completed"
);
content = content.replace(
  "{executingTask === task.id ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                      Mark as Completed",
  "{executingTask === task.id && executingAction === 'complete' ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                      Mark as Completed"
);


// 4. Staff Request Mark Sent (Waiting Response)
content = content.replace(
  "{executingTask === req.id ? <Loader2 size={16} className=\"animate-spin\" /> : <Check size={16} />}\n                      Mark Sent",
  "{executingTask === req.id && executingAction === 'send' ? <Loader2 size={16} className=\"animate-spin\" /> : <Check size={16} />}\n                      Mark Sent"
);

// 5. Staff Request Mark as Completed
content = content.replace(
  "{executingTask === req.id ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                        Mark as Completed",
  "{executingTask === req.id && executingAction === 'complete' ? <Loader2 size={16} className=\"animate-spin\" /> : <CheckCircle2 size={16} />}\n                        Mark as Completed"
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Update complete!');
