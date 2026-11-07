import React from 'react';
import { Activity } from '../../types';
import { ShieldCheck, FileCheck, RefreshCw, FolderPlus } from 'lucide-react';

interface RecentActivityListProps {
  activities: Activity[];
  onActivityClick?: (act: Activity) => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onActivityClick,
}) => {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'status_changed':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600" />;
      case 'report_created':
        return <FileCheck className="w-3.5 h-3.5 text-primary-600" />;
      case 'vuln_updated':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'project_added':
        return <FolderPlus className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getIconBg = (type: Activity['type']) => {
    switch (type) {
      case 'status_changed':
        return 'bg-amber-100';
      case 'report_created':
        return 'bg-primary-100';
      case 'vuln_updated':
        return 'bg-emerald-100';
      case 'project_added':
        return 'bg-blue-100';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Recent Activities</h3>
        <p className="text-xs text-slate-500">Audit trail of actions and finding modifications</p>
      </div>

      <div className="p-4 space-y-3.5">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No recent activity recorded.
          </div>
        ) : (
          activities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              onClick={() => onActivityClick?.(act)}
              className="flex items-start gap-3 text-xs hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(
                  act.type
                )}`}
              >
                {getIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 leading-snug truncate">{act.title}</p>
                <p className="text-slate-500 text-[11px] truncate">{act.description}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                {act.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

