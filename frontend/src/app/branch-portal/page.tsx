'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Users, PhoneCall, Calendar, Mail, CheckCircle2, XCircle, ArrowRight, Loader2, X, Clock, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function BranchPortalPage() {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [activeView, setActiveView] = useState<'dashboard' | 'contact' | 'confirmed' | 'not_confirmed'>('dashboard');
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  
  // Form State
  const [outcome, setOutcome] = useState<'call_again' | 'rejected' | ''>('');
  const [channel, setChannel] = useState<string>('Phone');
  const [notes, setNotes] = useState<string>('');
  const [nextContactDate, setNextContactDate] = useState<string>('');

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branches`);
      return res.data;
    }
  });

  const { data: contactTodayList, isLoading: listLoading } = useQuery({
    queryKey: ['contact-today', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branch/${selectedBranchId}/contact-today`);
      return res.data;
    },
    enabled: !!selectedBranchId
  });

  const { data: confirmedList, isLoading: confirmedLoading } = useQuery({
    queryKey: ['confirmed', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branch/${selectedBranchId}/confirmed`);
      return res.data;
    },
    enabled: !!selectedBranchId
  });

  const { data: notConfirmedList, isLoading: notConfirmedLoading } = useQuery({
    queryKey: ['not-confirmed', selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/branch/${selectedBranchId}/not-confirmed`);
      return res.data;
    },
    enabled: !!selectedBranchId
  });

  const markDeleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${companyId}/mark-delete`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['not-confirmed', selectedBranchId] })
  });

  const syncDeletionsMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/branch/${selectedBranchId}/sync-deletions`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['not-confirmed', selectedBranchId] })
  });

  const logMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const payload = {
        company_id: companyId,
        branch_id: selectedBranchId,
        channel,
        outcome,
        notes,
        created_by: 'Branch Coordinator', // Hardcoded for now
        next_contact_date: outcome === 'call_again' ? nextContactDate : undefined
      };
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/contact-logs`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-today', selectedBranchId] });
      setOutcome('');
      setChannel('Phone');
      setNotes('');
      setNextContactDate('');
      setActiveCompanyId(null);
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Branch Portal</h1>
        <p className="text-slate-500 mt-2">Manage daily outreach and track communications with assigned companies.</p>
      </div>

      {/* Branch Selector */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Your Branch</label>
        {branchesLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading branches...
          </div>
        ) : (
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              setActiveView('dashboard');
            }}
          >
            <option value="">-- Choose Branch --</option>
            {branches?.map((b: any) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Dashboard View */}
      {selectedBranchId && activeView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Contact Today</h3>
              <p className="text-slate-500 text-sm">Companies scheduled for outreach today or overdue.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {listLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{contactTodayList?.length || 0}</span>
                    <span className="text-slate-500 font-medium">pending</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('contact')}
                disabled={!contactTodayList?.length}
                className="w-full flex items-center justify-center gap-2 text-blue-600 font-medium hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmed Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Confirmed</h3>
              <p className="text-slate-500 text-sm">Companies committed to a placement drive.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {confirmedLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{confirmedList?.length || 0}</span>
                    <span className="text-slate-500 font-medium">secured</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('confirmed')}
                disabled={!confirmedList?.length}
                className="w-full flex items-center justify-center gap-2 text-green-600 font-medium hover:text-green-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Not Confirmed Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Not Confirmed</h3>
              <p className="text-slate-500 text-sm">Companies that have not committed yet.</p>
              
              <div className="mt-6 flex items-baseline gap-2">
                {notConfirmedLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">{notConfirmedList?.length || 0}</span>
                    <span className="text-slate-500 font-medium">pending</span>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4">
              <button 
                onClick={() => setActiveView('not_confirmed')}
                disabled={!notConfirmedList?.length}
                className="w-full flex items-center justify-center gap-2 text-amber-600 font-medium hover:text-amber-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                View Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details View */}
      {selectedBranchId && activeView === 'contact' && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <PhoneCall className="w-6 h-6 text-blue-600" />
              Contact Action List
            </h2>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="space-y-6">
            {contactTodayList?.map((company: any) => (
              <div key={company._id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                {/* Company Info & HR */}
                <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-900">{company.companyName}</h3>
                  <div className="mt-2 text-sm text-slate-600">
                    <p>Priority: <span className="font-semibold">{company.placementPriority || 'Standard'}</span></p>
                    <p>Status: <span className="font-semibold capitalize">{company.confirmation_status}</span></p>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">HR Contacts</h4>
                    {company.hr_contacts?.length > 0 ? (
                      <div className="space-y-3">
                        {company.hr_contacts.map((hr: any) => (
                          <div key={hr._id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                            <p className="font-bold text-slate-800">{hr.name || 'Unknown Name'}</p>
                            <p className="text-slate-500 text-xs mb-1">{hr.designation || 'HR'}</p>
                            {hr.mobile && <p className="flex items-center gap-1.5 text-slate-600 mt-1"><PhoneCall className="w-3 h-3" /> {hr.mobile}</p>}
                            {hr.email && <p className="flex items-center gap-1.5 text-slate-600 mt-1"><Mail className="w-3 h-3" /> {hr.email}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No HR contacts found.</p>
                    )}
                  </div>
                </div>

                {/* Timeline & Actions */}
                <div className="p-6 md:w-2/3 flex flex-col">
                  {/* Timeline */}
                  <div className="flex-1 mb-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Communication History
                    </h4>
                    {company.contact_logs?.length > 0 ? (
                      <div className="space-y-4">
                        {company.contact_logs.map((log: any) => (
                          <div key={log._id} className="flex gap-4">
                            <div className="mt-1">
                              {log.outcome === 'call_again' ? <Calendar className="w-4 h-4 text-blue-500" /> :
                               log.outcome === 'rejected' ? <XCircle className="w-4 h-4 text-red-500" /> :
                               <CheckCircle2 className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div>
                              <p className="text-sm text-slate-800">
                                <span className="font-semibold">{log.created_by}</span> logged a <span className="font-semibold">{log.channel}</span> interaction.
                              </p>
                              <p className="text-xs text-slate-500">{format(new Date(log.contact_date), 'MMM d, yyyy h:mm a')}</p>
                              {log.notes && <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">{log.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No previous contact logs.</p>
                    )}
                  </div>

                  {/* Log Action Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    {activeCompanyId === company._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Channel</label>
                            <select className="w-full text-sm rounded-lg border-slate-200" value={channel} onChange={(e) => setChannel(e.target.value)}>
                              <option>Phone</option>
                              <option>Email</option>
                              <option>LinkedIn</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome</label>
                            <select className="w-full text-sm rounded-lg border-slate-200" value={outcome} onChange={(e) => setOutcome(e.target.value as any)}>
                              <option value="">-- Select --</option>
                              <option value="call_again">Call Again (Reschedule)</option>
                              <option value="rejected">Rejected / Not Interested</option>
                              <option value="accepted">Accepted / Confirmed</option>
                            </select>
                          </div>
                        </div>

                        {outcome === 'call_again' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Next Contact Date</label>
                            <input 
                              type="date" 
                              className="w-full text-sm rounded-lg border-slate-200" 
                              value={nextContactDate}
                              onChange={(e) => setNextContactDate(e.target.value)}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                          <textarea 
                            className="w-full text-sm rounded-lg border-slate-200" 
                            rows={2} 
                            placeholder="Add interaction details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button 
                            onClick={() => {
                              setActiveCompanyId(null);
                              setOutcome('');
                            }}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => logMutation.mutate(company._id)}
                            disabled={logMutation.isPending || !outcome || (outcome === 'call_again' && !nextContactDate)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg flex items-center gap-2"
                          >
                            {logMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Submit Log
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setActiveCompanyId(company._id);
                          setOutcome('');
                          setNotes('');
                          setNextContactDate('');
                        }}
                        className="w-full bg-white border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 font-medium py-3 rounded-lg transition-colors"
                      >
                        + Add New Contact Log
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed List View */}
      {selectedBranchId && activeView === 'confirmed' && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Confirmed Placements
            </h2>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Drive Type</th>
                  <th className="px-6 py-4">Expected Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {confirmedList?.map((company: any) => (
                  <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{company.companyName}</td>
                    <td className="px-6 py-4 text-slate-700">{company.role || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{company.drive_type || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {company.expected_month || company.expected_year ? 
                        `${company.expected_month || ''} ${company.expected_year || ''}`.trim() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Not Confirmed View */}
      {selectedBranchId && activeView === 'not_confirmed' && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              Not Confirmed Placements
            </h2>
            <button 
              onClick={() => setActiveView('dashboard')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Section: Not Contacted */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Not Contacted</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notConfirmedList?.filter((c: any) => !c.contact_status || c.contact_status === 'not_contacted').map((company: any) => (
                <div key={company._id} className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{company.companyName}</h4>
                    <p className="text-sm text-slate-500">Score: {company.placementScore}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveView('contact');
                      setActiveCompanyId(company._id);
                    }}
                    className="mt-4 w-full text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium py-2 rounded transition-colors text-sm"
                  >
                    Go to Contact Queue
                  </button>
                </div>
              ))}
              {notConfirmedList?.filter((c: any) => !c.contact_status || c.contact_status === 'not_contacted').length === 0 && (
                <p className="text-sm text-slate-500 italic">No companies in this category.</p>
              )}
            </div>
          </div>

          {/* Section: Contacted -> Call Again */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 text-blue-700">Contacted — Call Again</h3>
            <div className="space-y-4">
              {notConfirmedList?.filter((c: any) => c.contact_status === 'contacted' && c.contact_outcome === 'call_again').map((company: any) => (
                <div key={company._id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{company.companyName}</h4>
                    <p className="text-sm text-slate-600 mt-1">Next Follow-up: <span className="font-medium text-blue-600">{company.nextFollowupDate ? format(new Date(company.nextFollowupDate), 'MMM d, yyyy') : 'Overdue'}</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveView('contact');
                      setActiveCompanyId(company._id);
                    }}
                    className="text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Log New Contact
                  </button>
                </div>
              ))}
              {notConfirmedList?.filter((c: any) => c.contact_status === 'contacted' && c.contact_outcome === 'call_again').length === 0 && (
                <p className="text-sm text-slate-500 italic">No companies in this category.</p>
              )}
            </div>
          </div>

          {/* Section: Contacted -> Rejected */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-lg font-bold text-red-700">Contacted — Rejected</h3>
              <button 
                onClick={() => syncDeletionsMutation.mutate()}
                disabled={syncDeletionsMutation.isPending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {syncDeletionsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync Deletions to Sheets
              </button>
            </div>
            
            <div className="space-y-4">
              {notConfirmedList?.filter((c: any) => c.contact_status === 'contacted' && c.contact_outcome === 'rejected').map((company: any) => (
                <div key={company._id} className={`border rounded-lg p-4 flex justify-between items-center ${company.pending_delete ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                  <div>
                    <h4 className={`font-semibold ${company.pending_delete ? 'text-red-900 line-through' : 'text-slate-900'}`}>{company.companyName}</h4>
                    {company.pending_delete && <span className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1 block">Marked for Deletion</span>}
                  </div>
                  <button 
                    onClick={() => markDeleteMutation.mutate(company._id)}
                    disabled={company.pending_delete || markDeleteMutation.isPending}
                    className="flex items-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 disabled:border-transparent bg-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Mark for Deletion
                  </button>
                </div>
              ))}
              {notConfirmedList?.filter((c: any) => c.contact_status === 'contacted' && c.contact_outcome === 'rejected').length === 0 && (
                <p className="text-sm text-slate-500 italic">No companies in this category.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
