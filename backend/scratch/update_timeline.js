const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend1/src/components/companies/WorkflowProgressTracker.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove static PHASES definition and put it inside the component (or dynamically generate it)
const oldPhases = `const PHASES = [
  { id: 'interested', label: 'Interested' },
  { id: 'under_communication', label: 'Communication' },
  { id: 'ready_for_head_review', label: 'Head Review' },
  { id: 'brochure_acknowledged', label: 'Brochure Ack' },
  { id: 'jnf_acknowledged', label: 'JNF Ack' },
  { id: 'database_acknowledged', label: 'Database Ack' },
  { id: 'completed', label: 'Completed' }
];`;

content = content.replace(oldPhases, "");

// 2. Add PlusIcon to imports
content = content.replace(
  "import { CheckCircle2, CircleDot } from 'lucide-react';",
  "import { CheckCircle2, CircleDot, Plus } from 'lucide-react';"
);

// 3. Update the component body to generate PHASES dynamically
const oldComponentBodyStart = `export function WorkflowProgressTracker({ companyId, currentPhase }: Props) {
  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {`;

const newComponentBodyStart = `export function WorkflowProgressTracker({ companyId, currentPhase }: Props) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchWorkflows = () => {
    if (companyId) {
      adminGet<{ data: any[] }>(\`/companies/\${companyId}/workflows\`)
        .then(res => {
          if (res.data) setWorkflows(res.data);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [companyId]);

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    setIsAdding(true);
    try {
      const { adminPost } = await import('@/lib/admin/api');
      await adminPost(\`/companies/\${companyId}/workflows/custom\`, { stageName: newStageName.trim() });
      setNewStageName('');
      setShowAddStage(false);
      fetchWorkflows();
      // Need a way to notify parent to refresh timeline events, but we can rely on polling or just show it in the tracker for now
      window.location.reload(); // Simple refresh to show in timeline as well
    } catch(err) {
      alert('Failed to add custom stage');
    } finally {
      setIsAdding(false);
    }
  };
`;

content = content.replace(oldComponentBodyStart, newComponentBodyStart);

