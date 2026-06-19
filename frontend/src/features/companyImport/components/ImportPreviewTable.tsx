import React from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface ImportPreviewTableProps {
  rows: any[];
  onRemoveRow?: (index: number) => void;
}

export function ImportPreviewTable({ rows, onRemoveRow }: ImportPreviewTableProps) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Preview & Confirm</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-500">
          Showing {Math.min(rows.length, 100)} of {rows.length} rows
        </span>
      </div>
      
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Company Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">HR Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">HR Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">HR Phone</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(0, 100).map((row, idx) => (
              <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!row.isValid ? 'bg-rose-50/30' : ''}`}>
                <td className="px-6 py-4">
                  {row.isValid ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-max">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </span>
                  ) : (
                    <span 
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full w-max cursor-help"
                      title={row.errors?.join(', ')}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> Error
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.companyName || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.hrName || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.hrEmail || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{row.hrPhone || '-'}</td>
                <td className="px-6 py-4 text-right">
                  {onRemoveRow && (
                    <button 
                      onClick={() => onRemoveRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && (
          <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100 bg-slate-50">
            And {rows.length - 100} more rows...
          </div>
        )}
      </div>
    </div>
  );
}
