import React, { useState } from 'react';
import { adminGet, adminPatch } from '@/lib/admin/api';
import { CheckCircle2, CircleDashed, ArrowRight, Loader2, Play } from 'lucide-react';

interface Workflow {
  workflow_type: string;
  display_name: string;
  status: string;
  allowed_states: string[];
  updated_at: string;
}

interface Props {
  assignmentId: string;
  workflow: Workflow;
  onUpdate: () => void;
}

export function WorkflowCard({ assignmentId, workflow, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const currentIndex = workflow.allowed_states.indexOf(workflow.status);
  const nextState = currentIndex >= 0 && currentIndex < workflow.allowed_states.length - 1 
    ? workflow.allowed_states[currentIndex + 1] 
    : null;

  const handleTransition = async () => {
    if (!nextState) return;
    setLoading(true);
    try {
      await adminPatch(`/workflow/${assignmentId}/${workflow.workflow_type}`, {
        new_status: nextState,
        notes: notes || undefined
      });
      setNotes('');
      onUpdate();
    } catch (error) {
      console.error('Failed to transition workflow', error);
      alert('Failed to update workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatState = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-gray-900 text-sm tracking-wide uppercase">{workflow.display_name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              currentIndex === workflow.allowed_states.length - 1 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-[#15335b]'
            }`}>
              {formatState(workflow.status)}
            </span>
          </div>
        </div>
        {currentIndex === workflow.allowed_states.length - 1 ? (
          <div className="text-green-500 bg-green-50 p-2 rounded-full">
            <CheckCircle2 size={20} />
          </div>
        ) : (
          <div className="text-indigo-400 bg-blue-50 p-2 rounded-full">
            <CircleDashed size={20} />
          </div>
        )}
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center gap-1 mb-4">
        {workflow.allowed_states.map((state, idx) => (
          <div key={state} className="flex-1 h-1.5 rounded-full" 
            style={{ backgroundColor: idx <= currentIndex ? '#4f46e5' : '#e5e7eb' }} 
            title={formatState(state)}
          />
        ))}
      </div>

      {/* Action Area */}
      {nextState && (
        <div className="border-t border-gray-100 pt-3 mt-1">
          <input 
            type="text" 
            placeholder="Optional notes for timeline..."
            className="w-full text-sm p-2 mb-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-indigo-400 outline-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button 
            onClick={handleTransition}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#15335b] font-bold text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} />}
            Mark as {formatState(nextState)}
          </button>
        </div>
      )}
    </div>
  );
}
