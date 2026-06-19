'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminPost } from '@/lib/admin/api';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Eye, EyeOff, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'pending' | 'rejected' | 'suspended', message: string } | null>(null);

  // Use the user from auth context to redirect if already logged in
  const { user } = useAdminAuth();

  useEffect(() => {
    if (user) {
      if (user.isSuperAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/worker-dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await adminPost<{ success: boolean; data: any }>('/auth/login', { email, password });
      if (response.success) {
        await refreshUser(); // Fetch the newly logged in user context
        if (response.data.isSuperAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/worker-dashboard');
        }
      }
    } catch (err) {
      const error = err as AxiosError<{ success: boolean; message: string; status?: string }>;
      if (error.response?.data?.status) {
        setStatusMessage({
          type: error.response.data.status as any,
          message: error.response.data.message
        });
      } else {
        setStatusMessage({
          type: 'error',
          message: error.response?.data?.message || 'Invalid credentials'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 max-w-xl mx-auto md:max-w-none md:mx-0">
        <div className="mb-10">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">
            A
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">NITH TPR Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Official Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="you@nith.ac.in"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>

          {statusMessage && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 mt-4 ${
              statusMessage.type === 'pending' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              statusMessage.type === 'rejected' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="shrink-0 mt-0.5">
                {statusMessage.type === 'pending' ? <Info size={18} /> : 
                 statusMessage.type === 'rejected' ? <ShieldAlert size={18} /> :
                 <AlertCircle size={18} />}
              </div>
              <div className="text-sm font-medium">
                {statusMessage.message}
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Need access?{' '}
            <Link href="/request-access" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Request here &rarr;
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Context */}
      <div className="hidden md:flex flex-1 bg-gray-50 flex-col justify-center items-center p-12 text-center border-l border-gray-200">
        <div className="max-w-sm space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">TPO Staff Area</h2>
          <p className="text-gray-600 leading-relaxed">
            This portal is exclusively for the TPO office staff to manage TPRs, coordinate drives, and oversee operations.
          </p>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
            <p className="text-sm text-gray-500 mb-3">Student TPRs use a different portal.</p>
            <Link 
              href="/login" 
              className="inline-block w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Go to Student Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
