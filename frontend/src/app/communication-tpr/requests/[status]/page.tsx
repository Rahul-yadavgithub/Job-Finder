import { QueueStatusListView } from '../../../../features/communicationTPR/pages/QueueStatusListView';

export default async function QueueStatusPage({ params }: { params: Promise<{ status: string }> }) {
  const resolvedParams = await params;
  return <QueueStatusListView status={resolvedParams.status} />;
}
