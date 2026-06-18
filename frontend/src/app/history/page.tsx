'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Clock, CheckCircle2, XCircle, Activity, Trash2, List, BarChart3, Building2, Calendar as CalendarIcon, Briefcase, GraduationCap, Building } from 'lucide-react';
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
  durationMs?: number;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'jobs' | 'branch' | 'stats'>('jobs');
  const [recordToDelete, setRecordToDelete] = useState<ScanRecord | null>(null);
  
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({ from: '', to: '' });

  // Jobs Log Query
  const { data: history, isLoading: historyLoading } = useQuery<ScanRecord[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history`);
      return res.data;
    },
    refetchInterval: (query) => {
      const currentData = query.state?.data as ScanRecord[] | undefined;
      return currentData?.some((record: ScanRecord) => ['RUNNING', 'QUEUED'].includes(record.status)) ? 5000 : false;
    },
  });

  // Branch Assignment Query
  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['history-branch-assignments'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history/assigned-by-branch`);
      return res.data;
    },
  });

  // Stats Query
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['history-scan-stats', dateRange.from, dateRange.to],
    queryFn: async () => {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/history/scan-stats?`;
      if (dateRange.from) url += `from=${dateRange.from}&`;
      if (dateRange.to) url += `to=${dateRange.to}`;
      const res = await axios.get(url);
      return res.data;
    },
  });

  // Current Cycle Stats Query
  const { data: currentStats } = useQuery({
    queryKey: ['history-current-scan-stats'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history/current-scan-stats`);
      return res.data;
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
      case 'COMPLETED': return <span title="Completed"><CheckCircle2 className="w-5 h-5 text-green-500" /></span>;
      case 'FAILED': return <span title={`Failed: ${errorMessage}`}><XCircle className="w-5 h-5 text-red-500" /></span>;
      case 'RUNNING': return <span title="Running"><Activity className="w-5 h-5 text-blue-500 animate-pulse" /></span>;
      case 'QUEUED': return <span title="Queued"><Clock className="w-5 h-5 text-amber-500" /></span>;
      default: return <span title={status}><Clock className="w-5 h-5 text-slate-400" /></span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Scanned History</h1>
        <p className="text-muted-foreground mt-1">
          Historical read-only views over all past data and background jobs.
        </p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-xl w-full overflow-x-auto no-scrollbar shadow-sm border border-slate-200/60">
        <div className="flex gap-2 min-w-max w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <List className="w-4 h-4 shrink-0" /> Jobs Log
          </button>
          <button
            onClick={() => setActiveTab('branch')}
            className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'branch' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" /> Assigned by Branch
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'stats' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" /> Scanned Data History
          </button>
        </div>
      </div>

      {activeTab === 'jobs' && (
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
                {historyLoading ? (
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
      )}

      {activeTab === 'branch' && (
        <div className="space-y-6">
          {branchLoading ? (
            <div className="text-center py-12 text-slate-500">Loading branch assignments...</div>
          ) : branchData?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No branch assignments found.</div>
          ) : (
            branchData?.map((branch: any) => (
              <div key={branch._id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-900">{branch.branchName}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{branch.companies.length} Companies</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Company</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Drive Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branch.companies.map((company: any) => (
                        <tr key={company._id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{company.companyName}</td>
                          <td className="px-6 py-3 text-slate-600">{company.role || '--'}</td>
                          <td className="px-6 py-3 text-slate-600">{company.drive_type || '--'}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                              {company.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-500">
                            {company.assigned_at ? format(new Date(company.assigned_at), 'MMM d, yyyy') : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-5">Historical Date Filter</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-5">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                <div className="relative">
                  <CalendarIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 sm:self-end">
                <button 
                  onClick={() => setDateRange({ from: '', to: '' })}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900">Custom Range Stats</h3>
              {statsLoading ? (
                <div className="text-slate-500">Loading stats...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-sm text-slate-500">Total Scanned</h4>
                    <p className="text-3xl font-bold mt-2 text-slate-900">{statsData?.totalScanned || 0}</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-sm text-slate-500">Total Reviewed</h4>
                    <p className="text-3xl font-bold mt-2 text-blue-600">{statsData?.totalReviewed || 0}</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-sm text-slate-500">Total Approved</h4>
                    <p className="text-3xl font-bold mt-2 text-green-600">{statsData?.totalApproved || 0}</p>
                  </div>
                  
                  <div className="col-span-2 mt-4 space-y-3">
                    <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Employment Breakdown</h4>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-pink-500" /> <span className="font-medium text-slate-700">Internship</span></div>
                      <span className="font-bold text-slate-900">{statsData?.breakdown?.internship || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500" /> <span className="font-medium text-slate-700">Full-Time (Fresher)</span></div>
                      <span className="font-bold text-slate-900">{statsData?.breakdown?.fullTime || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2"><Building className="w-5 h-5 text-orange-500" /> <span className="font-medium text-slate-700">Startup</span></div>
                      <span className="font-bold text-slate-900">{statsData?.breakdown?.startup || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Current Academic Cycle</h3>
                {currentStats?.current_cycle_start && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Since {format(new Date(currentStats.current_cycle_start), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-sm text-white">
                  <h4 className="font-semibold text-sm text-slate-400">Total Scanned</h4>
                  <p className="text-3xl font-bold mt-2">{currentStats?.totalScanned || 0}</p>
                </div>
                <div className="p-6 bg-blue-900 rounded-xl border border-blue-800 shadow-sm text-white">
                  <h4 className="font-semibold text-sm text-blue-200">Total Reviewed</h4>
                  <p className="text-3xl font-bold mt-2">{currentStats?.totalReviewed || 0}</p>
                </div>
                <div className="p-6 bg-emerald-900 rounded-xl border border-emerald-800 shadow-sm text-white">
                  <h4 className="font-semibold text-sm text-emerald-200">Total Approved</h4>
                  <p className="text-3xl font-bold mt-2">{currentStats?.totalApproved || 0}</p>
                </div>
                
                <div className="col-span-2 mt-4 space-y-3">
                  <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Employment Breakdown</h4>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-pink-500" /> <span className="font-medium text-slate-700">Internship</span></div>
                    <span className="font-bold text-slate-900">{currentStats?.breakdown?.internship || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500" /> <span className="font-medium text-slate-700">Full-Time (Fresher)</span></div>
                    <span className="font-bold text-slate-900">{currentStats?.breakdown?.fullTime || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2"><Building className="w-5 h-5 text-orange-500" /> <span className="font-medium text-slate-700">Startup</span></div>
                    <span className="font-bold text-slate-900">{currentStats?.breakdown?.startup || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
