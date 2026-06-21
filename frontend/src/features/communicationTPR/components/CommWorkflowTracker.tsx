import React from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';

export type CommPhase = 'new_arrival' | 'under_communication' | 'ready_for_head_review' | 'concluded';

interface Props {
  currentPhase: CommPhase;
}

const PHASES = [
  { id: 'new_arrival', label: 'New Arrival' },
  { id: 'under_communication', label: 'Communication' },
  { id: 'ready_for_head_review', label: 'Head Review' },
  { id: 'concluded', label: 'Concluded' }
];

export function CommWorkflowTracker({ currentPhase }: Props) {
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        {/* Active Line - Green theme */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-500"
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
                  ${isCompleted ? 'border-green-500 text-green-500' : ''}
                  ${isCurrent ? 'border-green-500 text-white bg-green-500 ring-4 ring-green-100' : ''}
                  ${!isCompleted && !isCurrent ? 'border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}
              </div>
              
              <span className={`text-xs font-bold whitespace-nowrap absolute -bottom-6
                ${isCurrent ? 'text-green-800' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
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
