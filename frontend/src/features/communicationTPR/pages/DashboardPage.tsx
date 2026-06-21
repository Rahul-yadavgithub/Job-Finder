'use client';

import React from 'react';
import { useCommunicationAuth } from '../hooks/useCommunicationAuth';
import { MessageSquare, Users, Building2, Bell } from 'lucide-react';
import { FollowUpWidgets } from '../components/FollowUpWidgets';
import Link from 'next/link';

export function DashboardPage() {
  const { user } = useCommunicationAuth();

  const stats = [
    { id: 1, name: 'Active Communications', stat: '0', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 2, name: 'Pending Follow-ups', stat: '0', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 3, name: 'Companies Contacted', stat: '0', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 4, name: 'Team Members', stat: '0', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'TPR'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Here is what is happening with your communications today.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/communication-tpr/requests/new"
            className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            New Communication
          </Link>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100"
          >
            <dt>
              <div className={`absolute rounded-md ${item.bg} p-3`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Your Follow-ups</h2>
        <FollowUpWidgets />
      </div>
    </div>
  );
}
