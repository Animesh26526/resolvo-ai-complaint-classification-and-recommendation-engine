import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Handles Operations Manager dashboard UI displaying high-level system metrics.
export default function OMDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/om-stats');
      setStats(res.data.stats || res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Overview</h1>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-semibold tracking-wider">Ops Console</span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time telemetry and SLA governance for <span className="font-medium text-slate-800">Resolvo</span> complaint resolution pipelines.
          </p>
        </div>
        {/* Top Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Data (IST)</span>
            <span className="font-mono text-[11px] text-slate-400 font-normal">• 30s refresh</span>
          </div>
          <button 
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <span className={`material-symbols-outlined text-[15px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Complaints */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Complaints</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.totalComplaints || 0}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </div>
        </div>

        {/* 2. Open Cases */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Open Cases</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.statusDistribution?.find(s => s._id === 'Open')?.count || 0}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] uppercase font-semibold">Action req.</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-[20px]">report_problem</span>
          </div>
        </div>

        {/* 3. Resolved */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Resolved</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.statusDistribution?.find(s => s._id === 'Resolved')?.count || 0}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
        </div>

        {/* 4. SLA Breached */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">SLA Breached</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {stats?.slaBreaches || 0}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] uppercase font-semibold">Overdue</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <span className="material-symbols-outlined text-[20px]">gpp_bad</span>
          </div>
        </div>
      </div>
      
      {/* Content Area for charts or breakdown (TBD) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workload */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">CSE Workload</h3>
          <div className="space-y-3">
            {stats?.cseWorkload?.map(cse => (
              <div key={cse._id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{cse.cseInfo?.name || 'Unassigned'}</span>
                <span className="font-mono font-medium">{cse.activeCases} active</span>
              </div>
            ))}
            {(!stats?.cseWorkload || stats.cseWorkload.length === 0) && (
              <div className="text-sm text-slate-500 text-center py-4">No data available</div>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Categories</h3>
          <div className="space-y-3">
            {stats?.categoryDistribution?.map(cat => (
              <div key={cat._id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{cat._id}</span>
                <span className="font-mono font-medium">{cat.count} cases</span>
              </div>
            ))}
            {(!stats?.categoryDistribution || stats.categoryDistribution.length === 0) && (
              <div className="text-sm text-slate-500 text-center py-4">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
