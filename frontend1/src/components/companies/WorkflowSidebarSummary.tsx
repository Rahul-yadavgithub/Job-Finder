import React, { useEffect, useState } from 'react';
import { adminGet } from '@/lib/admin/api';
import { Layers, Loader2, CheckCircle2, Clock, CircleDashed } from 'lucide-react';

interface Workflow {
  workflow_type: string;
  display_name: string;
  status: string;
  allowed_states: string[];
}

export function WorkflowSidebarSummary({ companyId }: { companyId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await adminGet<{ data: Workflow[] }>(`/companies/${companyId}/workflows`);
        if (res.data) setWorkflows(res.data);
      } catch (e) {
        console.error('Failed to load workflow summary', e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-indigo-400" size={20} />
      </div>
    );
  }

  if (workflows.length === 0) return null;

  const getStatusIcon = (workflow: Workflow) => {
    const currentIndex = workflow.allowed_states.indexOf(workflow.status);
    if (currentIndex === workflow.allowed_states.length - 1) {
      return <CheckCircle2 size={14} className="text-green-500" />;
    }
    if (currentIndex > 0) {
      return <Clock size={14} className="text-yellow-500" />;
    }
    return <CircleDashed size={14} className="text-gray-400" />;
  };

  const formatState = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Layers size={18} className="text-gray-500" />
        <h2 className="text-lg font-bold text-gray-900">Active Workflows</h2>
      </div>
      <div className="p-6 space-y-3">
        {workflows.map(wf => (
          <div key={wf.workflow_type} className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{wf.display_name}</span>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
              {getStatusIcon(wf)}
              <span className="text-xs font-semibold text-gray-900">{formatState(wf.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
