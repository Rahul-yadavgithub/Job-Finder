'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet, adminPost } from '@/lib/admin/api';
import { ArrowLeft, Mail, Phone, Building2, User, Clock, ShieldAlert, UserMinus, Ban, CheckCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function PersonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [person, setPerson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promoteModal, setPromoteModal] = useState(false);
  const [demoteModal, setDemoteModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [restoreModal, setRestoreModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const res = await adminGet<{ data: any }>(`/people/${id}`);
      setPerson(res.data);
    } catch (error) {
      toast.error('Failed to load user details');
      router.push('/admin/people');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handlePromote = async () => {
    try {
      setActionLoading(true);
      await adminPost(`/people/${id}/promote-comm-tpr`, {});
      toast.success('User promoted to Communication TPR');
      setPromoteModal(false);
      fetchDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async () => {
    try {
      setActionLoading(true);
      await adminPost(`/people/${id}/demote-comm-tpr`, {});
      toast.success('User demoted to Branch TPR');
      setDemoteModal(false);
      fetchDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (revokeReason.trim().length < 5) {
      toast.error('Please provide a valid reason (min 5 chars)');
      return;
    }
    try {
      setActionLoading(true);
      await adminPost(`/people/${id}/revoke`, { reason: revokeReason.trim() });
      toast.success('Access revoked successfully');
      setRevokeModal(false);
      setRevokeReason('');
      fetchDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setActionLoading(true);
      await adminPost(`/people/${id}/restore`, {});
      toast.success('Access restored successfully');
      setRestoreModal(false);
      fetchDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore access');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!person) return null;

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <User size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Link href="/admin/people?tab=branch" className="p-3 text-[#1b4376] bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-lg shrink-0 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-3 backdrop-blur-sm">
                <User size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Person Details</h1>
              <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
                View and manage profile information. Monitor activity and roles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-1 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg bg-gray-50">
            {person.profile_photo_url ? (
              <img src={person.profile_photo_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`} alt={person.name} className="w-full h-full object-cover" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{person.name}</h2>
          <p className="text-gray-500 mb-2">{person.roll_number}</p>
          
          <span className={`px-3 py-1 text-sm font-semibold rounded-full mt-2 ${
            person.status === 'approved' ? 'bg-green-100 text-green-700' : 
            person.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
          </span>

          <div className="mt-6 w-full pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 text-left">Role Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">System Role</span>
                <span className="font-medium text-gray-900">{person.role.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Branch</span>
                <span className="font-medium text-gray-900">{person.branch_name || 'N/A'} {person.branch_code ? `(${person.branch_code})` : ''}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Companies Added</span>
                <span className="font-medium text-gray-900">{person.companies_added || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Details & Actions Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 md:col-span-2 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Activity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900 break-all">{person.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="font-medium text-gray-900">{person.mobile_no || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mt-1">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved By</p>
                  <p className="font-medium text-gray-900">{person.approved_by_name || 'Unknown'}</p>
                  {person.approved_at && (
                    <p className="text-xs text-gray-400">{new Date(person.approved_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium text-gray-900">
                    {person.last_login_at ? formatDistanceToNow(new Date(person.last_login_at), { addSuffix: true }) : 'Never Logged In'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {person.companies_list && person.companies_list.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Added Companies</h3>
              <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                  {person.companies_list.map((comp: any) => (
                      <div key={comp.id} className="p-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 text-base">{comp.company_name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(comp.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          comp.status === 'approved' ? 'bg-green-100 text-green-700' :
                          comp.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {comp.status ? comp.status.charAt(0).toUpperCase() + comp.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {user?.isSuperAdmin && (
            <div className="p-6 bg-gray-50/50 rounded-b-xl flex-1 flex flex-col justify-end">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Administration Actions</h3>
              
              {person.is_super_admin ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Super Admin</h4>
                    <p className="text-sm text-blue-700 mt-1">This user is a Super Admin. Their access cannot be revoked and their role cannot be changed from this interface.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {person.status === 'approved' && person.role === 'branch_tpr' && (
                    <button onClick={() => setPromoteModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Make Communication TPR
                    </button>
                  )}

                  {person.status === 'approved' && person.role === 'communication_tpr' && (
                    <button onClick={() => setDemoteModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Demote to Branch TPR
                    </button>
                  )}

                  {person.status === 'approved' ? (
                    <button onClick={() => setRevokeModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2">
                      <UserMinus className="w-4 h-4" />
                      Revoke Access
                    </button>
                  ) : person.status === 'suspended' ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex-1 flex items-start gap-3">
                        <Ban className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-red-900">Account Suspended</h4>
                          <p className="text-sm text-red-700 mt-1">This user's access has been revoked. They cannot access the portal.</p>
                        </div>
                      </div>
                      <button onClick={() => setRestoreModal(true)} className="self-start px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Restore Access
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Promote Modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Promote to Communication TPR?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to promote <strong>{person.name}</strong> to Communication TPR?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPromoteModal(false)} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handlePromote} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote Modal */}
      {demoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Demote to Branch TPR?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to demote <strong>{person.name}</strong> back to Branch TPR?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDemoteModal(false)} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleDemote} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Access Modal */}
      {restoreModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Restore Access?</h3>
            </div>
            <p className="text-gray-600 mb-2">You are about to restore portal access for:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
              <p className="font-bold text-gray-900">{person.name}</p>
              <p className="text-sm text-gray-500">{person.email}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">This will set their account status back to <strong>Active</strong> and they will be able to log in again immediately.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRestoreModal(false)} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleRestore} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 disabled:opacity-50">
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <ShieldCheck className="w-4 h-4" /> Restore Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] md:max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2"><ShieldAlert /> Revoke Access</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for revoking access for <strong>{person.name}</strong>.</p>
            <textarea 
              value={revokeReason} 
              onChange={(e) => setRevokeReason(e.target.value)} 
              placeholder="Reason for revoking (min 5 chars)..." 
              className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] resize-y outline-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRevokeModal(false); setRevokeReason(''); }} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleRevoke} disabled={actionLoading || revokeReason.trim().length < 5} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>} Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
