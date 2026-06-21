'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, MessageSquare, Building2, Send, Calendar, Network, Settings, X } from 'lucide-react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useCommunicationAuth();

  const navigation = [
    { name: 'Dashboard', href: '/communication-tpr/dashboard', icon: LayoutDashboard },
    { name: 'Companies', href: '/communication-tpr/companies', icon: Building2 },
    { name: 'Pipeline', href: '/communication-tpr/pipeline', icon: Network },
    { name: 'Requests Queue', href: '/communication-tpr/requests', icon: Send },
    { name: 'Approvals', href: '/communication-tpr/approvals', icon: MessageSquare },
    { name: 'Calendar', href: '/communication-tpr/follow-ups', icon: Calendar },
    { name: 'Settings', href: '/communication-tpr/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        
        {/* Mobile Close Button */}
        {onClose && (
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Placement Cell</h1>
            <p className="text-xs text-gray-500 font-medium">NITH Portal</p>
          </div>
        </div>

        {user && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-100 text-indigo-800 border-indigo-200">
              Communication TPR
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      </aside>
    </>
  );
}
