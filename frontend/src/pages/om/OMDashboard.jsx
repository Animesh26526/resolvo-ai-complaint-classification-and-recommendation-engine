import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, AlertCircle, Clock, CheckCircle2, TrendingUp,
  ArrowUpRight, ArrowDownRight, ShieldAlert, Loader2, Link
} from 'lucide-react';
import api from '../../services/api';

export default function OMDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin text-blue-600"/> Loading Dashboard...</div>;
  }

  const { overall, categories, priorities, sla } = stats.data || stats;

  const categoryData = [
    { name: 'Product', value: categories?.Product || 0 },
    { name: 'Packaging', value: categories?.Packaging || 0 },
    { name: 'Trade', value: categories?.Trade || 0 },
  ];

  const priorityData = [
    { name: 'High', count: priorities?.High || 0 },
    { name: 'Medium', count: priorities?.Medium || 0 },
    { name: 'Low', count: priorities?.Low || 0 },
  ];

  const COLORS = ['#2563eb', '#0ea5e9', '#6366f1'];
  const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  const statCards = [
    { title: 'Total Complaints', value: overall?.totalComplaints || 0, icon: Users, color: '#3b82f6', trend: 'Total volume', up: true },
    { title: 'Open Cases', value: overall?.pendingComplaints || 0, icon: AlertCircle, color: '#f59e0b', trend: 'Needs attention', up: false },
    { title: 'Resolved', value: overall?.resolvedComplaints || 0, icon: CheckCircle2, color: '#10b981', trend: 'Completed', up: true },
    { title: 'Avg. Resolution', value: (sla?.averageResolutionTimeHours?.toFixed(1) || 0) + 'h', icon: Clock, color: '#6366f1', trend: 'Average time', up: false },
    { title: 'SLA Breached', value: overall?.overdueComplaints || 0, icon: ShieldAlert, color: '#ef4444', trend: 'Overdue', up: false },
    { title: 'Escalated', value: overall?.escalatedComplaints || 0, icon: AlertCircle, color: '#8b5cf6', trend: 'To management', up: false },
    { title: 'SLA Compliance', value: (sla?.slaCompliancePercentage?.toFixed(1) || 0) + '%', icon: CheckCircle2, color: '#10b981', trend: 'Performance', up: true },
  ];

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Overview</h1>
          <p className="text-sm text-slate-500">Real-time analytics for Resolvo complaint management.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-emerald-600 shadow-sm">
          <TrendingUp size={16} />
          <span>Live Data (IST)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <div className={`flex items-center gap-1 text-xs font-semibold ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900">Category Distribution</h3>
            <p className="text-xs text-slate-500">Product / Packaging / Trade</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900">Priority Distribution</h3>
            <p className="text-xs text-slate-500">High / Medium / Low</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={60} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={32}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex gap-4">
          <a href="/om/reports" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow hover:bg-blue-700 transition">View Operational Reports (OpsExport)</a>
      </div>
    </div>
  );
}
