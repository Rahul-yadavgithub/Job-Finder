'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminPost } from '@/lib/admin/api';
import { Loader2, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';

function AdminResetPasswordContent() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  // Date/Time State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token || !id) {
      setError('Invalid or missing password reset link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminPost<{ success: boolean; message: string }>(
        '/auth/reset-password',
        { id, token, newPassword }
      );
      
      if (res.success) {
        setSuccess(true);
        // Automatically redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      const error = err as AxiosError<{ success: boolean; message: string }>;
      setError(error.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#1b4376] selection:text-white">
      
      {/* Top Date/Time Bar */}
      <div className="w-full bg-gradient-to-r from-[#1b4376] to-[#2e5e9b] text-white py-2 px-4 sm:px-8 flex justify-end items-center text-xs sm:text-sm font-medium tracking-wide shadow-sm">
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
      <div className="w-full bg-white/80 backdrop-blur-md py-4 px-4 sm:px-8 relative z-20 border-b border-slate-200/60 shadow-sm">
        <div className="w-full max-w-[95%] xl:max-w-[85%] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4 sm:mr-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-slate-800 text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="font-semibold text-slate-500 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-30 flex-shrink-0 bg-white rounded-full p-[clamp(0.25rem,0.5vw,0.75rem)] shadow-[0_0_15px_rgba(27,67,118,0.15)] transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="object-contain w-[clamp(4.5rem,6vw,7rem)] h-[clamp(4.5rem,6vw,7rem)]"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-[#1b4376] text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">National Institute of Technology Hamirpur</h1>
             <p className="font-semibold text-slate-500 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">Hamirpur, Himachal Pradesh (India) - 177 005</p>
          </div>
          
        </div>
      </div>

      {/* Reset Password Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none" />
        
        <div className="w-full max-w-[440px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden relative z-10 transition-all duration-500 hover:shadow-[0_20px_50px_-15px_rgba(27,67,118,0.15)]">
          
          {/* Header Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1b4376] via-blue-500 to-[#2e5e9b]"></div>
          
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e6f0ff] to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-100 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck className="w-8 h-8 text-[#1b4376]" strokeWidth={2.5} />
            </div>
            <h2 className="text-[1.5rem] font-extrabold text-slate-800 tracking-tight">Secure New Password</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Create a strong password to protect your account.</p>
          </div>

          <div className="px-8 pb-10">
            {success ? (
              <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-50/80 border border-green-200/80 text-green-700 px-6 py-8 rounded-xl flex flex-col items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent"></div>
                  <div className="relative">
                    <CheckCircle2 className="w-14 h-14 text-green-500 animate-bounce" />
                  </div>
                  <p className="text-[15px] font-semibold">Password Successfully Reset!</p>
                  <p className="text-xs text-green-600/80">Redirecting you to the login page...</p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleResetPassword}>
                
                {(!token || !id) && (
                   <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3.5 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
                     <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                     <p className="text-[13px] font-medium leading-relaxed">Invalid or missing reset link. Please request a new link.</p>
                   </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-4 pr-12 py-3.5 border border-slate-200 bg-slate-50/50 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376]/20 focus:border-[#1b4376] transition-all duration-300 text-sm font-medium hover:bg-slate-50"
                      placeholder="New Password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-[#1b4376] z-20 transition-colors cursor-pointer"
                      onMouseDown={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className={`text-[11px] mt-1 font-semibold pl-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-slate-500'}`}>
                      {newPassword.length >= 8 ? '✓ Password length is sufficient' : `Password must be at least 8 characters (currently ${newPassword.length})`}
                    </div>
                  )}

                  <div className="relative group pt-2">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-4 pr-12 py-3.5 border border-slate-200 bg-slate-50/50 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376]/20 focus:border-[#1b4376] transition-all duration-300 text-sm font-medium hover:bg-slate-50"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400 hover:text-[#1b4376] z-20 transition-colors cursor-pointer"
                      onMouseDown={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
                      onClick={(e) => e.preventDefault()}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className={`text-[11px] mt-1 font-semibold pl-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md shadow-blue-900/10 text-[15px] font-bold text-white bg-gradient-to-r from-[#1b4376] to-[#2e5e9b] hover:from-[#15345c] hover:to-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Update Password
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
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

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eef1f5] flex items-center justify-center">Loading...</div>}>
      <AdminResetPasswordContent />
    </Suspense>
  );
}
