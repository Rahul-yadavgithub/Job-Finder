import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, ApiError } from './api';
import { User } from './types';

export const useUser = (redirectToLogin = true) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const userData = await fetchApi<User>('/auth/me');
        if (mounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load user');
          setLoading(false);
          if (redirectToLogin && err instanceof ApiError && err.status === 401) {
            router.push('/login');
          }
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [redirectToLogin, router]);

  return { user, loading, error };
};
