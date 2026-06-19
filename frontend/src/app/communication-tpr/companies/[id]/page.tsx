import { CompanyDetailPage } from '@/features/communicationTPR/pages/CompanyDetailPage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company Detail - Communication TPR | JobFinder',
  description: 'View interested company details',
};

export default function Page() {
  return (
    <DashboardLayout>
      <CompanyDetailPage />
    </DashboardLayout>
  );
}
