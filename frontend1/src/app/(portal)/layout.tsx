'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { ManageProfileModal } from '@/components/admin/ManageProfileModal';
import { User } from 'lucide-react';

const PUBLIC_ADMIN_ROUTES = [
  '/login',
  '/request-access',
  '/forgot-password',
  '/reset-password',
  '/recovery/complete'
];

function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAdminAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isPublicRoute = PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push('/login');
    }
  }, [loading, user, isPublicRoute, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#1b4376] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we are on a protected route and not logged in, don't render content while redirecting
  if (!user && !isPublicRoute) {
    return null;
  }

  if (isPublicRoute) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <AdminSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      <main className="flex-1 w-full min-w-0 flex flex-col min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 rounded-b-[2rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)} 
            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {user && (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center bg-blue-50 shadow-sm"
              >
                {user.profilePhotoUrl ? (
                  <img src={user.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-[#1b4376]" />
                )}
              </button>
            )}
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1 w-full max-w-[100vw]">
          {children}
        </div>
      </main>
      
      <ManageProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        {children}
      </AdminGuard>
    </AdminAuthProvider>
  );
}
