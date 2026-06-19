'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, MessageSquare, Building2, Send, Calendar, Network, Settings } from 'lucide-react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useCommunicationAuth();

  const navigation = [
    { name: 'Dashboard', href: '/communication-tpr/dashboard', icon: LayoutDashboard },
    { name: 'Companies', href: '/communication-tpr/companies', icon: Building2 },
    { name: 'Pipeline', href: '/communication-tpr/pipeline', icon: Network },
    { name: 'Requests Queue', href: '/communication-tpr/requests', icon: Send },
    { name: 'Calendar', href: '/communication-tpr/follow-ups', icon: Calendar },
    { name: 'Settings', href: '/communication-tpr/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 hidden md:flex">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            C
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Comm TPR</h1>
            <p className="text-xs text-gray-500 font-medium">NITH Portal</p>
          </div>
        </div>

        {user && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
