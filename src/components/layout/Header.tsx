import React, { useState, useEffect } from 'react';
import { Globe, Radio } from 'lucide-react';
import { User, SystemSettings, GatewayStatusInfo } from '../../types';
import { useLanguage, useTranslation } from '../../i18n';
import { storageService } from '../../services/storageService';

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
  onUpdateSettings,
  onNavigate
}) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [gwStatus, setGwStatus] = useState<GatewayStatusInfo>(storageService.getGatewayStatus());

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setGwStatus(storageService.getGatewayStatus());
    });
    return unsub;
  }, []);

  const handleSelectLanguage = (lang: 'EN' | 'TH' | 'KO') => {
    setLanguage(lang);
    onUpdateSettings({ ...settings, language: lang });
  };

  const activeLang = language || settings.language || 'TH';
  const isSimulation = gwStatus.connectionMode === 'SIMULATION';
  const isConnected = gwStatus.connected;

  return (
    <header className="sticky top-0 z-40 select-none ios-spring border-b border-white/10 bg-[#0a0e17]/85 backdrop-blur-2xl text-white font-sans shadow-lg">
      <div className="px-3.5 py-2 flex items-center justify-between gap-3">
        {/* Left: Brand Title & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xs sm:text-sm md:text-base tracking-wider uppercase text-white font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] inline-block"></span>
                {t('header.title', { defaultValue: 'FIN DIE SHOT CONTROL' })}
              </h1>
              {isSimulation ? (
                <button
                  type="button"
                  onClick={() => onNavigate('plc-config')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold border rounded-full bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-mono cursor-pointer transition-all active:scale-95"
                  title="คลิกเพื่อเปิดหน้าตั้งค่าการเชื่อมต่อ PLC"
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                  SIMULATION ACTIVE
                </button>
              ) : isConnected ? (
                <button
                  type="button"
                  onClick={() => onNavigate('plc-config')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold border rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-mono cursor-pointer transition-all active:scale-95"
                  title="คลิกเพื่อเปิดหน้าตั้งค่าการเชื่อมต่อ PLC"
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  PLC CONNECTED
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('plc-config')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold border rounded-full bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-mono cursor-pointer transition-all active:scale-95"
                  title="คลิกเพื่อเปิดหน้าตั้งค่าการเชื่อมต่อ PLC"
                >
                  <Radio className="w-2.5 h-2.5 text-rose-400" />
                  CONNECTION LOST
                </button>
              )}
            </div>
            <p className="text-[9.5px] sm:text-[10px] tracking-tight leading-none mt-0.5 text-slate-400 font-sans">
              {t('header.subtitle', { defaultValue: 'FIN DIE SHOT & LIFETIME MONITOR' })}
            </p>
          </div>
        </div>

        {/* Center/Right: Language Switcher [ TH | EN | KO ] in Capsule Track */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 border border-white/10 bg-white/[0.04] backdrop-blur-md rounded-full shadow-inner">
            <div className="px-1 text-slate-400 hidden sm:flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <button
              type="button"
              onClick={() => handleSelectLanguage('TH')}
              className={`px-2.5 py-0.5 flex items-center gap-1 ios-spring rounded-full cursor-pointer text-[10.5px] font-mono ${
                activeLang === 'TH'
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="ภาษาไทย (Thai)"
            >
              <span>TH</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('EN')}
              className={`px-2.5 py-0.5 flex items-center gap-1 ios-spring rounded-full cursor-pointer text-[10.5px] font-mono ${
                activeLang === 'EN' || activeLang === 'DUAL'
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="English"
            >
              <span>EN</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLanguage('KO')}
              className={`px-2.5 py-0.5 flex items-center gap-1 ios-spring rounded-full cursor-pointer text-[10.5px] font-mono ${
                activeLang === 'KO'
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="한국어 (Korean)"
            >
              <span>KO</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
