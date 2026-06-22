'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Copy, CheckCircle2, XCircle, RefreshCw, ExternalLink, Settings as SettingsIcon, Database, CloudUpload, History } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';

import { TemplateSettings } from '@/features/communicationTPR/components/TemplateSettings';
import { FollowUpRulesSettings } from '@/features/communicationTPR/components/FollowUpRulesSettings';

interface Settings {
  currentAcademicYearSheetId: string;
  pastAcademicYearSheetId: string;
  lastSyncDate?: string;
  totalSynced?: number;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'rules' | 'sheets'>('templates');
  const [formData, setFormData] = useState({
    currentAcademicYearSheetId: '',
    pastAcademicYearSheetId: '',
  });
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const { data: serviceAccount, isLoading: isLoadingSA } = useQuery({
    queryKey: ['serviceAccount'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-sheet/service-account`);
      return res.data;
    },
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        currentAcademicYearSheetId: settings.currentAcademicYearSheetId || '',
        pastAcademicYearSheetId: settings.pastAcademicYearSheetId || '',
      });
      // If we have at least one ID saved, we mark as saved
      if (settings.currentAcademicYearSheetId || settings.pastAcademicYearSheetId) {
        setIsSaved(true);
      }
    }
  }, [settings]);

  const testConnection = useMutation({
    mutationFn: async () => {
      const idToTest = formData.currentAcademicYearSheetId || formData.pastAcademicYearSheetId;
      if (!idToTest) throw new Error('At least one Sheet ID is required to test');
      
      setTestStatus('testing');
      setTestError('');
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-sheet/test`, {
        sheetId: idToTest,
        worksheetName: 'Sheet1'
      });
      return res.data;
    },
    onSuccess: () => {
      setTestStatus('success');
      setIsSaved(false); // require save since it's newly tested
    },
    onError: (error: any) => {
      setTestStatus('error');
      setTestError(error.response?.data?.error || error.message || 'Unknown error occurred');
    }
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaved(true);
      toast.success('Google Sheets settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const [lastSyncStats, setLastSyncStats] = useState<{newAdded: number, updated: number, errors: number, errorDetails?: string[]} | null>(null);

  const syncCompanies = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/settings/google-sheet/sync`);
      return res.data;
    },
    onSuccess: (data) => {
      setLastSyncStats(data.stats);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Companies synced successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sync companies');
    }
  });

  const copyEmail = () => {
    if (serviceAccount?.email) {
      navigator.clipboard.writeText(serviceAccount.email);
      toast.success('Email copied to clipboard');
    }
  };

  if (isLoadingSA || isLoadingSettings) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <SettingsIcon size={300} className="-mt-10 -mr-10" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
                <SettingsIcon size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">System Settings</h1>
              <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
                Manage templates, configure follow-up rules, and maintain database integrations.
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('templates')}
              className={`${activeTab === 'templates' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Email Templates
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`${activeTab === 'rules' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Follow-up Rules
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className={`${activeTab === 'sheets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Google Sheets Sync
            </button>
          </nav>
        </div>

        {activeTab === 'templates' && (
          <div className="animate-in fade-in duration-300">
            <TemplateSettings />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="animate-in fade-in duration-300">
            <FollowUpRulesSettings />
          </div>
        )}

        {activeTab === 'sheets' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden mb-8">
              <div className="px-4 py-5 sm:p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#1b4376] rounded-[10px] flex items-center justify-center shrink-0">
                    <CloudUpload className="w-8 h-8" strokeWidth={1.5} />
                  </div>
            <div>
              <h2 className="text-[15px] font-medium text-slate-900 leading-tight pt-1">Google Sheets Integration</h2>
              <p className="text-[13px] font-normal text-slate-500 mt-1 leading-relaxed">
                Automatically sync extracted companies to your centralized Master Database.
              </p>
            </div>
          </div>

          {/* Service Account Banner */}
          <div className="bg-blue-50 border border-blue-100 border-l-[3px] border-l-[#1b4376] rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-[#1b4376] shrink-0 mt-0.5" />
            <div className="text-sm font-normal text-indigo-900 w-full space-y-3">
              <div className="space-y-1">
                <p className="font-medium">Service Account Required</p>
                <p className="opacity-90 leading-relaxed">To use this integration, you must share your Google Sheet with the following service account email as an <strong>Editor</strong>.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center min-w-0">
                  <code className="text-sm text-slate-700 font-mono truncate select-all w-full">
                    {isLoadingSA ? 'Loading...' : serviceAccount?.email}
                  </code>
                </div>
                <button 
                  type="button"
                  onClick={copyEmail}
                  className="flex-shrink-0 flex justify-center items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-[#1b4376] hover:bg-[#15335b] rounded-lg transition-colors duration-150"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy Email</span>
                  <span className="sm:hidden">Copy</span>
                </button>
              </div>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              saveSettings.mutate();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Year Sheet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Current Academic Year
                  </label>
                  {formData.currentAcademicYearSheetId && (
                    <a 
                      href={`https://docs.google.com/spreadsheets/d/${formData.currentAcademicYearSheetId}/edit`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[13px] text-[#1b4376] hover:text-[#15335b] flex items-center gap-1 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Master Database Sheet ID</p>
                <input 
                  type="text" 
                  className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#1b4376]/30 focus:border-[#1b4376] transition-all outline-none"
                  placeholder="e.g. 1BxiMVs..."
                  value={formData.currentAcademicYearSheetId || ''}
                  onChange={(e) => {
                    setFormData({...formData, currentAcademicYearSheetId: e.target.value});
                    setTestStatus('idle');
                    setIsSaved(false);
                  }}
                  required
                />
              </div>

              {/* Past Year Sheet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    Past Academic Year
                  </label>
                  {formData.pastAcademicYearSheetId && (
                    <a 
                      href={`https://docs.google.com/spreadsheets/d/${formData.pastAcademicYearSheetId}/edit`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[13px] text-[#1b4376] hover:text-[#15335b] flex items-center gap-1 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Master Database Sheet ID</p>
                <input 
                  type="text" 
                  className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#1b4376]/30 focus:border-[#1b4376] transition-all outline-none"
                  placeholder="e.g. 1BxiMVs..."
                  value={formData.pastAcademicYearSheetId || ''}
                  onChange={(e) => {
                    setFormData({...formData, pastAcademicYearSheetId: e.target.value});
                    setTestStatus('idle');
                    setIsSaved(false);
                  }}
                  required
                />
              </div>
            </div>

            {/* Test Connection Results */}
            {testStatus === 'success' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-900">
                  <p className="font-medium mb-1">Connection Verified Successfully</p>
                  <ul className="space-y-1 opacity-80 text-[13px] list-none">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Google Sheet Found</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Worksheet Found</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Editor Access Confirmed</li>
                  </ul>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-sm text-rose-900">
                  <p className="font-medium mb-1">Connection Failed</p>
                  <p className="opacity-80 text-[13px]">{testError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending || (!formData.currentAcademicYearSheetId && !formData.pastAcademicYearSheetId)}
                className="w-full sm:w-auto h-9 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
              >
                {testConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-slate-400" />}
                Test Connection
              </button>
              <button 
                type="submit" 
                disabled={saveSettings.isPending || (testStatus !== 'success' && !isSaved)}
                className="w-full sm:w-auto h-9 px-4 bg-[#1b4376] hover:bg-[#15335b] text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Sync Status Section */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 transition-colors duration-150 rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-[10px] flex items-center justify-center shrink-0 border border-slate-100">
                <History className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-3 pt-1">
                  <h2 className="text-[15px] font-medium text-slate-900 leading-tight">Sync Status</h2>
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Healthy
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-normal text-slate-500 mt-1">
                  Last synced: {settings?.lastSyncDate ? format(new Date(settings.lastSyncDate), 'dd MMM yyyy, hh:mm a') : 'Never'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => syncCompanies.mutate()}
              disabled={syncCompanies.isPending || !isSaved}
              className="w-full sm:w-auto h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncCompanies.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 rounded-xl p-4 flex gap-3">
              <div className="text-[#1b4376] mt-0.5"><Database className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Total Companies</p>
                <p className="text-[28px] font-semibold text-slate-900 leading-none">
                  {settings?.totalSynced ? settings.totalSynced.toLocaleString() : '0'}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 flex gap-3">
              <div className="text-emerald-600 mt-0.5"><CloudUpload className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">New Added</p>
                <p className="text-[28px] font-semibold text-slate-900 leading-none">
                  {lastSyncStats ? lastSyncStats.newAdded.toLocaleString() : '--'}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 flex gap-3">
              <div className="text-blue-600 mt-0.5"><RefreshCw className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Already Exist</p>
                <p className="text-[28px] font-semibold text-slate-900 leading-none">
                  {lastSyncStats ? lastSyncStats.updated.toLocaleString() : '--'}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 flex gap-3">
              <div className="text-rose-600 mt-0.5"><XCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Sync Errors</p>
                <p className="text-[28px] font-semibold text-slate-900 leading-none">
                  {lastSyncStats ? lastSyncStats.errors.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Detailed Sync Errors List */}
          {lastSyncStats?.errorDetails && lastSyncStats.errorDetails.length > 0 && (
            <div className="mt-6 border border-rose-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-semibold text-rose-900">Failed Imports ({lastSyncStats.errorDetails.length})</h3>
              </div>
              <div className="bg-white max-h-64 overflow-y-auto p-0">
                <ul className="divide-y divide-slate-100">
                  {lastSyncStats.errorDetails.map((err, idx) => (
                    <li key={idx} className="p-3 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors break-words">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
