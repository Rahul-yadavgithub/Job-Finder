import { CompanyListPage } from '@/features/communicationTPR/pages/CompanyListPage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Companies - Communication TPR | JobFinder',
  description: 'Manage and view interested companies',
};

export default function Page() {
  return (
    <DashboardLayout>
      <CompanyListPage />
    </DashboardLayout>
  );
}
