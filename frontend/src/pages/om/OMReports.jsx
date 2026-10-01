import React from 'react';
import api from '../../services/api';

export default function OMReports() {
  const handleDownloadCSV = async () => {
    try {
      const res = await api.get('/reports/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resolvo_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Failed to download CSV');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get('/reports/pdf', { responseType: 'blob' });
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports & Exports</h1>
        <p className="text-sm text-slate-500">Download operational telemetry and SLA compliance reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">description</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">CSV Export</h3>
            <p className="text-sm text-slate-500 mt-1">Raw data dump of all complaints, suitable for Excel or data warehousing.</p>
          </div>
          <button 
            onClick={handleDownloadCSV}
            className="px-4 py-2 mt-auto bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
          >
            Download CSV
          </button>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">PDF Report</h3>
            <p className="text-sm text-slate-500 mt-1">Formatted executive summary including workload and category breakdown.</p>
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 mt-auto bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
