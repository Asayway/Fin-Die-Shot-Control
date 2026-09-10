import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Globe, 
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Moon,
  Sun,
  Sparkles,
  Monitor
} from 'lucide-react';
import { User, SystemSettings, AppTheme } from '../../types';
import { getI18n } from '../../i18n';

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
  const isLight = settings.theme === 'light';
  const t = getI18n(settings.language);

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
    const nextTheme: AppTheme = settings.theme === 'light' ? 'dark' : 'light';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const setLanguage = (lang: 'EN' | 'TH' | 'KO') => {
    onUpdateSettings({ ...settings, language: lang });
  };

  const setTheme = (theme: AppTheme) => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <header 
      className={`sticky top-0 z-40 shadow-md select-none transition-colors duration-200 ${
        isLight
          ? 'bg-white border-b border-slate-200 text-slate-900 font-sans shadow-slate-200/80'
          : 'bg-[#0B1120] border-b border-slate-800 text-slate-100 font-sans shadow-slate-950/60'
      }`}
    >
      <div className="px-3 py-1.5 flex items-center justify-between gap-2.5">
        {/* Left: Brand Title & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Logo Icon */}
          <div 
            className={`p-1 rounded flex items-center justify-center shadow-sm border ${
              isLight
                ? 'bg-rose-50 border-rose-200 text-[#A50034]'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isLight ? <Monitor className="w-4 h-4 text-[#A50034]" /> : <Monitor className="w-4 h-4 text-cyan-400" />}
          </div>

          {/* Main Title Heading */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 
                className={`font-bold text-xs sm:text-sm md:text-base tracking-wider uppercase ${
                  isLight ? 'text-slate-900 tracking-normal font-sans' : 'text-white tracking-normal font-sans'
                }`}
              >
                FIN DIE SHOT CONTROL
              </h1>
              <span 
                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border font-mono ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                }`}
              >
                <Radio className={`w-2 h-2 animate-pulse ${isLight ? 'text-emerald-600' : 'text-cyan-400'}`} />
                {t.header.liveStatus}
              </span>
            </div>
            <p 
              className={`text-[9px] sm:text-[10px] tracking-tight leading-none mt-0.5 ${
                isLight ? 'text-slate-500 font-sans' : 'text-slate-400 font-sans'
              }`}
            >
              {t.header.subtitle}
            </p>
          </div>
        </div>

        {/* Center/Right: Live Clock & Plant Status & Theme Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Quick Switcher Pill */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-md border text-[11px] font-mono shadow-sm ${
            isLight 
              ? 'bg-slate-100 border-slate-200' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                settings.theme === 'light'
                  ? 'bg-[#A50034] text-white font-extrabold shadow'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Theme สว่าง (LG Light Enterprise)"
            >
              <Sun className="w-3 h-3" />
              <span className="hidden lg:inline text-[10px]">สว่าง</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                settings.theme === 'dark' || (!isLight)
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Theme มืด (Industrial Dark Theme)"
            >
              <Moon className="w-3 h-3" />
              <span className="hidden lg:inline text-[10px]">มืด</span>
            </button>
          </div>

          {/* Global i18n Language Switcher Pill */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-md border text-[11px] font-mono shadow-sm ${
            isLight 
              ? 'bg-slate-100 border-slate-200' 
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="px-1 text-slate-400 hidden sm:flex items-center gap-1">
              <Globe className={`w-3 h-3 ${isLight ? 'text-[#A50034]' : 'text-cyan-400'}`} />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('TH')}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                settings.language === 'TH'
                  ? isLight ? 'bg-[#A50034] text-white font-black shadow' : 'bg-cyan-500 text-slate-950 font-black shadow'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ภาษาไทย (Thai)"
            >
              <span className="font-extrabold text-[10px]">TH</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                settings.language === 'EN' || settings.language === 'DUAL'
                  ? isLight ? 'bg-[#A50034] text-white font-black shadow' : 'bg-cyan-500 text-slate-950 font-black shadow'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span className="font-extrabold text-[10px]">EN</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('KO')}
              className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
                settings.language === 'KO'
                  ? isLight ? 'bg-[#A50034] text-white font-black shadow' : 'bg-cyan-500 text-slate-950 font-black shadow'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="한국어 (Korean)"
            >
              <span className="font-extrabold text-[10px]">KO</span>
            </button>
          </div>

          {/* Clock */}
          <div 
            className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded border font-mono text-[11px] shadow-inner ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="tracking-wider font-bold">{time}</span>
            </div>
            <div className={`h-2.5 w-px ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-ping bg-emerald-400" />
              <span className="font-bold tracking-wider text-emerald-400">
                7 LINES (E1-E5)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


