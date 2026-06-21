'use client';

import React, { useEffect, useState } from 'react';
import { Send, Clock, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';
import { requestApi } from '../services/request.api';
import { CommunicationRequest } from '../types/request';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import Link from 'next/link';

export function CommunicationQueuePage() {
  const [requests, setRequests] = useState<CommunicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeStatusView, setActiveStatusView] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requestApi.getAllRequests();
      if (res.success) setRequests(res.data);
    } catch (err) {
      setError('Failed to load communication queue.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 ring-green-600/20' };
      case 'rejected': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 ring-red-600/20' };
      case 'sent':
      case 'waiting_response': return { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-600/20' };
      default: return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 ring-amber-600/20' };
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchQueue} />;

  // Aggregation for cards
  const summary = {
    pending: requests.filter(r => r.status.includes('pending') || r.status.includes('submitted')).length,
    drafts: requests.filter(r => r.status === 'draft').length,
    waiting: requests.filter(r => r.status === 'sent' || r.status === 'waiting_response').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  const cards = [
    { id: 'pending', title: 'Pending Review', count: summary.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'draft', title: 'Drafts', count: summary.drafts, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    { id: 'waiting', title: 'Waiting Response', count: summary.waiting, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'rejected', title: 'Rejected', count: summary.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'completed', title: 'Completed', count: summary.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  ];

  const filteredRequests = activeStatusView 
    ? requests.filter(r => {
        if (activeStatusView === 'pending') return r.status.includes('pending') || r.status.includes('submitted');
        if (activeStatusView === 'waiting') return r.status === 'sent' || r.status === 'waiting_response';
        return r.status === activeStatusView;
      })
    : [];

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

      {!activeStatusView ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setActiveStatusView(card.id)}
              className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border ${card.border} hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-black text-gray-900">{card.count}</p>
                <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="mb-6">
             <button 
                onClick={() => setActiveStatusView(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> 
                Back to Dashboard
              </button>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState 
              title="No requests found" 
              description={`There are currently no requests in the '${cards.find(c => c.id === activeStatusView)?.title}' category.`} 
            />
          ) : (
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-2xl overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="font-bold text-gray-900">{cards.find(c => c.id === activeStatusView)?.title} Requests ({filteredRequests.length})</h3>
              </div>
              <ul role="list" className="divide-y divide-gray-100">
                {filteredRequests.map((request) => {
                  const StatusIcon = getStatusConfig(request.status).icon;
                  const config = getStatusConfig(request.status);

                  return (
                    <li key={request.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 transition-colors group">
                      <div className="flex min-w-0 gap-x-4 items-center">
                        <StatusIcon className={`h-12 w-12 flex-none rounded-xl p-2.5 bg-white ring-1 ring-inset ${config.color} ring-gray-200 shadow-sm`} />
                        <div className="min-w-0 flex-auto">
                          <p className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-2 flex-wrap">
                            <Link href={`/communication-tpr/companies/${request.companyId}`}>
                              <span className="absolute inset-x-0 -top-px bottom-0" />
                              <span className="group-hover:text-blue-600 transition-colors">{request.companyName || 'Unknown Company'}</span>
                            </Link>
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold ring-1 ring-inset capitalize tracking-wide ${config.bg} ${config.color} whitespace-nowrap`}>
                              {request.status.replace(/_/g, ' ')}
                            </span>
                          </p>
                          <p className="mt-1 flex text-xs leading-5 text-gray-500 font-medium">
                            Requested {request.requestType === 'brochure' ? 'Brochure' : 'Official Communication'} by {request.requestedByName}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-x-4">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                          <p className="text-sm font-semibold leading-6 text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
