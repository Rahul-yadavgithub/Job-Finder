import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { toast } from 'sonner';

const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/recovery')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Try again.');
    }
    return Promise.reject(error);
  }
);

export async function adminGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const response = await api.get<T>(path, { params });
  return response.data;
}

export async function adminPost<T>(path: string, data?: any): Promise<T> {
  const response = await api.post<T>(path, data);
  return response.data;
}

export async function adminPatch<T>(path: string, data?: any): Promise<T> {
  const response = await api.patch<T>(path, data);
  return response.data;
}

export async function adminDelete<T>(path: string): Promise<T> {
  const response = await api.delete<T>(path);
  return response.data;
}

export default api;
