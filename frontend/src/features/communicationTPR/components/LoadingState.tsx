import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-10 w-10 animate-spin text-[#1b4376] mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
      <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the data.</p>
    </div>
  );
}
