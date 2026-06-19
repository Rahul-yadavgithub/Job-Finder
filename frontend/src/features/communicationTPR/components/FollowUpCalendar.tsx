import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar as CalendarIcon, List } from 'lucide-react';
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

  const renderMonthGrid = () => {
    const blanks = Array.from({ length: startDayOfWeek }).map((_, i) => (
      <div key={`blank-${i}`} className="bg-gray-50 border-r border-b border-gray-100 min-h-[120px] p-2"></div>
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayFollowUps = followUps.filter(f => f.followUpDate === dateStr);
      const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;

      return (
        <div key={`day-${day}`} className={`bg-white border-r border-b border-gray-100 min-h-[120px] p-2 transition-colors hover:bg-gray-50`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${isTodayStr ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1 mt-2">
            {dayFollowUps.map(f => (
              <div key={f.id} className={`text-xs p-1.5 rounded truncate border ${
                f.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : 
                f.priority === 'High' ? 'bg-red-50 border-red-200 text-red-700' : 
                'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                <div className="flex justify-between items-center">
                  <Link href={`/communication-tpr/companies/${f.companyId}`} className="font-semibold hover:underline truncate mr-2">
                    {f.companyName}
                  </Link>
                  {f.status === 'pending' && (
                    <button onClick={() => handleMarkComplete(f.id)} className="shrink-0 hover:text-indigo-900" title="Mark Complete">
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  )}
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
                <li key={f.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex gap-4 items-center min-w-0">
                    <div className="flex-none">
                      {f.status === 'completed' ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      ) : (
                        <Clock className={`w-8 h-8 ${f.priority === 'High' ? 'text-red-500' : 'text-amber-500'}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/communication-tpr/companies/${f.companyId}`} className="text-sm font-semibold text-indigo-600 hover:underline block truncate">
                        {f.companyName}
                      </Link>
                      <p className="text-sm text-gray-900 mt-0.5">{f.reason}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{new Date(f.followUpDate).toLocaleDateString()} {f.followUpTime}</span>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          f.priority === 'High' ? 'bg-red-50 text-red-700 ring-red-600/10' : 
                          f.priority === 'Medium' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                          'bg-green-50 text-green-700 ring-green-600/20'
                        }`}>
                          {f.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  {f.status === 'pending' && (
                    <button 
                      onClick={() => handleMarkComplete(f.id)}
                      className="shrink-0 ml-4 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                    >
                      Complete
                    </button>
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
    </div>
  );
}
