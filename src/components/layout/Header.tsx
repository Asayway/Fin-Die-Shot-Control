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
      className={`sticky top-0 z-40 shadow select-none transition-colors duration-200 ${
        isHmi 
          ? 'bg-black border-b-2 border-green-500 text-green-400 font-mono shadow-black/80' 
          : 'bg-[#0B1120] border-b border-slate-800 text-slate-100 font-sans shadow-slate-950/60'
      }`}
    >
      <div className="px-2.5 sm:px-3.5 py-1.5 flex items-center justify-between gap-2.5">
        {/* Left: Sidebar Toggle Button + Brand Title */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Sidebar Hide/Show Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`p-1 sm:p-1.5 rounded border transition-colors flex items-center justify-center shadow-sm ${
              isHmi
                ? 'bg-black hover:bg-green-950/60 text-green-400 hover:text-green-300 border-green-500/70'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={sidebarCollapsed ? "เปิดแท็บเมนู (Open Sidebar)" : "ซ่อนแท็บเมนู (Hide Sidebar)"}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className={`w-4 h-4 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
            ) : (
              <PanelLeftClose className={`w-4 h-4 ${isHmi ? 'text-green-400/80' : 'text-slate-400'}`} />
            )}
          </button>

          {/* Logo Icon */}
          <div 
            className={`p-1 rounded flex items-center justify-center shadow-sm border ${
              isHmi
                ? 'bg-green-950/80 border-green-500 text-green-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isHmi ? <Terminal className="w-4 h-4" /> : <Monitor className="w-4 h-4 text-cyan-400" />}
          </div>

          {/* Main Title Heading */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 
                className={`font-bold text-xs sm:text-sm md:text-base tracking-wide uppercase ${
                  isHmi ? 'text-green-400 text-matrix-glow font-mono' : 'text-white tracking-normal font-sans'
                }`}
              >
                FIN DIE SHOT CONTROL
              </h1>
              <span 
                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border font-mono ${
                  isHmi 
                    ? 'bg-green-950 text-green-300 border-green-500' 
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                }`}
              >
                <Radio className={`w-2 h-2 animate-pulse ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                {isHmi ? 'HMI ACTIVE' : 'LIVE'}
              </span>
            </div>
            <p 
              className={`text-[9px] sm:text-[10px] tracking-tight leading-tight ${
                isHmi ? 'text-green-500/80 font-mono' : 'text-slate-400 font-sans'
              }`}
            >
              TOOLING SHOT LIFETIME & INDUSTRIAL PREVENTIVE MONITOR <span className="text-zinc-500">|</span> <span className={isHmi ? 'text-green-300/90 font-thai' : 'text-slate-300 font-thai'}>ระบบบันทึกและควบคุมช็อตแม่พิมพ์</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Live Clock & Plant Status & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Clock */}
          <div 
            className={`hidden md:flex items-center gap-2.5 px-2.5 py-1 rounded border font-mono text-[11px] shadow-inner ${
              isHmi
                ? 'bg-zinc-950 border-green-500/60 text-green-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
              <span className="tracking-wider font-bold">{time}</span>
            </div>
            <div className={`h-2.5 w-px ${isHmi ? 'bg-green-800' : 'bg-slate-700'}`} />
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isHmi ? 'bg-green-400' : 'bg-emerald-400'}`} />
              <span className={`font-bold tracking-wider ${isHmi ? 'text-green-400' : 'text-emerald-400'}`}>
                LINES E1-E6 ONLINE
              </span>
            </div>
          </div>

          {/* Controls: Theme Switcher, Language, Sound */}
          <div className="flex items-center gap-1">
            {/* Direct Theme Switcher Selector (Theme มืด vs Theme HMI) */}
            <div 
              className={`flex items-center p-0.5 rounded border ${
                isHmi ? 'bg-zinc-950 border-green-700' : 'bg-slate-900 border-slate-700'
              }`}
            >
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  !isHmi
                    ? 'bg-cyan-500 text-slate-950 shadow font-extrabold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Theme มืด (Dark Slate Theme)"
              >
                <Moon className="w-3 h-3" />
                <span className="hidden sm:inline">Theme มืด</span>
                <span className="sm:hidden">Dark</span>
              </button>

              <button
                onClick={() => setTheme('hmi')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                  isHmi
                    ? 'bg-green-500 text-black shadow font-black'
                    : 'text-zinc-400 hover:text-green-400 hover:bg-slate-800'
                }`}
                title="Theme HMI (Neon Matrix Green Terminal)"
              >
                <Terminal className="w-3 h-3" />
                <span className="hidden sm:inline">Theme HMI</span>
                <span className="sm:hidden">HMI</span>
              </button>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-bold font-mono transition-colors ${
                isHmi
                  ? 'bg-zinc-950 hover:bg-green-950 text-green-400 border-green-500/70'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="เปลี่ยนภาษาแสดงผล (Toggle Language: EN / TH / DUAL)"
            >
              <Globe className={`w-3 h-3 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
              <span>{settings.language}</span>
            </button>

            {/* Sound Alert Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1 rounded border text-xs transition-colors ${
                settings.enableSoundAlerts
                  ? isHmi
                    ? 'bg-green-950/80 text-green-300 border-green-500 hover:bg-green-900'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : isHmi
                    ? 'bg-zinc-950 text-zinc-600 border-zinc-800 hover:bg-zinc-900'
                    : 'bg-slate-900 text-slate-600 border-slate-800 hover:bg-slate-800'
              }`}
              title={settings.enableSoundAlerts ? 'การแจ้งเตือนเสียง: เปิด (Sound: ON)' : 'การแจ้งเตือนเสียง: ปิด (Sound: MUTED)'}
            >
              {settings.enableSoundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


