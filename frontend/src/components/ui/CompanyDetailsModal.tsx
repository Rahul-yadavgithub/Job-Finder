import React from 'react';
import { X, Building2, Globe, Users, Coins, MapPin, Search, Calendar, FileText, CheckCircle2, Target } from 'lucide-react';
import { format } from 'date-fns';

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
}

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export function CompanyDetailsModal({ isOpen, onClose, company }: CompanyDetailsModalProps) {
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Main Content Column */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Description */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  About Company
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {company.description || 'No description available for this company.'}
                </p>
              </section>

              {/* Hiring Signals */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  Hiring & Opportunities
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Roles Detected</span>
                      <p className="text-slate-900 text-sm font-medium">{company.hiringType || 'General Hiring'}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Placement Priority</span>
                      <p className="text-slate-900 text-sm font-medium flex items-center gap-2">
                        {company.placementPriority || 'Standard'}
                        {company.placementPriority === 'HIGH' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200/60">
                    {company.fresherHiring ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Fresher Friendly
                      </span>
                    ) : null}
                    {company.internshipAvailable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-700 bg-pink-100 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Internships Available
                      </span>
                    ) : null}
                    {!company.fresherHiring && !company.internshipAvailable && (
                      <span className="text-sm text-slate-500">No specific fresher/intern signals detected.</span>
                    )}
                  </div>
                </div>
              </section>
              
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              
              {/* Key Metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Company Profile</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Team Size</p>
                      <p className="text-sm font-semibold text-slate-900">{company.teamSize || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Funding Stage</p>
                      <p className="text-sm font-semibold text-slate-900">{company.fundingStage || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Founded</p>
                      <p className="text-sm font-semibold text-slate-900">{company.foundedYear || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discovery Info */}
              {company.source && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Discovery Source</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Platform</p>
                      <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded">
                        {company.source.platform}
                      </span>
                    </div>
                    {company.source.discoveredAt && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Discovered On</p>
                        <p className="text-sm font-medium text-slate-900">
                          {format(new Date(company.source.discoveredAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Source Link</p>
                      <a href={company.source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all line-clamp-2">
                        {company.source.sourceUrl}
                      </a>
                    </div>
                    {company.source.careersUrl && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Careers Page</p>
                        <a href={company.source.careersUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all line-clamp-1">
                          {company.source.careersUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Scores */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                 <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">AI Intelligence</h3>
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-sm text-indigo-900 font-medium">Placement Score</span>
                   <span className="text-sm font-bold text-indigo-700">{company.placementScore}/100</span>
                 </div>
                 <div className="w-full bg-indigo-200/50 rounded-full h-1.5 mb-4">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${company.placementScore}%` }}></div>
                 </div>

                 <div className="flex justify-between items-center mb-2">
                   <span className="text-sm text-indigo-900 font-medium">Data Confidence</span>
                   <span className="text-sm font-bold text-indigo-700">{company.confidenceScore}%</span>
                 </div>
                 <div className="w-full bg-indigo-200/50 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${company.confidenceScore}%` }}></div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
