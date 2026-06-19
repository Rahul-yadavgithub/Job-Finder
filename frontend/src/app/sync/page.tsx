'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CloudUpload, History, Loader2, DownloadCloud, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function SyncCenterPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();



  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['tpr-sync-history'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync-history`, { withCredentials: true });
      return res.data.data;
    },
    enabled: !!user
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/sync`, {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tpr-sync-history'] });
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

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs border border-indigo-100 mb-4">
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Master Synchronization</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Sync Center</h1>
          <p className="text-slate-500 mt-3 text-base leading-relaxed">
            Manage and push assigned companies seamlessly to your branch's Google Sheet tab. Keep your master records in perfect sync.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-4 relative z-10 w-full lg:w-auto mt-6 lg:mt-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 sm:flex-none">
            <button
              onClick={() => inboundSyncMutation.mutate()}
              disabled={inboundSyncMutation.isPending}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none whitespace-nowrap"
            >
              {inboundSyncMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
              Pull Updates — {user.branchName}
            </button>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none whitespace-nowrap"
            >
              {syncMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
              Push Sync — {user.branchName}
            </button>
          </div>
        </div>
      </div>

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
