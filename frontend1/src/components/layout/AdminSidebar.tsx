'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  LogOut, LayoutDashboard, List, Settings, ShieldAlert, Crown, User, ShieldCheck,
  Building2, Users, ClipboardList, RefreshCw, Eye, CalendarDays
} from 'lucide-react';
import { adminPost } from '@/lib/admin/api';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAdminAuth();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (user?.isSuperAdmin) {
      fetchRequestStats();
      const interval = setInterval(fetchRequestStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchRequestStats = async () => {
    try {
      const res = await adminGet<{ success: boolean; data: { pending_worker_requests: number; pending_tpr_requests: number } }>('/user-requests/stats');
      if (res.success && res.data) {
        setPendingRequests(res.data.pending_worker_requests + res.data.pending_tpr_requests);
      }
    } catch (error) {
      // Silently handle polling errors to prevent console spam
    }
  };

  if (!user) return null;

  const getRoleBadge = () => {
    switch (user.role) {
      case 'head': return { text: 'Head TPO', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'coordinator': return { text: 'Coordinator', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'caller': return { text: 'Caller', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      default: return { text: 'Staff', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex h-screen fixed left-0 top-0 overflow-y-auto z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            A
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Admin Portal</h1>
            <p className="text-xs text-gray-500 font-medium">NITH TPR System</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4">
          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
          <div className="flex items-center mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
              {roleBadge.text}
            </span>
            {user.isSuperAdmin && (
              <Crown className="w-3.5 h-3.5 text-amber-500 ml-1.5" />
            )}
          </div>
          {user.isSuperAdmin && user.jumpedIn && (
            <div className="mt-2 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] uppercase tracking-wider font-bold py-1 px-2 rounded-md text-center">
              Jumped In Mode
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {user.isSuperAdmin && !user.jumpedIn ? (
          <>
            <NavItem 
              href="/admin/dashboard" 
              icon={<LayoutDashboard size={20} />} 
              label="Overview" 
              active={pathname === '/admin/dashboard'} 
            />
            <NavItem 
              href="/admin/companies" 
              icon={<Building2 size={20} />} 
              label="Companies" 
              active={pathname.startsWith('/admin/companies')} 
            />
            <NavItem 
              href="/admin/drives" 
              icon={<CalendarDays size={20} />} 
              label="Drives" 
              active={pathname.startsWith('/admin/drives')} 
            />
            <NavItem 
              href="/admin/people" 
              icon={<Users size={20} />} 
              label="People" 
              active={pathname.startsWith('/admin/people')} 
            />
            <NavItem 
              href="/admin/requests" 
              icon={<ClipboardList size={20} />} 
              label="Requests" 
              active={pathname.startsWith('/admin/requests')} 
              badge={pendingRequests > 0 ? pendingRequests : undefined}
            />
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">System</p>
            </div>
            <NavItem 
              href="/admin/audit-log" 
              icon={<List size={20} />} 
              label="Audit Log" 
              active={pathname === '/admin/audit-log'} 
            />
            <NavItem 
              href="/admin/settings/succession" 
              icon={<ShieldCheck size={20} />} 
              label="Succession Settings" 
              active={pathname === '/admin/settings/succession'} 
            />
          </>
        ) : (
          <>
            <NavItem 
              href="/admin/dashboard" 
              icon={<LayoutDashboard size={20} />} 
              label="Overview" 
              active={pathname === '/admin/dashboard'} 
            />
            <NavItem 
              href="/admin/companies" 
              icon={<Building2 size={20} />} 
              label="Companies" 
              active={pathname.startsWith('/admin/companies')} 
            />
            <NavItem 
              href="/admin/drives" 
              icon={<CalendarDays size={20} />} 
              label="Drives" 
              active={pathname.startsWith('/admin/drives')} 
            />
            <NavItem 
              href="/admin/people" 
              icon={<Users size={20} />} 
              label="Team" 
              active={pathname.startsWith('/admin/people')} 
            />
          </>
        )}

        {/* Jump In/Out Controls */}
        {user.isSuperAdmin && (
          <div className="pt-6 pb-2 border-t border-gray-100 mt-6">
            {!user.jumpedIn ? (
              <button
                onClick={async () => {
                  await adminPost('/auth/jump-in');
                  await refreshUser();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg transition-colors border border-indigo-200"
              >
                <Eye size={16} />
                Jump In
              </button>
            ) : (
              <button
                onClick={async () => {
                  await adminPost('/auth/jump-out');
                  await refreshUser();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg transition-colors border border-amber-200"
              >
                <LogOut size={16} className="rotate-180" />
                Jump Out
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${active ? 'text-indigo-600' : 'text-gray-400'}`}>
          {icon}
        </div>
        {label}
      </div>
      {badge !== undefined && (
        <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}
