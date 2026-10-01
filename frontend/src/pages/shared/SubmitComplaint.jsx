import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Handles form submission for new complaints (used by Customer and CSE).
export default function SubmitComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('Web');
  const [customerEmail, setCustomerEmail] = useState(''); // Used by CSE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (user.role === 'cse') {
        // CSE submitting on behalf of a customer
        await api.post('/complaints/staff', {
          description,
          sourceChannel: channel,
          customerEmail
        });
        navigate('/cse/dashboard');
      } else {
        // Customer submitting their own
        await api.post('/complaints', {
          description,
          sourceChannel: 'Web'
        });
        navigate('/customer/complaints');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {user.role === 'cse' ? 'Register Direct Complaint' : 'Submit a Complaint'}
        </h1>
        <p className="text-sm text-slate-500">
          {user.role === 'cse' ? 'Intake a complaint from a direct channel (Email/Call).' : 'Please describe your issue in detail so we can resolve it quickly.'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {error && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {user.role === 'cse' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Customer Email</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              />
              <p className="text-xs text-slate-500">Must belong to an existing registered customer.</p>
            </div>
          )}

          {user.role === 'cse' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Source Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              >
                <option value="Call">Call Center</option>
                <option value="Email">Email</option>
                <option value="Direct">Direct / In-Person</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Complaint Description</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 disabled:opacity-70 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
