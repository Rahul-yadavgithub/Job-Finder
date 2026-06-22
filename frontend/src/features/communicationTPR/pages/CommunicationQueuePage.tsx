'use client';

import React, { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, XCircle, FileText, ChevronRight, RotateCcw } from 'lucide-react';
import { requestApi } from '../services/request.api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import Link from 'next/link';

export function CommunicationQueuePage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requestApi.getQueueCounts();
      if (res.success) setStats(res.data);
    } catch (err) {
      setError('Failed to load queue statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh on window focus
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  if (loading && !stats) return <LoadingState />;
  if (error && !stats) return <ErrorState message={error} onRetry={fetchStats} />;

  const cards = [
    { id: 'pending_review', title: 'Pending Review', count: stats?.pending_review || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-t-amber-500' },
    { id: 'draft', title: 'Drafts', count: stats?.draft || 0, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-t-slate-500' },
    { id: 'approved', title: 'Waiting Response', count: stats?.approved || 0, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-t-blue-500' },
    { id: 'rejected', title: 'Rejected', count: stats?.rejected || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-t-red-500' },
    { id: 'completed', title: 'Completed', count: stats?.completed || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-t-green-500' },
    { id: 'reverted', title: 'Reverted', count: stats?.reverted || 0, icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-t-purple-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
            <Send className="w-8 h-8 text-[#1b4376]" />
            Communication Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A global view of all brochure and official communication requests made to the Head team.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/communication-tpr/requests/${card.id}`}
            className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 border-t-[4px] ${card.border} hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between h-[180px]`}
          >
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${card.color}`}>{card.title}</h3>
              <p className="text-4xl font-black text-gray-900">{card.count}</p>
            </div>
            
            <div className={`absolute bottom-6 right-6 flex items-center gap-1 text-sm font-bold opacity-80 group-hover:opacity-100 transition-opacity ${card.color}`}>
              View Queue <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
