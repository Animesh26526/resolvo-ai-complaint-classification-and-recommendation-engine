import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [qaReview, setQaReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution state
  const [resolutionText, setResolutionText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${id}`);
      const comp = res.data.complaint || res.data.data?.complaint;
      setComplaint(comp);
      if (comp?.resolution || comp?.aiRecommendation) {
        setResolutionText(comp.resolution?.recommendation || comp.aiRecommendation || '');
      }
      
      // Fetch QA Review if staff
      if (user?.role !== 'customer') {
        try {
          const qaRes = await api.get(`/qa/${id}/review`);
          if (qaRes.data) {
            setQaReview(qaRes.data.review || qaRes.data.data || qaRes.data);
          }
        } catch (e) {
          // No QA review found or error
        }
      }
    } catch (err) {
      setError('Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, status: null });

  const confirmUpdateStatus = (newStatus) => {
    setConfirmDialog({ isOpen: true, status: newStatus });
  };

  const executeUpdateStatus = async () => {
    const newStatus = confirmDialog.status;
    setConfirmDialog({ isOpen: false, status: null });
    if (!newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const res = await api.post(`/complaints/${id}/stage`, { status: newStatus });
      alert(res.data.message || `Status updated to ${newStatus}`);
      fetchComplaint();
    } catch (err) {
      alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAIAnalysis = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post(`/complaints/${id}/analyze`);
      alert(res.data.message || 'AI Analysis completed successfully!');
      fetchComplaint();
    } catch (err) {
      alert(`AI Analysis failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateResolution = async () => {
    if (!resolutionText.trim()) return;
    try {
      await api.post(`/complaints/${id}/resolution`, {
        actionTaken: resolutionText,
        remarks: "Manually updated by staff",
        resolvedByAI: false
      });
      alert('Resolution updated successfully.');
      fetchComplaint();
    } catch (err) {
      alert(`Failed to save resolution: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <span className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-lg">{error || 'Complaint not found.'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-slate-600 text-[20px]">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint #{complaint._id.substring(complaint._id.length - 6).toUpperCase()}</h1>
            <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-semibold uppercase ${
              complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-emerald-50 text-emerald-700' :
              complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {complaint.status}
            </span>
          </div>
          <span className="text-sm text-slate-500 mt-1">
            Submitted on {format(new Date(complaint.createdAt), 'MMMM dd, yyyy - HH:mm')}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Overview & Analysis) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Customer Input Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">chat</span>
              Customer Statement
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
              {complaint.description}
            </p>
          </div>

          {/* AI Analysis Card */}
          {(user.role !== 'customer' || complaint.category) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">smart_toy</span>
                  AI Analysis Context
                </h3>
                {user.role !== 'customer' && !complaint.category && (
                  <button 
                    onClick={handleAIAnalysis}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                  >
                    {isGenerating ? 'Running Analysis...' : 'Run AI Analysis'}
                  </button>
                )}
              </div>
              
              {complaint.category || complaint.aiRecommendation ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Priority</span>
                    <span className={`font-semibold ${
                      complaint.priority === 'High' ? 'text-rose-700' :
                      complaint.priority === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>{complaint.priority || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category</span>
                    <span className="font-semibold text-slate-800">{complaint.category || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sentiment</span>
                    <span className="font-semibold text-slate-800">{complaint.sentiment || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Model</span>
                    <span className="font-mono text-xs font-semibold text-slate-600 mt-1">Resolvo AI</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Analysis has not been run yet.</p>
              )}
            </div>
          )}

          {/* Resolution Engine Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">assignment_turned_in</span>
              Resolution Action
            </h3>
            
            {user.role === 'customer' ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                {complaint.resolution?.recommendation || complaint.aiRecommendation || 'No resolution provided yet. Our team is working on it.'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Enter the resolution details here..."
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleUpdateResolution}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Save Resolution
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {qaReview && user.role !== 'customer' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm border-l-4 border-l-emerald-500">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                QA Review Output
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-2 text-sm">
                <p><span className="font-medium text-slate-700">Corrected Category:</span> {qaReview.correctedCategory || 'None'}</p>
                <p><span className="font-medium text-slate-700">Corrected Priority:</span> {qaReview.correctedPriority || 'None'}</p>
                <p><span className="font-medium text-slate-700">Comments:</span> {qaReview.reviewRemarks}</p>
                <p className="text-xs text-slate-500 mt-2">Reviewed on {format(new Date(qaReview.createdAt), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Metadata & Actions) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
            <h3 className="font-semibold text-slate-800">Properties</h3>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium text-slate-800">{complaint.customer?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Channel</span>
                <span className="font-medium text-slate-800">{complaint.sourceChannel || 'Web'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-slate-500">Assigned To</span>
                <span className="font-medium text-slate-800">{complaint.assignedTo?.name || 'Unassigned'}</span>
              </div>
              {complaint.slaDeadline && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">SLA Deadline</span>
                  <span className={`font-medium ${complaint.isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                    {format(new Date(complaint.slaDeadline), 'MMM dd, HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions for Staff */}
          {user.role !== 'customer' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
              <h3 className="font-semibold text-slate-800 mb-2">Actions</h3>
              
              {complaint.status !== 'Under Consideration' && (
                <button 
                  onClick={() => confirmUpdateStatus('Under Consideration')}
                  className="w-full py-2 bg-amber-50 text-amber-700 font-medium text-sm rounded-lg border border-amber-200 hover:bg-amber-100"
                >
                  Mark Under Consideration
                </button>
              )}
              
              {complaint.status !== 'Resolved' && (
                <button 
                  onClick={() => confirmUpdateStatus('Resolved')}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg border border-emerald-200 hover:bg-emerald-100"
                >
                  Mark Resolved
                </button>
              )}

              {user.role === 'qat' && (
                <button 
                  onClick={() => navigate(`/qat/review/${complaint._id}`)}
                  className="w-full py-2 mt-2 bg-slate-900 text-white font-medium text-sm rounded-lg"
                >
                  Perform QA Review
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-slate-800">Confirm Action</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to mark this complaint as <strong>{confirmDialog.status}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog({ isOpen: false, status: null })}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={executeUpdateStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
