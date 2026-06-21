'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CommunicationTPRUser } from '../types';
import { commApi } from '../services/api';

interface AuthContextType {
  user: CommunicationTPRUser | null;
  loading: boolean;
  login: (token: string, userData: CommunicationTPRUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function CommunicationAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CommunicationTPRUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await commApi.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await commApi.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  };

  const login = (token: string, userData: CommunicationTPRUser) => {
    setUser(userData);
    router.push('/communication-tpr/dashboard');
  };

  const logout = async () => {
    try {
      await commApi.post('/auth/logout');
    } catch (error: any) {
      if (error.message !== 'Network Error') {
        console.error('Logout failed', error);
      }
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCommunicationAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCommunicationAuth must be used within a CommunicationAuthProvider');
  }
  return context;
}
