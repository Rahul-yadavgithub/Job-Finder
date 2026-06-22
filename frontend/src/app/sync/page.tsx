'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CloudUpload, History, Loader2, DownloadCloud, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function SyncCenterPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['tpr-sync-history'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync-history`, { withCredentials: true });
      return res.data.data;
    },
    enabled: !!user
  });

  const { data: pendingCompanies, isLoading: pendingLoading } = useQuery({
    queryKey: ['tpr-sync-pending'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync/pending`, { withCredentials: true });
      return res.data.data;
    },
    enabled: !!user
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const payload = selectedIds.length > 0 ? { companyIds: selectedIds } : {};
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync`, payload, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['tpr-sync-pending'] });
      setSelectedIds([]);
      toast.success('Branch synced successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync branch');
    }
  });

  // Pull Updates is actually the inbound sync for this specific branch
  const inboundSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync/inbound`, {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Inbound Sync Complete!', {
        description: `Updated ${data.totalUpdated} companies. Conflicts: ${data.conflicts?.length || 0}`
      });
    },
    onError: () => {
      toast.error('Inbound sync failed.');
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync/pending/${companyId}`, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-sync-pending'] });
      toast.success('Company removed from sync queue');
    },
    onError: () => {
      toast.error('Failed to remove company');
    }
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (!pendingCompanies) return;
    if (selectedIds.length === pendingCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingCompanies.map((c: any) => c._id));
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 w-full max-w-none space-y-8 md:space-y-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl"></div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none md:block hidden">
          <CloudUpload className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-blue-100 text-[10px] font-bold tracking-wide uppercase shadow-sm mb-4">
            <CloudUpload className="w-3.5 h-3.5" />
            Official Workspace
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Sync Center</h1>
          <p className="text-blue-100/80 max-w-2xl text-sm leading-relaxed">
            Manage and push assigned companies seamlessly to your branch's Google Sheet tab. Keep your master records in perfect sync.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-3 w-full lg:w-auto mt-4 md:mt-0">
          <button
            onClick={() => inboundSyncMutation.mutate()}
            disabled={inboundSyncMutation.isPending}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors border border-white/20 shadow-sm backdrop-blur-sm whitespace-nowrap"
          >
            {inboundSyncMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
            Pull Updates — {user.branchName}
          </button>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || pendingCompanies?.length === 0}
            className="flex items-center justify-center gap-2 bg-white text-[#15335b] hover:bg-blue-50 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 font-bold py-2.5 px-6 rounded-lg transition-all shadow-[0_4px_12px_rgba(255,255,255,0.2)] whitespace-nowrap"
          >
            {syncMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
            Push Sync {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'} — {user.branchName}
          </button>
        </div>
      </div>

      {/* Pending Sync Section */}
      <section className="space-y-6 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 border-b pb-4">
          <CloudUpload className="w-6 h-6 text-slate-600" />
          <h2 className="text-2xl font-bold text-slate-800">Pending Sync</h2>
          {pendingCompanies && pendingCompanies.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              {pendingCompanies.length} companies waiting
            </span>
          )}
        </div>

        {pendingLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        ) : (!pendingCompanies || pendingCompanies.length === 0) ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3" />
            <h3 className="font-bold text-lg text-slate-700">All Caught Up!</h3>
            <p className="mt-1 text-sm">There are no approved companies waiting to be synced to the master database.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={!!pendingCompanies && pendingCompanies.length > 0 && selectedIds.length === pendingCompanies.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4 text-right">Approved At</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies?.map((company: any) => (
                    <tr key={company._id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${selectedIds.includes(company._id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          checked={selectedIds.includes(company._id)}
                          onChange={() => toggleSelection(company._id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{company.companyName}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {company.data_source === 'scan' ? 'Scanner' : 'Manual Entry'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-right">
                        {company.updatedAt ? format(new Date(company.updatedAt), 'MMM d, h:mm a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeMutation.mutate(company._id)}
                          disabled={removeMutation.isPending}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from Sync Queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="space-y-4 py-8">
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        ) : history?.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            No sync history available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {history?.map((item: any) => (
              <div key={item.id || item._id || Math.random()} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{user.branchName} Sync</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {format(new Date(item.lastSynced || item.created_at || item.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="block font-bold text-slate-800">{item.count || item.synced_count || 0}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Records</span>
                  </div>
                  <span className="inline-flex items-center justify-center text-xs font-bold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
