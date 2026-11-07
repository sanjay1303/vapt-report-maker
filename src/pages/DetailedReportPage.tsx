import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Edit,
  Download,
  FileDown,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Report, Vulnerability, VulnStatus } from '../types';
import { storage } from '../services/storage';
import { exportService } from '../services/exportService';
import { A4ReportDocument } from '../components/report/A4ReportDocument';
import { ReportSectionNav } from '../components/report/ReportSectionNav';
import { ReportSummaryPanel } from '../components/report/ReportSummaryPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { VulnerabilityFormModal } from '../components/vulnerabilities/VulnerabilityFormModal';
import { StatusChangeModal } from '../components/vulnerabilities/StatusChangeModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';
import { ExportOptionsModal, ExportFormat } from '../components/report/ExportOptionsModal';

interface DetailedReportPageProps {
  reportId?: string;
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const DetailedReportPage: React.FC<DetailedReportPageProps> = ({
  reportId,
  onNavigate,
}) => {
  const [currentReport, setCurrentReport] = useState<Report | undefined>(() => {
    return storage.getReportById(reportId || '') || storage.getReports()[0];
  });

  const [activeSection, setActiveSection] = useState('sec-findings-summary');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Export Options Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInitialFormat, setExportInitialFormat] = useState<ExportFormat>('pdf');
  const [activeFilteredVulns, setActiveFilteredVulns] = useState<Vulnerability[] | null>(null);

