import React, { useEffect, useState } from 'react';
import { adminGet } from '@/lib/admin/api';
import { format } from 'date-fns';
import {
  History, Building2, Mail, FileText, CheckCircle2, XCircle, User,
  ArrowRightCircle, ShieldCheck, MailWarning, FileSearch
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  company_id: string;
  assignment_id: string;
  event_type: string;
  performed_by: string;
  performed_by_layer: string;
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
  users?: { name: string };
}

interface Props {
  companyId: string;
}

export function CompanyTimeline({ companyId }: Props) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchTimeline();
    }
  }, [companyId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await adminGet<{ data: TimelineEvent[] }>(`/timeline/${companyId}`);
      if (res.data && Array.isArray(res.data)) {
        setTimeline(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch timeline', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('status_change')) return <ArrowRightCircle size={16} />;
    if (eventType.includes('document') || eventType.includes('brochure') || eventType.includes('jnf')) return <FileText size={16} />;
    if (eventType.includes('followup') || eventType.includes('email')) return <Mail size={16} />;
    if (eventType.includes('approve') || eventType.includes('confirm')) return <CheckCircle2 size={16} />;
    if (eventType.includes('reject') || eventType.includes('revoke')) return <XCircle size={16} />;
    if (eventType.includes('request')) return <FileSearch size={16} />;
    return <History size={16} />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('status_change')) return 'text-blue-600 bg-blue-100 border-white';
    if (eventType.includes('approve') || eventType.includes('confirm')) return 'text-green-600 bg-green-100 border-white';
    if (eventType.includes('reject') || eventType.includes('revoke') || eventType.includes('fail')) return 'text-red-600 bg-red-100 border-white';
    if (eventType.includes('document') || eventType.includes('brochure') || eventType.includes('jnf')) return 'text-purple-600 bg-purple-100 border-white';
    if (eventType.includes('followup') || eventType.includes('email')) return 'text-amber-600 bg-amber-100 border-white';
    return 'text-indigo-600 bg-indigo-100 border-white';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return <div className="text-center text-gray-500 py-12">No timeline events found.</div>;
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {timeline.map((event) => (
        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${getEventColor(event.event_type)}`}>
            {getEventIcon(event.event_type)}
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-slate-900 text-sm capitalize">
                {event.performed_by_layer || 'system'} Layer
              </div>
              <time className="text-xs font-medium text-slate-500">{format(new Date(event.created_at), 'MMM d, h:mm a')}</time>
            </div>
            <div className="font-semibold text-gray-800 mb-1">{event.title}</div>
            {event.description && (
              <div className="text-sm text-slate-600 mb-3">
                {event.description}
              </div>
            )}
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-2 bg-gray-50 inline-flex px-2 py-1 rounded">
              <User size={12} /> {event.users?.name || 'System Auto'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
