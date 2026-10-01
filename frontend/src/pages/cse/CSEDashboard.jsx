import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

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
          open: cases.filter(c => c.status === 'Open' || c.status === 'In Progress' || c.status === 'Assigned').length,
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
    <div className="flex flex-col w-full p-6 lg:p-8 gap-8 bg-slate-50 min-h-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CSE Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user.name}. Here is an overview of your assigned cases.</p>
      </div>

      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Total Assigned</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Active Cases</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.open}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-yellow-50 text-yellow-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Resolved</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.resolved}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-green-50 text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Overdue</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.overdue}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <Link to="/cse/complaints" className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-bold text-slate-800">View Assigned Cases</h3>
            <p className="text-sm text-slate-500 mt-1">Manage and resolve your active complaints.</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">arrow_forward</span>
        </Link>
        <Link to="/cse/submit" className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-500 transition-colors flex items-center justify-between group">
          <div>
            <h3 className="font-bold text-slate-800">Intake Direct Complaint</h3>
            <p className="text-sm text-slate-500 mt-1">Register a new complaint from a direct interaction.</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-colors">post_add</span>
        </Link>
      </div>
    </div>
  );
}
