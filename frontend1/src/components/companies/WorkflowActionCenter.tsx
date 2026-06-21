import React, { useEffect, useState } from 'react';
import { adminGet, adminPost } from '@/lib/admin/api';
import { Briefcase, Send, Users, ChevronDown, Loader2 } from 'lucide-react';

interface Coworker {
  id: string;
  name: string;
}

interface WorkflowTask {
  workflow_type: string;
  display_name: string;
  status: string;
  allowed_states: string[];
}

interface Props {
  companyId: string;
  assignmentId: string;
  onTaskDelegated: () => void;
}

export function WorkflowActionCenter({ companyId, assignmentId, onTaskDelegated }: Props) {
  const [workflows, setWorkflows] = useState<WorkflowTask[]>([]);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [selectedCoworker, setSelectedCoworker] = useState<string>('');
  const [isDelegating, setIsDelegating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wfRes, cwRes] = await Promise.all([
          adminGet<{ data: WorkflowTask[] }>(`/companies/${companyId}/workflows`),
          adminGet<{ data: Coworker[] }>('/people/coworkers')
        ]);
        if (wfRes.data) setWorkflows(wfRes.data);
        if (cwRes.data) setCoworkers(cwRes.data);
      } catch (error) {
        console.error('Failed to load action center data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  const handleDelegate = async (workflowType: string, taskName: string) => {
    if (!selectedCoworker) return alert('Please select a coworker first.');
    setIsDelegating(true);
    try {
      await adminPost('/tasks', {
        companyId,
        assignmentId,
        workflowType,
        taskName,
        assignedTo: selectedCoworker
      });
      setSelectedWorkflow(null);
      setSelectedCoworker('');
      onTaskDelegated();
    } catch (error) {
      console.error('Delegation failed', error);
      alert('Failed to delegate task.');
    } finally {
      setIsDelegating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
  }

  return (
    <div className="bg-indigo-900 rounded-xl shadow-md overflow-hidden mb-8 border border-indigo-800">
      <div className="px-6 py-4 bg-indigo-950 flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">WORKFLOW ACTION CENTER</h2>
        </div>
        <span className="text-xs font-bold text-indigo-300 bg-indigo-900 px-3 py-1 rounded-full uppercase tracking-wider">
          Head TPO View
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflows.map(wf => (
          <div key={wf.workflow_type} className="bg-indigo-800 rounded-xl p-4 border border-indigo-700 relative flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{wf.display_name}</h3>
            <p className="text-xs text-indigo-300 mb-4 font-semibold uppercase tracking-wider">Status: {wf.status.replace(/_/g, ' ')}</p>
            
            <div className="mt-auto">
              {selectedWorkflow === wf.workflow_type ? (
                <div className="bg-white rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Users size={14} /> Assign Task To:
                  </div>
                  <select 
                    className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                    value={selectedCoworker}
                    onChange={(e) => setSelectedCoworker(e.target.value)}
                  >
                    <option value="">Select Coworker...</option>
                    {coworkers.map(cw => (
                      <option key={cw.id} value={cw.id}>{cw.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedWorkflow(null)}
                      className="flex-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDelegate(wf.workflow_type, `Execute ${wf.display_name}`)}
                      disabled={!selectedCoworker || isDelegating}
                      className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isDelegating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Assign
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setSelectedWorkflow(wf.workflow_type)}
                  className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg border border-indigo-600 hover:border-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Request {wf.display_name}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
