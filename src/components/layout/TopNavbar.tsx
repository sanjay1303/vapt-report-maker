import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronRight,
  UserCheck,
  FolderKanban,
  FileText,
  ShieldAlert,
  X,
  ExternalLink,
  Database,
  Cloud,
  LogOut,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Settings } from '../../types';
import { storage } from '../../services/storage';
import { cloudDb, CloudDbConfig } from '../../services/cloudDb';
import { NavTab } from './Sidebar';

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  settings: Settings;
  onProfileClick?: () => void;
  onNavigate?: (tab: NavTab, params?: any) => void;
  onLogout?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  title,
  subtitle,
  breadcrumbs,
  searchQuery = '',
  onSearchChange,
  settings,
  onProfileClick,
  onNavigate,
  onLogout,
}) => {
  const [isOpenResults, setIsOpenResults] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudDbConfig>(() => cloudDb.getConfig());
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return cloudDb.subscribe(setCloudConfig);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpenResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const projects = storage.getProjects();
  const reports = storage.getReports();
  const allVulns = [
    ...storage.getGlobalVulnerabilities(),
    ...reports.flatMap((r) => r.vulnerabilities || []),
  ];

  const query = searchQuery.trim().toLowerCase();

  const matchingProjects = query
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingReports = query
    ? reports.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query) ||
          r.projectName.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingVulns = query
    ? allVulns.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.id.toLowerCase().includes(query) ||
          v.endpoint.toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const hasResults =
    matchingProjects.length > 0 || matchingReports.length > 0 || matchingVulns.length > 0;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between shadow-xs print:hidden">
      {/* Breadcrumb Path (removes duplicate page heading) */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="font-semibold text-slate-400 hidden sm:inline">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
        {breadcrumbs &&
          breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-slate-500 hover:text-primary-600 transition-colors font-medium truncate max-w-[120px]"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-500 font-medium truncate max-w-[120px]">
                  {crumb.label}
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </React.Fragment>
          ))}
        <span className="font-bold text-slate-800 truncate">{title}</span>
      </div>

      {/* Right Controls: Search, Notification, Profile */}
      <div className="flex items-center gap-4">
        {/* Global Instant Search input */}
        <div ref={searchRef} className="relative hidden md:block w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, reports, vulns..."
            value={searchQuery}
            onFocus={() => setIsOpenResults(true)}
            onChange={(e) => {
              onSearchChange?.(e.target.value);
              setIsOpenResults(true);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange?.('');
                setIsOpenResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Search Overlay Dropdown */}
          {isOpenResults && query.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {hasResults ? (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
                  {/* Projects */}
                  {matchingProjects.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-primary-600" /> Projects
                      </div>
                      {matchingProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setIsOpenResults(false);
                            onNavigate?.('project-details', { projectId: p.id });
                          }}
                          className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-primary-600">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {p.code} • {p.client}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            View →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reports */}
                  {matchingReports.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Reports
                      </div>
                      {matchingReports.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsOpenResults(false);
                            onNavigate?.('detailed-report', { reportId: r.id });
                          }}
                          className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-primary-600">
                              {r.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {r.id} • {r.status}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Open →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vulnerabilities */}
                  {matchingVulns.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Findings
                      </div>
                      {matchingVulns.map((v, i) => (
                        <div
                          key={`${v.id}-${i}`}
                          onClick={() => {
                            setIsOpenResults(false);
                            onNavigate?.('vulnerabilities');
                          }}
                          className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 group-hover:text-primary-600 truncate">
                              {v.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {v.id} • {v.severity} • {v.endpoint}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Inspect →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching projects, reports, or findings for "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cloud Database Pill */}
        <button
          type="button"
          onClick={() => onNavigate?.('settings', { tab: 'data' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            cloudConfig.status === 'connected'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
              : cloudConfig.status === 'needs_grant'
              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-2xs'
              : cloudConfig.status === 'connecting'
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title={cloudConfig.statusMessage}
        >
          {cloudConfig.status === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Cloud DB: Connected</span>
            </>
          ) : cloudConfig.status === 'needs_grant' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Supabase: Permission Needed</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                Fix SQL
              </span>
            </>
          ) : cloudConfig.status === 'connecting' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span className="hidden sm:inline text-blue-700">Connecting DB...</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline text-slate-600">Local Mode</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all select-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-xs ring-2 ring-primary-100">
              {settings.userName.charAt(0) || 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                {settings.userName}
                <UserCheck className="w-3.5 h-3.5 text-primary-600 inline" />
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">{settings.userRole}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{settings.userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{settings.userEmail || 'sanjay.cybersec@secureshield.io'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700">
                  {settings.userRole}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onProfileClick?.();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>Profile & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate?.('settings', { tab: 'data' });
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Cloud Database</span>
                </button>
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
