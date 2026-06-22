'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight, Globe, BarChart2, Home, Eye, EyeOff, RefreshCw, Check } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleCheckLoading, setRoleCheckLoading] = useState(false);
  const [isCommTpr, setIsCommTpr] = useState(false);
  const [portalChoice, setPortalChoice] = useState<'branch' | 'communication'>('branch');
  
  // Dummy Captcha State
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Dynamic Text Swap State
  const [isHindiLeft, setIsHindiLeft] = useState(true);

  // Date/Time State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  const router = useRouter();

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
  };

  useEffect(() => {
    generateCaptcha();
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setIsHindiLeft(prev => !prev);
    }, 4000);
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    
    setRoleCheckLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-role/${email}`);
      if (res.data.success && res.data.role === 'communication_tpr' && res.data.status === 'approved') {
        setIsCommTpr(true);
        setPortalChoice('communication');
      } else {
        setIsCommTpr(false);
        setPortalChoice('branch');
      }
    } catch (err) {
      console.error('Failed to check role', err);
    } finally {
      setRoleCheckLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check dummy captcha
    if (captchaInput !== captchaText) {
      setError('Invalid captcha, please try again.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password, portal: 'base' },
        { withCredentials: true }
      );
      
      const { commToken } = res.data.data || {};
      
      if (isCommTpr && portalChoice === 'communication') {
        if (commToken) {
          localStorage.setItem('comm_tpr_token', commToken);
        }
        window.location.href = '/communication-tpr/dashboard';
      } else {
        // Force a hard refresh to re-evaluate AuthContext and layout
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      generateCaptcha();
      setCaptchaInput('');
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
        <div className="w-full max-w-[95%] xl:max-w-[85%] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          
          <div className="flex-1 hidden sm:flex flex-col items-end mr-4 sm:mr-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-slate-800 text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005</p>
          </div>

          <div className="relative z-20 flex-shrink-0 bg-white rounded-full p-[clamp(0.25rem,0.5vw,0.75rem)] shadow-md" style={{ transform: 'translateY(15px)' }}>
            <img 
              src="https://res.cloudinary.com/dzbliymin/image/upload/v1781725894/logonith_gb3opv.webp" 
              alt="NITH Logo" 
              className="object-contain w-[clamp(4.5rem,6vw,7rem)] h-[clamp(4.5rem,6vw,7rem)] transition-all duration-300"
            />
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start sm:ml-[clamp(1rem,2vw,2rem)]">
             <h1 className="font-bold text-[#1b4376] text-[clamp(1.15rem,1.5vw,2rem)] leading-tight tracking-tight">National Institute of Technology Hamirpur</h1>
             <p className="font-semibold text-slate-600 text-[clamp(0.7rem,0.8vw,1rem)] mt-0.5">Hamirpur, Himachal Pradesh (India) - 177 005</p>
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
            <h2 className="text-[1.35rem] font-bold text-slate-800">TPR Portal Login</h2>
            <p className="text-sm text-slate-500 mt-1">This portal is restricted to authorized TPR students only.</p>
          </div>

          <div className="px-8 pb-8">
            <form className="space-y-4" onSubmit={handleLogin}>
              
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
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    disabled={loading || roleCheckLoading}
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
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center shadow-inner">
                           <Check className="w-3 h-3 text-slate-600" />
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {isCommTpr && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300 mt-2">
                  <label className="block text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Select Destination Portal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`
                      relative flex flex-col items-center justify-center p-3 rounded-[4px] border-2 cursor-pointer transition-all
                      ${portalChoice === 'branch' ? 'border-[#1b4376] bg-white shadow-sm' : 'border-transparent bg-blue-100/50 hover:bg-blue-100'}
                    `}>
                      <input type="radio" className="sr-only" checked={portalChoice === 'branch'} onChange={() => setPortalChoice('branch')} />
                      <span className={`text-xs font-bold ${portalChoice === 'branch' ? 'text-[#1b4376]' : 'text-[#1b4376]'}`}>Branch Dashboard</span>
                    </label>
                    
                    <label className={`
                      relative flex flex-col items-center justify-center p-3 rounded-[4px] border-2 cursor-pointer transition-all
                      ${portalChoice === 'communication' ? 'border-[#1b4376] bg-white shadow-sm' : 'border-transparent bg-blue-100/50 hover:bg-blue-100'}
                    `}>
                      <input type="radio" className="sr-only" checked={portalChoice === 'communication'} onChange={() => setPortalChoice('communication')} />
                      <span className={`text-xs font-bold ${portalChoice === 'communication' ? 'text-[#1b4376]' : 'text-[#1b4376]'}`}>Comm Dashboard</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading || roleCheckLoading || !email || !password || !captchaInput}
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
                <button type="button" onClick={() => router.push('/register')} className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                  Don't have an account? Register
                </button>
                <button type="button" onClick={() => router.push('/forgot-password')} className="text-[13px] font-medium text-[#2e5e9b] hover:text-[#1b4376] transition-colors">
                  Forgot Password?
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
