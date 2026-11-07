import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Module, Vulnerability, Report, Settings } from '../types';

export type CloudDbStatus = 'connecting' | 'connected' | 'needs_grant' | 'error' | 'unconfigured';

export interface CloudDbConfig {
  url: string;
  status: CloudDbStatus;
  statusMessage: string;
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

// Fixed Supabase credentials from Environment (.env / Vercel Environment Variables)
const ENV_SUPABASE_URL = normalizeSupabaseUrl(
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iupuipgnwvmrcpojopao.supabase.co'
);
const ENV_SUPABASE_ANON_KEY = (
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lkbMejvGQs1H_LMFFN7d0w_CeKm3nyx'
).trim();

class CloudDbService {
  private client: SupabaseClient | null = null;
  private config: CloudDbConfig = {
    url: ENV_SUPABASE_URL,
    status: 'connecting',
    statusMessage: 'Checking Supabase cloud connection...',
    autoSync: true,
    isConnected: false,
    provider: 'supabase',
  };
  private listeners: Array<(config: CloudDbConfig) => void> = [];

  constructor() {
    this.cleanLegacyStorage();
    this.initClient();
    this.checkConnection();
  }

  /**
   * Clean any legacy credentials stored in localStorage so credentials are only loaded from env
   */
  private cleanLegacyStorage() {
    try {
      localStorage.removeItem('vapt_cloud_db_config_v1');
    } catch {
      // ignore
    }
  }

