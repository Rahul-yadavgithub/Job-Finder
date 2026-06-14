'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Activity, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useState } from 'react';

interface ScanRecord {
  _id: string;
  date: string;
  platform: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  phase?: string;
  rawCompaniesFound: number;
  validatedCompanies: number;
  newCompaniesAdded: number;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [recordToDelete, setRecordToDelete] = useState<ScanRecord | null>(null);
  
  const { data: history, isLoading } = useQuery<ScanRecord[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history`);
      return res.data;
    },
    // Poll every 5 seconds if there are running or queued jobs
    refetchInterval: (query) => {
      const currentData = query.state?.data as ScanRecord[] | undefined;
      return currentData?.some((record: ScanRecord) => ['RUNNING', 'QUEUED'].includes(record.status)) ? 5000 : false;
    },
  });

  const deleteHistory = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success('History record deleted');
      setRecordToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete history record');
      setRecordToDelete(null);
    }
  });

  const getStatusIcon = (status: string, errorMessage?: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-green-500" title="Completed" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-500" title={`Failed: ${errorMessage}`} />;
      case 'RUNNING': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" title="Running" />;
      case 'QUEUED': return <Clock className="w-5 h-5 text-amber-500" title="Queued" />;
      default: return <Clock className="w-5 h-5 text-slate-400" title={status} />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Scan History</h1>
        <p className="text-muted-foreground mt-1">
          A log of all automated extraction jobs run by the background workers.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Found</th>
                <th className="px-6 py-4">Validated</th>
                <th className="px-6 py-4 text-green-500">Added</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-200 bg-white">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-8"></div></td>
                  </tr>
                ))
              ) : history?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No scan history available. Try running a scan from the Scan Center.
                  </td>
                </tr>
              ) : (
                history?.map((record) => (
                  <tr 
                    key={record._id} 
                    className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/scan-history/${record._id}`}
                  >
                    <td className="px-6 py-4">
                      {getStatusIcon(record.status, record.errorMessage)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 w-fit">
                          {record.platform}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">{format(new Date(record.date), 'MMM d, HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                      {record.phase || record.status}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {record.rawCompaniesFound}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {record.validatedCompanies}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-500">
                      +{record.newCompaniesAdded}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : '--'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordToDelete(record);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Delete History"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={() => recordToDelete && deleteHistory.mutate(recordToDelete._id)}
        isDeleting={deleteHistory.isPending}
        title="Delete Scan History"
        description="Are you sure you want to delete this scan history record? This will permanently remove the log, but it will not affect any companies that were already extracted and saved to your database."
        itemName={recordToDelete ? `${recordToDelete.platform} Scan (${format(new Date(recordToDelete.date), 'MMM d, yyyy HH:mm')})` : undefined}
      />
    </div>
  );
}
