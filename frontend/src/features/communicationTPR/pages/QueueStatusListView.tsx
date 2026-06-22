'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Clock, FileText, Send, XCircle, CheckCircle2, RotateCcw } from 'lucide-react';
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
      case 'completed': return { icon: CheckCircle2, title: 'Completed Queue', subtitle: 'Brochure process fully completed for these companies.', color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]', border: 'border-[#16A34A]' };
      case 'rejected': return { icon: XCircle, title: 'Rejected Queue', subtitle: 'Companies rejected by TPO staff. Review notes and revert to Base TPR if needed.', color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', border: 'border-[#DC2626]' };
      case 'approved': return { icon: Send, title: 'Waiting Response Queue', subtitle: 'Companies awaiting response from TPO staff after brochure email was sent.', color: 'text-[#1D4ED8]', bg: 'bg-[#DBEAFE]', border: 'border-[#1D4ED8]' };
      case 'draft': return { icon: FileText, title: 'Drafts Queue', subtitle: 'Saved drafts not yet submitted.', color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', border: 'border-[#6B7280]' };
      case 'pending_review': return { icon: Clock, title: 'Pending Review Queue', subtitle: 'Emails composed but not yet submitted for review.', color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#D97706]' };
      case 'reverted': return { icon: RotateCcw, title: 'Reverted Queue', subtitle: 'Companies reverted to Base TPR for follow-up.', color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', border: 'border-[#7C3AED]' };
      default: return { icon: Clock, title: 'Unknown Queue', subtitle: '', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-500' };
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
      router.push(`/communication-tpr/requests/${request.id}/edit`); // Adjust path as needed
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
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error('Failed to revert');
      throw err;
    }
  };

  return (
    <div className="pt-[32px] px-[40px] pb-[32px] max-w-7xl mx-auto">
      {/* Back Link */}
      <button
        onClick={() => router.push('/communication-tpr/requests')}
        className="flex items-center text-[13px] font-medium text-gray-500 hover:text-gray-900 mb-[20px] transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Communication Queue
      </button>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-[700] text-gray-900 flex items-center gap-[10px]">
            <Icon className={`w-6 h-6 ${config.color}`} />
            {config.title}
          </h1>
          <p className="text-[14px] text-gray-500 mt-[4px]">
            {config.subtitle}
          </p>
        </div>

        <div className="relative self-center sm:self-auto flex items-center h-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 w-full sm:w-[280px] h-[40px] border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Divider */}
      <hr className="mt-[24px] mb-[28px] border-gray-200" />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : filteredRequests.length === 0 ? (
        <div className="py-20 text-center">
          <Icon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-[16px] font-[600] text-gray-900">No {config.title.replace(' Queue', '').toLowerCase()} companies</h3>
          <p className="mt-1 text-[14px] text-gray-500">
            {searchTerm ? "Try adjusting your search criteria." : `There are currently no items in this queue.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-[16px]">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => handleCardClick(request)}
              className={`bg-white rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.07)] border border-[rgba(0,0,0,0.06)] border-l-[4px] p-[20px_24px] transition-all duration-200 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] cursor-pointer`}
              style={{ borderLeftColor: config.border.replace('border-', '') }}
            >
              <div className="flex justify-between items-start mb-[16px]">
                <h3 className="text-[18px] font-[700] text-gray-900">
                  {request.companies?.company_name || 'Unknown Company'}
                </h3>
                <div 
                  className={`px-[14px] py-[5px] rounded-[20px] text-[11px] font-[700] tracking-[0.05em] uppercase whitespace-nowrap`}
                  style={{ backgroundColor: config.bg.replace('bg-', ''), color: config.color.replace('text-', '') }}
                >
                  {config.title.replace(' Queue', '')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1.5fr_1.5fr] gap-[12px]">
                <div className="flex flex-col">
                  <span className="text-[11px] font-[600] tracking-[0.06em] text-gray-400 uppercase mb-[4px]">HR Contact</span>
                  <span className="text-[14px] font-[500] text-gray-900 truncate" title={request.companies?.hr_name}>
                    {request.companies?.hr_name || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-[600] tracking-[0.06em] text-gray-400 uppercase mb-[4px]">Request Type</span>
                  <span className="text-[14px] font-[500] text-gray-900 uppercase truncate" title={request.request_type?.replace(/_/g, ' ')}>
                    {request.request_type?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-[600] tracking-[0.06em] text-gray-400 uppercase mb-[4px]">Created By</span>
                  <span className="text-[14px] font-[500] text-gray-900 truncate" title={request.users?.name}>
                    {request.users?.name || 'System'}
                  </span>
                </div>

                {status === 'approved' && (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-[600] tracking-[0.06em] text-gray-400 uppercase mb-[4px]">Interested Marked By</span>
                    <span className="text-[14px] font-[500] text-gray-900 truncate">
                      {Array.isArray(request.companies?.company_status) 
                        ? request.companies.company_status[0]?.interested_by_name || 'Base TPR'
                        : request.companies?.company_status?.interested_by_name || 'Base TPR'}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Specific Info */}
              {status === 'rejected' && request.rejection_notes && (
                <div className="mt-[16px]">
                  <div className="bg-[#FEE2E2] p-3 rounded-lg border border-red-100 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3">
                    <div className="text-[13px] italic text-[#DC2626]">
                      <span className="font-bold not-italic">Rejection note:</span> {request.rejection_notes}
                    </div>
                    <button
                      onClick={(e) => openRevertModal(e, request.id)}
                      className="shrink-0 px-3 py-1.5 bg-white text-[#DC2626] text-xs font-semibold rounded-[8px] border border-[#DC2626] hover:bg-red-50 transition-colors"
                    >
                      Revert to Base TPR
                    </button>
                  </div>
                </div>
              )}

              {status === 'reverted' && (
                <div className="mt-[16px]">
                  <div className="bg-[#EDE9FE] p-4 rounded-lg border border-purple-200">
                    <div className="flex flex-col gap-2">
                      <div className="text-[14px] text-[#5B21B6]">
                        <span className="font-bold">Revert Note:</span> {request.revert_notes || 'No notes provided.'}
                      </div>
                      <div className="text-[12px] text-[#7C3AED] flex justify-between items-center">
                        <span>Reverted to Base TPR</span>
                        <span>{new Date(request.reverted_at || request.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
