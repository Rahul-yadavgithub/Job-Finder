'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { UploadArea } from '@/features/companyImport/components/UploadArea';
import { ValidationReport } from '@/features/companyImport/components/ValidationReport';
import { ImportPreviewTable } from '@/features/companyImport/components/ImportPreviewTable';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [report, setReport] = useState<any>(null);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const queryClient = useQueryClient();
  const router = useRouter();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/import/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (res.data.success) {
        setReport(res.data.data.report);
        setFileName(res.data.data.fileName);
        
        // Combine valid and invalid for preview
        const combined = [
          ...res.data.data.report.invalidData,
          ...res.data.data.report.validData
        ];
        setAllRows(combined);
        toast.success('File parsed successfully');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to parse file');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveRow = (index: number) => {
    const rowToRemove = allRows[index];
    const newRows = [...allRows];
    newRows.splice(index, 1);
    setAllRows(newRows);

    // Update report counts
    const newReport = { ...report };
    if (rowToRemove.isValid) {
      newReport.validRows--;
    } else {
      newReport.invalidRows--;
    }
    newReport.totalRows--;
    setReport(newReport);
  };

  const handleConfirmImport = async () => {
    if (!report || report.validRows === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsConfirming(true);
    try {
      const validRowsToImport = allRows.filter(r => r.isValid);
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tpr/import/confirm`, {
        fileName: fileName,
        rows: validRowsToImport
      }, { withCredentials: true });

      if (res.data.success) {
        const { imported, duplicates, failed } = res.data.data;
        toast.success(`Import complete: ${imported} added, ${duplicates} duplicates skipped.`);
        
        // Invalidate dashboard caches
        queryClient.invalidateQueries({ queryKey: ['tpr-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to confirm import');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto pb-24 space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bulk Company Import</h1>
        <p className="text-base text-slate-500 mt-1">
          Upload an Excel or CSV file to safely bulk import companies. Duplicates are automatically skipped.
        </p>
      </div>

      {!report ? (
        <div className="max-w-2xl">
          <UploadArea onFileSelect={handleFileSelect} isLoading={isUploading} />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ValidationReport report={report} />
          
          <ImportPreviewTable rows={allRows} onRemoveRow={handleRemoveRow} />

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button 
              onClick={() => { setReport(null); setFile(null); setAllRows([]); }}
              disabled={isConfirming}
              className="w-full sm:w-auto h-9 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
            >
              Cancel & Start Over
            </button>
            <button 
              onClick={handleConfirmImport}
              disabled={isConfirming || report.validRows === 0}
              className="w-full sm:w-auto h-9 px-6 bg-[#1b4376] hover:bg-[#15335b] text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Import {report.validRows} Valid Rows</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
