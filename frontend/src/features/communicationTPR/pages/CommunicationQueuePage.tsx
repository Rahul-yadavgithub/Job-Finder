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
    switch(status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 ring-green-600/20' };
      case 'rejected': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 ring-red-600/20' };
      case 'submitted': return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-600/20' };
      default: return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 ring-amber-600/20' };
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchQueue} />;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
            <Send className="w-8 h-8 text-indigo-500" />
            Communication Queue
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A global view of all brochure and official communication requests made to the Head team.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState 
          title="Queue is empty" 
          description="No communication requests have been created yet." 
        />
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
          <ul role="list" className="divide-y divide-gray-100">
            {requests.map((request) => {
              const StatusIcon = getStatusConfig(request.status).icon;
              const config = getStatusConfig(request.status);

              return (
                <li key={request.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 transition-colors">
                  <div className="flex min-w-0 gap-x-4 items-center">
                    <StatusIcon className={`h-10 w-10 flex-none rounded-full p-2 bg-white ring-1 ring-inset ${config.color} ring-gray-200`} />
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-2">
                        <Link href={`/communication-tpr/companies/${request.companyId}`}>
                          <span className="absolute inset-x-0 -top-px bottom-0" />
                          {request.companyName || 'Unknown Company'}
                        </Link>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${config.bg} ${config.color}`}>
                          {request.status}
                        </span>
                      </p>
                      <p className="mt-1 flex text-xs leading-5 text-gray-500">
                        Requested {request.requestType === 'brochure' ? 'Brochure' : 'Official Communication'} by {request.requestedByName}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-x-4">
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <p className="text-sm leading-6 text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
