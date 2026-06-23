'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminPost } from '@/lib/admin/api';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Eye, EyeOff, AlertCircle, Info, ShieldAlert, ShieldCheck, Loader2, RefreshCw, Lock, Mail } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser, user } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'pending' | 'rejected' | 'suspended', message: string } | null>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaText(result);
    setCaptchaInput('');
  };

  useEffect(() => { generateCaptcha(); }, []);

  useEffect(() => {
    setCurrentTime(new Date());
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) router.replace(user.isSuperAdmin ? '/admin/dashboard' : '/worker-dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    if (captchaInput !== captchaText) {
      setStatusMessage({ type: 'error', message: 'Invalid captcha. Please try again.' });
      generateCaptcha(); setLoading(false); return;
    }
    try {
      const response = await adminPost<{ success: boolean; data: any }>('/auth/login', { email, password, portal: 'admin' });
      if (response.success) {
        await refreshUser();
        router.push(response.data.isSuperAdmin ? '/admin/dashboard' : '/worker-dashboard');
      }
    } catch (err) {
      const error = err as AxiosError<{ success: boolean; message: string; status?: string }>;
      setStatusMessage({
        type: (error.response?.data?.status as any) || 'error',
        message: error.response?.data?.message || 'Invalid credentials'
      });
    } finally { setLoading(false); }
  };

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f2f5]" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Top utility bar */}
      <div className="w-full bg-[#1a3a6e] text-white py-1 px-6 flex justify-between items-center text-[11px] tracking-wide border-b border-[#2a4a7e]">
        <span className="opacity-70 hidden sm:block">Ministry of Education, Government of India</span>
        {currentTime ? (
          <span className="font-mono opacity-90">{fmt(currentTime)}&nbsp;&nbsp;|&nbsp;&nbsp;{fmtTime(currentTime)}</span>
        ) : <span className="h-4 w-48" />}
      </div>

      {/* Main Header */}
      <div className="w-full bg-white border-b-[3px] border-[#1a3a6e] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 text-right hidden sm:block pr-4">
            <div className="text-[1.1rem] font-bold text-[#1a1a1a] leading-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</div>
            <div className="text-[0.72rem] text-[#555] mt-0.5">हमीरपुर, हिमाचल प्रदेश (भारत) – 177 005</div>
          </div>
          <div className="flex-shrink-0">
            <img src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp"
              alt="NITH Logo" className="w-20 h-20 object-contain" />
          </div>
          <div className="flex-1 pl-4">
            <div className="text-[1.1rem] font-bold text-[#1a3a6e] leading-tight">National Institute of Technology Hamirpur</div>
            <div className="text-[0.72rem] text-[#555] mt-0.5">Hamirpur, Himachal Pradesh (India) – 177 005</div>
          </div>
        </div>
        <div className="bg-[#1a3a6e] text-center py-1.5">
          <span className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase">
            Training &amp; Placement Office (TPO) — Admin Portal
          </span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1f3c]/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl border border-slate-200">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#1a3a6e] animate-spin" />
              <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-[#1a3a6e]" />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#1a3a6e] text-base">Authenticating...</p>
              <p className="text-slate-500 text-xs mt-1">Please wait while we verify your credentials</p>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom z-0" style={{ backgroundImage: "url('/nith.jpg')" }} />
        <div className="absolute inset-0 bg-[#0d1f3c]/65 z-0" />

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="bg-white/95 backdrop-blur-xl shadow-2xl border border-white/40 overflow-hidden">

            {/* Card header */}
            <div className="bg-[#1a3a6e] px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-[15px] leading-tight">Staff Login</h2>
                <p className="text-blue-200 text-[11px] mt-0.5">Authorized TPO personnel only</p>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-[#c9a84c] via-[#f0d060] to-[#c9a84c]" />

            <div className="px-7 py-6 space-y-4">

              {statusMessage && (
                <div className={`px-4 py-3 border flex items-start gap-2.5 text-[13px] ${
                  statusMessage.type === 'pending' ? 'bg-blue-50 border-blue-300 text-blue-800' :
                  statusMessage.type === 'rejected' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                  statusMessage.type === 'suspended' ? 'bg-orange-50 border-orange-300 text-orange-800' :
                  'bg-red-50 border-red-300 text-red-700'
                }`}>
                  {statusMessage.type === 'pending' ? <Info className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                   statusMessage.type === 'rejected' ? <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                   <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>{statusMessage.message}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Official Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                    placeholder="Enter your official email"
                    value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                    placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Captcha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Security Verification *</label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-[#eef1f5] border border-slate-300 h-10 flex items-center justify-center relative overflow-hidden select-none">
                    <div className="absolute inset-0 opacity-30">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="8" x2="100%" y2="32" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="15%" y1="0" x2="85%" y2="40" stroke="#94a3b8" strokeWidth="1" />
                        <line x1="0" y1="38" x2="100%" y2="5" stroke="#94a3b8" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="font-mono text-[18px] font-bold italic tracking-[0.35em] text-slate-700 blur-[0.4px] relative z-10 select-none">
                      {captchaText}
                    </span>
                  </div>
                  <button type="button" onClick={generateCaptcha}
                    className="px-3 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-500" title="Refresh Captcha">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <input type="text" required
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                  placeholder="Type the characters shown above"
                  value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} disabled={loading} />
              </div>

              {/* Submit */}
              <button type="button" onClick={handleSubmit as any}
                disabled={loading || !email || !password || !captchaInput}
                className="w-full py-2.5 bg-[#1a3a6e] hover:bg-[#122d58] text-white font-bold text-[14px] tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login to Admin Portal'}
              </button>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <Link href="/request-access" className="text-[12px] text-[#1a3a6e] hover:underline font-medium">
                  Request Staff Access
                </Link>
                <Link href="/forgot-password" className="text-[12px] text-[#1a3a6e] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-white/75 text-[11px] px-1">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>This is a restricted government portal. Unauthorized access attempts are logged and may be subject to legal action under the IT Act.</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a3a6e] text-white/60 text-center py-2 text-[10px] tracking-wide">
        © {new Date().getFullYear()} National Institute of Technology Hamirpur. All rights reserved. &nbsp;|&nbsp; Training &amp; Placement Office
      </div>
    </div>
  );
}
