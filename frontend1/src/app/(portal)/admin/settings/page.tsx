'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, FileUp, Settings, Trash2 } from 'lucide-react';
import { adminGet, adminPost } from '@/lib/admin/api';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  
  const [subject, setSubject] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');

  const fetchTemplate = async () => {
    try {
      setIsLoading(true);
      const res = await adminGet<{ success: boolean; data: any[] }>('/settings/templates');
      if (res.success && res.data) {
        const jnfTemplate = res.data.find(t => t.template_type === 'jnf_form');
        if (jnfTemplate) {
          setTemplate(jnfTemplate);
          setSubject(jnfTemplate.subject || '');
          setBodyDraft(jnfTemplate.body_draft || '');
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `jnf_form_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('templates').upload(fileName, file);
      
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('templates').getPublicUrl(fileName);
      
      const payload = {
        template_type: 'jnf_form',
        subject: subject || 'Official JNF from NITH',
        body_draft: bodyDraft || 'Dear {{hr_name}},\n\nPlease find the attached document.',
        attachment_filename: file.name,
        attachment_url: urlData.publicUrl
      };

      const res = await adminPost<{ success: boolean; data: any }>('/settings/templates', payload);
      if (res.success) {
        toast.success('Template saved successfully');
        fetchTemplate();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = async () => {
    setRemoving(true);
    try {
      const payload = {
        template_type: 'jnf_form',
        subject: subject || 'Official JNF from NITH',
        body_draft: bodyDraft || 'Dear {{hr_name}},\n\nPlease find the attached document.',
        attachment_filename: null,
        attachment_url: null
      };
      
      const res = await adminPost<{ success: boolean; data: any }>('/settings/templates', payload);
      if (res.success) {
        toast.success('File removed successfully');
        fetchTemplate();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove file');
    } finally {
      setRemoving(false);
    }
  };

  const saveText = async () => {
    try {
      const payload = {
        template_type: 'jnf_form',
        subject: subject || 'Official JNF from NITH',
        body_draft: bodyDraft || 'Dear {{hr_name}},\n\nPlease find the attached document.'
      };

      const res = await adminPost<{ success: boolean; data: any }>('/settings/templates', payload);
      if (res.success) {
        toast.success('Text template saved successfully');
        fetchTemplate();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save text template');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-8 pb-10">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Settings size={300} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
              <Settings size={14} /> Official Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">System Settings</h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
              Manage core configurations and platform templates. Control global communication settings.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          JNF Form Configuration
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 h-fit">
            <label className="block text-sm font-bold text-gray-700 mb-3">Attachment (PDF only)</label>
            <p className="text-sm text-gray-500 mb-4">This PDF will be automatically attached when JNF emails are sent.</p>
            <div className="flex flex-col gap-4">
              {template?.attachment_url ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <a href={template.attachment_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2 truncate">
                    <FileUp size={16} className="flex-shrink-0" />
                    <span className="truncate">{template.attachment_filename}</span>
                  </a>
                  <button
                    onClick={handleFileRemove}
                    disabled={uploading || removing}
                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Remove attachment"
                  >
                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <FileUp size={24} className="text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">No JNF file currently uploaded</span>
                </div>
              )}
              
              <label className="cursor-pointer bg-white px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors mt-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <FileUp className="w-4 h-4 text-gray-500" />}
                {template?.attachment_url ? 'Replace File' : 'Upload File'}
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Subject</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Official JNF from NITH"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Body Draft</label>
              <textarea 
                rows={6}
                className="w-full border border-gray-300 rounded-lg shadow-sm px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm resize-none"
                value={bodyDraft}
                onChange={(e) => setBodyDraft(e.target.value)}
                placeholder="Dear {{hr_name}}..."
              />
              <p className="mt-2 text-xs font-medium text-indigo-600 bg-indigo-50 py-2 px-3 rounded-md">
                Available variables: {'{{company_name}}, {{hr_name}}'}
              </p>
            </div>
            
            <button 
              onClick={saveText}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors mt-2"
            >
              Save Text Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
