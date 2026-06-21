import React, { useEffect, useState } from 'react';
import { adminGet, adminPost } from '@/lib/admin/api';
import { Briefcase, Send, Users, ChevronDown, Loader2, CheckCircle2, Clock } from 'lucide-react';

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
        if (cwRes.data) {
          const filtered = cwRes.data.filter((c: any) => c.role !== 'head' && !c.is_super_admin);
          setCoworkers(filtered);
        }
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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-200">
      <div className="px-8 py-5 bg-gray-50/80 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Briefcase size={20} className="text-[#1b4376]" />
          </div>
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">WORKFLOW ACTION CENTER</h2>
        </div>
        <span className="text-xs font-bold text-[#15335b] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-indigo-200">
          Head TPO View
        </span>
      </div>

      <div className="p-8 overflow-x-auto custom-scrollbar pb-10">
        <div className="flex gap-6 min-w-max">
          {workflows.map(wf => {
            const isFinished = wf.status.toUpperCase() === 'COMPLETED' || wf.status.toUpperCase() === 'ACKNOWLEDGED' || wf.status.toUpperCase() === 'RECEIVED';
            const isWaiting = !isFinished && ['IN_PROGRESS', 'SENT_TO_MARK', 'WAITING_RESPONSE', 'SENT', 'REQUESTED', 'PREPARED'].includes(wf.status.toUpperCase());
            
            let cardClasses = 'bg-white border-gray-200 hover:shadow-md hover:border-indigo-300';
            if (isFinished) cardClasses = 'bg-green-50/30 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.15)]';
            else if (isWaiting) cardClasses = 'bg-yellow-50/50 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.15)]';

            let displayStatus = wf.status.replace(/_/g, ' ').toUpperCase();
            if (displayStatus === 'PENDING' && !isWaiting && !isFinished) {
              displayStatus = 'UNSTARTED';
            }

            return (
            <div key={wf.workflow_type} className={`w-[280px] shrink-0 rounded-xl p-5 border relative flex flex-col transition-all duration-300 group ${cardClasses}`}>
            {isFinished && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
            )}
            {isWaiting && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Loader2 size={12} className="animate-spin" /> In Progress
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 pr-8">{wf.display_name}</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium uppercase tracking-wider">Status: <span className={`${isFinished ? 'text-green-600' : isWaiting ? 'text-yellow-600' : 'text-gray-800'} font-semibold`}>{displayStatus}</span></p>
            
            <div className="mt-auto">
              {!isFinished && !isWaiting && selectedWorkflow === wf.workflow_type ? (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3 shadow-sm relative z-20">
                  <div className="text-[11px] font-bold text-[#15335b] flex items-center gap-1.5 uppercase tracking-wider">
                    <Users size={14} className="text-blue-500" /> Assign Task To
                  </div>
                  <select 
                    className="w-full text-xs p-2.5 bg-white text-gray-900 border border-indigo-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                    value={selectedCoworker}
                    onChange={(e) => setSelectedCoworker(e.target.value)}
                  >
                    <option value="" className="text-gray-500">Select TPO Staff...</option>
                    {coworkers.map(cw => (
                      <option key={cw.id} value={cw.id}>{cw.name}</option>
                    ))}
                  </select>
                  <div className="flex flex-col gap-2 pt-1">
                    <button 
                      onClick={() => handleDelegate(wf.workflow_type, `Execute ${wf.display_name}`)}
                      disabled={!selectedCoworker || isDelegating}
                      className="w-full px-3 py-2.5 text-xs font-bold text-white bg-[#1b4376] hover:bg-[#15335b] rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isDelegating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Assign
                    </button>
                    <button 
                      onClick={() => setSelectedWorkflow(null)}
                      className="w-full px-3 py-2.5 text-xs font-bold text-[#15335b] bg-white hover:bg-blue-50 border border-indigo-200 rounded-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => !isFinished && !isWaiting && setSelectedWorkflow(wf.workflow_type)}
                  disabled={isFinished || isWaiting}
                  className={`w-full py-2.5 text-xs font-bold rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 ${
                    isFinished 
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-70' 
                      : isWaiting 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200 cursor-wait'
                        : 'bg-white hover:bg-blue-50 text-[#15335b] border-indigo-200 hover:border-indigo-300'
                  }`}
                >
                  {isWaiting ? (
                    <><Clock size={14} /> Waiting for Response</>
                  ) : (
                    <><Send size={14} /> Request {wf.display_name}</>
                  )}
                </button>
              )}
            </div>
          </div>
          )})}
        </div>
      </div>
    </div>
  );
}
