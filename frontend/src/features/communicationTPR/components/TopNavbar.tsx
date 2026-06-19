'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';

export function TopNavbar() {
  const { user } = useCommunicationAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500">Communication TPR</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {user?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
        </div>
      </div>
    </header>
  );
}
