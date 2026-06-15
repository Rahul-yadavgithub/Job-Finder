'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { CloudUpload, History, CheckCircle2, Loader2, DownloadCloud, Settings2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SyncCenterPage() {
  const queryClient = useQueryClient();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedBulkBranch, setSelectedBulkBranch] = useState<string>('');

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['sync-pending'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sync/pending`);
      return res.data;
    }
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['sync-history'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sync/history`);
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

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      return res.data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sync/branch/${branchId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-pending'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
    }
  });

  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sync/bulk-sync`, { companyIds: selectedCompanies });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-pending'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      setSelectedCompanies([]);
      alert('Bulk sync successful!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Bulk sync failed');
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async (branch_id: string) => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/companies/bulk-assign`, { 
        companyIds: selectedCompanies,
        branch_id
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-pending'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      setSelectedCompanies([]);
      setSelectedBulkBranch('');
      alert('Bulk assignment successful!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Bulk assignment failed');
    }
  });

  const inboundSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sync/inbound`);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Inbound Sync Complete!\nUpdated ${data.totalUpdated} companies.\nConflicts: ${data.conflicts.length}`);
    },
    onError: () => {
      alert('Inbound sync failed.');
    }
  });

  const toggleSelection = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const renderBranchTable = (item: any, isHistory: boolean = false) => (
    <div key={item.branch_name} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8 flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900">{item.branch_name} {isHistory ? `(${item.count} Synced)` : `(${item.count} Pending)`}</h4>
          {isHistory && (
            <p className="text-sm text-slate-500 mt-1">Last Synced: {format(new Date(item.lastSynced), 'MMM d, h:mm a')}</p>
          )}
        </div>
        {!isHistory && (
          <button
            onClick={() => syncMutation.mutate(item.branch_name)}
            disabled={syncMutation.isPending}
            className="w-full sm:w-auto text-sm bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {syncMutation.isPending && syncMutation.variables === item.branch_name ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            Sync Entire Branch
          </button>
        )}
      </div>
      
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bg-slate-50/30">
        {item.companies?.map((company: any) => (
          <div key={company._id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow relative">
            <div className="flex items-start gap-3 mb-6">
              <input 
                type="checkbox" 
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                checked={selectedCompanies.includes(company._id)}
                onChange={() => toggleSelection(company._id)}
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 block truncate text-base" title={company.companyName}>{company.companyName}</span>
                <span className={`inline-block mt-2 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${isHistory ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                  {isHistory ? 'Synced' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <Link href={`/companies/${company._id}`} className="flex items-center justify-center text-sm text-slate-700 hover:text-blue-700 font-semibold py-2 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 shadow-sm">
                Details
              </Link>
              {!isHistory ? (
                <button 
                  onClick={() => {
                    if (selectedCompanies.includes(company._id)) {
                      bulkSyncMutation.mutate();
                    } else {
                      setSelectedCompanies([company._id]);
                      setTimeout(() => bulkSyncMutation.mutate(), 0);
                    }
                  }}
                  disabled={bulkSyncMutation.isPending}
                  className="flex items-center justify-center text-sm text-blue-700 hover:text-blue-800 font-semibold py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 hover:border-blue-300 shadow-sm disabled:opacity-50"
                >
                  Sync
                </button>
              ) : (
                <div className="flex items-center justify-center text-sm text-green-700 font-semibold py-2 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                  Completed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sync Center</h1>
          <p className="text-slate-500 mt-2">Manage pushing assigned companies to their respective Google Sheets.</p>
        </div>
        <div className="flex items-center gap-3">
          {settings?.currentAcademicYearSheetId ? (
            <a 
              href={`https://docs.google.com/spreadsheets/d/${settings.currentAcademicYearSheetId}/edit`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-5 h-5" />
              Open Master Sheet
            </a>
          ) : (
            <span 
              className="flex items-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 font-medium py-2.5 px-4 rounded-lg cursor-not-allowed shadow-sm"
              title="Configure Master Database Sheet ID in Settings"
            >
              <ExternalLink className="w-5 h-5" />
              Open Master Sheet
            </span>
          )}
          <button
            onClick={() => inboundSyncMutation.mutate()}
            disabled={inboundSyncMutation.isPending}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            {inboundSyncMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
            Pull Updates
          </button>
        </div>
      </div>

      {selectedCompanies.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between sticky top-4 z-10 shadow-md">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm">{selectedCompanies.length}</span>
            <span className="font-medium text-blue-900">Companies Selected</span>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <select 
                value={selectedBulkBranch}
                onChange={(e) => setSelectedBulkBranch(e.target.value)}
                className="text-sm border-blue-200 bg-white rounded-md py-2 px-3 text-slate-700"
              >
                <option value="">Select Branch...</option>
                {branches?.map((b: any) => (
                  <option key={b._id} value={b._id}>{b.name} ({b.category})</option>
                ))}
              </select>
              <button 
                onClick={() => bulkAssignMutation.mutate(selectedBulkBranch)}
                disabled={!selectedBulkBranch || bulkAssignMutation.isPending}
                className="bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {bulkAssignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bulk Assign'}
              </button>
            </div>
            <div className="w-px h-6 bg-blue-200 mx-1"></div>
            <button 
              onClick={() => bulkSyncMutation.mutate()}
              disabled={bulkSyncMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
            >
              {bulkSyncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bulk Sync'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <CloudUpload className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Pending Sync</h2>
        </div>

        {pendingLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading pending items...
          </div>
        ) : pending?.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            No pending assignments to sync.
          </div>
        ) : (
          <div className="space-y-10">
            {/* Pending: Circuital */}
            {pending?.filter((item: any) => item.branch_category === 'Circuital').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Circuital Branches
                </h3>
                <div className="space-y-2">
                  {pending.filter((item: any) => item.branch_category === 'Circuital').map((item: any) => renderBranchTable(item))}
                </div>
              </div>
            )}

            {/* Pending: Core */}
            {pending?.filter((item: any) => item.branch_category === 'Core').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2 mt-8">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  Core Branches
                </h3>
                <div className="space-y-2">
                  {pending.filter((item: any) => item.branch_category === 'Core').map((item: any) => renderBranchTable(item))}
                </div>
              </div>
            )}

            {/* Pending: Other */}
            {pending?.filter((item: any) => item.branch_category !== 'Circuital' && item.branch_category !== 'Core').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2 mt-8">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  Other Branches
                </h3>
                <div className="space-y-2">
                  {pending.filter((item: any) => item.branch_category !== 'Circuital' && item.branch_category !== 'Core').map((item: any) => renderBranchTable(item))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* History Section */}
      <section className="space-y-6 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 border-b pb-4">
          <History className="w-6 h-6 text-slate-600" />
          <h2 className="text-2xl font-bold text-slate-800">Sync History</h2>
        </div>

        {historyLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading history...
          </div>
        ) : history?.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            No sync history available yet.
          </div>
        ) : (
          <div className="space-y-10">
            {/* History: Circuital */}
            {history?.filter((item: any) => item.branch_category === 'Circuital').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Circuital Branches
                </h3>
                <div className="space-y-2">
                  {history.filter((item: any) => item.branch_category === 'Circuital').map((item: any) => renderBranchTable(item, true))}
                </div>
              </div>
            )}

            {/* History: Core */}
            {history?.filter((item: any) => item.branch_category === 'Core').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2 mt-8">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  Core Branches
                </h3>
                <div className="space-y-2">
                  {history.filter((item: any) => item.branch_category === 'Core').map((item: any) => renderBranchTable(item, true))}
                </div>
              </div>
            )}

            {/* History: Other */}
            {history?.filter((item: any) => item.branch_category !== 'Circuital' && item.branch_category !== 'Core').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2 mt-8">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  Other Branches
                </h3>
                <div className="space-y-2">
                  {history.filter((item: any) => item.branch_category !== 'Circuital' && item.branch_category !== 'Core').map((item: any) => renderBranchTable(item, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
