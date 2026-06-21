import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';
import { adminGet } from '@/lib/admin/api';

interface Props {
  companyId: string;
  currentPhase: string;
}

const PHASES = [
  { id: 'interested', label: 'Interested' },
  { id: 'under_communication', label: 'Communication' },
  { id: 'ready_for_head_review', label: 'Head Review' },
  { id: 'brochure_acknowledged', label: 'Brochure Ack' },
  { id: 'jnf_acknowledged', label: 'JNF Ack' },
  { id: 'database_acknowledged', label: 'Database Ack' },
  { id: 'completed', label: 'Completed' }
];

export function WorkflowProgressTracker({ companyId, currentPhase }: Props) {
  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {
    if (companyId) {
      adminGet<{ data: any[] }>(`/companies/${companyId}/workflows`)
        .then(res => {
          if (res.data) setWorkflows(res.data);
        })
        .catch(() => {});
    }
  }, [companyId]);

  if (currentPhase === 'closed') {
    return (
      <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h3 className="text-red-900 font-bold">Company Closed</h3>
          <p className="text-sm text-red-700">This company's lifecycle has ended.</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic index based on rules
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
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${(activeIndex / (PHASES.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        {PHASES.map((phase, idx) => {
          const isCompleted = idx <= Math.floor(activeIndex);
          const isCurrent = idx === Math.floor(activeIndex);

          return (
            <div key={phase.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white relative z-10
                  ${isCompleted && !isCurrent ? 'border-green-500 text-green-600' : ''}
                  ${isCurrent ? 'border-green-500 text-white bg-gradient-to-br from-green-500 to-emerald-600 ring-4 ring-green-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : ''}
                  ${!isCompleted && !isCurrent ? 'border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted && !isCurrent ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}
              </div>
              
              <span className={`text-xs font-bold whitespace-nowrap absolute -bottom-6
                ${isCurrent ? 'text-green-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
              `}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-8"></div> {/* Spacer for the absolute labels */}
    </div>
  );
}
