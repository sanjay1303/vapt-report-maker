import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { ReportsPage } from './pages/ReportsPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { DetailedReportPage } from './pages/DetailedReportPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { SettingsPage } from './pages/SettingsPage';
import { storage } from './services/storage';
import { Settings } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('tab') as NavTab) || 'dashboard';
  });
  const [navParams, setNavParams] = useState<any>(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('reportId');
    const projectId = params.get('projectId');
    return { reportId: reportId || undefined, projectId: projectId || undefined };
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());

  const handleNavigate = (tab: NavTab, params: any = {}) => {
    setCurrentTab(tab);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllData = () => {
    storage.clearAllData();
    setCurrentTab('dashboard');
    window.location.reload();
  };

  const handleLoadSampleData = () => {
    storage.loadSampleData();
    setCurrentTab('dashboard');
    window.location.reload();
  };

  const handleResetData = () => {
    storage.clearAllData();
    setSettings(storage.getSettings());
    setCurrentTab('dashboard');
    window.location.reload();
  };

  // Get current page header metadata
  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Overview of your VAPT assessments and reports',
          breadcrumbs: [],
        };
      case 'projects':
        return {
          title: 'Projects',
          subtitle: 'Manage your assessment projects',
          breadcrumbs: [{ label: 'Dashboard', onClick: () => handleNavigate('dashboard') }],
        };
      case 'project-details':
        return {
          title: 'Project Details – Modules',
          subtitle: 'Assessment scope and module vulnerability breakdown',
          breadcrumbs: [
            { label: 'Projects', onClick: () => handleNavigate('projects') },
            { label: 'Project Details' },
          ],
        };
      case 'vulnerabilities':
        return {
          title: 'Vulnerabilities',
          subtitle: 'Manage and track all security findings',
          breadcrumbs: [{ label: 'Dashboard', onClick: () => handleNavigate('dashboard') }],
        };
      case 'reports':
        return {
          title: 'Reports',
          subtitle: 'View and manage generated VAPT reports',
          breadcrumbs: [{ label: 'Dashboard', onClick: () => handleNavigate('dashboard') }],
        };
      case 'create-report':
        return {
          title: 'Create Report',
          subtitle: 'Create a new VAPT report with findings and evidence',
          breadcrumbs: [
            { label: 'Reports', onClick: () => handleNavigate('reports') },
            { label: 'Create' },
          ],
        };
      case 'detailed-report':
        return {
          title: 'Detailed VAPT Report (Preview)',
          subtitle: 'Official assessment document preview and export',
          breadcrumbs: [
            { label: 'Reports', onClick: () => handleNavigate('reports') },
            { label: navParams.reportId || 'FILUMART-VAPT-001' },
          ],
        };
      case 'templates':
        return {
          title: 'Templates',
          subtitle: 'Manage report templates and formats',
          breadcrumbs: [{ label: 'Dashboard', onClick: () => handleNavigate('dashboard') }],
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Configure company branding, severity colors, and defaults',
          breadcrumbs: [{ label: 'Dashboard', onClick: () => handleNavigate('dashboard') }],
        };
      default:
        return { title: 'VAPT Report Maker', subtitle: '', breadcrumbs: [] };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex print:block print:bg-white print:min-h-0">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 ml-64 flex flex-col min-w-0 transition-all duration-300 ${currentTab === 'detailed-report' ? 'h-screen overflow-hidden' : ''} print:ml-0 print:m-0 print:p-0 print:w-full print:block print:h-auto print:overflow-visible`}>
        {/* Sticky Top Navbar */}
        <TopNavbar
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          breadcrumbs={headerMeta.breadcrumbs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          settings={settings}
          onProfileClick={() => handleNavigate('settings')}
          onNavigate={handleNavigate}
        />

        {/* Page Content */}
        <main className={`flex-1 ${currentTab === 'detailed-report' ? 'p-4 sm:px-6 sm:py-4 h-[calc(100vh-4rem)] overflow-hidden' : 'p-6 sm:p-8'} max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:block print:h-auto print:overflow-visible`}>
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'projects' && (
            <ProjectsPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'project-details' && (
            <ProjectDetailsPage
              projectId={navParams.projectId || 'prj-001'}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'vulnerabilities' && (
            <VulnerabilitiesPage
              initialProjectId={navParams.projectId}
              initialModuleId={navParams.moduleId}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'create-report' && (
            <CreateReportPage
              reportId={navParams.reportId}
              initialProjectId={navParams.projectId}
              initialTemplateId={navParams.initialTemplateId}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'detailed-report' && (
            <DetailedReportPage
              reportId={navParams.reportId || 'FILUMART-VAPT-001'}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'templates' && (
            <TemplatesPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={setSettings}
              onClearAllData={handleClearAllData}
              onLoadSampleData={handleLoadSampleData}
              onResetData={handleResetData}
              initialTab={navParams?.tab}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

