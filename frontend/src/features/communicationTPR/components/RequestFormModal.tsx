import React, { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { requestApi } from '../services/request.api';
import { CreateRequestInput, RequestType } from '../types/request';

interface RequestFormModalProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestFormModal({ companyId, isOpen, onClose, onSuccess }: RequestFormModalProps) {
  const [requestType, setRequestType] = useState<RequestType>('brochure');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const input: CreateRequestInput = {
      requestType,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await requestApi.createRequest(companyId, input);
      if (res.success) {
        onSuccess();
        onClose();
        setNotes('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-500" />
            New Communication Request
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Request Type</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${requestType === 'brochure' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setRequestType('brochure')}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${requestType === 'brochure' ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {requestType === 'brochure' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <span className={`text-sm font-medium ${requestType === 'brochure' ? 'text-indigo-900' : 'text-gray-700'}`}>Brochure</span>
                </div>
              </div>
              <div 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${requestType === 'officialCommunication' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setRequestType('officialCommunication')}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${requestType === 'officialCommunication' ? 'border-indigo-600' : 'border-gray-300'}`}>
                    {requestType === 'officialCommunication' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <span className={`text-sm font-medium ${requestType === 'officialCommunication' ? 'text-indigo-900' : 'text-gray-700'}`}>Official Email</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="mt-2">
              <textarea
                rows={4}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Any specific requirements or context for the head team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
