'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet, adminPatch, adminPost } from '@/lib/admin/api';
import { Star, ShieldCheck, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SuccessionSettings() {
  const { user } = useAdminAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  
  // Section A - Modal
  const [showPicker, setShowPicker] = useState(false);
  
  // Section B
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // Section C
  const [transferForm, setTransferForm] = useState({ email: '', name: '' });
  const [transferStep, setTransferStep] = useState(0); // 0: form, 1: confirm email, 2: final confirm, 3: success
  const [confirmEmail, setConfirmEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
    
    if (user?.isSuperAdmin) {
      fetchData();
    }
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [infoRes, workersRes] = await Promise.all([
        adminGet<{ data: any }>('/transfer/succession-info'),
        adminGet<{ data: any }>('/workers')
      ]);
      
      setInfo(infoRes.data);
      setNote(infoRes.data.successionNote || '');
      setWorkers(workersRes.data.workers.filter((w: any) => w.status === 'approved' && !w.is_super_admin));
    } catch (error) {
      toast.error('Failed to load succession data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetSuccessor = async (workerId: string) => {
    try {
      await adminPost('/workers/designate-successor', { userId: workerId });
      toast.success('Successor updated');
      setShowPicker(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update successor');
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await adminPatch('/transfer/succession-note', { note });
      toast.success('Note saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleInitiateTransfer = async () => {
    setTransferLoading(true);
    try {
      await adminPost('/transfer/initiate', { newHeadEmail: transferForm.email, newHeadName: transferForm.name });
      setTransferStep(3); // Success
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate transfer');
      setTransferStep(0);
    } finally {
      setTransferLoading(false);
    }
  };

  if (!user?.isSuperAdmin) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  const existingWorkerWithEmail = workers.find(w => w.email === transferForm.email);

  return (
    <div className="w-full max-w-none space-y-8 pb-12">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <ShieldCheck size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <ShieldCheck size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Leadership & Succession</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Manage handover settings and designate successors. Ensure continuity of operations.
            </p>
          </div>
        </div>
      </div>

      {/* Section A: Designated Successor */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Designated Successor</h2>
          {info?.successor && (
            <button 
              onClick={() => setShowPicker(true)}
              className="text-sm font-semibold text-[#1b4376] hover:text-[#15335b]"
            >
              Change Successor
            </button>
          )}
        </div>
        
        <div className="p-6">
          {info?.successor ? (
            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-200">
                <Star className="text-[#1b4376] fill-[#1b4376]" size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-900">{info.successor.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-[#15335b]">{info.successor.email}</span>
                  <span className="text-indigo-300">•</span>
                  <span className="text-sm font-semibold text-indigo-800 capitalize">{info.successor.designation === 'coordinator' ? 'staff' : info.successor.designation.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="font-bold text-amber-900 mb-1">No successor designated</p>
              <p className="text-sm text-amber-700 mb-4 max-w-md mx-auto">
                Designate a trusted TPO staff member. If you are unavailable, they will be authorized to execute the emergency recovery protocol.
              </p>
              <button 
                onClick={() => setShowPicker(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Designate Successor
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section B: Succession Note */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Private Note for Incoming Head TPO</h2>
          <p className="text-sm text-gray-500 mt-1">
            Only visible to your successor after handover is complete. Add credentials, contacts, or handover instructions here.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="Write handover instructions..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${note.length > 1800 ? 'text-amber-600' : 'text-gray-400'}`}>
              {note.length} / 2000 characters
            </span>
            <button 
              onClick={handleSaveNote}
              disabled={savingNote}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {savingNote && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Save Note
            </button>
          </div>
        </div>
      </section>

      {/* Section C: Transfer Leadership */}
      <section className="bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-6 py-5 border-b border-red-200 flex items-start gap-3">
          <AlertTriangle className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-red-900">Transfer Head TPO Access</h2>
            <p className="text-sm text-red-700 font-medium mt-1">
              This is irreversible. You will lose super admin access immediately after the new head completes setup.
            </p>
          </div>
        </div>
        
        <div className="p-6">
          {transferStep === 3 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transfer Initiated</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                A secure setup link has been sent to <strong>{transferForm.email}</strong>. 
                You will remain Head TPO until they complete the process.
              </p>
            </div>
          ) : (
            <div className="max-w-xl">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Head Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={transferForm.email}
                    onChange={(e) => setTransferForm({ ...transferForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="successor@nith.ac.in"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    If this person already has a TPO staff account, they will be promoted. Otherwise a new account will be created.
                  </p>
                </div>
                
                {!existingWorkerWithEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Head Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={transferForm.name}
                      onChange={(e) => setTransferForm({ ...transferForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Jane Doe"
                    />
                  </div>
                )}
                
                <button 
                  onClick={() => setTransferStep(1)}
                  disabled={!transferForm.email || (!existingWorkerWithEmail && !transferForm.name)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50"
                >
                  Initiate Transfer
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Change Successor */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-[#1b4376]" /> Select TPO Staff
              </h3>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600 font-bold">X</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {workers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No active TPO staff available.</p>
              ) : (
                workers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleSetSuccessor(w.id)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-900">{w.name}</p>
                      <p className="text-sm text-gray-500">{w.email}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">
                      {w.designation === 'coordinator' ? 'staff' : w.designation.replace('_', ' ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Transfer Confirm 1 */}
      {transferStep === 1 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50">
              <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="text-red-600" /> Are you absolutely sure?
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">Type your email address to confirm:</p>
              <input
                type="text"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user.email}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => { setTransferStep(0); setConfirmEmail(''); }}
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => setTransferStep(2)}
                disabled={confirmEmail !== user.email}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Transfer Confirm 2 */}
      {transferStep === 2 && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-red-500">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Final Confirmation</h3>
              <p className="text-gray-600 mb-6">
                A setup link will be sent to <strong>{transferForm.email}</strong>. You will remain Head TPO until they complete setup.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleInitiateTransfer}
                  disabled={transferLoading}
                  className="w-full py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  {transferLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Send Transfer Link
                </button>
                <button 
                  onClick={() => { setTransferStep(0); setConfirmEmail(''); }}
                  disabled={transferLoading}
                  className="w-full py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
