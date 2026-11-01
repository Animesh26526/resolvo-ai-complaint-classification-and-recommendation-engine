import React, { useState, useEffect, useMemo } from 'react';
import { Download, FileText, Filter, Eye, Calendar } from 'lucide-react';
import api from '../../services/api';

export default function OMReports() {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', priority: 'All', status: 'All', from: '', to: '' });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get('/complaints/staff', { params: { limit: 100 } });
        setComplaints(res.data.complaints || res.data.data || []);
      } catch (err) {
        console.error('Failed to load complaints for preview', err);
      }
    };
    fetchComplaints();
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const matchesCat = filters.category === 'All' || c.category === filters.category;
      const matchesPri = filters.priority === 'All' || c.priority === filters.priority;
      const matchesStat = filters.status === 'All' || c.status === filters.status;
      let matchesDate = true;
      if (filters.from && c.createdAt) matchesDate = matchesDate && new Date(c.createdAt) >= new Date(filters.from);
      if (filters.to && c.createdAt) matchesDate = matchesDate && new Date(c.createdAt) <= new Date(filters.to + 'T23:59:59');
      return matchesCat && matchesPri && matchesStat && matchesDate;
    });
  }, [complaints, filters]);

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'All') params.set('category', filters.category);
      if (filters.priority !== 'All') params.set('priority', filters.priority);
      if (filters.status !== 'All') params.set('status', filters.status);
      if (filters.from) params.set('startDate', filters.from);
      if (filters.to) params.set('endDate', filters.to);
      
      const res = await api.get(`/reports/csv?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resolvo_backup.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download CSV');
    }
  };

  const downloadPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'All') params.set('category', filters.category);
      if (filters.priority !== 'All') params.set('priority', filters.priority);
      if (filters.status !== 'All') params.set('status', filters.status);
      if (filters.from) params.set('startDate', filters.from);
      if (filters.to) params.set('endDate', filters.to);

      const res = await api.get(`/reports/pdf?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resolvo_report.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Backup & Export</h1>
        <p className="text-sm text-slate-500">Download filtered complaint data for local backup and reporting.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4"><Filter size={16} /> Filter Data for Export</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="p-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="All">All Categories</option>
              <option value="Product">Product</option>
              <option value="Packaging">Packaging</option>
              <option value="Trade">Trade</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
            <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="p-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="p-2 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date From</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="p-2 border border-slate-200 rounded-lg text-sm bg-white"/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date To</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="p-2 border border-slate-200 rounded-lg text-sm bg-white"/>
          </div>
        </div>

        <div className="text-sm text-slate-500 mb-6">{filtered.length} complaints match current filters in preview.</div>

        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition" onClick={downloadCSV}>
            <Download size={16} /> Download CSV Backup
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition" onClick={downloadPDF}>
            <FileText size={16} /> Download PDF Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition ml-auto" onClick={() => setShowPreview(!showPreview)}>
            <Eye size={16} /> {showPreview ? 'Hide Preview' : 'Preview Selection'}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Preview — {filtered.length} records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(c => (
                  <tr key={c._id}>
                    <td className="p-3 border-b border-slate-100"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{c._id.slice(-6)}</span></td>
                    <td className="p-3 border-b border-slate-100 max-w-[200px] truncate">{c.description}</td>
                    <td className="p-3 border-b border-slate-100"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{c.category || 'N/A'}</span></td>
                    <td className="p-3 border-b border-slate-100"><span className={`px-2 py-1 text-xs font-bold rounded-full ${c.priority === 'High' ? 'bg-red-100 text-red-800' : c.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{c.priority || 'Low'}</span></td>
                    <td className="p-3 border-b border-slate-100"><span className="uppercase text-xs font-bold">{c.status}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">No complaints match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <p className="text-xs text-slate-500 text-center mt-4 italic">Showing first 50 of {filtered.length} records. Full data included in export.</p>
          )}
        </div>
      )}
    </div>
  );
}
