import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, FileUp } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Assuming there is a supabase client exported

export function TemplateSettings() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [forms, setForms] = useState<Record<string, { subject: string, body_draft: string }>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ['comm-templates'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/settings/templates`, { withCredentials: true });
      return res.data.data;
    }
  });

  const uploadTemplate = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/settings/templates`, payload, { withCredentials: true });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comm-templates'] });
      toast.success('Template saved successfully');
    },
    onError: () => toast.error('Failed to save template')
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, templateType: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    try {
      // Supabase storage upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${templateType}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('templates').upload(fileName, file);
      
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('templates').getPublicUrl(fileName);
      
      const payload = {
        template_type: templateType,
        subject: forms[templateType]?.subject || 'Official Communication from NITH',
        body_draft: forms[templateType]?.body_draft || 'Dear {{hr_name}},\n\nPlease find the attached document.',
        attachment_filename: file.name,
        attachment_url: urlData.publicUrl
      };

      await uploadTemplate.mutateAsync(payload);
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const saveText = (templateType: string) => {
    uploadTemplate.mutate({
      template_type: templateType,
      subject: forms[templateType]?.subject || 'Official Communication from NITH',
      body_draft: forms[templateType]?.body_draft || 'Dear {{hr_name}},\n\nPlease find the attached document.'
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const sections = [
    { id: 'institute_brochure', title: 'Institute Brochure' },
    { id: 'jnf_form', title: 'JNF Form' }
  ];

  return (
    <div className="space-y-8">
      {sections.map(section => {
        const t = templates?.find((x: any) => x.template_type === section.id);
        
        return (
          <div key={section.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (PDF only)</label>
                <div className="flex items-center gap-4">
                  {t?.attachment_url ? (
                    <a href={t.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                      {t.attachment_filename}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">No file uploaded</span>
                  )}
                  
                  <label className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                    Upload New
                    <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, section.id)} />
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    defaultValue={t?.subject || ''}
                    onChange={(e) => setForms({...forms, [section.id]: {...forms[section.id], subject: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Body Draft</label>
                  <textarea 
                    rows={4}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    defaultValue={t?.body_draft || ''}
                    onChange={(e) => setForms({...forms, [section.id]: {...forms[section.id], body_draft: e.target.value}})}
                  />
                  <p className="mt-1 text-xs text-gray-500">Available variables: {'{{company_name}}, {{hr_name}}'}</p>
                </div>
                
                <button 
                  onClick={() => saveText(section.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save Text Templates
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
