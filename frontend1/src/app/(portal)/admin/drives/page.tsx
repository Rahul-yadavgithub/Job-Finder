'use client';

import { useState, useEffect } from 'react';
import { adminGet } from '@/lib/admin/api';
import { Calendar, Building2, MapPin, Search, CalendarDays, ExternalLink, Activity, Edit2 } from 'lucide-react';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { adminPatch } from '@/lib/admin/api';

export default function DrivesManagementPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editingDrive, setEditingDrive] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editPackage, setEditPackage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (drive: any) => {
    setEditingDrive(drive);
    setEditDate(drive.scheduled_date || '');
    setEditPackage(drive.salary_package || '');
  };

  const handleSaveEdit = async () => {
    if (!editingDrive) return;
    setIsSaving(true);
    try {
      const payload = {
        date: editDate || undefined,
        salaryPackage: editPackage || undefined
      };
      const res = await adminPatch<{ success: boolean }>(`/drives/${editingDrive.id}/date`, payload);
      
      if (res.success) {
        setEditingDrive(null);
        fetchDrives();
      } else {
        alert('Failed to update drive details');
      }
    } catch (error) {
      alert('An error occurred while updating the drive');
    } finally {
      setIsSaving(false);
    }
  };

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
    return { label: 'Upcoming', color: 'bg-blue-100 text-[#15335b] border-indigo-200' };
  };

  const filteredDrives = drives.filter(drive => {
    const matchesSearch = drive.company_name?.toLowerCase().includes(search.toLowerCase()) || 
                          drive.roles_offered?.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    const status = getDriveStatus(drive).label.toLowerCase();
    return matchesSearch && status === statusFilter;
  });

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Drives</h1>
          <p className="text-gray-500">Manage and track all scheduled campus placement drives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1b4376]">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1b4376] uppercase tracking-wider">Upcoming Drives</p>
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
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${statusFilter === t ? 'bg-white text-[#15335b] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <p className="text-[#1b4376] font-semibold text-sm capitalize">{drive.drive_type.replace('_', ' ')} Drive</p>
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
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEditClick(drive)}
                          className="text-xs font-bold text-gray-500 hover:text-[#1b4376] flex items-center gap-1 transition-colors"
                        >
                          <Edit2 size={12} /> Quick Edit
                        </button>
                        <Link 
                          href={`/admin/companies/${drive.assignment_id}`}
                          className="text-sm font-bold text-[#1b4376] hover:text-[#15335b] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          Details <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Drive Details</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Drive Date</label>
                <input 
                  type="date" 
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b4376] focus:border-transparent outline-none text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Salary Package <span className="font-normal text-gray-400">(Optional)</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. 12 LPA"
                  value={editPackage}
                  onChange={(e) => setEditPackage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b4376] focus:border-transparent outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingDrive(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving || (!editDate && !editPackage)}
                className="px-4 py-2 bg-[#1b4376] text-white rounded-lg font-medium hover:bg-[#15335b] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
