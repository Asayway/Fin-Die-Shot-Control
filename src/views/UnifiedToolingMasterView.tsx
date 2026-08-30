import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Box, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  Info,
  ShieldAlert,
  Zap,
  Flame,
  Search,
  Check,
  ShieldCheck,
  Activity,
  Filter,
  X
} from 'lucide-react';
import { PartLifeStandardSetupView, InstallQuantitySetupView } from './PartLifeStandardSetupView';
import { PartMasterView } from './PartMasterView';
import { UnifiedLineSettingView } from './UnifiedLineSettingView';
import { storageService } from '../services/storageService';
import { PartLifeStandard, ProductionLineId } from '../types';
import { formatShots, formatThb } from '../services/calculationService';
import { ResizableReorderableTable } from '../components/common/ResizableReorderableTable';

interface CrossValidationItem {
  partCode: string;
  partName: string;
  stageName: string;
  category: string;
  pcmLife: number | null;
  goldLife: number | null;
  bareLife: number | null;
  totalInstalled: number;
  isValidated: boolean;
  missingMaterials: string[];
}

interface UnifiedToolingMasterViewProps {
  initialTab?: 'unified-settings' | 'overview' | 'standards' | 'master' | 'install';
}

export const UnifiedToolingMasterView: React.FC<UnifiedToolingMasterViewProps> = ({
  initialTab = 'unified-settings'
}) => {
  const [activeTab, setActiveTab] = useState<'unified-settings' | 'overview' | 'standards' | 'master' | 'install'>(initialTab);
  const [standards, setStandards] = useState<PartLifeStandard[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [validationFilter, setValidationFilter] = useState<string>('ALL');
  const [lineFilter, setLineFilter] = useState<string>('ALL');

  // System Settings & HMI Theme
  const [systemSettings, setSystemSettings] = useState(storageService.getSettings());
  const isHmi = systemSettings?.theme === 'hmi' || systemSettings?.theme === 'industrial-dark';

  // Quick Material Preset Editor State
  const [materialLimits, setMaterialLimits] = useState({
    pcmLouver: 18000000,
    pcmPunchCutoff: 50000000,
    pcmOther: 18000000,
    goldDefault: 40000000,
    bareDefault: 40000000
  });

  const loadData = () => {
    const list = storageService.getLifeStandards();
    setStandards(list);
    setParts(storageService.getPartMasters());
    setLineConfigs(storageService.getLineConfigs());
    setSystemSettings(storageService.getSettings());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return () => unsub();
  }, []);

  // Unique Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [parts]);

  const handleApplyMaterialPresets = () => {
    // Synchronize all matching life standards in storageService
    const currentStandards = storageService.getLifeStandards();
    let updatedCount = 0;

    const newStandards = currentStandards.map(std => {
      const mat = (std.configKey.material || 'PCM').toUpperCase();
      const stage = (std.stagePunchDie || std.partName || '').toUpperCase();
      let newLimit = std.lifeLimitShots;

      if (mat === 'PCM') {
        if (stage.includes('LOUVER') || stage.includes('SLIT')) {
          newLimit = materialLimits.pcmLouver;
        } else if (stage.includes('CUT') || stage.includes('SHEAR') || stage.includes('PUNCH')) {
          newLimit = materialLimits.pcmPunchCutoff;
        } else {
          newLimit = materialLimits.pcmOther;
        }
      } else if (mat === 'GOLD') {
        newLimit = materialLimits.goldDefault;
      } else if (mat === 'BARE') {
        newLimit = materialLimits.bareDefault;
      }

      if (newLimit !== std.lifeLimitShots) {
        updatedCount++;
        return { ...std, lifeLimitShots: newLimit };
      }
      return std;
    });

    storageService.saveLifeStandards(newStandards);
    setSyncStatusMsg(`อัปเดตเกณฑ์อายุตามชนิดวัสดุเรียบร้อยแล้ว (${updatedCount} รายการได้รับการซิงค์มาตรฐานใหม่)`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Cross-Validation Analysis logic
  const crossValidationMatrix: CrossValidationItem[] = useMemo(() => {
    return parts.map(p => {
      const pcmStd = standards.find(s => s.configKey.partCode === p.partCode && s.configKey.material === 'PCM');
      const goldStd = standards.find(s => s.configKey.partCode === p.partCode && s.configKey.material === 'GOLD');
      const bareStd = standards.find(s => s.configKey.partCode === p.partCode && s.configKey.material === 'BARE');

      // Total installed quantity across all production lines or specific line
      let totalInstalled = 0;
      lineConfigs.forEach(line => {
        if (lineFilter !== 'ALL' && line.id !== lineFilter) return;
        if (line.installedPartQuantities && line.installedPartQuantities[p.partCode]) {
          totalInstalled += line.installedPartQuantities[p.partCode];
        }
      });

      const isMissingStandards = !pcmStd || !goldStd || !bareStd;

      return {
        partCode: p.partCode,
        partName: p.partName,
        stageName: p.stageName,
        category: p.category,
        pcmLife: pcmStd ? pcmStd.lifeLimitShots : null,
        goldLife: goldStd ? goldStd.lifeLimitShots : null,
        bareLife: bareStd ? bareStd.lifeLimitShots : null,
        totalInstalled,
        isValidated: !isMissingStandards && totalInstalled >= 0,
        missingMaterials: [
          !pcmStd && 'PCM',
          !goldStd && 'GOLD',
          !bareStd && 'BARE'
        ].filter(Boolean) as string[]
      };
    });
  }, [parts, standards, lineConfigs, lineFilter]);

  // Filtered Matrix according to Search & Filters
  const filteredMatrix = useMemo(() => {
    return crossValidationMatrix.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.partCode.toLowerCase().includes(q);
        const matchName = item.partName.toLowerCase().includes(q);
        const matchStage = (item.stageName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchStage) return false;
      }
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (validationFilter === 'VALIDATED' && !item.isValidated) return false;
      if (validationFilter === 'MISSING' && item.isValidated) return false;
      return true;
    });
  }, [crossValidationMatrix, searchQuery, categoryFilter, validationFilter]);

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  return (
    <div className="space-y-3 animate-fadeIn font-sans text-slate-100 pb-6">
      
      {/* Top Header & Integrated Line + Sub-Tabs Navigation Bar */}
      <div className={`rounded-xl p-3 sm:p-4 shadow-xl space-y-3 border ${
        isHmi 
          ? 'bg-black border-2 border-green-500 text-green-400' 
          : 'bg-[#0E172A] border-slate-800/90 text-slate-100'
      }`}>
        
        {/* Row 1: Title & Line Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>UNIFIED TOOLING & STANDARDS</span>
            </span>
            <span className="hidden sm:inline text-slate-400 text-xs font-mono">| ฐานข้อมูลสเปกและเกณฑ์อายุอะไหล่</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-mono font-black text-cyan-400 mr-1 tracking-wider uppercase">LINE:</span>
            {linesList.map(line => (
              <button
                key={line}
                onClick={() => setLineFilter(lineFilter === line ? 'ALL' : line)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-black transition-all ${
                  lineFilter === line
                    ? isHmi
                      ? 'bg-green-500 text-black shadow-lg shadow-green-500/40 ring-2 ring-green-300 scale-105'
                      : 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 ring-2 ring-cyan-300 scale-105'
                    : isHmi
                      ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border border-green-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                }`}
              >
                {line}
              </button>
            ))}
            <button
              onClick={() => setLineFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                lineFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              ALL LINES
            </button>
          </div>
        </div>

        {/* Row 2: Sub-Tabs Bar (Fully Visible, No Horizontal Scrollbar) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveTab('unified-settings')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border ${
              activeTab === 'unified-settings'
                ? isHmi 
                  ? 'bg-green-500 text-black border-green-400 shadow-md font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>★ UNIFIED SETTING (ตั้งค่าระบบเรียบง่าย)</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border ${
              activeTab === 'overview'
                ? isHmi 
                  ? 'bg-green-500 text-black border-green-400 shadow-md font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>GLOBAL OVERVIEW & CROSS-VALIDATION ({filteredMatrix.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('standards')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border ${
              activeTab === 'standards'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-md font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. LIFE STANDARD SETUP</span>
          </button>

          <button
            onClick={() => setActiveTab('master')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border ${
              activeTab === 'master'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-md font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>2. PART MASTER CATALOG</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 border ${
              activeTab === 'install'
                ? isHmi
                  ? 'bg-green-500 text-black border-green-400 shadow-md font-extrabold'
                  : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-bold'
                : isHmi
                  ? 'bg-zinc-950 text-green-400 border-green-900 hover:bg-zinc-900'
                  : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. INSTALL MATRIX</span>
          </button>
        </div>
      </div>

      {/* SYNC NOTIFICATION TOAST */}
      {syncStatusMsg && (
        <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-lg text-xs text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-bold font-thai">{syncStatusMsg}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TOP MATERIAL RULES PRESET CONTROL BAR */}
      <div className="bg-[#0F1D38] border border-cyan-800/80 rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-cyan-900/60 pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider font-mono">
              ตั้งค่าเกณฑ์อายุมาตรฐานตามชนิดวัสดุฟิน (Material Specific Life Limit Presets)
            </h3>
          </div>
          <button
            onClick={handleApplyMaterialPresets}
            className="px-3 py-1.5 rounded-md text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ซิงค์เกณฑ์อายุลงทุกไลน์ (SYNC MATERIAL PRESETS)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">PCM - Louver Punch</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={materialLimits.pcmLouver}
                onChange={e => setMaterialLimits({ ...materialLimits, pcmLouver: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 w-28 text-right font-bold"
              />
              <span className="text-slate-400">shots (18M)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">PCM - Punch / Cut-off</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={materialLimits.pcmPunchCutoff}
                onChange={e => setMaterialLimits({ ...materialLimits, pcmPunchCutoff: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 w-28 text-right font-bold"
              />
              <span className="text-slate-400">shots (50M)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">PCM - General Parts</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={materialLimits.pcmOther}
                onChange={e => setMaterialLimits({ ...materialLimits, pcmOther: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 w-28 text-right font-bold"
              />
              <span className="text-slate-400">shots</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-yellow-400 font-bold block">GOLD Fin Material</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={materialLimits.goldDefault}
                onChange={e => setMaterialLimits({ ...materialLimits, goldDefault: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 w-28 text-right font-bold"
              />
              <span className="text-slate-400">shots (40M)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">BARE Fin Material</span>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={materialLimits.bareDefault}
                onChange={e => setMaterialLimits({ ...materialLimits, bareDefault: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 w-28 text-right font-bold"
              />
              <span className="text-slate-400">shots (40M)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className={`p-3.5 sm:p-4 rounded-xl border shadow-lg space-y-3 ${
        isHmi 
          ? 'bg-black border-2 border-green-500/80 text-green-300' 
          : 'bg-[#0E172A] border-slate-800'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isHmi ? 'text-green-400' : 'text-white'}`}>
              ค้นหาและกรองข้อมูลอะไหล่/สายการผลิต (TOOLING SEARCH & FILTER BAR)
            </h3>
          </div>
          {(searchQuery || categoryFilter !== 'ALL' || validationFilter !== 'ALL' || lineFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setValidationFilter('ALL');
                setLineFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 border ${
                isHmi 
                  ? 'bg-rose-950 text-rose-300 border-rose-600 hover:bg-rose-900' 
                  : 'bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง (CLEAR FILTERS)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Text Search */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 font-mono block">SEARCH CODE / NAME / STAGE</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="พิมพ์รหัสอะไหล่ เช่น P-LOUVER-01..."
                className={`w-full rounded-lg px-3.5 ${
                  isHmi ? 'py-3 text-base border-2 border-green-500 bg-zinc-950 text-green-300 min-h-[48px]' : 'py-2 text-xs border border-slate-700 bg-slate-950 text-white'
                } font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 font-mono block">CATEGORY (ประเภทอะไหล่)</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={`w-full rounded-lg px-3.5 ${
                isHmi ? 'py-3 text-base border-2 border-green-500 bg-zinc-950 text-green-300 min-h-[48px]' : 'py-2 text-xs border border-slate-700 bg-slate-950 text-white'
              } font-mono focus:outline-none`}
            >
              <option value="ALL">ALL CATEGORIES (ทุกหมวดหมู่)</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Line Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 font-mono block">PRODUCTION LINE (สายการผลิต)</label>
            <select
              value={lineFilter}
              onChange={e => setLineFilter(e.target.value)}
              className={`w-full rounded-lg px-3.5 ${
                isHmi ? 'py-3 text-base border-2 border-green-500 bg-zinc-950 text-green-300 min-h-[48px]' : 'py-2 text-xs border border-slate-700 bg-slate-950 text-white'
              } font-mono focus:outline-none`}
            >
              <option value="ALL">ALL LINES (ทุกสายการผลิต E1 - E6)</option>
              {['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'].map(line => (
                <option key={line} value={line}>LINE {line}</option>
              ))}
            </select>
          </div>

          {/* Validation Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 font-mono block">VALIDATION STATUS (สถานะตรวจสอบ)</label>
            <select
              value={validationFilter}
              onChange={e => setValidationFilter(e.target.value)}
              className={`w-full rounded-lg px-3.5 ${
                isHmi ? 'py-3 text-base border-2 border-green-500 bg-zinc-950 text-green-300 min-h-[48px]' : 'py-2 text-xs border border-slate-700 bg-slate-950 text-white'
              } font-mono focus:outline-none`}
            >
              <option value="ALL">ALL STATUS (ทุกสถานะ)</option>
              <option value="VALIDATED">✓ VALIDATED ONLY (ครบทุกเกณฑ์)</option>
              <option value="MISSING">⚠ MISSING STANDARDS ONLY (ขาดเกณฑ์บางวัสดุ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'unified-settings' && (
        <div className="pt-2">
          <UnifiedLineSettingView />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-4 pt-2">
          {/* Summary Health Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">FILTERED ITEMS</span>
                <span className="text-2xl font-black text-cyan-300 font-mono">{filteredMatrix.length} / {parts.length} EA</span>
              </div>
              <Box className="w-8 h-8 text-cyan-500 opacity-60" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">CONFIGURED STANDARDS</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{standards.length} Rules</span>
              </div>
              <Sliders className="w-8 h-8 text-emerald-500 opacity-60" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">TOTAL INSTALLED DIE PARTS</span>
                <span className="text-2xl font-black text-yellow-400 font-mono">
                  {filteredMatrix.reduce((sum, item) => sum + item.totalInstalled, 0)} EA
                </span>
              </div>
              <Layers className="w-8 h-8 text-yellow-500 opacity-60" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono block">VALIDATION STATUS</span>
                <span className={`text-lg font-black font-mono flex items-center gap-1 ${
                  filteredMatrix.every(x => x.isValidated) ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                  {filteredMatrix.every(x => x.isValidated) ? '100% VALIDATED' : 'ATTENTION REQ.'}
                </span>
              </div>
            </div>
          </div>

          {/* Unified Cross-Validation Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-base font-mono flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  Global Tooling & Material Life Cross-Validation Matrix
                </h3>
                <p className="text-xs text-slate-400 font-thai">
                  เปรียบเทียบมาตรฐานอายุช็อตของอะไหล่แต่ละชนิดตามประเภทวัสดุ (PCM, GOLD, BARE) และจำนวนติดตั้งในแม่พิมพ์
                </p>
              </div>
            </div>

            <ResizableReorderableTable<CrossValidationItem>
              data={filteredMatrix}
              keyExtractor={(item) => item.partCode}
              emptyMessage="ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา/กรอง"
              columns={[
                {
                  id: 'partCode',
                  label: 'PART CODE',
                  width: 130,
                  render: (item) => <span className="font-bold text-cyan-300 font-mono text-xs">{item.partCode}</span>
                },
                {
                  id: 'partName',
                  label: 'PART NAME & STAGE',
                  width: 210,
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-slate-100 text-xs">{item.partName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.stageName} ({item.category})</div>
                    </div>
                  )
                },
                {
                  id: 'pcmLife',
                  label: 'PCM LIFE (SHOTS)',
                  width: 150,
                  align: 'right',
                  render: (item) => (
                    item.pcmLife ? (
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {formatShots(item.pcmLife)}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-mono text-xs italic">NOT DEFINED</span>
                    )
                  )
                },
                {
                  id: 'goldLife',
                  label: 'GOLD LIFE (SHOTS)',
                  width: 150,
                  align: 'right',
                  render: (item) => (
                    item.goldLife ? (
                      <span className="font-mono font-bold text-yellow-300 text-xs">
                        {formatShots(item.goldLife)}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-mono text-xs italic">NOT DEFINED</span>
                    )
                  )
                },
                {
                  id: 'bareLife',
                  label: 'BARE LIFE (SHOTS)',
                  width: 150,
                  align: 'right',
                  render: (item) => (
                    item.bareLife ? (
                      <span className="font-mono font-bold text-cyan-300 text-xs">
                        {formatShots(item.bareLife)}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-mono text-xs italic">NOT DEFINED</span>
                    )
                  )
                },
                {
                  id: 'totalInstalled',
                  label: 'INSTALLED (QTY)',
                  width: 130,
                  align: 'center',
                  render: (item) => (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold text-xs">
                      {item.totalInstalled} EA
                    </span>
                  )
                },
                {
                  id: 'status',
                  label: 'CROSS-VALIDATION',
                  width: 160,
                  align: 'center',
                  render: (item) => (
                    item.isValidated ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[11px] font-bold">
                        ✓ VALIDATED OK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[11px] font-bold">
                        MISSING: {item.missingMaterials.join(', ')}
                      </span>
                    )
                  )
                }
              ]}
            />
          </div>
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

    </div>
  );
};
