import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { followUpApi } from '../services/followup.api';
import { FollowUp } from '../types/followup';

export function FollowUpWidgets() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const res = await followUpApi.getMyFollowUps();
      if (res.success) setFollowUps(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  const pending = followUps.filter(f => f.status === 'pending');
  const dueToday = pending.filter(f => f.followUpDate === todayStr);
  const overdue = pending.filter(f => f.followUpDate < todayStr);
  const upcoming = pending.filter(f => f.followUpDate > todayStr);

  const renderList = (items: FollowUp[], emptyMsg: string) => {
    if (items.length === 0) return <p className="text-sm text-gray-500 italic py-2">{emptyMsg}</p>;
    
    return (
      <ul className="divide-y divide-gray-100">
        {items.slice(0, 3).map(item => (
          <li key={item.id} className="py-3 flex justify-between gap-x-4">
            <div className="min-w-0">
              <Link href={`/communication-tpr/companies/${item.companyId}`} className="text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-900 truncate block">
                {item.companyName}
              </Link>
              <p className="mt-1 truncate text-xs leading-5 text-gray-500">{item.reason}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                item.priority === 'High' ? 'bg-red-50 text-red-700 ring-red-600/10' : 
                item.priority === 'Medium' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                'bg-green-50 text-green-700 ring-green-600/20'
              }`}>
                {item.priority}
              </span>
              <p className="mt-1 text-xs text-gray-500">{item.followUpTime || 'All Day'}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) return <div className="animate-pulse flex gap-4 h-48 bg-gray-100 rounded-xl w-full"></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Overdue
          </h3>
          <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-medium">{overdue.length}</span>
        </div>
        <div className="p-4">
          {renderList(overdue, 'No overdue follow-ups')}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Due Today
          </h3>
          <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs font-medium">{dueToday.length}</span>
        </div>
        <div className="p-4">
          {renderList(dueToday, 'Nothing due today')}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming
          </h3>
          <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs font-medium">{upcoming.length}</span>
        </div>
        <div className="p-4">
          {renderList(upcoming, 'No upcoming follow-ups')}
        </div>
      </div>
    </div>
  );
}
