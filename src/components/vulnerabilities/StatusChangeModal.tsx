import React, { useState, useEffect } from 'react';
import { VulnStatus, Vulnerability } from '../../types';
import { Modal } from '../common/Modal';
import { ArrowRight, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';

export interface RetestChangeOptions {
  isRetested?: boolean;
  retestNotes?: string;
  retestedDate?: string;
  retestedBy?: string;
  retestStatus?: VulnStatus;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  vulnerability: Vulnerability | null;
  targetStatus: VulnStatus;
  onConfirm: (
    vulnId: string,
    newStatus: VulnStatus,
    note: string,
    retestOptions?: RetestChangeOptions
  ) => void;
}

const PRESET_NOTES = [
  'Fix verified and deployed to production environment.',
  'Remediation tested and confirmed in staging / QA.',
  'Compensating security controls and WAF rule implemented.',
  'False positive: Behavior verified as intentional application architecture.',
  'Risk accepted by product leadership and engineering team.',
  'Input validation and sanitization patch deployed.',
];

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  vulnerability,
  targetStatus,
  onConfirm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<VulnStatus>(targetStatus);
  const [note, setNote] = useState('');
  const [isRetestSession, setIsRetestSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(targetStatus);
    setNote(vulnerability?.statusNote || '');
    setIsRetestSession(Boolean(vulnerability?.isRetested));
    setError(null);
  }, [targetStatus, isOpen, vulnerability?.id, vulnerability?.statusNote]);

  if (!vulnerability) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide a note or reason for this status change.');
      return;
    }

    const retestData: RetestChangeOptions = isRetestSession
      ? {
          isRetested: true,
          retestNotes: note.trim(),
          retestedDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          retestedBy: 'Sanjay - Cyber Security Engineer',
          retestStatus: selectedStatus,
        }
      : {
          isRetested: false,
          retestNotes: '',
        };

    onConfirm(vulnerability.id, selectedStatus, note.trim(), retestData);
    onClose();
  };

  const getStatusBadgeClass = (status: VulnStatus) => {
    switch (status) {
      case 'Fixed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Open':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Partially Fixed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'False Positive':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Risk Accepted':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Vulnerability Status"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!note.trim()}
            className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Update Status & Add Note</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vulnerability Summary Card */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
              {vulnerability.id}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Target: <span className="text-slate-800 font-semibold">{vulnerability.endpoint}</span>
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm leading-snug">
            {vulnerability.name}
          </h4>
        </div>

        {/* Status Transition Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Current Status:</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusBadgeClass(vulnerability.status)}`}>
              ● {vulnerability.status}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">New Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as VulnStatus)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-primary-300 bg-primary-50 text-primary-900 focus:outline-hidden focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="Open">● Open</option>
              <option value="Fixed">● Fixed</option>
              <option value="Partially Fixed">● Partially Fixed</option>
              <option value="False Positive">● False Positive</option>
              <option value="Risk Accepted">● Risk Accepted</option>
            </select>
          </div>
        </div>

        {/* Note / Remediation Remarks Input */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Status Change Note / Remediation Remarks <span className="text-red-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            Explain what actions were taken or the rationale for this status change. This note will be recorded and attached to the vulnerability in the assessment report.
          </p>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Verified by QA: Input validation filter implemented on endpoint. Retesting confirmed payload is safely rejected."
            className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white placeholder-slate-400"
          />

          {error && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </p>
          )}

          {/* Preset Quick Notes */}
          <div className="mt-2.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Quick Note Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NOTES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNote(preset);
                    if (error) setError(null);
                  }}
                  className="text-[10px] text-left px-2 py-1 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 border border-slate-200 rounded text-slate-600 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Retest Session Toggle */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRetestSession}
              onChange={(e) => setIsRetestSession(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Include in PDF Export as Formal Retest Session (Optional)
              </span>
              <span className="text-[11px] text-slate-600 block leading-normal">
                Status notes are always visible on your workspace preview page and excluded from PDF export. Check this only if you want a formal "Retest Notes / Session" block in the printed PDF.
              </span>
            </div>
          </label>
        </div>

        {/* Report Sync Notification Notice */}
        <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Workspace Preview:</strong> Status notes appear immediately in your report preview under findings. They remain hidden during Print / Save PDF.
          </span>
        </div>
      </form>
    </Modal>
  );
};

