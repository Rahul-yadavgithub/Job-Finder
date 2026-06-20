'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search, X, Building2, Phone, Mail, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CompanyEntry {
  id: string;
  company_name: string;
  hr_name?: string;
  phone_number?: string;
  hr_email?: string;
  base_status: string;
  data_source?: string;
}

function CompanyCard({ company }: { company: CompanyEntry }) {
  const initial = (company.company_name || 'C')[0].toUpperCase();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-150">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{company.company_name}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-600">{company.base_status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {company.data_source && <span className="text-xs text-slate-500 uppercase">{company.data_source}</span>}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3">
        {company.hr_name || company.phone_number || company.hr_email ? (
          <div>
            {company.hr_name && <p className="text-xs font-bold text-slate-700 mb-1">HR: {company.hr_name}</p>}
            <div className="flex flex-wrap gap-3">
              {company.phone_number && (
                <a href={`tel:${company.phone_number}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Phone className="w-3 h-3" />{company.phone_number}
                </a>
              )}
              {company.hr_email && (
                <a href={`mailto:${company.hr_email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <Mail className="w-3 h-3" />{company.hr_email}
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />HR details not available
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardSlideOver({
  open, onClose, filter, title
}: { open: boolean; onClose: () => void; filter: string; title: string }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['tpr-companies-slideover', filter, page, debouncedSearch],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      
      // Map frontend filter to API status
      let apiStatus = '';
      if (filter === 'today') apiStatus = 'pending'; // assuming pending/not_contacted means today/overdue
      else if (filter === 'interested') apiStatus = 'interested';
      else if (filter === 'not_confirmed') apiStatus = 'call_again'; // or leave blank? Let's map it.
      
      if (apiStatus) queryParams.append('status', apiStatus);

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tpr/companies?${queryParams.toString()}`, {
        withCredentials: true
      });
      return res.data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const companies: CompanyEntry[] = data?.companies || [];
  const totalPages = data?.totalPages || 1;

  useEffect(() => { if (!open) { setSearch(''); setPage(1); } }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-250 ${open ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">Detailed company listings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-100 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Search companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : companies.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-500">No companies found</p>
              <p className="text-sm text-slate-400 mt-1">You're all caught up in this category.</p>
            </div>
          ) : (
            companies.map(c => <CompanyCard key={c.id} company={c} />)
          )}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <span className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
