import { Project, Module, Vulnerability, Report, Template, Activity, Settings, VulnStatus, StatusNote } from '../types';
import { cloudDb } from './cloudDb';

const STORAGE_KEYS = {
  PROJECTS: 'vapt_projects_v1',
  MODULES: 'vapt_modules_v1',
  VULNERABILITIES: 'vapt_vulnerabilities_v1',
  REPORTS: 'vapt_reports_v1',
  TEMPLATES: 'vapt_templates_v2',
  ACTIVITIES: 'vapt_activities_v1',
  SETTINGS: 'vapt_settings_v1',
};

// Default Settings
export const defaultSettings: Settings = {
  organizationName: 'Cyber Security Labs',
  companyLogo: '',
  userName: 'Sanjay',
  userRole: 'Cyber Security Engineer',
  userEmail: 'sanjay.cybersec@secureshield.io',
  reportBrandingColor: '#7c3aed',
  defaultReportVersion: 'v1.0',
  defaultCvssVersion: 'CVSS v3.1',
  severityColors: {
    Critical: '#991b1b',
    High: '#dc2626',
    Medium: '#d97706',
    Low: '#16a34a',
    Informational: '#2563eb',
  },
  reportFooter: 'Confidential - VAPT Report for authorized recipients only. Page %PAGE% of %TOTAL%',
  confidentialityNotice: 'This document contains confidential and proprietary information intended solely for the use of the client organization. Any unauthorized review, use, disclosure, or distribution is strictly prohibited.',
};

// Initial Templates - Single official Standard VAPT Report Template
export const initialTemplates: Template[] = [
  {
    id: 'tmpl-vapt-standard',
    name: 'Standard VAPT Assessment Report',
    description: 'Official penetration testing assessment template adhering to OWASP Top 10 standards with Document Information, Executive Summary, Summary of Findings, and Detailed Vulnerability Findings.',
    isDefault: true,
    category: 'Full Assessment',
    sections: {
      documentInfo: true,
      executiveSummary: true,
      summaryOfFindings: true,
      detailedFindings: true,
    },
  },
];

// Fresh Clean Workspace - Zero initial demo data
export const initialProjects: Project[] = [];
export const initialModules: Module[] = [];
export const initialReports: Report[] = [];
export const initialGlobalVulnerabilities: Vulnerability[] = [];
export const initialActivities: Activity[] = [];

