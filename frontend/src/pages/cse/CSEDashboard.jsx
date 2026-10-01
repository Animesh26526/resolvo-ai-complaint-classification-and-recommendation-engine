import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// Handles Customer Support Executive dashboard UI for quick metrics.
export default function CSEDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/complaints/staff', { params: { limit: 100 } });
        const cases = res.data.complaints || res.data.data || [];
        setStats({
          total: cases.length,
          open: cases.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
          resolved: cases.filter(c => c.status === 'Resolved').length,
          overdue: cases.filter(c => c.isOverdue).length
        });
      } catch (err) {
        console.error('Failed to load CSE stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CSE Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user.name}. Here is an overview of your assigned cases.</p>
      </div>

      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Assigned</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{stats.total}</div>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active Cases</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{stats.open}</div>
          </div>
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Resolved</span>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{stats.resolved}</div>
          </div>
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
            <span className="text-[11px] text-rose-500 uppercase tracking-wider font-semibold">Overdue</span>
            <div className="text-2xl font-bold text-rose-700 font-mono mt-1">{stats.overdue}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link to="/cse/complaints" className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-slate-800">View Assigned Cases</h3>
            <p className="text-sm text-slate-500 mt-1">Manage and resolve your active complaints.</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">arrow_forward</span>
        </Link>
        <Link to="/cse/submit" className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-slate-800">Intake Direct Complaint</h3>
            <p className="text-sm text-slate-500 mt-1">Register a new complaint from a call or email.</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">post_add</span>
        </Link>
      </div>
    </div>
  );
}
