import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function UploadArea({ onFileSelect, isLoading }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv' // csv
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#1b4376]" />
          Upload Data File
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload an Excel (.xlsx) or CSV file containing company data.
        </p>
      </div>

      <div className="p-6">
        <div
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />
          
          <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-[#1b4376]">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
          </div>
          
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Click to upload or drag and drop
          </h3>
          <p className="text-sm text-slate-500">
            Excel (.xlsx) or CSV (max. 10MB)
          </p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-400">
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">Company Name (Req)</span>
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">HR Name</span>
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">HR Email</span>
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">HR Phone</span>
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">Description</span>
          </div>
        </div>
      </div>
    </div>
  );
}
