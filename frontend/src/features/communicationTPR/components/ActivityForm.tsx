import React, { useState } from 'react';
import { Phone, Mail, Globe, StickyNote, Loader2 } from 'lucide-react';
import { activityApi } from '../services/activity.api';
import { CreateActivityInput } from '../types/activity';

interface ActivityFormProps {
  companyId: string;
  onSuccess: () => void;
}

export function ActivityForm({ companyId, onSuccess }: ActivityFormProps) {
  const [activeTab, setActiveTab] = useState<CreateActivityInput['activityType']>('note');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setIsSubmitting(true);
    setError('');

    const input: CreateActivityInput = {
      activityType: activeTab,
      notes: notes.trim(),
    };

    if (['call', 'email', 'linkedin'].includes(activeTab) && outcome) {
      input.metadata = { outcome };
    }

    try {
      const res = await activityApi.createActivity(companyId, input);
      if (res.success) {
        setNotes('');
        setOutcome('');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'note', name: 'Note', icon: StickyNote },
    { id: 'call', name: 'Log Call', icon: Phone },
    { id: 'email', name: 'Log Email', icon: Mail },
    { id: 'linkedin', name: 'LinkedIn', icon: Globe },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive 
                    ? 'border-blue-500 text-[#1b4376]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 bg-gray-50/50">
        <form onSubmit={handleSubmit}>
          
          <div className="mb-3">
            <textarea
              rows={3}
              className="block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#1b4376] sm:text-sm sm:leading-6 resize-none"
              placeholder={activeTab === 'note' ? 'Write a quick note...' : `Describe the ${activeTab} details...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>

          {['call', 'email', 'linkedin'].includes(activeTab) && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Outcome:</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="block w-full max-w-xs rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#1b4376] sm:text-sm sm:leading-6"
                required
              >
                <option value="">Select outcome...</option>
                <option value="Left Voicemail">Left Voicemail</option>
                <option value="Connected">Connected</option>
                <option value="No Answer">No Answer</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Requested Follow-up">Requested Follow-up</option>
              </select>
            </div>
          )}

          {error && (
            <div className="mb-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim() || (['call', 'email', 'linkedin'].includes(activeTab) && !outcome)}
              className="inline-flex items-center justify-center rounded-lg bg-[#1b4376] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#15335b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b4376] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {activeTab === 'note' ? 'Save Note' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
