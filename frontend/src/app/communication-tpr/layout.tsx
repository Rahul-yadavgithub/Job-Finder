import React from 'react';
import { CommunicationAuthProvider } from '@/features/communicationTPR/hooks/useCommunicationAuth';

export default function CommunicationTPRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommunicationAuthProvider>
      {children}
    </CommunicationAuthProvider>
  );
}
