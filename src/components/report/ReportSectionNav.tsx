import React from 'react';
import { FileText, Award, BarChart3, ShieldAlert, ChevronRight } from 'lucide-react';
import { Vulnerability } from '../../types';

interface ReportSectionNavProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  vulnerabilities: Vulnerability[];
}

export const ReportSectionNav: React.FC<ReportSectionNavProps> = ({
  activeSection,
  onSectionClick,
  vulnerabilities,
}) => {
  const mainSections = [
    { id: 'sec-doc-info', label: 'Document Information', icon: FileText },
    { id: 'sec-exec-summary', label: 'Executive Summary', icon: Award },
    { id: 'sec-findings-summary', label: 'Summary of Findings', icon: BarChart3 },
    { id: 'sec-detailed-findings', label: 'Detailed Findings', icon: ShieldAlert },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-full min-h-0">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex-shrink-0">
        Report Sections
      </h3>

      <div className="space-y-1 flex-shrink-0">
        {mainSections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onSectionClick(sec.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                <span className="truncate">{sec.label}</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : 'text-slate-300'}`}
              />
            </button>
          );
        })}
      </div>

      {/* Sub-navigation for individual vulnerabilities */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col flex-1 min-h-0">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex-shrink-0">
          Findings Index ({vulnerabilities.length})
        </h4>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {vulnerabilities.map((v, i) => {
            const findingId = `finding-${i + 1}`;
            const isActive =
              activeSection === findingId ||
              activeSection === `vuln-finding-${i + 1}` ||
              activeSection === `vuln-${v.id}`;
            return (
              <button
                key={v.id || i}
                onClick={() => onSectionClick(findingId)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left transition-colors truncate cursor-pointer ${
                  isActive
                    ? 'bg-primary-100/70 text-primary-800 font-bold border border-primary-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={`Click to view details of: ${v.name}`}
              >
                <span className="font-mono text-[10px] text-slate-400 flex-shrink-0 font-bold">
                  {i + 1}.
                </span>
                <span className="truncate">{v.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

