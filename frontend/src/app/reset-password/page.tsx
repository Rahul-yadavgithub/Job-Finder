'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
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
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        { id, token, newPassword },
        { withCredentials: true }
      );
      
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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

      {/* Reset Password Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f7f9] relative z-0">
        <div className="w-full max-w-[420px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-16 h-16 bg-[#e6f0ff] rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <ShieldCheck className="w-8 h-8 text-[#1b4376]" />
            </div>
            <h2 className="text-[1.35rem] font-bold text-slate-800">Set New Password</h2>
            <p className="text-sm text-slate-500 mt-1">Please enter your new password below.</p>
          </div>

          <div className="px-8 pb-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="text-sm font-medium">Your password has been successfully reset! You can now login with your new password.</p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] transition-all"
                >
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                
                {(!token || !id) && (
                   <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-start gap-3 mb-2">
                     <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                     <p className="text-sm font-medium">Invalid link. Please request a new password reset email.</p>
                   </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                      placeholder="New Password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading || !token || !id}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || !token || !id}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading || !token || !id || !newPassword || !confirmPassword}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Reset Password</>
                    )}
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
