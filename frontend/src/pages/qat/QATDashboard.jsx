import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';
import { ShieldCheck, Target, AlertTriangle } from 'lucide-react';

export default function QATDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 lg:p-8 bg-slate-50 min-h-full">
      <div className="flex items-center gap-3 mb-2">
        <span className="px-3 py-1 rounded-md bg-slate-900 text-white font-mono text-xs uppercase font-medium tracking-wide">Quality Assurance Dashboard</span>
        <span className="font-mono text-xs text-slate-500 flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          Sync Engine v4.1 Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Model Agreement</div>
            <div className="text-2xl font-bold text-slate-900">94.8%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Target size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Drift Variance</div>
            <div className="text-2xl font-bold text-slate-900">1.2%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending QA Reviews</div>
            <div className="text-2xl font-bold text-slate-900">14</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ComplaintsList 
          apiEndpoint="/qa/reviews"
          title="Recent Audits & Reviews"
          subtitle="Complaints currently undergoing or recently passed Quality Assurance."
        />
      </div>
    </div>
  );
}
