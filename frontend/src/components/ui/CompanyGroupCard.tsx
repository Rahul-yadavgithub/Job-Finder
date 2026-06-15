import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, Building, Briefcase } from 'lucide-react';

export interface CompanyGroupCardProps {
  title: string;
  description: string;
  academicYear: string;
  total: number;
  drive_types: Record<string, number>;
  roles: Record<string, number>;
  companies: any[];
}

export default function CompanyGroupCard({
  title,
  description,
  academicYear,
  total,
  drive_types,
  roles,
  companies,
}: CompanyGroupCardProps) {
  const [activeTab, setActiveTab] = useState<'drive' | 'role'>('drive');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
            {academicYear}
          </span>
        </div>

        <div className="flex items-end gap-3 mt-6">
          <span className="text-4xl font-extrabold text-slate-900">{total}</span>
          <span className="text-slate-500 font-medium pb-1">Total Companies</span>
        </div>
      </div>

      <div className="p-6 flex-grow">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'drive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            By Drive Type
          </button>
          <button
            onClick={() => setActiveTab('role')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'role' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            By Role
          </button>
        </div>

        {activeTab === 'drive' && (
          <div className="space-y-3">
            {Object.entries(drive_types).sort((a, b) => b[1] - a[1]).map(([dt, count]) => (
              <div key={dt} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium text-slate-700">{dt}</span>
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
            {Object.keys(drive_types).length === 0 && <div className="text-sm text-slate-500 text-center py-4">No data available</div>}
          </div>
        )}

        {activeTab === 'role' && (
          <div className="space-y-3">
            {Object.entries(roles).sort((a, b) => b[1] - a[1]).map(([r, count]) => (
              <div key={r} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-slate-700">{r}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{count}</span>
              </div>
            ))}
            {Object.keys(roles).length === 0 && <div className="text-sm text-slate-500 text-center py-4">No data available</div>}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-4 px-6 flex justify-between items-center text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          View Company List
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {isExpanded && (
          <div className="px-6 pb-6 max-h-80 overflow-y-auto">
            <ul className="divide-y divide-slate-200 border-t border-slate-200 pt-2">
              {companies.map((c, i) => (
                <li key={c._id || i} className="py-3 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.companyName || c.company_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.role || 'General Application'}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                    {c.drive_type || 'Unknown'}
                  </span>
                </li>
              ))}
              {companies.length === 0 && (
                <li className="py-4 text-sm text-slate-500 text-center">No companies found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
