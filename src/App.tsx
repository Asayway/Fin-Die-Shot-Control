import { useState, useEffect } from 'react';
import { User, ProductionLineId, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { gatewayService } from './services/gatewayService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Direct View Imports for instant synchronous rendering
import { TvDashboardView } from './components/tv/TvDashboardView';
import { ShotEntryView } from './views/ShotEntryView';
import { ReplacementEntryView } from './views/ReplacementEntryView';
import { UnifiedToolingMasterView } from './views/UnifiedToolingMasterView';
import { ReportsView } from './views/ReportsView';
import { PLCDataConnectionView } from './views/PLCDataConnectionView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { LoginView } from './views/LoginView';

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
      case 'lock-position':
      case 'die-layout':
        return <ReplacementEntryView initialLineId={targetLineId} />;
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
      case 'reports':
        return <ReportsView />;
      case 'plc-config':
      case 'gateway-config':
        return <PLCDataConnectionView />;
      case 'system-settings':
        return <SystemSettingsView onNavigate={handleNavigate} />;
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
        <ErrorBoundary>
          <TvDashboardView
            initialLineId={targetLineId}
            isFullscreenMode={true}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col ios-spring theme-dark liquid-backdrop text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
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

      {/* Main Shell: Floating Sidebar + Glass Viewport */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar - Detached Floating Glass Island */}
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
          userRole={currentUser.role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          language={settings.language}
        />

        {/* Content Body - Independent scrollable view container */}
        <main className={`flex-1 min-h-0 ${activeRoute === 'tv-monitoring' ? 'overflow-hidden p-0 flex flex-col' : 'overflow-y-auto p-2 sm:p-3 lg:p-3.5 custom-scrollbar'} transition-all duration-300 w-full text-slate-100`}>
          <div className={`w-full ${activeRoute === 'tv-monitoring' ? 'h-full flex-1 flex flex-col overflow-hidden' : 'pb-6'}`}>
            <ErrorBoundary>
              {renderActiveView()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
