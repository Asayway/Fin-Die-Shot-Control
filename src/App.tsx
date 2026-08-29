import React, { useState, useEffect } from 'react';
import { User, ProductionLineId, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { TvDashboardView } from './components/tv/TvDashboardView';
import { ShotEntryView } from './views/ShotEntryView';
import { ReplacementEntryView } from './views/ReplacementEntryView';
import { RegrindingEntryView } from './views/RegrindingEntryView';
import { LockPositionView } from './views/LockPositionView';
import { LineConfigurationView, PartMasterView } from './views/LineConfigurationView';
import { PartLifeStandardSetupView, InstallQuantitySetupView } from './views/PartLifeStandardSetupView';
import { SpareStockProcurementView, ReplacementHistoryView } from './views/SpareStockProcurementView';
import { ReportsView } from './views/ReportsView';
import { SystemSettingsView, LoginView } from './views/SystemSettingsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [activeRoute, setActiveRoute] = useState<string>('shot-entry');
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

  // Sync with browser native fullscreen exit (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTvFullscreen) {
        setIsTvFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isTvFullscreen]);

  const handleNavigate = (route: string, lineId?: ProductionLineId) => {
    setActiveRoute(route);
    if (lineId) {
      setTargetLineId(lineId);
    }
  };

  const handleToggleFullscreen = () => {
    const nextState = !isTvFullscreen;
    setIsTvFullscreen(nextState);
    if (nextState) {
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (_) {}
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (_) {}
    }
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
      case 'shot-entry':
        return <ShotEntryView initialLineId={targetLineId} />;
      case 'replacement-entry':
        return <ReplacementEntryView initialLineId={targetLineId} />;
      case 'regrinding-entry':
        return <RegrindingEntryView />;
      case 'lock-position':
        return <LockPositionView initialLineId={targetLineId} />;
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
      case 'system-settings':
        return <SystemSettingsView />;
      case 'login':
        return (
          <LoginView
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              setActiveRoute('tv-monitoring');
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

  // If in dedicated fullscreen TV mode, display without outer shell header/sidebar, 100% viewport fit
  const isHmi = settings.theme === 'hmi' || settings.theme === 'industrial-dark';

  if (isTvFullscreen && activeRoute === 'tv-monitoring') {
    return (
      <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col h-screen w-screen max-h-screen max-w-screen p-0 m-0 ${
        isHmi ? 'bg-black text-green-400 font-mono' : 'bg-[#070D18] text-slate-100 font-sans'
      }`}>
        <TvDashboardView
          initialLineId={targetLineId}
          isFullscreenMode={true}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>
    );
  }

  return (
    <div 
      className={`h-screen max-h-screen overflow-hidden flex flex-col transition-colors duration-200 ${
        isHmi
          ? 'bg-black text-green-400 font-mono selection:bg-green-500 selection:text-black'
          : 'bg-[#070D18] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950'
      }`}
    >
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSelectUser={(u) => setCurrentUser(u)}
        onNavigate={handleNavigate}
        activeRoute={activeRoute}
        settings={settings}
        onUpdateSettings={(s) => {
          storageService.updateSettings(s);
          setSettings(s);
        }}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Shell: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar - Locked firmly in place */}
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={settings.theme}
        />

        {/* Content Body - High-Density desktop view container */}
        <main className={`flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 md:p-3.5 custom-scrollbar transition-all duration-300 ${
          isHmi ? 'bg-black' : 'bg-[#080E1B]'
        }`}>
          <div className="max-w-[1600px] mx-auto pb-4">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
