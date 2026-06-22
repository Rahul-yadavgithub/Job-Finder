'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  Users, Building2, Activity, UserPlus, Star, AlertTriangle, ArrowRight, ShieldCheck, ClipboardList,
  Compass, Briefcase, MapPin, Calendar, LayoutDashboard, Globe, Target, CheckCircle2, Clock, ChevronRight
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
        <div className="h-40 bg-gray-200 rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
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
      <div className="w-full space-y-8 pb-10">
        
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <Activity size={300} className="-mt-10 -mr-10" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
                <Target size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {user.name}</h1>
              <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
                Manage your active assignments and monitor your operational impact across the platform.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white border border-white/20">
                {user.role === 'coordinator' ? 'staff' : user.role.replace('_', ' ')}
              </span>
              <span className="text-sm font-medium text-blue-200 capitalize">
                {user.designation === 'coordinator' ? 'staff' : user.designation?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Action Items Pipeline */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="text-[#1b4376]" size={20} /> Active Assignments</span>
            <Link href="/admin/tasks" className="text-sm font-bold text-[#1b4376] hover:text-[#15335b] flex items-center gap-1 group">
              Execute Tasks <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Pending Assignments */}
            <Link href="/admin/tasks" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#b45309] to-[#d97706] p-6 shadow-lg shadow-amber-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
              <AlertTriangle className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Pending Assignments</p>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <p className="text-4xl font-black text-white">{ts.pending}</p>
              </div>
            </Link>
            
            {/* Confirmed Drives */}
            <Link href="/admin/drives" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-6 shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
              <Building2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Confirmed Drives</p>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <p className="text-4xl font-black text-white">{workerStats?.confirmedDrivesCount || 0}</p>
              </div>
            </Link>

            {/* Waiting Response */}
            <Link href="/admin/tasks" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#334155] to-[#475569] p-6 shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
              <Clock className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Waiting Response</p>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <p className="text-4xl font-black text-white">{ts.waitingResponse}</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Section 2: Platform Pulse */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Globe className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Platform Pulse</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-0.5">Global Overview</p>
              </div>
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Target className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Operational Impact</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-0.5">Historical Metrics</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8 bg-emerald-50/50 rounded-xl p-6 border border-emerald-100">
                <div>
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Total Tasks Completed</p>
                  <p className="text-5xl font-black text-emerald-600 mt-2">{ts.completed}</p>
                </div>
                <CheckCircle2 className="text-emerald-300 w-16 h-16" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-gray-900">{ts.byType.brochure}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Brochures Sent</p>
                </div>
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-gray-900">{ts.byType.jnf}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">JNFs Sent</p>
                </div>
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-gray-900">{ts.byType.database}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">DBs Prepared</p>
                </div>
                <div className="bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-2xl font-black text-gray-900">{ts.byType.drive}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Drives Setup</p>
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
    <div className="w-full space-y-8 pb-10">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Activity size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <ShieldCheck size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Platform Overview</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Global administration dashboard. Monitor platform health, manage users, and review pending requests.
            </p>
          </div>
<<<<<<< HEAD
          
          {successor ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[200px]">
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Succession Active</p>
              <p className="text-lg font-bold truncate" title={successor.name}>{successor.name}</p>
            </div>
          ) : (
            <Link href="/admin/settings/succession" className="bg-rose-500/20 backdrop-blur-md border border-rose-500/50 hover:bg-rose-500/30 transition-colors rounded-xl p-4 min-w-[200px] cursor-pointer">
              <p className="text-rose-200 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Succession Warning</p>
              <p className="text-sm font-bold text-white">No Successor Set</p>
            </Link>
          )}
        </div>
=======
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

        <Link href="/admin/drives" className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:border-indigo-300 transition-colors group cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Confirmed Drives</p>
            <p className="text-2xl font-bold text-gray-900">{compStats.confirmed}</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <Building2 size={24} />
          </div>
        </Link>
