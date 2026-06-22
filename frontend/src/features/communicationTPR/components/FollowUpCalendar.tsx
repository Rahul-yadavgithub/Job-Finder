import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar as CalendarIcon, List, Trash2, Building2, PhoneCall, Mail, Briefcase } from 'lucide-react';
import { FollowUp } from '../types/followup';
import { followUpApi } from '../services/followup.api';
import Link from 'next/link';

interface FollowUpCalendarProps {
  followUps: FollowUp[];
  onStatusChange: () => void;
}

type ViewMode = 'month' | 'list';

export function FollowUpCalendar({ followUps, onStatusChange }: FollowUpCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Month grid calculations
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleMarkComplete = async (id: string) => {
    try {
      await followUpApi.updateStatus(id, 'completed');
      onStatusChange();
    } catch (e) {
      console.error('Failed to mark complete');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleteLoading(true);
    try {
      await followUpApi.deleteFollowUp(deleteModal.id);
      onStatusChange();
      setDeleteModal({ isOpen: false, id: null });
    } catch (e) {
      console.error('Failed to delete follow-up');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderMonthGrid = () => {
    const blanks = Array.from({ length: startDayOfWeek }).map((_, i) => (
      <div key={`blank-${i}`} className="bg-gray-50 border-r border-b border-gray-100 min-h-[120px] p-2"></div>
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayFollowUps = followUps.filter(f => f.followUpDate === dateStr && f.status !== 'cancelled');
      const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;

      return (
        <div key={`day-${day}`} className={`bg-white border-r border-b border-gray-100 min-h-[120px] p-2 transition-colors hover:bg-gray-50`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${isTodayStr ? 'bg-[#1b4376] text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1 mt-2">
            {dayFollowUps.map(f => (
              <div key={f.id} className={`text-xs p-2 rounded shadow-sm border ${
                f.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : 
                f.priority === 'High' ? 'bg-red-50 border-red-200 text-red-700' : 
                'bg-blue-50 border-blue-200 text-[#15335b]'
              }`}>
                <div className="flex justify-between items-start gap-1">
                  <div className="min-w-0">
                    <Link href={`/communication-tpr/companies/${f.companyId}`} className="font-bold hover:underline truncate flex items-center gap-1">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{f.companyName}</span>
                    </Link>
                    <p className="truncate text-[10px] opacity-80 mt-0.5" title={f.reason}>{f.reason}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 mt-0.5">
                    {f.status === 'pending' && (
                      <>
                        <button onClick={() => handleMarkComplete(f.id)} className="text-green-600 hover:text-green-800 bg-green-100/50 p-1 rounded transition-colors" title="Mark Complete">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteClick(f.id)} className="text-red-500 hover:text-red-700 bg-red-100/50 p-1 rounded transition-colors" title="Delete Outreach">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });

    const totalSlots = blanks.length + days.length;
    const endBlanks = Array.from({ length: totalSlots % 7 === 0 ? 0 : 7 - (totalSlots % 7) }).map((_, i) => (
      <div key={`end-blank-${i}`} className="bg-gray-50 border-r border-b border-gray-100 min-h-[120px] p-2"></div>
    ));

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {dayNames.map(name => (
            <div key={name} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-t border-gray-100">
          {blanks}
          {days}
          {endBlanks}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    // Group by pending vs completed, and order by date
    const pending = followUps.filter(f => f.status === 'pending').sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime());
    const completed = followUps.filter(f => f.status === 'completed').sort((a, b) => new Date(b.followUpDate).getTime() - new Date(a.followUpDate).getTime());

    const ItemList = ({ items, title }: { items: FollowUp[], title: string }) => (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{title} ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No items found.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {items.map(f => (
                <li key={f.id} className="p-5 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="flex-none mt-1">
                      {f.status === 'completed' ? (
                        <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-lg ${f.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Clock className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Placement Outreach
                        </span>
                        <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                          f.priority === 'High' ? 'bg-red-50 text-red-700 ring-red-600/10' : 
                          f.priority === 'Medium' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                          'bg-green-50 text-green-700 ring-green-600/20'
                        }`}>
                          {f.priority} Priority
                        </span>
                      </div>
                      
                      <Link href={`/communication-tpr/companies/${f.companyId}`} className="text-lg font-bold text-[#1b4376] hover:text-blue-600 transition-colors flex items-center gap-2 truncate">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        {f.companyName}
                      </Link>
                      
                      <div className="mt-2 bg-gray-50 border border-gray-100 rounded-md p-3 text-sm text-gray-700">
                        <span className="font-semibold text-gray-900 block mb-1 text-xs uppercase tracking-wide">Objective:</span>
                        {f.reason}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          {new Date(f.followUpDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {f.followUpTime}
                        </div>
                        {f.status === 'completed' && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-4 h-4" /> Resolved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {f.status === 'pending' && (
                    <div className="shrink-0 flex sm:flex-col gap-2 self-start sm:self-center w-full sm:w-auto">
                      <button 
                        onClick={() => handleMarkComplete(f.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 shadow-sm transition-all focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(f.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    return (
      <div className="max-w-4xl">
        <ItemList items={pending} title="Pending Follow-ups" />
        <ItemList items={completed} title="Recently Completed" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 w-48">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          {viewMode === 'month' && (
            <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={today} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">Today</button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
          )}
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Month
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {viewMode === 'month' ? renderMonthGrid() : renderListView()}

      {/* Elegant Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Scheduled Outreach</h3>
            <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete this outreach schedule? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
