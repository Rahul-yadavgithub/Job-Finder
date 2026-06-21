'use client';

import { useState, useEffect } from 'react';
import { adminGet } from '@/lib/admin/api';
import { useParams, useRouter } from 'next/navigation';
import { Building2, MapPin, Mail, Phone, Calendar, ArrowLeft, Clock, History, ExternalLink, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CompanyTimeline } from '@/components/companies/CompanyTimeline';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
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
      <div className="max-w-5xl mx-auto py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Building2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Company Not Found</h3>
        <p className="text-gray-500 mb-6">{error || 'The company details could not be found or you do not have permission.'}</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const primaryStatus = company.company_status?.[0];

  const renderTopStatus = () => {
    if (!primaryStatus?.top_status) return null;
    const stages: Record<string, { label: string, color: string }> = {
      brochure_sent: { label: 'Brochure Sent', color: 'bg-blue-100 text-blue-700' },
      jnf_sent: { label: 'JNF Sent', color: 'bg-indigo-100 text-indigo-700' },
      database_sent: { label: 'Database Sent', color: 'bg-purple-100 text-purple-700' },
      drive_confirmed: { label: 'Drive Confirmed', color: 'bg-green-100 text-green-700' },
      completed: { label: 'Process Completed', color: 'bg-emerald-100 text-emerald-700' }
    };
    const s = stages[primaryStatus.top_status];
    if (!s) return null;
    return (
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
        {s.label}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => router.push('/admin/companies')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Companies
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-indigo-600"></div>
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{company.company_name}</h1>
              {renderTopStatus()}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <MapPin size={16} className="text-gray-400" />
                <span className="font-medium text-gray-700">{company.branches?.name || 'Unknown Branch'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-gray-400" />
                <span>Added {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })} by <b>{company.users?.name || 'System'}</b></span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {primaryStatus?.drive_id && (
              <Link 
                href="/admin/drives"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold text-sm transition-colors border border-indigo-100"
              >
                <Calendar size={16} /> View Drive Schedule
              </Link>
            )}
            {!primaryStatus?.drive_id && (
              <div className="text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                No active drive scheduled yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Activity size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
            </div>
            <div className="p-6">
              {primaryStatus ? (
                <CompanyTimeline companyId={company.id} />
              ) : (
                <div className="text-sm text-gray-500 italic">Timeline not available (no assignment record).</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-1 space-y-6">
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
              {primaryStatus && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Next Follow-up</p>
                  <p className={`text-sm font-bold ${primaryStatus.next_followup_date ? (new Date(primaryStatus.next_followup_date) < new Date() ? 'text-red-600' : 'text-indigo-600') : 'text-gray-500'}`}>
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
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
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
                      <a href={`mailto:${company.email}`} className="text-sm font-medium text-indigo-600 hover:underline truncate block">
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
                      <a href={`tel:${company.phone_number}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 block">
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
    </div>
  );
}
