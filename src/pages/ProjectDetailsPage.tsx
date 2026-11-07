import React, { useState } from 'react';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FolderKanban,
  ShieldAlert,
  ArrowLeft,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Project, Module, ProjectEnvironment } from '../types';
import { storage } from '../services/storage';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';

interface ProjectDetailsPageProps {
  projectId: string;
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  projectId,
  onNavigate,
}) => {
  const [project, setProject] = useState<Project | undefined>(() =>
    storage.getProjectById(projectId) || storage.getProjects()[0]
  );
  const [modules, setModules] = useState<Module[]>(() =>
    storage.getModules(project?.id)
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'reports' | 'activity'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  // Module modal states
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({
    name: '',
    applicationUrl: '',
    environment: 'QA' as ProjectEnvironment,
    description: '',
  });

  const refreshModules = () => {
    if (project) {
      setModules(storage.getModules(project.id));
      setProject(storage.getProjectById(project.id));
    }
  };

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500">Project not found.</p>
        <button
          onClick={() => onNavigate('projects')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  // Summary counts
  const projectVulns = project ? storage.getProjectVulnerabilities(project.id, project) : [];
  const moduleVulnsSum = modules.reduce((acc, m) => acc + (m.vulnsCount || 0), 0);
  const totalVulns = Math.max(moduleVulnsSum, projectVulns.length, project.vulnsCount || 0);
  const criticalTotal = Math.max(
    modules.reduce((acc, m) => acc + (m.criticalCount || 0), 0),
    projectVulns.filter((v) => v.severity === 'Critical').length
  );
  const highTotal = Math.max(
    modules.reduce((acc, m) => acc + (m.highCount || 0), 0),
    projectVulns.filter((v) => v.severity === 'High').length
  );
  const mediumTotal = Math.max(
    modules.reduce((acc, m) => acc + (m.mediumCount || 0), 0),
    projectVulns.filter((v) => v.severity === 'Medium').length
  );
  const lowTotal = Math.max(
    modules.reduce((acc, m) => acc + (m.lowCount || 0), 0),
    projectVulns.filter((v) => v.severity === 'Low').length
  );
  const infoTotal = Math.max(
    modules.reduce((acc, m) => acc + (m.infoCount || 0), 0),
    projectVulns.filter((v) => v.severity === 'Info' || v.severity === 'Informational').length
  );

  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModuleForm({
      name: '',
      applicationUrl: '',
      environment: 'QA',
      description: '',
    });
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleForm({
      name: mod.name,
      applicationUrl: mod.applicationUrl || '',
      environment: mod.environment || 'QA',
      description: mod.description,
    });
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) return;

    if (editingModule) {
      storage.updateModule(editingModule.id, {
        name: moduleForm.name.trim(),
        applicationUrl: moduleForm.applicationUrl.trim(),
        environment: moduleForm.environment,
        description: moduleForm.description.trim(),
      });
    } else {
      storage.addModule({
        projectId: project.id,
        name: moduleForm.name.trim(),
        applicationUrl: moduleForm.applicationUrl.trim(),
        environment: moduleForm.environment,
        description: moduleForm.description.trim(),
      });
    }
    setIsModuleModalOpen(false);
    refreshModules();
  };

  const handleDeleteModule = () => {
    if (deletingModuleId) {
      storage.deleteModule(deletingModuleId);
      setDeletingModuleId(null);
      refreshModules();
    }
  };

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.applicationUrl && m.applicationUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.environment && m.environment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card matching screenshot */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button
                onClick={() => onNavigate('projects')}
                className="hover:text-primary-600 transition-colors"
              >
                Projects
              </button>
              <span>/</span>
              <span className="font-semibold text-slate-800">{project.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {project.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client: <strong className="text-slate-700">{project.client}</strong> | Environment:{' '}
              <strong className="text-slate-700">{project.environment}</strong>
              {project.applicationUrl && (
                <>
                  {' '}
                  | Target:{' '}
                  <a
                    href={project.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {project.applicationUrl}
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Quick Stat Badges from screenshot */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <span className="block text-lg font-black text-primary-700 leading-none">
                {modules.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                Modules
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <span className="block text-lg font-black text-slate-900 leading-none">
                {totalVulns}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vulnerabilities
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-center">
              <span className="block text-lg font-black text-red-700 leading-none">
                {criticalTotal}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Critical
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-center">
              <span className="block text-lg font-black text-red-500 leading-none">{highTotal}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                High
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="block text-lg font-black text-amber-600 leading-none">
                {mediumTotal}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Medium
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="block text-lg font-black text-emerald-600 leading-none">
                {lowTotal}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Low
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="block text-lg font-black text-blue-600 leading-none">
                {infoTotal}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Info
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-6 border-t border-slate-100 pt-3 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'modules', label: 'Modules' },
            { id: 'reports', label: 'Reports' },
            { id: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-1 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <button
              onClick={handleOpenAddModule}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Module</span>
            </button>
          </div>

          {/* Modules Table matching screenshot */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Module Name</th>
                    <th className="py-3 px-4">Target Application URL</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center text-red-700">Critical</th>
                    <th className="py-3 px-4 text-center text-red-500">High</th>
                    <th className="py-3 px-4 text-center text-amber-600">Medium</th>
                    <th className="py-3 px-4 text-center text-emerald-600">Low</th>
                    <th className="py-3 px-4 text-center text-blue-600">Info</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredModules.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        No modules created for this project yet.
                      </td>
                    </tr>
                  ) : (
                    filteredModules.map((m, index) => (
                      <tr
                        key={m.id}
                        onClick={() =>
                          onNavigate('vulnerabilities', {
                            projectId: project.id,
                            moduleId: m.id,
                          })
                        }
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-primary-600 transition-colors whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[200px] truncate">
                          {m.applicationUrl ? (
                            <a
                              href={m.applicationUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary-600 hover:underline flex items-center gap-1.5"
                              title={m.applicationUrl}
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{m.applicationUrl}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              m.environment === 'Production'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : m.environment === 'Staging'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : m.environment === 'Dev'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {m.environment || 'QA'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {m.description || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100">
                            {m.vulnsCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-red-700">
                          {m.criticalCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-red-500">
                          {m.highCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                          {m.mediumCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                          {m.lowCount}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                          {m.infoCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                onNavigate('vulnerabilities', {
                                  projectId: project.id,
                                  moduleId: m.id,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Module Vulnerabilities"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModule(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Module"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingModuleId(m.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Project Overview</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Client Organization:</span>
              <span className="font-bold text-slate-800">{project.client}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Created Date:</span>
              <span className="font-bold text-slate-800">{project.createdDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Environment:</span>
              <span className="font-bold text-slate-800">{project.environment}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Project Reports</h3>
            <button
              onClick={() => onNavigate('create-report', { projectId: project.id })}
              className="px-3.5 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold"
            >
              + Create Report for this Project
            </button>
          </div>
          <div className="space-y-2">
            {storage
              .getReports()
              .filter((r) => r.projectId === project.id)
              .map((r) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('detailed-report', { reportId: r.id })}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="text-slate-500">{r.assessmentType} • {r.lastUpdated}</p>
                  </div>
                  <span className="text-primary-600 font-bold hover:underline">
                    View Report →
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Project Audit History</h3>
          <div className="space-y-3">
            {storage
              .getActivities()
              .filter((a) => a.targetId === project.id || a.targetId?.includes('FIL'))
              .map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 rounded-lg text-xs flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{act.title}</p>
                    <p className="text-slate-500">{act.description}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{act.timestamp}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Module Create/Edit Modal */}
      <Modal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Add New Module'}
        subtitle={`Configure scope module for ${project.name}`}
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Payment Gateway"
              value={moduleForm.name}
              onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Application URL
            </label>
            <input
              type="url"
              placeholder="https://qa-seller.filumart.com/login"
              value={moduleForm.applicationUrl}
              onChange={(e) => setModuleForm({ ...moduleForm, applicationUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Environment
            </label>
            <select
              value={moduleForm.environment}
              onChange={(e) =>
                setModuleForm({ ...moduleForm, environment: e.target.value as ProjectEnvironment })
              }
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
              placeholder="Features, endpoints, and functionalities covered in this module..."
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModuleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
            >
              {editingModule ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Module Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingModuleId !== null}
        onClose={() => setDeletingModuleId(null)}
        onConfirm={handleDeleteModule}
        title="Delete Module"
        message="Are you sure you want to delete this module? This action cannot be undone."
        confirmText="Delete Module"
        variant="danger"
      />
    </div>
  );
};

