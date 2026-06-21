'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, use } from 'react';
import { Loader2, ArrowLeft, ExternalLink, Building2, MapPin, Target, Users, Calendar, BarChart3, CloudUpload } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CompanyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/${companyId}`);
      if (res.data.assignedBranch) {
        // Need to match branch name to branch ID since dropdown uses ID.
        // We will fetch branches and set it later, or update dropdown to use name.
        // Actually, we'll just set the name later.
      }
      return res.data;
    }
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branches`);
      return res.data;
    }
  });

  const assignmentMutation = useMutation({
    mutationFn: async (branch_id: string) => {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/companies/${companyId}/assignment`, {
        branch_id,
        assigned_by: 'Admin'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Branch assignment updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign branch');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sync/bulk-sync`, {
        companyIds: [companyId]
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Company synced to Google Sheets successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync company');
    }
  });

  if (companyLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 w-full max-w-none text-center">
        <h2 className="text-2xl font-bold text-slate-800">Company Not Found</h2>
        <Link href="/companies" className="text-blue-600 hover:underline mt-4 inline-block">Return to Companies List</Link>
      </div>
    );
  }

  const isAssigned = !!company.assignedBranch;
  const isSynced = company.syncStatus === 'synced';
  const isPending = company.syncStatus === 'pending';

  return (
    <div className="p-8 w-full max-w-none space-y-8">
      {/* Header */}
      <div>
        <Link href="/sync" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sync Center
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{company.companyName}</h1>
            <div className="flex items-center gap-4 mt-3">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                  <ExternalLink className="w-4 h-4" /> Website
                </a>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                ${isSynced ? 'bg-green-50 text-green-700 border-green-200' : 
                  isPending ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                  'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                {isSynced ? 'Synced' : isPending ? 'Pending Sync' : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About Company */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" /> About Company
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {company.description || 'No description available for this company.'}
            </p>
          </section>

          {/* Hiring & Opportunities */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" /> Hiring & Opportunities
            </h2>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="grid grid-cols-2 gap-6 mb-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Roles Detected</span>
                  <span className="text-slate-900 font-bold">{company.hiringType || (company.internshipAvailable ? 'Internship' : 'Full-Time / Mixed')}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Placement Priority</span>
                  <span className="text-slate-900 font-bold">{company.placementPriority || 'LOW'}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {company.notes || 'No specific fresher/intern signals detected.'}
              </p>
            </div>
          </section>

          {/* Discovery Source */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-slate-500" /> Discovery Source
            </h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-semibold text-slate-500 mb-1">Platform</span>
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-bold inline-block">{company.source?.platform || 'Unknown'}</span>
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-500 mb-1">Discovered On</span>
                <span className="text-slate-900 font-bold text-sm">
                  {company.source?.discoveredAt ? format(new Date(company.source.discoveredAt), 'MMM d, yyyy') : 'Unknown'}
                </span>
              </div>
              {company.source?.sourceUrl && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 mb-1">Source Link</span>
                  <a href={company.source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium break-all">
                    {company.source.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Assignment Controls */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Branch Assignment</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex gap-2">
                  <select
                    value={selectedBranchId || (branches?.find((b: any) => b.name === company.assignedBranch)?._id || '')}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 bg-white"
                  >
                    <option value="">Select a branch...</option>
                    {branches?.map((b: any) => (
                      <option key={b._id} value={b._id}>{b.name} ({b.category})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => assignmentMutation.mutate(selectedBranchId)}
                  disabled={assignmentMutation.isPending || !selectedBranchId || (isAssigned && selectedBranchId === branches?.find((b: any) => b.name === company.assignedBranch)?._id)}
                  className="w-full mt-3 bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  {assignmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assign Branch'}
                </button>
              </div>

              {isAssigned && (
                <div className="pt-4 mt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-slate-600">Sync Status</span>
                    <span className={`text-sm font-bold ${isSynced ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isSynced ? 'Synced' : 'Pending'}
                    </span>
                  </div>
                  <button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending || isSynced}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    Sync Now
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Company Profile */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Company Profile</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500">Team Size</span>
                  <span className="text-slate-900 font-bold text-sm">{company.teamSize || 'Unknown'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500">Funding Stage</span>
                  <span className="text-slate-900 font-bold text-sm">{company.fundingStage || 'Not Applicable'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500">Founded</span>
                  <span className="text-slate-900 font-bold text-sm">{company.foundedYear || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* AI Intelligence */}
          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> AI Intelligence
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-indigo-900">Placement Score</span>
                  <span className="text-xs font-bold text-indigo-900">{company.placementScore || 'Not Scored'}/100</span>
                </div>
                <div className="w-full bg-indigo-200/50 rounded-full h-1.5">
                  <div className="bg-[#1b4376] h-1.5 rounded-full" style={{ width: `${company.placementScore || 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-indigo-900 mb-2">Core Signals</span>
                <div className="flex flex-wrap gap-1.5">
                  {company.startupSignals?.length > 0 ? (
                    company.startupSignals.map((signal: string, i: number) => (
                      <span key={i} className="bg-white/60 text-indigo-900 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-200/50">{signal}</span>
                    ))
                  ) : (
                    <span className="text-xs text-[#15335b]/70">No core signals analyzed.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
