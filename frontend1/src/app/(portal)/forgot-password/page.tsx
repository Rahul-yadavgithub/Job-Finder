'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminPost } from '@/lib/admin/api';
import { Loader2, AlertCircle, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Date/Time State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminPost<{ success: boolean; message: string }>(
        '/auth/forgot-password',
        { email }
      );
      
      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      const error = err as AxiosError<{ success: boolean; message: string }>;
      setError(error.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = currentTime ? currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '';

  const formattedTime = currentTime ? currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : '';

  return (
    <div className="min-h-screen bg-[#eef1f5] flex flex-col font-sans">
      
      {/* Top Date/Time Bar */}
      <div className="w-full bg-[#1b4376] text-white py-1.5 px-4 sm:px-8 flex justify-end items-center text-xs sm:text-sm font-medium tracking-wide">
        {currentTime ? (
          <div className="flex items-center gap-3">
            <span>{formattedDate}</span>
            <span className="opacity-50">|</span>
            <span className="font-mono">{formattedTime}</span>
          </div>
        ) : (
          <div className="h-5"></div>
        )}
      </div>

      {/* Main Header */}
      <div className="w-full bg-white py-4 px-4 sm:px-8 relative z-10 border-b-2 border-[#1b4376]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4">
             <h1 className="text-xl sm:text-2xl font-bold text-slate-800">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="text-sm font-semibold text-slate-600">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-2" style={{ transform: 'translateY(15px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-4">
             <h1 className="text-xl sm:text-2xl font-bold text-[#1b4376]">National Institute of Technology Hamirpur</h1>
             <p className="text-sm font-semibold text-slate-600">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>

      {/* Forgot Password Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f7f9] relative z-0">
        <div className="w-full max-w-[420px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative z-10">
          
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-16 h-16 bg-[#e6f0ff] rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <ShieldCheck className="w-8 h-8 text-[#1b4376]" />
            </div>
            <h2 className="text-[1.35rem] font-bold text-slate-800">Forgot Password</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your registered email to receive a password reset link.</p>
          </div>

          <div className="px-8 pb-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="text-sm font-medium">If an account matches that email, a reset link has been sent. Please check your inbox.</p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      className="block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                      placeholder="Enter Registered Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Send Reset Link</>
                    )}
                  </button>
                </div>
                
                <div className="mt-4 pt-1 flex items-center justify-center">
                  <button type="button" onClick={() => router.push('/login')} className="flex items-center gap-1 text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
    </div>
    </div>
  );
}
