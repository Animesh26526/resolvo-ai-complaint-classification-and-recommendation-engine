import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// Reusable component to render complaints table with filtering and pagination.
export default function ComplaintsList({ apiEndpoint, title, subtitle }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined
      };
      const res = await api.get(apiEndpoint, { params });
      
      setComplaints(res.data.complaints || res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || res.data.totalPages || 1);
      setTotalRecords(res.data.pagination?.total || res.data.total || res.data.count || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, search, status, priority, apiEndpoint]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1); // Reset to page 1 on filter change
  };

  const getPriorityColor = (prio) => {
    switch(prio) {
      case 'High': return 'bg-rose-50 text-rose-700';
      case 'Medium': return 'bg-amber-50 text-amber-700';
      case 'Low': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (stat) => {
    switch(stat) {
      case 'Open': return 'bg-rose-50 text-rose-700';
      case 'In Progress': return 'bg-amber-50 text-amber-700';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700';
      case 'Closed': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col w-full p-6 lg:p-8 gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-4 items-end flex-1">
          {/* Search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-500">Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
              <input 
                type="text" 
                placeholder="ID, Title, Category..." 
                value={search}
                onChange={handleFilterChange(setSearch)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-500">Status</label>
            <select 
              value={status} 
              onChange={handleFilterChange(setStatus)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 px-3 py-1.5 pr-8 rounded-lg text-sm focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-500">Priority</label>
            <select 
              value={priority} 
              onChange={handleFilterChange(setPriority)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 px-3 py-1.5 pr-8 rounded-lg text-sm focus:outline-none focus:border-slate-400 cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          {/* Reset Filters */}
          <button 
            onClick={() => { setSearch(''); setStatus(''); setPriority(''); }}
            className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors mb-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 pl-5">ID</th>
                <th className="py-3 px-3">Title & Category</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Submitted</th>
                {user?.role !== 'customer' && <th className="py-3 px-3">SLA / Assignment</th>}
                <th className="py-3 px-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">No complaints found.</td>
                </tr>
              ) : (
                complaints.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 pl-5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono text-xs font-semibold rounded">
                        #{c._id.substring(c._id.length - 6).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex flex-col">
                        <Link to={`/complaint/${c._id}`} className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                          {c.description.length > 50 ? c.description.substring(0, 50) + '...' : c.description}
                        </Link>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{c.category || 'Uncategorized'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold uppercase ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      {c.priority ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold uppercase ${getPriorityColor(c.priority)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.priority === 'High' ? 'bg-rose-600' : c.priority === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
                          {c.priority}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-slate-500 text-xs">
                      {format(new Date(c.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    {user?.role !== 'customer' && (
                      <td className="py-4 px-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {c.assignedTo ? (
                            <span className="text-slate-700">Agent ID: {typeof c.assignedTo === 'object' ? c.assignedTo.name : c.assignedTo.substring(c.assignedTo.length - 4)}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                          {c.isOverdue && (
                            <span className="text-rose-600 font-mono font-medium">OVERDUE</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-3 pr-5 text-right">
                      <Link 
                        to={`/complaint/${c._id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">Showing page {page} of {totalPages} ({totalRecords} records)</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
