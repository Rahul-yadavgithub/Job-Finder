import { NewRequestWizardPage } from '@/features/communicationTPR/pages/NewRequestWizardPage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send Communication | JobFinder',
  description: 'Compose and send official emails to interested companies',
};

export default function Page() {
  return (
    <DashboardLayout>
      <NewRequestWizardPage />
    </DashboardLayout>
  );
}
