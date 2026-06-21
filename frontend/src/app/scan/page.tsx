'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Play, Loader2, CheckCircle2, XCircle, Activity, Globe, Zap, Shield, Database } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ScanCenterPage() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'completed' | 'error'>('idle');

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sources`);
      return res.data;
    }
  });

  const activeSourcesCount = sources.filter((s: any) => s.status !== 'error').length || 10;

  const triggerScan = useMutation({
    mutationFn: async () => {
      setScanStatus('scanning');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/scan/trigger`, {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      setTimeout(() => setScanStatus('completed'), 8000);
    },
    onError: () => {
      setScanStatus('error');
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[85vh]">
      <div className="text-center mb-10 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100 mb-2"
        >
          <Activity className="w-4 h-4" />
          <span>Intelligence Engine Ready</span>
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
          Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-[#1b4376]">Center</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Deploy deterministic scrapers across the global and Indian hiring ecosystems to enrich your placement database.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Stats/Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 space-y-4"
        >
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Active Platforms</h3>
              <p className="text-slate-500 text-sm">{activeSourcesCount} configured sources ready for extraction</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-[#1b4376]">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Concurrent Limit</h3>
              <p className="text-slate-500 text-sm">2 Global Browser Instances</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Deduplication</h3>
              <p className="text-slate-500 text-sm">Active AI merging & signal detection</p>
            </div>
          </div>
        </motion.div>

        {/* Center: The Main Action Console */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 w-full bg-slate-900 p-1 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
        >
          {/* Animated Background Gradients */}
          <div className="absolute top-0 -left-1/4 w-full h-full bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-1000"></div>
          <div className="absolute bottom-0 -right-1/4 w-full h-full bg-gradient-to-tl from-[#1b4376]/30 to-transparent blur-3xl opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-1000"></div>

          <div className="bg-slate-900/80 backdrop-blur-xl w-full h-full rounded-[2.4rem] border border-slate-800 p-12 min-h-[500px] flex flex-col items-center justify-center relative z-10">
            
            {scanStatus === 'idle' && (
              <motion.div 
                className="relative flex flex-col items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Radar Rings */}
                <div className="absolute inset-0 rounded-full border border-blue-500/20 scale-150 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute inset-0 rounded-full border border-blue-500/10 scale-125 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
                
                <button 
                  onClick={() => triggerScan.mutate()}
                  className="relative z-10 flex items-center justify-center w-56 h-56 bg-gradient-to-br from-blue-500 to-[#1b4376] rounded-full shadow-[0_0_80px_rgba(59,130,246,0.5)] border border-blue-400/30 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out"></div>
                  <div className="flex flex-col items-center text-white relative z-20">
                    <Play className="w-16 h-16 mb-2 fill-current ml-3 drop-shadow-lg" />
                    <span className="font-bold text-lg tracking-[0.2em] uppercase drop-shadow-md">Engage</span>
                  </div>
                </button>
              </motion.div>
            )}

            {scanStatus === 'scanning' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-lg flex flex-col items-center"
              >
                <div className="relative mb-12">
                  <div className="w-32 h-32 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-blue-400 animate-pulse" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-3 text-white tracking-tight">Deploying Agents...</h3>
                <p className="text-slate-400 text-center mb-10 text-lg">
                  BullMQ workers have acquired the targets. Initiating global Playwright sessions.
                </p>
                
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-400 px-1">
                    <span>System Load</span>
                    <span className="text-blue-400">Processing</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 shadow-inner overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-500 h-2 rounded-full animate-[progress_8s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
                  </div>
                </div>
                <style jsx>{`
                  @keyframes progress {
                    0% { width: 0%; }
                    20% { width: 30%; }
                    50% { width: 70%; }
                    80% { width: 90%; }
                    100% { width: 100%; }
                  }
                `}</style>
              </motion.div>
            )}

            {scanStatus === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md flex flex-col items-center text-center"
              >
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="w-28 h-28 bg-slate-800 border-2 border-emerald-500/50 rounded-full flex items-center justify-center relative z-10">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </div>
                </div>
                
                <h3 className="text-4xl font-bold mb-4 text-white">Jobs Queued</h3>
                <p className="text-slate-400 mb-10 text-lg">
                  All active sources have been dispatched to the background workers. Monitor live telemetry in Scan History.
                </p>
                
                <button 
                  onClick={() => setScanStatus('idle')}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Return to Console
                </button>
              </motion.div>
            )}

            {scanStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md flex flex-col items-center text-center"
              >
                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="w-28 h-28 bg-slate-800 border-2 border-red-500/50 rounded-full flex items-center justify-center relative z-10">
                    <XCircle className="w-14 h-14 text-red-400" />
                  </div>
                </div>
                
                <h3 className="text-4xl font-bold mb-4 text-white">Transmission Failed</h3>
                <p className="text-slate-400 mb-10 text-lg">
                  The API server rejected the scan trigger. Verify your backend connection and BullMQ status.
                </p>
                
                <button 
                  onClick={() => setScanStatus('idle')}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Retry Connection
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </div>
  );
}
