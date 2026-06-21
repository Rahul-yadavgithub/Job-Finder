'use client';

import { useState, useEffect } from 'react';
import { adminGet } from '@/lib/admin/api';
import { Calendar, Building2, MapPin, Search, CalendarDays, ExternalLink, Activity } from 'lucide-react';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function DrivesManagementPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await adminGet<{ success: boolean, data: any[] }>('/drives/all');
      if (res.success && res.data) {
        setDrives(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDriveStatus = (drive: any) => {
    const scheduledDate = new Date(`${drive.scheduled_date}T${drive.scheduled_time || '00:00:00'}`);
    if (isPast(scheduledDate) && !isToday(scheduledDate)) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    if (isToday(scheduledDate)) {
      return { label: 'Today', color: 'bg-green-100 text-green-700 border-green-200 animate-pulse' };
    }
    return { label: 'Upcoming', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
  };

  const filteredDrives = drives.filter(drive => {
    const matchesSearch = drive.company_name?.toLowerCase().includes(search.toLowerCase()) || 
                          drive.roles_offered?.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    const status = getDriveStatus(drive).label.toLowerCase();
    return matchesSearch && status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Drives</h1>
          <p className="text-gray-500">Manage and track all scheduled campus placement drives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Upcoming Drives</p>
            <p className="text-2xl font-bold text-gray-900">
              {drives.filter(d => getDriveStatus(d).label === 'Upcoming').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-green-600 uppercase tracking-wider">Happening Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {drives.filter(d => getDriveStatus(d).label === 'Today').length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total Drives Hosted</p>
            <p className="text-2xl font-bold text-gray-900">
              {drives.filter(d => getDriveStatus(d).label === 'Completed').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['all', 'upcoming', 'today', 'completed'].map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${statusFilter === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search drives..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px] p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                <CalendarDays size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No drives found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDrives.map(drive => {
                const status = getDriveStatus(drive);
                return (
                  <div key={drive.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col relative overflow-hidden group">
                    {/* Status Ribbon */}
                    <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold border ${status.color}`}>
                      {status.label}
                    </div>

                    <div className="flex items-start justify-between mb-4 pr-24">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{drive.company_name || 'Unknown Company'}</h3>
                        <p className="text-indigo-600 font-semibold text-sm capitalize">{drive.drive_type.replace('_', ' ')} Drive</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{format(new Date(drive.scheduled_date), 'MMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 size={16} className="text-gray-400" />
                        <span className="font-medium truncate" title={drive.roles_offered}>{drive.roles_offered || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <MapPin size={16} className="text-gray-400 shrink-0" />
                        <span className="font-medium truncate" title={drive.venue}>{drive.venue || 'TBA'}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Package: <span className="font-bold text-gray-900">{drive.salary_package || 'Not Disclosed'}</span>
                      </div>
                      <Link 
                        href={`/admin/companies/${drive.assignment_id}`}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        View Details <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
