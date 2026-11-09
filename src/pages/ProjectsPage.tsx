import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Project, ProjectEnvironment, ProjectStatus } from '../types';
import { storage } from '../services/storage';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavTab } from '../components/layout/Sidebar';

interface ProjectsPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<string>('All Environments');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    client: string;
    applicationUrl?: string;
    environment: ProjectEnvironment;
    status: ProjectStatus;
    description: string;
  }>({
    name: '',
    client: '',
    applicationUrl: '',
    environment: 'Production',
    status: 'In Progress',
    description: '',
  });

  const refreshProjects = () => {
    setProjects(storage.getProjects());
  };

  useEffect(() => {
    const handleDataChanged = () => {
      refreshProjects();
    };
    window.addEventListener('vapt_data_changed', handleDataChanged);
    return () => window.removeEventListener('vapt_data_changed', handleDataChanged);
  }, []);

  // Filtered and sorted projects
  const filteredProjects = projects.filter((p) => {
    const pModules = storage.getModules(p.id);
    const modEnvs = pModules.map((m) => m.environment).filter(Boolean);
    const allEnvs = [p.environment, ...modEnvs].filter(Boolean);

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.applicationUrl && p.applicationUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pModules.some(
        (m) =>
          (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (m.applicationUrl && m.applicationUrl.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    const matchesEnv =
      envFilter === 'All Environments' ||
      allEnvs.includes(envFilter as ProjectEnvironment);

    const matchesStatus =
      statusFilter === 'All Status' || p.status === statusFilter;

    return matchesSearch && matchesEnv && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      client: '',
      applicationUrl: '',
      environment: 'Production',
      status: 'In Progress',
      description: '',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      applicationUrl: project.applicationUrl || '',
      environment: project.environment || 'Production',
      status: project.status,
      description: project.description,
    });
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.client.trim()) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      client: formData.client.trim(),
      applicationUrl: formData.applicationUrl?.trim() || undefined,
      description: formData.description.trim(),
    };

    if (editingProject) {
      storage.updateProject(editingProject.id, payload);
      setEditingProject(null);
    } else {
      storage.addProject(payload);
      setIsCreateOpen(false);
    }
    refreshProjects();
  };

  const handleDeleteConfirm = () => {
    if (deletingProjectId) {
      storage.deleteProject(deletingProjectId);
      setDeletingProjectId(null);
      refreshProjects();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs text-slate-500">
            Manage your assessment projects, environments, and scopes
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {/* Filters Bar matching screenshot */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={envFilter}
            onChange={(e) => {
              setEnvFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option>All Environments</option>
            <option>Production</option>
            <option>QA</option>
            <option>Dev</option>
            <option>Staging</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-primary-500 cursor-pointer"
          >
            <option>All Status</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Planning</option>
            <option>On Hold</option>
          </select>
        </div>
      </div>

      {/* Excel-like Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Project ID</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client / Organization</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4 text-center">Modules</th>
                <th className="py-3 px-4 text-center">Vulns</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-primary-600">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">No projects found</p>
                        <p className="text-xs text-slate-400">
                          {projects.length === 0
                            ? 'Get started by creating your first assessment project.'
                            : 'No projects match your current search and filter criteria.'}
                        </p>
                      </div>
                      {projects.length === 0 && (
                        <button
                          onClick={handleOpenCreate}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          + Create Project
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p, index) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const pModules = storage.getModules(p.id);
                  const envList = Array.from(new Set([p.environment, ...pModules.map((m) => m.environment)].filter(Boolean)));
                  const displayEnv = envList.length > 0 ? envList.join(', ') : (p.environment || '—');
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onNavigate('project-details', { projectId: p.id })}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary-700">
                        {p.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.client}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{displayEnv}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.modulesCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                          {p.vulnsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{p.createdDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onNavigate('project-details', { projectId: p.id })}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Project Modules"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProjectId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProjects.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="projects"
        />
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isCreateOpen || editingProject !== null}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingProject(null);
        }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        subtitle="Configure assessment scope and client details"
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Core Platform / Customer Portal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Client / Organization <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corporation"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Environment <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.environment}
                onChange={(e) =>
                  setFormData({ ...formData, environment: e.target.value as ProjectEnvironment })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 cursor-pointer font-medium"
              >
                <option value="Production">Production</option>
                <option value="QA">QA</option>
                <option value="Staging">Staging</option>
                <option value="Dev">Dev</option>
                <option value="UAT">UAT</option>
                <option value="Internal">Internal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ProjectStatus })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 cursor-pointer"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Planning">Planning</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Application URL
            </label>
            <input
              type="url"
              placeholder="https://app.example.com"
              value={formData.applicationUrl || ''}
              onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Scope details, target architecture, or client notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingProject(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingProjectId !== null}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated modules and scope definitions will be removed."
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
};

