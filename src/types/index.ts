export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational' | 'Info';

export type VulnStatus = 'Open' | 'Fixed' | 'Partially Fixed' | 'False Positive' | 'Risk Accepted';

export type ProjectEnvironment = 'Production' | 'QA' | 'Dev' | 'Staging';

export type ProjectStatus = 'In Progress' | 'Completed' | 'Planning' | 'On Hold';

export type ReportStatus = 'Draft' | 'In Progress' | 'Completed';

export type ReportClassification = 'Confidential' | 'Strictly Confidential' | 'Internal' | 'Public';

export interface EvidenceItem {
  id: string;
  type: 'screenshot' | 'http_request' | 'http_response' | 'text';
  title: string;
  description?: string;
  content: string; // Image data URL or raw HTTP/text content
  caption?: string;
}

export interface StatusNote {
  id: string;
  status: VulnStatus;
  previousStatus?: VulnStatus;
  note: string;
  date: string;
  author?: string;
}

export interface Vulnerability {
  id: string;
  reportId?: string; // If created within a report
  projectId: string;
  projectName?: string;
  moduleId: string;
  moduleName?: string;
  name: string;
  severity: Severity;
  cvssScore: number;
  cvssVector: string;
  endpoint: string;
  endpointStatus: 'Fixed' | 'Open' | 'Partially Fixed';
  description: string;
  impact: string[];
  recommendations: string[];
  stepsToReproduce?: string;
  evidence: EvidenceItem[];
  preconditions?: string;
  evidenceReferences?: string;
  developerNotes?: string;
  isRetested?: boolean;
  retestedDate?: string;
  retestedBy?: string;
  retestStatus?: VulnStatus;
  retestNotes?: string;
  status: VulnStatus;
  statusNote?: string;
  statusNotes?: StatusNote[];
  createdDate: string;
  addToGlobal?: boolean;
}

export interface Module {
  id: string;
  projectId: string;
  name: string;
  description: string;
  vulnsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
}

export interface Project {
  id: string;
  code: string; // e.g. PRJ-001
  name: string;
  client: string;
  applicationUrl: string;
  environment: ProjectEnvironment;
  status: ProjectStatus;
  description: string;
  modulesCount: number;
  vulnsCount: number;
  createdDate: string;
}

export interface Report {
  id: string; // e.g. FILUMART-VAPT-001
  name: string;
  projectId: string;
  projectName: string;
  moduleId?: string;
  moduleName: string;
  client: string;
  applicationName: string;
  applicationUrl: string;
  environment: string;
  assessmentDate: string;
  reportVersion: string;
  preparedBy: string;
  classification: ReportClassification;
  assessmentType: string;
  hosting: string;
  database: string;
  assessmentPeriod?: string;
  assessmentOutcome?: string;
  confidentialityNotice?: string;
  executiveSummary: string;
  status: ReportStatus;
  lastUpdated: string;
  templateId: string;
  vulnerabilities: Vulnerability[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  category: string;
  sections: {
    documentInfo: boolean;
    executiveSummary: boolean;
    summaryOfFindings: boolean;
    detailedFindings: boolean;
  };
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'vuln_updated' | 'report_created' | 'project_added' | 'status_changed';
  targetId?: string;
}

export interface Settings {
  organizationName: string;
  companyLogo: string;
  userName: string;
  userRole: string;
  userEmail: string;
  reportBrandingColor: string;
  defaultReportVersion: string;
  defaultCvssVersion: string;
  severityColors: {
    Critical: string;
    High: string;
    Medium: string;
    Low: string;
    Informational: string;
    Info?: string;
  };
  reportFooter: string;
  confidentialityNotice: string;
}

