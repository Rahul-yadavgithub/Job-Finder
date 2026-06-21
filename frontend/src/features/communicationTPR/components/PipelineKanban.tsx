import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Building2, Calendar, Send, Lock } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { InterestedCompany } from '../types/company';
import Link from 'next/link';

const STAGES = [
  { id: 'interested', name: 'New Arrival', color: 'border-blue-200 bg-blue-50' },
  { id: 'under_communication', name: 'Under Communication', color: 'border-amber-200 bg-amber-50' },
  { id: 'ready_for_head_review', name: 'Ready for Head Review', color: 'border-purple-200 bg-purple-50' },
  { id: 'transferred_to_head', name: 'Concluded', color: 'border-gray-200 bg-gray-50' }
];

export function PipelineKanban() {
  const [companies, setCompanies] = useState<InterestedCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = async () => {
    try {
      const res = await companyApi.getInterestedCompanies({ limit: 500 });
      if (res.success) setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl w-full"></div>;

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const columnCompanies = companies.filter(c => (c.currentStatus.midStatus || 'interested') === stage.id);

        return (
          <div key={stage.id} className={`flex-shrink-0 w-80 rounded-xl border ${stage.color} flex flex-col`}>
            <div className="p-4 border-b border-black/5 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{stage.name}</h3>
              <span className="bg-white/50 text-gray-700 text-xs font-medium px-2 py-1 rounded-full border border-black/5">
                {columnCompanies.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnCompanies.map((company) => (
                <div key={company.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/communication-tpr/companies/${company.id}`} className="font-semibold text-sm text-gray-900 hover:text-indigo-600 truncate block">
                      {company.companyName}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Building2 className="w-3.5 h-3.5" /> {company.branch}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 mb-3">
                    <span className="text-gray-500">{company.assignedTPR || 'Unassigned'}</span>
                    {stage.id === 'transferred_to_head' ? (
                      <span className="flex items-center text-gray-400 font-medium">
                        <Lock className="w-3 h-3 mr-1" /> Locked
                      </span>
                    ) : (
                      <span className="text-gray-400">{new Date(company.interestDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Actions depending on stage */}
                  <div className="pt-2">
                    {stage.id === 'interested' && (
                      <Link 
                        href={`/communication-tpr/requests/new?company=${company.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded text-xs font-medium transition-colors border border-blue-200"
                      >
                        <Send className="w-3.5 h-3.5" /> Start Communication
                      </Link>
                    )}
                    {stage.id === 'under_communication' && (
                      <Link 
                        href={`/communication-tpr/requests/new?company=${company.id}`}
                        className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 py-1.5 rounded text-xs font-medium transition-colors border border-amber-200"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Follow-up
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              
              {columnCompanies.length === 0 && (
                <div className="text-center p-4 text-sm text-gray-500 italic opacity-70">
                  No companies
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
