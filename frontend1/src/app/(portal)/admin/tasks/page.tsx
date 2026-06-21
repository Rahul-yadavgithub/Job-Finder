'use client';

import React, { useEffect, useState } from 'react';
import { adminGet, adminPatch, adminDelete, adminPost } from '@/lib/admin/api';
import { CheckSquare, CheckCircle2, Clock, UploadCloud, MessageSquareText, Loader2, ArrowRight, Trash2, Eye, Paperclip, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface Task {
  id: string;
  company_id: string;
  company_name: string;
  workflow_type: string;
  task_name: string;
  status: string;
  created_at: string;
  assigned_to_name?: string;
}

interface StaffRequest {
  id: string;
  company_id: string;
  company_name: string;
  assignment_id: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  status: string;
  created_at: string;
  raised_by_name?: string;
  attachment_url?: string;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [overviewModalReq, setOverviewModalReq] = useState<StaffRequest | null>(null);
  const [confirmSendReq, setConfirmSendReq] = useState<StaffRequest | null>(null);
  const [responseModal, setResponseModal] = useState<{ id: string, outcome: 'accepted' | 'rejected' } | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [errorState, setErrorState] = useState<Record<string, string>>({});
  const { user } = useAdminAuth();

  const fetchTasks = async () => {
    try {
      const isHead = user?.role === 'head' && !user?.jumpedIn;
      
      const promises: Promise<any>[] = [
        adminGet<{ data: Task[] }>('/tasks/my-tasks')
      ];
      
      if (!isHead) {
        promises.push(adminGet<{ data: StaffRequest[] }>('/staff/requests'));
      }

      const results = await Promise.all(promises);
      const res = results[0];
      const staffRes = !isHead ? results[1] : { data: [] };

      if (res.data) setTasks(res.data);
      if (staffRes.data) {
        // Filter out accepted/rejected from view
        setStaffRequests(staffRes.data.filter((r: StaffRequest) => r.status === 'pending_send' || r.status === 'waiting_response'));
      } else {
        setStaffRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user?.role, user?.jumpedIn]);

  const handleExecute = async (taskId: string, newStatus: string, notes: string = '') => {
    setExecutingTask(taskId);
    try {
      await adminPatch(`/tasks/${taskId}/execute`, { status: newStatus, notes });
      await fetchTasks();
    } catch (error) {
      console.error('Failed to execute task', error);
      alert('Failed to update task status.');
    } finally {
      setExecutingTask(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    
    setExecutingTask(taskId);
    try {
      await adminDelete(`/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('Failed to delete task.');
    } finally {
      setExecutingTask(null);
    }
  };

  const handleSendStaffEmail = async (id: string) => {
    setExecutingTask(id);
    setErrorState(prev => ({ ...prev, [id]: '' }));
    try {
      await adminPost(`/staff/requests/${id}/send`, {});
      setStaffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'waiting_response' } : r));
      setConfirmSendReq(null);
    } catch (error) {
      console.error(error);
      setErrorState(prev => ({ ...prev, [id]: 'Failed to send email. Please try again.' }));
    } finally {
      setExecutingTask(null);
    }
  };

  const submitStaffResponse = async (id: string, outcome: 'accepted' | 'rejected', notes: string) => {
    if (!notes.trim() && outcome === 'rejected') {
      return;
    }
    setExecutingTask(id);
    try {
      if (outcome === 'accepted') {
        await adminPost(`/staff/requests/${id}/mark-response`, { outcome, notes });
      } else {
        await adminPost(`/staff/requests/${id}/reject`, { notes });
      }
      setResponseModal(null);
      setResponseNotes('');
      await fetchTasks();
    } catch (error) {
      console.error(error);
      alert('Failed to update request.');
    } finally {
      setExecutingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-24 bg-gray-100 rounded-xl"></div>
        <div className="h-48 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="text-[#1b4376]" size={32} />
            My Workflow Tasks
          </h1>
          <p className="text-gray-500 mt-2">Manage and execute operations delegated to you.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-black text-[#15335b]">{tasks.length + staffRequests.length}</span>
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 && staffRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
            <p className="text-gray-500">You have no pending workflow tasks right now.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
              {/* Task Info */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                {user?.role === 'head' && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={executingTask === task.id}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#15335b] font-bold text-[10px] uppercase tracking-wider rounded-md border border-blue-100">
                    {task.workflow_type}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Assigned {formatDistanceToNow(new Date(task.created_at))} ago
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{task.task_name}</h3>
                <p className="text-sm font-medium text-gray-600 mb-1">Company: <span className="text-gray-900 font-bold">{task.company_name}</span></p>
                <p className="text-xs text-[#1b4376] font-bold bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
                  Assigned to: {task.assigned_to_name || 'Unknown'}
                </p>
              </div>

              {/* Action Area */}
              <div className="bg-gray-50 p-6 md:w-80 flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Execute Task</p>
                
                {task.status === 'pending' && (
                  <button 
                    onClick={() => handleExecute(task.id, 'in_progress', 'Started working on it')}
                    disabled={executingTask === task.id}
                    className="w-full py-2.5 bg-white border border-gray-200 hover:border-blue-500 hover:text-[#1b4376] text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {executingTask === task.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    Start Working
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleExecute(task.id, 'waiting_response', 'Sent to company, awaiting response')}
                      disabled={executingTask === task.id}
                      className="w-full py-2 bg-blue-50 border border-indigo-200 hover:bg-blue-100 text-[#15335b] text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UploadCloud size={16} /> Mark as Sent
                    </button>
                    <button 
                      onClick={() => handleExecute(task.id, 'completed', 'Completed task')}
                      disabled={executingTask === task.id}
                      className="w-full py-2 bg-white border border-gray-200 hover:bg-green-500 hover:text-green-600 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Mark Completed
                    </button>
                  </div>
                )}

                {task.status === 'waiting_response' && (
                  <button 
                    onClick={() => handleExecute(task.id, 'completed', 'Company responded, task complete')}
                    disabled={executingTask === task.id}
                    className="w-full py-2.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {executingTask === task.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Company Responded (Complete)
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {staffRequests.map(req => (
          <div key={req.id} className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-100">
                  Email Request
                </span>
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {formatDistanceToNow(new Date(req.created_at))} ago
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">Company: {req.company_name}</h3>
              <p className="text-sm font-medium text-gray-600 mb-2">Requested by: <span className="text-gray-900">{req.raised_by_name || 'TPR'}</span></p>
              
              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-2">
                <p className="text-xs font-bold text-gray-500 mb-1">Subject: {req.email_subject}</p>
                <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{__html: req.email_body}}></div>
              </div>
              {req.attachment_url && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Paperclip size={12} /> Attachment:
                  </span>
                  <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-1 rounded transition-colors">
                    <FileText size={12} /> {req.attachment_filename || 'View PDF Document'}
                  </a>
                </div>
              )}
              {errorState[req.id] && (
                <p className="text-sm text-red-600 font-medium mt-2">{errorState[req.id]}</p>
              )}
            </div>

            <div className="bg-blue-50 p-6 md:w-80 flex flex-col justify-center">
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">TPO Staff Action</p>
              
              {req.status === 'pending_send' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setOverviewModalReq(req)}
                    className="w-full py-2.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Overview
                  </button>
                  <button 
                    onClick={() => setConfirmSendReq(req)}
                    disabled={executingTask === req.id}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {executingTask === req.id ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    Send
                  </button>
                </div>
              )}

              {req.status === 'waiting_response' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-sm">
                    <CheckCircle2 size={16} /> Sent (Waiting Response)
                  </div>
                  <button 
                    onClick={() => setOverviewModalReq(req)}
                    className="w-full py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> View Email
                  </button>
                  <div className="pt-2 border-t border-blue-200">
                    <button 
                      onClick={() => setResponseModal({ id: req.id, outcome: 'accepted' })}
                      disabled={executingTask === req.id}
                      className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                      <CheckCircle2 size={16} /> Mark Accepted
                    </button>
                    <button 
                      onClick={() => setResponseModal({ id: req.id, outcome: 'rejected' })}
                      disabled={executingTask === req.id}
                      className="w-full py-2 bg-white border border-red-200 hover:border-red-500 hover:text-red-600 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Mark Rejected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overview Modal */}
      {overviewModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Email Overview</h3>
              <button onClick={() => setOverviewModalReq(null)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6 bg-white border-b border-gray-100 flex flex-col gap-2 text-sm">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 text-gray-500 font-medium">To:</div>
                <div className="col-span-10 text-gray-900 font-medium">{overviewModalReq.email_to || `${overviewModalReq.company_name} Contact`}</div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 text-gray-500 font-medium">From:</div>
                <div className="col-span-10 text-gray-900 font-medium">TPO Office NITH</div>
              </div>
              <div className="grid grid-cols-12 gap-2 mt-2">
                <div className="col-span-2 text-gray-500 font-medium">Subject:</div>
                <div className="col-span-10 text-gray-900 font-bold">{overviewModalReq.email_subject}</div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 whitespace-pre-wrap font-serif text-gray-800" dangerouslySetInnerHTML={{__html: overviewModalReq.email_body}}>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Send Dialog */}
      {confirmSendReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Send</h3>
            <p className="text-gray-500 mb-8">
              Send this email to <span className="font-bold text-gray-900">{confirmSendReq.company_name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => setConfirmSendReq(null)}
                disabled={executingTask === confirmSendReq.id}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendStaffEmail(confirmSendReq.id)}
                disabled={executingTask === confirmSendReq.id}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                {executingTask === confirmSendReq.id ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Note Modal */}
      {responseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-in-center border border-gray-100">
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${responseModal.outcome === 'accepted' ? 'bg-green-50/80 border-green-100' : 'bg-red-50/80 border-red-100'}`}>
              {responseModal.outcome === 'accepted' ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                  <CheckCircle2 size={20} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                  <Trash2 size={20} />
                </div>
              )}
              <div>
                <h3 className={`font-bold text-lg ${responseModal.outcome === 'accepted' ? 'text-green-900' : 'text-red-900'}`}>
                  {responseModal.outcome === 'accepted' ? 'Mark as Accepted' : 'Mark as Rejected'}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  {responseModal.outcome === 'accepted' ? 'Confirm completion of this request' : 'Provide a reason for rejection'}
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-white">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Add a note {responseModal.outcome === 'rejected' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder={responseModal.outcome === 'accepted' ? "Optional notes about this acceptance..." : "Please provide a reason for rejection (this will be logged)..."}
                className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none shadow-inner bg-gray-50/50 placeholder:text-gray-400"
                rows={4}
                autoFocus
              />
              {responseModal.outcome === 'rejected' && !responseNotes.trim() && (
                <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span> Rejection reason is required
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setResponseModal(null);
                  setResponseNotes('');
                }}
                disabled={executingTask === responseModal.id}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => submitStaffResponse(responseModal.id, responseModal.outcome, responseNotes)}
                disabled={executingTask === responseModal.id || (responseModal.outcome === 'rejected' && !responseNotes.trim())}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl flex items-center gap-2 transition-all shadow-md
                  ${responseModal.outcome === 'accepted' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20 hover:shadow-green-600/40' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20 hover:shadow-red-600/40'} 
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {executingTask === responseModal.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  responseModal.outcome === 'accepted' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />
                )}
                Confirm {responseModal.outcome === 'accepted' ? 'Acceptance' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
