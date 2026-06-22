'use client';

import React, { useState, useEffect } from 'react';
import { adminGet } from '@/lib/admin/api';
import { useParams, useRouter } from 'next/navigation';
import { Building2, MapPin, Mail, Phone, Calendar, ArrowLeft, Clock, History, ExternalLink, Activity, CheckCircle2, Plus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CompanyTimeline } from '@/components/companies/CompanyTimeline';
import { WorkflowProgressTracker } from '@/components/companies/WorkflowProgressTracker';
import { WorkflowSidebarSummary } from '@/components/companies/WorkflowSidebarSummary';
import { WorkflowActionCenter } from '@/components/companies/WorkflowActionCenter';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const router = useRouter();
  const { user } = useAdminAuth();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [isAddingStage, setIsAddingStage] = useState(false);

  const [showDriveDatePicker, setShowDriveDatePicker] = useState(false);
  const [newDriveDate, setNewDriveDate] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [isSavingDriveDate, setIsSavingDriveDate] = useState(false);

  const handleSaveDriveDate = async () => {
    if ((!newDriveDate && !newPackage) || !company?.company_status?.[0]?.id) return;
    setIsSavingDriveDate(true);
    try {
      const { adminPatch } = await import('@/lib/admin/api');
      const primaryStatus = company.company_status[0];
      const payload = {
        date: newDriveDate || undefined,
        salaryPackage: newPackage || undefined,
        assignmentId: primaryStatus.id,
        companyId: company.id
      };
      
      const driveIdToUpdate = primaryStatus.drive_id || 'new';
      const res = await adminPatch<{ success: boolean }>(`/drives/${driveIdToUpdate}/date`, payload);
      
      if (res.success) {
        setShowDriveDatePicker(false);
        setNewDriveDate('');
        setNewPackage('');
        window.location.reload();
      } else {
        alert('Failed to save drive date');
      }
    } catch(err) {
      alert('An error occurred while saving the drive date');
    } finally {
      setIsSavingDriveDate(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    setIsAddingStage(true);
    try {
      const { adminPost } = await import('@/lib/admin/api');
      await adminPost(`/companies/${companyId}/workflows/custom`, { stageName: newStageName.trim() });
      setNewStageName('');
      setShowAddStage(false);
      window.location.reload();
    } catch(err) {
      alert('Failed to add custom stage');
    } finally {
      setIsAddingStage(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const res = await adminGet<{ success: boolean; data: any }>(`/companies/${companyId}`);
      if (res.success && res.data) {
        setCompany(res.data);
      } else {
        setError('Failed to load company details.');
      }
    } catch (err) {
      setError('An error occurred while fetching company data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-none space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
        <div className="h-48 bg-white rounded-xl border border-gray-200 shadow-sm"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-white rounded-xl border border-gray-200 shadow-sm"></div>
          <div className="col-span-1 h-96 bg-white rounded-xl border border-gray-200 shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full max-w-none py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Building2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Company Not Found</h3>
        <p className="text-gray-500 mb-6">{error || 'The company details could not be found or you do not have permission.'}</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#1b4376] text-white rounded-lg font-bold hover:bg-[#15335b] transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const primaryStatus = company.company_status?.[0];

  const getLifecyclePhase = () => {
    if (!primaryStatus) return 'interested';
    if (primaryStatus.top_status === 'dropped' || primaryStatus.mid_status === 'revoked' || primaryStatus.base_status === 'rejected') return 'closed';
    if (primaryStatus.top_status === 'completed') return 'completed';
    if (primaryStatus.top_status === 'confirmed' || primaryStatus.top_status === 'jnf_sent' || primaryStatus.top_status === 'visit_scheduled') return 'recruitment_in_progress';
    if (primaryStatus.mid_status === 'accepted') return 'transferred_to_head';
    if (primaryStatus.mid_status === 'pending_review') return 'ready_for_head_review';
    if (primaryStatus.locked && primaryStatus.mid_status === 'in_process') return 'under_communication';
    return 'interested';
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Building2 size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <button 
              onClick={() => router.push('/admin/companies')}
              className="p-3 text-[#1b4376] bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-lg shrink-0 flex items-center justify-center mt-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-3 backdrop-blur-sm">
                <Building2 size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{company.company_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100 opacity-90">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                  <MapPin size={14} />
                  <span className="font-medium">{company.branches?.name || 'Unknown Branch'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                  <Clock size={14} />
                  <span>Added {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })} by <b>{company.users?.name || 'System'}</b></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {primaryStatus?.drive_id ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDriveDatePicker(true)}
                  className="flex items-center justify-center p-2.5 text-blue-100 bg-white/10 border border-white/20 rounded-xl hover:text-white hover:bg-white/20 transition-colors shadow-sm backdrop-blur-sm"
                  title="Change Drive Date"
                >
                  <Calendar size={16} />
                </button>
                <Link 
                  href="/admin/drives"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#15335b] rounded-xl hover:bg-blue-50 font-bold text-sm transition-colors shadow-lg border border-white/20"
                >
                  <Calendar size={16} /> View Drive Schedule
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-xs text-blue-100 italic bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm hidden sm:block">
                  No active drive scheduled yet
                </div>
                <button 
                  onClick={() => setShowDriveDatePicker(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold text-sm transition-colors shadow-lg border border-green-400"
                >
                  <Calendar size={16} /> Schedule Drive
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="col-span-1 xl:col-span-3 space-y-6">
          
          {primaryStatus && user?.isSuperAdmin && (
            <WorkflowActionCenter 
              companyId={company.id} 
              assignmentId={primaryStatus.id} 
              onTaskDelegated={() => fetchCompanyDetails()} 
            />
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-[17px] text-gray-800 tracking-wide">Activity timeline</h2>
              <button 
                onClick={() => setShowAddStage(true)}
                disabled={getLifecyclePhase() === 'completed' || getLifecyclePhase() === 'closed'}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white hover:bg-gray-50 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add custom stage
              </button>
            </div>
            
            <div className="px-6">
              <div className="h-px w-full bg-gray-200"></div>
            </div>

            <div className="p-6">
              <div className="mb-10 mt-6">
                <WorkflowProgressTracker companyId={company.id} currentPhase={getLifecyclePhase() as any} />
              </div>
              
              <div className="flex items-center justify-center mb-8 opacity-50">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-3/4"></div>
              </div>
              {primaryStatus ? (
                <CompanyTimeline companyId={company.id} />
              ) : (
                <div className="text-sm text-gray-500 italic">Timeline not available (no assignment record).</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-1 xl:col-span-1 space-y-6">
          <WorkflowSidebarSummary companyId={company.id} />
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Building2 size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Company Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-800">{company.description || 'No description provided.'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data Source</p>
                <p className="text-sm text-gray-800 capitalize font-medium">{company.data_source?.replace('_', ' ')}</p>
              </div>
              {company.brochure_completed && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Brochure Status</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-100 text-green-700 text-sm font-bold">
                    <CheckCircle2 size={14} /> Already Sent
                  </div>
                </div>
              )}
              {primaryStatus?.interested_by_name && (
                <div className="pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs font-bold text-[#1b4376] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Discovered & Interested By
                  </p>
                  <p className="text-sm font-bold text-gray-900">{primaryStatus.interested_by_name}</p>
                  {primaryStatus.interested_at && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(primaryStatus.interested_at), 'dd MMM yyyy, h:mm a')}
                    </p>
                  )}
                </div>
              )}
              {primaryStatus && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Next Follow-up</p>
                  <p className={`text-sm font-bold ${primaryStatus.next_followup_date ? (new Date(primaryStatus.next_followup_date) < new Date() ? 'text-red-600' : 'text-[#1b4376]') : 'text-gray-500'}`}>
                    {primaryStatus.next_followup_date ? format(new Date(primaryStatus.next_followup_date), 'MMM do, yyyy') : 'None Scheduled'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Phone size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Primary Contact</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#15335b] flex items-center justify-center font-bold text-lg shrink-0">
                  {(company.hr_name || 'H')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{company.hr_name || 'Unknown Contact'}</p>
                  <p className="text-xs text-gray-500">Human Resources</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Mail size={14} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-500">Email Address</p>
                    {company.email ? (
                      <a href={`mailto:${company.email}`} className="text-sm font-medium text-[#1b4376] hover:underline truncate block">
                        {company.email}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not provided</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Phone size={14} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-500">Phone Number</p>
                    {company.phone_number ? (
                      <a href={`tel:${company.phone_number}`} className="text-sm font-medium text-gray-900 hover:text-[#1b4376] block">
                        {company.phone_number}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showAddStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Custom Stage</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter a name for the new custom workflow stage.
            </p>
            <input 
              type="text" 
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="e.g. Technical Interview"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-[#1b4376] focus:border-transparent outline-none text-gray-800"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAddStage(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isAddingStage}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStage}
                disabled={isAddingStage || !newStageName.trim()}
                className="px-4 py-2 bg-[#1b4376] text-white rounded-lg font-medium hover:bg-[#15335b] transition-colors disabled:opacity-50"
              >
                {isAddingStage ? 'Adding...' : 'Add Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDriveDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{primaryStatus?.drive_id ? 'Change Drive Date' : 'Schedule Drive Date'}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select the date for the campus drive.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Drive Date</label>
                <input 
                  type="date" 
                  value={newDriveDate}
                  onChange={(e) => setNewDriveDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b4376] focus:border-transparent outline-none text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Salary Package <span className="font-normal text-gray-400">(Optional)</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. 12 LPA"
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b4376] focus:border-transparent outline-none text-gray-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDriveDatePicker(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isSavingDriveDate}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDriveDate}
                disabled={isSavingDriveDate || (!newDriveDate && !newPackage)}
                className="px-4 py-2 bg-[#1b4376] text-white rounded-lg font-medium hover:bg-[#15335b] transition-colors disabled:opacity-50"
              >
                {isSavingDriveDate ? 'Saving...' : 'Save Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
