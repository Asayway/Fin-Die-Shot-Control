import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Clock,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Radio
} from 'lucide-react';
import { User, SystemSettings } from '../../types';

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

  return (
    <header className="bg-[#0B1220] border-b border-slate-800/80 text-slate-100 sticky top-0 z-40 shadow-md">
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle Button + Main Brand Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Sidebar Hide/Show Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors flex items-center justify-center shadow-sm"
            title={sidebarCollapsed ? "เปิดแท็บเมนูด้านข้าง (Open Sidebar)" : "ซ่อนแท็บเมนูด้านข้าง (Hide Sidebar)"}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-slate-300" />
            )}
          </button>

          {/* Logo Icon */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-md flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>

          {/* Main Title Heading */}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-base sm:text-lg md:text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                HE SMART FIN DIE SHOP CONTROL
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-normal leading-relaxed">
              Heat Exchanger Tooling Shot Life, Re-grind & Inventory Monitor
              <span className="text-slate-500 ml-1.5 font-thai">| ระบบควบคุมช็อตแม่พิมพ์และอะไหล่ฟินได</span>
            </p>
          </div>
        </div>

        {/* Center/Right: Live Clock & Plant Status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-md border border-slate-800 font-mono text-xs text-slate-300 shadow-inner">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="tracking-wide">{time}</span>
            </div>
            <div className="h-3 w-px bg-slate-700/80" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-semibold tracking-wide">8 LINES ACTIVE (E1-E6)</span>
            </div>
          </div>

          {/* Clean Controls (Language & Sound) */}
          <div className="flex items-center gap-1.5">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs font-semibold transition-colors"
              title="เปลี่ยนภาษาแสดงผล (Toggle Language: EN / TH / DUAL)"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px]">{settings.language}</span>
            </button>

            {/* Sound Alert Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                settings.enableSoundAlerts
                  ? 'bg-slate-800/80 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800/40 text-slate-500 border-slate-800 hover:bg-slate-800'
              }`}
              title={settings.enableSoundAlerts ? 'การแจ้งเตือนเสียง: เปิด (Sound Alert: ON)' : 'การแจ้งเตือนเสียง: ปิด (Sound Alert: MUTED)'}
            >
              {settings.enableSoundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

