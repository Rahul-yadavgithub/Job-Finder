'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, Clock, FileText, Send, XCircle, CheckCircle2, RotateCcw, Building2 } from 'lucide-react';
import { requestApi } from '../services/request.api';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { RevertModal } from '../components/RevertModal';

interface QueueStatusListViewProps {
  status: string;
}

export function QueueStatusListView({ status }: QueueStatusListViewProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requestApi.getRequestsByQueueStatus(status);
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [status]);

  const getStatusConfig = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'completed': return { icon: CheckCircle2, title: 'Completed Queue', subtitle: 'Brochure process fully completed for these companies.', badgeBg: 'bg-emerald-500', badgeText: 'text-white', border: 'border-emerald-500' };
      case 'rejected': return { icon: XCircle, title: 'Rejected Queue', subtitle: 'Companies rejected by TPO staff. Review notes and revert to Base TPR if needed.', badgeBg: 'bg-rose-500', badgeText: 'text-white', border: 'border-rose-500' };
      case 'approved': return { icon: Send, title: 'Waiting Response', subtitle: 'Companies awaiting response from TPO staff after brochure email was sent.', badgeBg: 'bg-blue-500', badgeText: 'text-white', border: 'border-blue-500' };
      case 'draft': return { icon: FileText, title: 'Drafts Queue', subtitle: 'Saved drafts not yet submitted.', badgeBg: 'bg-slate-500', badgeText: 'text-white', border: 'border-slate-500' };
      case 'pending_review': return { icon: Clock, title: 'Pending Review', subtitle: 'Emails composed but not yet submitted for review.', badgeBg: 'bg-amber-500', badgeText: 'text-white', border: 'border-amber-500' };
      case 'reverted': return { icon: RotateCcw, title: 'Reverted Queue', subtitle: 'Companies reverted to Base TPR for follow-up.', badgeBg: 'bg-purple-500', badgeText: 'text-white', border: 'border-purple-500' };
      default: return { icon: Clock, title: 'Unknown Queue', subtitle: '', badgeBg: 'bg-gray-500', badgeText: 'text-white', border: 'border-gray-500' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const filteredRequests = requests.filter(r =>
    r.companies?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.companies?.hr_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (request: any) => {
    if (status === 'draft' || status === 'pending_review') {
      router.push(`/communication-tpr/requests/${request.id}/edit`);
    }
  };

  const openRevertModal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedRequestId(id);
    setIsRevertModalOpen(true);
  };

  const handleRevertConfirm = async (notes: string) => {
    if (!selectedRequestId) return;
    try {
      await requestApi.revertRequest(selectedRequestId, notes);
      setIsRevertModalOpen(false);
      setSelectedRequestId(null);
      fetchRequests();
    } catch (err) {
      console.error('Failed to revert');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Premium Deep Blue Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] pt-8 pb-32 px-6 sm:px-12 relative overflow-hidden">
        {/* Decorative background Icon */}
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Icon size={400} />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => router.push('/communication-tpr/requests')}
            className="flex items-center text-sm font-bold text-blue-200 hover:text-white mb-8 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Global Queue
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
                <Icon size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
                {config.title}
              </h1>
              <p className="text-blue-100 max-w-2xl text-base opacity-90 leading-relaxed">
                {config.subtitle}
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200" />
              <input
                type="text"
                placeholder="Search companies or HR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Overlapping the header) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 -mt-24 relative z-20">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <ErrorState message={error} onRetry={fetchRequests} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-20 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Queue is Empty</h3>
            <p className="text-gray-500">
              {searchTerm ? "No records matched your search criteria." : `There are currently no companies resting in this queue.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredRequests.map((request, idx) => (
              <div
                key={request.id}
                onClick={() => handleCardClick(request)}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
              >
                {/* Accent border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.badgeBg}`} />

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${config.badgeBg} ${config.badgeText} shadow-sm`}>
                      {config.title.replace(' Queue', '')}
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} /> {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-3">
                    <Building2 className="text-[#1b4376]" size={24} />
                    {request.companies?.company_name || 'Unknown Company'}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">HR Contact</p>
                      <p className="text-sm font-bold text-gray-800">{request.companies?.hr_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Request Type</p>
                      <p className="text-sm font-bold text-gray-800 uppercase">{request.request_type?.replace(/_/g, ' ') || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Initiated By</p>
                      <p className="text-sm font-bold text-gray-800">{request.users?.name || 'System'}</p>
                    </div>
                    {status === 'approved' && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marked Interested By</p>
                        <p className="text-sm font-bold text-gray-800">
                          {Array.isArray(request.companies?.company_status) 
                            ? request.companies.company_status[0]?.interested_by_name || 'Base TPR'
                            : request.companies?.company_status?.interested_by_name || 'Base TPR'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Specific Action/Info Areas */}
                {status === 'rejected' && request.rejection_notes && (
                  <div className="md:w-80 bg-rose-50 p-5 rounded-xl border border-rose-100 flex flex-col justify-between shrink-0">
                    <div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Rejection Note</p>
                      <p className="text-sm font-medium text-rose-900 italic">"{request.rejection_notes}"</p>
                    </div>
                    <button
                      onClick={(e) => openRevertModal(e, request.id)}
                      className="mt-4 w-full py-2.5 bg-white text-rose-600 text-xs font-black uppercase tracking-widest rounded-lg border border-rose-200 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      Revert to Base TPR
                    </button>
                  </div>
                )}

                {status === 'reverted' && (
                  <div className="md:w-80 bg-purple-50 p-5 rounded-xl border border-purple-100 shrink-0">
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Revert Note</p>
                    <p className="text-sm font-medium text-purple-900 mb-4">"{request.revert_notes || 'No notes provided.'}"</p>
                    <div className="text-xs font-bold text-purple-600 flex justify-between items-center bg-white py-2 px-3 rounded-lg border border-purple-100">
                      <span>Reverted to Base TPR</span>
                      <span>{new Date(request.reverted_at || request.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {status !== 'rejected' && status !== 'reverted' && (
                  <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity items-center pr-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1b4376]">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revert Modal */}
      {isRevertModalOpen && (
        <RevertModal
          isOpen={isRevertModalOpen}
          onClose={() => setIsRevertModalOpen(false)}
          onConfirm={handleRevertConfirm}
        />
      )}
    </div>
  );
}
