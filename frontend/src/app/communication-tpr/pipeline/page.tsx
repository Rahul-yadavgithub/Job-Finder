import { PipelinePage } from '@/features/communicationTPR/pages/PipelinePage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pipeline - Communication TPR',
  description: 'Manage the communication lifecycle and head transfer pipeline',
};

export default function Page() {
  return (
    <DashboardLayout>
      <PipelinePage />
    </DashboardLayout>
  );
}
