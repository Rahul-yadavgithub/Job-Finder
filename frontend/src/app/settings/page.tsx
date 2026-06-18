'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Copy, CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Settings {
  currentAcademicYearSheetId: string;
  pastAcademicYearSheetId: string;
  lastSyncDate?: string;
  totalSynced?: number;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
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

  const syncCompanies = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/companies/sync-sheet`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`${data.syncedCount} Companies Synced Successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync companies');
    }
  });

  const copyEmail = () => {
    if (serviceAccount?.email) {
      navigator.clipboard.writeText(serviceAccount.email);
      toast.success('Email copied to clipboard');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure external integrations and application preferences.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Google Sheets Integration</h2>
            <p className="text-sm text-slate-500 mt-1">
              Automatically sync extracted companies to a Google Sheet.
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 w-full">
              <p className="font-semibold mb-1">Service Account Required</p>
              <p>To use this integration, you must share your Google Sheet with the following service account email as an <strong>Editor</strong>:</p>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-blue-200 rounded-lg p-3 overflow-hidden">
                <div className="flex-1 min-w-0 bg-slate-50 p-2 rounded border border-slate-100 flex items-center">
                  <code className="block text-blue-700 font-mono select-all truncate text-xs sm:text-sm w-full">
                    {isLoadingSA ? 'Loading...' : serviceAccount?.email}
                  </code>
                </div>
                <button 
                  type="button"
                  onClick={copyEmail}
                  className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Email
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
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                  <h3 className="font-semibold text-sm text-slate-700">Current Academic Year</h3>
                  {formData.currentAcademicYearSheetId ? (
                    <a 
                      href={`https://docs.google.com/spreadsheets/d/${formData.currentAcademicYearSheetId}/edit`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Sheet
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded cursor-not-allowed">
                      <ExternalLink className="w-3 h-3" /> Open Sheet
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Master Database Sheet ID</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                  <h3 className="font-semibold text-sm text-slate-700">Past Academic Year</h3>
                  {formData.pastAcademicYearSheetId ? (
                    <a 
                      href={`https://docs.google.com/spreadsheets/d/${formData.pastAcademicYearSheetId}/edit`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Sheet
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded cursor-not-allowed">
                      <ExternalLink className="w-3 h-3" /> Open Sheet
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Master Database Sheet ID</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
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
            </div>



            {/* Test Connection Results */}
            {testStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 items-start animate-in fade-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold mb-2">Connection Successful</p>
                  <ul className="space-y-1 list-disc list-inside opacity-90">
                    <li>Google Sheet Found</li>
                    <li>Worksheet Found</li>
                    <li>Editor Access Verified</li>
                    <li>Read/Write Permission Verified</li>
                  </ul>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start animate-in fade-in zoom-in-95">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold mb-1">Connection Failed</p>
                  <p>{testError}</p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending || (!formData.currentAcademicYearSheetId && !formData.pastAcademicYearSheetId)}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {testConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Test Connection
                </button>
                <button 
                  type="submit" 
                  disabled={saveSettings.isPending || (testStatus !== 'success' && !isSaved)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {saveSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Sync Status Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Google Sheet Status</h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitor and trigger manual synchronization.
            </p>
          </div>
          <button 
            onClick={() => syncCompanies.mutate()}
            disabled={syncCompanies.isPending || !isSaved}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50 shadow-md"
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
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Connection Status</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                {isSaved ? <span className="w-2 h-2 rounded-full bg-green-500"></span> : <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                {isSaved ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Sync</p>
              <p className="font-semibold text-slate-900">
                {settings?.lastSyncDate ? format(new Date(settings.lastSyncDate), 'dd MMM yyyy hh:mm a') : 'Never'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Companies Synced</p>
              <p className="font-semibold text-slate-900">
                {settings?.totalSynced || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Error</p>
              <p className="font-semibold text-slate-900">None</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
