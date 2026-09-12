import React, { useState, useEffect } from 'react';
import { Globe, Clock, Radio } from 'lucide-react';
import { User, SystemSettings } from '../../types';
import { useLanguage, useTranslation } from '../../i18n';

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
  settings,
  onUpdateSettings
}) => {
  const [time, setTime] = useState<string>('');
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

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

  const handleSelectLanguage = (lang: 'EN' | 'TH' | 'KO') => {
    setLanguage(lang);
    onUpdateSettings({ ...settings, language: lang });
  };

  const activeLang = language || settings.language || 'TH';

  return (
    <header className="sticky top-0 z-40 select-none transition-colors duration-200 border-b border-[#666666] bg-[#111111] text-white font-sans">
      <div className="px-3 py-1.5 flex items-center justify-between gap-2.5">
        {/* Left: Brand Title & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-xs sm:text-sm md:text-base tracking-wider uppercase text-white font-sans">
                {t('header.title', { defaultValue: 'FIN DIE SHOT CONTROL' })}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border bg-[#222222] text-[#00ff00] border-[#666666]">
                <Radio className="w-2 h-2 animate-pulse text-[#00ff00]" />
                {t('header.liveStatus', { defaultValue: 'LIVE ONLINE' })}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-tight leading-none mt-0.5 text-[#aaaaaa] font-sans">
              {t('header.subtitle', { defaultValue: 'FIN DIE SHOT & LIFETIME MONITOR' })}
            </p>
          </div>
        </div>

        {/* Center/Right: Live Clock & Language Switcher [ TH | EN | KO ] */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global i18n Language Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 border border-[#666666] bg-[#222222] text-[11px] font-mono rounded">
            <div className="px-1 text-slate-400 hidden sm:flex items-center gap-1">
              <Globe className="w-3 h-3 text-white" />
            </div>
            <button
              type="button"
              onClick={() => handleSelectLanguage('TH')}
              className={`px-1.5 py-0.5 flex items-center gap-1 transition-all rounded-sm cursor-pointer ${
                activeLang === 'TH'
                  ? 'bg-[#00ff00] text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ภาษาไทย (Thai)"
            >
              <span className="font-extrabold text-[10px]">TH</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('EN')}
              className={`px-1.5 py-0.5 flex items-center gap-1 transition-all rounded-sm cursor-pointer ${
                activeLang === 'EN' || activeLang === 'DUAL'
                  ? 'bg-[#00ff00] text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="English"
            >
              <span className="font-extrabold text-[10px]">EN</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('KO')}
              className={`px-1.5 py-0.5 flex items-center gap-1 transition-all rounded-sm cursor-pointer ${
                activeLang === 'KO'
                  ? 'bg-[#00ff00] text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="한국어 (Korean)"
            >
              <span className="font-extrabold text-[10px]">KO</span>
            </button>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 border font-mono text-[11px] bg-[#222222] border-[#666666] text-white">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#ffcc00]" />
              <span className="tracking-wider font-bold">{time}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
