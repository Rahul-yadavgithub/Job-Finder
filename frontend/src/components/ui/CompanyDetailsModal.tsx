import React, { useState } from 'react';
import { X, Building2, Globe, Users, Coins, MapPin, Search, Calendar, FileText, CheckCircle2, Target, Loader2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Company {
  _id: string;
  companyName: string;
  normalizedName: string;
  website?: string;
  category?: string;
  description?: string;
  fresherHiring?: boolean;
  internshipAvailable?: boolean;
  placementPriority?: string;
  placementScore: number;
  confidenceScore: number;
  status: string;
  review_status?: string;
  discoveryDate: string;
  teamSize?: string;
  fundingStage?: string;
  foundedYear?: string;
  hiringType?: string;
  source?: {
    platform: string;
    sourceUrl: string;
    careersUrl?: string;
    discoveryMethod?: string;
    discoveredAt?: string;
  };
  assignedBranch?: string;
  syncStatus?: string;
}

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onUpdate?: (company: Company) => void;
}

export function CompanyDetailsModal({ isOpen, onClose, company, onUpdate }: CompanyDetailsModalProps) {
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState('');

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branches`);
      return res.data;
    },
    enabled: isOpen && company?.status === 'APPROVED',
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBranch || !company) return;
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/companies/${company._id}/assignment`, {
        branch_id: selectedBranch,
        assigned_by: 'Admin'
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (onUpdate && data) {
        onUpdate(data);
      }
    }
  });

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedBranch('');
    }
  }, [isOpen]);

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm mt-1">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{company.companyName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                {company.website && (
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium">
                    <Globe className="w-4 h-4" />
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {company.category && (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Target className="w-4 h-4" />
                    {company.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* About Company */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-500" /> About Company
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {company.description || 'No description available for this company.'}
                </p>
              </section>

              {/* Hiring & Opportunities */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" /> Hiring & Opportunities
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-6 mb-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Roles Detected</span>
                      <span className="text-slate-900 font-bold">{company.hiringType || (company.internshipAvailable ? 'Internship' : 'Full-Time / Mixed')}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Placement Priority</span>
                      <span className="text-slate-900 font-bold">{company.placementPriority || 'LOW'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    {!company.fresherHiring && !company.internshipAvailable ? 'No specific fresher/intern signals detected.' : 'Opportunities detected.'}
                  </p>
                </div>
              </section>

              {/* Discovery Source */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-500" /> Discovery Source
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-semibold text-slate-500 mb-1">Platform</span>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-sm font-bold inline-block">{company.source?.platform || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-500 mb-1">Discovered On</span>
                    <span className="text-slate-900 font-bold text-sm">
                      {company.source?.discoveredAt ? format(new Date(company.source.discoveredAt), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  {company.source?.sourceUrl && (
                    <div>
                      <span className="block text-sm font-semibold text-slate-500 mb-1">Source Link</span>
                      <a href={company.source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium break-all">
                        {company.source.sourceUrl}
                      </a>
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Branch Assignment */}
              {company.status === 'APPROVED' && (
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Branch Assignment</h3>
                  
                  {branchesLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                  ) : company.assignedBranch ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-lg border border-slate-300 shadow-sm sm:text-sm p-2.5 bg-white text-slate-900 font-medium">
                          {company.assignedBranch}
                        </div>
                      </div>
                      <div className="pt-4 mt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-600">Sync Status</span>
                          <span className={`text-sm font-bold ${company.syncStatus === 'synced' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {company.syncStatus === 'synced' ? 'Synced' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 bg-white"
                        >
                          <option value="">Select a branch...</option>
                          {branches?.map((b: any) => (
                            <option key={b._id} value={b._id}>{b.name} ({b.category})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => assignMutation.mutate()}
                        disabled={assignMutation.isPending || !selectedBranch}
                        className="w-full mt-3 bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-50 font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assign Branch'}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* Company Profile */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Company Profile</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Team Size</span>
                      <span className="text-slate-900 font-bold text-sm">{company.teamSize || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Funding Stage</span>
                      <span className="text-slate-900 font-bold text-sm">{company.fundingStage || 'Not Applicable'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Founded</span>
                      <span className="text-slate-900 font-bold text-sm">{company.foundedYear || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Intelligence */}
              <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> AI Intelligence
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-indigo-900">Placement Score</span>
                      <span className="text-xs font-bold text-indigo-900">{company.placementScore || 'Not Scored'}/100</span>
                    </div>
                    <div className="w-full bg-indigo-200/50 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${company.placementScore || 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-indigo-900">Data Confidence</span>
                      <span className="text-xs font-bold text-indigo-900">{company.confidenceScore || 0}%</span>
                    </div>
                    <div className="w-full bg-indigo-200/50 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${company.confidenceScore || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
