import React from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';

interface Props {
  currentPhase: 'interested' | 'under_communication' | 'ready_for_head_review' | 'transferred_to_head' | 'recruitment_in_progress' | 'completed' | 'closed';
}

const PHASES = [
  { id: 'interested', label: 'Interested' },
  { id: 'under_communication', label: 'Communication' },
  { id: 'ready_for_head_review', label: 'Head Review' },
  { id: 'transferred_to_head', label: 'Transferred' },
  { id: 'recruitment_in_progress', label: 'Recruiting' },
  { id: 'completed', label: 'Completed' }
];

export function WorkflowProgressTracker({ currentPhase }: Props) {
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

  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (PHASES.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={phase.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-white
                  ${isCompleted ? 'border-indigo-600 text-indigo-600' : ''}
                  ${isCurrent ? 'border-indigo-600 text-white bg-indigo-600 ring-4 ring-indigo-100' : ''}
                  ${!isCompleted && !isCurrent ? 'border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}
              </div>
              
              <span className={`text-xs font-bold whitespace-nowrap absolute -bottom-6
                ${isCurrent ? 'text-indigo-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
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
