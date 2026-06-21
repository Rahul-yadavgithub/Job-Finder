'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  Users, Building2, Activity, UserPlus, Star, AlertTriangle, ArrowRight, ShieldCheck, ClipboardList,
  Compass, Briefcase, MapPin, Calendar, LayoutDashboard, Globe, Target, CheckCircle2, Clock
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

  // Worker Profile & Stats
  const [profile, setProfile] = useState<any>(null);
  const [workerStats, setWorkerStats] = useState<any>(null);

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
        adminGet<{ data: { coworkers: { total: number, active: number }, branchTprs: { total: number } } }>('/people/overview'),
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
      const [profileRes, statsRes] = await Promise.all([
        adminGet<{ success: boolean; data: any }>('/auth/me'),
        adminGet<{ success: boolean; data: any }>('/dashboard-stats')
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (statsRes.success) setWorkerStats(statsRes.data);
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
    
    // Safely destructure stats, providing defaults if they haven't loaded yet
    const ts = workerStats?.taskStats || { pending: 0, inProgress: 0, waitingResponse: 0, completed: 0, byType: { brochure: 0, jnf: 0, database: 0, drive: 0 } };
    const ps = workerStats?.pipelineStats || { interested: 0, under_communication: 0, head_review: 0, transferred_to_head: 0, recruitment_in_progress: 0, completed: 0 };
    
    return (
      <div className="max-w-6xl mx-auto space-y-8">
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

        {/* Section 1: Action Items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-[#1b4376]" /> My Action Items
            </h2>
            <Link href="/admin/tasks" className="text-sm font-bold text-[#1b4376] hover:text-[#15335b] flex items-center gap-1 group">
              Execute Tasks <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold text-amber-800 mb-1">Pending Assignments</p>
                <p className="text-4xl font-black text-amber-600">{ts.pending}</p>
              </div>
              <AlertTriangle className="text-amber-200 w-16 h-16 absolute right-[-10px] bottom-[-10px]" />
            </div>
            
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold text-indigo-800 mb-1">In Progress</p>
                <p className="text-4xl font-black text-[#1b4376]">{ts.inProgress}</p>
              </div>
              <Compass className="text-indigo-200 w-16 h-16 absolute right-[-10px] bottom-[-10px]" />
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-700 mb-1">Waiting on Company</p>
                <p className="text-4xl font-black text-slate-500">{ts.waitingResponse}</p>
              </div>
              <Clock className="text-slate-200 w-16 h-16 absolute right-[-10px] bottom-[-10px]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 2: Platform Pulse */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Globe className="text-blue-600" /> Platform Pulse
              </h2>
              <p className="text-sm text-gray-500 mt-1">Global view of all active companies</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Interested</span>
                  <span className="font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{ps.interested}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Under Communication</span>
                  <span className="font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{ps.under_communication}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Head Review</span>
                  <span className="font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">{ps.head_review}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Recruitment In Progress</span>
                  <span className="font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">{ps.recruitment_in_progress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Successfully Completed</span>
                  <span className="font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">{ps.completed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Operational Impact */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Target className="text-emerald-600" /> My Operational Impact
              </h2>
              <p className="text-sm text-gray-500 mt-1">Historical operations completed by you</p>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tasks Completed</p>
                  <p className="text-5xl font-black text-emerald-600 mt-1">{ts.completed}</p>
                </div>
                <CheckCircle2 className="text-emerald-100 w-20 h-20" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{ts.byType.brochure}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Brochures Sent</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{ts.byType.jnf}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">JNFs Sent</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{ts.byType.database}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">DBs Prepared</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-2xl font-bold text-gray-900">{ts.byType.drive}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Drives Setup</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- SUPER ADMIN VIEW ---
  const totalPending = reqStats.worker + reqStats.tpr;

  return (
    <div className="w-full max-w-none space-y-8">
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
          <div className={`p-3 rounded-lg transition-colors ${totalPending > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-gray-50 text-gray-400 group-hover:text-blue-500'}`}>
            <UserPlus size={24} />
          </div>
        </Link>

        <Link href="/admin/people" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Active Workers</p>
            <p className="text-2xl font-bold text-gray-900">{peopleStats.activeCoworkers}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 text-[#1b4376] group-hover:bg-blue-100 transition-colors">
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
          <Link href="/admin/companies" className="p-4 border-t border-gray-100 text-sm font-bold text-[#1b4376] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 group">
            View all companies <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-[#1b4376]" /> Team
            </h2>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">TPO Staff</span>
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
          <Link href="/admin/people" className="p-4 border-t border-gray-100 text-sm font-bold text-[#1b4376] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 group">
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
          <Link href="/admin/requests" className={`p-4 border-t text-sm font-bold flex items-center justify-center gap-1 transition-colors group ${totalPending > 0 ? 'border-amber-100 text-amber-700 hover:bg-amber-100' : 'border-gray-100 text-[#1b4376] hover:bg-blue-50'}`}>
            Review requests <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

      <div className={`rounded-xl p-4 border flex items-center justify-between ${
        successor ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          {successor ? <ShieldCheck className="text-[#1b4376] w-6 h-6" /> : <AlertTriangle className="text-amber-600 w-6 h-6" />}
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
            successor ? 'bg-[#1b4376] text-white hover:bg-[#15335b]' : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {successor ? 'Manage Settings' : 'Set Successor Now'}
        </Link>
      </div>

    </div>
  );
}
