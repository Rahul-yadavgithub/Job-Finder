'use client';

import React, { useEffect, useState } from 'react';
import { followUpApi } from '../services/followup.api';
import { FollowUp } from '../types/followup';
import { FollowUpCalendar } from '../components/FollowUpCalendar';
import { CreateFollowUpModal } from '../components/CreateFollowUpModal';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Plus } from 'lucide-react';

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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Follow-up Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view all your assigned follow-ups.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Schedule Follow-up
          </button>
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
