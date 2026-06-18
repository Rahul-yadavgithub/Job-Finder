'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, Activity, 
  Database, AlertTriangle, FileSearch, Sparkles, Building2,
  Crosshair, Globe, PlusCircle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { useState } from 'react';

interface ScanRecord {
  _id: string;
  date: string;
  startedAt?: string;
  completedAt?: string;
  platform: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  phase?: string;
  scraperUsed?: string;
  scraperVersion?: string;
  rawCompaniesFound: number;
  validatedCompanies: number;
  rejectedCompanies: number;
  duplicatesFound: number;
  newCompaniesAdded: number;
  durationMs: number;
  averagePlacementScore: number;
  averageAiConfidence: number;
}

interface RawDiscovery {
  _id: string;
  companyName: string;
  website?: string;
  description?: string;
  source: string;
  sourceUrl: string;
  careersUrl?: string;
  salaryText?: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'DUPLICATE' | 'DISCARDED_LOW_SALARY';
  createdAt: string;
}

export default function ScanDetailsPage() {
  const { scanId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showRaw, setShowRaw] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: record, isLoading } = useQuery<ScanRecord>({
    queryKey: ['scan-history', scanId],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history/${scanId}`);
      return res.data;
    },
    refetchInterval: (query) => {
      const currentData = query.state?.data as ScanRecord | undefined;
      return currentData && ['RUNNING', 'QUEUED'].includes(currentData.status) ? 3000 : false;
    },
  });

  const { data: rawDiscoveries, isLoading: rawLoading } = useQuery<RawDiscovery[]>({
    queryKey: ['raw-discoveries', scanId],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/history/${scanId}/raw`);
      return res.data;
    },
    enabled: showRaw,
  });

  const validateMutation = useMutation({
    mutationFn: async (rawId: string) => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/history/raw/${rawId}/validate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-discoveries', scanId] });
      queryClient.invalidateQueries({ queryKey: ['scan-history', scanId] });
      setAddingId(null);
    },
    onError: () => setAddingId(null),
  });

  const handleAddToDb = (rawId: string) => {
    setAddingId(rawId);
    validateMutation.mutate(rawId);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse mb-4" />
          <p className="text-slate-500">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Not Found</h2>
        <button onClick={() => router.push('/history')} className="text-blue-600 hover:underline">
          Return to History
        </button>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (record.status) {
      case 'COMPLETED': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200"><CheckCircle2 className="w-4 h-4"/> Completed</span>;
      case 'FAILED': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold border border-red-200"><XCircle className="w-4 h-4"/> Failed</span>;
      case 'RUNNING': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200"><Activity className="w-4 h-4 animate-pulse"/> Running</span>;
      case 'QUEUED': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-200"><Clock className="w-4 h-4"/> Queued</span>;
      default: return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">{record.status}</span>;
    }
  };

  const getRawStatusBadge = (status: RawDiscovery['status']) => {
    switch (status) {
      case 'VALIDATED': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Validated</span>;
      case 'DUPLICATE': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Duplicate</span>;
      case 'REJECTED': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">AI Rejected</span>;
      case 'PENDING': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Pending</span>;
      case 'DISCARDED_LOW_SALARY': return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">Low Salary</span>;
    }
  };

  const rejectedCount = rawDiscoveries?.filter(r => r.status === 'REJECTED').length ?? 0;
  const validatedCount = rawDiscoveries?.filter(r => r.status === 'VALIDATED').length ?? 0;
  const duplicateCount = rawDiscoveries?.filter(r => r.status === 'DUPLICATE').length ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/history')}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{record.platform} Scan</h1>
            {getStatusBadge()}
          </div>
          <p className="text-slate-500 text-xs md:text-sm mt-1 truncate">
            ID: {record._id} <span className="text-slate-300">•</span> {record.phase || 'Waiting'}
          </p>
        </div>
      </div>

      {record.status === 'FAILED' && record.errorMessage && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Scan Failed</h3>
            <p className="text-red-600 text-sm font-mono break-all">{record.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Stats Grid — Raw Discovered is clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Clickable Raw Discovered card */}
        <div
          onClick={() => record.rawCompaniesFound > 0 && setShowRaw(v => !v)}
          className={`bg-white p-5 md:p-6 rounded-2xl border shadow-sm flex items-start gap-3 md:gap-4 transition-all duration-200
            ${record.rawCompaniesFound > 0 ? 'cursor-pointer hover:shadow-md hover:border-blue-300 select-none' : ''}
            ${showRaw ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}
          `}
        >
          <div className="p-2.5 md:p-3 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
            <FileSearch className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">Raw Discovered</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{record.rawCompaniesFound}</p>
          </div>
          {record.rawCompaniesFound > 0 && (
            <div className="self-center text-slate-400 flex-shrink-0">
              {showRaw ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
            </div>
          )}
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">Validated</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{record.validatedCompanies}</p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
            <Database className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">Duplicates Merged</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{record.duplicatesFound}</p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">Net New Additions</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">+{record.newCompaniesAdded}</p>
          </div>
        </div>
      </div>

      {/* Raw Discovered Expanded Section */}
      {showRaw && (
        <div className="mb-8 bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-blue-600" />
                Raw Discovered Companies
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Companies found by the scraper. Click <span className="font-semibold text-green-600">Add</span> on AI-rejected ones to manually validate &amp; push to main database.
              </p>
            </div>
            {rawDiscoveries && (
              <div className="flex flex-wrap gap-2 text-xs font-semibold shrink-0">
                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full">{validatedCount} Validated</span>
                <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">{duplicateCount} Duplicate</span>
                <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full">{rejectedCount} Rejected</span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {rawLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : !rawDiscoveries?.length ? (
              <div className="text-center py-16 text-slate-500">
                <FileSearch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No raw discoveries found for this scan.</p>
                <p className="text-sm mt-1 text-slate-400">This scan may have been run before the Raw Discovery feature was enabled.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 md:px-6 py-4">Company Details</th>
                    <th className="px-4 md:px-6 py-4 hidden md:table-cell">Source</th>
                    <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Package</th>
                    <th className="px-4 md:px-6 py-4">AI Status</th>
                    <th className="px-4 md:px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rawDiscoveries.map((raw) => (
                    <tr key={raw._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-col max-w-[200px] md:max-w-xs lg:max-w-sm">
                          <span className="font-semibold text-slate-900 leading-tight">{raw.companyName}</span>
                          {raw.website ? (
                            <a 
                              href={raw.website.startsWith('http') ? raw.website : `https://${raw.website}`} 
                              target="_blank" rel="noopener noreferrer" 
                              className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1 truncate"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" /> {raw.website}
                            </a>
                          ) : raw.sourceUrl ? (
                            <a 
                              href={raw.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:underline mt-1 truncate"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" /> View Source
                            </a>
                          ) : null}
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{raw.description || 'No description available'}</p>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">{raw.source}</span>
                      </td>
                      <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                        {raw.salaryText ? (
                          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">{raw.salaryText}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Not listed</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        {getRawStatusBadge(raw.status)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        {raw.status === 'REJECTED' ? (
                          <button
                            onClick={() => handleAddToDb(raw._id)}
                            disabled={addingId === raw._id}
                            className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                            title="Add to Database with full AI Enrichment"
                          >
                            {addingId === raw._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PlusCircle className="w-3.5 h-3.5" />
                            )}
                            {addingId === raw._id ? 'Adding...' : 'Add'}
                          </button>
                        ) : raw.status === 'VALIDATED' ? (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-end whitespace-nowrap">
                            <CheckCircle2 className="w-4 h-4" /> In DB
                          </span>
                        ) : raw.status === 'DUPLICATE' ? (
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 justify-end whitespace-nowrap">
                            <Database className="w-4 h-4" /> Exists
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timing Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Timing Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 text-sm">Created</span>
              <span className="font-medium text-slate-900 text-sm">{format(new Date(record.date), 'MMM d, yyyy HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 text-sm">Started</span>
              <span className="font-medium text-slate-900 text-sm">{record.startedAt ? format(new Date(record.startedAt), 'MMM d, yyyy HH:mm:ss') : '--'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 text-sm">Completed</span>
              <span className="font-medium text-slate-900 text-sm">{record.completedAt ? format(new Date(record.completedAt), 'MMM d, yyyy HH:mm:ss') : '--'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 text-sm">Total Duration</span>
              <span className="font-bold text-slate-900">
                {record.durationMs > 0 ? `${(record.durationMs / 1000).toFixed(1)}s` : (record.status === 'RUNNING' ? 'Running...' : '--')}
              </span>
            </div>
          </div>
        </div>

        {/* Pipeline Intelligence */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Pipeline Intelligence
          </h3>

          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> Avg Placement Score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{record.averagePlacementScore || 0}</span>
                <span className="text-slate-400 text-sm mb-1">/ 100</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Avg AI Confidence
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900">{record.averageAiConfidence || 0}</span>
                <span className="text-slate-400 text-sm mb-1">/ 100</span>
              </div>
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Diagnostic Info</h4>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-slate-500">Scraper Core:</div>
            <div className="font-medium font-mono text-slate-700">{record.scraperUsed || 'Unknown'}</div>
            <div className="text-slate-500">Core Version:</div>
            <div className="font-medium font-mono text-slate-700">{record.scraperVersion || 'Unknown'}</div>
            <div className="text-slate-500">Rejected Items:</div>
            <div className="font-medium text-red-600">{record.rejectedCompanies}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
