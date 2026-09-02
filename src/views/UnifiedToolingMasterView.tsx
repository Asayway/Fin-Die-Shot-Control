import React, { useState } from 'react';
import { 
  Sliders, 
  Box, 
  Layers,
  DatabaseZap,
  Settings2,
  Factory
} from 'lucide-react';
import { PartLifeStandardSetupView, InstallQuantitySetupView } from './PartLifeStandardSetupView';
import { PartMasterView } from './PartMasterView';
import { LineDieSpecificationView } from './LineDieSpecificationView';
import { storageService } from '../services/storageService';
import { EmbeddedMigrationModal } from '../components/migration/EmbeddedMigrationModal';

interface UnifiedToolingMasterViewProps {
  initialTab?: 'specs' | 'standards' | 'master' | 'install';
}

export const UnifiedToolingMasterView: React.FC<UnifiedToolingMasterViewProps> = ({
  initialTab = 'specs'
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'standards' | 'master' | 'install'>(initialTab);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // System Settings & HMI Theme
  const systemSettings = storageService.getSettings();
  const isHmi = systemSettings?.theme === 'hmi' || systemSettings?.theme === 'industrial-dark';

  return (
    <div className="space-y-2.5 animate-fadeIn font-sans text-slate-100 pb-4">
      
      {/* Top Header & Sub-Tabs Navigation Bar (Sticky Locked at Top) */}
      <div className={`sticky top-0 z-30 backdrop-blur-md rounded-lg p-2 sm:p-2.5 shadow-xl space-y-2 border ${
        isHmi 
          ? 'bg-black/95 border-2 border-green-500 text-green-400' 
          : 'bg-[#0E172A]/95 border-slate-800/90 text-slate-100'
      }`}>
        
        {/* Row 1: Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold tracking-wide uppercase bg-cyan-950 text-cyan-300 border border-cyan-500 font-mono flex items-center gap-1.5 shadow-sm">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>DIE & PART MASTER HUB</span>
            </span>
            <span className="hidden md:inline text-slate-400 text-xs font-thai">
              จัดการสเปกไลน์ (E1-E6), สเปกแม่พิมพ์, มาตรฐานช็อต และอะไหล่
            </span>
          </div>
          
          <button 
            onClick={() => setShowMigrationModal(true)}
            className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 rounded text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm"
          >
            <DatabaseZap className="w-3 h-3" />
            <span>MIGRATE STANDARD</span>
          </button>
        </div>

        {/* Row 2: Sub-Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          
          <button
            id="tab-specs"
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 border ${
              activeTab === 'specs'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-sm font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>1. LINE & DIE SPECS</span>
          </button>

          <button
            id="tab-standards"
            onClick={() => setActiveTab('standards')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 border ${
              activeTab === 'standards'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-sm font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. LIFE STANDARDS</span>
          </button>

          <button
            id="tab-master"
            onClick={() => setActiveTab('master')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 border ${
              activeTab === 'master'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-sm font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3. PART MASTER</span>
          </button>

          <button
            id="tab-install"
            onClick={() => setActiveTab('install')}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all flex items-center gap-1.5 border ${
              activeTab === 'install'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-sm font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. INSTALL MATRIX</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}

      {activeTab === 'specs' && (
        <div className="pt-2">
          <LineDieSpecificationView onAddNewPartClick={() => setActiveTab('master')} />
        </div>
      )}

      {activeTab === 'standards' && (
        <div className="pt-2">
          <PartLifeStandardSetupView />
        </div>
      )}

      {activeTab === 'master' && (
        <div className="pt-2">
          <PartMasterView />
        </div>
      )}

      {activeTab === 'install' && (
        <div className="pt-2">
          <InstallQuantitySetupView />
        </div>
      )}

      <EmbeddedMigrationModal isOpen={showMigrationModal} onClose={() => setShowMigrationModal(false)} />
    </div>
  );
};
