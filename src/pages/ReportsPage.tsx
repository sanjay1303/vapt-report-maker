import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileDown,
  Download,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Report } from '../types';
import { storage } from '../services/storage';
import { exportService } from '../services/exportService';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';

interface ReportsPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<Report[]>(() => storage.getReports());
  const projects = storage.getProjects();
  const allModules = storage.getModules();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const refreshReports = () => {
    setReports(storage.getReports());
  };

  useEffect(() => {
    const handleSync = () => {
      refreshReports();
    };
    window.addEventListener('vapt_vulnerability_status_changed', handleSync);
    return () => window.removeEventListener('vapt_vulnerability_status_changed', handleSync);
  }, []);

  const handleDuplicate = (id: string) => {
    const duplicated = storage.duplicateReport(id);
    if (duplicated) {
      refreshReports();
      alert(`Report duplicated as "${duplicated.name}"`);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingReportId) {
      storage.deleteReport(deletingReportId);
      setDeletingReportId(null);
      refreshReports();
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      selectedProjectId === 'all' || r.projectId === selectedProjectId;

    const matchesModule =
      selectedModuleId === 'all' || r.moduleId === selectedModuleId;

    return matchesSearch && matchesProject && matchesModule;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-500">
            View, generate, export, and manage professional VAPT documents
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-report')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Report</span>
        </button>
      </div>

      {/* Selectors Bar matching screenshot */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Project selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedModuleId('all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Module selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Module:</span>
            <select
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-primary-500 cursor-pointer"
            >
              <option value="all">All Modules</option>
              {allModules
                .filter((m) => selectedProjectId === 'all' || m.projectId === selectedProjectId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Reports Table matching screenshot */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Report Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4 text-center">Total</th>
                <th className="py-3 px-4 text-center text-red-700">Critical</th>
                <th className="py-3 px-4 text-center text-red-500">High</th>
                <th className="py-3 px-4 text-center text-amber-600">Medium</th>
                <th className="py-3 px-4 text-center text-emerald-600">Low</th>
                <th className="py-3 px-4 text-center text-blue-600">Info</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-primary-600">
                        <FileDown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">No reports found</p>
                        <p className="text-xs text-slate-400">
                          {reports.length === 0
                            ? 'Create your first VAPT report to document vulnerability findings.'
                            : 'No reports match your current project and module filter.'}
                        </p>
                      </div>
                      {reports.length === 0 && (
                        <button
                          onClick={() => onNavigate('create-report')}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          + Create Report
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((r, index) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const critical = r.vulnerabilities.filter((v) => v.severity === 'Critical').length;
                  const high = r.vulnerabilities.filter((v) => v.severity === 'High').length;
                  const medium = r.vulnerabilities.filter((v) => v.severity === 'Medium').length;
                  const low = r.vulnerabilities.filter((v) => v.severity === 'Low').length;
                  const info = r.vulnerabilities.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onNavigate('detailed-report', { reportId: r.id })}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        <div>
                          <span>{r.name}</span>
                          <span className="ml-2 font-mono text-[10px] text-slate-400 font-normal">
                            ({r.reportVersion})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{r.projectName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{r.moduleName}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100">
                          {r.vulnerabilities.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-700">{critical}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-500">{high}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600">{medium}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{low}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600">{info}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{r.lastUpdated}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onNavigate('detailed-report', { reportId: r.id })}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Detailed Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigate('create-report', { reportId: r.id })}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Report & Manage Vulnerabilities"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(r.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Duplicate Report"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportService.exportReportToWord(r)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Export Word Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingReportId(r.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredReports.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="reports"
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingReportId !== null}
        onClose={() => setDeletingReportId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Report"
        message="Are you sure you want to delete this report? This will permanently remove the report record and its compiled findings."
        confirmText="Delete Report"
        variant="danger"
      />
    </div>
  );
};

