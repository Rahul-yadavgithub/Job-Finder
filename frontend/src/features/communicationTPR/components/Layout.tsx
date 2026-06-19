'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { LoadingState } from './LoadingState';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useCommunicationAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null; // The interceptor or page component will handle redirection
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
