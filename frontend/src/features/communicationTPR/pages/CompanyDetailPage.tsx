'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, User, Phone, Mail, Calendar, Clock, BookOpen, AlertCircle, Users, Send, Network, Lock, Activity } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { CompanyActivity } from '../types/activity';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ActivityForm } from '../components/ActivityForm';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { CommWorkflowTracker, CommPhase } from '../components/CommWorkflowTracker';
import { RequestHistory } from '../components/RequestHistory';
import { RequestFormModal } from '../components/RequestFormModal';
import { ScheduleFollowUpModal } from '../components/ScheduleFollowUpModal';
import { activityApi } from '../services/activity.api';

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
    if (primaryStatus.editingLocked || primaryStatus.midStatus === 'transferred_to_head' || primaryStatus.midStatus === 'accepted' || primaryStatus.baseStatus === 'rejected' || primaryStatus.midStatus === 'revoked') {
      return 'concluded';
    }
    if (primaryStatus.midStatus === 'ready_for_head_review' || primaryStatus.midStatus === 'pending_review') {
      return 'ready_for_head_review';
    }
    if (primaryStatus.midStatus === 'under_communication') {
      return 'under_communication';
    }
    return 'new_arrival';
  };

  const currentPhase = getLifecyclePhase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/communication-tpr/companies')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight flex items-center gap-3">
              {company.companyName}
              {isLocked ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  <Lock className="w-3 h-3 mr-1" />
                  Transferred to Head Team (Read Only)
                </span>
              ) : company.currentStatus.locked && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  Locked by Mid TPR
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
              <span>Branch: <strong className="text-gray-900">{company.branch}</strong></span>
              <span>&bull;</span>
              <span>Added by: <strong className="text-gray-900">{company.assignedTPR || 'Unknown'}</strong></span>
              <span>&bull;</span>
              <span className="inline-flex items-center text-xs font-medium bg-indigo-50 text-indigo-700 px-2 rounded-full border border-indigo-200 capitalize">
                Pipeline Stage: {(company.currentStatus.midStatus || 'interested').replace(/_/g, ' ')}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isLocked && isReadyForHead && (
            <button
              onClick={handleTransfer}
              disabled={isTransferring}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Network className="w-4 h-4 mr-2" />
              {isTransferring ? 'Transferring...' : 'Transfer to Head Portal'}
            </button>
          )}

          {!isLocked && company.currentStatus.midStatus === 'interested' && (
             <button
               onClick={() => {
                 const notes = prompt('Enter reason for reverting back to the branch:');
                 if (notes) {
                   companyApi.updateStage(company.id, 'revoked').then(() => {
                     // In a real app we'd also post the note to history. Let's rely on the backend doing it or do it here.
                     alert('Reverted to branch.');
                     router.push('/communication-tpr/companies');
                   });
                 }
               }}
               className="inline-flex items-center justify-center rounded-lg bg-red-50 text-red-700 px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 transition-colors"
             >
               Revert ↩
             </button>
          )}

          {!isLocked && (company.currentStatus.midStatus === 'interested' || company.currentStatus.midStatus === 'under_communication') && (
            <button
              onClick={() => router.push(`/communication-tpr/requests/new?company=${company.id}`)}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              Start Communication
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
        </div>
        <CommWorkflowTracker currentPhase={currentPhase} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {!isLocked && <ActivityForm companyId={company.id} onSuccess={fetchActivities} />}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Company Overview
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {company.description || <span className="italic text-gray-400">No description provided for this company.</span>}
              </p>
            </div>
          </div>

          {/* Communication Requests History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" />
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
                <Users className="w-5 h-5 text-indigo-500" />
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
                          <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 hover:underline">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 hover:underline">{contact.phone}</a>
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
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
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
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 capitalize">
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

          {/* Full Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Activity Timeline
              </h3>
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                {activities.length} entries
              </span>
            </div>
            <div className="p-6">
              <ActivityTimeline activities={activities} />
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
