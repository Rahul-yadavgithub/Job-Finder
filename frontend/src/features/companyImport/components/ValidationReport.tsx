import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, FileText } from 'lucide-react';

interface ValidationReportProps {
  report: {
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    missingEmail: number;
    invalidRows: number;
  };
}

export function ValidationReport({ report }: ValidationReportProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Validation Summary</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
        
        <div className="bg-white p-5 flex flex-col items-start">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Rows</p>
          <p className="text-2xl font-bold text-slate-900">{report.totalRows}</p>
        </div>

        <div className="bg-white p-5 flex flex-col items-start">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Valid Rows</p>
          <p className="text-2xl font-bold text-slate-900">{report.validRows}</p>
        </div>

        <div className="bg-white p-5 flex flex-col items-start">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Duplicates (in file)</p>
          <p className="text-2xl font-bold text-slate-900">{report.duplicateRows}</p>
        </div>

        <div className="bg-white p-5 flex flex-col items-start">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Invalid Rows</p>
          <p className="text-2xl font-bold text-slate-900">{report.invalidRows}</p>
        </div>

      </div>
    </div>
  );
}
