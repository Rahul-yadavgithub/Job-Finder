import { CommunicationQueuePage } from '@/features/communicationTPR/pages/CommunicationQueuePage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Requests Queue - Communication TPR | JobFinder',
  description: 'Manage and view all brochure and official communication requests',
};

export default function Page() {
  return (
    <DashboardLayout>
      <CommunicationQueuePage />
    </DashboardLayout>
  );
}
