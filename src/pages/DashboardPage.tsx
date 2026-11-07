import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { SeverityDonutChart } from '../components/dashboard/SeverityDonutChart';
import { VulnerabilityTrendChart } from '../components/dashboard/VulnerabilityTrendChart';
import { RecentReportsTable } from '../components/dashboard/RecentReportsTable';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { storage } from '../services/storage';
import { NavTab } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [, setStorageTick] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setStorageTick((tick) => tick + 1);
    };
    window.addEventListener('vapt_vulnerability_status_changed', handleSync);
    window.addEventListener('vapt_data_changed', handleSync);
    return () => {
      window.removeEventListener('vapt_vulnerability_status_changed', handleSync);
      window.removeEventListener('vapt_data_changed', handleSync);
    };
  }, []);

  const projects = storage.getProjects();
  const reports = storage.getReports();
  const activities = storage.getActivities();

  // Aggregate stats
  const totalProjects = projects.length;
  const totalReports = reports.length;

  // Calculate unique vulnerabilities from all reports and global pool
  const uniqueVulns = storage.getAllVulnerabilities();

  const totalVulns = uniqueVulns.length;
  const openVulns = uniqueVulns.filter((v) => v.status === 'Open').length;
  const fixedVulns = uniqueVulns.filter((v) => v.status === 'Fixed').length;

  // Severity Breakdown
  const criticalCount = uniqueVulns.filter((v) => v.severity === 'Critical').length;
  const highCount = uniqueVulns.filter((v) => v.severity === 'High').length;
  const mediumCount = uniqueVulns.filter((v) => v.severity === 'Medium').length;
  const lowCount = uniqueVulns.filter((v) => v.severity === 'Low').length;
  const infoCount = uniqueVulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length;

  const severityChartData = [
    { severity: 'Critical', count: criticalCount, color: '#991b1b' },
    { severity: 'High', count: highCount, color: '#dc2626' },
    { severity: 'Medium', count: mediumCount, color: '#d97706' },
    { severity: 'Low', count: lowCount, color: '#16a34a' },
    { severity: 'Info', count: infoCount, color: '#2563eb' },
  ];

  const totalChartFindings = criticalCount + highCount + mediumCount + lowCount + infoCount;

  return (
    <div className="space-y-6">
      {/* Page Header Bar with Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time status of your penetration testing engagements and findings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
          </div>

          <button
            onClick={() => onNavigate('create-report')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* Row 1: Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
          trend={totalProjects > 0 ? { value: `${totalProjects} active`, isPositive: true } : undefined}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          title="Total Reports"
          value={totalReports}
          icon={FileText}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
          trend={totalReports > 0 ? { value: `${totalReports} total`, isPositive: true } : undefined}
          onClick={() => onNavigate('reports')}
        />
        <StatCard
          title="Total Vulnerabilities"
          value={totalChartFindings}
          icon={ShieldAlert}
          iconColor="text-primary-700"
          iconBg="bg-primary-100"
          onClick={() => onNavigate('vulnerabilities')}
        />
        <StatCard
          title="Open Vulnerabilities"
          value={openVulns}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          trend={openVulns > 0 ? { value: `${openVulns} open`, isPositive: false } : undefined}
          onClick={() => onNavigate('vulnerabilities')}
        />
        <StatCard
          title="Fixed Vulnerabilities"
          value={fixedVulns}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={
            totalChartFindings > 0
              ? { value: `${Math.round((fixedVulns / totalChartFindings) * 100)}% remediated`, isPositive: true }
              : undefined
          }
          onClick={() => onNavigate('vulnerabilities')}
        />
      </div>

      {/* Row 2: Charts Row (Donut & Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Severity Distribution Donut Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vulnerabilities by Severity</h3>
              <p className="text-xs text-slate-500">Distribution across active security findings</p>
            </div>
            <button
              onClick={() => onNavigate('vulnerabilities')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Details
            </button>
          </div>
          <SeverityDonutChart data={severityChartData} total={totalChartFindings} />
        </div>

        {/* Vulnerability Trend Line Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Vulnerability Trend</h3>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Remediations vs New Finds
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">Monthly trajectory over the past two quarters</p>
          </div>
          <VulnerabilityTrendChart />
        </div>
      </div>

      {/* Row 3: Recent Reports & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RecentReportsTable
            reports={reports}
            onViewReport={(id) => onNavigate('detailed-report', { reportId: id })}
            onViewAllReports={() => onNavigate('reports')}
          />
        </div>
        <div className="lg:col-span-4">
          <RecentActivityList
            activities={activities}
            onActivityClick={(act) => {
              if (act.type === 'report_created' && act.targetId) {
                onNavigate('detailed-report', { reportId: act.targetId });
              } else if (act.type === 'vuln_updated' || act.type === 'status_changed') {
                onNavigate('vulnerabilities');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

