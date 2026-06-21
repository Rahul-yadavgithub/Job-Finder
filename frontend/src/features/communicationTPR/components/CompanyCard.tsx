import React from 'react';
import { Building2, User, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { InterestedCompany } from '../types/company';
import Link from 'next/link';

export function CompanyCard({ company }: { company: InterestedCompany }) {
  return (
    <Link href={`/communication-tpr/companies/${company.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#1b4376] border border-blue-100 flex-shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{company.companyName}</h3>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {company.branch}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-2 mt-4">
            {company.hrName && (
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{company.hrName}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{company.phone}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
          <div className="flex items-center text-gray-500">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {new Date(company.interestDate).toLocaleDateString()}
          </div>
          <span className="font-medium text-[#1b4376] capitalize">
            {company.currentStatus.baseStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
    </Link>
  );
}
