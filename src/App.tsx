import React, { useState, useEffect } from 'react';
import { User, ProductionLineId, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { TvDashboardView } from './components/tv/TvDashboardView';
import { LineOverviewView } from './views/LineOverviewView';
import { ShotEntryView } from './views/ShotEntryView';
import { ReplacementEntryView } from './views/ReplacementEntryView';
import { RegrindingEntryView } from './views/RegrindingEntryView';
import { ConditionInspectionView } from './views/ConditionInspectionView';
import { LineConfigurationView, PartMasterView } from './views/LineConfigurationView';
import { PartLifeStandardSetupView, InstallQuantitySetupView } from './views/PartLifeStandardSetupView';
import { SpareStockProcurementView, ReplacementHistoryView } from './views/SpareStockProcurementView';
import { ReportsView, UserApprovalView, AuditLogView } from './views/ReportsView';
import { SystemSettingsView, LoginView } from './views/SystemSettingsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [activeRoute, setActiveRoute] = useState<string>('tv-monitoring');
  const [targetLineId, setTargetLineId] = useState<ProductionLineId>('E6');
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [isTvFullscreen, setIsTvFullscreen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setSettings(storageService.getSettings());
      setCurrentUser(storageService.getCurrentUser());
    });
    return () => unsub();
  }, []);

  const handleNavigate = (route: string, lineId?: ProductionLineId) => {
    setActiveRoute(route);
    if (lineId) {
      setTargetLineId(lineId);
    }
  };

  const handleToggleFullscreen = () => {
    setIsTvFullscreen(!isTvFullscreen);
  };

  const renderActiveView = () => {
    switch (activeRoute) {
      case 'tv-monitoring':
        return (
          <TvDashboardView
            initialLineId={targetLineId}
            isFullscreenMode={isTvFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        );
      case 'line-overview':
        return <LineOverviewView onNavigate={handleNavigate} />;
      case 'shot-entry':
        return <ShotEntryView initialLineId={targetLineId} />;
      case 'replacement-entry':
        return <ReplacementEntryView initialLineId={targetLineId} />;
      case 'regrinding-entry':
        return <RegrindingEntryView />;
      case 'condition-inspection':
        return <ConditionInspectionView />;
      case 'line-configuration':
        return <LineConfigurationView />;
      case 'part-master':
        return <PartMasterView />;
      case 'life-standard-setup':
        return <PartLifeStandardSetupView />;
      case 'install-quantity-setup':
        return <InstallQuantitySetupView />;
      case 'spare-stock':
        return <SpareStockProcurementView />;
      case 'replacement-history':
        return <ReplacementHistoryView />;
      case 'reports':
        return <ReportsView />;
      case 'user-approval':
        return <UserApprovalView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'system-settings':
        return <SystemSettingsView />;
      case 'login':
        return (
          <LoginView
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              setActiveRoute('line-overview');
            }}
          />
        );
      default:
        return (
          <TvDashboardView
            initialLineId={targetLineId}
            isFullscreenMode={isTvFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        );
    }
  };

  // If in dedicated fullscreen TV mode, display without outer shell header/sidebar
  if (isTvFullscreen && activeRoute === 'tv-monitoring') {
    return (
      <div className="fixed inset-0 z-50 bg-[#070D18] overflow-auto">
        <TvDashboardView
          initialLineId={targetLineId}
          isFullscreenMode={true}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSelectUser={(u) => setCurrentUser(u)}
        onNavigate={handleNavigate}
        activeRoute={activeRoute}
        settings={settings}
        onUpdateSettings={(s) => setSettings(s)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Shell: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 bg-[#080E1B] custom-scrollbar transition-all duration-300">
          <div className="max-w-[1440px] mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
