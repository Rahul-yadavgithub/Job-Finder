import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { companyApi } from '../services/company.api';
import { followUpApi } from '../services/followup.api';
import { InterestedCompany } from '../types/company';
import { FollowUpPriority } from '../types/followup';
import { toast } from 'sonner';

interface CreateFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFollowUpModal({ isOpen, onClose, onSuccess }: CreateFollowUpModalProps) {
  const [companies, setCompanies] = useState<InterestedCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  
  const [companyId, setCompanyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<FollowUpPriority>('Medium');

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      // Reset form
      setCompanyId('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setReason('');
      setPriority('Medium');
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await companyApi.getInterestedCompanies({ limit: 100 });
      if (res.success) {
        setCompanies(res.data);
      }
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !date || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await followUpApi.createFollowUp(companyId, {
        followUpDate: date,
        followUpTime: time || undefined,
        reason,
        priority
      });
      toast.success('Follow-up scheduled successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Follow-up</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
            {loadingCompanies ? (
              <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg border border-gray-200"></div>
            ) : (
              <select
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="" disabled>Select a company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-400" /> Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" /> Time (Optional)
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as FollowUpPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                    priority === p
                      ? p === 'High' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500'
                        : p === 'Medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 ring-1 ring-yellow-500'
                        : 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-gray-400" /> Reason for follow-up *
            </label>
            <textarea
              required
              rows={3}
              placeholder="E.g., Call HR to discuss JNF..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !companyId || !date || !reason}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Schedule Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
