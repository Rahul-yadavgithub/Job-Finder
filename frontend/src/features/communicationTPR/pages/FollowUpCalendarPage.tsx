'use client';

import React, { useEffect, useState } from 'react';
import { followUpApi } from '../services/followup.api';
import { FollowUp } from '../types/followup';
import { FollowUpCalendar } from '../components/FollowUpCalendar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export function FollowUpCalendarPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      </div>

      <FollowUpCalendar followUps={followUps} onStatusChange={fetchFollowUps} />
    </div>
  );
}
