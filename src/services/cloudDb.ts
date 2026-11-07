import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Module, Vulnerability, Report, Settings } from '../types';

export interface CloudDbConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
  isConnected: boolean;
  lastSync?: string;
  provider: 'supabase';
}

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  return url;
}

const CONFIG_STORAGE_KEY = 'vapt_cloud_db_config_v1';
const DEFAULT_SUPABASE_URL = 'https://iupuipgnwvmrcpojopao.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_lkbMejvGQs1H_LMFFN7d0w_CeKm3nyx';

class CloudDbService {
  private client: SupabaseClient | null = null;
  private config: CloudDbConfig = {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_KEY,
    autoSync: true,
    isConnected: true,
    provider: 'supabase',
  };
  private listeners: Array<(config: CloudDbConfig) => void> = [];

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read cloud db config from localStorage', e);
    }

    // Check environment variables as fallback
    const metaEnv = (import.meta as any).env || {};
    const envUrl = metaEnv.VITE_SUPABASE_URL;
    const envKey = metaEnv.VITE_SUPABASE_ANON_KEY;

    if (!this.config.url) {
      this.config.url = envUrl || DEFAULT_SUPABASE_URL;
    }
    if (!this.config.anonKey) {
      this.config.anonKey = envKey || DEFAULT_SUPABASE_KEY;
    }

    this.config.url = normalizeSupabaseUrl(this.config.url);

    if (this.config.url && this.config.anonKey) {
      this.initClient(this.config.url, this.config.anonKey);
    }
  }

  private initClient(rawUrl: string, anonKey: string) {
    try {
      const url = normalizeSupabaseUrl(rawUrl);
      if (url && anonKey && url.startsWith('http')) {
        this.client = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } else {
        this.client = null;
      }
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      this.client = null;
    }
  }

  public getConfig(): CloudDbConfig {
    return { ...this.config };
  }

  public subscribe(listener: (config: CloudDbConfig) => void): () => void {
    this.listeners.push(listener);
    listener(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getConfig()));
  }

  public saveConfig(newConfig: Partial<CloudDbConfig>): void {
    if (newConfig.url) {
      newConfig.url = normalizeSupabaseUrl(newConfig.url);
    }
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save cloud db config to localStorage', e);
    }

    if (this.config.url && this.config.anonKey) {
      this.initClient(this.config.url, this.config.anonKey);
    } else {
      this.client = null;
      this.config.isConnected = false;
    }

    this.notify();
  }

  public isConfigured(): boolean {
    return Boolean(this.client && this.config.url && this.config.anonKey);
  }

  public isConnected(): boolean {
    return Boolean(this.config.isConnected && this.client);
  }

  /**
   * Test connection to Supabase instance
   */
  public async testConnection(
    urlToTest?: string,
    keyToTest?: string
  ): Promise<{ success: boolean; message: string; needsGrant?: boolean }> {
    const rawUrl = urlToTest || this.config.url;
    const url = normalizeSupabaseUrl(rawUrl);
    const key = (keyToTest || this.config.anonKey).trim();

    if (!url || !key) {
      return { success: false, message: 'Please provide both Supabase Project URL and Anon Public Key.' };
    }

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return { success: false, message: 'Supabase URL must start with https:// (e.g. https://xyz.supabase.co)' };
    }

    try {
      const testClient = createClient(url, key);

      // Try querying vapt_cloud_store table
      const { data, error } = await testClient.from('vapt_cloud_store').select('key').limit(1);

      if (error) {
        // Code 42501: Table exists, but PostgreSQL permissions need to be granted to anon
        if (error.code === '42501') {
          this.config.isConnected = true;
          this.saveConfig({ url, anonKey: key, isConnected: true });
          return {
            success: true,
            needsGrant: true,
            message:
              'Connected to Supabase! Table exists. To enable full read/write, run the Grant SQL command in your Supabase SQL Editor.',
          };
        }

        // Code 42P01: Table doesn't exist yet
        if (error.code === '42P01') {
          this.config.isConnected = true;
          this.saveConfig({ url, anonKey: key, isConnected: true });
          return {
            success: true,
            message:
              'Connected to Supabase! Database tables are not created yet. Please execute the SQL Setup Script to finish setup.',
          };
        }

        // Try checking auth endpoint as a connection health check
        const { error: authError } = await testClient.auth.getSession();
        if (!authError) {
          this.config.isConnected = true;
          this.saveConfig({ url, anonKey: key, isConnected: true });
          return {
            success: true,
            message:
              'Connected to Supabase project! Please execute the SQL setup script in your Supabase SQL editor to create the tables.',
          };
        }

        return { success: false, message: `Connection failed: ${error.message || 'Check your credentials.'}` };
      }

      this.config.isConnected = true;
      this.saveConfig({ url, anonKey: key, isConnected: true });
      return { success: true, message: 'Connection successful! Supabase cloud database is connected and ready.' };
    } catch (e: any) {
      return { success: false, message: `Connection error: ${e.message || 'Unknown network error'}` };
    }
  }

  /**
   * Sync all local data to Supabase cloud database
   */
  public async syncLocalToCloud(localData: {
    projects: Project[];
    modules: Module[];
    vulnerabilities: Vulnerability[];
    reports: Report[];
    settings: Settings;
  }): Promise<{ success: boolean; message: string; syncedAt?: string; needsGrant?: boolean }> {
    if (!this.client) {
      return { success: false, message: 'Database not connected. Please configure your Supabase credentials first.' };
    }

    try {
      const now = new Date().toISOString();

      // 1. Store in primary vapt_cloud_store (Key-Value document store)
      const storePayload = [
        { key: 'projects', value: localData.projects, updated_at: now },
        { key: 'modules', value: localData.modules, updated_at: now },
        { key: 'vulnerabilities', value: localData.vulnerabilities, updated_at: now },
        { key: 'reports', value: localData.reports, updated_at: now },
        { key: 'settings', value: localData.settings, updated_at: now },
      ];

      const { error: storeError } = await this.client
        .from('vapt_cloud_store')
        .upsert(storePayload, { onConflict: 'key' });

      if (storeError) {
        console.warn('Could not write to vapt_cloud_store:', storeError);
        const isPermError = storeError.code === '42501';
        return {
          success: false,
          needsGrant: isPermError,
          message: isPermError
            ? 'Permission denied by Supabase. Please run the Grant SQL script in Supabase SQL editor to allow read/write.'
            : `Failed to sync to cloud: ${storeError.message}. Make sure you ran the SQL setup script.`,
        };
      }

      // 2. Also try optional relational sync (fire & forget, if tables exist)
      try {
        if (localData.projects.length > 0) {
          await this.client.from('vapt_projects').upsert(
            localData.projects.map((p) => ({
              id: p.id,
              code: p.code,
              name: p.name,
              client: p.client,
              application_url: p.applicationUrl,
              environment: p.environment,
              status: p.status,
              description: p.description,
              modules_count: p.modulesCount,
              vulns_count: p.vulnsCount,
              created_date: p.createdDate,
              raw_data: p,
              updated_at: now,
            })),
            { onConflict: 'id' }
          );
        }

        if (localData.reports.length > 0) {
          await this.client.from('vapt_reports').upsert(
            localData.reports.map((r) => ({
              id: r.id,
              name: r.name,
              project_id: r.projectId,
              client: r.client,
              application_name: r.applicationName,
              status: r.status,
              raw_data: r,
              updated_at: now,
            })),
            { onConflict: 'id' }
          );
        }

        if (localData.vulnerabilities.length > 0) {
          await this.client.from('vapt_vulnerabilities').upsert(
            localData.vulnerabilities.map((v) => ({
              id: v.id,
              project_id: v.projectId,
              module_id: v.moduleId,
              report_id: v.reportId || '',
              name: v.name,
              severity: v.severity,
              cvss_score: v.cvssScore,
              cvss_vector: v.cvssVector,
              endpoint: v.endpoint,
              status: v.status,
              raw_data: v,
              updated_at: now,
            })),
            { onConflict: 'id' }
          );
        }
      } catch (relError) {
        // Relational tables are optional
      }

      const syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.saveConfig({ lastSync: syncedAt, isConnected: true });

      return {
        success: true,
        message: `Successfully synced ${localData.projects.length} projects, ${localData.vulnerabilities.length} vulnerabilities, and ${localData.reports.length} reports to Supabase!`,
        syncedAt,
      };
    } catch (e: any) {
      return { success: false, message: `Sync failed: ${e.message || 'Unknown error'}` };
    }
  }

  /**
   * Pull all data from Supabase cloud database
   */
  public async pullCloudToLocal(): Promise<{
    success: boolean;
    message: string;
    needsGrant?: boolean;
    data?: {
      projects?: Project[];
      modules?: Module[];
      vulnerabilities?: Vulnerability[];
      reports?: Report[];
      settings?: Settings;
    };
  }> {
    if (!this.client) {
      return { success: false, message: 'Database not connected. Please configure your Supabase credentials first.' };
    }

    try {
      const { data, error } = await this.client
        .from('vapt_cloud_store')
        .select('*');

      if (error) {
        const isPermError = error.code === '42501';
        return {
          success: false,
          needsGrant: isPermError,
          message: isPermError
            ? 'Permission denied by Supabase. Please run the Grant SQL script in Supabase SQL editor to allow read access.'
            : `Failed to pull from cloud: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'Cloud database is connected, but has no data yet. Click "Sync Local Data to Cloud" to populate it.',
        };
      }

      const result: any = {};
      data.forEach((row: { key: string; value: any }) => {
        result[row.key] = row.value;
      });

      const syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.saveConfig({ lastSync: syncedAt, isConnected: true });

      return {
        success: true,
        message: 'Successfully pulled latest data from Supabase!',
        data: result,
      };
    } catch (e: any) {
      return { success: false, message: `Pull failed: ${e.message || 'Unknown error'}` };
    }
  }

  /**
   * Auto-sync single record in the background when autoSync is enabled
   */
  public async autoSyncItem(
    key: 'projects' | 'modules' | 'vulnerabilities' | 'reports' | 'settings',
    allCurrentItems: any
  ): Promise<void> {
    if (!this.client || !this.config.autoSync || !this.config.isConnected) return;

    try {
      const now = new Date().toISOString();
      await this.client
        .from('vapt_cloud_store')
        .upsert({ key, value: allCurrentItems, updated_at: now }, { onConflict: 'key' });

      this.config.lastSync = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.notify();
    } catch (e) {
      console.warn(`Background auto-sync for ${key} failed:`, e);
    }
  }

  /**
   * SQL Schema setup & permission grant script to run in Supabase SQL editor
   */
  public getSqlSetupScript(): string {
    return `-- ========================================================
-- VAPT REPORT MAKER — SUPABASE DATABASE SETUP & PERMISSIONS
-- Run this in your Supabase SQL Editor (Takes 5 seconds)
-- ========================================================

-- 1. Grant public and authenticated permissions on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. Main Key-Value Document Store (Guarantees 100% full compatibility)
CREATE TABLE IF NOT EXISTS vapt_cloud_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with full public access policy
ALTER TABLE vapt_cloud_store ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access on vapt_cloud_store" ON vapt_cloud_store;
CREATE POLICY "Allow public full access on vapt_cloud_store" ON vapt_cloud_store FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE vapt_cloud_store TO anon, authenticated;

-- 3. Optional Relational Tables for direct SQL querying and reporting
CREATE TABLE IF NOT EXISTS vapt_projects (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT,
  client TEXT,
  application_url TEXT,
  environment TEXT,
  status TEXT,
  description TEXT,
  modules_count INTEGER DEFAULT 0,
  vulns_count INTEGER DEFAULT 0,
  created_date TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vapt_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access on vapt_projects" ON vapt_projects;
CREATE POLICY "Allow public full access on vapt_projects" ON vapt_projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE vapt_projects TO anon, authenticated;

CREATE TABLE IF NOT EXISTS vapt_reports (
  id TEXT PRIMARY KEY,
  name TEXT,
  project_id TEXT,
  client TEXT,
  application_name TEXT,
  status TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vapt_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access on vapt_reports" ON vapt_reports;
CREATE POLICY "Allow public full access on vapt_reports" ON vapt_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE vapt_reports TO anon, authenticated;

CREATE TABLE IF NOT EXISTS vapt_vulnerabilities (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  module_id TEXT,
  report_id TEXT,
  name TEXT,
  severity TEXT,
  cvss_score NUMERIC,
  cvss_vector TEXT,
  endpoint TEXT,
  status TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vapt_vulnerabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public full access on vapt_vulnerabilities" ON vapt_vulnerabilities;
CREATE POLICY "Allow public full access on vapt_vulnerabilities" ON vapt_vulnerabilities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE vapt_vulnerabilities TO anon, authenticated;
`;
  }
}

export const cloudDb = new CloudDbService();