  private initClient() {
    try {
      if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY && ENV_SUPABASE_URL.startsWith('http')) {
        this.client = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
          },
        });
      } else {
        this.client = null;
        this.config.status = 'unconfigured';
        this.config.statusMessage = 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.';
      }
    } catch (e: any) {
      console.error('Failed to initialize Supabase client:', e);
      this.client = null;
      this.config.status = 'error';
      this.config.statusMessage = e?.message || 'Failed to initialize Supabase client';
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

  public isConfigured(): boolean {
    return Boolean(this.client && ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY);
  }

  public isConnected(): boolean {
    return Boolean(this.config.isConnected && this.client);
  }

  public setAutoSync(enabled: boolean) {
    this.config.autoSync = enabled;
    this.notify();
  }

  /**
   * Test and verify connection to Supabase instance
   */
  public async checkConnection(): Promise<{
    success: boolean;
    status: CloudDbStatus;
    message: string;
    needsGrant?: boolean;
  }> {
    if (!this.client) {
      this.config.status = 'unconfigured';
      this.config.isConnected = false;
      this.config.statusMessage = 'Supabase environment variables not configured.';
      this.notify();
      return {
        success: false,
        status: 'unconfigured',
        message: 'Supabase environment variables not configured in .env',
      };
    }

    try {
      // Query vapt_cloud_store table
      const { data, error } = await this.client.from('vapt_cloud_store').select('key').limit(1);

      if (error) {
        // Code 42501: Table exists, but PostgreSQL permissions need to be granted to anon
        if (error.code === '42501') {
          this.config.status = 'needs_grant';
          this.config.isConnected = false;
          this.config.statusMessage =
            'Connected to Supabase project, but PostgreSQL permission is denied for "anon" role. Run the Grant SQL command in Supabase SQL editor.';
          this.notify();
          return {
            success: false,
            status: 'needs_grant',
            needsGrant: true,
            message:
              'Supabase table exists, but public permission is denied (42501). Please run the Grant SQL command in your Supabase SQL Editor.',
          };
        }

        // Code 42P01: Table doesn't exist yet
        if (error.code === '42P01') {
          this.config.status = 'needs_grant';
          this.config.isConnected = false;
          this.config.statusMessage =
            'Database tables are not created yet in Supabase. Please execute the SQL setup script in Supabase SQL Editor.';
          this.notify();
          return {
            success: false,
            status: 'needs_grant',
            needsGrant: true,
            message: 'Database tables do not exist in Supabase yet. Please execute the SQL setup script.',
          };
        }

        this.config.status = 'error';
        this.config.isConnected = false;
        this.config.statusMessage = `Connection error: ${error.message}`;
        this.notify();
        return { success: false, status: 'error', message: error.message };
      }

      this.config.status = 'connected';
      this.config.isConnected = true;
      this.config.statusMessage = 'Connected to Supabase Cloud Database';
      this.notify();
      return {
        success: true,
        status: 'connected',
        message: 'Connection verified! Supabase cloud database is connected and ready.',
      };
    } catch (e: any) {
      this.config.status = 'error';
      this.config.isConnected = false;
      this.config.statusMessage = `Connection error: ${e.message || 'Unknown network error'}`;
      this.notify();
      return { success: false, status: 'error', message: e.message || 'Unknown network error' };
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
      return { success: false, message: 'Database client not initialized. Check .env configuration.' };
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
        if (isPermError) {
          this.config.status = 'needs_grant';
          this.config.isConnected = false;
          this.notify();
        }
        return {
          success: false,
          needsGrant: isPermError,
          message: isPermError
            ? 'Permission denied by Supabase (code: 42501). Please run the Grant SQL command in Supabase SQL editor.'
            : `Failed to sync to cloud: ${storeError.message}`,
        };
      }

      // 2. Also try optional relational sync (fire & forget)
      try {
        if (localData.projects.length > 0) {
          await this.client.from('vapt_projects').upsert(
            localData.projects.map((p) => ({
              id: p.id,
              code: p.code,
              name: p.name,
              client: p.client,
              application_url: p.applicationUrl || null,
              environment: p.environment || null,
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
      this.config.lastSync = syncedAt;
      this.config.status = 'connected';
      this.config.isConnected = true;
      this.notify();

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
      return { success: false, message: 'Database client not initialized. Check .env configuration.' };
    }

    try {
      const { data, error } = await this.client.from('vapt_cloud_store').select('*');

      if (error) {
        const isPermError = error.code === '42501';
        if (isPermError) {
          this.config.status = 'needs_grant';
          this.config.isConnected = false;
          this.notify();
        }
        return {
          success: false,
          needsGrant: isPermError,
          message: isPermError
            ? 'Permission denied by Supabase (code: 42501). Please run the Grant SQL command in Supabase SQL editor.'
            : `Failed to pull from cloud: ${error.message}`,
        };
      }

      if (!data || data.length === 0) {
        this.config.status = 'connected';
        this.config.isConnected = true;
        this.notify();
        return {
          success: false,
          message: 'Cloud database is connected, but has no records yet.',
        };
      }

      const result: any = {};
      data.forEach((row: { key: string; value: any }) => {
        result[row.key] = row.value;
      });

      const syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.config.lastSync = syncedAt;
      this.config.status = 'connected';
      this.config.isConnected = true;
      this.notify();

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
    if (!this.client || !this.config.autoSync || this.config.status === 'needs_grant') return;

    try {
      const now = new Date().toISOString();
      const { error } = await this.client
        .from('vapt_cloud_store')
        .upsert({ key, value: allCurrentItems, updated_at: now }, { onConflict: 'key' });

      if (error) {
        if (error.code === '42501') {
          this.config.status = 'needs_grant';
          this.config.isConnected = false;
          this.notify();
        }
        return;
      }

      this.config.status = 'connected';
      this.config.isConnected = true;
      this.config.lastSync = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.notify();
    } catch (e) {
      console.warn(`Background auto-sync for ${key} failed:`, e);
    }
  }

  /**
   * Completely wipe all records in Supabase cloud database
   */
  public async clearCloudDatabase(): Promise<void> {
    if (!this.client) return;

    try {
      const now = new Date().toISOString();
      const emptyPayload = [
        { key: 'projects', value: [], updated_at: now },
        { key: 'modules', value: [], updated_at: now },
        { key: 'vulnerabilities', value: [], updated_at: now },
        { key: 'reports', value: [], updated_at: now },
      ];
      await this.client.from('vapt_cloud_store').upsert(emptyPayload, { onConflict: 'key' });

      // Clean relational tables if they exist
      try {
        await this.client.from('vapt_projects').delete().neq('id', '___NEVER_MATCH___');
      } catch {}
      try {
        await this.client.from('vapt_reports').delete().neq('id', '___NEVER_MATCH___');
      } catch {}
      try {
        await this.client.from('vapt_vulnerabilities').delete().neq('id', '___NEVER_MATCH___');
      } catch {}

      this.config.lastSync = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      this.notify();
    } catch (e) {
      console.warn('Failed to clear cloud database:', e);
    }
  }

  /**
   * SQL Schema setup & permission grant script to run in Supabase SQL editor
   */
  public getSqlSetupScript(): string {
    return `-- ========================================================
-- VAPT REPORT MAKER — SUPABASE DATABASE SETUP & PERMISSIONS
-- Run this in your Supabase SQL Editor (Takes 3 seconds)
-- ========================================================

-- 1. Grant public and authenticated permissions on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. Main Key-Value Document Store
CREATE TABLE IF NOT EXISTS public.vapt_cloud_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) to allow anon public access
ALTER TABLE public.vapt_cloud_store DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.vapt_cloud_store TO anon, authenticated;

-- 3. Optional Relational Tables
CREATE TABLE IF NOT EXISTS public.vapt_projects (
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
ALTER TABLE public.vapt_projects DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.vapt_projects TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.vapt_reports (
  id TEXT PRIMARY KEY,
  name TEXT,
  project_id TEXT,
  client TEXT,
  application_name TEXT,
  status TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.vapt_reports DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.vapt_reports TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.vapt_vulnerabilities (
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
ALTER TABLE public.vapt_vulnerabilities DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.vapt_vulnerabilities TO anon, authenticated;
`;
  }
}

export const cloudDb = new CloudDbService();
