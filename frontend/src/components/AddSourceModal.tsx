'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SOURCE_TEMPLATES: Record<string, any> = {
  'Y Combinator': {
    sourceUrl: 'https://www.ycombinator.com/companies',
    sourceType: 'Job Board',
    scanMethod: 'YC Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Weekly',
  },
  'Wellfound': {
    sourceUrl: 'https://wellfound.com/jobs',
    sourceType: 'Job Board',
    scanMethod: 'Wellfound Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Weekly',
  },
  'Greenhouse': {
    sourceUrl: 'https://boards.greenhouse.io',
    sourceType: 'ATS Platform',
    scanMethod: 'Greenhouse Scraper',
    companyCategory: 'Other',
    defaultFrequency: 'Daily',
  },
  'Lever': {
    sourceUrl: 'https://jobs.lever.co',
    sourceType: 'ATS Platform',
    scanMethod: 'Lever Scraper',
    companyCategory: 'Other',
    defaultFrequency: 'Daily',
  },
  'Ashby': {
    sourceUrl: 'https://jobs.ashbyhq.com',
    sourceType: 'ATS Platform',
    scanMethod: 'Ashby Scraper',
    companyCategory: 'Other',
    defaultFrequency: 'Daily',
  },
  'Product Hunt': {
    sourceUrl: 'https://www.producthunt.com',
    sourceType: 'Job Board',
    scanMethod: 'Product Hunt Scraper',
    companyCategory: 'Product Based',
    defaultFrequency: 'Weekly',
  },
  'Hacker News': {
    sourceUrl: 'https://news.ycombinator.com/submitted?id=whoishiring',
    sourceType: 'Community Board',
    scanMethod: 'Hacker News Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Weekly',
  },
  'GitHub Trending': {
    sourceUrl: 'https://github.com/trending',
    sourceType: 'Code Repository',
    scanMethod: 'GitHub Trending Scraper',
    companyCategory: 'Engineering',
    defaultFrequency: 'Weekly',
  },
  'Naukri': {
    sourceUrl: 'https://www.naukri.com/fresher-jobs',
    sourceType: 'Job Board',
    scanMethod: 'Naukri Scraper',
    companyCategory: 'General',
    defaultFrequency: 'Daily',
  },
  'Instahyre': {
    sourceUrl: 'https://www.instahyre.com/jobs',
    sourceType: 'Job Board',
    scanMethod: 'Instahyre Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Daily',
  },
  'Foundit': {
    sourceUrl: 'https://www.foundit.in/srp/results?query=',
    sourceType: 'Job Board',
    scanMethod: 'Foundit Scraper',
    companyCategory: 'General',
    defaultFrequency: 'Daily',
  },
  'CutShort': {
    sourceUrl: 'https://cutshort.io/jobs',
    sourceType: 'Job Board',
    scanMethod: 'CutShort Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Daily',
  },
  'Hirist': {
    sourceUrl: 'https://www.hirist.tech/',
    sourceType: 'Job Board',
    scanMethod: 'Hirist Scraper',
    companyCategory: 'Tech',
    defaultFrequency: 'Daily',
  },
  'HasJob': {
    sourceUrl: 'https://hasjob.co/',
    sourceType: 'Job Board',
    scanMethod: 'HasJob Scraper',
    companyCategory: 'Tech',
    defaultFrequency: 'Daily',
  },
  'LinkedIn India': {
    sourceUrl: 'https://www.linkedin.com/jobs/search?location=India',
    sourceType: 'Job Board',
    scanMethod: 'LinkedIn India Scraper',
    companyCategory: 'General',
    defaultFrequency: 'Daily',
  },
  'Wellfound India': {
    sourceUrl: 'https://wellfound.com/role/l/india',
    sourceType: 'Job Board',
    scanMethod: 'Wellfound India Scraper',
    companyCategory: 'Startup',
    defaultFrequency: 'Daily',
  },
  'Custom Website': {
    sourceUrl: '',
    sourceType: 'Custom Website',
    scanMethod: 'GenericScraper',
    companyCategory: 'Other',
    defaultFrequency: 'Manual',
  }
};

const sourceSchema = z.object({
  templateName: z.enum([
    'Y Combinator', 'Wellfound', 'Greenhouse', 'Lever', 'Ashby', 
    'Product Hunt', 'Hacker News', 'GitHub Trending', 
    'Naukri', 'Instahyre', 'Foundit', 'CutShort', 'Hirist', 'HasJob', 
    'LinkedIn India', 'Wellfound India', 'Custom Website'
  ]),
  platformName: z.string().min(2, "Source name is required"),
  sourceUrl: z.string().url("Must be a valid URL"),
  sourceType: z.string(),
  scanMethod: z.string(),
  companyCategory: z.string(),
  scanFrequency: z.enum(["Manual", "Weekly", "Daily", "Every 12 Hours", "Every 6 Hours", "Hourly"]),
  notes: z.string().optional(),
});