content = content.replace(
  /  useEffect\(\(\) => \{\n    if \(companyId\) \{\n      adminGet<\{ data: any\[\] \}>\(\`\/companies\/\$\{companyId\}\/workflows\`\)\n        \.then\(res => \{\n          if \(res\.data\) setWorkflows\(res\.data\);\n        \}\)\n        \.catch\(\(\) => \{\}\);\n    \}\n  \}, \[companyId\]\);/g,
  ""
);

// 4. Calculate dynamic activeIndex and PHASES array
const oldCalculations = `  // Calculate dynamic index based on rules
  let activeIndex = 0;
  
  if (currentPhase !== 'interested') activeIndex = 1; // Communication
  if (currentPhase === 'ready_for_head_review' || currentPhase === 'completed' || currentPhase === 'transferred_to_head' || currentPhase === 'recruitment_in_progress') activeIndex = 2; // Head Review

  const getWorkflowProgress = (type: string) => {
    const wf = workflows.find(w => w.workflow_type === type);
    if (!wf) return 0;
    const status = wf.status.toUpperCase();
    if (['ACKNOWLEDGED', 'COMPLETED', 'RECEIVED'].includes(status)) return 1;
    if (['IN_PROGRESS', 'SENT_TO_MARK', 'WAITING_RESPONSE', 'SENT', 'REQUESTED', 'PREPARED'].includes(status)) return 0.5;
    return 0; // Default fallback to 0 for initial states like PENDING or NOT_STARTED
  };

  const brochureProg = getWorkflowProgress('brochure');
  if (brochureProg > 0) activeIndex = Math.max(activeIndex, 2 + brochureProg);

  const jnfProg = getWorkflowProgress('jnf');
  if (jnfProg > 0 && brochureProg === 1) activeIndex = Math.max(activeIndex, 3 + jnfProg);

  const dbProg = getWorkflowProgress('database');
  if (dbProg > 0 && jnfProg === 1) activeIndex = Math.max(activeIndex, 4 + dbProg);

  const driveProg = getWorkflowProgress('drive');
  if ((driveProg > 0 && dbProg === 1) || currentPhase === 'completed') {
    if (currentPhase === 'completed' || driveProg === 1) activeIndex = 6;
    else activeIndex = Math.max(activeIndex, 5 + driveProg);
  }`;

const newCalculations = `  const getWorkflowProgress = (type: string) => {
    const wf = workflows.find(w => w.workflow_type === type);
    if (!wf) return 0;
    const status = wf.status.toUpperCase();
    if (['ACKNOWLEDGED', 'COMPLETED', 'RECEIVED'].includes(status)) return 1;
    if (['IN_PROGRESS', 'SENT_TO_MARK', 'WAITING_RESPONSE', 'SENT', 'REQUESTED', 'PREPARED'].includes(status)) return 0.5;
    return 0;
  };

  // Build dynamic PHASES array based on existing workflows
  const basePhases = [{ id: 'interested', label: 'Interested' }];
  
  const brochureProg = getWorkflowProgress('brochure');
  basePhases.push({ id: 'brochure', label: 'Brochure Ack' });

  // Add any custom workflows that are NOT standard
  const standardTypes = ['brochure', 'jnf', 'database', 'drive'];
  const customWorkflows = workflows.filter(w => !standardTypes.includes(w.workflow_type));
  
  customWorkflows.forEach(cw => {
    basePhases.push({ id: cw.workflow_type, label: cw.display_name });
  });

  const jnfProg = getWorkflowProgress('jnf');
  basePhases.push({ id: 'jnf', label: 'JNF Ack' });

  const dbProg = getWorkflowProgress('database');
  basePhases.push({ id: 'database', label: 'Database Ack' });

  const driveProg = getWorkflowProgress('drive');
  basePhases.push({ id: 'completed', label: 'Completed' });

  const PHASES = basePhases;

  // Calculate dynamic activeIndex
  let activeIndex = 0;
  
  if (currentPhase !== 'interested') {
    activeIndex = 1; // Passed Interested, now at Brochure (or custom)
  }

  let currentIndexTracker = 1;

  if (brochureProg > 0) {
    activeIndex = Math.max(activeIndex, currentIndexTracker + brochureProg);
  }
  currentIndexTracker++;

  // Custom workflows progress
  customWorkflows.forEach(cw => {
    const prog = getWorkflowProgress(cw.workflow_type);
    if (prog > 0 && brochureProg === 1) {
       activeIndex = Math.max(activeIndex, currentIndexTracker + prog);
    }
    currentIndexTracker++;
  });

  if (jnfProg > 0 && brochureProg === 1) {
    activeIndex = Math.max(activeIndex, currentIndexTracker + jnfProg);
  }
  currentIndexTracker++;

  if (dbProg > 0 && jnfProg === 1) {
    activeIndex = Math.max(activeIndex, currentIndexTracker + dbProg);
  }
  currentIndexTracker++;

  if ((driveProg > 0 && dbProg === 1) || currentPhase === 'completed') {
    if (currentPhase === 'completed' || driveProg === 1) activeIndex = PHASES.length - 1;
    else activeIndex = Math.max(activeIndex, currentIndexTracker + driveProg);
  }`;

content = content.replace(oldCalculations, newCalculations);

// 5. Add "Add Stage" button UI inside return
const oldReturn = `<div className="w-full">
      <div className="flex items-center justify-between relative">`;

const newReturn = `<div className="w-full relative">
      <div className="flex justify-end mb-8 relative">
        <button 
          onClick={() => setShowAddStage(!showAddStage)}
          className="text-xs font-bold text-[#1b4376] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> Add Custom Stage
        </button>
        
        {showAddStage && (
          <div className="absolute top-8 right-0 w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-gray-900 mb-2">New Workflow Stage</h4>
            <p className="text-xs text-gray-500 mb-3">Add a custom step between Brochure and JNF (e.g. "Invitation Letter").</p>
            <input 
              type="text" 
              placeholder="Stage Name" 
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddStage(false)} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
              <button 
                onClick={handleAddStage}
                disabled={isAdding || !newStageName.trim()}
                className="text-xs px-3 py-1.5 bg-[#1b4376] text-white rounded-md hover:bg-[#15335b] disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Add Stage'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between relative">`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Frontend timeline updated!');
