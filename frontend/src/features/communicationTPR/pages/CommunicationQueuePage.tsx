'use client';

import React, { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, XCircle, FileText, ChevronRight, RotateCcw, BarChart3, Activity } from 'lucide-react';
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

  const pipelineCards = [
    { id: 'pending_review', title: 'Pending Review', description: 'Awaiting initial validation', count: stats?.pending_review || 0, icon: Clock, gradient: 'from-[#1e3c72] to-[#2a5298]', shadow: 'shadow-blue-900/20' },
    { id: 'draft', title: 'Drafting', description: 'Brochure currently in progress', count: stats?.draft || 0, icon: FileText, gradient: 'from-[#4b6cb7] to-[#182848]', shadow: 'shadow-indigo-900/20' },
    { id: 'approved', title: 'Awaiting Response', description: 'Sent to company for approval', count: stats?.approved || 0, icon: Send, gradient: 'from-[#0f2027] to-[#203a43]', shadow: 'shadow-slate-900/20' },
  ];

  const resolutionCards = [
    { id: 'completed', title: 'Successfully Completed', count: stats?.completed || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'rejected', title: 'Rejected Requests', count: stats?.rejected || 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { id: 'reverted', title: 'Reverted / Need Action', count: stats?.reverted || 0, icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  ];

  const totalActive = (stats?.pending_review || 0) + (stats?.draft || 0) + (stats?.approved || 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Activity size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <BarChart3 size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Communication Queue</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Global overview of brochure generation and official communication requests. Monitor the pipeline, track drafts, and review resolutions in real-time.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 min-w-[200px]">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Active Pipeline Volume</p>
            <p className="text-4xl font-black">{totalActive}</p>
          </div>
        </div>
      </div>

      {/* Active Pipeline Stages */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Active Pipeline Stages <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{pipelineCards.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {pipelineCards.map((card, index) => (
            <Link
              key={card.id}
              href={`/communication-tpr/requests/${card.id}`}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-lg ${card.shadow} hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[200px] border border-white/10`}
            >
              {/* Decorative Background Icon */}
              <card.icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-5 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/50">Stage 0{index + 1}</div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                <p className="text-xs text-white/70 font-medium">{card.description}</p>
              </div>
              
              <div className="relative z-10 flex items-end justify-between mt-4">
                <p className="text-4xl font-black text-white">{card.count}</p>
                <div className="flex items-center gap-1 text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                  Open Queue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Resolutions & Outcomes */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Resolutions & Outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {resolutionCards.map((card) => (
            <Link
              key={card.id}
              href={`/communication-tpr/requests/${card.id}`}
              className={`rounded-2xl bg-white p-5 border shadow-sm hover:shadow-md transition-all duration-300 group hover:border-gray-300 flex items-center justify-between ${card.border}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-0.5">{card.title}</h3>
                  <div className="text-xs font-bold text-gray-400 flex items-center group-hover:text-gray-600 transition-colors">
                    View Records <ChevronRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">{card.count}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
