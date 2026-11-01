import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function QAReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [correctedPriority, setCorrectedPriority] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, revRes] = await Promise.all([
          api.get(`/complaints/${id}`),
          api.get(`/qa/${id}/review`).catch(() => null)
        ]);
        
        setComplaint(compRes.data.complaint);
        if (revRes && revRes.data) {
          const revData = revRes.data.data || revRes.data.review || revRes.data;
          setReview(revData);
          setCorrectedCategory(revData.correctedCategory || '');
          setCorrectedPriority(revData.correctedPriority || '');
          setComments(revData.reviewRemarks || '');
        } else {
          // prefill with AI values if no review exists
          setCorrectedCategory(compRes.data.complaint.category || '');
          setCorrectedPriority(compRes.data.complaint.priority || '');
        }
      } catch (err) {
        alert('Failed to load complaint data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e, resultType) => {
    e?.preventDefault();
    try {
      await api.post(`/qa/${id}/review`, {
        classificationResult: resultType,
        correctedCategory: resultType === 'Corrected' ? correctedCategory : undefined,
        correctedPriority: resultType === 'Corrected' ? correctedPriority : undefined,
        reviewRemarks: comments
      });
      // Simulate sending feedback to ML model
      try {
        await fetch('http://127.0.0.1:8000/api/feedback', {
           method: 'POST',
           headers: {'Content-Type':'application/json'},
           body: JSON.stringify({ complaint_id: id, result: resultType, category: correctedCategory, priority: correctedPriority })
        });
      } catch(e) {}
      alert(`QA Review (${resultType}) submitted successfully.`);
      navigate(`/complaint/${id}`);
    } catch (err) {
      alert('Failed to submit QA Review.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading QA interface...</div>;
  if (!complaint) return <div className="p-8 text-center">Complaint not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 border border-slate-200 rounded hover:bg-slate-50">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold">QA Review: #{id.substring(id.length - 6).toUpperCase()}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3">Original AI Output</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Category</span>
              <span className="font-medium">{complaint.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Priority</span>
              <span className="font-medium">{complaint.priority || 'N/A'}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span className="text-slate-500">Sentiment</span>
              <span className="font-medium">{complaint.sentiment || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm border-t-4 border-t-emerald-500">
          <h3 className="font-semibold mb-3">QA Correction & Feedback</h3>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-sm">
              <label className="font-medium text-slate-700">Corrected Category</label>
              <select 
                value={correctedCategory} 
                onChange={e => setCorrectedCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded bg-slate-50"
              >
                <option value="">Select Category</option>
                <option value="Product">Product</option>
                <option value="Packaging">Packaging</option>
                <option value="Trade">Trade</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1 text-sm">
              <label className="font-medium text-slate-700">Corrected Priority</label>
              <select 
                value={correctedPriority} 
                onChange={e => setCorrectedPriority(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded bg-slate-50"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <label className="font-medium text-slate-700">Review Remarks</label>
              <textarea 
                value={comments} 
                onChange={e => setComments(e.target.value)}
                placeholder="Reason for correction or additional notes for ML training..."
                className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                rows={3}
              />
            </div>
            
            <div className="flex gap-4 mt-2">
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'Agreed')}
                className="flex-1 py-2 bg-emerald-100 text-emerald-700 font-medium rounded hover:bg-emerald-200"
              >
                Mark as Correct (Agreed)
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, 'Corrected')}
                className="flex-1 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
              >
                Submit Correction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
