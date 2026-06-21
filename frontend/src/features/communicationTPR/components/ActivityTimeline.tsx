import React from 'react';
import { Phone, Mail, Globe, StickyNote, RefreshCw, CalendarCheck, FileText, Send, User } from 'lucide-react';
import { CompanyActivity } from '../types/activity';

const activityIconMap: Record<string, { icon: React.ElementType, bg: string, color: string }> = {
  call: { icon: Phone, bg: 'bg-green-100 border-green-200', color: 'text-green-600' },
  email: { icon: Mail, bg: 'bg-blue-100 border-blue-200', color: 'text-blue-600' },
  linkedin: { icon: Globe, bg: 'bg-sky-100 border-sky-200', color: 'text-sky-600' },
  note: { icon: StickyNote, bg: 'bg-yellow-100 border-yellow-200', color: 'text-yellow-600' },
  status_change: { icon: RefreshCw, bg: 'bg-purple-100 border-purple-200', color: 'text-purple-600' },
  follow_up: { icon: CalendarCheck, bg: 'bg-blue-100 border-indigo-200', color: 'text-[#1b4376]' },
  brochure: { icon: FileText, bg: 'bg-rose-100 border-rose-200', color: 'text-rose-600' },
  transfer: { icon: Send, bg: 'bg-orange-100 border-orange-200', color: 'text-orange-600' },
  communication_request: { icon: Send, bg: 'bg-teal-100 border-teal-200', color: 'text-teal-600' },
  transferred_to_head: { icon: User, bg: 'bg-red-100 border-red-200', color: 'text-red-600' },
};

export function ActivityTimeline({ activities }: { activities: CompanyActivity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
        <StickyNote className="mx-auto h-8 w-8 text-gray-400 mb-3" />
        <h3 className="text-sm font-medium text-gray-900">No activity yet</h3>
        <p className="mt-1 text-sm text-gray-500">Log a call or add a note to get started.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => {
          const config = activityIconMap[activity.activityType] || { icon: StickyNote, bg: 'bg-gray-100', color: 'text-gray-600' };
          const Icon = config.icon;

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white border ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1.5">
                    <div className="text-sm text-gray-500 flex justify-between">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        {activity.userName ? (
                          <>
                            <User className="h-4 w-4 text-gray-400" />
                            {activity.userName}
                            {activity.userBranch && <span className="text-[#1b4376] font-medium">({activity.userBranch})</span>}
                          </>
                        ) : (
                          <span className="text-gray-500 italic">System</span>
                        )}
                        <span className="font-normal text-gray-500 capitalize ml-1 border-l pl-3">
                          {activity.activityType.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="whitespace-nowrap text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {activity.notes && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50/50 rounded-lg p-3 border border-gray-100 whitespace-pre-wrap">
                        {activity.notes}
                      </div>
                    )}
                    {activity.metadata?.outcome && (
                      <div className="mt-2 text-xs">
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          Outcome: {activity.metadata.outcome}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
