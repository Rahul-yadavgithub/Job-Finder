import React, { useEffect, useState } from 'react';
import { adminGet } from '@/lib/admin/api';
import { format } from 'date-fns';
import {
  History, Building2, Mail, FileText, CheckCircle2, XCircle, User,
  ArrowRightCircle, ShieldCheck, MailWarning, FileSearch, MessageSquare, PhoneCall, ChevronDown, ChevronUp
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
  conversation_notes?: string;
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getEventIcon = (eventType: string) => {
    if (eventType === 'company_created') return <Building2 size={16} />;
    if (eventType === 'initial_call' || eventType === 'call_not_picked' || eventType === 'callback_requested') return <PhoneCall size={16} />;
    if (eventType === 'interested') return <CheckCircle2 size={16} />;
    if (eventType === 'note_added') return <MessageSquare size={16} />;
    if (eventType.includes('brochure') || eventType.includes('document')) return <FileText size={16} />;
    if (eventType.includes('followup')) return <History size={16} />;
    if (eventType.includes('transferred') || eventType.includes('assigned')) return <ArrowRightCircle size={16} />;
    if (eventType.includes('review') || eventType.includes('completed')) return <ShieldCheck size={16} />;
    return <History size={16} />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType === 'company_created' || eventType.includes('completed') || eventType === 'interested') 
      return 'text-green-600 bg-green-100 border-green-200';
    if (eventType === 'call_not_picked' || eventType.includes('reject')) 
      return 'text-red-600 bg-red-100 border-red-200';
    if (eventType.includes('brochure') || eventType.includes('document')) 
      return 'text-purple-600 bg-purple-100 border-purple-200';
    if (eventType.includes('followup') || eventType.includes('callback') || eventType === 'initial_call') 
      return 'text-orange-600 bg-orange-100 border-orange-200';
    if (eventType.includes('transferred') || eventType.includes('assigned') || eventType.includes('review')) 
      return 'text-blue-600 bg-blue-100 border-blue-200';
    return 'text-indigo-600 bg-indigo-100 border-indigo-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
            <div className="flex-1 space-y-2 py-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
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
    <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pb-4">
      {timeline.map((event, index) => {
        const isExpanded = expandedItems.has(event.id);
        const hasNotes = !!event.conversation_notes || !!event.description;
        const metadataKeys = event.metadata ? Object.keys(event.metadata).filter(k => event.metadata[k]) : [];
        const hasMetadata = metadataKeys.length > 0;

        return (
          <div key={event.id} className="relative pl-8">
            {/* Timeline Dot */}
            <div className={`absolute -left-[21px] top-1 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white ${getEventColor(event.event_type)} shadow-sm z-10`}>
              {getEventIcon(event.event_type)}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3 border-b border-gray-50 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {event.users?.name || 'System Auto'}
                      </span>
                      {event.performed_by_layer && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md capitalize">
                          {event.performed_by_layer} TPR
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <time className="text-xs font-semibold text-gray-500 whitespace-nowrap pt-1">
                    {format(new Date(event.created_at), 'dd MMM yyyy, h:mm a')}
                  </time>
                </div>

                {/* Metadata details (Outcome, Reason, Assigned To, etc) */}
                {hasMetadata && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    {metadataKeys.map(key => (
                      <div key={key} className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-800 font-medium">{String(event.metadata[key])}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expandable Conversation Notes */}
                {hasNotes && (
                  <div className="mt-2 pt-2">
                    <button 
                      onClick={() => toggleExpand(event.id)}
                      className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <MessageSquare size={16} /> 
                      {isExpanded ? 'Hide Conversation' : 'View Conversation'}
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-4 animate-in slide-in-from-top-2 duration-200">
                        {event.description && (
                          <div className="mb-3">
                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Activity Context</p>
                            <p className="text-sm text-gray-800">{event.description}</p>
                          </div>
                        )}
                        {event.conversation_notes && (
                          <div>
                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Conversation Summary</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
                              {event.conversation_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
