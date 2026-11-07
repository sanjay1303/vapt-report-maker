import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Vulnerability, Severity, VulnStatus } from '../types';
import { storage } from '../services/storage';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Pagination } from '../components/common/Pagination';
import { VulnerabilityDetailDrawer } from '../components/vulnerabilities/VulnerabilityDetailDrawer';
import { StatusChangeModal } from '../components/vulnerabilities/StatusChangeModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';

interface VulnerabilitiesPageProps {
  initialProjectId?: string;
  initialModuleId?: string;
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const VulnerabilitiesPage: React.FC<VulnerabilitiesPageProps> = ({
  initialProjectId,
  initialModuleId,
  onNavigate,
}) => {
  const [vulns, setVulns] = useState<Vulnerability[]>(() => {
    // Collect from global pool and reports
    const globalList = storage.getGlobalVulnerabilities();
    const reportList = storage.getReports().flatMap((r) => r.vulnerabilities || []);
    // Deduplicate by ID
    const map = new Map<string, Vulnerability>();
    [...reportList, ...globalList].forEach((v) => map.set(v.id, v));
    return Array.from(map.values());
  });

  const projects = storage.getProjects();
  const allModules = storage.getModules();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'all');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId || 'all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Drawer / Modals
  const [viewingVuln, setViewingVuln] = useState<Vulnerability | null>(null);
  const [deletingVulnId, setDeletingVulnId] = useState<string | null>(null);

  // Status Change with Note Modal
  const [statusModalVuln, setStatusModalVuln] = useState<Vulnerability | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<VulnStatus>('Fixed');

  const refreshVulns = () => {
    setVulns(storage.getAllVulnerabilities());
  };

  useEffect(() => {
    const handleStatusSync = () => {
      refreshVulns();
    };
    window.addEventListener('vapt_vulnerability_status_changed', handleStatusSync);
    return () => window.removeEventListener('vapt_vulnerability_status_changed', handleStatusSync);
  }, []);

  const handleOpenStatusModal = (vuln: Vulnerability, newStatus: VulnStatus) => {
    if (vuln.status === newStatus) return;
    setStatusModalVuln(vuln);
    setStatusModalTarget(newStatus);
  };

  const handleConfirmStatusChange = (
    vulnId: string,
    newStatus: VulnStatus,
    note: string,
    retestOptions?: {
      isRetested?: boolean;
      retestNotes?: string;
      retestedDate?: string;
      retestedBy?: string;
      retestStatus?: VulnStatus;
    }
  ) => {
    const updated = storage.updateVulnerabilityStatus(vulnId, newStatus, note, undefined, retestOptions);
    refreshVulns();
    if (viewingVuln && viewingVuln.id === vulnId && updated) {
      setViewingVuln(updated);
    }
  };

  const handleDeleteConfirm = (reason?: string) => {
    if (deletingVulnId) {
      storage.deleteGlobalVulnerability(deletingVulnId, reason);
      const reports = storage.getReports();
      reports.forEach((r) => {
        r.vulnerabilities = r.vulnerabilities.filter((v) => v.id !== deletingVulnId);
      });
      storage.saveReports(reports);
      if (viewingVuln && viewingVuln.id === deletingVulnId) {
        setViewingVuln(null);
      }
      setDeletingVulnId(null);
      refreshVulns();
    }
  };

  // Filtered
  const filteredVulns = vulns.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.endpoint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      selectedProjectId === 'all' || v.projectId === selectedProjectId;

    const matchesModule =
      selectedModuleId === 'all' || v.moduleId === selectedModuleId;

    const matchesSeverity =
      selectedSeverity === 'all' ||
      v.severity === selectedSeverity ||
      ((selectedSeverity === 'Info' || selectedSeverity === 'Informational') &&
        (v.severity === 'Info' || v.severity === 'Informational'));

    const matchesStatus =
      selectedStatus === 'all' || v.status === selectedStatus;

