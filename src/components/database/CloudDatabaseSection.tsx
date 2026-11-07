import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ShieldCheck,
  Zap,
  Code,
  Check,
} from 'lucide-react';
import { cloudDb, CloudDbConfig, normalizeSupabaseUrl } from '../../services/cloudDb';
import { storage } from '../../services/storage';

interface CloudDatabaseSectionProps {
  onDataChanged?: () => void;
}

export const CloudDatabaseSection: React.FC<CloudDatabaseSectionProps> = ({ onDataChanged }) => {
  const [config, setConfig] = useState<CloudDbConfig>(() => cloudDb.getConfig());
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [autoSync, setAutoSync] = useState(config.autoSync);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; needsGrant?: boolean } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  useEffect(() => {
    const unsubscribe = cloudDb.subscribe((newConfig) => {
      setConfig(newConfig);
      setUrl(newConfig.url);
      setAnonKey(newConfig.anonKey);
      setAutoSync(newConfig.autoSync);
    });
    return unsubscribe;
  }, []);

  const handleTestAndConnect = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncResult(null);

    const cleanUrl = normalizeSupabaseUrl(url);
    setUrl(cleanUrl);
    const res = await cloudDb.testConnection(cleanUrl, anonKey.trim());
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      cloudDb.saveConfig({
        url: cleanUrl,
        anonKey: anonKey.trim(),
        autoSync,
        isConnected: true,
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect cloud database and switch back to Local Storage mode? Your local data will not be lost.')) {
      cloudDb.saveConfig({
        url: '',
        anonKey: '',
        isConnected: false,
      });
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      setSyncResult(null);
      setPullResult(null);
    }
  };

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setSyncResult(null);

    const res = await storage.syncToCloud();
    setSyncing(false);
    setSyncResult(res);
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm('Pulling from cloud database will merge/replace your local workspace with the cloud version. Continue?')) {
      return;
    }
    setPulling(true);
    setPullResult(null);

    const res = await storage.pullFromCloud();
    setPulling(false);
    setPullResult(res);
    if (res.success) {
      onDataChanged?.();
    }
  };

  const handleCopySql = () => {
    const sql = cloudDb.getSqlSetupScript();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          config.isConnected
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-xs'
            : 'bg-gradient-to-r from-purple-50 via-slate-50 to-white border-purple-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                config.isConnected
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-primary-600 text-white shadow-primary-200'
              }`}
            >
              {config.isConnected ? <Cloud className="w-6 h-6" /> : <Database className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {config.isConnected ? 'Supabase Cloud Database Connected' : 'Local Storage Mode (Offline)'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    config.isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {config.isConnected ? 'Live Cloud' : 'Local Only'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {config.isConnected
                  ? `Connected to ${config.url}. All assessment reports, findings, and modules sync automatically.`
                  : 'Connect a free PostgreSQL database from Supabase in 2 minutes to sync your reports across devices and teams.'}
              </p>
            </div>
          </div>

          {config.isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Disconnect Cloud
            </button>
          )}
        </div>
      </div>

      {/* Cloud Configuration Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-600" />
            <span>Supabase Cloud DB Credentials</span>
          </h4>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Get Free Supabase DB</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Found in your Supabase project under: <strong>Project Settings → API → Project URL</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Supabase Anon Public Key (Safe for Client)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Found in your Supabase project under: <strong>Project Settings → API → Project API Keys → `anon` public</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={(e) => {
                setAutoSync(e.target.checked);
                cloudDb.saveConfig({ autoSync: e.target.checked });
              }}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="autoSync" className="text-xs font-medium text-slate-700 cursor-pointer">
              Enable Auto-Sync (Automatically upload reports, findings, and project edits to cloud in background)
            </label>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-lg text-xs space-y-2.5 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed font-medium">{testResult.message}</div>
            </div>

            {testResult.needsGrant && (
              <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-700 font-medium">
                  One-time action: Run permission grant SQL in Supabase SQL editor:
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied Grant SQL!' : 'Copy Grant SQL'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestAndConnect}
            disabled={testing || !url.trim() || !anonKey.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Connection...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Test & Save Connection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cloud Sync Actions (When Connected) */}
      {config.isConnected && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Workspace Cloud Synchronization</span>
            </h4>
            {config.lastSync && (
              <span className="text-[11px] text-slate-400">
                Last synced at: <strong className="text-slate-600">{config.lastSync}</strong>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Push your local assessments, projects, and findings up to Supabase, or pull down cloud changes from other devices.
          </p>

          {syncResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                syncResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncResult.message}</span>
            </div>
          )}

          {pullResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                pullResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pullResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSyncToCloud}
              disabled={syncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing to Cloud...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Sync Local Data to Cloud DB</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={pulling}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {pulling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pulling from Cloud...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Pull Latest Data from Cloud DB</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SQL Setup Instructions & 1-Click Copy */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">1-Minute Free Supabase Setup Instructions</h4>
              <p className="text-[11px] text-slate-400">Step-by-step setup for a 100% free PostgreSQL database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL Script!' : 'Copy SQL Schema Script'}</span>
          </button>
        </div>

        <ol className="text-xs text-slate-300 space-y-2.5 list-decimal pl-4">
          <li>
            Create a free account at{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-semibold hover:underline"
            >
              supabase.com
            </a>{' '}
            (Free forever, no credit card required).
          </li>
          <li>
            Click <strong>"New Project"</strong>, choose any name (e.g., <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">vapt-db</code>) and set a database password.
          </li>
          <li>
            In the left sidebar, click <strong>"SQL Editor"</strong>, click <strong>"New Query"</strong>, paste the copied SQL script, and click <strong>"Run"</strong>.
          </li>
          <li>
            Go to <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and <strong>`anon` public key</strong>, and paste them into the fields above!
          </li>
        </ol>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSqlPreview(!showSqlPreview)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline flex items-center gap-1"
          >
            <span>{showSqlPreview ? 'Hide SQL Script Preview' : 'View SQL Script Preview'}</span>
          </button>

          {showSqlPreview && (
            <pre className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-60 leading-relaxed">
              {cloudDb.getSqlSetupScript()}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

