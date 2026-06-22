'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Phone, Mail, Calendar, Clock, BookOpen, AlertCircle, Users, Send, Network, Lock, Activity, XCircle } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { CompanyActivity } from '../types/activity';
import { DetailedCompany } from '../types/company';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { CompanyTimeline } from '../components/CompanyTimeline';
import { CommWorkflowTracker, CommPhase } from '../components/CommWorkflowTracker';
import { RequestFormModal } from '../components/RequestFormModal';
import { ScheduleFollowUpModal } from '../components/ScheduleFollowUpModal';
import { activityApi } from '../services/activity.api';
import { RequestHistory } from '../components/RequestHistory';
import { ActivityTimeline } from '../components/ActivityTimeline';

export function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [company, setCompany] = useState<DetailedCompany | null>(null);
  const [activities, setActivities] = useState<CompanyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [revertNotes, setRevertNotes] = useState('');
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyDetail();
      fetchActivities();
    }
  }, [id]);

  const fetchActivities = async () => {
    try {
      const res = await activityApi.getCompanyActivities(id as string);
      if (res.success) setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activities', err);
    }
  };

  const fetchCompanyDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companyApi.getCompanyDetail(id as string);
      setCompany(res.data);
    } catch (err) {
      setError('Failed to load company details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!confirm('Are you sure you want to transfer this company to the Head Portal? You will no longer be able to edit it.')) return;
    setIsTransferring(true);
    try {
      await companyApi.transferToHead(id as string);
      await fetchCompanyDetail();
      await fetchActivities();
    } catch (e) {
      alert('Failed to transfer company');
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !company) return <ErrorState message={error || 'Company not found'} onRetry={fetchCompanyDetail} />;

  const isLocked = company.currentStatus.editingLocked;
  const isReadyForHead = company.currentStatus.midStatus === 'ready_for_head_review';

  const getLifecyclePhase = (): CommPhase => {
    const primaryStatus = company.currentStatus;
    
    if (primaryStatus.midStatus === 'rejected') {
      return 'rejected';
    }
    if (primaryStatus.editingLocked || primaryStatus.midStatus === 'transferred_to_head' || primaryStatus.midStatus === 'accepted' || primaryStatus.baseStatus === 'rejected' || primaryStatus.midStatus === 'revoked') {
      return 'completed';
    }
    if (primaryStatus.midStatus === 'pending_staff_review' || primaryStatus.midStatus === 'ready_for_head_review' || primaryStatus.midStatus === 'pending_review') {
      return 'tpo_staff_review';
    }
    if (primaryStatus.midStatus === 'under_communication') {
      return 'email_drafted';
    }
    return 'new_arrival';
  };

  const currentPhase = getLifecyclePhase();

  return (
    <div className="space-y-6 w-full max-w-none px-4 sm:px-6 lg:px-8 pb-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Building2 size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <button 
              onClick={() => router.push('/communication-tpr/companies')}
              className="p-3 text-[#1b4376] bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-lg shrink-0 flex items-center justify-center mt-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 backdrop-blur-sm">
                  <Building2 size={14} /> Official Workspace
                </div>
                {isLocked ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-100 border border-red-500/30 backdrop-blur-sm">
                    <Lock className="w-3 h-3 mr-1" />
                    Transferred to Head Team (Read Only)
                  </span>
                ) : company.currentStatus.locked && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-100 border border-amber-500/30 backdrop-blur-sm">
                    Locked by Mid TPR
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{company.companyName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100 opacity-90">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                  <span>Branch: <b>{company.branch}</b></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                  <span>Added by: <b>{company.assignedTPR || 'Unknown'}</b></span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm capitalize">
                  Pipeline Stage: {(company.currentStatus.midStatus || 'interested').replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isLocked && isReadyForHead && (
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold text-sm transition-colors shadow-lg disabled:opacity-50"
              >
                <Network className="w-4 h-4" />
                {isTransferring ? 'Transferring...' : 'Transfer to Head Portal'}
              </button>
            )}

            {!isLocked && (company.currentStatus.midStatus === 'interested' || company.currentStatus.midStatus === 'under_communication') && (
              <button
                onClick={() => router.push(`/communication-tpr/requests/new?company=${company.id}`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#15335b] rounded-xl hover:bg-blue-50 font-bold text-sm transition-colors shadow-lg border border-white/20"
              >
                <Send className="w-4 h-4" />
                Start Communication
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Column */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Rejection Resolution Section */}
          {company.currentStatus.midStatus === 'rejected' && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4">
              <div className="border-b border-red-100 px-6 py-4 bg-red-50 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold leading-6 text-red-900">
                  Rejected by Head TPO
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Rejection Notes from Head Team:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {company.rejectionReason || <span className="italic text-gray-400">No notes provided.</span>}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Revert to Base TPR</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Please provide detailed feedback for the Base TPR so they understand why this company was reverted and what steps to take next.
                  </p>
                  <textarea
                    rows={4}
                    className="block w-full rounded-xl border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 mb-4"
                    placeholder="Enter notes for the branch TPR..."
                    value={revertNotes}
                    onChange={(e) => setRevertNotes(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (!revertNotes.trim()) {
                          alert('Please provide notes before reverting.');
                          return;
                        }
                        setIsReverting(true);
                        try {
                          await companyApi.updateStage(company.id, 'revoked', revertNotes);
                          router.push('/communication-tpr/pipeline');
                        } catch (err) {
                          alert('Failed to revert company.');
                        } finally {
                          setIsReverting(false);
                        }
                      }}
                      disabled={isReverting || !revertNotes.trim()}
                      className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors disabled:opacity-50"
                    >
                      {isReverting ? 'Reverting...' : 'Revert to Base TPR'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Workflow Progress</h2>
            </div>
            <CommWorkflowTracker currentPhase={currentPhase} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Company Overview
              </h3>
            </div>
            <div className="p-6">
              <CompanyTimeline companyId={company.id} />
            </div>
          </div>

          {/* Communication Requests History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Communication Requests
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              <RequestHistory companyId={company.id} />
            </div>
          </div>

          {/* HR Contacts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                HR Contacts
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {company.hrContacts && company.hrContacts.length > 0 ? (
                company.hrContacts.map(contact => (
                  <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{contact.designation}</p>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`mailto:${contact.email}`} className="hover:text-[#1b4376] hover:underline">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="hover:text-[#1b4376] hover:underline">{contact.phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  No additional HR contacts recorded. Primary contact info is listed in the sidebar.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Primary Info
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Date</label>
                <div className="mt-1 flex items-center text-sm font-medium text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(company.interestDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</label>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-[#15335b] ring-1 ring-inset ring-[#1b4376]/20 capitalize">
                    {company.currentStatus.baseStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {company.currentStatus.midStatus && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mid-Level Status</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 capitalize">
                      {company.currentStatus.midStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Primary HR Contact</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-900">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {company.hrName || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {company.email || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {company.phone || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <RequestFormModal 
        companyId={company.id} 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        onSuccess={() => {
          fetchActivities();
        }} 
      />

      <ScheduleFollowUpModal
        companyId={company.id}
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSuccess={() => {
          fetchActivities();
        }}
      />
    </div>
  );
}
