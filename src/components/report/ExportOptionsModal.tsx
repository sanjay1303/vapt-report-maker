import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Report, Vulnerability, VulnStatus } from '../../types';
import {
  FileText,
  Download,
  CheckCircle2,
  Tag,
  CheckSquare,
  AlertCircle,
  Filter,
  Search,
  Printer,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export type ExportFormat = 'pdf' | 'docx' | 'xlsx';
export type ExportScope = 'complete' | 'status' | 'custom';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  initialFormat?: ExportFormat;
  onExportPDF: (filteredVulns: Vulnerability[]) => void;
  onExportWord: (filteredVulns: Vulnerability[]) => Promise<void> | void;
  onExportExcel?: (filteredVulns: Vulnerability[]) => void;
  isExportingWord?: boolean;
}

const ALL_STATUSES: VulnStatus[] = [
  'Open',
  'Fixed',
  'Partially Fixed',
  'Risk Accepted',
  'False Positive',
];

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  report,
  initialFormat = 'pdf',
  onExportPDF,
  onExportWord,
  onExportExcel,
  isExportingWord = false,
}) => {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [scope, setScope] = useState<ExportScope>('complete');
  const [selectedStatuses, setSelectedStatuses] = useState<VulnStatus[]>(['Open']);
  const [selectedVulnIds, setSelectedVulnIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const vulns = useMemo(() => report.vulnerabilities || [], [report]);

  // Initialize or reset state on open
  useEffect(() => {
    if (isOpen) {
      setFormat(initialFormat);
      setScope('complete');
      setSelectedStatuses(['Open']);
      setSelectedVulnIds(vulns.map((v) => v.id));
      setSearchQuery('');
    }
  }, [isOpen, initialFormat, vulns]);

  // Compute status counts in the current report
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => {
      counts[s] = vulns.filter((v) => v.status === s).length;
    });
    return counts;
  }, [vulns]);

  // Compute filtered vulnerabilities based on selected scope
  const filteredVulns = useMemo(() => {
    if (scope === 'complete') {
      return vulns;
    }
    if (scope === 'status') {
      return vulns.filter((v) => selectedStatuses.includes(v.status));
    }
    if (scope === 'custom') {
      return vulns.filter((v) => selectedVulnIds.includes(v.id));
    }
    return vulns;
  }, [scope, vulns, selectedStatuses, selectedVulnIds]);

  // Filtered vulnerability list for the search input in custom selection
  const searchedVulns = useMemo(() => {
    if (!searchQuery.trim()) return vulns;
    const q = searchQuery.toLowerCase();
    return vulns.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.severity.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q) ||
        (v.endpoint && v.endpoint.toLowerCase().includes(q))
    );
  }, [vulns, searchQuery]);

  // Severity summary of filtered findings
  const filteredCounts = useMemo(() => {
    return {
      Critical: filteredVulns.filter((v) => v.severity === 'Critical').length,
      High: filteredVulns.filter((v) => v.severity === 'High').length,
      Medium: filteredVulns.filter((v) => v.severity === 'Medium').length,
      Low: filteredVulns.filter((v) => v.severity === 'Low').length,
      Info: filteredVulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length,
    };
  }, [filteredVulns]);

  // Toggle status selection
  const handleToggleStatus = (status: VulnStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Toggle single vulnerability selection
  const handleToggleVuln = (vulnId: string) => {
    setSelectedVulnIds((prev) =>
      prev.includes(vulnId) ? prev.filter((id) => id !== vulnId) : [...prev, vulnId]
    );
  };

  // Select all or deselect all
  const handleSelectAllVulns = () => {
    setSelectedVulnIds(vulns.map((v) => v.id));
  };
  const handleDeselectAllVulns = () => {
    setSelectedVulnIds([]);
  };

  // Confirm export
  const handleExport = () => {
    if (filteredVulns.length === 0) return;
    if (format === 'pdf') {
      onExportPDF(filteredVulns);
    } else if (format === 'xlsx') {
      if (onExportExcel) {
        onExportExcel(filteredVulns);
      } else {
        onExportWord(filteredVulns);
      }
    } else {
      onExportWord(filteredVulns);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Assessment Report"
      subtitle="Select your preferred export document format and filter scope"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            {filteredVulns.length === 0 ? (
              <span className="text-red-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Select at least one vulnerability to export
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                Ready to export <strong className="text-slate-900">{filteredVulns.length}</strong> of{' '}
                <strong>{vulns.length}</strong> findings as{' '}
                <strong className="text-primary-600 uppercase">{format}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredVulns.length === 0 || isExportingWord}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                format === 'pdf'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  : format === 'xlsx'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30'
              }`}
            >
              {format === 'pdf' ? (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Save / Print PDF ({filteredVulns.length})</span>
                </>
              ) : format === 'xlsx' ? (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel / CSV ({filteredVulns.length})</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isExportingWord ? 'Exporting...' : `Export Word (${filteredVulns.length})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Step 1: Choose Document Format */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Export Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                format === 'pdf'
                  ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'pdf' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                }`}
              >
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Save / Print as PDF
                </span>
                <span className="text-[11px] text-slate-500 leading-normal">
                  Professional vector A4 print document matching client VAPT format
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('docx')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                format === 'docx'
                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'docx' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Export Word (.docx)
                </span>
                <span className="text-[11px] text-slate-500 leading-normal">
                  Editable Word document formatted to executive specifications
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                format === 'xlsx'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  format === 'xlsx' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Export Excel (.csv)
                </span>
                <span className="text-[11px] text-slate-500 leading-normal">
                  Tabular spreadsheet format compatible with Excel and Google Sheets
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Choose Export Scope */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Choose Inclusion Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setScope('complete')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'complete'
                  ? 'border-primary-600 bg-purple-50/80 ring-2 ring-primary-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    scope === 'complete' ? 'text-primary-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">Complete Report</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                All {vulns.length} vulnerabilities and full assessment metrics
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScope('status')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'status'
                  ? 'border-primary-600 bg-purple-50/80 ring-2 ring-primary-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Tag
                  className={`w-4 h-4 ${
                    scope === 'status' ? 'text-primary-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">Based on Status Code</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Export only Open, Fixed, or selected finding statuses
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScope('custom')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'custom'
                  ? 'border-primary-600 bg-purple-50/80 ring-2 ring-primary-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare
                  className={`w-4 h-4 ${
                    scope === 'custom' ? 'text-primary-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-900">Vulnerability Based</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Manually pick specific vulnerabilities to include
              </p>
            </button>
          </div>
        </div>

        {/* Conditional View: Status Filter */}
        {scope === 'status' && (
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary-600" />
                Select Statuses to Include
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(['Open'])}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                >
                  Open Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(['Fixed'])}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                >
                  Fixed Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatuses(['Open', 'Partially Fixed'])}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                >
                  Open &amp; Partially Fixed
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatuses([...ALL_STATUSES])}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_STATUSES.map((status) => {
                const count = statusCounts[status] || 0;
                const isChecked = selectedStatuses.includes(status);
                return (
                  <label
                    key={status}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-white border-primary-500 shadow-2xs font-bold text-slate-900'
                        : 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleStatus(status)}
                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                      />
                      <span>{status}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                        count > 0 ? 'bg-slate-200 text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Conditional View: Custom Vulnerability Selection */}
        {scope === 'custom' && (
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter findings by name, ID or status..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllVulns}
                  className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold"
                >
                  Select All ({vulns.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllVulns}
                  className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {searchedVulns.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No vulnerabilities match your search.
                </div>
              ) : (
                searchedVulns.map((v, index) => {
                  const isChecked = selectedVulnIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-white border-primary-500 shadow-2xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleVuln(v.id)}
                          className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer shrink-0"
                        />
                        <span className="font-mono text-slate-400 font-bold shrink-0">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">
                          {v.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SeverityBadge severity={v.severity} size="sm" />
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          {v.cvssScore > 0 ? v.cvssScore.toFixed(1) : '0.0'}
                        </span>
                        <StatusBadge status={v.status} size="sm" />
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Live Filter Summary Badge */}
        <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Export Scope Preview:</span>
            <span className="font-mono font-bold text-primary-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {filteredVulns.length} / {vulns.length} Findings
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-red-700 font-bold">[{filteredCounts.Critical}] Crit</span>
            <span className="text-red-600 font-bold">[{filteredCounts.High}] High</span>
            <span className="text-amber-600 font-bold">[{filteredCounts.Medium}] Med</span>
            <span className="text-emerald-600 font-bold">[{filteredCounts.Low}] Low</span>
            <span className="text-blue-600 font-bold">[{filteredCounts.Info}] Info</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

