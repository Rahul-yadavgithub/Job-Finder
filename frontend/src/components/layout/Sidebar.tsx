'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  History, 
  Briefcase,
  CloudUpload,
  Key,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sources', label: 'Scan Center', icon: Briefcase },
  { href: '/companies', label: 'Companies', icon: Database },
  { href: '/sync', label: 'Sync Center', icon: CloudUpload },
  { href: '/history', label: 'Scan History', icon: History },
  { href: '/api-config', label: 'API Config', icon: Key },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`group fixed md:sticky left-0 top-0 h-screen w-64 md:w-20 md:hover:w-64 bg-white border-r border-gray-200 rounded-r-[2rem] shadow-[4px_0_24px_rgba(0,0,0,0.04)] flex-shrink-0 flex flex-col z-50 transition-all duration-300 ease-in-out md:translate-x-0 overflow-x-hidden ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        {/* Mobile Close Button */}
        <button onClick={() => setIsMobileOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="px-5 py-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-3 whitespace-nowrap overflow-hidden">
            <div className="relative z-20 flex-shrink-0 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
                alt="NITH Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            </div>
            <div className="transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
              <h1 className="font-bold text-gray-900 leading-tight">TPR Portal</h1>
              <p className="text-xs text-gray-500 font-medium">NITH Portal</p>
            </div>
          </Link>

          {user && (
            <div className="flex flex-col items-center mt-6 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap md:pointer-events-none md:group-hover:pointer-events-auto overflow-hidden">
              <h2 className="text-base font-bold text-slate-800">{user.displayName || user.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-[#15335b] text-[11px] font-bold tracking-wide uppercase shadow-sm">
                  {user.role === 'branch_tpr' ? 'Branch TPR' : user.role}
                </span>
                {user.branchName && (
                  <span className="text-[11px] text-slate-600 font-bold tracking-wide uppercase bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                    {user.branchName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] overflow-hidden ${
                  isActive
                    ? 'bg-blue-50 text-[#15335b] shadow-sm border border-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#1b4376]' : 'text-gray-400'}`} />
                <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 overflow-hidden w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 justify-start"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
