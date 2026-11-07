import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  ShieldAlert,
  FileText,
  FilePlus,
  LayoutTemplate,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'projects'
  | 'project-details'
  | 'vulnerabilities'
  | 'reports'
  | 'create-report'
  | 'detailed-report'
  | 'templates'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openReportsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'create-report', label: 'Create Report', icon: FilePlus },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isCurrentActive = (id: string) => {
    if (id === currentTab) return true;
    if (id === 'projects' && currentTab === 'project-details') return true;
    if (id === 'reports' && currentTab === 'detailed-report') return true;
    return false;
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#1b152b] text-slate-300 flex flex-col z-30 border-r border-[#261f3d] select-none transition-all duration-300 print:hidden">
      {/* Brand Header */}
      <div className="h-18 flex items-center px-6 gap-3 border-b border-[#292243]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-900/40 ring-1 ring-white/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-wide leading-tight">
            VAPT
          </h1>
          <p className="text-[11px] font-medium text-primary-300 tracking-wider uppercase">
            Report Maker
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrentActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavTab)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group text-left ${
                active
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-700/30'
                  : 'text-slate-300 hover:bg-[#251e3b] hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-primary-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile or Version info */}
      <div className="p-4 border-t border-[#292243] bg-[#171226]/80">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#201836] border border-[#2e234c]">
          <div className="w-8 h-8 rounded-lg bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-primary-300 text-xs font-bold">
            v2.4
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Enterprise Edition</p>
            <p className="text-[10px] text-slate-400 truncate">ISO 27001 & OWASP</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

