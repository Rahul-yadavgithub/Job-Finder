'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Define which paths should not display the sidebar
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/communication-tpr') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  if (isAuthPage) {
    return (
      <main className="flex-1 min-w-0 min-h-screen overflow-y-auto flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <div className="flex w-full h-screen bg-slate-50/50">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-20">
        <TopNavbar onOpenSidebar={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
