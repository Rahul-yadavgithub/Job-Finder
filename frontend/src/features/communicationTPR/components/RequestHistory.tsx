import React, { useEffect, useState } from 'react';
import { Send, FileText, CheckCircle2, XCircle, Clock, FileWarning } from 'lucide-react';
import { requestApi } from '../services/request.api';
import { CommunicationRequest } from '../types/request';

export function RequestHistory({ companyId }: { companyId: string }) {
  const [requests, setRequests] = useState<CommunicationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [companyId]);

  const fetchRequests = async () => {
    try {
      const res = await requestApi.getCompanyRequests(companyId);
      if (res.success) setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><div className="animate-pulse flex space-x-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></div></div>;

  if (requests.length === 0) {
    return (
      <div className="p-6 text-center">
        <Send className="mx-auto h-8 w-8 text-gray-300 mb-3" />
        <h3 className="text-sm font-medium text-gray-900">No requests</h3>
        <p className="mt-1 text-sm text-gray-500">No communication requests have been made for this company yet.</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 ring-green-600/20' };
      case 'rejected': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 ring-red-600/20' };
      case 'submitted': return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 ring-blue-600/20' };
      default: return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 ring-amber-600/20' };
    }
  };

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {requests.map((request) => {
        const StatusIcon = getStatusConfig(request.status).icon;
        const config = getStatusConfig(request.status);
        
        return (
          <li key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-x-6 py-5 px-6 hover:bg-gray-50 transition-colors">
            <div className="min-w-0">
              <div className="flex items-start gap-x-3">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {request.requestType === 'brochure' ? 'Brochure Request' : 'Official Communication Request'}
                </p>
                <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${config.bg} ${config.color}`}>
                  {request.status}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                <p className="whitespace-nowrap">
                  Requested by <span className="font-medium text-gray-900">{request.requestedByName}</span>
                </p>
                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                <p className="truncate">
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>
              {request.notes && (
                <p className="mt-2 text-sm leading-6 text-gray-600 border-l-2 border-gray-200 pl-3">
                  {request.notes}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex flex-none items-center gap-x-4">
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
