'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Send, CheckCircle2, Building2, Loader2, FileText, AlertCircle } from 'lucide-react';
import { requestApi } from '../services/request.api';

export function NewRequestWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get('company');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    companyId: preselectedCompanyId || '',
    templateId: '',
    requestType: 'institute_brochure',
    emailTo: '',
    emailSubject: '',
    emailBody: '',
    urgency: 'normal'
  });
  
  const [draftId, setDraftId] = useState<string | null>(null);

  const { data: templates } = useQuery({
    queryKey: ['comm-templates'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/settings/templates`, { withCredentials: true });
      return res.data.data;
    }
  });

  const { data: newArrivals, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['newArrivals'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/companies/interested`, { withCredentials: true });
      return res.data.data;
    }
  });

  // Step 1: Create Draft
  const createDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        companyId: formData.companyId,
        requestType: formData.requestType,
        templateId: formData.templateId
      };
      const res = await requestApi.createRequest(formData.companyId, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setDraftId(data.id);
      setStep(2);
    },
    onError: () => toast.error('Failed to initialize draft')
  });

  // Step 2: Save Draft & Proceed
  const updateDraftMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) throw new Error('No draft initialized');
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/requests/${draftId}/draft`, {
        emailTo: formData.emailTo,
        emailSubject: formData.emailSubject,
        emailBody: formData.emailBody,
        urgency: formData.urgency
      }, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      setStep(3);
    },
    onError: () => toast.error('Failed to save draft')
  });

  // Step 3: Submit to Head TPO
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) throw new Error('No draft initialized');
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/communication-tpr/requests/${draftId}/submit`, {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Submitted for Head TPO Approval');
      router.push('/communication-tpr/requests');
    },
    onError: () => toast.error('Failed to submit draft')
  });

  const handleNextStep1 = () => {
    if (!formData.companyId) return toast.error('Please select a company');
    if (!formData.templateId) return toast.error('Please select a template');
    
    // Auto-fill template content
    const selectedTpl = templates?.find((t: any) => t.id === formData.templateId);
    if (selectedTpl) {
      setFormData((prev: any) => ({
        ...prev,
        emailSubject: selectedTpl.subject,
        emailBody: selectedTpl.body_draft,
        requestType: selectedTpl.template_type
      }));
    }
    
    createDraftMutation.mutate();
  };

  const handleNextStep2 = () => {
    if (!formData.emailSubject || !formData.emailBody) return toast.error('Subject and Body are required');
    updateDraftMutation.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-3">
          <Send className="w-8 h-8 text-blue-600" />
          Send Communication
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Compose and send official emails to interested companies
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
          <li className="md:flex-1">
            <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${step >= 1 ? 'border-blue-600' : 'border-gray-200'}`}>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Step 1</span>
              <span className="text-sm font-medium">Select Company</span>
            </div>
          </li>
          <li className="md:flex-1">
            <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${step >= 2 ? 'border-blue-600' : 'border-gray-200'}`}>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Step 2</span>
              <span className="text-sm font-medium">Compose Email</span>
            </div>
          </li>
          <li className="md:flex-1">
            <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${step >= 3 ? 'border-blue-600' : 'border-gray-200'}`}>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Step 3</span>
              <span className="text-sm font-medium">Review & Submit</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Step Content */}
      <div className="bg-white shadow sm:rounded-xl p-6 border border-gray-100">
        
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Select Company (New Arrivals)</label>
              {isLoadingCompanies ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin"/> Loading companies...</div>
              ) : (
                <select 
                  className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={formData.companyId}
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">-- Choose a company --</option>
                  {newArrivals?.map((c: any) => (
                    <option key={c.company_id} value={c.company_id}>{c.companies?.company_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">Communication Type / Template</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templates?.map((t: any) => (
                  <div 
                    key={t.id} 
                    onClick={() => setFormData({...formData, templateId: t.id})}
                    className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${formData.templateId === t.id ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-300'}`}
                  >
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900 uppercase tracking-wider">{t.template_type.replace('_', ' ')}</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          {t.subject}
                        </span>
                        {t.attachment_filename && (
                          <span className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block max-w-fit flex items-center gap-1">
                            <FileText className="w-3 h-3"/> {t.attachment_filename}
                          </span>
                        )}
                      </span>
                    </span>
                    {formData.templateId === t.id && <CheckCircle2 className="h-5 w-5 text-blue-600" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNextStep1}
                disabled={createDraftMutation.isPending}
                className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {createDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Continue to Compose'}
                {!createDraftMutation.isPending && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side Metadata */}
              <div className="space-y-4 lg:col-span-1 border-r border-gray-100 pr-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">To Email</label>
                  <input
                    type="email"
                    value={formData.emailTo}
                    onChange={e => setFormData({...formData, emailTo: e.target.value})}
                    placeholder="hr@company.com"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave blank to use the contact person's email automatically</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={e => setFormData({...formData, urgency: e.target.value})}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 mb-1 inline-block mr-1"/>
                  Variables like {'{{company_name}}'} and {'{{hr_name}}'} will be automatically replaced when the Head TPO sends the email.
                </div>
              </div>

              {/* Right Side Composition */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.emailSubject}
                    onChange={e => setFormData({...formData, emailSubject: e.target.value})}
                    className="block w-full rounded-md border-0 py-1.5 font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">Body</label>
                  <textarea
                    rows={12}
                    value={formData.emailBody}
                    onChange={e => setFormData({...formData, emailBody: e.target.value})}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(1)}
                className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleNextStep2}
                disabled={updateDraftMutation.isPending}
                className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {updateDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Review Draft'}
                {!updateDraftMutation.isPending && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Final Review</h3>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">
                    {newArrivals?.find((c:any) => c.company_id === formData.companyId)?.companies?.company_name || 'Selected Company'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">To Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formData.emailTo || <span className="text-gray-400 italic">Auto-resolved from contacts</span>}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Subject</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{formData.emailSubject}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Message Body</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-white p-4 rounded-md border border-gray-200 whitespace-pre-wrap font-mono">
                    {formData.emailBody}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Ready for Head TPO</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Clicking submit will send this draft to the Head TPO for final review. The email will not be sent to the company until the Head TPO approves it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Edit Draft
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="inline-flex justify-center rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
              >
                {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                Submit to Head TPO
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
