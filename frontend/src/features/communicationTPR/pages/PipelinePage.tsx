'use client';

import React from 'react';
import { Network } from 'lucide-react';
import { PipelineKanban } from '../components/PipelineKanban';

export function PipelinePage() {
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" />
            Communication Pipeline
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage interested companies through the mid-level communication workflow.
          </p>
        </div>
      </div>

      <PipelineKanban />
    </div>
  );
}
