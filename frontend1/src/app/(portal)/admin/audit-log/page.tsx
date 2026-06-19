'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { adminGet } from '@/lib/admin/api';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Shield } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action_type: string;
  performed_by_name: string;
  target_user_name: string | null;
  reason: string | null;
  performed_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  'user_approved': 'Account Approved',
  'user_rejected': 'Access Rejected',
  'user_suspended': 'Account Suspended',
  'user_reinstated': 'Account Reinstated',
  'role_changed': 'Role Changed',
  'successor_designated': 'Successor Designated',
  'succession_note_updated': 'Succession Note Updated',
  'leadership_transferred': 'Leadership Transferred',
  'emergency_recovery_initiated': 'Emergency Recovery Initiated'
};

export default function AuditLog() {
  const { user } = useAdminAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [actionTypeFilter, setActionTypeFilter] = useState('');

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
    
    if (user?.isSuperAdmin) {
      fetchLogs(1);
    }
  }, [user, router, actionTypeFilter]);

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: meta.limit.toString()
      });
      if (actionTypeFilter) {
        queryParams.append('action_type', actionTypeFilter);
      }
      
      const response = await adminGet<{ data: AuditLogEntry[], meta: any }>(`/audit-log?${queryParams.toString()}`);
      setLogs(response.data || []);
      setMeta(response.meta);
    } catch (error) {
      console.error('Failed to fetch audit log', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.pages) {
      fetchLogs(newPage);
    }
  };

  if (!user?.isSuperAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-sm">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 font-medium">Permanent record of all administrative actions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-400" />
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-gray-700 font-medium min-w-[200px]"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500 font-medium">
            Showing {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse w-full"></div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Shield className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">No logs found.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{log.performed_by_name || 'System'}</td>
                    <td className="px-6 py-4 text-gray-600">{log.target_user_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={log.reason || ''}>
                      {log.reason || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500" title={format(new Date(log.performed_at), 'PPpp')} >
                      {format(new Date(log.performed_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <button
            disabled={meta.page <= 1 || loading}
            onClick={() => handlePageChange(meta.page - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            Page {meta.page} of {meta.pages || 1}
          </span>
          <button
            disabled={meta.page >= meta.pages || loading}
            onClick={() => handlePageChange(meta.page + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
