'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';

interface DashboardStats {
  companiesFound: number;
  newCompaniesToday: number;
  freshersHiring: number;
  internships: number;
  startups: number;
  highConfidence: number;
  campusHiring: number;
  pendingReview: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  activeSourcesCount: number;
  lastScanTime: string | null;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stats`);
      return res.data;
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Discovery Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of College Placement Company Discovery.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="p-6 bg-card rounded-xl border shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Total Found</h3>
              <p className="text-4xl font-bold mt-2">{stats?.companiesFound || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Pending Review</h3>
              <p className="text-4xl font-bold mt-2 text-amber-500">{stats?.pendingReview || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Approved</h3>
              <p className="text-4xl font-bold mt-2 text-green-500">{stats?.approvedCompanies || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Campus Potential</h3>
              <p className="text-4xl font-bold mt-2 text-purple-500">{stats?.campusHiring || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Freshers Hiring</h3>
              <p className="text-4xl font-bold mt-2 text-blue-500">{stats?.freshersHiring || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Internships</h3>
              <p className="text-4xl font-bold mt-2 text-pink-500">{stats?.internships || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">Startups</h3>
              <p className="text-4xl font-bold mt-2 text-orange-500">{stats?.startups || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-500">High Confidence</h3>
              <p className="text-4xl font-bold mt-2 text-emerald-500">{stats?.highConfidence || 0}</p>
            </div>
          </div>
          
          <div className="mt-12 bg-white rounded-xl border shadow-sm p-6 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Manual Approval Queue</h2>
              <p className="text-slate-500 mt-1">
                You have {stats?.pendingReview || 0} companies waiting for review before adding to the placement database.
              </p>
            </div>
            <Link 
              href="/companies?status=PENDING_REVIEW"
              className="mt-4 md:mt-0 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Review Queue
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
