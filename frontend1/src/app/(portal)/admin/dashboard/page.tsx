'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  Users, Building2, Activity, UserPlus, Star, AlertTriangle, ArrowRight, ShieldCheck, ClipboardList,
  Compass, Briefcase, MapPin, Calendar, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Super Admin Stats
  const [reqStats, setReqStats] = useState({ worker: 0, tpr: 0 });
  const [compStats, setCompStats] = useState({ total: 0, confirmed: 0, pendingReview: 0, addedToday: 0 });
  const [peopleStats, setPeopleStats] = useState({ coworkers: 0, tprs: 0, activeCoworkers: 0 });
  const [auditToday, setAuditToday] = useState(0);
  const [successor, setSuccessor] = useState<{ name: string; designation: string } | null>(null);

  // Worker Profile
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (user.isSuperAdmin && !user.jumpedIn) {
        fetchSuperAdminData();
      } else {
        fetchWorkerData();
      }
    }
  }, [user]);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const [reqRes, compRes, peopleRes, auditRes, workersRes] = await Promise.all([
        adminGet<{ data: { pending_worker_requests: number, pending_tpr_requests: number } }>('/user-requests/stats'),
        adminGet<{ data: { total: number, confirmed: number, pending_mid_review: number, added_today: number } }>('/companies/stats'),
        adminGet<{ data: { coworkers: { total: number, active: number }, branchTprs: { total: number } } }>('/people/stats'),
        adminGet<{ count: number }>('/stats/audit-today'),
        adminGet<{ data: any[] }>('/people/coworkers')
      ]);

      if (reqRes.data) setReqStats({ worker: reqRes.data.pending_worker_requests, tpr: reqRes.data.pending_tpr_requests });
      if (compRes.data) setCompStats({ total: compRes.data.total, confirmed: compRes.data.confirmed, pendingReview: compRes.data.pending_mid_review, addedToday: compRes.data.added_today });
      if (peopleRes.data) setPeopleStats({ coworkers: peopleRes.data.coworkers.total, tprs: peopleRes.data.branchTprs.total, activeCoworkers: peopleRes.data.coworkers.active });
      if (auditRes) setAuditToday(auditRes.count || 0);

      const succ = workersRes.data?.find(w => w.designated_successor);
      if (succ) setSuccessor({ name: succ.name, designation: succ.designation });
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const response = await adminGet<{ success: boolean; data: any }>('/auth/me');
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  // --- WORKER / JUMPED-IN VIEW ---
  if (!user.isSuperAdmin || user.jumpedIn) {
    const roleColor = user.role === 'coordinator' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user.name}</h1>
          <div className="mt-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleColor}`}>
              {user.role}
            </span>
            <span className="text-sm font-medium text-gray-500 capitalize">
              {user.designation?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Compass size={200} />
          </div>
          <div className="p-8 md:p-12 relative z-10">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your workspace is being set up.</h2>
            <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
              More features for your specific role will appear here soon. The engineering team is currently expanding the co-worker tools.
            </p>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex flex-wrap gap-6 md:gap-12 relative z-10">
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase size={18} className="text-gray-400" />
              <span className="text-sm font-medium capitalize">{user.designation?.replace('_', ' ')}</span>
            </div>
            {profile?.branches?.name && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} className="text-gray-400" />
                <span className="text-sm font-medium">{profile.branches.name} Branch</span>
              </div>
            )}
            {profile?.created_at && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={18} className="text-gray-400" />
                <span className="text-sm font-medium">Active since {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- SUPER ADMIN VIEW ---
  const totalPending = reqStats.worker + reqStats.tpr;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/requests" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Requests</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
              {totalPending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">Action Needed</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg transition-colors ${totalPending > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-gray-50 text-gray-400 group-hover:text-indigo-500'}`}>
            <UserPlus size={24} />
          </div>
        </Link>

        <Link href="/admin/people" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Workers</p>
            <p className="text-2xl font-bold text-gray-900">{peopleStats.activeCoworkers}</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <Users size={24} />
          </div>
        </Link>

        <Link href="/admin/companies" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Companies</p>
            <p className="text-2xl font-bold text-gray-900">{compStats.total}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
            <Building2 size={24} />
          </div>
        </Link>

        <Link href="/admin/audit-log" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Audit Events Today</p>
            <p className="text-2xl font-bold text-gray-900">{auditToday}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Activity size={24} />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={18} className="text-green-600" /> Companies
            </h2>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confirmed</span>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{compStats.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Review</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{compStats.pendingReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Added Today</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{compStats.addedToday}</span>
            </div>
          </div>
          <Link href="/admin/companies" className="p-4 border-t border-gray-100 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 group">
            View all companies <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" /> Team
            </h2>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Co-workers</span>
              <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{peopleStats.coworkers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Branch TPRs</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{peopleStats.tprs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Approvals</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{totalPending}</span>
            </div>
          </div>
          <Link href="/admin/people" className="p-4 border-t border-gray-100 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 group">
            View team <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className={`rounded-xl border shadow-sm flex flex-col overflow-hidden transition-colors ${totalPending > 0 ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 border-b ${totalPending > 0 ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList size={18} className={totalPending > 0 ? 'text-amber-600' : 'text-gray-400'} /> Pending Requests
            </h2>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Worker Requests</span>
              <span className={`font-bold px-2 py-0.5 rounded ${reqStats.worker > 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-500 bg-gray-100'}`}>
                {reqStats.worker}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">TPR Requests</span>
              <span className={`font-bold px-2 py-0.5 rounded ${reqStats.tpr > 0 ? 'text-amber-600 bg-amber-100' : 'text-gray-500 bg-gray-100'}`}>
                {reqStats.tpr}
              </span>
            </div>
          </div>
          <Link href="/admin/requests" className={`p-4 border-t text-sm font-bold flex items-center justify-center gap-1 transition-colors group ${totalPending > 0 ? 'border-amber-100 text-amber-700 hover:bg-amber-100' : 'border-gray-100 text-indigo-600 hover:bg-indigo-50'}`}>
            Review requests <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

      <div className={`rounded-xl p-4 border flex items-center justify-between ${
        successor ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {successor ? <ShieldCheck className="text-indigo-600 w-6 h-6" /> : <AlertTriangle className="text-amber-600 w-6 h-6" />}
          <div>
            {successor ? (
              <p className="text-sm font-medium text-indigo-900">
                Succession Plan Active. Designated to: <span className="font-bold">{successor.name}</span> <span className="opacity-75">({successor.designation.replace('_', ' ')})</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-amber-900">
                Warning: No successor designated. Set one in Succession Settings to ensure operational continuity.
              </p>
            )}
          </div>
        </div>
        <Link 
          href="/admin/settings/succession"
          className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap ml-4 ${
            successor ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {successor ? 'Manage Settings' : 'Set Successor Now'}
        </Link>
      </div>

    </div>
  );
}
