import React, { useState } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import { followUpApi } from '../services/followup.api';
import { CreateFollowUpInput, FollowUpPriority } from '../types/followup';

interface ScheduleFollowUpModalProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleFollowUpModal({ companyId, isOpen, onClose, onSuccess }: ScheduleFollowUpModalProps) {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<FollowUpPriority>('Medium');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !reason.trim()) return;

    setIsSubmitting(true);
    setError('');

    const input: CreateFollowUpInput = {
      followUpDate,
      followUpTime: followUpTime || undefined,
      reason: reason.trim(),
      priority,
    };

    try {
      const res = await followUpApi.createFollowUp(companyId, input);
      if (res.success) {
        onSuccess();
        onClose();
        // Reset form
        setFollowUpDate('');
        setFollowUpTime('');
        setReason('');
        setPriority('Medium');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule follow-up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Schedule Follow-up
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Date <span className="text-red-500">*</span></label>
              <div className="mt-2">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]} // prevent past dates
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#1b4376] sm:text-sm sm:leading-6"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Time <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="mt-2">
                <input
                  type="time"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#1b4376] sm:text-sm sm:leading-6"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Priority</label>
            <div className="flex gap-3">
              {(['Low', 'Medium', 'High'] as FollowUpPriority[]).map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
                    className="h-4 w-4 text-[#1b4376] focus:ring-[#1b4376] border-gray-300"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Reason for Follow-up <span className="text-red-500">*</span>
            </label>
            <div className="mt-2">
              <textarea
                rows={3}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#1b4376] sm:text-sm sm:leading-6"
                placeholder="Call to check on brochure delivery..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !followUpDate || !reason.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#1b4376] hover:bg-[#15335b] rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
