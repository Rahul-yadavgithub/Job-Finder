'use client';

import React, { useEffect, useState } from 'react';
import { adminGet, adminPatch } from '@/lib/admin/api';
import { CheckSquare, CheckCircle2, Clock, UploadCloud, MessageSquareText, Loader2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingTask, setExecutingTask] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await adminGet<{ data: Task[] }>('/tasks/my-tasks');
      if (res.data) setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
            <CheckSquare className="text-indigo-600" size={32} />
            My Workflow Tasks
          </h1>
          <p className="text-gray-500 mt-2">Manage and execute operations delegated to you.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex flex-col items-center">
          <span className="text-2xl font-black text-indigo-700">{tasks.length}</span>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
            <p className="text-gray-500">You have no pending workflow tasks right now.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Task Info */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-indigo-100">
                    {task.workflow_type}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> Assigned {formatDistanceToNow(new Date(task.created_at))} ago
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{task.task_name}</h3>
                <p className="text-sm font-medium text-gray-600 mb-1">Company: <span className="text-gray-900 font-bold">{task.company_name}</span></p>
                <p className="text-xs text-indigo-600 font-bold bg-indigo-50 inline-block px-2 py-0.5 rounded border border-indigo-100">
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
                    className="w-full py-2.5 bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
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
                      className="w-full py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UploadCloud size={16} /> Mark as Sent
                    </button>
                    <button 
                      onClick={() => handleExecute(task.id, 'completed', 'Completed task')}
                      disabled={executingTask === task.id}
                      className="w-full py-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
