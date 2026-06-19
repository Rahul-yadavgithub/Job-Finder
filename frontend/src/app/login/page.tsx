'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleCheckLoading, setRoleCheckLoading] = useState(false);
  const [isCommTpr, setIsCommTpr] = useState(false);
  const [portalChoice, setPortalChoice] = useState<'branch' | 'communication'>('branch');
  
  const router = useRouter();

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
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password },
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
        window.location.href = '/branch-portal';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-slate-900 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          NITH Placement Portal
        </h2>
        <p className="mt-2 text-center text-sm text-blue-100">
          Sign in to access your branch dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-blue-900/5 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="tpr@nith.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  disabled={loading || roleCheckLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {isCommTpr && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Select Destination Portal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`
                    relative flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${portalChoice === 'branch' ? 'border-blue-500 bg-white shadow-sm' : 'border-transparent bg-indigo-100/50 hover:bg-indigo-100'}
                  `}>
                    <input type="radio" className="sr-only" checked={portalChoice === 'branch'} onChange={() => setPortalChoice('branch')} />
                    <span className={`text-xs font-bold ${portalChoice === 'branch' ? 'text-blue-700' : 'text-indigo-600'}`}>Branch Dashboard</span>
                  </label>
                  
                  <label className={`
                    relative flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${portalChoice === 'communication' ? 'border-indigo-500 bg-white shadow-sm' : 'border-transparent bg-indigo-100/50 hover:bg-indigo-100'}
                  `}>
                    <input type="radio" className="sr-only" checked={portalChoice === 'communication'} onChange={() => setPortalChoice('communication')} />
                    <span className={`text-xs font-bold ${portalChoice === 'communication' ? 'text-indigo-700' : 'text-indigo-600'}`}>Comm Dashboard</span>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || roleCheckLoading || !email || !password}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Sign in securely {isCommTpr && <ArrowRight className="w-4 h-4" />}</>
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <a href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                  Register here
                </a>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
