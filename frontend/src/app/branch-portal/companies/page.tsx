'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/tpr/api';
import { Company } from '@/lib/tpr/types';
import { StatusDropdown } from '@/components/tpr/StatusDropdown';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // empty = all
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle tab change
  const handleTabChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (statusFilter) queryParams.append('status', statusFilter);

      const res = await fetchApi<any>(`/tpr/companies?${queryParams.toString()}`);
      setCompanies(res.companies || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch companies', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleStatusUpdate = (companyId: string, newStatus: string) => {
    setCompanies(prev => 
      prev.map(c => c.id === companyId ? { ...c, base_status: newStatus } : c)
    );
  };

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending / Not Contacted', value: 'pending' },
    { label: 'Interested / Locked', value: 'interested' },
    { label: 'Follow up needed', value: 'call_again' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Database</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your branch's outreach queue.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`whitespace-nowrap px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              statusFilter === tab.value 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <p>No companies found matching your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium">HR Info</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium">Last Updated</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{company.company_name}</p>
                      <a href={company.website || '#'} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                        {company.website || 'No website'}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{company.hr_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{company.phone_number || 'No phone'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]" title={company.hr_email || ''}>
                        {company.hr_email || 'No email'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs uppercase font-medium">
                        {company.data_source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(company.status_updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusDropdown 
                        companyId={company.id}
                        currentStatus={company.base_status}
                        isLocked={['interested'].includes(company.base_status)}
                        layer="base"
                        onSuccess={(newStatus) => handleStatusUpdate(company.id, newStatus)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {!loading && companies.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to <span className="font-medium">{Math.min(page * 20, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-1 rounded border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
