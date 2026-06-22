'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet, adminPost } from '@/lib/admin/api';
import { toast } from 'sonner';
import { 
  ClipboardList, Check, X, ShieldAlert, UserCheck, RefreshCw, Briefcase
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdminRequestsList } from '@/components/requests/AdminRequestsList';

export default function AdminRequestsPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ worker: 0, tpr: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  
  const [tab, setTab] = useState(searchParams.get('tab') || 'coworker-requests');
  
  // Modals
  const [approveWorkerModal, setApproveWorkerModal] = useState<{ isOpen: boolean, request: any }>({ isOpen: false, request: null });
  const [approveRole, setApproveRole] = useState('caller');
  
  const [rejectWorkerModal, setRejectWorkerModal] = useState<{ isOpen: boolean, request: any }>({ isOpen: false, request: null });
  const [rejectReason, setRejectReason] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/admin/dashboard');
      return;
    }
    if (user?.isSuperAdmin) {
      fetchData();
    }
  }, [user, tab, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusFilter = tab === 'all-history' ? 'all' : 'pending';
      const typeFilter = tab === 'coworker-requests' ? 'worker' : tab === 'tpr-requests' ? 'branch_tpr' : 'all';

      const [statsRes, reqsRes] = await Promise.all([
        adminGet<{ data: { pending_worker_requests: number, pending_tpr_requests: number } }>('/user-requests/stats'),
        adminGet<{ data: { combined: any[] } }>(`/user-requests`, { type: typeFilter, status: statusFilter })
      ]);
      
      if (statsRes.data) {
        setStats({ worker: statsRes.data.pending_worker_requests, tpr: statsRes.data.pending_tpr_requests });
      }
      if (reqsRes.data) {
        setRequests(reqsRes.data.combined || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests data');
    } finally {
      setLoading(false);
    }
  };

  const updateTab = (newTab: string) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  // ----------------------------------------
  // Handlers for Worker Requests
  // ----------------------------------------
  const handleApproveWorker = async () => {
    if (!approveWorkerModal.request) return;
    setActionLoading(true);
    try {
      await adminPost(`/user-requests/workers/${approveWorkerModal.request.id}/approve`, { role: approveRole });
      toast.success('Staff account created successfully');
      setApproveWorkerModal({ isOpen: false, request: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWorker = async () => {
    if (!rejectWorkerModal.request || rejectReason.length < 10) return;
    setActionLoading(true);
    try {
      await adminPost(`/user-requests/workers/${rejectWorkerModal.request.id}/reject`, { reason: rejectReason });
      toast.success('Staff request rejected');
      setRejectWorkerModal({ isOpen: false, request: null });
      setRejectReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------------------------------
  // Handlers for TPR Requests
  // ----------------------------------------
  const handleApproveTpr = async (tprId: string) => {
    if (!confirm('Approve this TPR account?')) return;
    try {
      await adminPost(`/user-requests/tprs/${tprId}/approve`);
      toast.success('TPR approved successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve TPR');
    }
  };

  const handleRejectTpr = async (tprId: string) => {
    const reason = prompt('Please provide a reason for rejecting this TPR request (min 10 chars):');
    if (!reason || reason.length < 10) {
      if (reason !== null) toast.error('Reason must be at least 10 characters long.');
      return;
    }
    try {
      await adminPost(`/user-requests/tprs/${tprId}/reject`, { reason });
      toast.success('TPR request rejected');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject TPR');
    }
  };

  // Co-workers are allowed to see the page, but ONLY the Company Requests tab.
  useEffect(() => {
    if (user && !user.isSuperAdmin && tab !== 'company-requests') {
      updateTab('company-requests');
    }
  }, [user, tab]);

  if (!user) return null;

  const totalPending = stats.worker + stats.tpr;

  return (
    <div className="w-full max-w-none space-y-8 pb-10">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <ShieldAlert size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <ShieldAlert size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Access Requests</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Review and approve access for TPO Staff and Department Representatives.
            </p>
          </div>
          
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 font-bold text-sm transition-colors shadow-sm disabled:opacity-50 backdrop-blur-md"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Row - Only visible for Super Admins */}
      {user.isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Staff Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.worker}</p>
            </div>
            <div className={`p-4 rounded-full ${stats.worker > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <UserCheck size={32} className={stats.worker > 0 ? 'text-red-500' : 'text-gray-300'} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">TPR Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.tpr}</p>
            </div>
            <div className={`p-4 rounded-full ${stats.tpr > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <ClipboardList size={32} className={stats.tpr > 0 ? 'text-amber-500' : 'text-gray-300'} />
            </div>
          </div>
        </div>
      )}

      {/* Main Interface */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex gap-2 overflow-x-auto bg-gray-50/50">
          <button
            onClick={() => updateTab('company-requests')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'company-requests' ? 'bg-white text-[#15335b] shadow border border-indigo-200' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Briefcase size={16} /> Company Requests
          </button>
          
          {user.isSuperAdmin && (
            <>
              <button
                onClick={() => updateTab('coworker-requests')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'coworker-requests' ? 'bg-white text-[#15335b] shadow border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                TPO Staff Requests 
                {stats.worker > 0 && <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">{stats.worker}</span>}
              </button>
              
              <button
                onClick={() => updateTab('tpr-requests')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'tpr-requests' ? 'bg-white text-[#15335b] shadow border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Department Rep Requests 
                {stats.tpr > 0 && <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px]">{stats.tpr}</span>}
              </button>
              
              <button
                onClick={() => updateTab('all-history')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${tab === 'all-history' ? 'bg-white text-[#15335b] shadow border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Requests (History)
              </button>
            </>
          )}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {tab === 'company-requests' ? (
            <AdminRequestsList />
          ) : loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>)}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100/50 shadow-sm text-green-500 rounded-full flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500 mt-1">No pending requests found in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Context</th>
                  <th className="px-6 py-4">Note / Reason</th>
                  <th className="px-6 py-4">Requested</th>
                  {tab === 'all-history' && <th className="px-6 py-4">Status</th>}
                  {tab !== 'all-history' && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{req.name}</div>
                      <div className="text-xs text-gray-500">{req.email}</div>
                      {req.request_type === 'branch_tpr' && <div className="text-[10px] uppercase font-bold text-blue-500 mt-0.5">TPR REQUEST</div>}
                      {req.request_type === 'worker' && <div className="text-[10px] uppercase font-bold text-red-500 mt-0.5">STAFF REQUEST</div>}
                    </td>
                    <td className="px-6 py-4">
                      {req.request_type === 'worker' ? (
                        <span className="font-medium capitalize text-gray-700">{req.designation === 'coordinator' ? 'staff' : req.designation.replace('_', ' ')}</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#15335b]">{req.branch_code}</span>
                          <span className="text-xs text-gray-500">Roll: {req.roll_number}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[250px] truncate text-gray-600" title={req.self_note}>
                        {req.self_note || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </td>
                    
                    {tab === 'all-history' ? (
                      <td className="px-6 py-4">
                        {req.status === 'pending' && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Pending</span>}
                        {req.status === 'approved' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Approved</span>}
                        {(req.status === 'rejected' || req.status === 'suspended') && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Rejected</span>}
                      </td>
                    ) : (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => req.request_type === 'worker' ? setApproveWorkerModal({ isOpen: true, request: req }) : handleApproveTpr(req.id)}
                            className="px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors flex items-center gap-1"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => req.request_type === 'worker' ? setRejectWorkerModal({ isOpen: true, request: req }) : handleRejectTpr(req.id)}
                            className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Approve Worker Modal */}
      {approveWorkerModal.isOpen && approveWorkerModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Approve Staff Access</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-900">{approveWorkerModal.request.name}</p>
                <p className="text-xs text-gray-500">{approveWorkerModal.request.email}</p>
                <p className="text-xs text-[#1b4376] font-medium mt-1 uppercase tracking-wider">Requested: {approveWorkerModal.request.designation === 'coordinator' ? 'staff' : approveWorkerModal.request.designation.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                <select 
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="caller">Caller</option>
                  <option value="coordinator">Staff</option>
                </select>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  The caller role allows validating and tracking companies. The staff role grants broader approval powers over the database.
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => setApproveWorkerModal({ isOpen: false, request: null })}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleApproveWorker}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Worker Modal */}
      {rejectWorkerModal.isOpen && rejectWorkerModal.request && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert /> Reject Request
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">Rejecting access for <strong>{rejectWorkerModal.request.name}</strong>.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required) <span className="text-red-500">*</span></label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection (min 10 chars)"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none h-24"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => { setRejectWorkerModal({ isOpen: false, request: null }); setRejectReason(''); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectWorker}
                disabled={actionLoading || rejectReason.length < 10}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
