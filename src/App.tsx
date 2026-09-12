import React, { useState, useEffect, Suspense } from 'react';
import { User, ProductionLineId, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { gatewayService } from './services/gatewayService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewSkeleton } from './components/common/ViewSkeleton';

// Code Splitting & Lazy Loading for Views
const TvDashboardView = React.lazy(() => import('./components/tv/TvDashboardView').then(m => ({ default: m.TvDashboardView })));
const ShotEntryView = React.lazy(() => import('./views/ShotEntryView').then(m => ({ default: m.ShotEntryView })));
const ReplacementEntryView = React.lazy(() => import('./views/ReplacementEntryView').then(m => ({ default: m.ReplacementEntryView })));
const RegrindingManagementView = React.lazy(() => import('./views/RegrindingManagementView').then(m => ({ default: m.RegrindingManagementView })));
const UnifiedToolingMasterView = React.lazy(() => import('./views/UnifiedToolingMasterView').then(m => ({ default: m.UnifiedToolingMasterView })));
const SystemSettingsView = React.lazy(() => import('./views/SystemSettingsView').then(m => ({ default: m.SystemSettingsView })));
const LoginView = React.lazy(() => import('./views/SystemSettingsView').then(m => ({ default: m.LoginView })));

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [activeRoute, setActiveRoute] = useState<string>('tv-monitoring');
  const [targetLineId, setTargetLineId] = useState<ProductionLineId>('E1');
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [isTvFullscreen, setIsTvFullscreen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Initialize gateway driver service on startup
    gatewayService.init();

    const unsub = storageService.subscribe(() => {
      setSettings(storageService.getSettings());
      setCurrentUser(storageService.getCurrentUser());
    });
    return () => {
      unsub();
      gatewayService.destroy();
    };
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
      case 'shot-entry':
        return (
          <TvDashboardView
            initialLineId={targetLineId}
            isFullscreenMode={isTvFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        );
      case 'replacement-entry':
      case 'lock-position':
      case 'die-layout':
        return <ReplacementEntryView initialLineId={targetLineId} />;
      case 'regrinding-management':
      case 'regrinding-entry':
      case 'regrinding':
        return (
          <RegrindingManagementView
            selectedLine={targetLineId}
            onNavigateToDieLayout={() => setActiveRoute('replacement-entry')}
            currentUserName={currentUser.name}
          />
        );
      case 'line-configuration':
        return <UnifiedToolingMasterView initialTab="specs" />;
      case 'unified-tooling-setup':
        return <UnifiedToolingMasterView initialTab="install" />;
      case 'part-master':
        return <UnifiedToolingMasterView initialTab="master" />;
      case 'life-standard-setup':
      case 'install-quantity-setup':
      case 'spare-stock':
        return <UnifiedToolingMasterView initialTab="install" />;
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

  if (isTvFullscreen && activeRoute === 'tv-monitoring') {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden flex flex-col h-screen w-screen max-h-screen max-w-screen p-0 m-0 theme-dark bg-[#000000] text-slate-100 font-sans">
        <Suspense fallback={<ViewSkeleton />}>
          <TvDashboardView
            initialLineId={targetLineId}
            isFullscreenMode={true}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col transition-colors duration-200 theme-dark bg-[#000000] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
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
      <div className="flex-1 flex overflow-hidden min-h-0 relative bg-[#000000]">
        {/* Sidebar - Locked firmly in place */}
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          language={settings.language}
        />

        {/* Content Body - Independent scrollable view container */}
        <main className={`flex-1 min-h-0 ${activeRoute === 'tv-monitoring' ? 'overflow-hidden p-0 bg-[#000000] flex flex-col' : 'overflow-y-auto p-2 sm:p-2.5 lg:p-3 custom-scrollbar'} transition-all duration-300 w-full bg-[#000000] text-slate-100`}>
          <div className={`w-full ${activeRoute === 'tv-monitoring' ? 'h-full flex-1 flex flex-col overflow-hidden' : 'pb-4'}`}>
            <ErrorBoundary>
              <Suspense fallback={<ViewSkeleton />}>
                {renderActiveView()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
