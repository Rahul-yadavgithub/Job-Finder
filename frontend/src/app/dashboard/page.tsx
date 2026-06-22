'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, User, Link as LinkIcon, Briefcase, History, PhoneCall, Calendar, Mail, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2, X, Clock, AlertCircle, Trash2, RefreshCw, CloudUpload, Key, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import ValidateContactButton from './ValidateContactButton';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'contact' | 'single_contact' | 'reverted' | 'not_confirmed'>('dashboard');
  const [previousView, setPreviousView] = useState<'dashboard' | 'contact' | 'reverted' | 'not_confirmed'>('dashboard');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [lastVisitedCompanyId, setLastVisitedCompanyId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'not_contacted' | 'call_again' | 'pending' | null>(null);
  
  // Manual Add Form State
  const [manualForm, setManualForm] = useState({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Bulk Upload State
  const [modalTab, setModalTab] = useState<'manual' | 'bulk'>('manual');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{valid: any[], duplicates: any[], total: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  // Form State
  const [outcome, setOutcome] = useState<'call_again' | 'rejected' | 'interested' | 'not_available' | ''>('');
  const [channel, setChannel] = useState<string>('Phone');
  const [notes, setNotes] = useState<string>('');
  const [nextContactDate, setNextContactDate] = useState<string>('');

  // Fetch Dashboard Counts
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['tpr-dashboard'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/dashboard`, { withCredentials: true });
      return res.data.data;
    },
    enabled: !!user
  });

  const { data: contactTodayList, isLoading: listLoading } = useQuery({
    queryKey: ['tpr-contact-today'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies/today`, { withCredentials: true });
      return res.data.data || [];
    },
    enabled: !!user && (activeView === 'dashboard' || activeView === 'contact' || activeView === 'single_contact')
  });

  const { data: revertedList, isLoading: revertedLoading } = useQuery({
    queryKey: ['tpr-reverted'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies?status=reverted&limit=1000`, { withCredentials: true });
      return res.data.data?.rows || [];
    },
    enabled: !!user && (activeView === 'dashboard' || activeView === 'reverted')
  });

  const { data: notConfirmedList, isLoading: notConfirmedLoading } = useQuery({
    queryKey: ['tpr-not-confirmed'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies?status=pending&limit=1000`, { withCredentials: true });
      return res.data.data?.rows || [];
    },
    enabled: !!user && (activeView === 'dashboard' || activeView === 'not_confirmed')
  });

  const { data: noResponseList, isLoading: noResponseLoading } = useQuery({
    queryKey: ['tpr-no-response'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies?status=not_available&limit=1000`, { withCredentials: true });
      return res.data.data?.rows || [];
    },
    enabled: !!user && (activeView === 'dashboard' || activeView === 'not_confirmed')
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['tpr-company-history', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies/${activeCompanyId}/history`, { withCredentials: true });
      return res.data;
    },
    enabled: !!user && !!activeCompanyId && activeView === 'single_contact'
  });

  const { data: hrContactData, isLoading: hrContactLoading } = useQuery({
    queryKey: ['tpr-hr-contact', activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return null;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/${activeCompanyId}/hr-contacts`, { withCredentials: true });
      return res.data.contact;
    },
    enabled: !!user && !!activeCompanyId && activeView === 'single_contact'
  });



  useEffect(() => {
    if (!manualForm.companyName || manualForm.companyName.trim().length < 2) {
      setIsDuplicate(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setCheckingName(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/check-name?name=${encodeURIComponent(manualForm.companyName)}`, { withCredentials: true });
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
      return axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/manual-company`, manualForm, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-contact-today'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-not-confirmed'] });
      toast.success(isDuplicate ? 'Company updated successfully & queued for sync!' : 'Company added successfully & queued for sync!');
      setShowManualModal(false);
      setManualForm({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
      setIsDuplicate(false);
    },
    onError: () => toast.error('Failed to save company')
  });

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/import/preview`, formData, { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to parse file');
      setUploadFile(null);
    }
  });

  const confirmUploadMutation = useMutation({
    mutationFn: async () => {
      if (!previewData?.valid || previewData.valid.length === 0) return;
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/import/confirm`, { companies: previewData.valid }, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
      toast.success(`${previewData?.valid.length} companies saved to Sync Center queue!`);
      setShowManualModal(false);
      setModalTab('manual');
      setUploadFile(null);
      setPreviewData(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to save companies')
  });

  const logMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const payload = {
        base_status: outcome,
        notes,
        next_followup_date: outcome === 'call_again' ? nextContactDate : undefined
      };
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies/${companyId}/status`, payload, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-contact-today'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-reverted'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-not-confirmed'] });
      setOutcome('');
      setNotes('');
      setNextContactDate('');
      setActiveCompanyId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  });

  if (!user) return null;

  return (
    <div className="p-8 w-full max-w-none space-y-8">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <PhoneCall size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <PhoneCall size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Base TPR Dashboard</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Manage daily outreach, validate HR contacts, and track communications with your assigned companies.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md text-sm font-bold text-white border border-white/20 shadow-sm">
              Viewing Branch: <strong className="text-blue-200 ml-1 uppercase tracking-widest">{user.branchName}</strong>
            </span>
          </div>
        </div>
      </div>

      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Contact Today Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3c72] to-[#2a5298] p-6 shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
            <PhoneCall className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Contact Today</p>
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              {dashboardLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{dashboard?.followup_due || 0}</span>
                  <span className="text-white/60 font-medium text-sm">pending</span>
                </div>
              )}
              <button 
                onClick={() => setActiveView('contact')}
                disabled={!(dashboard?.followup_due)}
                className="text-white/50 group-hover:text-white transition-colors disabled:opacity-0"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Reverted Back Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7e22ce] to-[#6b21a8] p-6 shadow-lg shadow-purple-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
            <AlertCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Reverted Back</p>
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              {dashboardLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{dashboard?.reverted_count || 0}</span>
                  <span className="text-white/60 font-medium text-sm">companies</span>
                </div>
              )}
              <button 
                onClick={() => setActiveView('reverted')}
                disabled={!(dashboard?.reverted_count)}
                className="text-white/50 group-hover:text-white transition-colors disabled:opacity-0"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Not Confirmed Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#b45309] to-[#d97706] p-6 shadow-lg shadow-amber-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10">
            <Clock className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Not Confirmed</p>
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              {dashboardLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{dashboard?.not_confirmed_count || 0}</span>
                  <span className="text-white/60 font-medium text-sm">pending</span>
                </div>
              )}
              <button 
                onClick={() => setActiveView('not_confirmed')}
                disabled={!(dashboard?.not_confirmed_count)}
                className="text-white/50 group-hover:text-white transition-colors disabled:opacity-0"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Add New Company Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] p-6 shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between h-[180px] border border-white/10 md:col-span-2 lg:col-span-1">
            <CloudUpload className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <CloudUpload className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Add Companies</p>
              </div>
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <span className="text-xl font-bold text-white">Manual / Bulk</span>
              <button 
                onClick={() => setShowManualModal(true)}
                className="text-white hover:text-emerald-200 transition-colors bg-white/10 p-2 rounded-lg backdrop-blur-sm"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Bulk Upload Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 relative">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
              <div className="flex gap-4">
                <button
                  onClick={() => setModalTab('manual')}
                  className={`text-lg font-bold pb-2 border-b-2 transition-colors ${modalTab === 'manual' ? 'text-[#1b4376] border-[#1b4376]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setModalTab('bulk')}
                  className={`text-lg font-bold pb-2 border-b-2 transition-colors ${modalTab === 'bulk' ? 'text-[#1b4376] border-[#1b4376]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  Bulk Upload
                </button>
              </div>
              <button 
                onClick={() => {
                  setShowManualModal(false);
                  setManualForm({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
                  setIsDuplicate(false);
                  setModalTab('manual');
                  setUploadFile(null);
                  setPreviewData(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors mb-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {modalTab === 'manual' ? (
                <>
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
                        className={`w-full bg-slate-50 border ${isDuplicate ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'} text-slate-900 text-sm rounded-xl p-3.5 transition-all shadow-sm`}
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
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        value={manualForm.hrName}
                        onChange={(e) => setManualForm({ ...manualForm, hrName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HR Phone</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
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
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      value={manualForm.hrEmail}
                      onChange={(e) => setManualForm({ ...manualForm, hrEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">LinkedIn Profile URL</label>
                    <input 
                      type="url" 
                      placeholder="e.g. https://linkedin.com/in/..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3.5 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      value={manualForm.linkedinProfile}
                      onChange={(e) => setManualForm({ ...manualForm, linkedinProfile: e.target.value })}
                    />
                    <p className="text-xs text-slate-400 mt-2">LinkedIn profile will be saved securely but will NOT be synced to Google Sheets.</p>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => addManualCompanyMutation.mutate()}
                      disabled={!manualForm.companyName || addManualCompanyMutation.isPending}
                      className="w-full bg-[#1b4376] hover:bg-[#15335b] disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {addManualCompanyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                      {isDuplicate ? 'Update & Queue for Sync' : 'Save & Queue for Sync'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">Upload an Excel (.xlsx) or CSV file with <strong>company_name</strong> and <strong>hr_name</strong> columns. The file will be checked for duplicates against the database before saving to the Sync Center queue.</p>
                  </div>

                  {!previewData && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        previewMutation.isPending ? 'border-slate-300 bg-slate-50' : 'border-indigo-300 bg-blue-50/30 hover:bg-blue-50 hover:border-indigo-400 cursor-pointer'
                      }`}
                      onClick={() => !previewMutation.isPending && fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (previewMutation.isPending) return;
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          setUploadFile(file);
                          previewMutation.mutate(file);
                        }
                      }}
                    >
                      <input 
                        type="file" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setUploadFile(file);
                            previewMutation.mutate(file);
                          }
                        }}
                      />
                      {previewMutation.isPending ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                          <p className="text-slate-600 font-medium">Analyzing file for duplicates...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 mb-2">
                            <Upload className="w-8 h-8 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">Click or Drag & Drop File Here</h3>
                          <p className="text-sm text-slate-500">Supports .csv, .xls, .xlsx</p>
                        </div>
                      )}
                    </div>
                  )}

                  {previewData && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-slate-500 uppercase">Total Rows</p>
                          <p className="text-2xl font-black text-slate-800">{previewData.total}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-green-600 uppercase">Valid</p>
                          <p className="text-2xl font-black text-green-700">{previewData.valid.length}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                          <p className="text-xs font-bold text-amber-600 uppercase">Duplicates</p>
                          <p className="text-2xl font-black text-amber-700">{previewData.duplicates.length}</p>
                        </div>
                      </div>

                      {previewData.valid.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-800 mb-3">Ready to Import ({previewData.valid.length})</h4>
                          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2">Company Name</th>
                                  <th className="px-4 py-2">HR Name</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {previewData.valid.slice(0, 50).map((v, i) => (
                                  <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-2 font-medium text-slate-900">{v.companyName}</td>
                                    <td className="px-4 py-2 text-slate-600">{v.hrName}</td>
                                  </tr>
                                ))}
                                {previewData.valid.length > 50 && (
                                  <tr><td colSpan={2} className="px-4 py-2 text-center text-slate-500 italic">...and {previewData.valid.length - 50} more</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {previewData.duplicates.length > 0 && (
                        <div className="border border-amber-200 rounded-xl overflow-hidden">
                          <button 
                            onClick={() => setShowDuplicates(!showDuplicates)}
                            className="w-full bg-amber-50 px-4 py-3 flex items-center justify-between font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            <span>Skipped Items ({previewData.duplicates.length})</span>
                            {showDuplicates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          {showDuplicates && (
                            <div className="max-h-40 overflow-y-auto bg-white">
                              <table className="w-full text-sm text-left border-t border-amber-200">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-2">Company/Row</th>
                                    <th className="px-4 py-2">Reason</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {previewData.duplicates.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-2 font-medium text-slate-900">{d.companyName || JSON.stringify(d.row)}</td>
                                      <td className="px-4 py-2 text-amber-600 text-xs font-semibold">{d.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-4 pt-4 border-t border-slate-200">
                        <button 
                          onClick={() => { setPreviewData(null); setUploadFile(null); }}
                          className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all shadow-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => confirmUploadMutation.mutate()}
                          disabled={previewData.valid.length === 0 || confirmUploadMutation.isPending}
                          className="w-2/3 bg-[#1b4376] hover:bg-[#15335b] disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                        >
                          {confirmUploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          Save {previewData.valid.length} to Sync Center
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Details View */}
      {(activeView === 'contact' || activeView === 'single_contact') && (
        <div className="mt-8 animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center mb-8">
            <button 
              onClick={() => {
                setActiveView(previousView || 'dashboard');
                setActiveCompanyId(null);
              }}
              className="absolute left-0 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" /> 
              Back {previousView === 'dashboard' ? 'to Dashboard' : previousView === 'not_confirmed' ? 'to List' : ''}
            </button>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <PhoneCall className="w-6 h-6 text-blue-600" />
              {activeView === 'single_contact' ? 'Company Contact Details' : 'Contact Action List'}
            </h2>
          </div>

          <div className="space-y-6">
            {listLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (() => {
              if (activeView === 'single_contact' && activeCompanyId) {
                const company = [...(contactTodayList||[]), ...(revertedList||[]), ...(notConfirmedList||[]), ...(noResponseList||[])]
                                 .find(c => (c.company_id || c._id || c.id) === activeCompanyId);
                return company ? [company] : [];
              }
              return contactTodayList || [];
            })()?.map((company: any) => {
              const cid = company.company_id || company._id || company.id;
              return (
              <div key={cid} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{company.companies?.company_name || company.company_name || company.companyName || 'Unknown Company'}</h3>
                  <div className="text-sm text-slate-600 mb-4 flex flex-col gap-1">
                    <span className="inline-block bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide w-max">
                      {company.base_status || 'Pending'}
                    </span>
                    {hrContactLoading ? (
                      <div className="flex justify-center py-6 mt-4 bg-white/50 rounded-xl border border-slate-100"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
                    ) : (hrContactData || company.companies?.phone_number || company.phone_number || company.companies?.hr_name || company.hr_name || company.companies?.email || company.hr_email) ? (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="relative bg-gradient-to-br from-blue-50/80 to-white p-5 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-500/5 overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <User className="w-24 h-24 text-blue-600" />
                          </div>
                          
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 shadow-inner">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base leading-tight">
                                {hrContactData?.name || company.companies?.hr_name || company.hr_name || 'HR Contact'}
                              </p>
                              {hrContactData?.designation && (
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-0.5">{hrContactData.designation}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3 relative z-10">
                            {(hrContactData?.mobile || company.companies?.phone_number || company.phone_number) && (
                              <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-xl border border-blue-50/80 backdrop-blur-sm">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">{hrContactData?.mobile || company.companies?.phone_number || company.phone_number}</p>
                              </div>
                            )}
                            
                            {(hrContactData?.email || company.companies?.email || company.hr_email) && (
                              <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-xl border border-blue-50/80 backdrop-blur-sm">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-700 truncate">{hrContactData?.email || company.companies?.email || company.hr_email}</p>
                              </div>
                            )}

                            {hrContactData?.linkedin_url && (
                              <div className="flex items-center gap-3 bg-white/60 p-2.5 rounded-xl border border-blue-50/80 backdrop-blur-sm">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <a 
                                  href={hrContactData.linkedin_url.startsWith('http') ? hrContactData.linkedin_url : `https://${hrContactData.linkedin_url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline truncate"
                                >
                                  View LinkedIn Profile
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Previous History Section */}
                        {hrContactData?.history && hrContactData.history.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <History className="w-3.5 h-3.5" /> Previous Contacts
                            </h4>
                            <div className="space-y-3">
                              {hrContactData.history.slice().reverse().map((hist: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-bold text-slate-700">{hist.name || 'Unknown Name'}</p>
                                    <p className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      {hist.replaced_at ? format(new Date(hist.replaced_at), 'MMM dd, yyyy') : ''}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    {hist.mobile && <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> {hist.mobile}</span>}
                                    {hist.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {hist.email}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 border border-dashed border-slate-300 rounded-2xl p-6 text-center mt-6 flex flex-col items-center justify-center shadow-inner">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 mb-3 shadow-sm">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-1">No HR contact saved</p>
                        <p className="text-xs text-slate-400">Click validate below to discover contacts automatically.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <ValidateContactButton companyId={cid} branchId={user.branchId} />
                  </div>
                </div>

                <div className="p-6 md:w-2/3 flex flex-col">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                    {activeCompanyId === cid ? (() => {
                      const isLocked = company.base_status === 'interested' && company.mid_status !== 'rejected' && company.top_status !== 'rejected';
                      const revertedHistory = (historyData?.data || []).find((h: any) => h.layer === 'mid' && h.new_status === 'revoked');
                      const revertedNote = revertedHistory?.reason;

                      return (
                      <div className="space-y-5">
                        {isLocked && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-2">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold">Status Locked</p>
                              <p className="text-xs font-medium">This company is currently with upper tier TPRs. You cannot modify its status unless it is rejected and returned to you.</p>
                            </div>
                          </div>
                        )}
                        {revertedNote && (
                          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm mb-2 animate-pulse">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold">Mid TPR Note (Reverted)</p>
                              <p className="text-sm font-medium">{revertedNote}</p>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Outcome</label>
                            <select 
                              className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all disabled:opacity-50 disabled:bg-slate-50" 
                              value={outcome} 
                              onChange={(e) => setOutcome(e.target.value as any)}
                              disabled={isLocked}
                            >
                              <option value="">-- Select --</option>
                              <option value="call_again">Call Again (Reschedule)</option>
                              <option value="not_available">Not Available (No Answer)</option>
                              <option value="rejected">Rejected / Not Interested</option>
                              <option value="interested">Interested</option>
                            </select>
                          </div>
                          {outcome === 'call_again' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next Contact Date</label>
                                <input 
                                  type="date" 
                                  className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all disabled:opacity-50 disabled:bg-slate-50" 
                                  value={nextContactDate}
                                  onChange={(e) => setNextContactDate(e.target.value)}
                                  disabled={isLocked}
                                />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                          <textarea 
                            className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-50" 
                            rows={3} 
                            placeholder="Add interaction details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isLocked}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                          <button 
                            onClick={() => {
                              setActiveCompanyId(null);
                              setOutcome('');
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => logMutation.mutate(cid)}
                            disabled={logMutation.isPending || !outcome || (outcome === 'call_again' && !nextContactDate) || isLocked}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40"
                          >
                            {logMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save & Update Status
                          </button>
                        </div>

                        {/* Interaction History Section */}
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Previous Interactions</h4>
                          {historyLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                          ) : historyData?.hidden ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                              <p className="text-sm font-medium">{historyData.message || 'History hidden. Company has progressed to the next layer.'}</p>
                            </div>
                          ) : historyData?.data?.length > 0 ? (
                            <div className="space-y-4">
                              {historyData.data.map((log: any) => (
                                <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(log.changed_at), 'MMM d, yyyy h:mm a')}</span>
                                    <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {log.new_status?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  {log.notes && <p className="text-sm text-slate-700 mt-1">{log.notes}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                              No previous interactions logged.
                            </div>
                          )}
                        </div>

                      </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <button 
                          onClick={() => {
                            setActiveCompanyId(cid);
                            setOutcome('');
                            setNotes('');
                            setNextContactDate('');
                          }}
                          className="w-full max-w-sm bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-4 h-4" /> Log New Outreach Call
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})}
            {contactTodayList?.length === 0 && activeView === 'contact' && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                No companies pending contact today!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reverted List View */}
      {activeView === 'reverted' && (
        <div className="mt-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setActiveView('dashboard')}
              className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0 flex items-center justify-center"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Reverted Back Companies
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {revertedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revertedList?.map((company: any) => {
                    const cid = company.company_id || company._id || company.id;
                    return (
                    <tr key={cid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{company.companies?.company_name || company.company_name || company.companyName || 'Unknown Company'}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">Reverted Back</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setPreviousView(activeView);
                            setLastVisitedCompanyId(cid);
                            setActiveView('single_contact');
                            setActiveCompanyId(cid);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )})}
                  {revertedList?.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No reverted companies yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Not Confirmed View */}
      {activeView === 'not_confirmed' && (
        <div className="mt-8 space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveView('dashboard');
                setActiveCategory(null);
              }}
              className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0 flex items-center justify-center"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Not Confirmed Placements
            </h2>
          </div>

          {/* Premium Folder/Nested Category View */}
          {(notConfirmedLoading || noResponseLoading || listLoading) ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
          ) : (() => {
            const notContacted = notConfirmedList || [];
            const callAgain = contactTodayList || [];
            const pendingResponse = noResponseList || [];

            if (activeCategory === null) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Card 1: Not Contacted */}
                  <div 
                    onClick={() => setActiveCategory('not_contacted')}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all group flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 w-full h-1 bg-slate-300"></div>
                    <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-100">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mt-2">Not Contacted</h3>
                    <p className="text-5xl font-black text-slate-900">{notContacted.length}</p>
                    <p className="text-sm text-slate-500 font-semibold flex items-center gap-1 mt-2 group-hover:text-slate-800 transition-colors">View Queue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></p>
                  </div>

                  {/* Card 2: Call Again */}
                  <div 
                    onClick={() => setActiveCategory('call_again')}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 w-full h-1 bg-blue-500"></div>
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide mt-2">Call Again</h3>
                    <p className="text-5xl font-black text-blue-600">{callAgain.length}</p>
                    <p className="text-sm text-blue-500 font-semibold flex items-center gap-1 mt-2 group-hover:text-blue-700 transition-colors">View Queue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></p>
                  </div>

                  {/* Card 3: Pending Response */}
                  <div 
                    onClick={() => setActiveCategory('pending')}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-amber-100">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900 uppercase tracking-wide mt-2">Pending Response</h3>
                    <p className="text-5xl font-black text-amber-600">{pendingResponse.length}</p>
                    <p className="text-sm text-amber-500 font-semibold flex items-center gap-1 mt-2 group-hover:text-amber-700 transition-colors">View Queue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></p>
                  </div>
                </div>
              );
            }

            // Expanded List View
            const activeData = activeCategory === 'not_contacted' ? notContacted : activeCategory === 'call_again' ? callAgain : pendingResponse;
            const title = activeCategory === 'not_contacted' ? 'Not Contacted' : activeCategory === 'call_again' ? 'Call Again' : 'Pending Response';

            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className={`p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  activeCategory === 'not_contacted' ? 'bg-slate-50 border-slate-200' :
                  activeCategory === 'call_again' ? 'bg-blue-50 border-blue-100' :
                  'bg-amber-50 border-amber-100'
                }`}>
                  <h3 className={`text-xl font-bold flex items-center gap-2.5 ${
                    activeCategory === 'not_contacted' ? 'text-slate-800' :
                    activeCategory === 'call_again' ? 'text-blue-900' :
                    'text-amber-900'
                  }`}>
                    {activeCategory === 'not_contacted' && <Users className="w-6 h-6 text-slate-500" />}
                    {activeCategory === 'call_again' && <Calendar className="w-6 h-6 text-blue-600" />}
                    {activeCategory === 'pending' && <Clock className="w-6 h-6 text-amber-600" />}
                    {title} Queue
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-white shadow-sm ${
                      activeCategory === 'not_contacted' ? 'text-slate-600 border-slate-200' :
                      activeCategory === 'call_again' ? 'text-blue-700 border-blue-200' :
                      'text-amber-700 border-amber-200'
                    }`}>
                      {activeData.length} Companies
                    </span>
                  </h3>
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Categories
                  </button>
                </div>

                <div className="p-6 bg-slate-50/30">
                  <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
                    {activeData.map((company: any) => {
                      const cid = company.company_id || company._id || company.id;
                      return (
                      <div 
                        key={cid} 
                        className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md ${
                          lastVisitedCompanyId === cid ? (
                            activeCategory === 'not_contacted' ? 'border-slate-400 ring-4 ring-slate-500/10' :
                            activeCategory === 'call_again' ? 'border-blue-400 ring-4 ring-blue-500/10' :
                            'border-amber-400 ring-4 ring-amber-500/10'
                          ) : (
                            activeCategory === 'not_contacted' ? 'border-slate-200 hover:border-slate-300' :
                            activeCategory === 'call_again' ? 'border-blue-100 hover:border-blue-300' :
                            'border-amber-100 hover:border-amber-300'
                          )
                        }`}
                      >
                        <div className="mb-6">
                          <h4 className="font-bold text-slate-900 text-lg">{company.companies?.company_name || company.company_name || company.companyName || 'Unknown Company'}</h4>
                          {activeCategory === 'not_contacted' && <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Priority: {company.placementPriority || company.placement_priority || 'Standard'}</p>}
                          {activeCategory === 'call_again' && <p className="text-xs text-blue-600 mt-2 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Follow-up: {company.next_followup_date || company.nextFollowupDate ? format(new Date(company.next_followup_date || company.nextFollowupDate), 'MMM d, yyyy') : 'Overdue'}</p>}
                          {activeCategory === 'pending' && <p className="text-xs text-amber-600 mt-2 uppercase tracking-wider font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Status: Awaiting Reply</p>}
                        </div>
                        <button 
                          onClick={() => {
                            setPreviousView(activeView);
                            setLastVisitedCompanyId(cid);
                            setActiveView('single_contact');
                            setActiveCompanyId(cid);
                          }}
                          className={`w-full font-semibold py-2.5 rounded-lg transition-colors text-sm border flex items-center justify-center gap-2 ${
                            activeCategory === 'not_contacted' ? 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200' :
                            activeCategory === 'call_again' ? 'text-blue-700 bg-blue-50/80 hover:bg-blue-100 border-blue-100' :
                            'text-amber-700 bg-amber-50/80 hover:bg-amber-100 border-amber-100'
                          }`}
                        >
                          Contact Details <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )})}
                  </div>
                  {activeData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      {activeCategory === 'not_contacted' && <Users className="w-12 h-12 mb-3 text-slate-300" />}
                      {activeCategory === 'call_again' && <Calendar className="w-12 h-12 mb-3 text-slate-300" />}
                      {activeCategory === 'pending' && <Clock className="w-12 h-12 mb-3 text-slate-300" />}
                      <p className="text-sm font-medium">No companies in this queue.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
