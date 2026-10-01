import React from 'react';
import ComplaintsList from '../../components/complaints/ComplaintsList';

export default function QATDashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-6 lg:p-8 pb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] uppercase font-medium tracking-wide">Automated Audit Suite</span>
        <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Sync Engine v4.1 Active
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-[140px]">
          <span className="material-symbols-outlined text-[20px] text-slate-400">verified_user</span>
          <div>
            <div className="font-mono text-[10px] uppercase text-slate-400 font-medium">Model Agreement</div>
            <div className="text-[17px] font-bold text-slate-900 tracking-tight">94.8%</div>
          </div>
        </div>
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-[140px]">
          <span className="material-symbols-outlined text-[20px] text-slate-400">troubleshoot</span>
          <div>
            <div className="font-mono text-[10px] uppercase text-slate-400 font-medium">Drift Variance</div>
            <div className="text-[17px] font-bold text-slate-900 tracking-tight">1.2%</div>
          </div>
        </div>
      </div>
      
      <div className="-mx-6 lg:-mx-8">
        <ComplaintsList 
          apiEndpoint="/complaints/staff"
          title=""
          subtitle=""
        />
      </div>
    </div>
  );
}