    return (
      matchesSearch &&
      matchesProject &&
      matchesModule &&
      matchesSeverity &&
      matchesStatus
    );
  });

  const totalPages = Math.ceil(filteredVulns.length / itemsPerPage) || 1;
  const paginatedVulns = filteredVulns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header - No standalone "+ Add Vulnerability" button as vulnerabilities are created through reports */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vulnerabilities</h1>
          <p className="text-xs text-slate-500">
            View, track status, and manage security findings populated from your reports
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Findings are managed through assessment reports
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vulnerabilities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={selectedModuleId}
            onChange={(e) => {
              setSelectedModuleId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Modules</option>
            {allModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Info">Info</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Fixed">Fixed</option>
            <option value="Partially Fixed">Partially Fixed</option>
            <option value="False Positive">False Positive</option>
            <option value="Risk Accepted">Risk Accepted</option>
          </select>
        </div>
      </div>

      {/* Vulnerabilities Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Vulnerability Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4 text-center">CVSS</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVulns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-primary-600">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No vulnerabilities recorded</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {vulns.length === 0
                          ? 'Vulnerabilities are added when creating or editing assessment reports.'
                          : 'No vulnerabilities found matching your current filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVulns.map((v, index) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setViewingVuln(v)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                        {v.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        <div>
                          <span>{v.name}</span>
                          <p className="text-[11px] font-mono text-slate-400 font-normal truncate max-w-sm">
                            {v.endpoint}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {v.projectName || 'Filumart'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {v.moduleName || 'Authentication'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <SeverityBadge severity={v.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {v.cvssScore.toFixed(1)}
                      </td>

                      {/* Interactive Status Changer with Note requirement */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={v.status}
                          onChange={(e) => handleOpenStatusModal(v, e.target.value as VulnStatus)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border cursor-pointer focus:outline-hidden transition-colors ${
                            v.status === 'Fixed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : v.status === 'Open'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Open">● Open</option>
                          <option value="Fixed">● Fixed</option>
                          <option value="Partially Fixed">● Partially Fixed</option>
                          <option value="False Positive">● False Positive</option>
                          <option value="Risk Accepted">● Risk Accepted</option>
                        </select>
                        {v.statusNote && (
                          <div
                            className="text-[10px] text-slate-500 italic mt-0.5 max-w-[130px] truncate"
                            title={`Remediation Note: ${v.statusNote}`}
                          >
                            📝 {v.statusNote}
                          </div>
                        )}
                      </td>

                      {/* Actions: ONLY View and Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setViewingVuln(v)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Inspect Vulnerability Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingVulnId(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Vulnerability"
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
          totalItems={filteredVulns.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="vulnerabilities"
        />
      </div>

      {/* Inspect Detail Drawer - can see details, change status, and delete */}
      <VulnerabilityDetailDrawer
        vulnerability={viewingVuln}
        isOpen={viewingVuln !== null}
        onClose={() => setViewingVuln(null)}
        onStatusChange={(id, newStatus) => {
          const target = vulns.find((v) => v.id === id) || viewingVuln;
          if (target) handleOpenStatusModal(target, newStatus);
        }}
        onDelete={(id) => setDeletingVulnId(id)}
      />

      {/* Status Change with Note Modal */}
      <StatusChangeModal
        isOpen={statusModalVuln !== null}
        onClose={() => setStatusModalVuln(null)}
        vulnerability={statusModalVuln}
        targetStatus={statusModalTarget}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Delete Confirmation with Required Reason / Note */}
      <ConfirmDialog
        isOpen={deletingVulnId !== null}
        onClose={() => setDeletingVulnId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vulnerability"
        message="Are you sure you want to permanently delete this vulnerability? This action will remove it from all report references."
        confirmText="Delete Vulnerability"
        variant="danger"
        showInput={true}
        inputLabel="Reason / Note for Deletion"
        inputPlaceholder="e.g. Duplicate finding, invalid payload, or out of assessment scope..."
        requireInput={true}
      />
    </div>
  );
};
