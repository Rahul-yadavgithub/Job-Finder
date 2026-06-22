'use client';

import React, { useEffect, useState } from 'react';
import { followUpApi } from '../services/followup.api';
import { FollowUp } from '../types/followup';
import { FollowUpCalendar } from '../components/FollowUpCalendar';
import { CreateFollowUpModal } from '../components/CreateFollowUpModal';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Plus, CalendarDays } from 'lucide-react';

export function FollowUpCalendarPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await followUpApi.getMyFollowUps();
      if (res.success) setFollowUps(res.data);
    } catch (err) {
      setError('Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchFollowUps} />;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <CalendarDays size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <CalendarDays size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Follow-up Calendar</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Manage and view all your assigned follow-ups. Keep your outreach schedule organized.
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-xl bg-white text-[#1b4376] px-5 py-3 text-sm font-bold shadow-lg hover:bg-blue-50 transition-colors border border-white/20"
            >
              <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Schedule Follow-up
            </button>
          </div>
        </div>
      </div>

      <FollowUpCalendar followUps={followUps} onStatusChange={fetchFollowUps} />
      
      <CreateFollowUpModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchFollowUps} 
      />
    </div>
  );
}
