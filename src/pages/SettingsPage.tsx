import React, { useState, useEffect } from 'react';
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
  Copy,
  RefreshCw,
  Check,
  ExternalLink,
  DownloadCloud,
} from 'lucide-react';
import { Settings, Severity } from '../types';
import { storage } from '../services/storage';
import { cloudDb, CloudDbConfig } from '../services/cloudDb';

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  onClearAllData?: () => void;
  onLoadSampleData?: () => void;
  onResetData: () => void;
  initialTab?: 'organization' | 'branding' | 'defaults' | 'templates' | 'data' | string;
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
  const [activeTab, setActiveTab] = useState<'organization' | 'branding' | 'defaults' | 'templates' | 'data'>(
    initialTab === 'database' ? 'data' : (initialTab as any) || 'organization'
  );

  // Cloud Database state (controlled via .env)
  const [cloudConfig, setCloudConfig] = useState<CloudDbConfig>(() => cloudDb.getConfig());
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    return cloudDb.subscribe(setCloudConfig);
  }, []);

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
        'Are you sure you want to delete ALL data? This will clear all projects, modules, vulnerabilities, and reports. This cannot be undone.'
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
        'Restore the sample demo dataset? This will load demo projects, modules, and vulnerability findings.'
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

  const handleVerifyDb = async () => {
    setIsVerifying(true);
    setDbStatusMsg(null);
    const res = await cloudDb.checkConnection();
    setIsVerifying(false);
    if (res.success) {
      setDbStatusMsg({ type: 'success', text: res.message });
      await storage.pullFromCloud();
    } else {
      setDbStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setDbStatusMsg(null);
    const res = await storage.syncToCloud();
    setIsSyncing(false);
    if (res.success) {
      setDbStatusMsg({ type: 'success', text: res.message });
    } else {
      setDbStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handlePullFromCloud = async () => {
    setIsPulling(true);
    setDbStatusMsg(null);
    const res = await storage.pullFromCloud();
    setIsPulling(false);
    if (res.success) {
      setDbStatusMsg({ type: 'success', text: res.message });
      onLoadSampleData?.();
    } else {
      setDbStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(cloudDb.getSqlSetupScript());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure organization branding, default scoring vectors, and report footers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Data</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
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
            { id: 'data', label: 'Data Management & Cloud DB', icon: Database },
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
                  Organization / Lab Name
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.companyLogo ? (
                    <img
                      src={formData.companyLogo}
                      alt="Logo preview"
                      className="h-10 w-auto max-w-[120px] object-contain rounded border border-slate-200 p-1 bg-white"
                    />
                  ) : (
                    <div className="h-10 w-24 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                      No Logo
                    </div>
                  )}
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.companyLogo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, companyLogo: '' })}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Engineer Name
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Engineer Role / Title
                </label>
                <input
                  type="text"
                  value={formData.userRole}
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                />
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Report Branding & Colors */}
        {activeTab === 'branding' && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.reportBrandingColor}
                  onChange={(e) =>
                    setFormData({ ...formData, reportBrandingColor: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={formData.reportBrandingColor}
                  onChange={(e) =>
                    setFormData({ ...formData, reportBrandingColor: e.target.value })
                  }
                  className="w-32 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-slate-700"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Severity Score Colors
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(['Critical', 'High', 'Medium', 'Low', 'Informational'] as Severity[]).map(
                  (sev) => (
                    <div
                      key={sev}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-800">{sev}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.severityColors[sev]}
                          onChange={(e) => handleSeverityColorChange(sev, e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border border-slate-300 p-0"
                        />
                        <span className="text-[11px] font-mono text-slate-500">
                          {formData.severityColors[sev]}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Assessment Defaults */}
        {activeTab === 'defaults' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default CVSS Standard
                </label>
                <select
                  value={formData.defaultCvssVersion}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultCvssVersion: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="CVSS v3.1">CVSS v3.1 (Recommended)</option>
                  <option value="CVSS v4.0">CVSS v4.0</option>
                  <option value="CVSS v2.0">CVSS v2.0</option>
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
                Report Confidentiality Footer Text
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

        {/* Tab 5: Data Management & Cloud DB (Environment Controlled) */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-6">
            {/* Cloud Database (Supabase) Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Supabase Cloud Database</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Configured in .env
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{cloudConfig.url}</p>
                  </div>
                </div>

                <div>
                  {cloudConfig.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live & Connected
                    </span>
                  ) : cloudConfig.status === 'needs_grant' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Permission Required (42501)
                    </span>
                  ) : cloudConfig.status === 'connecting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      Checking Connection...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                      Connection Error
                    </span>
                  )}
                </div>
              </div>

              {/* Status Message / Notification */}
              {dbStatusMsg && (
                <div
                  className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
                    dbStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : dbStatusMsg.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {dbStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{dbStatusMsg.text}</span>
                </div>
              )}

              {/* Notice when Permission Grant is needed */}
              {cloudConfig.status === 'needs_grant' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 space-y-1">
                      <p className="font-bold">Supabase PostgreSQL Permission Grant Required (Error 42501)</p>
                      <p className="text-amber-800 leading-relaxed">
                        Your Supabase project is reachable, but PostgreSQL blocks the public <code>anon</code> role from reading and writing tables.
                        Run the 1-step Grant SQL command in your Supabase SQL Editor to grant instant access.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSql ? 'Copied Grant SQL!' : 'Copy Grant SQL Command'}</span>
                    </button>
                    <a
                      href="https://supabase.com/dashboard/project/iupuipgnwvmrcpojopao/sql"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Supabase SQL Editor</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyDb}
                    disabled={isVerifying}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Verifying...' : 'Verify Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToCloud}
                    disabled={isSyncing}
                    className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Syncing to Cloud...' : 'Sync Local to Cloud'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullFromCloud}
                    disabled={isPulling}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-4 h-4 text-slate-500 ${isPulling ? 'animate-bounce' : ''}`} />
                    <span>{isPulling ? 'Pulling...' : 'Pull from Cloud'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  Last cloud sync: <span className="font-semibold text-slate-600">{cloudConfig.lastSync || 'Never'}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                🔒 Database credentials are fixed securely from <code>.env</code> (<code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_ANON_KEY</code>). Manual credential forms have been removed.
              </div>
            </div>

            {/* Demo Dataset */}
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

            {/* Danger Zone */}
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
          </div>
        )}
      </div>
    </div>
  );
};
