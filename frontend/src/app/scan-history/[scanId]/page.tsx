'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, Activity, 
  Database, AlertTriangle, FileSearch, Sparkles, Building2,
  Crosshair
} from 'lucide-react';

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

export default function ScanDetailsPage() {
  const { scanId } = useParams();
  const router = useRouter();

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

  const MetricCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/history')}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{record.platform} Scan</h1>
            {getStatusBadge()}
          </div>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            ID: {record._id} 
            <span className="text-slate-300">•</span> 
            {record.phase || 'Waiting'}
          </p>
        </div>
      </div>

      {record.status === 'FAILED' && record.errorMessage && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Scan Failed</h3>
            <p className="text-red-600 text-sm font-mono">{record.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Raw Discovered" 
          value={record.rawCompaniesFound} 
          icon={FileSearch} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <MetricCard 
          title="Validated" 
          value={record.validatedCompanies} 
          icon={CheckCircle2} 
          colorClass="bg-emerald-50 text-emerald-600" 
        />
        <MetricCard 
          title="Duplicates Merged" 
          value={record.duplicatesFound} 
          icon={Database} 
          colorClass="bg-amber-50 text-amber-600" 
        />
        <MetricCard 
          title="Net New Additions" 
          value={`+${record.newCompaniesAdded}`} 
          icon={Building2} 
          colorClass="bg-indigo-50 text-indigo-600" 
        />
      </div>

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

        {/* Technical Logs & AI Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Pipeline Intelligence
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-8">
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
