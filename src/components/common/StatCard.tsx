import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
            {trend && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

