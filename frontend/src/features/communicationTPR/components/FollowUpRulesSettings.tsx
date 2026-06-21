import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function FollowUpRulesSettings() {
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<number, any>>({});

  const { data: rules, isLoading } = useQuery({
    queryKey: ['comm-followup-rules'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/settings/followup-rules`, { withCredentials: true });
      return res.data.data;
    }
  });

  const updateRule = useMutation({
    mutationFn: async (payload: { followupNumber: number, data: any }) => {
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/settings/followup-rules/${payload.followupNumber}`, payload.data, { withCredentials: true });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comm-followup-rules'] });
      toast.success('Follow-up rule saved');
    },
    onError: () => toast.error('Failed to save rule')
  });

  const saveRule = (followupNumber: number) => {
    const existing = rules?.find((r: any) => r.followup_number === followupNumber);
    const updates = forms[followupNumber] || {};
    
    updateRule.mutate({
      followupNumber,
      data: {
        wait_days: updates.wait_days !== undefined ? parseInt(updates.wait_days) : existing?.wait_days,
        subject_template: updates.subject_template || existing?.subject_template,
        body_template: updates.body_template || existing?.body_template
      }
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h4 className="text-amber-800 font-medium">Automated Follow-ups</h4>
        <p className="text-sm text-amber-700 mt-1">
          After sending the initial email, follow-ups are auto-scheduled. Maximum follow-ups allowed: 2. 
          After 2 follow-ups, the company moves to 'Ready for Head Review'.
        </p>
      </div>

      {[1, 2].map(num => {
        const r = rules?.find((x: any) => x.followup_number === num);
        
        return (
          <div key={num} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Follow-up {num}</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Wait Time (Days)</label>
                <input 
                  type="number" 
                  className="w-20 border border-gray-300 rounded-md shadow-sm px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  defaultValue={r?.wait_days || 3}
                  onChange={(e) => setForms({...forms, [num]: {...forms[num], wait_days: e.target.value}})}
                  min={1}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Template</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  defaultValue={r?.subject_template || ''}
                  onChange={(e) => setForms({...forms, [num]: {...forms[num], subject_template: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Template</label>
                <textarea 
                  rows={4}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  defaultValue={r?.body_template || ''}
                  onChange={(e) => setForms({...forms, [num]: {...forms[num], body_template: e.target.value}})}
                />
              </div>
              
              <button 
                onClick={() => saveRule(num)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Save Rule
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
