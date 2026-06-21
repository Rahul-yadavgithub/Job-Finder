'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
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
    <>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto max-md:pt-16">
        {children}
      </main>
    </>
  );
}
