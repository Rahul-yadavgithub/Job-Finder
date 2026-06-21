import React from 'react';
import { CheckCircle2, CircleDot, XCircle } from 'lucide-react';

export type CommPhase = 'new_arrival' | 'email_drafted' | 'tpo_staff_review' | 'completed' | 'rejected';

interface Props {
  currentPhase: CommPhase;
}

export function CommWorkflowTracker({ currentPhase }: Props) {
  const isRejected = currentPhase === 'rejected';
  
  const PHASES = [
    { id: 'new_arrival', label: 'New Arrival' },
    { id: 'email_drafted', label: 'Email Drafted' },
    { id: 'tpo_staff_review', label: 'TPO Staff Review' },
    { id: 'completed', label: isRejected ? 'Rejected' : 'Completed' }
  ];

  const activeIndex = isRejected ? PHASES.length - 1 : (PHASES.findIndex(p => p.id === currentPhase) === -1 ? 0 : PHASES.findIndex(p => p.id === currentPhase));

  const themeColors = {
    line: isRejected ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-500',
    completedBorder: isRejected ? 'border-red-500' : 'border-green-500',
    completedText: isRejected ? 'text-red-600' : 'text-green-600',
    currentBorder: isRejected ? 'border-red-500' : 'border-green-500',
    currentBg: isRejected ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600',
    currentRing: isRejected ? 'ring-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'ring-green-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    currentLabel: isRejected ? 'text-red-900' : 'text-green-900'
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        {/* Active Line */}
        <div 
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r ${themeColors.line} rounded-full z-0 transition-all duration-700 ease-out`}
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
                  ${isCompleted && !isCurrent ? `${themeColors.completedBorder} ${themeColors.completedText}` : ''}
                  ${isCurrent ? `${themeColors.currentBorder} text-white bg-gradient-to-br ${themeColors.currentBg} ring-4 ${themeColors.currentRing}` : ''}
                  ${!isCompleted && !isCurrent ? 'border-gray-300 text-gray-400' : ''}
                `}
              >
                {isRejected && isCurrent ? <XCircle size={16} /> : (isCompleted && !isCurrent ? <CheckCircle2 size={16} /> : <CircleDot size={16} />)}
              </div>
              
              <span className={`text-xs font-bold whitespace-nowrap absolute -bottom-6
                ${isCurrent ? themeColors.currentLabel : isCompleted ? 'text-gray-700' : 'text-gray-400'}
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
