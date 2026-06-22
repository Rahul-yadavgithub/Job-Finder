'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminGet, adminPost } from '@/lib/admin/api';

export interface AdminUser {
  userId: string;
  id: string; // The backend 'me' route returns 'id' as well
  name: string;
  email: string;
  role: 'head' | 'caller' | 'coordinator';
  isSuperAdmin: boolean;
  isDesignatedSuccessor: boolean;
  designation: string;
  jumpedIn?: boolean;
  profilePhotoUrl?: string;
  displayName?: string;
  mobileNo?: string;
}

import { hasPermission, Permission } from '@/lib/admin/permissions';

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  unreadCount: number;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await adminGet<{ success: boolean; data: any }>('/auth/me');
      if (response.success && response.data) {
        setUser({
          userId: response.data.id,
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          isSuperAdmin: response.data.is_super_admin,
          isDesignatedSuccessor: response.data.designated_successor,
          designation: response.data.designation,
          jumpedIn: response.data.jumpedIn,
          profilePhotoUrl: response.data.profile_photo_url,
          displayName: response.data.display_name,
          mobileNo: response.data.mobile_no,
        });
        setUnreadCount(response.data.unreadNotifications || 0);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await adminPost('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const checkPermission = (permission: Permission) => {
    return hasPermission(user, permission);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, unreadCount, logout, refreshUser: fetchUser, checkPermission }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
