'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { LoadingState } from './LoadingState';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useCommunicationAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null; // The interceptor or page component will handle redirection
  }

  return (
    <div className="flex min-h-screen bg-[#f5f7f9]">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      <div className="flex flex-1 flex-col md:pl-64 w-full min-w-0">
        <TopNavbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
