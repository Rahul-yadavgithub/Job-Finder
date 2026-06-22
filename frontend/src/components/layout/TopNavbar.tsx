'use client';

import React, { useState } from 'react';
import { Menu, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { ManageProfileModal } from './ManageProfileModal';

interface TopNavbarProps {
  onOpenSidebar?: () => void;
}

export function TopNavbar({ onOpenSidebar }: TopNavbarProps) {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex flex-col w-full bg-white/90 backdrop-blur-md border-b border-slate-200 rounded-b-[2rem] shadow-[0_8px_24px_rgba(0,0,0,0.04)] h-16">
        <header className="flex h-full w-full items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenSidebar} 
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            {user && (
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center bg-blue-50 shadow-sm"
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
      </div>
      
      <ManageProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}
