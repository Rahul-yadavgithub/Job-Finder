'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { NotificationBell } from './NotificationBell';

export function TopNavbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { user } = useCommunicationAuth();

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm">

      {/* Main Navbar */}
      <header className="flex h-14 w-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onOpenSidebar} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />

          <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
              <span className="text-xs text-gray-500">Communication TPR</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
