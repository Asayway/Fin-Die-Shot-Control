import React, { useState, useEffect, Suspense } from 'react';
import { User, ProductionLineId, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewSkeleton } from './components/common/ViewSkeleton';

// Code Splitting & Lazy Loading for Views
const TvDashboardView = React.lazy(() => import('./components/tv/TvDashboardView').then(m => ({ default: m.TvDashboardView })));
const ShotEntryView = React.lazy(() => import('./views/ShotEntryView').then(m => ({ default: m.ShotEntryView })));
const ReplacementEntryView = React.lazy(() => import('./views/ReplacementEntryView').then(m => ({ default: m.ReplacementEntryView })));
const UnifiedToolingMasterView = React.lazy(() => import('./views/UnifiedToolingMasterView').then(m => ({ default: m.UnifiedToolingMasterView })));
const SystemSettingsView = React.lazy(() => import('./views/SystemSettingsView').then(m => ({ default: m.SystemSettingsView })));
const LoginView = React.lazy(() => import('./views/SystemSettingsView').then(m => ({ default: m.LoginView })));

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
      case 'regrinding-entry':
      case 'lock-position':
      case 'die-layout':
        return <ReplacementEntryView initialLineId={targetLineId} />;
      case 'line-configuration':
        return <UnifiedToolingMasterView initialTab="install" />;
      case 'unified-tooling-setup':
        return <UnifiedToolingMasterView initialTab="install" />;
      case 'part-master':
        return <UnifiedToolingMasterView initialTab="master" />;
      case 'life-standard-setup':
        return <UnifiedToolingMasterView initialTab="standards" />;
      case 'install-quantity-setup':
        return <UnifiedToolingMasterView initialTab="install" />;
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

  // If in dedicated fullscreen TV mode, display without outer shell header/sidebar, 100% viewport fit
  const isHmi = settings.theme === 'hmi' || settings.theme === 'industrial-dark';
  const isLight = settings.theme === 'light';

  if (isTvFullscreen && activeRoute === 'tv-monitoring') {
    return (
      <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col h-screen w-screen max-h-screen max-w-screen p-0 m-0 ${
        isHmi ? 'theme-hmi bg-black text-green-400 font-mono' : isLight ? 'theme-light bg-slate-100 text-slate-900 font-sans' : 'theme-dark bg-[#070D18] text-slate-100 font-sans'
      }`}>
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
    <div 
      className={`h-screen max-h-screen overflow-hidden flex flex-col transition-colors duration-200 ${
        isHmi
          ? 'theme-hmi bg-black text-green-400 font-mono selection:bg-green-500 selection:text-black'
          : isLight
          ? 'theme-light bg-slate-100 text-slate-900 font-sans selection:bg-cyan-600 selection:text-white'
          : 'theme-dark bg-[#070D18] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950'
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
          language={settings.language}
        />

        {/* Content Body - Independent scrollable view container */}
        <main className={`flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 lg:p-3.5 custom-scrollbar transition-all duration-300 ${
          isHmi ? 'bg-black text-green-400' : isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#080E1B] text-slate-100'
        }`}>
          <div className="max-w-[1440px] mx-auto pb-6">
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
