import React, { useState } from 'react';
import {
  Plus,
  Eye,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Template } from '../types';
import { storage } from '../services/storage';
import { Modal } from '../components/common/Modal';
import { NavTab } from '../components/layout/Sidebar';

interface TemplatesPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const [templates, setTemplates] = useState<Template[]>(() => storage.getTemplates());
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'General',
    description: '',
    sections: {
      documentInfo: true,
      executiveSummary: true,
      summaryOfFindings: true,
      detailedFindings: true,
    },
  });

  const refreshTemplates = () => {
    setTemplates(storage.getTemplates());
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    storage.addTemplate({
      name: newTemplate.name,
      category: newTemplate.category,
      description: newTemplate.description,
      isDefault: false,
      sections: newTemplate.sections,
    });

    setIsCreateModalOpen(false);
    setNewTemplate({
      name: '',
      category: 'General',
      description: '',
      sections: {
        documentInfo: true,
        executiveSummary: true,
        summaryOfFindings: true,
        detailedFindings: true,
      },
    });
    refreshTemplates();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Templates</h1>
          <p className="text-xs text-slate-500">
            Standardized report formats, section visibility, and layout structures
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-primary-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Grid of Templates matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                {tmpl.isDefault && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-primary-800 border border-purple-200">
                    Default
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                {tmpl.name}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{tmpl.description}</p>

              {/* Sections Included */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Included Sections:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Document Info
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Executive Summary
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Findings Summary
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Detailed Findings
                  </span>
                </div>
              </div>
            </div>

            {/* Template Card Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewTemplate(tmpl)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={() => onNavigate('create-report', { initialTemplateId: tmpl.id })}
                className="flex-1 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs shadow-primary-600/30 transition-colors flex items-center justify-center gap-1"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Custom Template Card matching screenshot */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-50/70 border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:scale-110 transition-all mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-primary-600">
            Custom Template
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            Create your own customized report template with tailored sections, branding, and rules.
          </p>
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold text-primary-700 bg-white border border-primary-200 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Preview Template Modal */}
      {previewTemplate && (
        <Modal
          isOpen={previewTemplate !== null}
          onClose={() => setPreviewTemplate(null)}
          title={`Template Preview: ${previewTemplate.name}`}
          subtitle={previewTemplate.category}
          maxWidth="2xl"
          footer={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = previewTemplate.id;
                  setPreviewTemplate(null);
                  onNavigate('create-report', { initialTemplateId: id });
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
              >
                Use This Template
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">{previewTemplate.description}</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Structure & Sections
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">1. Document Information Table</span>
                  <span className="text-emerald-700 font-bold">Enabled</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">2. Executive Summary</span>
                  <span className="text-emerald-700 font-bold">Enabled</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">3. Summary of Findings & Dynamic Chart</span>
                  <span className="text-emerald-700 font-bold">Enabled</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">4. Detailed Vulnerabilities with POC Evidence</span>
                  <span className="text-emerald-700 font-bold">Enabled</span>
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Template"
        subtitle="Define layout structure and active section modules"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Application Security Assessment"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={newTemplate.category}
              onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium"
            >
              <option value="General">General</option>
              <option value="Web Security">Web Security</option>
              <option value="API Security">API Security</option>
              <option value="Mobile Security">Mobile Security</option>
              <option value="Cloud Review">Cloud Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of this template purpose..."
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs"
            >
              Create Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

