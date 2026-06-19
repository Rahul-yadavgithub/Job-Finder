import { DashboardPage } from '@/features/communicationTPR/pages/DashboardPage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Communication TPR | JobFinder',
  description: 'Communication TPR Dashboard',
};

export default function Page() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
