import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Building,
  User,
  Palette,
  FileText,
  Shield,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Database,
  Cloud,
  AlertTriangle,
} from 'lucide-react';
import { Settings, Severity } from '../types';
import { storage } from '../services/storage';
import { CloudDatabaseSection } from '../components/database/CloudDatabaseSection';

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onClearAllData?: () => void;
  onLoadSampleData?: () => void;
  onResetData: () => void;
  initialTab?: 'organization' | 'branding' | 'defaults' | 'templates' | 'database' | 'data';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
  onLoadSampleData,
  onResetData,
  initialTab = 'organization',
}) => {
  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'organization' | 'branding' | 'defaults' | 'templates' | 'database' | 'data'>(initialTab);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, companyLogo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSeverityColorChange = (sev: Severity, color: string) => {
    setFormData({
      ...formData,
      severityColors: {
        ...formData.severityColors,
        [sev]: color,
      },
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(formData);
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        '⚠️ Are you sure you want to DELETE ALL DATA? This will permanently wipe all projects, reports, vulnerabilities, modules, and audit activities from local storage.'
      )
    ) {
      if (onClearAllData) {
        onClearAllData();
      } else {
        storage.clearAllData();
        window.location.reload();
      }
    }
  };

  const handleLoadSample = () => {
    if (
      window.confirm(
        'Load standard sample data (Filumart assessment with 10 modules, reports, and findings)?'
      )
    ) {
      if (onLoadSampleData) {
        onLoadSampleData();
      } else {
        storage.loadSampleData();
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500">
            Configure organization branding, default scoring vectors, and report footers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            title="Permanently wipe all workspace data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Data</span>
          </button>

          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Restore sample demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs shadow-primary-600/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All system settings and report brandings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-6 pt-4 gap-6 text-xs font-bold text-slate-500 overflow-x-auto">
          {[
            { id: 'organization', label: 'Organization & Profile', icon: Building },
            { id: 'branding', label: 'Report Branding & Colors', icon: Palette },
            { id: 'defaults', label: 'Assessment Defaults', icon: Shield },
            { id: 'templates', label: 'Legal & Disclaimers', icon: FileText },
            { id: 'database', label: 'Free Cloud DB', icon: Cloud },
            { id: 'data', label: 'Data Management', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Organization & Profile */}
        {activeTab === 'organization' && (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Auditor / Engineer Name
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Professional Title / Role
                </label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Company Logo Upload */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Company / Organization Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {formData.companyLogo ? (
                    <img
                      src={formData.companyLogo}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <label className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-slate-500" /> Upload New Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Report Branding & Colors */}
        {activeTab === 'branding' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.reportBrandingColor}
                  onChange={(e) =>
                    setFormData({ ...formData, reportBrandingColor: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs font-bold text-slate-700">
                  {formData.reportBrandingColor}
                </span>
                <span className="text-xs text-slate-400">
                  Applied to cover titles, active buttons, and document highlights.
                </span>
              </div>
            </div>

            {/* Severity Colors */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Severity Level Colors
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[]).map((sev) => (
                  <div
                    key={sev}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-700">{sev === 'Informational' ? 'Info' : sev}</span>
                    <input
                      type="color"
                      value={formData.severityColors[sev]}
                      onChange={(e) => handleSeverityColorChange(sev, e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Defaults */}
        {activeTab === 'defaults' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Report Version
                </label>
                <input
                  type="text"
                  value={formData.defaultReportVersion}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultReportVersion: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default CVSS Specification
                </label>
                <select
                  value={formData.defaultCvssVersion}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultCvssVersion: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
                >
                  <option value="CVSS v3.1">CVSS v3.1 (Current Standard)</option>
                  <option value="CVSS v4.0">CVSS v4.0</option>
                  <option value="CVSS v2.0">CVSS v2.0 (Legacy)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Legal & Disclaimers */}
        {activeTab === 'templates' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Report Footer Text
              </label>
              <input
                type="text"
                value={formData.reportFooter}
                onChange={(e) => setFormData({ ...formData, reportFooter: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confidentiality Notice
              </label>
              <textarea
                rows={4}
                value={formData.confidentialityNotice}
                onChange={(e) =>
                  setFormData({ ...formData, confidentialityNotice: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg leading-relaxed text-slate-700"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Cloud Database */}
        {activeTab === 'database' && (
          <div className="p-6">
            <CloudDatabaseSection onDataChanged={onLoadSampleData} />
          </div>
        )}

        {/* Tab 6: Data Management */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Danger Zone — Delete All Data</h4>
                  <p className="text-xs text-red-700 mt-1">
                    Permanently delete all projects, modules, vulnerabilities, reports, and activity logs from local storage.
                    This will clean and reset your application into a completely empty state.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Workspace Data</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Demo Dataset — Load Sample Data</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Restore the preconfigured Filumart sample project, 10 modules, 5 sample reports, and realistic vulnerability findings for demonstrations.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Sample Demo Dataset</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