type SourceFormData = z.infer<typeof sourceSchema>;

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function AddSourceModal({ isOpen, onClose, onSave }: AddSourceModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      templateName: 'Y Combinator',
      platformName: 'Y Combinator',
      sourceUrl: SOURCE_TEMPLATES['Y Combinator'].sourceUrl,
      sourceType: SOURCE_TEMPLATES['Y Combinator'].sourceType,
      scanMethod: SOURCE_TEMPLATES['Y Combinator'].scanMethod,
      companyCategory: SOURCE_TEMPLATES['Y Combinator'].companyCategory,
      scanFrequency: SOURCE_TEMPLATES['Y Combinator'].defaultFrequency as any,
    }
  });

  const selectedTemplate = watch("templateName");
  const isCustom = selectedTemplate === 'Custom Website';

  // Update fields when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = SOURCE_TEMPLATES[selectedTemplate];
      
      if (!isCustom) {
        setValue("platformName", selectedTemplate);
        setValue("sourceUrl", template.sourceUrl);
      } else {
        setValue("platformName", "");
        setValue("sourceUrl", "");
      }
      
      setValue("sourceType", template.sourceType);
      setValue("scanMethod", template.scanMethod);
      setValue("companyCategory", template.companyCategory);
      setValue("scanFrequency", template.defaultFrequency);
    }
  }, [selectedTemplate, isCustom, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        templateName: 'Y Combinator',
        platformName: 'Y Combinator',
        sourceUrl: SOURCE_TEMPLATES['Y Combinator'].sourceUrl,
        sourceType: SOURCE_TEMPLATES['Y Combinator'].sourceType,
        scanMethod: SOURCE_TEMPLATES['Y Combinator'].scanMethod,
        companyCategory: SOURCE_TEMPLATES['Y Combinator'].companyCategory,
        scanFrequency: SOURCE_TEMPLATES['Y Combinator'].defaultFrequency as any,
      });
    }
  }, [isOpen, reset]);

  // Handle ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const onSubmit = async (data: SourceFormData) => {
    try {
      await onSave({
        platformName: data.platformName,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType,
        scanMethod: data.scanMethod,
        companyCategory: data.companyCategory,
        scanFrequency: data.scanFrequency,
        notes: data.notes
      });
      toast.success('Source added successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add source. Name might be a duplicate.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add Source</h2>
                  <p className="text-sm text-slate-500 mt-1">Configure a new job platform or career page for scanning.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto">
                <form id="add-source-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Template Selection - Full Width */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Source Template <span className="text-red-500">*</span></label>
                    <select 
                      {...register("templateName")}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none font-medium"
                    >
                      {Object.keys(SOURCE_TEMPLATES).map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>

                  {isCustom && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {/* Source Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Source Name <span className="text-red-500">*</span></label>
                        <input 
                          {...register("platformName")}
                          placeholder="e.g. Acme Corp Careers"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {errors.platformName && <p className="text-xs text-red-500 font-medium">{errors.platformName.message}</p>}
                      </div>

                      {/* Source URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Source URL <span className="text-red-500">*</span></label>
                        <input 
                          {...register("sourceUrl")}
                          placeholder="https://careers.acme.com/jobs"
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {errors.sourceUrl && <p className="text-xs text-red-500 font-medium">{errors.sourceUrl.message}</p>}
                      </div>
                    </div>
                  )}

                  {!isCustom && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <p className="text-sm text-blue-800 font-medium mb-3">Predefined Template Configuration</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 block text-xs mb-1">Target URL</span>
                          <span className="text-slate-900 truncate block font-medium" title={watch("sourceUrl")}>{watch("sourceUrl")}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs mb-1">Scraper Engine</span>
                          <span className="text-slate-900 font-medium">{watch("scanMethod")}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs mb-1">Source Type</span>
                          <span className="text-slate-900 font-medium">{watch("sourceType")}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs mb-1">Category</span>
                          <span className="text-slate-900 font-medium">{watch("companyCategory")}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scan Frequency */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Scan Frequency <span className="text-red-500">*</span></label>
                      <select 
                        {...register("scanFrequency")}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none"
                      >
                        <option value="Manual">Manual</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        <option value="Every 12 Hours">Every 12 Hours</option>
                        <option value="Every 6 Hours">Every 6 Hours</option>
                        <option value="Hourly">Hourly</option>
                      </select>
                      {errors.scanFrequency && <p className="text-xs text-red-500 font-medium">{errors.scanFrequency.message}</p>}
                    </div>

                    {isCustom && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Company Category <span className="text-red-500">*</span></label>
                        <select 
                          {...register("companyCategory")}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors appearance-none"
                        >
                          <option value="Product Based">Product Based</option>
                          <option value="Startup">Startup</option>
                          <option value="MNC">MNC</option>
                          <option value="FinTech">FinTech</option>
                          <option value="AI/ML">AI/ML</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                    <textarea 
                      {...register("notes")}
                      rows={3}
                      placeholder="Optional notes about this source..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="add-source-form"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Source
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
