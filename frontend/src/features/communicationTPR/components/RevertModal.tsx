import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

export function RevertModal({ isOpen, onClose, onConfirm }: RevertModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('Please provide notes explaining why this is being reverted.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onConfirm(notes);
    } catch (err) {
      setError('Failed to revert request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[95vw] md:max-w-md overflow-y-auto custom-scrollbar flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Add note for Base TPR</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Explain what needs to be done or why you are reverting this company back to the Base TPR. They will receive a notification with these notes.
          </p>
          
          <div>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none transition-all shadow-sm"
              placeholder="e.g., The HR contact details are incorrect. Please verify and update before we send the brochure."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError('');
              }}
              disabled={isSubmitting}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
        
        <div className="p-6 pt-0 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !notes.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? 'Reverting...' : 'Confirm Revert'}
          </button>
        </div>
      </div>
    </div>
  );
}
