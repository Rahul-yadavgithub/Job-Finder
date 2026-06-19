import { FollowUpCalendarPage } from '@/features/communicationTPR/pages/FollowUpCalendarPage';
import { DashboardLayout } from '@/features/communicationTPR/components/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Follow-ups Calendar - Communication TPR | JobFinder',
  description: 'Manage and view all your assigned follow-ups',
};

export default function Page() {
  return (
    <DashboardLayout>
      <FollowUpCalendarPage />
    </DashboardLayout>
  );
}
