'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import CompanyGroupCard from '@/components/ui/CompanyGroupCard';

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
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stats`);
      return res.data;
    },
  });

  const { data: targetCompanies, isLoading: targetLoading } = useQuery({
    queryKey: ['dashboard-target-companies'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/target-companies`);
      return res.data;
    },
  });

  const { data: confirmedCompanies, isLoading: confirmedLoading } = useQuery({
    queryKey: ['dashboard-confirmed-last-year'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/confirmed-last-year`);
      return res.data;
    },
  });

  const isLoading = statsLoading || targetLoading || confirmedLoading;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Discovery Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of College Placement Company Discovery.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:flex-row items-center justify-between">
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

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CompanyGroupCard
              title="Target Companies Coming This Year"
              description="Companies expected to visit for placement drives in the current academic year based on master records."
              academicYear={targetCompanies?.academic_year || 'Loading...'}
              total={targetCompanies?.total || 0}
              drive_types={targetCompanies?.drive_types || {}}
              roles={targetCompanies?.roles || {}}
              companies={targetCompanies?.companies || []}
            />

            <CompanyGroupCard
              title="Confirmed Placements (Past Year)"
              description="Actual synced companies that were confirmed to have hired students in the previous academic year."
              academicYear={confirmedCompanies?.academic_year || 'Loading...'}
              total={confirmedCompanies?.total || 0}
              drive_types={confirmedCompanies?.drive_types || {}}
              roles={confirmedCompanies?.roles || {}}
              companies={confirmedCompanies?.companies || []}
            />
          </div>
        </>
      )}
    </div>
  );
}
