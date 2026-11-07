import React from 'react';
import { Eye, ArrowUpRight } from 'lucide-react';
import { Report } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RecentReportsTableProps {
  reports: Report[];
  onViewReport: (reportId: string) => void;
  onViewAllReports: () => void;
}

export const RecentReportsTable: React.FC<RecentReportsTableProps> = ({
  reports,
  onViewReport,
  onViewAllReports,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recent Reports</h3>
          <p className="text-xs text-slate-500">Latest generated security assessment reports</p>
        </div>
        <button
          onClick={onViewAllReports}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Report Name</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4 text-center">Findings</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No reports created yet.
                </td>
              </tr>
            ) : (
              reports.slice(0, 5).map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onViewReport(r.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                    {r.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{r.projectName}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      {r.vulnerabilities.length}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReport(r.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="View Detailed Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

