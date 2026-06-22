'use client';

import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/request.api';
import { CommunicationRequest } from '../types/request';
import { DashboardLayout } from '../components/Layout';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { CheckCircle, XCircle, Search, Mail, Eye, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export function ApprovalsPage() {
  const [requests, setRequests] = useState<CommunicationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CommunicationRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await requestApi.getPendingApprovals();
      setRequests(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setIsProcessing(true);
      await requestApi.approveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsProcessing(true);
      await requestApi.rejectRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchPendingApprovals} />;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-[#15335b] to-[#1b4376] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <ShieldCheck size={300} className="-mt-10 -mr-10" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 backdrop-blur-sm">
                <ShieldCheck size={14} /> Official Workspace
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Approvals</h1>
              <p className="text-blue-100 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
                Review and approve communication requests before they are sent. Ensure quality and consistency in all outreach.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search companies or TPRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full md:w-64 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white text-slate-900 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-sm min-w-max">
            <thead className="bg-[#f4f6f8] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-800">Company</th>
                <th className="px-6 py-3 font-semibold text-slate-800">Requested By</th>
                <th className="px-6 py-3 font-semibold text-slate-800">Type</th>
                <th className="px-6 py-3 font-semibold text-slate-800">Date</th>
                <th className="px-6 py-3 font-semibold text-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No pending approvals found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{req.companyName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-600">{req.requestedByName || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {req.requestType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#15335b] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] md:max-w-2xl overflow-y-auto custom-scrollbar flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#f4f6f8]">
              <div>
                <h3 className="font-semibold text-slate-800">Review Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">For {selectedRequest.companyName}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Requested By</label>
                <div className="text-sm font-medium text-slate-800">{selectedRequest.requestedByName}</div>
              </div>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-[#f4f6f8] px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Email Draft Details</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-sm">
                    <span className="text-slate-500">To:</span> <span className="text-slate-800 font-medium">HR Contact</span> (will be resolved by backend)
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Template Type:</span> <span className="text-slate-800 font-medium">{selectedRequest.requestType}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                <p>
                  Approving this request will immediately dispatch the email to the HR contact and initialize the automated follow-up sequence based on your settings.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-[#f4f6f8] border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => handleReject(selectedRequest.id)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1b4376] hover:bg-[#15335b] rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Approve & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
