import React, { useState, useEffect } from 'react';
import { adminGet, adminPost } from '@/lib/admin/api';
import { toast } from 'sonner';
import { Check, X, Eye, FileText, Calendar, Building2, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface AdminRequestItem {
  id: string;
  company_id: string;
  assignment_id: string;
  request_type: string;
  request_data: any;
  status: string;
  created_at: string;
  companies?: { name: string; branches: { code: string } };
}

export function AdminRequestsList() {
  const [requests, setRequests] = useState<AdminRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; request: AdminRequestItem | null; type: 'approve' | 'reject' }>({ isOpen: false, request: null, type: 'approve' });
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminGet<{ success: boolean, data: any }>('/requests');
      if (res.success && res.data) {
        const combined = [
          ...(res.data.comm_tpr_requests || []),
          ...(res.data.company_responses || []),
          ...(res.data.head_only_requests || [])
        ];
        
        // Remove duplicates by ID since head_only_requests might overlap
        const uniqueRequests = combined.filter((req, index, self) => 
          index === self.findIndex((t) => t.id === req.id)
        );

        setRequests(uniqueRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch admin requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.request) return;
    setActionLoading(true);
    try {
      const status = actionModal.type === 'approve' ? 'approved' : 'rejected';
      await adminPost(`/requests/${actionModal.request.id}/action`, { status, message: actionMessage });
      toast.success(`Request ${status} successfully`);
      setActionModal({ isOpen: false, request: null, type: 'approve' });
      setActionMessage('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${actionModal.type} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderRequestDetails = (req: AdminRequestItem) => {
    if (req.request_type === 'document_approval' && req.request_data.document_type) {
      return (
        <div className="flex flex-col gap-1 mt-2">
          <div className="text-sm font-medium text-gray-900 flex items-center gap-1"><FileText size={14}/> {req.request_data.document_type.toUpperCase()} Approval</div>
          <a href={req.request_data.file_url} target="_blank" rel="noreferrer" className="text-xs text-[#1b4376] hover:underline inline-flex items-center gap-1">
            <Eye size={12}/> View Document
          </a>
        </div>
      );
    }
    if (req.request_type === 'drive_confirmation') {
      return (
        <div className="flex flex-col gap-1 mt-2">
          <div className="text-sm font-medium text-gray-900 flex items-center gap-1"><Calendar size={14}/> Drive Confirmation</div>
          <div className="text-xs text-gray-600">
            {req.request_data.dates?.map((d: string) => format(new Date(d), 'MMM d')).join(', ')}
          </div>
        </div>
      );
    }
    return <div className="text-sm text-gray-600 mt-2 capitalize">{req.request_type.replace('_', ' ')}</div>;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center">
        <Check size={48} className="text-green-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
        <p className="text-sm">No pending company requests to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {requests.map(req => (
        <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-gray-900 flex items-center gap-1"><Building2 size={16} className="text-gray-400"/> {req.companies?.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#15335b] border border-blue-100">
                {req.companies?.branches?.code || 'Unknown'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Requested {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</div>
            {renderRequestDetails(req)}
          </div>
          
          <div className="flex items-center gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
            <button 
              onClick={() => setActionModal({ isOpen: true, request: req, type: 'approve' })}
              className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors border border-green-200"
            >
              <Check size={16} /> Approve
            </button>
            <button 
              onClick={() => setActionModal({ isOpen: true, request: req, type: 'reject' })}
              className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-200"
            >
              <X size={16} /> Reject
            </button>
          </div>
        </div>
      ))}

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 border-b ${actionModal.type === 'approve' ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${actionModal.type === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                {actionModal.type === 'approve' ? <Check /> : <X />} 
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'} the <span className="font-bold capitalize">{actionModal.request.request_type.replace('_', ' ')}</span> for <span className="font-bold">{actionModal.request.companies?.name}</span>?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea 
                  value={actionMessage}
                  onChange={(e) => setActionMessage(e.target.value)}
                  placeholder={`Optional message for the branch TPR...`}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => { setActionModal({ isOpen: false, request: null, type: 'approve' }); setActionMessage(''); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 disabled:opacity-50 ${actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
