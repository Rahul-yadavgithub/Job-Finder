'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  LogOut, LayoutDashboard, List, Settings, ShieldAlert, Crown, User, ShieldCheck,
  Building2, Users, ClipboardList, RefreshCw, Eye, CalendarDays, X, CheckSquare
} from 'lucide-react';
import { adminPost } from '@/lib/admin/api';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAdminAuth();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [coworkers, setCoworkers] = useState<{id: string, name: string, role: string}[]>([]);
  const [isLoadingCoworkers, setIsLoadingCoworkers] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

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

  const openImpersonateModal = async () => {
    setShowImpersonateModal(true);
    setIsLoadingCoworkers(true);
    try {
      const res = await adminGet<{ data: {id: string, name: string, role: string}[] }>('/people/coworkers');
      if (res.data) setCoworkers(res.data);
    } catch (error) {
      console.error('Failed to fetch coworkers', error);
    } finally {
      setIsLoadingCoworkers(false);
    }
  };

  const handleImpersonate = async (targetUserId: string) => {
    setIsJumping(true);
    try {
      await adminPost('/auth/jump-in', { targetUserId });
      await refreshUser();
      setShowImpersonateModal(false);
    } catch (error) {
      console.error('Jump in failed', error);
      alert('Failed to impersonate staff member.');
    } finally {
      setIsJumping(false);
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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <aside className={`group fixed left-0 top-0 h-screen w-64 md:w-20 md:hover:w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out md:translate-x-0 overflow-x-hidden ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        {/* Mobile Close Button */}
        {onClose && (
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="px-5 py-6 border-b border-gray-200">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-4 whitespace-nowrap overflow-hidden">
            <div className="relative z-20 flex-shrink-0 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
                alt="NITH Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            </div>
            <div className="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
              <h1 className="font-bold text-slate-800 leading-tight">TPO Head Portal</h1>
              <p className="text-xs text-slate-500 font-medium">NITH Portal</p>
            </div>
          </Link>
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
              href="/admin/tasks" 
              icon={<CheckSquare size={20} />} 
              label="My Tasks" 
              active={pathname.startsWith('/admin/tasks')} 
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
              label="Staff Directory" 
              active={pathname.startsWith('/admin/people')} 
            />
            <NavItem 
              href="/admin/requests" 
              icon={<ClipboardList size={20} />} 
              label="Access Requests" 
              active={pathname.startsWith('/admin/requests')} 
              badge={pendingRequests > 0 ? pendingRequests : undefined}
            />
            <div className="pt-4 pb-2 whitespace-nowrap overflow-hidden transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
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
              href="/admin/tasks" 
              icon={<CheckSquare size={20} />} 
              label="My Tasks" 
              active={pathname.startsWith('/admin/tasks')} 
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
              label="Staff Directory" 
              active={pathname.startsWith('/admin/people')} 
            />
            <NavItem 
              href="/admin/settings" 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={pathname.startsWith('/admin/settings')} 
            />
          </>
        )}

        {/* Impersonation Controls */}
        {(user.isSuperAdmin || user.jumpedIn) && (
          <div className="pt-6 pb-2 border-t border-gray-100 mt-6">
            {!user.jumpedIn ? (
              <button
                onClick={openImpersonateModal}
                className="w-full flex items-center gap-3 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg transition-all hover:scale-[1.02] border border-indigo-200 overflow-hidden justify-start"
              >
                <Eye size={16} className="flex-shrink-0" />
                <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  Impersonate Staff
                </span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  await adminPost('/auth/jump-out');
                  await refreshUser();
                }}
                className="w-full flex items-center gap-3 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg transition-all hover:scale-[1.02] border border-amber-200 overflow-hidden justify-start"
              >
                <LogOut size={16} className="rotate-180 flex-shrink-0" />
                <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  Exit Impersonation
                </span>
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 overflow-hidden w-full px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 justify-start"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            Sign Out
          </span>
        </button>
      </div>
      </aside>

      {/* Impersonation Selection Modal */}
      {showImpersonateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="text-indigo-600" /> Select Staff to Impersonate
              </h2>
              <button onClick={() => setShowImpersonateModal(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                You will be logged in exactly as the selected staff member. To return to the Head TPO view, click "Exit Impersonation" on the sidebar.
              </p>
              
              {isLoadingCoworkers ? (
                <div className="py-8 flex justify-center text-indigo-500">
                  <RefreshCw className="animate-spin w-8 h-8" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {coworkers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No staff members found.</p>
                  ) : (
                    coworkers.map(cw => (
                      <button
                        key={cw.id}
                        onClick={() => handleImpersonate(cw.id)}
                        disabled={isJumping}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-between group disabled:opacity-50"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{cw.name}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{cw.role}</p>
                        </div>
                        <span className="text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Select →
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] overflow-hidden ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
          {icon}
        </div>
        <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
          {label}
        </span>
      </div>
      {badge !== undefined && (
        <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}
