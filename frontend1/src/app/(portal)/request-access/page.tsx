'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminPost } from '@/lib/admin/api';
import { CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2, User, Mail, Lock, FileText, ShieldAlert, UserPlus } from 'lucide-react';
import { AxiosError } from 'axios';

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', designation: 'coordinator', selfNote: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Za-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const strength = calculateStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null); setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const response = await adminPost<{ success: boolean }>('/auth/request-access', formData);
      if (response.success) setSuccess(true);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      const msg = e.response?.data?.message || 'Failed to submit request';
      if (msg.toLowerCase().includes('email')) setEmailError(msg);
      else setError(msg);
    } finally { setLoading(false); }
  };

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  // Shared header
  const Header = () => (
    <>
      <div className="w-full bg-[#1a3a6e] text-white py-1 px-6 flex justify-between items-center text-[11px] tracking-wide border-b border-[#2a4a7e]">
        <span className="opacity-70 hidden sm:block">Ministry of Education, Government of India</span>
        {currentTime ? <span className="font-mono opacity-90">{fmt(currentTime)}&nbsp;&nbsp;|&nbsp;&nbsp;{fmtTime(currentTime)}</span> : <span className="h-4 w-48" />}
      </div>
      <div className="w-full bg-white border-b-[3px] border-[#1a3a6e] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 text-right hidden sm:block pr-4">
            <div className="text-[1.1rem] font-bold text-[#1a1a1a] leading-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</div>
            <div className="text-[0.72rem] text-[#555] mt-0.5">हमीरपुर, हिमाचल प्रदेश (भारत) – 177 005</div>
          </div>
          <div className="flex-shrink-0">
            <img src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" alt="NITH Logo" className="w-20 h-20 object-contain" />
          </div>
          <div className="flex-1 pl-4">
            <div className="text-[1.1rem] font-bold text-[#1a3a6e] leading-tight">National Institute of Technology Hamirpur</div>
            <div className="text-[0.72rem] text-[#555] mt-0.5">Hamirpur, Himachal Pradesh (India) – 177 005</div>
          </div>
        </div>
        <div className="bg-[#1a3a6e] text-center py-1.5">
          <span className="text-white text-[11px] font-semibold tracking-[0.15em] uppercase">Training &amp; Placement Office (TPO) — Admin Portal</span>
        </div>
      </div>
    </>
  );

  if (success) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f0f2f5]" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center py-10 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom z-0" style={{ backgroundImage: "url('/nith.jpg')" }} />
          <div className="absolute inset-0 bg-[#0d1f3c]/65 z-0" />
          <div className="relative z-10 w-full max-w-[440px]">
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden">
              <div className="bg-[#1a3a6e] px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                <div>
                  <h2 className="text-white font-bold text-[15px]">Request Submitted</h2>
                  <p className="text-blue-200 text-[11px] mt-0.5">Pending approval from Head TPO</p>
                </div>
              </div>
              <div className="h-[3px] bg-gradient-to-r from-[#c9a84c] via-[#f0d060] to-[#c9a84c]" />
              <div className="px-7 py-6 space-y-4">
                <div className="bg-green-50 border border-green-300 p-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-[13px] text-green-800 font-semibold mb-1">Access Request Received</p>
                  <p className="text-[12px] text-green-700">The Head TPO will review your request. You will receive an email confirmation once your account is approved.</p>
                </div>
                <Link href="/login"
                  className="w-full py-2.5 bg-[#1a3a6e] hover:bg-[#122d58] text-white font-bold text-[14px] tracking-wide transition-colors flex items-center justify-center gap-2">
                  ← Return to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#1a3a6e] text-white/60 text-center py-2 text-[10px] tracking-wide">
          © {new Date().getFullYear()} National Institute of Technology Hamirpur. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f2f5]" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Header />

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1f3c]/75 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl border border-slate-200">
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#1a3a6e] animate-spin" />
              <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-[#1a3a6e]" />
            </div>
            <p className="font-bold text-[#1a3a6e] text-base">Submitting Request...</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom z-0" style={{ backgroundImage: "url('/nith.jpg')" }} />
        <div className="absolute inset-0 bg-[#0d1f3c]/65 z-0" />

        <div className="relative z-10 w-full max-w-[480px]">
          <div className="bg-white/95 backdrop-blur-xl shadow-2xl border border-white/40 overflow-hidden">

            <div className="bg-[#1a3a6e] px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-[15px] leading-tight">Request Staff Access</h2>
                <p className="text-blue-200 text-[11px] mt-0.5">Subject to approval by Head TPO</p>
              </div>
            </div>
            <div className="h-[3px] bg-gradient-to-r from-[#c9a84c] via-[#f0d060] to-[#c9a84c]" />

            <div className="px-7 py-5 space-y-3.5">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 flex items-start gap-2.5 text-[13px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                    placeholder="Full name as per institute records" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Official Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2.5 border bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400 ${emailError ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="name@nith.ac.in" />
                </div>
                {emailError && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {emailError}</p>}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Designation *</label>
                <select required value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] appearance-none">
                  <option value="coordinator">Staff / Coordinator</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required minLength={8}
                    pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
                    title="Min 8 characters, at least 1 letter and 1 number"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                    placeholder="Minimum 8 characters (letters + numbers)" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-1.5 flex gap-1 h-1">
                    <div className={`flex-1 ${strength >= 1 ? 'bg-red-400' : 'bg-slate-200'}`} />
                    <div className={`flex-1 ${strength >= 3 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                    <div className={`flex-1 ${strength >= 4 ? 'bg-green-500' : 'bg-slate-200'}`} />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showConfirmPassword ? 'text' : 'password'} required
                    value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400"
                    placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Note to Head TPO <span className="font-normal text-slate-400 normal-case">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea maxLength={300} rows={3}
                    value={formData.selfNote} onChange={e => setFormData({ ...formData, selfNote: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 text-[13px] focus:outline-none focus:border-[#1a3a6e] focus:ring-1 focus:ring-[#1a3a6e] placeholder-slate-400 resize-none"
                    placeholder="Briefly describe your role and reason for access" />
                </div>
              </div>

              <button type="button" onClick={handleSubmit as any} disabled={loading}
                className="w-full py-2.5 bg-[#1a3a6e] hover:bg-[#122d58] text-white font-bold text-[14px] tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Access Request'}
              </button>

              <div className="flex justify-center pt-1 border-t border-slate-200">
                <Link href="/login" className="text-[12px] text-[#1a3a6e] hover:underline font-medium">← Back to Login</Link>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-white/75 text-[11px] px-1">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Access requests are reviewed and approved by the Head TPO. Only authorized TPO staff may register.</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a3a6e] text-white/60 text-center py-2 text-[10px] tracking-wide">
        © {new Date().getFullYear()} National Institute of Technology Hamirpur. All rights reserved. &nbsp;|&nbsp; Training &amp; Placement Office
      </div>
    </div>
  );
}