>>>>>>> 9669482 (almost finish the function)
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Pending Requests */}
        <Link href="/admin/requests" className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${totalPending > 0 ? 'from-[#991b1b] to-[#dc2626] shadow-red-900/20' : 'from-[#1e3c72] to-[#2a5298] shadow-blue-900/20'} p-6 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10`}>
          <UserPlus className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Pending Requests</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <p className="text-4xl font-black text-white">{totalPending}</p>
            {totalPending > 0 && <span className="bg-white/20 text-white text-[10px] uppercase font-black px-2 py-1 rounded backdrop-blur-md">Action Needed</span>}
          </div>
        </Link>

        {/* Active Workers */}
        <Link href="/admin/people" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-6 shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Active Staff</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-white">{peopleStats.activeCoworkers}</p>
              <p className="text-[10px] text-blue-200 mt-1 uppercase tracking-wider font-bold">Includes Head TPO & Staff</p>
            </div>
            <ChevronRight className="text-white/50 group-hover:text-white transition-colors mb-2" />
          </div>
        </Link>

        {/* Total Companies */}
        <Link href="/admin/companies" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-6 shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
          <Building2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Total Companies</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <p className="text-4xl font-black text-white">{compStats.total}</p>
            <ChevronRight className="text-white/50 group-hover:text-white transition-colors" />
          </div>
        </Link>

        {/* Audit Log */}
        <Link href="/admin/audit-log" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#334155] p-6 shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
          <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Audit Events Today</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <p className="text-4xl font-black text-white">{auditToday}</p>
            <ChevronRight className="text-white/50 group-hover:text-white transition-colors" />
          </div>
        </Link>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Companies Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Building2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Companies</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Database Status</p>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <span className="text-gray-600 text-sm font-medium">Confirmed</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs">{compStats.confirmed}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <span className="text-gray-600 text-sm font-medium">Pending Review</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs">{compStats.pendingReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">Added Today</span>
              <span className="font-bold text-[#1b4376] bg-blue-50 px-3 py-1 rounded-full text-xs">{compStats.addedToday}</span>
            </div>
          </div>
          <Link href="/admin/companies" className="p-4 border-t border-gray-100 text-sm font-bold text-[#1b4376] bg-gray-50 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 group">
            View all companies <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Team Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-[#1b4376]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Team Roster</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Personnel Overview</p>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <span className="text-gray-600 text-sm font-medium">TPO Staff</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full text-xs">{peopleStats.coworkers}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-50">
              <span className="text-gray-600 text-sm font-medium">Branch TPRs</span>
              <span className="font-bold text-[#1b4376] bg-blue-50 px-3 py-1 rounded-full text-xs">{peopleStats.tprs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">Pending Approvals</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${totalPending > 0 ? 'text-amber-700 bg-amber-50' : 'text-gray-500 bg-gray-100'}`}>{totalPending}</span>
            </div>
          </div>
          <Link href="/admin/people" className="p-4 border-t border-gray-100 text-sm font-bold text-[#1b4376] bg-gray-50 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 group">
            Manage team <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Requests Summary */}
        <div className={`rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all ${totalPending > 0 ? 'bg-amber-50/20 border-amber-200 hover:shadow-md' : 'bg-white border-gray-200 hover:shadow-md'}`}>
          <div className={`p-6 border-b flex items-center gap-3 ${totalPending > 0 ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalPending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Pending Requests</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Access Control</p>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className={`flex justify-between items-center pb-2 border-b ${totalPending > 0 ? 'border-amber-100/50' : 'border-gray-50'}`}>
              <span className="text-gray-600 text-sm font-medium">Staff Requests</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${reqStats.worker > 0 ? 'text-rose-700 bg-rose-100' : 'text-gray-500 bg-gray-100'}`}>
                {reqStats.worker}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm font-medium">TPR Requests</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${reqStats.tpr > 0 ? 'text-amber-700 bg-amber-100' : 'text-gray-500 bg-gray-100'}`}>
                {reqStats.tpr}
              </span>
            </div>
          </div>
          <Link href="/admin/requests" className={`p-4 border-t text-sm font-bold flex items-center justify-center gap-1 transition-colors group ${totalPending > 0 ? 'border-amber-100 text-amber-800 bg-amber-50 hover:bg-amber-100' : 'border-gray-100 text-[#1b4376] bg-gray-50 hover:bg-blue-50'}`}>
            Review requests <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>

    </div>
  );
}
