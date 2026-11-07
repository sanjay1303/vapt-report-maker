import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Project,
  Module,
  ProjectEnvironment,
  Report,
  Vulnerability,
  ReportClassification,
  Severity,
  VulnStatus,
} from '../types';
import { storage } from '../services/storage';
import { VulnerabilityFormModal } from '../components/vulnerabilities/VulnerabilityFormModal';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { A4ReportDocument } from '../components/report/A4ReportDocument';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';

interface CreateReportPageProps {
  reportId?: string; // If editing an existing report!
  initialProjectId?: string;
  initialTemplateId?: string;
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const CreateReportPage: React.FC<CreateReportPageProps> = ({
  reportId,
  initialProjectId,
  initialTemplateId,
  onNavigate,
}) => {
  const projects = storage.getProjects();
  const [allModules, setAllModules] = useState<Module[]>(() => storage.getModules());
  const templates = storage.getTemplates();

  const existingReport = reportId ? storage.getReportById(reportId) : null;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Report Details Form State
  const defaultProj = initialProjectId ? projects.find((p) => p.id === initialProjectId) : null;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(existingReport?.projectId || defaultProj?.id || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(existingReport?.moduleId || '');
  const [reportName, setReportName] = useState<string>(
    existingReport?.name || (defaultProj ? `${defaultProj.name} - VAPT Assessment` : '')
  );
  const [client, setClient] = useState<string>(existingReport?.client || defaultProj?.client || '');
  const [applicationName, setApplicationName] = useState<string>(
    existingReport?.applicationName || (defaultProj ? `${defaultProj.name} Web Platform` : '')
  );
  const [applicationUrl, setApplicationUrl] = useState<string>(
    existingReport?.applicationUrl || defaultProj?.applicationUrl || ''
  );
  const [environment, setEnvironment] = useState<string>(existingReport?.environment || defaultProj?.environment || 'Production');
  const assessmentDate = existingReport?.assessmentDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const reportVersion = existingReport?.reportVersion || 'v1.0';
  const [preparedBy, setPreparedBy] = useState<string>(existingReport?.preparedBy || 'Sanjay - Cyber Security Engineer');
  const [classification, setClassification] = useState<ReportClassification>(
    existingReport?.classification || 'Confidential'
  );
  const [assessmentType, setAssessmentType] = useState<string>(
    existingReport?.assessmentType || 'Web Application Security Assessment'
  );
  const [hosting, setHosting] = useState<string>(existingReport?.hosting || 'AWS Cloud (ap-south-1 Mumbai)');
  const [database, setDatabase] = useState<string>(existingReport?.database || 'PostgreSQL 15 / MongoDB');
  const [templateId, setTemplateId] = useState<string>(existingReport?.templateId || initialTemplateId || 'tmpl-filumart');
  const [executiveSummary, setExecutiveSummary] = useState<string>(
    existingReport?.executiveSummary ||
      `A comprehensive Vulnerability Assessment and Penetration Testing (VAPT) exercise was conducted against the target environment. The primary objective was to assess the defense posture of the application, identify exploitable security vulnerabilities, and evaluate compliance with OWASP Top 10 guidelines.\n\nThe findings identified during the assessment tenure should be prioritized according to their CVSS severity scores to remediate the identified risks effectively.`
  );

  // Validation errors
  const [step1Errors, setStep1Errors] = useState<{ project?: string; module?: string; name?: string }>({});

  // Inline module creation modal
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleUrl, setNewModuleUrl] = useState('');
  const [newModuleEnvironment, setNewModuleEnvironment] = useState<ProjectEnvironment>('QA');
  const [newModuleDescription, setNewModuleDescription] = useState('');

  // Step 2: Report Vulnerabilities
  // For brand new reports: strictly empty state!
  // For editing existing reports: load existing findings so user can add more to it!
  const [reportVulnerabilities, setReportVulnerabilities] = useState<Vulnerability[]>(() => {
    return existingReport ? [...existingReport.vulnerabilities] : [];
  });

  // Vulnerability form modal state
  const [isVulnModalOpen, setIsVulnModalOpen] = useState(false);
  const [editingVulnIndex, setEditingVulnIndex] = useState<number | null>(null);

  // Confirmation dialogs
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [deletingVulnIndex, setDeletingVulnIndex] = useState<number | null>(null);

  const projectModules = allModules.filter((m) => m.projectId === selectedProjectId);

  // Handle Project selection change
  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    setSelectedModuleId(''); // Must select an actual module under this project
    setStep1Errors((prev) => ({ ...prev, project: undefined, module: undefined }));

    const proj = projects.find((p) => p.id === projId);
    if (proj) {
      setClient(proj.client);
      setApplicationName(`${proj.name} Platform`);
      setApplicationUrl(proj.applicationUrl || '');
      setEnvironment(proj.environment || 'Production');
      setReportName(`${proj.name} - VAPT Assessment`);
    } else {
      setClient('');
      setApplicationName('');
      setApplicationUrl('');
      setReportName('');
    }
  };

