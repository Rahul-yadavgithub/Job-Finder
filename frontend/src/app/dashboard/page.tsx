'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, PhoneCall, Calendar, Mail, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2, X, Clock, AlertCircle, Trash2, RefreshCw, CloudUpload, Key } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import ValidateContactButton from './ValidateContactButton';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'contact' | 'single_contact' | 'confirmed' | 'not_confirmed'>('dashboard');
  const [previousView, setPreviousView] = useState<'dashboard' | 'contact' | 'confirmed' | 'not_confirmed'>('dashboard');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [lastVisitedCompanyId, setLastVisitedCompanyId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'not_contacted' | 'call_again' | 'pending' | null>(null);
  
  // Manual Add Form State
  const [manualForm, setManualForm] = useState({ companyName: '', hrName: '', hrPhone: '', hrEmail: '', linkedinProfile: '' });
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
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

  const { data: confirmedList, isLoading: confirmedLoading } = useQuery({
    queryKey: ['tpr-confirmed'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies?status=interested&limit=1000`, { withCredentials: true });
      return res.data.data?.rows || [];
    },
    enabled: !!user && (activeView === 'dashboard' || activeView === 'confirmed')
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

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync`, {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Branch synced to Google Sheets successfully!');
      queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-contact-today'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-confirmed'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-not-confirmed'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync branch');
    }
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
      queryClient.invalidateQueries({ queryKey: ['tpr-confirmed'] });
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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
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

      <div className="flex items-center">
        <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 text-sm font-medium px-4 py-1.5 rounded-full border border-slate-200">
          Viewing: <strong className="text-slate-900">{user.branchName}</strong> branch
        </span>
      </div>

      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Today</h3>
              <p className="text-slate-500 text-sm">Companies scheduled for outreach today or overdue.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {dashboardLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{dashboard?.followup_due || 0}</span>
                    <span className="text-slate-500 font-medium">pending</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('contact')}
                disabled={!(dashboard?.followup_due)}
                className="w-full flex items-center justify-center gap-2 text-blue-600 font-medium hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmed Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Interested</h3>
              <p className="text-slate-500 text-sm">Companies interested for placement</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {dashboardLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{dashboard?.interested_count || 0}</span>
                    <span className="text-slate-500 font-medium">secured</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('confirmed')}
                disabled={!(dashboard?.interested_count)}
                className="w-full flex items-center justify-center gap-2 text-green-600 font-medium hover:text-green-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Not Confirmed Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Not Confirmed</h3>
              <p className="text-slate-500 text-sm">Companies that have not committed yet.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {dashboardLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{dashboard?.not_confirmed_count || 0}</span>
                    <span className="text-slate-500 font-medium">pending</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('not_confirmed')}
                disabled={!(dashboard?.not_confirmed_count)}
                className="w-full flex items-center justify-center gap-2 text-amber-600 font-medium hover:text-amber-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add New Company Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:col-span-2 lg:col-span-1">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <CloudUpload className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Add / Edit Company</h3>
              <p className="text-slate-500 text-sm">Manually add or update a company queue.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900">Manual Entry</span>
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => {
                  setShowManualModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                Open Form <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                const company = [...(contactTodayList||[]), ...(confirmedList||[]), ...(notConfirmedList||[]), ...(noResponseList||[])]
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
                    {(company.companies?.phone_number || company.phone_number || company.companies?.hr_name || company.hr_name || company.companies?.email || company.hr_email) ? (
                      <div className="mt-4 space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="font-bold text-slate-800">{company.companies?.hr_name || company.hr_name || 'HR Contact'}</p>
                        {(company.companies?.phone_number || company.phone_number) && <p className="text-slate-600 flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5"/> {company.companies?.phone_number || company.phone_number}</p>}
                        {(company.companies?.email || company.hr_email) && <p className="text-slate-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {company.companies?.email || company.hr_email}</p>}
                      </div>
                    ) : (
                      <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl p-4 text-center mt-4">
                        <p className="text-sm text-slate-500 mb-1">No HR contact saved.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <ValidateContactButton companyId={cid} branchId={user.branchId} />
                  </div>
                </div>

                <div className="p-6 md:w-2/3 flex flex-col">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                    {activeCompanyId === cid ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Outcome</label>
                            <select 
                              className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all" 
                              value={outcome} 
                              onChange={(e) => setOutcome(e.target.value as any)}
                            >
                              <option value="">-- Select --</option>
                              <option value="call_again">Call Again (Reschedule)</option>
                              <option value="not_available">Not Available (No Answer)</option>
                              <option value="rejected">Rejected / Not Interested</option>
                              <option value="interested">Accepted / Confirmed</option>
                            </select>
                          </div>
                          {outcome === 'call_again' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next Contact Date</label>
                              <input 
                                type="date" 
                                className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all" 
                                value={nextContactDate}
                                onChange={(e) => setNextContactDate(e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</label>
                          <textarea 
                            className="w-full bg-white shadow-sm border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-3 transition-all placeholder:text-slate-400" 
                            rows={3} 
                            placeholder="Add interaction details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
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
                            disabled={logMutation.isPending || !outcome || (outcome === 'call_again' && !nextContactDate)}
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
                    ) : (
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

      {/* Confirmed List View */}
      {activeView === 'confirmed' && (
        <div className="mt-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Interested Companies
            </h2>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {confirmedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
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
                  {confirmedList?.map((company: any) => {
                    const cid = company.company_id || company._id || company.id;
                    return (
                    <tr key={cid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{company.companies?.company_name || company.company_name || company.companyName || 'Unknown Company'}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">Interested</td>
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
                          View Contact Info
                        </button>
                      </td>
                    </tr>
                  )})}
                  {confirmedList?.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No interested companies yet.</td></tr>
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Not Confirmed Placements
            </h2>
            <button 
              onClick={() => {
                setActiveView('dashboard');
                setActiveCategory(null);
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
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
