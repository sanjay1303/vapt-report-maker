import React from 'react';
import { VulnStatus, ProjectStatus, ReportStatus } from '../../types';

interface StatusBadgeProps {
  status: VulnStatus | ProjectStatus | ReportStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Open':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'Fixed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Partially Fixed':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'False Positive':
        return 'bg-slate-100 text-slate-700 border border-slate-300';
      case 'Risk Accepted':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border border-slate-300';
      case 'Planning':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'On Hold':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Open':
        return 'bg-red-500';
      case 'Fixed':
        return 'bg-emerald-500';
      case 'Partially Fixed':
        return 'bg-amber-500';
      case 'Completed':
        return 'bg-emerald-500';
      case 'In Progress':
        return 'bg-amber-500';
      case 'Draft':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${getStyles()} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`}></span>
      {status}
    </span>
  );
};

