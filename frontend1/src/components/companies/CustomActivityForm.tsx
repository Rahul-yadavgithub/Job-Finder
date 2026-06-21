import React, { useState } from 'react';
import { adminPost } from '@/lib/admin/api';
import { Plus, Loader2, MessageSquareText } from 'lucide-react';

interface Props {
  companyId: string;
  onSuccess: () => void;
}

export function CustomActivityForm({ companyId, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      await adminPost(`/timeline/${companyId}/custom`, {
        title,
        description,
        notes
      });
      setTitle('');
      setDescription('');
      setNotes('');
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to log custom activity', error);
      alert('Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 font-bold hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex flex-col items-center gap-2 justify-center"
      >
        <Plus size={24} />
        Log Custom Activity
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareText size={18} className="text-indigo-600" />
        <h3 className="font-bold text-gray-900">Log Custom Activity</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Activity Title *</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Salary Negotiation Call"
            className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description (Optional)</label>
          <input 
            type="text" 
            placeholder="Brief context..."
            className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Detailed Notes (Optional)</label>
          <textarea 
            rows={3}
            placeholder="Write full conversation details here..."
            className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Save Activity
          </button>
        </div>
      </form>
    </div>
  );
}
