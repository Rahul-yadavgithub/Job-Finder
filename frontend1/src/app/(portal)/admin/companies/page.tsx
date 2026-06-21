'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { 
  Building2, Search, Filter, History, X, ChevronRight, CheckCircle2, AlertCircle, Clock, User, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CompanyTimeline } from '@/components/companies/CompanyTimeline';
import Link from 'next/link';

export default function AdminCompaniesPage() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending_mid_review: 0, added_today: 0 });
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(searchParams.get('tab') || 'all');
  const [branchFilter, setBranchFilter] = useState('');
  
  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchBranches();
    }
  }, [user, tab, branchFilter]);

  // Debounced Search Effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes] = await Promise.all([
        adminGet<{ data: any }>('/companies/stats'),
        adminGet<{ data: any[] }>('/companies', { search, status: tab === 'all' ? '' : tab, branch_id: branchFilter, limit: 50 })
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (compRes.data) setCompanies(compRes.data);
    } catch (error) {
      console.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      // Assuming a general branches endpoint exists, or extracting from a known route.
      // If not, we will rely on manual entry or empty for now.
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  const openTimeline = async (company: any) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  };

  const updateTab = (newTab: string) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  const renderStatusBadge = (company: any) => {
    if (company.top_status) {
      return <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Top: {company.top_status}</span>;
    }
    if (company.mid_status) {
      const isConfirmed = company.mid_status === 'accepted';
      return <span className={`px-2 py-1 rounded text-xs font-bold border ${isConfirmed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>Mid: {company.mid_status}</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">Base: {company.base_status}</span>;
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Companies Database</h1>
        <p className="text-gray-500">Global overview across all branches</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Companies', value: stats.total, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Confirmed (Mid)', value: stats.confirmed, color: 'bg-green-50 text-green-700' },
          { label: 'Pending Review', value: stats.pending_mid_review, color: 'bg-amber-50 text-amber-700' },
          { label: 'Added Today', value: stats.added_today, color: 'bg-blue-50 text-blue-700' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-2">{s.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>Live</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            {['all', 'confirmed', 'pending', 'new'].map(t => (
              <button
                key={t}
                onClick={() => updateTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search companies..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {/* Optional Branch Filter Dropdown would go here */}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-8 space-y-4 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>)}
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Building2 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No companies found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">HR Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Added By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors border-b border-transparent hover:border-indigo-100/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{c.company_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.branch_name ? (
                        <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded text-xs border border-indigo-100">
                          {c.branch_name}
                        </span>
                      ) : <span className="text-gray-400 text-xs italic">Unknown</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.hr_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{c.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(c)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{c.added_by_name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openTimeline(c)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        title="View Timeline"
                      >
                        <History size={18} />
                      </button>
                      <Link 
                        href={`/admin/companies/${c.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="View Details"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-in Timeline Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)}></div>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col relative z-10 transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCompany?.name}</h2>
                <p className="text-sm text-gray-500">Activity Timeline</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 border shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedCompany && (
                <CompanyTimeline companyId={selectedCompany.id} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
