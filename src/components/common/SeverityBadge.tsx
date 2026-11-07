import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  score,
  showScore = false,
  size = 'md',
}) => {
  const getStyles = () => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-700 text-white font-semibold border border-red-800';
      case 'High':
        return 'bg-red-500 text-white font-semibold border border-red-600';
      case 'Medium':
        return 'bg-amber-500 text-white font-semibold border border-amber-600';
      case 'Low':
        return 'bg-emerald-600 text-white font-semibold border border-emerald-700';
      case 'Informational':
      case 'Info':
        return 'bg-blue-600 text-white font-semibold border border-blue-700';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  const displayText = severity === 'Informational' ? 'Info' : severity;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md uppercase tracking-wider font-medium shadow-xs ${getStyles()} ${getSize()}`}
    >
      {displayText}
      {showScore && score !== undefined && (
        <span className="ml-1.5 opacity-90 font-mono text-[11px]">({score.toFixed(1)})</span>
      )}
    </span>
  );
};

