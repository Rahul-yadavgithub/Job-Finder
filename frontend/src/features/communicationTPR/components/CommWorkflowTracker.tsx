import React from 'react';
import { CheckCircle2, CircleDot, XCircle } from 'lucide-react';

export type CommPhase = 'new_arrival' | 'email_drafted' | 'tpo_staff_review' | 'completed' | 'rejected';

interface Props {
  currentPhase: CommPhase;
}

const PHASES = [
  { id: 'new_arrival', label: 'New Arrival' },
  { id: 'email_drafted', label: 'Email Drafted' },
  { id: 'tpo_staff_review', label: 'TPO Staff Review' },
  { id: 'completed', label: 'Completed' }
];

export function CommWorkflowTracker({ currentPhase }: Props) {
  const isRejected = currentPhase === 'rejected';
  
  if (isRejected) {
    return (
      <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle size={18} />
        </div>
        <div>
          <h3 className="text-red-900 font-bold">Request Rejected</h3>
          <p className="text-sm text-red-700">TPO Staff rejected the request. Please revert and try again.</p>
        </div>
      </div>
    );
  }

  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

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
          const isCompleted = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

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
