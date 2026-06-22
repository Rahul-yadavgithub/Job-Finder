const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../../frontend1/src/app/(portal)/admin/companies/[companyId]/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf-8');

// 1. Add Plus icon to imports
pageContent = pageContent.replace(
  "import { Building2, MapPin, Mail, Phone, Calendar, ArrowLeft, Clock, History, ExternalLink, Activity, CheckCircle2 } from 'lucide-react';",
  "import { Building2, MapPin, Mail, Phone, Calendar, ArrowLeft, Clock, History, ExternalLink, Activity, CheckCircle2, Plus } from 'lucide-react';"
);

// 2. Add state and handlers to page.tsx
const stateInjection = `  const [error, setError] = useState<string | null>(null);
  
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [isAddingStage, setIsAddingStage] = useState(false);

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    setIsAddingStage(true);
    try {
      const { adminPost } = await import('@/lib/admin/api');
      await adminPost(\`/companies/\${companyId}/workflows/custom\`, { stageName: newStageName.trim() });
      setNewStageName('');
      setShowAddStage(false);
      window.location.reload();
    } catch(err) {
      alert('Failed to add custom stage');
    } finally {
      setIsAddingStage(false);
    }
  };`;

pageContent = pageContent.replace(
  "  const [error, setError] = useState<string | null>(null);",
  stateInjection
);

// 3. Update the Activity Timeline header in page.tsx
const oldHeader = `<div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
              </div>
            </div>`;

const newHeader = `<div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
              </div>
              
              {getLifecyclePhase() !== 'completed' && getLifecyclePhase() !== 'closed' && (
                <div className="relative">
                  <button 
                    onClick={() => setShowAddStage(!showAddStage)}
                    className="text-xs font-bold text-[#1b4376] bg-white hover:bg-blue-50 border border-indigo-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus size={14} /> Add Custom Stage
                  </button>
                  
                  {showAddStage && (
                    <div className="absolute top-10 right-0 w-72 bg-white border border-gray-200 shadow-2xl rounded-xl p-5 z-50 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">New Workflow Stage</h4>
                      <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">Add a custom premium step between Brochure and JNF (e.g. "Invitation Letter").</p>
                      <input 
                        type="text" 
                        placeholder="e.g. Invitation Letter" 
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1b4376] bg-gray-50"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddStage(false)} className="text-xs font-bold px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                        <button 
                          onClick={handleAddStage}
                          disabled={isAddingStage || !newStageName.trim()}
                          className="text-xs font-bold px-4 py-2 bg-[#1b4376] text-white rounded-md hover:bg-[#15335b] disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {isAddingStage ? 'Adding...' : 'Add Stage'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>`;

pageContent = pageContent.replace(oldHeader, newHeader);

// 4. Update the tracker container in page.tsx to add the faded boundary line
const oldTrackerContainer = `<div className="mb-6">
                <WorkflowProgressTracker companyId={company.id} currentPhase={getLifecyclePhase() as any} />
              </div>`;

const newTrackerContainer = `<div className="mb-8">
                <div className="bg-gray-50/40 p-8 rounded-2xl border border-gray-100 shadow-inner">
                  <WorkflowProgressTracker companyId={company.id} currentPhase={getLifecyclePhase() as any} />
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-8 opacity-50">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-3/4"></div>
              </div>`;

pageContent = pageContent.replace(oldTrackerContainer, newTrackerContainer);

fs.writeFileSync(pagePath, pageContent, 'utf-8');

// Now clean up WorkflowProgressTracker.tsx by removing its Add Custom Stage UI
const trackerPath = path.join(__dirname, '../../frontend1/src/components/companies/WorkflowProgressTracker.tsx');
let trackerContent = fs.readFileSync(trackerPath, 'utf-8');

// Strip out the states
trackerContent = trackerContent.replace(/  const \[showAddStage, setShowAddStage\] = useState\(false\);\n  const \[newStageName, setNewStageName\] = useState\(''\);\n  const \[isAdding, setIsAdding\] = useState\(false\);\n/g, '');

// Strip out handleAddStage
trackerContent = trackerContent.replace(/  const handleAddStage = async \(\) => \{[\s\S]*?  \};\n/g, '');

// Strip out the button from the JSX return
const oldReturnUi = `<div className="w-full relative">
      <div className="flex justify-end mb-8 relative">
        {currentPhase !== 'completed' && currentPhase !== 'closed' && (
          <button 
            onClick={() => setShowAddStage(!showAddStage)}
            className="text-xs font-bold text-[#1b4376] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> Add Custom Stage
          </button>
        )}
        
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

const newReturnUi = `<div className="w-full relative">
      <div className="flex items-center justify-between relative px-2">`;

trackerContent = trackerContent.replace(oldReturnUi, newReturnUi);

fs.writeFileSync(trackerPath, trackerContent, 'utf-8');

console.log('UI updated successfully!');
