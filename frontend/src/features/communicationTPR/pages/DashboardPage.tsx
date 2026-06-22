'use client';

import React, { useEffect, useState } from 'react';
import { companyApi } from '../services/company.api';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { MessageSquare, ShieldCheck, CheckCircle, Clock, ArrowRight, Bell } from 'lucide-react';
import { FollowUpWidgets } from '../components/FollowUpWidgets';
import Link from 'next/link';

export function DashboardPage() {
  const { user } = useCommunicationAuth();
  const [counts, setCounts] = useState({
    active: 0,
    newIncoming: 0,
    confirmed: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await companyApi.getDashboardStats();
        if (res.success && res.data) {
          setCounts({
            active: res.data.active || 0,
            newIncoming: res.data.newIncoming || 0,
            confirmed: res.data.confirmed || 0
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchCounts();
  }, []);

  const stats = [
    { id: 1, name: 'Active Communications', stat: counts.active.toString(), icon: MessageSquare, gradient: 'from-[#1e3c72] to-[#2a5298]', shadow: 'shadow-blue-900/20' },
    { id: 3, name: 'New Incoming Company', stat: counts.newIncoming.toString(), icon: Clock, gradient: 'from-[#064e3b] to-[#047857]', shadow: 'shadow-emerald-900/20' },
    { id: 4, name: 'Confirmed Company', stat: counts.confirmed.toString(), icon: CheckCircle, gradient: 'from-[#1e293b] to-[#334155]', shadow: 'shadow-slate-900/20' },
  ];

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <MessageSquare size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <ShieldCheck size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'TPR'}</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Communication TPR Dashboard. Here is an overview of the companies in your pipeline today.
            </p>
          </div>
          
          <Link
            href="/communication-tpr/requests/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#15335b] rounded-xl hover:bg-gray-50 font-black text-sm uppercase tracking-widest transition-colors shadow-lg"
          >
            New Communication
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {stats.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} p-6 shadow-lg ${item.shadow} hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10`}
          >
            <item.icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">{item.name}</p>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <p className="text-4xl font-black text-white">{item.stat}</p>
              <ArrowRight className="text-white/50 group-hover:text-white transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <h2 className="text-xl font-bold leading-6 text-gray-900 mb-6 flex items-center gap-2">
          <Bell className="text-[#1b4376]" size={24} /> Your Follow-ups
        </h2>
        <FollowUpWidgets />
      </div>
    </div>
  );
}
