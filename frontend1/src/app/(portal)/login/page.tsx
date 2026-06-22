'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminPost } from '@/lib/admin/api';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Eye, EyeOff, AlertCircle, Info, ShieldAlert, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { AxiosError } from 'axios';

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser, user } = useAdminAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'pending' | 'rejected' | 'suspended', message: string } | null>(null);

  // Captcha State
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Date/Time State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

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

    if (captchaInput !== captchaText) {
      setStatusMessage({ type: 'error', message: 'Invalid captcha. Please try again.' });
      generateCaptcha();
      setLoading(false);
      return;
    }

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

      {/* Full Page Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#15335b]/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center gap-6 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg tracking-wide">Processing Request...</p>
              <p className="text-blue-200 text-sm mt-1">Please wait while we verify your credentials</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-0 overflow-hidden">
        
        {/* Animated Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-bg-zoom z-[-2]"
          style={{ backgroundImage: "url('/nith.jpg')" }}
        ></div>

        {/* Dark overlay for better form readability */}
        <div className="absolute inset-0 bg-[#15335b]/60 z-[-1]"></div>

        <div className="w-full max-w-[420px] bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden relative z-10">
          
          <div className="px-8 pt-8 pb-4 text-center">
            <h2 className="text-[1.35rem] font-bold text-slate-800">TPO Admin Portal</h2>
            <p className="text-sm text-slate-500 mt-1">This portal is restricted to authorized TPO staff only.</p>
          </div>

          <div className="px-8 pb-8">
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {statusMessage && (
                <div className={`px-4 py-3 rounded-lg border flex items-start gap-3 ${
                  statusMessage.type === 'pending' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                  statusMessage.type === 'rejected' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  'bg-red-50 border-red-200 text-red-600'
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

              <div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="block w-full px-4 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                    placeholder="Enter Official Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
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

              {/* Dummy Captcha Section */}
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[13px] font-bold text-slate-700 whitespace-nowrap min-w-[70px]">Captcha :</label>
                  <div className="flex-1 flex items-center bg-[#f4f6f8] rounded-[4px] p-1 border border-slate-200/50">
                    <div 
                      className="w-full bg-[#eef1f5] rounded h-10 flex items-center justify-center relative overflow-hidden"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='40' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`
                      }}
                    >
                      {/* Random lines for obfuscation */}
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                         <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                           <line x1="0" y1="10" x2="100%" y2="30" stroke="#94a3b8" strokeWidth="1.5" />
                           <line x1="10" y1="0" x2="80%" y2="40" stroke="#94a3b8" strokeWidth="1" />
                           <line x1="0" y1="40" x2="100%" y2="0" stroke="#94a3b8" strokeWidth="1" />
                         </svg>
                      </div>
                      <span className="text-slate-600 tracking-[0.4em] font-mono text-[17px] font-bold italic relative z-10 select-none blur-[0.3px]">
                        {captchaText}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={generateCaptcha}
                      className="ml-2 p-1.5 text-[#2b5a9e] hover:bg-blue-50 rounded transition-colors"
                      title="Reload Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                   <div className="min-w-[70px] hidden sm:block"></div>
                   <div className="flex-1 relative">
                      <input
                        type="text"
                        required
                        className="block w-full pl-4 pr-10 py-3 border-none bg-[#f4f6f8] rounded-[4px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b4376] transition-colors text-sm"
                        placeholder="Enter Captcha"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        disabled={loading}
                      />
                   </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[4px] shadow-sm text-[15px] font-bold text-white bg-[#2e5e9b] hover:bg-[#1b4376] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b4376] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Login</>
                  )}
                </button>
              </div>
              
              <div className="mt-4 pt-1 flex items-center justify-between">
                <Link href="/request-access" className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                  Need access? Request here
                </Link>
                <Link href="/forgot-password" className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
