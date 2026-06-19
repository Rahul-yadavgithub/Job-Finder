import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Building2, Calendar, Send, Lock } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { InterestedCompany } from '../types/company';
import Link from 'next/link';

const STAGES = [
  { id: 'interested', name: 'Interested', color: 'border-blue-200 bg-blue-50' },
  { id: 'under_communication', name: 'Under Communication', color: 'border-amber-200 bg-amber-50' },
  { id: 'ready_for_head_review', name: 'Ready for Head Review', color: 'border-purple-200 bg-purple-50' },
  { id: 'transferred_to_head', name: 'Transferred', color: 'border-gray-200 bg-gray-50' }
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

  const handleStageChange = async (companyId: string, newStage: string) => {
    try {
      await companyApi.updateStage(companyId, newStage);
      fetchPipeline();
    } catch (e) {
      console.error('Failed to change stage', e);
    }
  };

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
                    <Link href={`/communication-tpr/companies/${company.id}`} className="font-semibold text-sm text-gray-900 hover:text-indigo-600 truncate block pr-6">
                      {company.companyName}
                    </Link>
                    
                    {/* Stage Dropdown */}
                    {stage.id !== 'transferred_to_head' && (
                      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select 
                          className="text-xs bg-gray-50 border-gray-200 rounded py-1 pl-2 pr-6 cursor-pointer focus:ring-indigo-500"
                          value={stage.id}
                          onChange={(e) => handleStageChange(company.id, e.target.value)}
                        >
                          <option value="interested" disabled>Move to...</option>
                          {STAGES.map(s => {
                            // Don't allow moving directly to transferred from here, they must use the detail page transfer button
                            if (s.id === 'transferred_to_head') return null;
                            return (
                              <option key={s.id} value={s.id} disabled={s.id === stage.id}>{s.name}</option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Building2 className="w-3.5 h-3.5" /> {company.branch}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                    <span className="text-gray-500">{company.assignedTPR || 'Unassigned'}</span>
                    {stage.id === 'transferred_to_head' ? (
                      <span className="flex items-center text-gray-400 font-medium">
                        <Lock className="w-3 h-3 mr-1" /> Locked
                      </span>
                    ) : (
                      <span className="text-gray-400">{new Date(company.interestDate).toLocaleDateString()}</span>
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
