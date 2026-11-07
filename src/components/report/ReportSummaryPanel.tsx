import React from 'react';
import { Report } from '../../types';

interface ReportSummaryPanelProps {
  report: Report;
}

export const ReportSummaryPanel: React.FC<ReportSummaryPanelProps> = ({ report }) => {
  const counts = {
    Critical: report.vulnerabilities.filter((v) => v.severity === 'Critical').length,
    High: report.vulnerabilities.filter((v) => v.severity === 'High').length,
    Medium: report.vulnerabilities.filter((v) => v.severity === 'Medium').length,
    Low: report.vulnerabilities.filter((v) => v.severity === 'Low').length,
    Info: report.vulnerabilities.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length,
  };

  const total = report.vulnerabilities.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  const severityItems = [
    { label: 'Critical', count: counts.Critical, color: '#991b1b', barColor: 'bg-red-700' },
    { label: 'High', count: counts.High, color: '#dc2626', barColor: 'bg-red-500' },
    { label: 'Medium', count: counts.Medium, color: '#d97706', barColor: 'bg-amber-500' },
    { label: 'Low', count: counts.Low, color: '#16a34a', barColor: 'bg-emerald-600' },
    { label: 'Info', count: counts.Info, color: '#2563eb', barColor: 'bg-blue-600' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs h-full min-h-0 overflow-y-auto custom-scrollbar space-y-5">
      {/* Total Card */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Finding Summary
        </h3>
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">Total Findings</span>
          <span className="text-2xl font-black text-slate-900">{total}</span>
        </div>
      </div>

      {/* Severity Breakdown Badges */}
      <div className="space-y-2">
        {severityItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 font-medium">{item.label}</span>
            </div>
            <span className="font-bold text-slate-900 font-mono">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Vertical Bar Chart matching screenshot */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Severity Distribution
        </h4>
        <div className="h-36 flex items-end justify-between gap-2 px-2 pt-6 pb-2 bg-slate-50 rounded-xl border border-slate-200">
          {severityItems.map((item) => {
            const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-700">{item.count}</span>
                <div className="w-full bg-slate-200 rounded-t-sm h-full flex items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${item.barColor}`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-500 truncate w-full text-center">
                  {item.label === 'Info' ? 'Info' : item.label.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Quick Meta */}
      <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Report ID:</span>
          <span className="font-mono font-bold text-slate-700">{report.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Version:</span>
          <span className="font-bold text-primary-600">{report.reportVersion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status:</span>
          <span className="font-bold text-emerald-600">{report.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Target URL:</span>
          <a
            href={report.applicationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 hover:underline truncate max-w-[130px]"
          >
            {report.applicationUrl}
          </a>
        </div>
      </div>
    </div>
  );
};

