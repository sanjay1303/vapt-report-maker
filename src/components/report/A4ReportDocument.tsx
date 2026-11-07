import React from 'react';
import { Report, Vulnerability, VulnStatus } from '../../types';
import { storage } from '../../services/storage';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface A4ReportDocumentProps {
  report: Report;
  id?: string;
  onAddVulnerability?: () => void;
  onEditVulnerability?: (vuln: Vulnerability) => void;
  onDeleteVulnerability?: (vulnId: string) => void;
  onStatusChange?: (vulnId: string, newStatus?: VulnStatus) => void;
}

export const A4ReportDocument: React.FC<A4ReportDocumentProps> = ({
  report,
  id = 'vapt-report-document',
  onAddVulnerability,
  onEditVulnerability,
  onDeleteVulnerability,
  onStatusChange,
}) => {
  const vulns = report.vulnerabilities || [];
  const settings = storage.getSettings();
  const orgName = (settings.organizationName || 'SecureShield CyberLabs').toUpperCase();

  const counts = {
    Critical: vulns.filter((v) => v.severity === 'Critical').length,
    High: vulns.filter((v) => v.severity === 'High').length,
    Medium: vulns.filter((v) => v.severity === 'Medium').length,
    Low: vulns.filter((v) => v.severity === 'Low').length,
    Info: vulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length,
  };

  const totalVulns = vulns.length;
  const clientName = report.client || 'Client';
  const reportTitle = report.name || `${report.projectName || 'filumart-qa'} – ${report.moduleName || 'seller Module'} VAPT Assessment`;
  const appName = report.applicationName || `${report.projectName || 'filumart-qa'} Platform`;
  const appUrl = report.applicationUrl || 'https://qa-seller.filumart.com/login';
  const env = report.environment || 'QA';
  const author = report.preparedBy || 'Sanjay - Cyber Security Engineer';

  const getSeverityBadgeClasses = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Info':
      case 'Informational':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const scrollToFinding = (idx: number) => {
    const el = document.getElementById(`finding-${idx}`);
    const container = document.getElementById('report-scroll-container');
    if (el && container) {
      const topOffset = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 14;
      container.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id={id} className="w-full space-y-8 print:space-y-0">
      {/* ============================================================== */}
      {/* PAGE 1: TITLE, DOCUMENT INFORMATION, EXECUTIVE SUMMARY         */}
      {/* ============================================================== */}
      <div className="a4-page flex flex-col justify-between" id="page-1">
        <div>
          {/* Document Header Title Block matching Word Export */}
          <div className="text-center mb-6 print:mb-4 pb-3 border-b-2 border-primary-600">
            <div className="text-xs sm:text-sm font-black tracking-widest text-slate-500 uppercase mb-1">
              {orgName}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight mb-1">
              Vulnerability Assessment &amp; Penetration Testing (VAPT) Report
            </h1>
            <p className="text-xs sm:text-sm font-bold text-primary-700 uppercase mb-1.5">
              {reportTitle}
            </p>
            <div className="text-[11px] text-slate-500 font-medium">
              Target Application: <strong className="text-slate-800">{appName}</strong> &nbsp;|&nbsp; Classification: <strong className="text-slate-800">{report.classification || 'Confidential'}</strong>
            </div>
          </div>

          {/* 1. Document Information */}
          <section className="mb-6 print:mb-4" id="sec-doc-info">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
              1. Document Information
            </h2>
            <div className="border border-slate-200 overflow-hidden text-xs rounded-xs">
              <table className="w-full text-left table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[70%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                    <th className="py-2 px-3 border-r border-slate-200">Parameter</th>
                    <th className="py-2 px-3">Assessment Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Organization / Client</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{clientName}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Application Name</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{appName}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Application URL / Scope</td>
                    <td className="py-2 px-3 text-primary-700 font-mono font-medium truncate">
                      <a href={appUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {appUrl}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Assessment Type</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{report.assessmentType || 'Web Application Security Assessment'}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Environment</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{env}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">Prepared By</td>
                    <td className="py-2 px-3 text-slate-900 font-medium">{author}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Executive Summary */}
          <section className="mb-6 print:mb-2" id="sec-exec-summary">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
              2. Executive Summary
            </h2>
            <div className="text-slate-700 leading-relaxed text-xs space-y-2 whitespace-pre-line">
              {report.executiveSummary ? (
                report.executiveSummary
              ) : (
                <>
                  <p>
                    A comprehensive Vulnerability Assessment and Penetration Testing (VAPT) exercise was conducted against the target environment. The primary objective was to assess the defense posture of the application, identify exploitable security vulnerabilities, and evaluate compliance with OWASP Top 10 guidelines.
                  </p>
                  <p>
                    The findings identified during the assessment tenure should be prioritized according to their CVSS severity scores to remediate the identified risks effectively.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Page 1 Running Footer */}
        <div className="pt-2.5 print:pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-auto">
          <span>CONFIDENTIAL | {clientName.toUpperCase()} VAPT REPORT</span>
          <span>Page 1</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAGE 2: 3. SUMMARY OF FINDINGS, DEFINITIONS TABLE               */}
      {/* ============================================================== */}
      <div className="a4-page flex flex-col justify-between" id="page-2">
        <div>
          {/* Section 3: Summary of Findings */}
          <section id="sec-findings-summary" className="mb-5 print:mb-3 scroll-mt-24">
            <span id="sec-summary-findings" className="sr-only" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
              3. Summary of Findings
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed mb-3">
              The Vulnerability Assessment and Penetration Testing (VAPT) conducted for the target organization yielded important findings and insights. It was observed that the application was exposed to a total of <strong className="text-slate-900">{totalVulns}</strong> security vulnerabilities during the given assessment tenure with <strong className="text-red-700 font-bold">{counts.Critical}</strong> as Critical, <strong className="text-red-600 font-bold">{counts.High}</strong> as High, <strong className="text-amber-600 font-bold">{counts.Medium}</strong> as Medium, <strong className="text-emerald-600 font-bold">{counts.Low}</strong> as Low, and <strong className="text-blue-600 font-bold">{counts.Info}</strong> as Info Severity vulnerabilities.
            </p>

            {/* Findings Table matching Word Export */}
            <div className="border border-slate-200 overflow-hidden text-xs rounded-xs mb-4">
              <table className="w-full text-left table-fixed">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[45%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="bg-purple-100/70 border-b border-slate-200 text-slate-800 font-bold">
                    <th className="py-2 px-2.5 text-center border-r border-slate-200">S. No.</th>
                    <th className="py-2 px-3 border-r border-slate-200">Vulnerability Name</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200">Severity</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200">Risk Score</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vulns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                        No vulnerabilities recorded for this assessment.
                      </td>
                    </tr>
                  ) : (
                    vulns.map((v, idx) => {
                      const isInfo = v.severity === 'Informational' || v.severity === 'Info';
                      return (
                        <tr key={v.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5 text-center font-bold text-slate-600 border-r border-slate-200">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => scrollToFinding(idx + 1)}
                              className="hover:text-primary-600 hover:underline cursor-pointer block text-center"
                              title={`Jump to Finding #${idx + 1}`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200 truncate">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => scrollToFinding(idx + 1)}
                              className="hover:text-primary-600 hover:underline cursor-pointer text-left font-semibold truncate block w-full"
                              title={`Jump to details of: ${v.name}`}
                            >
                              {v.name}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-200">
                            <span className={'px-2 py-0.5 rounded text-[11px] font-bold border ' + getSeverityBadgeClasses(v.severity)}>
                              {isInfo ? 'Info' : v.severity}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-200">
                            {v.cvssScore > 0 ? v.cvssScore.toFixed(1) : '0.0'}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-800">
                            {onStatusChange ? (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={() => onStatusChange(v.id, v.status)}
                                className="hover:underline cursor-pointer font-bold text-[11px] uppercase tracking-wide block"
                                title="Click to update status and add note"
                              >
                                {v.status}
                              </span>
                            ) : (
                              <span className="font-bold text-[11px] uppercase tracking-wide block">{v.status}</span>
                            )}
                            {v.statusNote && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5 leading-tight print:hidden print-hide" data-html2canvas-ignore="true">
                                Note: {v.statusNote}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Finding Status Definitions Table matching Word Export */}
          <section className="mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
              Finding Status Definitions
            </h3>
            <div className="border border-slate-200 overflow-hidden text-xs rounded-xs">
              <table className="w-full text-left table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[72%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                    <th className="py-1.5 px-3 border-r border-slate-200">Status</th>
                    <th className="py-1.5 px-3">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] leading-snug">
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Open</td>
                    <td className="py-1.5 px-3 text-slate-700">Finding is confirmed and remediation is pending.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Fixed</td>
                    <td className="py-1.5 px-3 text-slate-700">Remediation has been implemented and verified during retesting.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Partially Fixed</td>
                    <td className="py-1.5 px-3 text-slate-700">Some but not all aspects of the finding have been resolved.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Risk Accepted</td>
                    <td className="py-1.5 px-3 text-slate-700">An authorized risk owner has formally accepted the documented residual risk.</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200">Not Reproducible</td>
                    <td className="py-1.5 px-3 text-slate-700">The original issue could not be reproduced under the retest conditions.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Page 2 Running Footer */}
        <div className="pt-2.5 print:pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-auto">
          <span>CONFIDENTIAL | {clientName.toUpperCase()} VAPT REPORT</span>
          <span>Page 2</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PAGE 3+: 4. DETAILED VULNERABILITY FINDINGS (Continuous Flow)  */}
      {/* ============================================================== */}
      <div className="a4-page a4-page-continuous flex flex-col justify-between" id="page-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-primary-600">
            4. Detailed Vulnerability Findings
          </h2>
          <span id="sec-detailed-findings" className="sr-only" />

          {vulns.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/70 rounded border border-dashed border-slate-300 space-y-3">
              <p className="text-xs text-slate-500">
                No detailed vulnerabilities recorded in this assessment yet.
              </p>
              {onAddVulnerability && (
                <button
                  type="button"
                  onClick={onAddVulnerability}
                  className="print-hide inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-bold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Vulnerability</span>
                </button>
              )}
            </div>
          ) : (
            vulns.map((v, index) => {
              const findingNum = index + 1;
              const findingId = `finding-${findingNum}`;
              const isInfo = v.severity === 'Informational' || v.severity === 'Info';

              return (
                <div
                  key={v.id || index}
                  id={findingId}
                  className="vulnerability-finding-block pb-6 mb-6 border-b border-slate-300 break-inside-avoid page-break-inside-avoid"
                >
                  <span id={`vuln-finding-${findingNum}`} className="sr-only" />
                  <span id={`vuln-${v.id}`} className="sr-only" />

                  {/* Finding Title matching Word export: e.g. "1. efg" */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-purple-900 tracking-tight">
                      {findingNum}. {v.name}
                    </h3>
                    <div className="print-hide flex items-center gap-1.5">
                      {onEditVulnerability && (
                        <button
                          type="button"
                          onClick={() => onEditVulnerability(v)}
                          className="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Edit finding"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onStatusChange && (
                        <button
                          type="button"
                          onClick={() => onStatusChange(v.id, v.status)}
                          className="text-[10px] font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded px-2 py-0.5 transition-colors"
                          title="Change status or add note"
                        >
                          Status
                        </button>
                      )}
                      {onDeleteVulnerability && (
                        <button
                          type="button"
                          onClick={() => onDeleteVulnerability(v.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete finding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Table matching doc file */}
                  <div className="border border-slate-300 overflow-hidden text-xs rounded-xs mb-3">
                    <table className="w-full text-left table-fixed">
                      <colgroup>
                        <col className="w-[35%]" />
                        <col className="w-[65%]" />
                      </colgroup>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">
                            Severity: <span className="font-bold">{isInfo ? 'Info' : v.severity} ({v.cvssScore > 0 ? v.cvssScore.toFixed(1) : '0.0'})</span>
                          </td>
                          <td className="py-2 px-3 text-slate-800 break-all">
                            <strong>CVSS v3.1 Vector: </strong>
                            <span className="font-mono text-[11px]">{v.cvssVector || 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N'}</span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="py-2 px-3 text-slate-800 break-all">
                            <strong>Affected Endpoint: </strong>
                            <span className="font-mono text-[11px]">{v.endpoint || 'N/A'}</span>{' '}
                            <strong className="font-bold text-slate-900">[{ (v.endpointStatus || 'OPEN').toUpperCase() }]</strong>
                          </td>
                        </tr>
                        {(v.statusNote || (v.statusNotes && v.statusNotes.length > 0)) && (
                          <tr className="bg-amber-50/80 print:hidden print-hide" data-html2canvas-ignore="true">
                            <td colSpan={2} className="py-2 px-3 text-slate-800">
                              <strong className="text-amber-800 font-bold">Status &amp; Remediation Note: </strong>
                              <span className="text-slate-800">{v.statusNote || v.statusNotes?.[0]?.note}</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Description */}
                  <div className="mb-2.5">
                    <div className="text-xs font-bold text-slate-700 mb-0.5">Description:</div>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line pl-0.5">
                      {v.description || 'N/A'}
                    </p>
                  </div>

                  {/* Impact */}
                  <div className="mb-2.5">
                    <div className="text-xs font-bold text-red-800 mb-0.5">Impact:</div>
                    {v.impact && v.impact.length > 0 && v.impact[0] ? (
                      <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5 leading-relaxed pl-1">
                        {v.impact.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-700 pl-1">• Potential security exposure.</p>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="mb-2.5">
                    <div className="text-xs font-bold text-emerald-800 mb-0.5">Recommendations:</div>
                    {v.recommendations && v.recommendations.length > 0 && v.recommendations[0] ? (
                      <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5 leading-relaxed pl-1">
                        {v.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-700 pl-1">• Remediate according to security guidelines.</p>
                    )}
                  </div>

                  {/* Proof of Concept (POC) */}
                  <div className="mb-2.5">
                    <div className="text-xs font-bold text-slate-900 mb-1">Proof of Concept (POC):</div>
                    <div className="text-xs text-slate-800 space-y-1 leading-relaxed pl-0.5">
                      <p>
                        <strong>Preconditions: </strong>
                        <span>{v.preconditions || '[Required test role, account, and setup.]'}</span>
                      </p>
                      <div>
                        <strong className="block mb-0.5">Reproduction steps:</strong>
                        {v.stepsToReproduce ? (
                          <p className="whitespace-pre-line text-xs text-slate-800 pl-2 border-l-2 border-slate-300">
                            {v.stepsToReproduce}
                          </p>
                        ) : (
                          <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11.5px] text-slate-600">
                            <li>[Establish a baseline request using an authorized test account.]</li>
                            <li>[Modify only the relevant parameter, identifier, header, or workflow step.]</li>
                            <li>[Replay the request in the approved test environment.]</li>
                            <li>[Record the response and demonstrate the security impact using test data.]</li>
                          </ol>
                        )}
                      </div>
                      <p>
                        <strong>Evidence references: </strong>
                        <span>{v.evidenceReferences || '[Screenshot names, sanitized request/response files, timestamps, and test account role.]'}</span>
                      </p>

                      {/* Render Evidence Items if available */}
                      {v.evidence && v.evidence.length > 0 && (
                        <div className="space-y-2 mt-2 pt-1">
                          {v.evidence.map((ev) => (
                            <div key={ev.id} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                              <span className="font-bold text-slate-800 block mb-1">
                                Evidence: {ev.title} ({ev.type})
                              </span>
                              {ev.type === 'screenshot' ? (
                                <img
                                  src={ev.content}
                                  alt={ev.title}
                                  className="max-h-64 rounded border border-slate-200 object-contain mx-auto"
                                />
                              ) : (
                                <pre className="p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded overflow-x-auto whitespace-pre-wrap">
                                  {ev.content}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Retest Notes / Session */}
                  {(v.isRetested || (v.retestNotes && v.retestNotes.trim().length > 0)) && (
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      <div className="text-xs font-bold text-slate-900 mb-0.5">
                        Retest Notes / Session ({v.retestedDate || 'Verified'}):
                      </div>
                      <div className="bg-emerald-50/70 p-2 rounded border border-emerald-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                        {v.retestNotes}
                      </div>
                    </div>
                  )}

                  {/* Divider matching doc file: _________________________________________________ */}
                  <div className="w-full border-b border-slate-300 mt-6 pt-2" />
                </div>
              );
            })
          )}
        </div>

        {/* Continuous Footer */}
        <div className="pt-2.5 print:pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-6">
          <span>CONFIDENTIAL | {clientName.toUpperCase()} VAPT REPORT</span>
          <span>Detailed Findings</span>
        </div>
      </div>
    </div>
  );
};
