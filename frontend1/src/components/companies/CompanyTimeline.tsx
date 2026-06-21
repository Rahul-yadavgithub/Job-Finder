import React, { useEffect, useState } from 'react';
import { adminGet } from '@/lib/admin/api';
import { format } from 'date-fns';
import {
  History, Building2, FileText, CheckCircle2,
  ArrowRightCircle, ShieldCheck, MessageSquare, PhoneCall, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { CustomActivityForm } from './CustomActivityForm';

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
  users?: { name: string, branches?: { name: string } };
}

interface Workflow {
  workflow_type: string;
  display_name: string;
  status: string;
  allowed_states: string[];
  updated_at: string;
}

interface Props {
  companyId: string;
}

export function CompanyTimeline({ companyId }: Props) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Accordion states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    base: false,
    comm: true,
    head: true,
    custom: true
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tlRes, wfRes] = await Promise.all([
        adminGet<{ data: TimelineEvent[] }>(`/timeline/${companyId}`),
        adminGet<{ data: Workflow[] }>(`/companies/${companyId}/workflows`)
      ]);
      
      if (tlRes.data && Array.isArray(tlRes.data)) {
        setTimeline(tlRes.data);
        if (tlRes.data.length > 0) {
          setAssignmentId(tlRes.data[0].assignment_id);
        }
      }
      if (wfRes.data && Array.isArray(wfRes.data)) {
        setWorkflows(wfRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch timeline data', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleItemExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Group events
  const baseEvents = timeline.filter(e => e.performed_by_layer === 'base' || e.event_type === 'company_created');
  const commEvents = timeline.filter(e => e.performed_by_layer === 'comm');
  // Anything from admin or system goes to Head unless it's explicitly a custom note
  const adminEvents = timeline.filter(e => e.performed_by_layer === 'admin' && e.event_type !== 'note_added');
  const customEvents = timeline.filter(e => e.performed_by_layer === 'admin' && e.event_type === 'note_added');

  const getWorkflowByType = (type: string) => workflows.find(w => w.workflow_type === type);

  // Reusable Timeline List Component
  const renderEventList = (events: TimelineEvent[]) => {
    if (events.length === 0) return <div className="text-sm text-gray-400 italic p-4">No activities logged yet.</div>;
    
    return (
      <div className="relative border-l-2 border-gray-100 ml-4 space-y-4 pb-4 mt-4">
        {events.map((event) => {
          const isExpanded = expandedItems.has(event.id);
          const hasNotes = !!event.conversation_notes || !!event.description;
          const metadataKeys = event.metadata ? Object.keys(event.metadata).filter(k => event.metadata[k]) : [];
          
          return (
            <div key={event.id} className="relative pl-6">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-green-500 shadow-sm z-10" />
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{event.title}</h3>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-semibold text-gray-700">
                        {event.users?.name || 'System'}
                        {event.users?.branches?.name && <span className="text-green-600 ml-1">({event.users.branches.name})</span>}
                      </span>
                    </div>
                  </div>
                  <time className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                    {format(new Date(event.created_at), 'dd MMM yyyy, h:mm a')}
                  </time>
                </div>

                {metadataKeys.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {metadataKeys.map(key => (
                      <div key={key} className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-800 font-medium">{String(event.metadata[key])}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hasNotes && (
                  <div className="mt-2">
                    <button 
                      onClick={() => toggleItemExpand(event.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:text-black"
                    >
                      <MessageSquare size={14} /> 
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        {event.description && <p className="text-sm text-gray-700 mb-2">{event.description}</p>}
                        {event.conversation_notes && <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.conversation_notes}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const SectionAccordion = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">{title}</h3>
        </div>
        {openSections[id] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {openSections[id] && (
        <div className="p-4 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
    </div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-2">
      <SectionAccordion id="base" title="Base TPR Phase">
        {renderEventList(baseEvents)}
      </SectionAccordion>

      <SectionAccordion id="comm" title="Communication Phase">
        {renderEventList(commEvents)}
      </SectionAccordion>

      <SectionAccordion id="head" title="Head Review Phase">
        {renderEventList(adminEvents)}
      </SectionAccordion>

      <SectionAccordion id="custom" title="Custom Activities">
        <div className="mb-6">
          <CustomActivityForm companyId={companyId} onSuccess={fetchData} />
        </div>
        {renderEventList(customEvents)}
      </SectionAccordion>
    </div>
  );
}
