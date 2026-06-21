'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminPost } from '@/lib/admin/api';
import { CheckCircle, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: 'caller',
    selfNote: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Date/Time State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score += 1;
    if (/[A-Za-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await adminPost<{ success: boolean }>('/auth/request-access', formData);
      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      if (error.response?.data?.message?.toLowerCase().includes('email')) {
        setEmailError(error.response.data.message);
      } else {
        alert(error.response?.data?.message || 'Failed to submit request');
      }
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

  if (success) {
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

        {/* Success Section */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f7f9] relative z-0">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-8 text-center overflow-hidden">
            <div className="w-16 h-16 bg-[#e6f0ff] rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <CheckCircle className="w-8 h-8 text-[#1b4376]" />
            </div>
            <h2 className="text-[1.35rem] font-bold text-slate-800 mb-2">Request Submitted</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              The Head TPO will review your request. You will receive an email confirmation once your account has been approved.
            </p>
            <Link 
              href="/login"
              className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors"
            >
              &larr; Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f7f9] relative z-0">
        <div className="w-full max-w-[480px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-16 h-16 bg-[#e6f0ff] rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <ShieldCheck className="w-8 h-8 text-[#1b4376]" />
            </div>
            <h2 className="text-[1.35rem] font-bold text-slate-800">Request Staff Access</h2>
            <p className="text-sm text-slate-500 mt-1">Your request will be reviewed by the Head TPO.</p>
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm ${emailError ? 'ring-2 ring-red-400' : ''}`}
                  placeholder="name@nith.ac.in"
                />
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {emailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
                    title="Must contain at least 8 characters, one letter and one number"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 flex gap-1 h-1">
                    <div className={`flex-1 rounded-full ${strength >= 1 ? 'bg-red-400' : 'bg-slate-200'}`} />
                    <div className={`flex-1 rounded-full ${strength >= 3 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                    <div className={`flex-1 rounded-full ${strength >= 4 ? 'bg-green-500' : 'bg-slate-200'}`} />
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">Min 8 chars, 1 letter + 1 number</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <select
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                >
                  <option value="caller">Caller</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="assistant_tpo">Assistant TPO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note to Head TPO <span className="font-normal text-slate-400">(Optional)</span></label>
                <textarea
                  maxLength={300}
                  rows={3}
                  value={formData.selfNote}
                  onChange={(e) => setFormData({ ...formData, selfNote: e.target.value })}
                  className="block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm resize-none"
                  placeholder="Briefly describe your role and why you need access"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Submit Request</>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <Link href="/login" className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                &larr; Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
