'use client';

import React, { useState, useEffect } from 'react';
import { Search, LayoutGrid, List as ListIcon, ChevronLeft, Building2 } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { InterestedCompany } from '../types/company';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyTable } from '../components/CompanyTable';
import { BranchFilter } from '../components/BranchFilter';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

const limit = 12;

export function CompanyListPage() {
  const [companies, setCompanies] = useState<InterestedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset page on new search
      fetchCompanies();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, branchId]);

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companyApi.getInterestedCompanies({
        page,
        limit: 12,
        search: search || undefined,
        branchId: branchId || undefined
      });
      setCompanies(res.data);
      setTotalPages(res.meta.pages);
      setTotalItems(res.meta.total);
    } catch (err) {
      setError('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Building2 size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <Building2 size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Companies</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              View and manage all companies that have been contacted.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#1b4376] sm:text-sm sm:leading-6"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-4">
          <div className="w-full sm:w-48">
            <BranchFilter value={branchId} onChange={setBranchId} />
          </div>
          
          <div className="hidden sm:flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm text-[#15335b]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#15335b]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCompanies} />
      ) : companies.length === 0 ? (
        <EmptyState 
          title="No companies found" 
          description={search ? "We couldn't find any companies matching your search." : "There are currently no interested companies to display."} 
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{companies.length}</span> of <span className="font-medium text-gray-900">{totalItems}</span> companies
          </div>

          {viewMode === 'grid' || (typeof window !== 'undefined' && window.innerWidth < 640) ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <CompanyTable companies={companies} />
          )}

          {totalPages > 1 && (
            <div className="mt-4 pb-12">
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={companies.length < limit}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setPage(page > 1 ? page - 1 : 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={companies.length < limit}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
