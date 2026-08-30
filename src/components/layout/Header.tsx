import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Terminal,
  Moon,
  Sun,
  Sparkles,
  Monitor
} from 'lucide-react';
import { User, SystemSettings, AppTheme } from '../../types';

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onNavigate: (route: string) => void;
  activeRoute: string;
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  activeRoute,
  settings,
  onUpdateSettings,
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  const [time, setTime] = useState<string>('');
  const isHmi = settings.theme === 'hmi' || settings.theme === 'industrial-dark';
  const isLight = settings.theme === 'light';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-GB', { hour12: false }) + ' ' + 
        now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const nextLang = settings.language === 'EN' ? 'TH' : settings.language === 'TH' ? 'DUAL' : 'EN';
    onUpdateSettings({ ...settings, language: nextLang });
  };

  const toggleSound = () => {
    onUpdateSettings({ ...settings, enableSoundAlerts: !settings.enableSoundAlerts });
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = isHmi ? 'dark' : 'hmi';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const setTheme = (theme: AppTheme) => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <header 
      className={`sticky top-0 z-40 shadow-lg select-none transition-colors duration-200 ${
        isHmi 
          ? 'bg-black border-b-2 border-green-500 text-green-400 font-mono shadow-black/80' 
          : isLight
          ? 'bg-white border-b border-slate-200 text-slate-900 font-sans shadow-slate-200/80'
          : 'bg-[#0B1120] border-b border-slate-800 text-slate-100 font-sans shadow-slate-950/60'
      }`}
    >
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle Button + Brand Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Sidebar Hide/Show Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 sm:p-2 rounded border transition-colors flex items-center justify-center shadow-sm ${
              isHmi
                ? 'bg-black hover:bg-green-950/60 text-green-400 hover:text-green-300 border-green-500/70'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={sidebarCollapsed ? "เปิดแท็บเมนู (Open Sidebar)" : "ซ่อนแท็บเมนู (Hide Sidebar)"}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className={`w-5 h-5 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
            ) : (
              <PanelLeftClose className={`w-5 h-5 ${isHmi ? 'text-green-400/80' : 'text-slate-400'}`} />
            )}
          </button>

          {/* Logo Icon */}
          <div 
            className={`p-1.5 rounded flex items-center justify-center shadow-sm border ${
              isHmi
                ? 'bg-green-950/80 border-green-500 text-green-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isHmi ? <Terminal className="w-5 h-5" /> : <Monitor className="w-5 h-5 text-cyan-400" />}
          </div>

          {/* Main Title Heading */}
          <div>
            <div className="flex items-center gap-2">
              <h1 
                className={`font-extrabold text-base sm:text-lg md:text-xl tracking-wider uppercase ${
                  isHmi ? 'text-green-400 text-matrix-glow font-mono' : 'text-white tracking-normal font-sans'
                }`}
              >
                FIN DIE SHOT CONTROL
              </h1>
              <span 
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                  isHmi 
                    ? 'bg-green-950 text-green-300 border-green-500' 
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                }`}
              >
                <Radio className={`w-2.5 h-2.5 animate-pulse ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                {isHmi ? 'HMI ACTIVE' : 'LIVE ONLINE'}
              </span>
            </div>
            <p 
              className={`text-[10px] sm:text-[11px] tracking-tight ${
                isHmi ? 'text-green-500/80 font-mono' : 'text-slate-400 font-sans'
              }`}
            >
              TOOLING SHOT LIFETIME & INDUSTRIAL PREVENTIVE MONITOR <span className="text-zinc-500">|</span> <span className={isHmi ? 'text-green-300/90 font-thai' : 'text-slate-300 font-thai'}>ระบบบันทึกและควบคุมช็อตแม่พิมพ์</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Live Clock & Plant Status & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Quick Switcher Pill */}
          <div className={`flex items-center gap-0.5 p-1 rounded-lg border text-xs font-mono shadow-sm ${
            isHmi 
              ? 'bg-black border-green-800' 
              : isLight 
              ? 'bg-slate-100 border-slate-300' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                settings.theme === 'light'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : isHmi ? 'text-green-500/70 hover:text-green-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Theme สว่าง (Light Mode)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">สว่าง</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                settings.theme === 'dark'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow'
                  : isHmi ? 'text-green-500/70 hover:text-green-400' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Theme มืด (Dark Slate)"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">มืด</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('hmi')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                isHmi
                  ? 'bg-green-500 text-black font-extrabold shadow ring-1 ring-green-300'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Theme อุตสาหกรรม (Industrial Black HMI)"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">อุตสาหกรรม</span>
            </button>
          </div>

          {/* Clock */}
          <div 
            className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded border font-mono text-xs shadow-inner ${
              isHmi
                ? 'bg-zinc-950 border-green-500/60 text-green-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
              <span className="tracking-widest font-bold">{time}</span>
            </div>
            <div className={`h-3 w-px ${isHmi ? 'bg-green-800' : 'bg-slate-700'}`} />
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-ping ${isHmi ? 'bg-green-400' : 'bg-emerald-400'}`} />
              <span className={`font-bold tracking-wider ${isHmi ? 'text-green-400' : 'text-emerald-400'}`}>
                LINES E1-E6 ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


