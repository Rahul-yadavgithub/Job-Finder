'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'branch_tpr' | 'caller' | 'head';
  branchId: string;
  branchCode: string;
  branchName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        // Assuming API sends cookies automatically
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          withCredentials: true
        });
        
        if (isMounted && res.data.success) {
          // Map backend response fields to AuthUser shape
          const data = res.data.data;
          setUser({
            userId: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            branchId: data.branchId || data.branchName, // Adjust depending on actual response
            branchCode: data.branchName?.toLowerCase() || '',
            branchName: data.branchName || ''
          });
        }
      } catch (error: any) {
        if (isMounted) {
          setUser(null);
          // Redirect to login on 401 if not already on an auth page or a different portal
          if (
            error.response?.status === 401 && 
            !pathname.startsWith('/login') && 
            !pathname.startsWith('/register') &&
            !pathname.startsWith('/communication-tpr') &&
            !pathname.startsWith('/forgot-password') &&
            !pathname.startsWith('/reset-password')
          ) {
            router.push('/login');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const logout = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (e: any) {
      if (e.message !== 'Network Error') {
        console.error('Logout error:', e);
      }
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
