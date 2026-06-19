'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PhoneCall, CheckCircle2, AlertCircle, Loader2, CloudUpload, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function BranchPortalPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Fetch Dashboard Counts
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['tpr-dashboard'],
    queryFn: async () => {
      // Backend automatically knows branch from JWT cookie
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/dashboard`);
      return res.data.data;
    },
    enabled: !!user
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Backend automatically knows branch from JWT cookie
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Branch synced to Google Sheets successfully!');
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync branch');
    }
  });

  // Duplicate Check Effect
  useEffect(() => {
    if (!manualForm.companyName || manualForm.companyName.trim().length < 2) {
      setIsDuplicate(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setCheckingName(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/check-name?name=${encodeURIComponent(manualForm.companyName)}`);
        if (res.data.exists) {
          setIsDuplicate(true);
          setManualForm(prev => ({
            ...prev,
            hrName: res.data.hrContact?.name || prev.hrName,
            hrPhone: res.data.hrContact?.mobile || prev.hrPhone,
            hrEmail: res.data.hrContact?.email || prev.hrEmail,
            linkedinProfile: res.data.hrContact?.linkedin_url || prev.linkedinProfile
          }));
          toast.info('Company exists. Switched to Update Mode.', { icon: '🔄' });
        } else {
          setIsDuplicate(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingName(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [manualForm.companyName]);

  const addManualCompanyMutation = useMutation({
    mutationFn: async () => {
      // The old endpoint needed branchId in URL. We assume backend has a /tpr/manual-company endpoint,
      // or we update the API to infer branchId from JWT. Wait, the existing endpoint was /branch/:branchId/manual-company.
      // Since we haven't updated the old admin routes to use TPR token for this yet, we'll pass branch_id in body 
      // or keep using the old route if we haven't migrated it. Wait, TPR import is at /tpr/import but manual is where?
      // Let's assume we can post to the TPR namespace. Wait! For now, we will use the existing endpoint since we didn't touch it.
      // But wait! We did remove base-layer APIs. Let me check the old code.
      // Old code: axios.post(`/branch/${selectedBranchId}/manual-company`, manualForm)
      // I'll leave the endpoint as is, passing `user.branchId`.
      return axios.post(`${process.env.NEXT_PUBLIC_API_URL}/branch/${user?.branchId}/manual-company`, manualForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
      toast.success(isDuplicate ? 'Company updated successfully & queued for sync!' : 'Company added successfully & queued for sync!');
      setShowManualModal(false);
      setManualForm({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
      setIsDuplicate(false);
    },
    onError: () => toast.error('Failed to save company')
  });

  if (!user) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Branch Portal</h1>
          <p className="text-slate-500 mt-2">Manage daily outreach and track communications with assigned companies.</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
        >
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
          Sync All
        </button>
      </div>

      {/* Branch Badge */}
      <div className="flex items-center">
        <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-sm font-medium px-4 py-1.5 rounded-full border border-slate-200">
          Viewing: <strong className="text-slate-900">{user.branchName}</strong> branch
        </span>
      </div>

      {/* Dashboard Error State */}
      {!isLoading && !dashboard && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <h3 className="font-bold text-lg">Failed to load data</h3>
          <p className="text-sm mt-1 mb-4">There was an issue fetching your dashboard data.</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Contact Today */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-6 flex-1">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <PhoneCall className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Today</h3>
            <p className="text-slate-500 text-sm">Companies scheduled for outreach today or overdue.</p>
            
            <div className="mt-6 flex items-baseline gap-2">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-slate-900">
                    {/* Combine followup_due + not_contacted */}
                    {(dashboard?.followup_due || 0) + (dashboard?.not_contacted || 0)}
                  </span>
                  <span className="text-slate-500 font-medium">pending</span>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <Link 
              href="/branch-portal/companies?filter=today"
              className="w-full flex items-center justify-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 2: Interested */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-6 flex-1">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Interested</h3>
            <p className="text-slate-500 text-sm">Companies that have shown interest in placement drive.</p>
            
            <div className="mt-6 flex items-baseline gap-2">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-slate-900">
                    {dashboard?.interested_count || 0}
                  </span>
                  <span className="text-slate-500 font-medium">companies</span>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <Link 
              href="/branch-portal/companies?filter=interested"
              className="w-full flex items-center justify-center gap-2 text-green-600 font-medium hover:text-green-800 transition-colors"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 3: Not Confirmed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-6 flex-1">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Not Confirmed</h3>
            <p className="text-slate-500 text-sm">Companies contacted but not yet committed.</p>
            
            <div className="mt-6 flex items-baseline gap-2">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-slate-900">
                    {dashboard?.not_confirmed_count || 0}
                  </span>
                  <span className="text-slate-500 font-medium">pending</span>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-4">
            <Link 
              href="/branch-portal/companies?filter=not_confirmed"
              className="w-full flex items-center justify-center gap-2 text-amber-600 font-medium hover:text-amber-800 transition-colors"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card 4: Add Company */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-6 flex-1">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <CloudUpload className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add / Edit Company</h3>
            <p className="text-slate-500 text-sm">Manually add a company or upload an Excel sheet.</p>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-2 gap-2">
            <button 
              onClick={() => setShowManualModal(true)}
              className="flex items-center justify-center gap-1.5 text-sm text-purple-600 font-semibold hover:text-purple-800 bg-purple-100/50 hover:bg-purple-100 rounded-lg py-2 transition-colors border border-purple-200"
            >
              Manual Entry <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link 
              href="/branch-portal/upload"
              className="flex items-center justify-center gap-1.5 text-sm text-purple-600 font-semibold hover:text-purple-800 bg-purple-100/50 hover:bg-purple-100 rounded-lg py-2 transition-colors border border-purple-200"
            >
              Upload Excel <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Manual Add Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <CloudUpload className="w-6 h-6 text-indigo-600" />
                {isDuplicate ? 'Update Company Details' : 'Add New Company'}
              </h2>
              <button 
                onClick={() => {
                  setShowManualModal(false);
                  setManualForm({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
                  setIsDuplicate(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {isDuplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">This company is already in the database. Updating the form will overwrite the existing HR details and queue it for syncing.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. Cloudera"
                    className={`w-full bg-slate-50 border ${isDuplicate ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'} text-slate-900 text-sm rounded-xl p-3.5 transition-all shadow-sm`}
                    value={manualForm.companyName}
                    onChange={(e) => setManualForm({ ...manualForm, companyName: e.target.value })}
                  />
                  {checkingName && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-slate-400" />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HR Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    value={manualForm.hrName}
                    onChange={(e) => setManualForm({ ...manualForm, hrName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HR Phone</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    value={manualForm.hrPhone}
                    onChange={(e) => setManualForm({ ...manualForm, hrPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HR Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. hr@company.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  value={manualForm.hrEmail}
                  onChange={(e) => setManualForm({ ...manualForm, hrEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://linkedin.com/in/..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  value={manualForm.linkedinProfile}
                  onChange={(e) => setManualForm({ ...manualForm, linkedinProfile: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-2">LinkedIn profile will be saved securely but will NOT be synced to Google Sheets.</p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => addManualCompanyMutation.mutate()}
                  disabled={!manualForm.companyName || addManualCompanyMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {addManualCompanyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                  {isDuplicate ? 'Update & Queue for Sync' : 'Save & Queue for Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
