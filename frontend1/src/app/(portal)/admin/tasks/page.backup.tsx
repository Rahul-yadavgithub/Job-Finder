'use client';

import React, { useEffect, useState } from 'react';
import { adminGet, adminPatch, adminDelete, adminPost } from '@/lib/admin/api';
import { CheckSquare, CheckCircle2, Clock, UploadCloud, MessageSquareText, Loader2, ArrowRight, Trash2, Eye, Paperclip, FileText, User, Check, ClipboardList } from 'lucide-react';
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
  hr_name?: string;
  phone_number?: string;
  assignment_id: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  status: string;
  created_at: string;
  raised_by_name?: string;
  attachment_url?: string;
  attachment_filename?: string;
  actioned_at?: string;
  actioned_by_name?: string;
  rejection_reason?: string;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newStaffRequests, setNewStaffRequests] = useState<StaffRequest[]>([]);
  const [inProgressStaffRequests, setInProgressStaffRequests] = useState<StaffRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'progress'>('new');
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
        const activeRequests = staffRes.data.filter((r: StaffRequest) => r.rejection_reason !== 'ARCHIVED');
        setNewStaffRequests(activeRequests.filter((r: StaffRequest) => r.status === 'pending_send'));
        setInProgressStaffRequests(activeRequests.filter((r: StaffRequest) => r.status === 'waiting_response' || r.status === 'accepted'));
      } else {
        setNewStaffRequests([]);
        setInProgressStaffRequests([]);
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
      
      // Move from new to inProgress
      const sentReq = newStaffRequests.find(r => r.id === id);
      if (sentReq) {
        setNewStaffRequests(prev => prev.filter(r => r.id !== id));
        setInProgressStaffRequests(prev => [{ ...sentReq, status: 'waiting_response' }, ...prev]);
      }
      
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

  const handleArchiveTask = async (id: string) => {
    setExecutingTask(id);
    try {
      await adminPatch(`/staff/requests/${id}/archive`, {});
      // Optimistically remove from UI
      setInProgressStaffRequests(prev => prev.filter(r => r.id !== id));
      // Also mark it accepted/completed in backend if not already (this is redundant but safe)
      submitStaffResponse(id, 'accepted', '');
    } catch (error) {
      console.error(error);
    } finally {
      setExecutingTask(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Redesign */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="text-[#1b4376]" size={32} />
            My Workflow Tasks
          </h1>
          <p className="text-gray-500 mt-2">Manage and execute operations delegated to you.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#FEF3C7] border border-[#FCD34D] px-4 py-2 rounded-full flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-pulse"></span>
            <span className="text-sm font-black text-[#D97706] uppercase tracking-wider">{newStaffRequests.length} NEW</span>
          </div>
          <div className="bg-[#DBEAFE] border border-[#BFDBFE] px-4 py-2 rounded-full">
            <span className="text-sm font-black text-[#1D4ED8] uppercase tracking-wider">{inProgressStaffRequests.length} IN PROGRESS</span>
          </div>
        </div>
      </div>

      {/* Head TPO Tasks Loop (unchanged) */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Delegated Tasks</h2>
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative">
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
          ))}
        </div>
      )}

      {/* TABS HEADER */}
      {user?.role !== 'head' && (
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === 'new' ? 'border-[#D97706] text-[#D97706]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
          >
            New Incoming Requests
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'new' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-gray-100 text-gray-500'}`}>{newStaffRequests.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-bold transition-colors ${activeTab === 'progress' ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}
          >
            In Progress
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'progress' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-gray-100 text-gray-500'}`}>{inProgressStaffRequests.length}</span>
          </button>
        </div>
      )}

      {/* SECTION 1: NEW INCOMING REQUESTS */}
      {activeTab === 'new' && user?.role !== 'head' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
              <h2 className="text-[13px] font-[700] tracking-[0.08em] uppercase text-[#D97706]">
                New Incoming Requests
              </h2>
            </div>
          </div>

          {newStaffRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 h-[200px] flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <MessageSquareText size={32} className="text-gray-300" />
                <span className="text-sm font-medium text-gray-500">No new incoming requests</span>
              </div>
            </div>
          ) : (
            newStaffRequests.map(req => (
              <div key={req.id} className="bg-white rounded-r-xl border border-gray-200 border-l-4 border-l-[#D97706] shadow-sm overflow-hidden flex flex-col md:flex-row relative">
                <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-100">
                      Email Request
                    </span>
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDistanceToNow(new Date(req.created_at))} ago
                    </span>
                  </div>
                  
                  <h3 className="text-[20px] font-bold text-gray-900 mb-1">{req.company_name}</h3>
                  <p className="text-sm font-medium text-gray-600 mb-2">Requested by: <span className="text-gray-900">{req.raised_by_name || 'TPR'}</span></p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-flex">
                    <span className="flex items-center gap-1"><User size={14} className="text-gray-400"/> {req.hr_name || 'Not provided'}</span>
                    <span className="flex items-center gap-1">📞 {req.phone_number || 'Not provided'}</span>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-2 relative">
                    <p className="text-xs font-bold text-gray-500 mb-1">Subject: {req.email_subject}</p>
                    <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{__html: req.email_body}}></div>
                  </div>
                  {req.attachment_url && (
                    <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full transition-colors">
                      📎 {req.attachment_filename || 'Attachment.pdf'} <span className="font-normal text-blue-400 ml-1">[Download]</span>
                    </a>
                  )}
                  {errorState[req.id] && (
                    <p className="text-sm text-red-600 font-medium mt-2">{errorState[req.id]}</p>
                  )}
                </div>

                <div className="bg-orange-50/30 p-6 md:w-80 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">TPO Staff Action</p>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Action Required
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => setConfirmSendReq(req)}
                      disabled={executingTask === req.id}
                      className="w-full py-2 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {executingTask === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Mark Sent (Waiting Response)
                    </button>
                    <button 
                      onClick={() => setOverviewModalReq(req)}
                      className="w-full py-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> View Email
                    </button>
                    <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setResponseModal({ id: req.id, outcome: 'accepted' })}
                        disabled={executingTask === req.id}
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button 
                        onClick={() => setResponseModal({ id: req.id, outcome: 'rejected' })}
                        disabled={executingTask === req.id}
                        className="w-full py-2 bg-white border-2 border-red-500 hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 2: IN PROGRESS */}
      {activeTab === 'progress' && user?.role !== 'head' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-[13px] font-[700] tracking-[0.08em] uppercase text-[#1D4ED8]">
              In Progress
            </h2>
          </div>

          {inProgressStaffRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 h-[200px] flex items-center justify-center text-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <ClipboardList size={32} className="text-gray-300" />
                <span className="text-sm font-medium text-gray-500">No tasks in progress</span>
              </div>
            </div>
          ) : (
            inProgressStaffRequests.map(req => (
              <div key={req.id} className="bg-white rounded-r-xl border border-gray-200 border-l-4 border-l-[#1D4ED8] shadow-sm overflow-hidden flex flex-col md:flex-row relative">
                <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-100">
                      Email Request
                    </span>
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDistanceToNow(new Date(req.created_at))} ago
                    </span>
                  </div>
                  
                  <h3 className="text-[20px] font-bold text-gray-900 mb-1">{req.company_name}</h3>
                  <p className="text-sm font-medium text-gray-600 mb-2">Requested by: <span className="text-gray-900">{req.raised_by_name || 'TPR'}</span></p>
                  
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-flex">
                    <span className="flex items-center gap-1"><User size={14} className="text-gray-400"/> {req.hr_name || 'Not provided'}</span>
                    <span className="flex items-center gap-1">📞 {req.phone_number || 'Not provided'}</span>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-2 relative opacity-70">
                    <p className="text-xs font-bold text-gray-500 mb-1">Subject: {req.email_subject}</p>
                    <div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{__html: req.email_body}}></div>
                  </div>
                  {req.attachment_url && (
                    <a href={req.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex mt-2 items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full transition-colors">
                      📎 {req.attachment_filename || 'Attachment.pdf'} <span className="font-normal text-blue-400 ml-1">[Download]</span>
                    </a>
                  )}
                </div>

                <div className="bg-blue-50/20 p-6 md:w-80 flex flex-col justify-center border-l border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Status</p>
                  
                  {req.status === 'waiting_response' && (
                    <div className="mb-4">
                      <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-blue-200 flex items-center justify-center gap-2 w-full">
                        <Clock size={16} /> Sent (Waiting Response)
                      </span>
                      <p className="text-[10px] text-gray-500 mt-2 text-center">Action taken just now</p>
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <div className="mb-4">
                      <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-green-200 flex items-center justify-center gap-2 w-full">
                        <CheckCircle2 size={16} /> Accepted
                      </span>
                      <p className="text-[10px] text-gray-500 mt-2 text-center">Action taken just now</p>
                    </div>
                  )}

                  <div className="space-y-2 mt-auto">
                    <button 
                      onClick={() => setOverviewModalReq(req)}
                      className="w-full py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Eye size={16} /> View Email
                    </button>
                    
                    {req.status === 'waiting_response' && (
                      <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setResponseModal({ id: req.id, outcome: 'accepted' })}
                          disabled={executingTask === req.id}
                          className="w-full py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Accept
                        </button>
                        <button 
                          onClick={() => setResponseModal({ id: req.id, outcome: 'rejected' })}
                          disabled={executingTask === req.id}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} /> Reject
                        </button>
                      </div>
                    )}

                    {req.status === 'accepted' && (
                      <button 
                        onClick={() => handleArchiveTask(req.id)}
                        disabled={executingTask === req.id}
                        className="w-full mt-2 py-2.5 bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 shadow-lg text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {executingTask === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

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
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
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
                  {responseModal.outcome === 'accepted' ? 'Mark as Accepted' : 'Reason for Rejection'}
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
                placeholder={responseModal.outcome === 'accepted' ? "Optional notes about this acceptance..." : "Add notes for the Mid TPR team..."}
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
                {responseModal.outcome === 'accepted' ? 'Confirm Acceptance' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
