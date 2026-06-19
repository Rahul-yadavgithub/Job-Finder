import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { Branch } from '../types/company';

interface BranchFilterProps {
  value: string;
  onChange: (branchId: string) => void;
}

export function BranchFilter({ value, onChange }: BranchFilterProps) {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    companyApi.getBranches().then(res => {
      if (res.success) setBranches(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      >
        <option value="">All Branches</option>
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
    </div>
  );
}