  const handleModuleSelect = (modId: string) => {
    setSelectedModuleId(modId);
    setStep1Errors((prev) => ({ ...prev, module: undefined }));

    const mod = allModules.find((m) => m.id === modId);
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (mod) {
      if (mod.applicationUrl) {
        setApplicationUrl(mod.applicationUrl);
      }
      if (mod.environment) {
        setEnvironment(mod.environment);
      }
      if (proj) {
        setReportName(`${proj.name} - ${mod.name} Module VAPT Assessment`);
      }
    }
  };

  const handleCreateModuleInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim() || !newModuleUrl.trim() || !selectedProjectId) return;
    const createdMod = storage.addModule({
      projectId: selectedProjectId,
      name: newModuleName.trim(),
      applicationUrl: newModuleUrl.trim(),
      environment: newModuleEnvironment,
      description: newModuleDescription.trim(),
    });
    const updatedMods = storage.getModules();
    setAllModules(updatedMods);
    setSelectedModuleId(createdMod.id);
    if (createdMod.applicationUrl) {
      setApplicationUrl(createdMod.applicationUrl);
    }
    if (createdMod.environment) {
      setEnvironment(createdMod.environment);
    }
    setStep1Errors((prev) => ({ ...prev, module: undefined }));

    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj) {
      setReportName(`${proj.name} - ${createdMod.name} Module VAPT Assessment`);
    }

    setNewModuleName('');
    setNewModuleUrl('');
    setNewModuleEnvironment('QA');
    setNewModuleDescription('');
    setIsAddModuleOpen(false);
  };

  const validateStep1 = (): boolean => {
    const errors: { project?: string; module?: string; name?: string } = {};
    if (!selectedProjectId) {
      errors.project = 'Project selection is required. Please choose a project.';
    }
    if (!selectedModuleId) {
      errors.module = 'Module selection is required. A report must belong to a specific module.';
    }
    if (!reportName.trim()) {
      errors.name = 'Report name is required.';
    }
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Add / Edit vulnerability within report
  const handleSaveVulnerability = (data: Omit<Vulnerability, 'id' | 'createdDate'>) => {
    if (editingVulnIndex !== null) {
      // Editing existing report vuln
      const updated = [...reportVulnerabilities];
      updated[editingVulnIndex] = {
        ...updated[editingVulnIndex],
        ...data,
      };
      setReportVulnerabilities(updated);
      setEditingVulnIndex(null);
    } else {
      // Adding new vuln to this report
      const newIndex = reportVulnerabilities.length + 1;
      const proj = projects.find((p) => p.id === selectedProjectId);
      const mod = allModules.find((m) => m.id === selectedModuleId);
      const prefix = proj?.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'VUL';
      const newVuln: Vulnerability = {
        ...data,
        id: `${prefix}-${String(newIndex).padStart(3, '0')}`,
        projectId: selectedProjectId,
        projectName: proj?.name || 'Target',
        moduleId: selectedModuleId,
        moduleName: mod?.name || 'General',
        createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      setReportVulnerabilities([...reportVulnerabilities, newVuln]);

      // If user explicitly checked "Add to global database", also add to global store
      if (data.addToGlobal) {
        storage.addGlobalVulnerability(data);
      }
    }
    setIsVulnModalOpen(false);
  };

  const handleDeleteReportVuln = () => {
    if (deletingVulnIndex !== null) {
      const updated = reportVulnerabilities.filter((_, idx) => idx !== deletingVulnIndex);
      setReportVulnerabilities(updated);
      setDeletingVulnIndex(null);
    }
  };

  // Compile full report object
  const buildReportObject = (status: 'Draft' | 'Completed'): Omit<Report, 'id' | 'lastUpdated'> => {
    const proj = projects.find((p) => p.id === selectedProjectId);
    const mod = allModules.find((m) => m.id === selectedModuleId);

    return {
      name: reportName,
      projectId: selectedProjectId,
      projectName: proj?.name || 'Project',
      moduleId: selectedModuleId,
      moduleName: mod?.name || 'Module',
      client,
      applicationName,
      applicationUrl,
      environment,
      assessmentDate,
      reportVersion,
      preparedBy,
      classification,
      assessmentType,
      hosting,
      database,
      assessmentPeriod: existingReport?.assessmentPeriod || assessmentDate,
      assessmentOutcome: existingReport?.assessmentOutcome,
      confidentialityNotice: existingReport?.confidentialityNotice,
      executiveSummary,
      status,
      templateId,
      vulnerabilities: reportVulnerabilities,
    };
  };

  const handleSaveAsDraft = () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      alert('Cannot save report: Please select both a Project and a Module.');
      return;
    }

    if (reportId) {
      const reportData = buildReportObject('Draft');
      storage.updateReport(reportId, reportData);
      alert(`Report "${reportData.name}" updated successfully!`);
      onNavigate('detailed-report', { reportId });
    } else {
      const reportData = buildReportObject('Draft');
      const created = storage.addReport(reportData);
      alert(`Report "${created.name}" saved as Draft successfully!`);
      onNavigate('reports');
    }
  };

  const handleCompleteReport = () => {
    if (!validateStep1()) {
      setShowCompleteConfirm(false);
      setCurrentStep(1);
      alert('Cannot complete report: Please select both a Project and a Module.');
      return;
    }

    if (reportId) {
      const reportData = buildReportObject('Completed');
      storage.updateReport(reportId, reportData);
      setShowCompleteConfirm(false);
      onNavigate('detailed-report', { reportId });
    } else {
      const reportData = buildReportObject('Completed');
      const created = storage.addReport(reportData);
      setShowCompleteConfirm(false);
      onNavigate('detailed-report', { reportId: created.id });
    }
  };

  // Stepper Header
  const steps = [
    { num: 1, label: 'Report Details' },
    { num: 2, label: 'Add Vulnerabilities' },
    { num: 3, label: 'Preview Report' },
    { num: 4, label: 'Complete' },
  ];

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentModule = allModules.find((m) => m.id === selectedModuleId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Wizard Header Stepper */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <React.Fragment key={st.num}>
                <div
                  onClick={() => {
                    if (st.num === 1) {
                      setCurrentStep(1);
                    } else if (validateStep1()) {
                      setCurrentStep(st.num as any);
                    }
                  }}
                  className={`flex items-center gap-2.5 cursor-pointer ${
                    isCurrent
                      ? 'text-primary-700 font-bold'
                      : isCompleted
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-4 ring-primary-100'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <span className="text-xs sm:text-sm hidden md:inline">{st.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-6 ${
                      currentStep > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: REPORT DETAILS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {reportId ? 'Edit Report Details' : 'Step 1: Report Details'}
              </h2>
              <p className="text-xs text-slate-500">
                Define the target application, client metadata, testing environment, and assessment scope.
              </p>
            </div>
            {reportId && (
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 text-primary-700 border border-purple-200">
                Editing: {reportId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.length === 0 && (
              <div className="md:col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary-900">No projects available</p>
                  <p className="text-xs text-primary-700">Please create an assessment project before generating a report.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="px-3.5 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-primary-700 shrink-0"
                >
                  + Create Project First
                </button>
              </div>
            )}

            {/* Project Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={projects.length === 0}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 font-medium disabled:bg-slate-100 disabled:text-slate-400 ${
                  step1Errors.project
                    ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-primary-500/20'
                }`}
              >
                <option value="">-- Choose a Project * --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — {p.client}
                  </option>
                ))}
              </select>
              {step1Errors.project && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{step1Errors.project}</span>
                </p>
              )}
            </div>

            {/* Module Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Module <span className="text-red-500">*</span>
                </label>
                {selectedProjectId && (
                  <button
                    type="button"
                    onClick={() => setIsAddModuleOpen(true)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Module
                  </button>
                )}
              </div>

              <select
                value={selectedModuleId}
                onChange={(e) => handleModuleSelect(e.target.value)}
                disabled={!selectedProjectId || projectModules.length === 0}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 font-medium disabled:bg-slate-100 disabled:text-slate-400 ${
                  step1Errors.module
                    ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-primary-500/20'
                }`}
              >
                {!selectedProjectId ? (
                  <option value="">-- Select a project first --</option>
                ) : projectModules.length === 0 ? (
                  <option value="">-- No modules in this project --</option>
                ) : (
                  <>
                    <option value="">-- Choose a Module * --</option>
                    {projectModules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} Module
                      </option>
                    ))}
                  </>
                )}
              </select>

              {step1Errors.module && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{step1Errors.module}</span>
                </p>
              )}

              {selectedProjectId && projectModules.length === 0 && (
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-amber-800">
                    No modules exist in this project yet.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddModuleOpen(true)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-2xs"
                  >
                    + Add Module
                  </button>
                </div>
              )}
            </div>

            {/* Report Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reportName}
                onChange={(e) => {
                  setReportName(e.target.value);
                  if (e.target.value.trim()) {
                    setStep1Errors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                placeholder="e.g. Filumart - Buyer Module Security Assessment"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-hidden focus:ring-2 font-semibold ${
                  step1Errors.name
                    ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                    : 'border-slate-300 focus:ring-primary-500/20'
                }`}
              />
              {step1Errors.name && (
                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{step1Errors.name}</span>
                </p>
              )}
            </div>

            {/* Client / Organization */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client / Organization
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>

            {/* Application Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Application Name
              </label>
              <input
                type="text"
                value={applicationName}
                onChange={(e) => setApplicationName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>

            {/* Application URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Application URL / Endpoint
              </label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>

            {/* Environment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="Production">Production</option>
                <option value="QA">QA</option>
                <option value="Dev">Dev</option>
                <option value="Staging">Staging</option>
              </select>
            </div>

            {/* Prepared By */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prepared By
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>

            {/* Classification */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confidentiality Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as ReportClassification)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="Confidential">Confidential</option>
                <option value="Strictly Confidential">Strictly Confidential</option>
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
              </select>
            </div>

            {/* Assessment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assessment Type
              </label>
              <input
                type="text"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Report Template
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Executive Summary
            </label>
            <textarea
              rows={4}
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {(!selectedProjectId || !selectedModuleId || !reportName.trim()) ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {!selectedProjectId
                    ? 'Please select an assessment project to proceed.'
                    : !selectedModuleId
                    ? 'Please select an assessment module to proceed.'
                    : 'Please enter a report name to proceed.'}
                </span>
              </div>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNextToStep2}
              disabled={!selectedProjectId || !selectedModuleId || !reportName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors ml-auto"
            >
              <span>Next: Manage Vulnerabilities ({reportVulnerabilities.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ADD NEW VULNERABILITIES */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {reportId ? `Manage Findings for ${reportName}` : 'Step 2: Add Vulnerabilities'}
              </h2>
              <p className="text-xs text-slate-500">
                Add new vulnerabilities for this report. You can create multiple findings.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingVulnIndex(null);
                setIsVulnModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Vulnerability</span>
            </button>
          </div>

          {/* EMPTY STATE IF NO VULNERABILITIES IN THIS REPORT */}
          {reportVulnerabilities.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-primary-600">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No vulnerabilities added yet.</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Create new vulnerabilities and add them to this report.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingVulnIndex(null);
                  setIsVulnModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-primary-600/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Vulnerability</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Current Report Findings: <strong className="text-slate-900">{reportVulnerabilities.length}</strong>
                </span>
                <span className="text-primary-600 font-semibold">
                  You can edit, delete, or create additional vulnerabilities.
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {reportVulnerabilities.map((vuln, idx) => (
                  <div
                    key={vuln.id || idx}
                    className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{vuln.name}</h4>
                          <SeverityBadge severity={vuln.severity} score={vuln.cvssScore} showScore size="sm" />
                          <StatusBadge status={vuln.status} size="sm" />
                        </div>
                        <p className="text-xs font-mono text-slate-500 truncate max-w-lg">
                          Endpoint: {vuln.endpoint} [{vuln.endpointStatus}]
                        </p>
                        {vuln.evidence && vuln.evidence.length > 0 && (
                          <p className="text-[11px] text-primary-600 font-semibold">
                            ✓ {vuln.evidence.length} evidence attachment(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingVulnIndex(idx);
                          setIsVulnModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit finding"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingVulnIndex(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete finding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stepper Bottom Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
            >
              <span>Next: Preview Report ({reportVulnerabilities.length} findings)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REPORT PREVIEW */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 3: Report Preview</h2>
              <p className="text-xs text-slate-500">
                Review the generated VAPT document layout, tables, and vulnerability findings before finalizing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Vulnerabilities</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
              >
                <span>Proceed to Complete</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render Authentic Document Preview */}
          <A4ReportDocument
            report={{
              ...buildReportObject('Draft'),
              id: reportId || 'PREVIEW-TEMP-001',
              lastUpdated: new Date().toLocaleDateString('en-GB'),
            }}
          />

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
            >
              <span>Next: Finalize & Complete</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLETE REPORT */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {reportId ? 'Report Changes Ready to Save' : 'Report Ready for Generation'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              You are ready to {reportId ? 'save updates for' : 'publish'}{' '}
              <strong>{reportName}</strong> for <strong>{client}</strong> with{' '}
              <strong>{reportVulnerabilities.length} vulnerabilities</strong>.
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Project:</span>
              <span className="font-bold text-slate-800">{currentProject?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Module:</span>
              <span className="font-bold text-slate-800">{currentModule?.name || 'All Modules'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Findings:</span>
              <span className="font-bold text-primary-700">{reportVulnerabilities.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Classification:</span>
              <span className="font-bold text-red-700">{classification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Report Version:</span>
              <span className="font-mono font-bold text-slate-700">{reportVersion}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
            >
              Preview Document
            </button>

            <button
              type="button"
              onClick={() => setShowCompleteConfirm(true)}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/30 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{reportId ? 'Save & Update Report' : 'Complete Report'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Vulnerability Form Modal */}
      <VulnerabilityFormModal
        isOpen={isVulnModalOpen}
        onClose={() => {
          setIsVulnModalOpen(false);
          setEditingVulnIndex(null);
        }}
        onSave={handleSaveVulnerability}
        initialData={editingVulnIndex !== null ? reportVulnerabilities[editingVulnIndex] : null}
        projectId={selectedProjectId}
        moduleId={selectedModuleId}
        projectName={currentProject?.name}
        moduleName={currentModule?.name || 'General'}
        allowGlobalToggle={true}
      />

      {/* Complete Report Confirmation */}
      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleCompleteReport}
        title={reportId ? 'Update Report' : 'Complete and Finalize Report'}
        message={`Are you sure you want to ${reportId ? 'save updates to' : 'finalize'} this report with ${reportVulnerabilities.length} vulnerabilities?`}
        confirmText={reportId ? 'Yes, Save Report' : 'Yes, Complete Report'}
        variant="success"
      />

      {/* Delete Finding from Report Confirmation */}
      <ConfirmDialog
        isOpen={deletingVulnIndex !== null}
        onClose={() => setDeletingVulnIndex(null)}
        onConfirm={handleDeleteReportVuln}
        title="Remove Finding from Report"
        message="Are you sure you want to remove this vulnerability from this report?"
        confirmText="Remove"
        variant="danger"
      />

      {/* Add Module Inline Modal */}
      <Modal
        isOpen={isAddModuleOpen}
        onClose={() => setIsAddModuleOpen(false)}
        title="Add Assessment Module"
        subtitle={`Create a new scope module for ${currentProject?.name || 'the selected project'}`}
      >
        <form onSubmit={handleCreateModuleInline} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Authentication, Payment Gateway, API Backend"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Application URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://qa-seller.filumart.com/login"
              value={newModuleUrl}
              onChange={(e) => setNewModuleUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Environment
            </label>
            <select
              value={newModuleEnvironment}
              onChange={(e) => setNewModuleEnvironment(e.target.value as ProjectEnvironment)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="Production">Production</option>
              <option value="QA">QA</option>
              <option value="Dev">Dev</option>
              <option value="Staging">Staging</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Scoped Components
            </label>
            <textarea
              rows={3}
              placeholder="Components, services, or endpoints covered in this module..."
              value={newModuleDescription}
              onChange={(e) => setNewModuleDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModuleOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
            >
              Add Module & Select
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