  // Vulnerability form & deletion modals
  const [isVulnModalOpen, setIsVulnModalOpen] = useState(false);
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null);
  const [deletingVulnId, setDeletingVulnId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Change with Note Modal
  const [statusModalVuln, setStatusModalVuln] = useState<Vulnerability | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<VulnStatus>('Fixed');

  useEffect(() => {
    if (reportId) {
      const rep = storage.getReportById(reportId);
      if (rep) setCurrentReport(rep);
    }
  }, [reportId]);

  // Synchronize when status is changed anywhere in the system
  useEffect(() => {
    const handleStatusSync = () => {
      if (currentReport) {
        const rep = storage.getReportById(currentReport.id);
        if (rep) setCurrentReport({ ...rep });
      }
    };
    window.addEventListener('vapt_vulnerability_status_changed', handleStatusSync);
    return () => window.removeEventListener('vapt_vulnerability_status_changed', handleStatusSync);
  }, [currentReport?.id]);

  const handleOpenStatusModal = (vulnId: string, newStatus?: VulnStatus) => {
    const target = currentReport?.vulnerabilities.find((v) => v.id === vulnId);
    if (!target) return;
    setStatusModalVuln(target);
    setStatusModalTarget(newStatus || target.status);
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
    storage.updateVulnerabilityStatus(vulnId, newStatus, note, undefined, retestOptions);
    if (currentReport) {
      const rep = storage.getReportById(currentReport.id);
      if (rep) setCurrentReport({ ...rep });
    }
    showToast(`Status updated to ${newStatus} & note added to report!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!currentReport) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Report not found.</p>
        <button
          onClick={() => onNavigate('reports')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    let el = document.getElementById(sectionId);
    if (!el && sectionId.startsWith('vuln-finding-')) {
      const num = sectionId.replace('vuln-finding-', '');
      el = document.getElementById(`finding-${num}`);
    }
    if (!el && sectionId.startsWith('finding-')) {
      const num = sectionId.replace('finding-', '');
      el = document.getElementById(`vuln-finding-${num}`);
    }
    if (!el && sectionId === 'sec-findings-summary') {
      el = document.getElementById('sec-summary-findings') || document.getElementById('sec-findings-summary');
    }
    if (!el && sectionId === 'sec-detailed-findings') {
      el = document.getElementById('finding-1') || document.getElementById('sec-detailed-findings');
    }

    const container = document.getElementById('report-scroll-container');
    if (el && container) {
      const topOffset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 14;
      container.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll spy on report container to dynamically highlight active section
  useEffect(() => {
    const container = document.getElementById('report-scroll-container');
    if (!container) return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      const sections = [
        'sec-doc-info',
        'sec-exec-summary',
        'sec-findings-summary',
        ...(currentReport?.vulnerabilities.map((_, i) => `finding-${i + 1}`) || []),
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const secId = sections[i];
        const el = document.getElementById(secId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= containerTop + 140) {
            setActiveSection(secId);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentReport?.vulnerabilities]);

  // Add or Edit Vulnerability within this report
  const handleSaveVulnerability = (data: Omit<Vulnerability, 'id' | 'createdDate'>) => {
    if (editingVuln) {
      // Editing existing finding
      const updatedVulns = currentReport.vulnerabilities.map((v) =>
        v.id === editingVuln.id ? { ...v, ...data } : v
      );
      const updated = storage.updateReport(currentReport.id, {
        vulnerabilities: updatedVulns,
      });
      if (updated) setCurrentReport({ ...updated });
      showToast(`Vulnerability "${data.name}" updated successfully!`);
      setEditingVuln(null);
    } else {
      // Adding new finding directly to this report
      const prefix = currentReport.projectName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'VUL';
      const newIndex = currentReport.vulnerabilities.length + 1;
      const newVuln: Vulnerability = {
        ...data,
        id: `${prefix}-${String(newIndex).padStart(3, '0')}`,
        reportId: currentReport.id,
        projectId: currentReport.projectId,
        projectName: currentReport.projectName,
        moduleId: currentReport.moduleId || 'all',
        moduleName: currentReport.moduleName || 'General',
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      const updatedVulns = [...currentReport.vulnerabilities, newVuln];
      const updated = storage.updateReport(currentReport.id, {
        vulnerabilities: updatedVulns,
      });

      if (data.addToGlobal) {
        storage.addGlobalVulnerability(data);
      }

      if (updated) setCurrentReport({ ...updated });
      showToast(`New vulnerability "${newVuln.name}" added to report!`);
    }
    setIsVulnModalOpen(false);
  };

  // Delete Vulnerability from this report with Reason / Note
  const handleDeleteVulnerability = (reason?: string) => {
    if (deletingVulnId) {
      const removedTarget = currentReport.vulnerabilities.find((v) => v.id === deletingVulnId);
      const updatedVulns = currentReport.vulnerabilities.filter((v) => v.id !== deletingVulnId);
      const updated = storage.updateReport(currentReport.id, {
        vulnerabilities: updatedVulns,
      });

      storage.addActivity({
        title: 'Finding removed from report',
        description: `Removed ${removedTarget?.name || deletingVulnId} from ${currentReport.name}${
          reason?.trim() ? ` (Reason: "${reason.trim()}")` : ''
        }`,
        type: 'vuln_updated',
        targetId: deletingVulnId,
      });

      if (updated) setCurrentReport({ ...updated });
      setDeletingVulnId(null);
      showToast('Vulnerability removed from report.');
    }
  };

  const displayReport: Report = useMemo(() => {
    if (!currentReport) return currentReport as any;
    if (!activeFilteredVulns) return currentReport;
    return {
      ...currentReport,
      vulnerabilities: activeFilteredVulns,
    };
  }, [currentReport, activeFilteredVulns]);

  const handleOpenExportModal = (fmt: ExportFormat) => {
    setExportInitialFormat(fmt);
    setIsExportModalOpen(true);
  };

  const handleConfirmExportPDF = (filtered: Vulnerability[]) => {
    setIsExportModalOpen(false);
    setActiveFilteredVulns(filtered);
    showToast(`PDF print view ready with ${filtered.length} findings.`);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleConfirmExportWord = async (filtered: Vulnerability[]) => {
    if (!currentReport) return;
    setIsExportingWord(true);
    try {
      const reportToExport: Report = {
        ...currentReport,
        vulnerabilities: filtered,
      };
      await exportService.exportReportToWord(reportToExport);
      showToast(`Exported ${filtered.length} findings to Word (.docx)!`);
    } catch (e) {
      console.error(e);
      showToast('Failed to export Word document. Please try again.');
    } finally {
      setIsExportingWord(false);
      setIsExportModalOpen(false);
    }
  };

  const handleConfirmExportExcel = (filtered: Vulnerability[]) => {
    if (!currentReport) return;
    try {
      const reportToExport: Report = {
        ...currentReport,
        vulnerabilities: filtered,
      };
      exportService.exportReportToExcel(reportToExport);
      showToast(`Exported ${filtered.length} findings to Excel spreadsheet!`);
    } catch (e) {
      console.error(e);
      showToast('Failed to export Excel file. Please try again.');
    } finally {
      setIsExportModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden gap-4 print:h-auto print:overflow-visible print:block print:space-y-0">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="print:hidden fixed top-20 right-8 z-50 p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar - FIXED at the top */}
      <div className="print:hidden bg-white rounded-xl p-4 sm:px-5 sm:py-3.5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={() => onNavigate('reports')}
              className="hover:text-primary-600 transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Reports
            </button>
            <span>/</span>
            <span className="font-mono font-semibold text-slate-700">{currentReport.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {currentReport.name}
            </h1>
            <StatusBadge status={currentReport.status} />
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-primary-700 border border-purple-200">
              {currentReport.reportVersion}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Add Vulnerability button */}
          <button
            onClick={() => {
              setEditingVuln(null);
              setIsVulnModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs shadow-primary-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vulnerability</span>
          </button>

          {/* Edit Report Details */}
          <button
            onClick={() => onNavigate('create-report', { reportId: currentReport.id })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            title="Edit report metadata & scope"
          >
            <Edit className="w-4 h-4 text-slate-500" />
            <span>Edit Report</span>
          </button>

          {/* Export Word */}
          <button
            onClick={() => handleOpenExportModal('docx')}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Export Word document (Complete, Status-based, or Vulnerability-based)"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{isExportingWord ? 'Exporting...' : 'Export Word'}</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => handleOpenExportModal('xlsx')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Export Excel spreadsheet (Complete, Status-based, or Vulnerability-based)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={() => handleOpenExportModal('pdf')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            title="Save / Print PDF (Complete, Status-based, or Vulnerability-based)"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Active Filter Notification Banner */}
      {activeFilteredVulns && (
        <div className="print:hidden bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-purple-950 font-medium">
              Filtered view active: showing <strong>{activeFilteredVulns.length}</strong> of{' '}
              <strong>{currentReport.vulnerabilities.length}</strong> findings.
            </span>
          </div>
          <button
            onClick={() => setActiveFilteredVulns(null)}
            className="text-primary-700 font-bold hover:underline cursor-pointer"
          >
            Reset to Complete Report ({currentReport.vulnerabilities.length} findings)
          </button>
        </div>
      )}

      {/* 3-Column Layout: Only Center Report Moves, Others Fixed */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch print:block print:w-full print:h-auto print:overflow-visible">
        {/* Left Column: Section Navigation - FIXED */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0 print:hidden">
          <ReportSectionNav
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            vulnerabilities={displayReport.vulnerabilities}
          />
        </div>

        {/* Center Column: A4 Document Preview - ONLY THIS MOVES */}
        <div
          id="report-scroll-container"
          className="lg:col-span-6 h-full min-h-0 overflow-y-auto custom-scrollbar px-1 pb-16 print:h-auto print:overflow-visible print:p-0 print:col-span-12"
        >
          <A4ReportDocument
            report={displayReport}
            id="vapt-report-document"
            onAddVulnerability={() => {
              setEditingVuln(null);
              setIsVulnModalOpen(true);
            }}
            onEditVulnerability={(vuln) => {
              setEditingVuln(vuln);
              setIsVulnModalOpen(true);
            }}
            onDeleteVulnerability={(id) => setDeletingVulnId(id)}
            onStatusChange={handleOpenStatusModal}
          />
        </div>

        {/* Right Column: Summary Panel - FIXED */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0 print:hidden">
          <ReportSummaryPanel report={displayReport} />
        </div>
      </div>

      {/* Add / Edit Vulnerability Modal */}
      {isVulnModalOpen && (
        <VulnerabilityFormModal
          isOpen={isVulnModalOpen}
          onClose={() => {
            setIsVulnModalOpen(false);
            setEditingVuln(null);
          }}
          onSave={handleSaveVulnerability}
          initialData={editingVuln}
          projectId={currentReport.projectId}
          moduleId={currentReport.moduleId || 'mod-01'}
          reportId={currentReport.id}
          projectName={currentReport.projectName}
          moduleName={currentReport.moduleName}
          allowGlobalToggle={true}
        />
      )}

      {/* Status Change with Required Note Modal */}
      <StatusChangeModal
        isOpen={statusModalVuln !== null}
        onClose={() => setStatusModalVuln(null)}
        vulnerability={statusModalVuln}
        targetStatus={statusModalTarget}
        onConfirm={handleConfirmStatusChange}
      />

      {/* Delete Finding Confirmation with Required Reason / Note */}
      <ConfirmDialog
        isOpen={deletingVulnId !== null}
        onClose={() => setDeletingVulnId(null)}
        onConfirm={handleDeleteVulnerability}
        title="Remove Finding from Report"
        message="Are you sure you want to remove this vulnerability from this report? This will recalculate report metrics and severity summaries."
        confirmText="Remove Finding"
        variant="danger"
        showInput={true}
        inputLabel="Reason / Note for Removal"
        inputPlaceholder="e.g. Verified false positive, duplicate finding, or out of scope..."
        requireInput={true}
      />

      {/* Export Options Modal (Complete, Status-based, or Vulnerability-based) */}
      {isExportModalOpen && currentReport && (
        <ExportOptionsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={currentReport}
          initialFormat={exportInitialFormat}
          onExportPDF={handleConfirmExportPDF}
          onExportWord={handleConfirmExportWord}
          onExportExcel={handleConfirmExportExcel}
          isExportingWord={isExportingWord}
        />
      )}
    </div>
  );
};
