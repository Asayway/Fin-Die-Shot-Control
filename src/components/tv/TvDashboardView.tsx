import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Wifi, 
  AlertTriangle, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  RotateCw,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ShieldAlert,
  Eye,
  X
} from 'lucide-react';
import { 
  LineLiveMonitoringData, 
  ProductionLineId, 
  MachineStatus, 
  PartLiveTrackingItem,
  LifeStatus,
  StockStatus,
  LINE_INFO_MAP
} from '../../types';
import { storageService } from '../../services/storageService';
import { 
  formatShots, 
  calculatePartMetrics, 
  sortTrackingItems, 
  TvSortMode,
  calculateSummaryStats, 
  generateDynamicAlertTicker 
} from '../../services/calculationService';
import { getI18n, LanguageCode } from '../../i18n';
import { TvTableRow } from './TvTableRow';

interface TvDashboardViewProps {
  initialLineId?: ProductionLineId;
  isFullscreenMode?: boolean;
  onToggleFullscreen?: () => void;
}

export const TvDashboardView: React.FC<TvDashboardViewProps> = ({
  initialLineId = 'E6',
  isFullscreenMode = false,
  onToggleFullscreen
}) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [lineData, setLineData] = useState<LineLiveMonitoringData | null>(null);

  // Active Display Language
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    return (storageService.getSettings().language as LanguageCode) || 'EN';
  });

  useEffect(() => {
    const checkLang = () => {
      const activeLang = storageService.getSettings().language || 'EN';
      if (activeLang !== currentLang) {
        setCurrentLang(activeLang as LanguageCode);
      }
    };
    const interval = setInterval(checkLang, 400);
    window.addEventListener('storage', checkLang);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkLang);
    };
  }, [currentLang]);

  const t = getI18n(currentLang);
  
  // Sort Mode State (Default: INDUSTRIAL_PRIORITY)
  const [tvSortMode, setTvSortMode] = useState<TvSortMode>(() => {
    return (localStorage.getItem('findie_tv_sort_mode') as TvSortMode) || 'INDUSTRIAL_PRIORITY';
  });
  
  // Auto Cycle Options: 0 = OFF, 5, 10, 15, 30 seconds (Default: 5s Auto Cycle)
  const [autoCycleSeconds, setAutoCycleSeconds] = useState<number>(5);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isSimulatingPulse, setIsSimulatingPulse] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedModalItem, setSelectedModalItem] = useState<PartLiveTrackingItem | null>(null);
  const [tvResetModalOpen, setTvResetModalOpen] = useState<boolean>(false);
  const [tvResetTargetScope, setTvResetTargetScope] = useState<'ALL' | ProductionLineId>('ALL');
  const [tvResetNewMeter, setTvResetNewMeter] = useState<string>('0');
  const [tvResetPartWear, setTvResetPartWear] = useState<boolean>(true);
  const [tvResetShiftCounters, setTvResetShiftCounters] = useState<boolean>(true);
  const [tvResetToast, setTvResetToast] = useState<string | null>(null);

  // Default standard proportional column widths matching the verified TV layout (sum = 100%)
  const DEFAULT_TV_COL_WIDTHS: Record<string, number> = {
    no: 3.5,
    stage: 18.5,
    lifeLimit: 9.5,
    currentShot: 11.0,
    usage: 6.5,
    remaining: 11.0,
    progress: 10.5,
    lastChange: 11.0,
    installQty: 5.0,
    spareQty: 5.0,
    status: 8.5
  };

  // Proportional Column Resizing State (% width out of the box so it fits 100% screen width seamlessly)
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('findie_tv_col_widths_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.stage && parsed.currentShot) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_TV_COL_WIDTHS;
  });

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const container = (e.currentTarget.closest('.table-container') as HTMLElement) || document.body;
    const containerWidth = container.clientWidth || 1200;
    const startPercent = colWidths[colKey] || DEFAULT_TV_COL_WIDTHS[colKey] || 10;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.pageX - startX;
      const deltaPercent = (deltaPx / containerWidth) * 100;
      const newPercent = Math.max(2, Math.min(50, startPercent + deltaPercent));
      setColWidths(prev => {
        const updated = { ...prev, [colKey]: parseFloat(newPercent.toFixed(2)) };
        try {
          localStorage.setItem('findie_tv_col_widths_v3', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const reloadData = () => {
    const rawData = storageService.getLineMonitoring(selectedLineId);
    if (!rawData) {
      setLineData(null);
      return;
    }

    // Recalculate all tracking items through the centralized Part Life Calculation Service
    const standards = storageService.getLifeStandards();
    const stocks = storageService.getSpareStocks();
    const activeConfig = rawData.activeConfig;

    const recalculatedItems = (rawData.items || []).map((item, idx) => {
      return calculatePartMetrics(
        {
          slotId: item.slotId || `SLOT-${selectedLineId}-${idx + 1}`,
          partCode: item.partCode,
          partName: item.partName,
          stagePunchDie: item.stagePunchDie,
          position: item.position,
          installQty: item.installQty,
          backupQty: item.backupQty,
          usedShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          currentShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          shotAtLastChange: item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot,
          lastChangeShot: item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot,
          regrindCount: item.regrindCount,
          totalMmGround: item.totalMmGround
        },
        activeConfig,
        standards,
        stocks
      );
    });

    // Sort items according to active TV Sort Mode (default: INDUSTRIAL_PRIORITY)
    const sortedItems = sortTrackingItems(recalculatedItems, tvSortMode);

    setLineData({
      ...rawData,
      lineName: selectedLineId,
      items: sortedItems
    });
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(() => {
      reloadData();
    });
    return () => unsub();
  }, [selectedLineId, tvSortMode]);

  // Live Clock for TV
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // TV Auto-Cycle lines with custom configurable intervals: OFF, 5s, 10s, 15s, 30s
  const cycleIntervals = [0, 5, 10, 15, 30];
  const handleToggleAutoCycle = () => {
    const currentIdx = cycleIntervals.indexOf(autoCycleSeconds);
    const nextIdx = (currentIdx + 1) % cycleIntervals.length;
    setAutoCycleSeconds(cycleIntervals[nextIdx]);
  };

  useEffect(() => {
    if (autoCycleSeconds <= 0) return;
    const interval = setInterval(() => {
      setSelectedLineId(prev => {
        const nextIdx = (linesList.indexOf(prev) + 1) % linesList.length;
        return linesList[nextIdx];
      });
    }, autoCycleSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoCycleSeconds]);

  // Simulated live shot pulse counter (PLC heartbeat)
  useEffect(() => {
    if (!isSimulatingPulse) return;
    const pulseInterval = setInterval(() => {
      // Add small batch of 25-50 shots every 4 seconds to active running line
      if (lineData && lineData.machineStatus === 'RUNNING') {
        const increment = Math.floor(Math.random() * 30) + 20;
        storageService.addShotEntry(selectedLineId, increment, 'AUTOMATIC_PLC', 'Shift 1 (Day)', 'Real-time PLC optical pulse');
      }
    }, 4000);
    return () => clearInterval(pulseInterval);
  }, [isSimulatingPulse, selectedLineId, lineData?.machineStatus]);

  if (!lineData) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-400 font-mono">
        LOADING LINE MONITORING DATA...
      </div>
    );
  }

  // Dynamic summary stats derived from currently displayed items
  const items = lineData.items || [];
  const {
    normalCount,
    warningCount,
    prepareCount,
    criticalCount,
    overLifeCount,
    lowStockCount,
    deliveryRiskCount
  } = calculateSummaryStats(items);

  // Dynamic alert ticker matching the exact calculated table items
  const dynamicTickerMessage = generateDynamicAlertTicker(items, selectedLineId);

  return (
    <div className={`w-full bg-[#070F1E] text-slate-100 flex flex-col justify-between font-sans select-none border border-slate-800/80 shadow-2xl overflow-hidden transition-all ${
      isFullscreenMode
        ? 'fixed inset-0 z-50 h-screen w-screen max-h-screen max-w-screen pt-9 sm:pt-10 px-2 sm:px-3 pb-2 rounded-none border-none bg-[#070F1E]'
        : 'h-[calc(100vh-84px)] min-h-[560px] p-2 sm:p-3 md:p-3.5 rounded-xl'
    }`}>
      
      {/* Top TV Controls Bar (Line Switcher, Auto Cycle, High Contrast, Fullscreen) - flex-none */}
      <div className={`flex-none flex flex-wrap items-center justify-between gap-2 pb-1.5 mb-1.5 border-b z-30 relative ${
        highContrast ? 'border-yellow-400 border-b-2' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className={`text-sm sm:text-base font-mono font-black uppercase tracking-wider mr-1 ${
            highContrast ? 'text-yellow-300' : 'text-cyan-400'
          }`}>{t.controls.line}:</span>
          {linesList.map(line => {
            const info = LINE_INFO_MAP[line];
            const isSelected = selectedLineId === line;
            const lineStatus = storageService.getLineMonitoring(line)?.machineStatus || 'RUNNING';
            const displayLine = line.startsWith('E3-') ? 'E3' : line;
            return (
              <button
                key={line}
                onClick={() => setSelectedLineId(line)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-sm sm:text-base font-mono font-black transition-all flex items-center gap-1.5 border whitespace-nowrap active:scale-95 shadow-sm ${
                  isSelected
                    ? highContrast
                      ? 'bg-yellow-400 text-black border-2 border-white shadow-md font-black ring-2 ring-yellow-400'
                      : 'bg-cyan-400 text-slate-950 shadow-md ring-2 ring-cyan-300 font-black'
                    : highContrast
                      ? 'bg-zinc-900 text-white border border-zinc-600 hover:bg-zinc-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/90'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  lineStatus === 'RUNNING' ? 'bg-emerald-400 animate-pulse' :
                  lineStatus === 'IDLE' ? 'bg-amber-400' :
                  lineStatus === 'MAINTENANCE' ? 'bg-cyan-400' : 'bg-rose-500'
                }`} />
                <span>{displayLine}</span>
                <span className={`text-[11px] sm:text-xs px-1.5 py-0.5 rounded font-bold ${
                  isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {info?.shortTag || line}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AUTO-CYCLE TIMER SELECTOR BUTTON */}
          <button
            onClick={handleToggleAutoCycle}
            className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold border transition-all active:scale-95 ${
              autoCycleSeconds > 0
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Click to cycle Auto-Switch timer: OFF -> 5s -> 10s -> 15s -> 30s -> OFF"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoCycleSeconds > 0 ? 'animate-spin text-slate-950' : ''}`} />
            <span className="hidden sm:inline">{t.controls.autoCycle}</span>
            <span className="font-bold px-1.5 py-0.5 bg-black/40 text-white rounded text-xs">
              {autoCycleSeconds > 0 ? `${autoCycleSeconds}s` : t.controls.off}
            </span>
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 transition-colors shadow-sm"
              title={isFullscreenMode ? "Exit Fullscreen TV" : "Expand Fullscreen TV"}
            >
              {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* TOP HEADER: CLEAN INDUSTRIAL DISPLAY - flex-none */}
      <div className={`flex-none grid grid-cols-12 items-center gap-2 px-3 py-1.5 bg-[#0E172A] border border-slate-800/90 rounded-lg mb-1.5 shadow-md ${
        isFullscreenMode ? 'lg:py-2.5 lg:px-4' : ''
      }`}>
        {/* Center Title & Line Specs */}
        <div className="col-span-9 text-left pl-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/80 rounded-md font-mono font-black ${
              isFullscreenMode ? 'text-sm sm:text-base lg:text-lg' : 'text-xs sm:text-sm'
            }`}>
              LINE {selectedLineId}
            </span>
            <h2 className={`font-black tracking-wide text-white uppercase font-['Plus_Jakarta_Sans'] leading-tight ${
              isFullscreenMode ? 'text-base sm:text-lg md:text-xl lg:text-2xl' : 'text-sm sm:text-base md:text-lg'
            }`}>
              FIN DIE SPARE PARTS SHOT COUNT ({LINE_INFO_MAP[selectedLineId]?.nameTh || selectedLineId})
            </h2>
          </div>
          <div className={`font-mono text-cyan-300 flex flex-wrap items-center justify-start gap-2 mt-1 ${
            isFullscreenMode ? 'text-xs sm:text-sm lg:text-base' : 'text-xs sm:text-sm'
          }`}>
            <span className="bg-slate-900/95 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              DIE: <strong className="text-white font-bold">{lineData.activeConfig?.dieCode || `FD-${selectedLineId}-07`}</strong>
            </span>
            <span className="bg-slate-900/95 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              TUBE: <strong className="text-white font-bold">{lineData.activeConfig?.tubeSize || 'Ø7'}</strong>
            </span>
            <span className="bg-slate-900/95 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              MAT: <strong className="text-white font-bold">{lineData.activeConfig?.material || 'PCM'} ({lineData.activeConfig?.thicknessMm || 0.10}mm)</strong>
            </span>
            <span className="bg-slate-900/95 px-2 py-0.5 rounded border border-slate-800 text-slate-300 hidden sm:inline">
              TYPE: <strong className="text-white font-bold">{lineData.activeConfig?.finType || 'Slit (half)'}</strong>
            </span>
          </div>
        </div>

        {/* Right Timestamp Box */}
        <div className="col-span-3 text-right">
          <div className="inline-block px-3 py-1 bg-slate-900/95 border border-slate-800 rounded-lg text-right shadow-inner">
            <div className={`font-mono tracking-wider text-slate-400 font-bold uppercase ${
              isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
            }`}>LAST UPDATE</div>
            <div className={`font-mono font-black text-cyan-300 ${
              isFullscreenMode ? 'text-sm sm:text-base lg:text-lg xl:text-xl' : 'text-xs sm:text-sm md:text-base'
            }`}>
              {currentTime || lineData.lastUpdate}
            </div>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW - flex-none */}
      <div className="flex-none grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-1.5">
        {/* Machine Status */}
        <div className={`border rounded-lg py-1.5 px-2 text-center flex flex-col justify-center shadow-md transition-all ${
          lineData.machineStatus === 'MAINTENANCE'
            ? 'bg-amber-950/80 border-amber-500 animate-pulse ring-1 ring-amber-400/40'
            : lineData.machineStatus === 'STOPPED'
            ? 'bg-rose-950/90 border-rose-500 animate-pulse ring-1 ring-rose-500/50'
            : 'bg-[#0E172A] border-slate-800/90'
        }`}>
          <div className={`font-sans font-bold tracking-wider text-slate-400 uppercase mb-0.5 ${
            isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          }`}>
            {t.table.status}
          </div>
          <div className={`flex items-center justify-center gap-1.5 font-black font-mono ${
            isFullscreenMode ? 'text-base sm:text-lg md:text-xl lg:text-2xl' : 'text-sm sm:text-base md:text-lg'
          }`}>
            {lineData.machineStatus === 'RUNNING' && <span className="text-emerald-400 flex items-center gap-1">🟢 {t.controls.running}</span>}
            {lineData.machineStatus === 'IDLE' && <span className="text-yellow-300 flex items-center gap-1">🟡 {t.controls.idle}</span>}
            {lineData.machineStatus === 'MAINTENANCE' && <span className="text-amber-300 font-black flex items-center gap-1">🔧 {t.controls.maintenance}</span>}
            {lineData.machineStatus === 'STOPPED' && <span className="text-rose-200 font-black flex items-center gap-1">🔴 {t.controls.stopped}</span>}
            {(!lineData.machineStatus) && <span className="text-emerald-400 flex items-center gap-1">🟢 {t.controls.running}</span>}
          </div>
        </div>

        {/* Machine Shot Total */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg py-1.5 px-2 text-center shadow-md">
          <div className={`font-sans font-bold tracking-wider text-slate-400 uppercase mb-0.5 ${
            isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          }`}>
            {t.controls.totalShot}
          </div>
          <div className={`text-emerald-400 font-black font-mono tracking-tight tabular-nums ${
            isFullscreenMode ? 'text-base sm:text-xl md:text-2xl lg:text-3xl' : 'text-sm sm:text-base md:text-xl'
          }`}>
            {formatShots(lineData.machineShotTotal)} <span className="text-xs sm:text-sm font-bold text-emerald-500/80">Shot</span>
          </div>
        </div>

        {/* Shift Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg py-1.5 px-2 text-center shadow-md">
          <div className={`font-sans font-bold tracking-wider text-slate-400 uppercase mb-0.5 ${
            isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          }`}>
            {t.controls.shiftShot}
          </div>
          <div className={`text-white font-black font-mono tabular-nums ${
            isFullscreenMode ? 'text-base sm:text-xl md:text-2xl lg:text-3xl' : 'text-sm sm:text-base md:text-xl'
          }`}>
            {formatShots(lineData.shiftShot)} <span className="text-xs sm:text-sm font-bold text-slate-400">Shot</span>
          </div>
        </div>

        {/* Daily Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg py-1.5 px-2 text-center shadow-md">
          <div className={`font-sans font-bold tracking-wider text-slate-400 uppercase mb-0.5 ${
            isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          }`}>
            {t.controls.dailyShot}
          </div>
          <div className={`text-white font-black font-mono tabular-nums ${
            isFullscreenMode ? 'text-base sm:text-xl md:text-2xl lg:text-3xl' : 'text-sm sm:text-base md:text-xl'
          }`}>
            {formatShots(lineData.dailyShot)} <span className="text-xs sm:text-sm font-bold text-slate-400">Shot</span>
          </div>
        </div>

        {/* Monthly Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg py-1.5 px-2 text-center shadow-md">
          <div className={`font-sans font-bold tracking-wider text-slate-400 uppercase mb-0.5 ${
            isFullscreenMode ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
          }`}>
            {t.controls.monthlyShot}
          </div>
          <div className={`text-cyan-300 font-black font-mono tabular-nums ${
            isFullscreenMode ? 'text-base sm:text-xl md:text-2xl lg:text-3xl' : 'text-sm sm:text-base md:text-xl'
          }`}>
            {formatShots(lineData.monthlyShot)} <span className="text-xs sm:text-sm font-bold text-slate-400">Shot</span>
          </div>
        </div>
      </div>

      {/* TABLE SECTION TITLE - flex-none */}
      <div className={`flex-none bg-[#0C1A33] border border-slate-800 text-center py-1 rounded-t-lg font-black tracking-wider text-cyan-200 uppercase font-sans flex items-center justify-between px-3 ${
        isFullscreenMode ? 'text-sm sm:text-base lg:text-lg py-1.5' : 'text-xs sm:text-sm md:text-base'
      }`}>
        <span>FIN DIE PART LIFE MONITORING - LINE {selectedLineId}</span>
        <span className="text-xs lg:text-sm font-mono text-slate-400 font-medium hidden sm:inline">{t.controls.clickStatusHint}</span>
      </div>

      {/* TV MAIN MONITORING CONTAINER (FLEX-1 AUTO-STRETCH TO FILL 100% SCREEN HEIGHT) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#070F1E] border-x border-b border-slate-800/90 mb-1.5 rounded-b-lg shadow-inner table-container">
        {/* Horizontal Scroll Wrapper to ensure crisp formatting without squishing or header overlap */}
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-[960px] w-full flex-1 flex flex-col min-h-0">
            {/* Table Header Row (flex-none) */}
            <div className={`flex-none bg-[#0B172E] border-b-2 border-slate-700 text-cyan-300 font-black uppercase flex items-center px-1.5 py-2 select-none relative tracking-wider font-mono ${
              isFullscreenMode ? 'min-h-[44px] lg:min-h-[52px] text-xs sm:text-sm md:text-base lg:text-lg' : 'min-h-[38px] text-xs sm:text-sm md:text-base'
            }`}>
              <div className="h-full flex items-center justify-center flex-shrink-0 border-r border-slate-800/70 relative text-center leading-tight min-w-[40px] p-0.5" style={{ width: `${colWidths.no}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.no}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'no')} />
              </div>
              <div className="h-full flex items-center justify-start px-2 sm:px-3 font-sans border-r border-slate-800/70 flex-shrink-0 relative leading-tight min-w-[140px] p-0.5" style={{ width: `${colWidths.stage}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.partName}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'stage')} />
              </div>
              <div className="h-full flex items-center justify-end px-2 sm:px-3 border-r border-slate-800/70 flex-shrink-0 relative text-right leading-tight min-w-[85px] p-0.5" style={{ width: `${colWidths.lifeLimit}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.limit}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'lifeLimit')} />
              </div>
              <div className="h-full flex items-center justify-end px-2 sm:px-3 border-r border-slate-800/70 flex-shrink-0 relative text-right leading-tight min-w-[90px] p-0.5" style={{ width: `${colWidths.currentShot}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.current}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'currentShot')} />
              </div>
              <div className="h-full flex items-center justify-center px-1.5 sm:px-2 border-r border-slate-800/70 flex-shrink-0 relative text-center leading-tight min-w-[70px] p-0.5" style={{ width: `${colWidths.usage}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.usage}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'usage')} />
              </div>
              <div className="h-full flex items-center justify-end px-2 sm:px-3 border-r border-slate-800/70 flex-shrink-0 relative text-right leading-tight min-w-[90px] p-0.5" style={{ width: `${colWidths.remaining}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.remain}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'remaining')} />
              </div>
              <div className="h-full flex items-center justify-center px-1.5 sm:px-2 border-r border-slate-800/70 flex-shrink-0 relative text-center leading-tight min-w-[90px] p-0.5" style={{ width: `${colWidths.progress}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.progress}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'progress')} />
              </div>
              <div className="h-full flex items-center justify-end px-2 sm:px-3 border-r border-slate-800/70 flex-shrink-0 relative text-right leading-tight min-w-[90px] p-0.5" style={{ width: `${colWidths.lastChange}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.lastChange}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'lastChange')} />
              </div>
              <div className="h-full flex items-center justify-center px-1.5 sm:px-2 border-r border-slate-800/70 flex-shrink-0 relative text-center leading-tight min-w-[60px] p-0.5" style={{ width: `${colWidths.installQty}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.installed}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'installQty')} />
              </div>
              <div className="h-full flex items-center justify-center px-1.5 sm:px-2 border-r border-slate-800/70 flex-shrink-0 relative text-center leading-tight min-w-[60px] p-0.5" style={{ width: `${colWidths.spareQty}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.spare}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'spareQty')} />
              </div>
              <div className="h-full flex items-center justify-center px-1.5 sm:px-2 flex-shrink-0 relative text-center leading-tight min-w-[80px] p-0.5" style={{ width: `${colWidths.status}%` }}>
                <span className="break-words drop-shadow-sm">{t.table.status}</span>
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-cyan-500/50 z-10" onMouseDown={(e) => handleResizeStart(e, 'status')} />
              </div>
            </div>

            {/* Table Rows Body (Flex-1 Evenly Distributed Fill Vertical Height) */}
            <div className="flex-1 flex flex-col justify-between min-h-0 divide-y divide-slate-800/80 overflow-y-auto custom-scrollbar">
              {items.map((item, idx) => (
                <TvTableRow
                  key={item.slotId || item.partCode || idx}
                  item={item}
                  idx={idx}
                  colWidths={colWidths}
                  onSelectModalItem={setSelectedModalItem}
                  t={t}
                  isFullscreen={isFullscreenMode}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM MARQUEE / ALERT BANNER - flex-none */}
      <div className={`flex-none bg-[#2E0909] border border-red-700/80 rounded-lg flex items-center overflow-hidden font-mono shadow-md ${
        isFullscreenMode ? 'py-1 lg:py-1.5' : ''
      }`}>
        <div className={`bg-red-600 text-white font-black px-3 py-1.5 flex items-center gap-1.5 uppercase flex-shrink-0 tracking-wider ${
          isFullscreenMode ? 'text-xs sm:text-sm lg:text-base' : 'text-xs sm:text-sm'
        }`}>
          <AlertTriangle className="w-4 h-4 fill-white text-red-600" />
          <span>ALERT</span>
        </div>
        <div className={`px-3 py-1.5 text-red-100 font-black truncate flex-1 tracking-wide ${
          isFullscreenMode ? 'text-xs sm:text-sm md:text-base lg:text-lg' : 'text-xs sm:text-sm md:text-base'
        }`}>
          {dynamicTickerMessage}
        </div>
      </div>

      {/* ITEM STATUS & WARNING DETAIL MODAL */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B172E] border-2 border-cyan-500/80 rounded-xl shadow-2xl max-w-xl w-full p-5 text-slate-100 font-sans space-y-4 relative">
            <button
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  LINE {selectedLineId} • PART STATUS DETAILS
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {selectedModalItem.stagePunchDie || selectedModalItem.partName}
                </h3>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">CURRENT SHOT</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {formatShots(selectedModalItem.usedShot !== undefined ? selectedModalItem.usedShot : selectedModalItem.currentShot)}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">LIFE LIMIT</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {selectedModalItem.lifeLimit > 0 ? formatShots(selectedModalItem.lifeLimit) : 'NO STD'}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">REMAINING SHOT</div>
                <div className={`text-base font-bold mt-0.5 ${selectedModalItem.remainingShot < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatShots(selectedModalItem.remainingShot)}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">USAGE RATE</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {selectedModalItem.usagePercent}%
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">INSTALL QTY</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {selectedModalItem.installQty} Pcs
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">SPARE STOCK</div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">
                  {selectedModalItem.availableSpare !== undefined ? selectedModalItem.availableSpare : selectedModalItem.backupQty} Pcs
                </div>
              </div>
            </div>

            {/* Status Recommendation Box */}
            <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
              selectedModalItem.usagePercent >= 100
                ? 'bg-red-950/60 border-red-600 text-red-200'
                : selectedModalItem.usagePercent >= 90
                ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                : selectedModalItem.usagePercent >= 80
                ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                : 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
            }`}>
              <div className="font-bold font-mono text-sm uppercase mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>คำแนะนำการบำรุงรักษาและการเปลี่ยนชิ้นส่วน (RECOMMENDED ACTION)</span>
              </div>
              {selectedModalItem.usagePercent >= 100 ? (
                <p>⚠️ **เกินกำหนดอายุมาตรฐาน (OVER LIFE)**: ชิ้นส่วนนี้ใช้งานครบกำหนดแล้ว ควรดำเนินการเปลี่ยนชิ้นส่วนใหม่ทันที เพื่อป้องกันครีบฟินไม่ได้มาตรฐาน (Fin Defect) หรือ Die เสียหาย</p>
              ) : selectedModalItem.usagePercent >= 90 ? (
                <p>🚨 **วิกฤต (CRITICAL ≥ 90%)**: ชิ้นส่วนอยู่ในช่วงวิกฤตใกล้หมดอายุ โปรดเตรียมอะไหล่สำรองและวางแผนเปลี่ยนชิ้นส่วนในรอบ Maintenance ถัดไป</p>
              ) : selectedModalItem.usagePercent >= 80 ? (
                <p>⚠️ **เตรียมตัว (PREPARE ≥ 80%)**: ชิ้นส่วนเริ่มมีความเสื่อมสภาพ ตรวจสอบสต็อกอะไหล่สำรองเพื่อความพร้อมในการผลิต</p>
              ) : (
                <p>✅ **ปกติ (NORMAL)**: ชิ้นส่วนทำงานอยู่ในเกณฑ์มาตรฐาน ไม่พบความผิดปกติ</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors"
              >
                ปิดหน้าต่าง (CLOSE)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