// Storage Service Helper Functions
class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }

  // Aggregated vulnerabilities across all reports and global pool
  getAllVulnerabilities(): Vulnerability[] {
    const list: Vulnerability[] = [];
    const seenIds = new Set<string>();

    const addVuln = (v: Vulnerability, r?: Report) => {
      if (!v || !v.id || seenIds.has(v.id)) return;
      seenIds.add(v.id);
      list.push({
        ...v,
        projectId: v.projectId || r?.projectId || '',
        projectName: v.projectName || r?.projectName || '',
        moduleId: v.moduleId || r?.moduleId || '',
        moduleName: v.moduleName || r?.moduleName || '',
        reportId: v.reportId || r?.id,
      });
    };

    // 1. Collect from all saved reports
    const reports = this.getItem<Report[]>(STORAGE_KEYS.REPORTS, []);
    reports.forEach((r) => {
      if (Array.isArray(r.vulnerabilities)) {
        r.vulnerabilities.forEach((v) => addVuln(v, r));
      }
    });

    // 2. Collect from global pool
    const globalVulns = this.getItem<Vulnerability[]>(STORAGE_KEYS.VULNERABILITIES, []);
    globalVulns.forEach((v) => addVuln(v));

    return list;
  }

  // Helper: Get all vulnerabilities belonging to a project
  getProjectVulnerabilities(projectId: string, project?: Project): Vulnerability[] {
    const proj = project || this.getProjectById(projectId);
    const allVulns = this.getAllVulnerabilities();
    if (!proj && !projectId) return [];

    const pId = (proj?.id || projectId || '').trim().toLowerCase();
    const pCode = (proj?.code || '').trim().toLowerCase();
    const pName = (proj?.name || '').trim().toLowerCase();
    const pClient = (proj?.client || '').trim().toLowerCase();
    const pAppUrl = (proj?.applicationUrl || '').trim().toLowerCase();

    return allVulns.filter((v) => {
      const vPid = (v.projectId || '').trim().toLowerCase();
      const vPname = (v.projectName || '').trim().toLowerCase();

      // Check ID or code
      if (pId && (vPid === pId || (pCode && vPid === pCode))) return true;
      if (pCode && (vPid === pCode || vPid === pId)) return true;

      // Check Name
      if (pName && vPname && (vPname === pName || pName.includes(vPname) || vPname.includes(pName))) return true;

      // Check Report association
      if (v.reportId) {
        const rep = this.getReports().find((r) => r.id === v.reportId);
        if (rep) {
          const rPid = (rep.projectId || '').trim().toLowerCase();
          const rPname = (rep.projectName || '').trim().toLowerCase();
          const rClient = (rep.client || '').trim().toLowerCase();
          const rName = (rep.name || '').trim().toLowerCase();
          const rAppUrl = (rep.applicationUrl || '').trim().toLowerCase();

          if (pId && (rPid === pId || (pCode && rPid === pCode))) return true;
          if (pCode && (rPid === pCode || rPid === pId)) return true;
          if (pName && (
            (rPname && (rPname === pName || pName.includes(rPname) || rPname.includes(pName))) ||
            (rName && (rName.includes(pName) || pName.includes(rName)))
          )) return true;
          if (pClient && (
            (rClient && (rClient === pClient || pClient.includes(rClient) || rClient.includes(pClient))) ||
            (rName && (rName.includes(pClient) || pClient.includes(rName)))
          )) return true;
          if (pAppUrl && rAppUrl && (pAppUrl === rAppUrl || pAppUrl.includes(rAppUrl) || rAppUrl.includes(pAppUrl))) return true;
        }
      }

      return false;
    });
  }

  // Projects
  getProjects(): Project[] {
    const sourceProjects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const sourceModules = this.getItem<Module[]>(STORAGE_KEYS.MODULES, []);

    return sourceProjects.map((p) => {
      const projVulns = this.getProjectVulnerabilities(p.id, p);
      const projModules = sourceModules.filter(
        (m) =>
          m.projectId === p.id ||
          m.projectId === p.code ||
          (m.projectId && p.id && m.projectId.toLowerCase() === p.id.toLowerCase())
      );
      const computedModulesCount = Math.max(p.modulesCount || 0, projModules.length);
      const computedVulnsCount = Math.max(p.vulnsCount || 0, projVulns.length);

      return {
        ...p,
        modulesCount: computedModulesCount,
        vulnsCount: computedVulnsCount,
      };
    });
  }

  saveProjects(projects: Project[]): void {
    this.setItem(STORAGE_KEYS.PROJECTS, projects);
    cloudDb.autoSyncItem('projects', projects);
  }

  getProjectById(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id || p.code === id || (p.name && p.name.toLowerCase() === id.toLowerCase()));
  }

  addProject(project: Omit<Project, 'id' | 'code' | 'createdDate' | 'modulesCount' | 'vulnsCount'>): Project {
    const projects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const count = projects.length + 1;
    const newProject: Project = {
      ...project,
      id: `prj-${String(count).padStart(3, '0')}`,
      code: `PRJ-${String(count).padStart(3, '0')}`,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      modulesCount: 0,
      vulnsCount: 0,
    };
    projects.unshift(newProject);
    this.saveProjects(projects);
    this.addActivity({
      title: 'Project created',
      description: `Project ${newProject.name} created`,
      type: 'project_added',
      targetId: newProject.id,
    });
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const projects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    projects[index] = { ...projects[index], ...updates };
    this.saveProjects(projects);
    return projects[index];
  }

  deleteProject(id: string): boolean {
    let projects = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const target = projects.find(p => p.id === id);
    if (!target) return false;
    projects = projects.filter(p => p.id !== id);
    this.saveProjects(projects);
    return true;
  }

  // Modules
  getModules(projectId?: string): Module[] {
    const sourceModules = this.getItem<Module[]>(STORAGE_KEYS.MODULES, []);

    const filtered = projectId
      ? sourceModules.filter(
          (m) =>
            m.projectId === projectId ||
            (m.projectId && projectId && m.projectId.toLowerCase() === projectId.toLowerCase())
        )
      : sourceModules;

    const allVulns = this.getAllVulnerabilities();

    const mapped = filtered.map((m) => {
      // Find matching vulnerabilities
      const mVulns = allVulns.filter((v) => {
        // Project check
        if (m.projectId) {
          const vPid = (v.projectId || '').trim().toLowerCase();
          const mPid = m.projectId.trim().toLowerCase();
          const proj = this.getProjectById(m.projectId);
          const pCode = (proj?.code || '').trim().toLowerCase();
          const pName = (proj?.name || '').trim().toLowerCase();

          let projectMatches = vPid === mPid || (pCode && vPid === pCode);
          if (!projectMatches && v.reportId) {
            const rep = this.getReportById(v.reportId);
            if (rep) {
              const rPid = (rep.projectId || '').trim().toLowerCase();
              const rPname = (rep.projectName || '').trim().toLowerCase();
              const rName = (rep.name || '').trim().toLowerCase();
              projectMatches =
                rPid === mPid ||
                (pCode && rPid === pCode) ||
                (pName && (rPname.includes(pName) || pName.includes(rPname) || rName.includes(pName) || pName.includes(rName)));
            }
          }
          if (!projectMatches) return false;
        }

        // Module ID match
        if (v.moduleId && (v.moduleId === m.id || v.moduleId.toLowerCase() === m.id.toLowerCase())) {
          return true;
        }

        // Module Name match
        if (v.moduleName && m.name) {
          const vMname = v.moduleName.trim().toLowerCase();
          const mMname = m.name.trim().toLowerCase();
          if (vMname === mMname || vMname.includes(mMname) || mMname.includes(vMname)) {
            return true;
          }
        }

        // Report Module match
        if (v.reportId) {
          const rep = this.getReportById(v.reportId);
          if (rep) {
            if (rep.moduleId && (rep.moduleId === m.id || rep.moduleId.toLowerCase() === m.id.toLowerCase())) {
              return true;
            }
            if (rep.moduleName && m.name) {
              const rMname = rep.moduleName.trim().toLowerCase();
              const mMname = m.name.trim().toLowerCase();
              if (rMname === mMname || rMname.includes(mMname) || mMname.includes(rMname)) {
                return true;
              }
            }
            if (rep.name && m.name) {
              const rTitle = rep.name.trim().toLowerCase();
              const mMname = m.name.trim().toLowerCase();
              if (rTitle.includes(mMname)) {
                return true;
              }
            }
          }
        }

        return false;
      });

      if (mVulns.length > 0) {
        const crit = mVulns.filter((v) => v.severity === 'Critical').length;
        const high = mVulns.filter((v) => v.severity === 'High').length;
        const med = mVulns.filter((v) => v.severity === 'Medium').length;
        const low = mVulns.filter((v) => v.severity === 'Low').length;
        const info = mVulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length;

        return {
          ...m,
          vulnsCount: Math.max(m.vulnsCount || 0, mVulns.length),
          criticalCount: Math.max(m.criticalCount || 0, crit),
          highCount: Math.max(m.highCount || 0, high),
          mediumCount: Math.max(m.mediumCount || 0, med),
          lowCount: Math.max(m.lowCount || 0, low),
          infoCount: Math.max(m.infoCount || 0, info),
        };
      }

      return m;
    });

    // If modules were filtered for a project and all modules have 0 vulns,
    // but the project itself has vulnerabilities, assign them to the first module
    if (projectId && mapped.length > 0) {
      const allZero = mapped.every((m) => (m.vulnsCount || 0) === 0);
      if (allZero) {
        const projVulns = this.getProjectVulnerabilities(projectId);
        if (projVulns.length > 0) {
          const crit = projVulns.filter((v) => v.severity === 'Critical').length;
          const high = projVulns.filter((v) => v.severity === 'High').length;
          const med = projVulns.filter((v) => v.severity === 'Medium').length;
          const low = projVulns.filter((v) => v.severity === 'Low').length;
          const info = projVulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length;

          mapped[0] = {
            ...mapped[0],
            vulnsCount: projVulns.length,
            criticalCount: crit,
            highCount: high,
            mediumCount: med,
            lowCount: low,
            infoCount: info,
          };
        }
      }
    }

    return mapped;
  }

  saveModules(modules: Module[]): void {
    this.setItem(STORAGE_KEYS.MODULES, modules);
    cloudDb.autoSyncItem('modules', modules);
  }

  addModule(module: Omit<Module, 'id' | 'vulnsCount' | 'criticalCount' | 'highCount' | 'mediumCount' | 'lowCount' | 'infoCount'>): Module {
    const modules = this.getItem<Module[]>(STORAGE_KEYS.MODULES, []);
    const newModule: Module = {
      ...module,
      id: `mod-${Date.now()}`,
      vulnsCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
    };
    modules.push(newModule);
    this.saveModules(modules);

    // Update project modules count
    const project = this.getProjectById(module.projectId);
    if (project) {
      this.updateProject(project.id, { modulesCount: (project.modulesCount || 0) + 1 });
    }

    return newModule;
  }

  updateModule(id: string, updates: Partial<Module>): Module | undefined {
    const modules = this.getModules();
    const index = modules.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    modules[index] = { ...modules[index], ...updates };
    this.saveModules(modules);
    return modules[index];
  }

  deleteModule(id: string): boolean {
    let modules = this.getModules();
    const target = modules.find(m => m.id === id);
    if (!target) return false;
    modules = modules.filter(m => m.id !== id);
    this.saveModules(modules);

    const project = this.getProjectById(target.projectId);
    if (project && project.modulesCount > 0) {
      this.updateProject(project.id, { modulesCount: project.modulesCount - 1 });
    }
    return true;
  }

  // Reports
  getReports(): Report[] {
    return this.getItem<Report[]>(STORAGE_KEYS.REPORTS, []);
  }

  saveReports(reports: Report[]): void {
    this.setItem(STORAGE_KEYS.REPORTS, reports);
    cloudDb.autoSyncItem('reports', reports);
  }

  getReportById(id: string): Report | undefined {
    return this.getReports().find(r => r.id === id);
  }

  addReport(reportData: Omit<Report, 'id' | 'lastUpdated'>): Report {
    const reports = this.getReports();
    const count = reports.length + 1;
    const project = this.getProjectById(reportData.projectId);
    const prefix = project?.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'REPORT';
    const newReport: Report = {
      ...reportData,
      id: `${prefix}-VAPT-${String(count).padStart(3, '0')}`,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    reports.unshift(newReport);
    this.saveReports(reports);

    this.addActivity({
      title: 'Report created',
      description: `Report "${newReport.name}" created`,
      type: 'report_created',
      targetId: newReport.id,
    });

    return newReport;
  }

  updateReport(id: string, updates: Partial<Report>): Report | undefined {
    const reports = this.getReports();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    reports[index] = {
      ...reports[index],
      ...updates,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    this.saveReports(reports);
    return reports[index];
  }

  deleteReport(id: string): boolean {
    let reports = this.getReports();
    const target = reports.find(r => r.id === id);
    if (!target) return false;
    reports = reports.filter(r => r.id !== id);
    this.saveReports(reports);
    return true;
  }

  duplicateReport(id: string): Report | undefined {
    const existing = this.getReportById(id);
    if (!existing) return undefined;
    const reports = this.getReports();
    const count = reports.length + 1;
    const newReport: Report = {
      ...existing,
      id: `${existing.id}-COPY-${Date.now().toString().slice(-4)}`,
      name: `${existing.name} (Copy)`,
      status: 'Draft',
      reportVersion: 'v1.0-draft',
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      vulnerabilities: JSON.parse(JSON.stringify(existing.vulnerabilities)),
    };
    reports.unshift(newReport);
    this.saveReports(reports);
    return newReport;
  }

  // Global Vulnerabilities
  getGlobalVulnerabilities(): Vulnerability[] {
    return this.getItem<Vulnerability[]>(STORAGE_KEYS.VULNERABILITIES, []);
  }

  saveGlobalVulnerabilities(vulns: Vulnerability[]): void {
    this.setItem(STORAGE_KEYS.VULNERABILITIES, vulns);
    cloudDb.autoSyncItem('vulnerabilities', this.getAllVulnerabilities());
  }

  addGlobalVulnerability(vuln: Omit<Vulnerability, 'id' | 'createdDate'>): Vulnerability {
    const vulns = this.getGlobalVulnerabilities();
    const count = vulns.length + 1;
    const newVuln: Vulnerability = {
      ...vuln,
      id: `FIL-${String(count).padStart(3, '0')}`,
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    vulns.unshift(newVuln);
    this.saveGlobalVulnerabilities(vulns);

    this.addActivity({
      title: 'Vulnerability logged',
      description: `${newVuln.name} (${newVuln.id}) added`,
      type: 'vuln_updated',
      targetId: newVuln.id,
    });

    return newVuln;
  }

  updateGlobalVulnerability(id: string, updates: Partial<Vulnerability>): Vulnerability | undefined {
    const vulns = this.getGlobalVulnerabilities();
    const index = vulns.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    vulns[index] = { ...vulns[index], ...updates };
    this.saveGlobalVulnerabilities(vulns);

    this.addActivity({
      title: 'Vulnerability updated',
      description: `${vulns[index].name} (${id}) updated`,
      type: 'status_changed',
      targetId: id,
    });

    return vulns[index];
  }

  // Centralized status change that reflects universally across reports and global pool
  updateVulnerabilityStatus(
    id: string,
    newStatus: VulnStatus,
    note?: string,
    author?: string,
    retestOptions?: {
      isRetested?: boolean;
      retestNotes?: string;
      retestedDate?: string;
      retestedBy?: string;
      retestStatus?: VulnStatus;
    }
  ): Vulnerability | undefined {
    const endpointStatus: 'Fixed' | 'Open' | 'Partially Fixed' =
      newStatus === 'Fixed'
        ? 'Fixed'
        : newStatus === 'Partially Fixed'
        ? 'Partially Fixed'
        : 'Open';

    const cleanNote = note?.trim();
    const formattedDate =
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    let updatedTarget: Vulnerability | undefined = undefined;

    // Helper to build or prepend notes
    const buildUpdatedNotes = (v: Vulnerability): StatusNote[] => {
      const existing = v.statusNotes || [];
      if (!cleanNote) return existing;
      const noteItem: StatusNote = {
        id: `sn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        status: newStatus,
        previousStatus: v.status !== newStatus ? v.status : undefined,
        note: cleanNote,
        date: formattedDate,
        author: author || 'Security Engineer',
      };
      return [noteItem, ...existing];
    };

    // 1. Update in Global pool if present
    const globalVulns = this.getGlobalVulnerabilities();
    const gIndex = globalVulns.findIndex((v) => v.id === id);
    if (gIndex !== -1) {
      const prev = globalVulns[gIndex];
      const newNotes = buildUpdatedNotes(prev);
      globalVulns[gIndex] = {
        ...prev,
        status: newStatus,
        endpointStatus,
        statusNote: cleanNote || prev.statusNote,
        statusNotes: newNotes,
        ...(retestOptions
          ? {
              isRetested: retestOptions.isRetested,
              retestNotes: retestOptions.retestNotes,
              retestedDate: retestOptions.retestedDate,
              retestedBy: retestOptions.retestedBy,
              retestStatus: retestOptions.retestStatus,
            }
          : {}),
      };
      this.saveGlobalVulnerabilities(globalVulns);
      updatedTarget = globalVulns[gIndex];
    }

    // 2. Update across ALL reports
    const reports = this.getReports();
    let reportsChanged = false;
    reports.forEach((r) => {
      let reportModified = false;
      r.vulnerabilities = (r.vulnerabilities || []).map((v) => {
        if (v.id === id) {
          reportModified = true;
          reportsChanged = true;
          const newNotes = buildUpdatedNotes(v);
          const updated: Vulnerability = {
            ...v,
            status: newStatus,
            endpointStatus,
            statusNote: cleanNote || v.statusNote,
            statusNotes: newNotes,
            ...(retestOptions
              ? {
                  isRetested: retestOptions.isRetested,
                  retestNotes: retestOptions.retestNotes,
                  retestedDate: retestOptions.retestedDate,
                  retestedBy: retestOptions.retestedBy,
                  retestStatus: retestOptions.retestStatus,
                }
              : {}),
          };
          if (!updatedTarget) updatedTarget = updated;
          return updated;
        }
        return v;
      });

      if (reportModified) {
        // If all findings are fixed, update report status
        const allFixed =
          r.vulnerabilities.length > 0 && r.vulnerabilities.every((v) => v.status === 'Fixed');
        if (allFixed && r.status === 'In Progress') {
          r.status = 'Completed';
        }
      }
    });

    if (reportsChanged) {
      this.saveReports(reports);
    }

    if (updatedTarget) {
      this.addActivity({
        title: 'Status changed',
        description: `${updatedTarget.name} (${id}) status changed to ${newStatus}${
          cleanNote ? `: "${cleanNote}"` : ''
        }`,
        type: 'status_changed',
        targetId: id,
      });

      // Dispatch global window event for instant synchronization across all components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vapt_vulnerability_status_changed', {
            detail: { id, status: newStatus, endpointStatus, note: cleanNote },
          })
        );
      }
    }

    return updatedTarget;
  }

  deleteGlobalVulnerability(id: string, reason?: string): boolean {
    let vulns = this.getGlobalVulnerabilities();
    const target = vulns.find((v) => v.id === id);
    const targetName = target ? target.name : id;
    if (target) {
      vulns = vulns.filter((v) => v.id !== id);
      this.saveGlobalVulnerabilities(vulns);
    }

    // Also remove from reports
    const reports = this.getReports();
    let reportsModified = false;
    reports.forEach((r) => {
      const initialLen = (r.vulnerabilities || []).length;
      r.vulnerabilities = (r.vulnerabilities || []).filter((v) => v.id !== id);
      if (r.vulnerabilities.length !== initialLen) {
        reportsModified = true;
      }
    });
    if (reportsModified) {
      this.saveReports(reports);
    }

    this.addActivity({
      title: 'Vulnerability deleted',
      description: `Vulnerability ${targetName} (${id}) was deleted${
        reason?.trim() ? ` (Reason: "${reason.trim()}")` : ''
      }`,
      type: 'vuln_updated',
      targetId: id,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vapt_vulnerability_deleted', {
          detail: { id, reason },
        })
      );
    }

    return true;
  }

  // Templates
  getTemplates(): Template[] {
    const templates = this.getItem<Template[]>(STORAGE_KEYS.TEMPLATES, initialTemplates);
    const valid = templates.filter(
      (t) =>
        t.id !== 'tmpl-filumart' &&
        t.id !== 'tmpl-comprehensive' &&
        t.id !== 'tmpl-standard' &&
        t.id !== 'tmpl-webapp' &&
        t.id !== 'tmpl-api' &&
        !t.name.toLowerCase().includes('filumart')
    );
    if (valid.length === 0) {
      this.saveTemplates(initialTemplates);
      return initialTemplates;
    }
    return valid;
  }

  saveTemplates(templates: Template[]): void {
    this.setItem(STORAGE_KEYS.TEMPLATES, templates);
  }

  addTemplate(template: Omit<Template, 'id'>): Template {
    const templates = this.getTemplates();
    const newTemplate: Template = {
      ...template,
      id: `tmpl-${Date.now()}`,
    };
    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  }

  // Activities
  getActivities(): Activity[] {
    return this.getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
  }

  addActivity(act: Omit<Activity, 'id' | 'timestamp'>): void {
    const activities = this.getActivities();
    const newAct: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
    };
    activities.unshift(newAct);
    if (activities.length > 20) activities.pop();
    this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
  }

  // Settings
  getSettings(): Settings {
    return this.getItem<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  saveSettings(settings: Settings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    cloudDb.autoSyncItem('settings', settings);
  }

  // Cloud Database Sync helpers
  async syncToCloud() {
    return cloudDb.syncLocalToCloud({
      projects: this.getProjects(),
      modules: this.getModules(),
      vulnerabilities: this.getAllVulnerabilities(),
      reports: this.getReports(),
      settings: this.getSettings(),
    });
  }

  async pullFromCloud() {
    const result = await cloudDb.pullCloudToLocal();
    if (result.success && result.data) {
      if (Array.isArray(result.data.projects)) this.setItem(STORAGE_KEYS.PROJECTS, result.data.projects);
      if (Array.isArray(result.data.modules)) this.setItem(STORAGE_KEYS.MODULES, result.data.modules);
      if (Array.isArray(result.data.reports)) this.setItem(STORAGE_KEYS.REPORTS, result.data.reports);
      if (Array.isArray(result.data.vulnerabilities)) this.setItem(STORAGE_KEYS.VULNERABILITIES, result.data.vulnerabilities);
      if (result.data.settings) this.setItem(STORAGE_KEYS.SETTINGS, result.data.settings);

      window.dispatchEvent(new Event('vapt_data_changed'));
      window.dispatchEvent(new Event('vapt_vulnerability_status_changed'));
    }
    return result;
  }

  // Completely wipe all user data (projects, modules, vulns, reports, activities) and cloud database
  async clearAllData(): Promise<void> {
    this.saveProjects([]);
    this.saveModules([]);
    this.saveGlobalVulnerabilities([]);
    this.saveReports([]);
    this.setItem(STORAGE_KEYS.ACTIVITIES, []);
    await cloudDb.clearCloudDatabase();
  }

  // Reset to initial empty data
  async resetAllData(): Promise<void> {
    await this.clearAllData();
  }
}

// Execute immediate data wipe requested by user
const WIPE_FLAG_KEY = 'vapt_clean_fresh_start_20261107_v3';
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('vapt_templates_v1');
    if (localStorage.getItem(WIPE_FLAG_KEY) !== 'cleared') {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.VULNERABILITIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(initialTemplates));
      localStorage.setItem(WIPE_FLAG_KEY, 'cleared');
    }
  }
} catch (e) {
  console.error('Storage clear execution error:', e);
}

export const storage = new StorageService();
