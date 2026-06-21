'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminGet, adminPost } from '@/lib/admin/api';
import { CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function RecoveryCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<{ name: string; email: string; isExistingUser: boolean } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const response = await adminGet<{ success: boolean; data: any }>(`/transfer/check?token=${token}`);
        if (response.success) {
          setRequestData(response.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Link Invalid or Expired');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push('/login');
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestData && !requestData.isExistingUser && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSubmitLoading(true);
    try {
      await adminPost('/transfer/complete?token=' + token, {
        password: !requestData?.isExistingUser ? password : undefined
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete transfer');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-[#1b4376] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error === 'Invalid link' ? 'This setup link is malformed.' : 'This setup link is no longer valid.'}<br/>
            Contact the previous Head TPO to send a new link, or reach out to the system administrator.
          </p>
          <Link 
            href="/login"
            className="text-[#1b4376] font-medium hover:text-[#15335b]"
          >
            &larr; Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-green-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Complete</h2>
          <p className="text-gray-600 font-medium mb-6">
            You are now the Head TPO.
          </p>
          <p className="text-sm text-gray-500 bg-gray-50 py-3 rounded-lg border border-gray-100">
            Redirecting to login in {countdown}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-[480px] w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-[#1b4376] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Leadership Setup</h1>
          <p className="text-gray-600 font-medium bg-gray-50 py-2 px-4 rounded-lg inline-block border border-gray-200">
            Setting up account for: <span className="font-bold text-gray-900">{requestData?.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {requestData?.isExistingUser ? (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center mb-6">
              <p className="text-indigo-900 font-medium">
                Your existing co-worker account will be promoted to Head TPO.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
                  title="Must contain at least 8 characters, one letter and one number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all flex justify-center items-center mt-6 disabled:opacity-70"
          >
            {submitLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : requestData?.isExistingUser ? (
              'Complete Transfer'
            ) : (
              'Complete Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RecoveryCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1b4376] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RecoveryCompleteContent />
    </Suspense>
  );
}
