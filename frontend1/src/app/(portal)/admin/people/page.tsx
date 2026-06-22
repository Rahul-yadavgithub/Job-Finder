'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet, adminPost } from '@/lib/admin/api';
import { toast } from 'sonner';
import { 
  Users, Crown, Star, UserX, ShieldAlert, ShieldCheck, UserCheck, ChevronDown, ChevronUp 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPeoplePage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [tprs, setTprs] = useState<any[]>([]);
  const [commTprs, setCommTprs] = useState<any[]>([]);
  const [perBranchStats, setPerBranchStats] = useState<any[]>([]);
  
  const [tab, setTab] = useState(searchParams.get('tab') || 'coworkers');
  const [branchFilter, setBranchFilter] = useState('');
  
  // Modals
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean, target: any, type: 'worker' | 'tpr' }>({ isOpen: false, target: null, type: 'worker' });
  const [revokeReason, setRevokeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successorModal, setSuccessorModal] = useState<{ isOpen: boolean, worker: any }>({ isOpen: false, worker: null });

  // Branch accordion state
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, coworkersRes, tprsRes, commTprsRes] = await Promise.all([
        adminGet<{ data: any }>('/people/overview'),
        adminGet<{ data: any[] }>('/people/coworkers'),
        adminGet<{ data: any[] }>('/people/branch-tprs'),
        adminGet<{ data: any[] }>('/people/communication-tprs')
      ]);
      
      if (statsRes.data) {
        setStats(statsRes.data);
        setPerBranchStats(statsRes.data.perBranch || []);
      }
      if (coworkersRes.data) setCoworkers(coworkersRes.data);
      if (tprsRes.data) setTprs(tprsRes.data);
      if (commTprsRes.data) setCommTprs(commTprsRes.data);
    } catch (error) {
      console.error('Failed to fetch people data:', error);
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

  const handleRevoke = async () => {
    if (!revokeModal.target || revokeReason.length < 10) return;
    setActionLoading(true);
    try {
      await adminPost(`/people/${revokeModal.target.id}/revoke`, { reason: revokeReason });
      
      toast.success('Access revoked successfully');
      setRevokeModal({ isOpen: false, target: null, type: 'worker' });
      setRevokeReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteToCommTpr = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this Branch TPR to a Communication TPR?')) return;
    setActionLoading(true);
    try {
      await adminPost(`/people/${userId}/promote-comm-tpr`);
      toast.success('Promoted to Communication TPR successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote TPR');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoteCommTpr = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke Communication TPR status? They will be demoted to a regular Branch TPR.')) return;
    setActionLoading(true);
    try {
      await adminPost(`/people/${userId}/demote-comm-tpr`);
      toast.success('Demoted to Branch TPR successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote TPR');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async (targetId: string, type: 'worker'|'tpr') => {
    if (!confirm('Are you sure you want to reinstate this user?')) return;
    try {
      await adminPost(`/workers/${targetId}/reinstate`); // Assuming we still use this
      toast.success('User reinstated');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reinstate user');
    }
  };

  const handleSetSuccessor = async () => {
    if (!successorModal.worker) return;
    setActionLoading(true);
    try {
      await adminPost(`/workers/designate-successor`, { userId: successorModal.worker.id });
      toast.success(`Successor set to ${successorModal.worker.name}`);
      setSuccessorModal({ isOpen: false, worker: null });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set successor');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-none space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
        <p className="text-gray-500">TPO Staff and Department Representatives overview</p>
      </div>

      {loading && !stats ? (
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-2 gap-8"><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-32 bg-gray-200 rounded-xl"></div></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      ) : stats && (
        <>
          {/* Top Row - Two Groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Co-workers Group */}
            <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-xl border border-purple-100 shadow-sm p-5 transition-transform hover:scale-[1.01]">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2"><Crown size={18} /> TPO Staff</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.coworkers.total}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-500 uppercase tracking-wider">Head</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.coworkers.head_count}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">Callers</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.coworkers.caller_count}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Coords</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.coworkers.coordinator_count}</p>
                </div>
              </div>
            </div>

            {/* Branch TPRs Group */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl border border-blue-100 shadow-sm p-5 transition-transform hover:scale-[1.01]">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Users size={18} /> Department Reps</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.branchTprs.total}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-500 uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold text-green-700">{stats.branchTprs.active}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.branchTprs.pending}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Suspended</p>
                  <p className="text-2xl font-bold text-red-700">{stats.branchTprs.suspended}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Main Interface */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex gap-2 bg-gray-50/50">
              {['tpo-staff', 'department-reps', 'communication-tprs', 'by-branch'].map(t => {
                const isActive = tab === t || (tab === 'coworkers' && t === 'tpo-staff') || (tab === 'branch-tprs' && t === 'department-reps');
                return (
                <button
                  key={t}
                  onClick={() => updateTab(t === 'tpo-staff' ? 'coworkers' : t === 'department-reps' ? 'branch-tprs' : t)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg capitalize transition-all hover:scale-[1.02] ${isActive ? 'bg-white text-[#15335b] shadow border border-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {t.replace('-', ' ')}
                </button>
              )})}
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              
              {/* TAB 1: CO-WORKERS */}
              {tab === 'coworkers' && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coworkers.map(cw => (
                      <tr key={cw.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={cw.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cw.name)}&background=random`} alt={cw.name} className="w-10 h-10 rounded-full shadow-sm" />
                            <div>
                              <div className="flex items-center gap-2 font-bold text-gray-900">
                                {cw.name}
                                {cw.is_super_admin && <span title="Super Admin"><Crown size={14} className="text-amber-500" /></span>}
                                {cw.designated_successor && <span title="Designated Successor"><Star size={14} className="fill-amber-500 text-amber-500" /></span>}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">{cw.designation.replace('_', ' ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{cw.email}</td>
                        <td className="px-6 py-4">
                          {cw.role === 'head' && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-indigo-800">Head TPO</span>}
                          {cw.role === 'caller' && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">Caller</span>}
                          {cw.role === 'coordinator' && <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800">Coordinator</span>}
                        </td>
                        <td className="px-6 py-4">
                          {cw.status === 'approved' ? (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">Active</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">Suspended</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {cw.last_login_at ? formatDistanceToNow(new Date(cw.last_login_at), { addSuffix: true }) : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {cw.id === user.userId ? (
                            <span className="text-xs text-gray-400 font-medium">(You)</span>
                          ) : user.isSuperAdmin ? (
                            <div className="flex justify-end gap-2">
                              {cw.status === 'approved' ? (
                                <>
                                  <button onClick={() => setRevokeModal({ isOpen: true, target: cw, type: 'worker' })} className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors">Revoke Access</button>
                                  {!cw.designated_successor && !cw.is_super_admin && (
                                    <button onClick={() => setSuccessorModal({ isOpen: true, worker: cw })} className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded hover:bg-amber-100 transition-colors">Set Successor</button>
                                  )}
                                </>
                              ) : (
                                <button onClick={() => handleReinstate(cw.id, 'worker')} className="px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200 rounded hover:bg-green-50 transition-colors">Reinstate</button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB 2: BRANCH TPRs */}
              {tab === 'branch-tprs' && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Name & Roll</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tprs.map(tpr => (
                      <tr key={tpr.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={tpr.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tpr.name)}&background=random`} alt={tpr.name} className="w-10 h-10 rounded-full shadow-sm" />
                            <div>
                              <div className="font-bold text-gray-900">{tpr.name}</div>
                              <div className="text-xs text-gray-500">{tpr.roll_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#15335b]">{tpr.branch_code}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {tpr.last_login_at ? formatDistanceToNow(new Date(tpr.last_login_at), { addSuffix: true }) : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/people/${tpr.id}`} className="px-4 py-2 text-sm font-medium text-[#1b4376] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-block">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* TAB 2.5: COMMUNICATION TPRs */}
              {tab === 'communication-tprs' && (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Name & Roll</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commTprs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">No Communication TPRs found</td>
                      </tr>
                    ) : (
                      commTprs.map(tpr => (
                        <tr key={tpr.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={tpr.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tpr.name)}&background=random`} alt={tpr.name} className="w-10 h-10 rounded-full shadow-sm" />
                              <div>
                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                  {tpr.name}
                                  {tpr.role === 'communication_tpr' && <ShieldCheck size={14} className="text-[#1b4376]" />}
                                </div>
                                <div className="text-xs text-gray-500">{tpr.roll_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-[#15335b]">{tpr.branch_code}</td>
                          <td className="px-6 py-4 text-gray-600">{tpr.email}</td>
                          <td className="px-6 py-4">
                            {tpr.status === 'approved' ? <span className="text-green-600 font-bold">Active</span> :
                             <span className="text-red-600 font-bold">Suspended</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {tpr.last_login_at ? formatDistanceToNow(new Date(tpr.last_login_at), { addSuffix: true }) : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user.isSuperAdmin && (
                              <button onClick={() => handleDemoteCommTpr(tpr.id)} className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors">Revoke Comm TPR</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 3: BY BRANCH */}
              {tab === 'by-branch' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {perBranchStats.map((branch: any) => {
                    const branchTprsList = tprs.filter(t => t.branch_code === branch.branch_code);
                    const isExpanded = expandedBranch === branch.branch_code;
                    return (
                      <div key={branch.branch_code} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 flex items-center justify-between bg-gray-50/50 cursor-pointer" onClick={() => setExpandedBranch(isExpanded ? null : branch.branch_code)}>
                          <div>
                            <h3 className="font-bold text-gray-900">{branch.branch_name}</h3>
                            <p className="text-sm font-medium text-[#1b4376]">{branch.branch_code}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-blue-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">{branch.active_count} Active</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400 mt-1"/> : <ChevronDown size={16} className="text-gray-400 mt-1"/>}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-white p-4">
                            {branchTprsList.length === 0 ? (
                              <p className="text-sm text-gray-500 italic text-center">No TPRs mapped to this branch.</p>
                            ) : (
                              <ul className="space-y-3">
                                {branchTprsList.map(t => (
                                  <li key={t.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                      <img src={t.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`} alt={t.name} className="w-8 h-8 rounded-full shadow-sm" />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{t.name}</span>
                                        <span className="text-xs text-gray-500">{t.email}</span>
                                      </div>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {t.status.toUpperCase()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* Revoke Modal */}
      {revokeModal.isOpen && revokeModal.target && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert /> Revoke Access
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium text-lg">Revoke access for {revokeModal.target.name}?</p>
              <p className="text-sm text-gray-500">They will lose portal access immediately.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required) <span className="text-red-500">*</span></label>
                <textarea 
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Provide a detailed reason for the audit log (min 10 chars)"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 resize-none h-24"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => { setRevokeModal({ isOpen: false, target: null, type: 'worker' }); setRevokeReason(''); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRevoke}
                disabled={actionLoading || revokeReason.length < 10}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Successor Modal */}
      {successorModal.isOpen && successorModal.worker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-amber-100 bg-amber-50">
              <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <Star className="fill-amber-500 text-amber-500" /> Designate Successor
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-lg">Designate <strong>{successorModal.worker.name}</strong> as successor?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                If you become unavailable, they can complete the emergency leadership handover process.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => setSuccessorModal({ isOpen: false, worker: null })}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSetSuccessor}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 flex items-center gap-2"
              >
                {actionLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                Confirm Designation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
