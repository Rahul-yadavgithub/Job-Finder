'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/tpr/api';
import { toast } from 'sonner';

interface StatusDropdownProps {
  companyId: string;
  currentStatus: string;
  isLocked: boolean;
  layer: 'base' | 'mid';
  onSuccess: (newStatus: string) => void;
}

const BASE_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'interested', label: 'Interested' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'call_again', label: 'Call Again' },
  { value: 'not_available', label: 'Not Available' }
];

const MID_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'in_process', label: 'In Process' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' }
];

export function StatusDropdown({ companyId, currentStatus, isLocked, layer, onSuccess }: StatusDropdownProps) {
  const [loading, setLoading] = useState(false);

  // If layer is base and it's locked, they cannot interact with it
  if (layer === 'base' && isLocked) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Sent to mid-layer
      </span>
    );
  }

  const options = layer === 'base' ? BASE_OPTIONS : MID_OPTIONS;
  const endpoint = layer === 'base' 
    ? `/tpr/companies/${companyId}/status` 
    : `/caller/companies/${companyId}/status`;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    // Don't trigger if they select the same status
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      const payload = layer === 'base' 
        ? { base_status: newStatus }
        : { mid_status: newStatus };

      await fetchApi(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      toast.success('Status updated');
      onSuccess(newStatus);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      // The select element will visually revert if we don't update local state
      // since its value is bound to currentStatus (which hasn't changed)
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interested':
      case 'accepted':
        return 'text-green-700 bg-green-50 border-green-200 focus:ring-green-500';
      case 'rejected':
      case 'revoked':
      case 'not_available':
        return 'text-red-700 bg-red-50 border-red-200 focus:ring-red-500';
      case 'call_again':
      case 'in_process':
        return 'text-blue-700 bg-blue-50 border-blue-200 focus:ring-blue-500';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 focus:ring-gray-500';
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={loading}
      className={`text-sm rounded-lg px-3 py-1.5 border outline-none transition-colors cursor-pointer disabled:opacity-50 appearance-none ${getStatusColor(currentStatus)}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
