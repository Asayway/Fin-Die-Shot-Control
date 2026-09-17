import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  X,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import { 
  LineLiveMonitoringData, 
  ProductionLineId, 
  PartLiveTrackingItem
} from '../../types';
import { storageService } from '../../services/storageService';
import { 
  formatShots, 
  calculatePartMetrics, 
  sortTrackingItems, 
  TvSortMode
} from '../../services/calculationService';
import { getI18n, LanguageCode, useLanguage } from '../../i18n';
import { TvTableRow } from './TvTableRow';

interface TvDashboardViewProps {
  initialLineId?: ProductionLineId;
  isFullscreenMode?: boolean;
  onToggleFullscreen?: () => void;
}

export const TvDashboardView: React.FC<TvDashboardViewProps> = ({
  initialLineId = 'E1',
  isFullscreenMode = false,
  onToggleFullscreen
}) => {
  const { t: translate, language } = useLanguage();
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [lineData, setLineData] = useState<LineLiveMonitoringData | null>(null);

  // Auto Cycle (Auto Rotate Lines) State
  const [isAutoCycleActive, setIsAutoCycleActive] = useState<boolean>(false);
  const [autoCycleInterval, setAutoCycleInterval] = useState<number>(10); // 5, 10, 15, 20 seconds
  const [countdown, setCountdown] = useState<number>(10);

  // Active Display Language
  const currentLang = language;
  const t = getI18n(currentLang);
  
  // Sort Mode State
  const [tvSortMode, setTvSortMode] = useState<TvSortMode>(() => {
    return (localStorage.getItem('findie_tv_sort_mode') as TvSortMode) || 'STAGE_ORDER';
  });
  
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedModalItem, setSelectedModalItem] = useState<PartLiveTrackingItem | null>(null);

  // Exact 8-column layout matching the LG Monitor dashboard aesthetic (sum = 100%)
  const DEFAULT_TV_COL_WIDTHS: Record<string, number> = {
    stage: 19.0,
    replacement: 14.0,
    shot: 14.0,
    progress: 18.0,
    lifetime: 11.0,
    installQty: 7.0,
    stockQty: 7.0,
    orderRequire: 10.0
  };

  // Proportional Column Resizing State
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('findie_tv_col_widths_v7_lg');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.stage && parsed.shot && parsed.progress >= 12) {
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
          localStorage.setItem('findie_tv_col_widths_v7_lg', JSON.stringify(updated));
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

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5'];

  const reloadData = () => {
    const rawData = storageService.getLineMonitoring(selectedLineId);
    if (!rawData) {
      setLineData(null);
      return;
    }

    const standards = storageService.getLifeStandards();
    const stocks = storageService.getSpareStocks();
    const partMasters = storageService.getPartMasters();
    const lineConfigs = storageService.getLineConfigs();
    
    // Find active configuration from lineConfigs or rawData
    const activeConfig = lineConfigs.find(c => c.lineId === selectedLineId && c.isActive) || rawData.activeConfig;

    // Check if configuration exists
    const hasConfig = !!activeConfig;

    // Check system connection status
    const plcConfig = storageService.getPLCConfig();
    const isSimMode = plcConfig.connectionMode === 'SIMULATION';
    const isAutoPolling = plcConfig.isAutoPolling;

    // Determine data source and freshness
    let dataSource: 'REAL_PLC' | 'SIMULATION' | 'LOCAL_MANUAL' | 'NO_DATA' = 'LOCAL_MANUAL';
    let dataFreshness: 'REALTIME' | 'STALE' | 'OFFLINE' | 'NO_DATA' = 'REALTIME';

    if (!isAutoPolling) {
      dataFreshness = 'OFFLINE';
    } else if (isSimMode) {
      dataSource = 'SIMULATION';
    } else {
      dataSource = 'REAL_PLC';
    }

    // Check timestamp freshness (stale if > 60 seconds old)
    if (rawData.lastUpdate) {
      const lastUpTime = new Date(rawData.lastUpdate).getTime();
      if (!isNaN(lastUpTime) && Date.now() - lastUpTime > 60000) {
        dataFreshness = 'STALE';
      }
    } else {
      dataFreshness = 'NO_DATA';
    }

    const recalculatedItems = (rawData.items || []).map((item) => {
      // Match with Part Master
      const matchedPart = partMasters.find(p => 
        (item.partCode && p.partCode === item.partCode) || 
        (item.stagePunchDie && p.stageName === item.stagePunchDie) || 
        (item.partName && p.partName === item.partName)
      );
      
      // Match with Life Standards
      const matchedStd = standards.find(s => 
        (item.partCode && ((s as any).partCode === item.partCode || s.configKey?.partCode === item.partCode)) || 
        (item.stagePunchDie && s.stagePunchDie === item.stagePunchDie) ||
        (item.partName && s.partName === item.partName)
      );

      // Match with Spare Stock
      const matchedStock = stocks.find(s => 
        (item.partCode && s.partCode === item.partCode) || 
        (item.partName && s.partName === item.partName)
      );

      // Use actual permanent part code or existing slotId without deriving from array indexes
      const permanentPartCode = item.partCode || matchedPart?.partCode || '';
      const permanentSlotId = item.slotId || (permanentPartCode ? `SLOT-${permanentPartCode}` : (item.stagePunchDie ? `SLOT-${item.stagePunchDie.replace(/\s+/g, '_')}` : 'SLOT-UNASSIGNED'));

      // Do NOT invent realistic fallback numbers (18,000,000 or 168)
      const lifeLimitVal = item.lifeLimit > 0 ? item.lifeLimit : (matchedStd?.lifeLimitShots || 0);
      const installQtyVal = item.installQty > 0 ? item.installQty : (matchedStock?.requiredQuantityPerFullReplacement || 0);

      // Resolve real-time stock from master/configs to ensure it matches and updates instantly
      const hasLineStockConfig = activeConfig && activeConfig.stockQuantities && activeConfig.stockQuantities[permanentPartCode] !== undefined;
      const lineStockQty = hasLineStockConfig ? activeConfig!.stockQuantities![permanentPartCode] : undefined;
      const totalStockQty = matchedStock 
        ? (matchedStock.availableQuantity !== undefined ? matchedStock.availableQuantity : (matchedStock.currentStockQty !== undefined ? matchedStock.currentStockQty : matchedStock.onHandQuantity)) 
        : item.backupQty;
      const stockQtyVal = lineStockQty !== undefined ? lineStockQty : totalStockQty;

      const partDisplayName = item.partName || matchedPart?.partName || item.stagePunchDie || 'Tooling Component';
      const stageName = item.stagePunchDie || matchedPart?.stageName || item.partName || 'Die Stage';

      return calculatePartMetrics(
        {
          slotId: permanentSlotId,
          partCode: permanentPartCode,
          partName: partDisplayName,
          stagePunchDie: stageName,
          position: item.position || stageName,
          installQty: installQtyVal,
          backupQty: stockQtyVal,
          usedShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          currentShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          shotAtLastChange: item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot,
          lastChangeShot: item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot,
          regrindCount: item.regrindCount,
          totalMmGround: item.totalMmGround,
          lifeLimit: lifeLimitVal
        },
        activeConfig,
        standards,
        stocks,
        rawData.dailyShot || 0
      );
    });

    // Filter and sort items according to the TV display configurations for the selected line
    const tvConfigs = storageService.getTvDisplayConfigs();
    const lineTvConfig = tvConfigs[selectedLineId] || [];

    let sortedItems = recalculatedItems;
    if (lineTvConfig.length > 0) {
      // Filter items to include only those selected in the TV config
      const selectedSet = new Set(lineTvConfig);
      const filteredItems = recalculatedItems.filter(item => {
        return item.partCode && selectedSet.has(item.partCode);
      });

      // If sort mode is 'STAGE_ORDER' or standard default, use the exact manual ordering from lineTvConfig!
      // Otherwise, apply the chosen sort mode on the filtered items list.
      if (tvSortMode === 'STAGE_ORDER' || !tvSortMode) {
        const orderMap = new Map<string, number>();
        lineTvConfig.forEach((pCode, idx) => orderMap.set(pCode, idx));
        filteredItems.sort((a, b) => {
          const idxA = orderMap.get(a.partCode) ?? 999;
          const idxB = orderMap.get(b.partCode) ?? 999;
          return idxA - idxB;
        });
        sortedItems = filteredItems;
      } else {
        sortedItems = sortTrackingItems(filteredItems, tvSortMode);
      }
    } else {
      // If no custom config is saved, display all items sorted by the chosen sort mode
      sortedItems = sortTrackingItems(recalculatedItems, tvSortMode);
    }

    // Explicit machine status based on connection and config
    let effectiveMachineStatus = rawData.machineStatus;
    if (!hasConfig) {
      effectiveMachineStatus = 'NOT_CONFIGURED';
    } else if (dataFreshness === 'OFFLINE') {
      effectiveMachineStatus = 'CONNECTION_LOST';
    } else if (dataFreshness === 'STALE') {
      effectiveMachineStatus = 'STALE_DATA';
    } else if (dataSource === 'SIMULATION') {
      effectiveMachineStatus = 'SIMULATION_ACTIVE';
    }

    setLineData({
      ...rawData,
      activeConfig,
      machineStatus: effectiveMachineStatus,
      lineName: `LINE ${selectedLineId}`,
      items: sortedItems,
      dataSource,
      dataFreshness,
      hasStandard: recalculatedItems.some(i => i.lifeLimit > 0)
    });
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(() => {
      reloadData();
    });
    return () => unsub();
  }, [selectedLineId, tvSortMode]);

  // Exact timestamp format matching the LG Monitor: YYYY.MM.DD HH:mm:ss
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto Cycle (Auto Switch Line) Effect
  useEffect(() => {
    if (!isAutoCycleActive) {
      setCountdown(autoCycleInterval);
      return;
    }

    setCountdown(autoCycleInterval);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setSelectedLineId(currentLine => {
            // Sequential list of all lines
            const allLines: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5'];
            
            // Find current index
            const currentIdx = allLines.indexOf(currentLine);
            
            // Go strictly to the next line in the sequence, wrapping around at the end
            const nextIdx = (currentIdx + 1) % allLines.length;
            return allLines[nextIdx];
          });
          return autoCycleInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoCycleActive, autoCycleInterval]);

  if (!lineData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#000000] text-white font-mono">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold">LOADING LG MONITOR DASHBOARD...</p>
        </div>
      </div>
    );
  }

  const rawItems = lineData.items || [];
  // Filter out any blank or empty rows
  const items = rawItems.filter(item => item && (item.stagePunchDie || item.partName || item.partCode));
  
  // Format line display title
  const getLineLabel = (id: ProductionLineId) => {
    if (id === 'E1') return 'HE1';
    if (id === 'E2') return 'HE2';
    if (id === 'E3-1') return 'E3 Slit 3P';
    if (id === 'E3-2') return 'E3 WL+ 4P';
    if (id === 'E3-3') return 'E3 New Cor 4P';
    if (id === 'E4') return 'HE4';
    if (id === 'E5') return 'HE5';
    return id;
  };

  const lineLabel = getLineLabel(selectedLineId);
  const lineDisplayName = selectedLineId === 'E3-1' ? 'LINE E3 Slit 3P' :
                          selectedLineId === 'E3-2' ? 'LINE E3 WL+ 4P' :
                          selectedLineId === 'E3-3' ? 'LINE E3 New Cor 4P' :
                          `LINE ${selectedLineId}`;
  const totalMachineShots = lineData.machineShotTotal !== undefined && lineData.machineShotTotal !== null ? lineData.machineShotTotal : null;
  const todayMachineShots = lineData.dailyShot !== undefined && lineData.dailyShot !== null ? lineData.dailyShot : null;

  // Active Die Info from configuration / Die Parts Master
  const activeCfg = lineData.activeConfig;
  const dieNameDisplay = activeCfg?.dieName || (activeCfg ? `Fin Die ${selectedLineId}` : 'DIE NOT CONFIGURED');

  // Telemetry source & freshness indicators
  const dataSourceLabel = lineData.dataSource === 'SIMULATION' ? 'SIMULATION' :
                          lineData.dataSource === 'REAL_PLC' ? 'REAL PLC' :
                          lineData.dataSource === 'LOCAL_MANUAL' ? 'LOCAL / MANUAL' : 'NO DATA';
  const freshnessLabel = lineData.dataFreshness === 'REALTIME' ? 'REALTIME' :
                         lineData.dataFreshness === 'STALE' ? 'STALE DATA' :
                         lineData.dataFreshness === 'OFFLINE' ? 'CONNECTION LOST' : 'NO DATA';
  const freshnessColor = lineData.dataFreshness === 'REALTIME' && lineData.dataSource !== 'SIMULATION'
    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
    : lineData.dataSource === 'SIMULATION'
    ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
    : 'bg-red-950/90 border-red-500 text-red-300 animate-pulse';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#000000] text-white select-none overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: LG ELECTRONICS BRANDED HEADER BAR */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#000000] border-b border-[#222222] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left: LG Electronics Text */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight text-white font-sans">
            LG Electronics
          </span>
        </div>

        {/* Center: FIN DIE SHOT COUNT */}
        <div className="text-center flex-1 mx-2 overflow-hidden">
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wide text-white font-sans uppercase truncate">
            {lineDisplayName} FIN DIE SHOT COUNT
          </h1>
        </div>

        {/* Right: Fullscreen Controls + Live Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2 bg-[#181818] hover:bg-[#282828] border border-[#444444] rounded text-white font-bold transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}

          {/* Live Clock: YYYY.MM.DD HH:mm:ss */}
          <div className="font-mono font-black text-base sm:text-lg md:text-xl text-white px-3 sm:px-4 py-1.5 bg-[#111111] border border-[#333333] rounded tabular-nums">
            {currentTime || '2026.09.12 10:36:57'}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUB-HEADER: UNIFIED DARK THEME CONTROL BAR */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#0a0a0a] text-white border-y border-[#262626] px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 overflow-x-auto">
        {/* Left Stats: Main Fin Die | Total | Today */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap min-w-0">
          
          {/* Box 1: Main Fin Die */}
          <div className="flex items-center gap-2 border-r border-[#333333] pr-3 sm:pr-6 flex-shrink-0">
            <span className="font-black text-[#facc15] text-sm sm:text-base md:text-lg uppercase tracking-wide">
              {t.tv.mainFinDie || 'MAIN FIN DIE'}
            </span>
            <span className="font-black text-white text-sm sm:text-base md:text-lg">
              {dieNameDisplay}
            </span>
          </div>

          {/* Box 2: Total */}
          <div className="flex items-center gap-2 border-r border-[#333333] pr-3 sm:pr-6 flex-shrink-0">
            <span className="text-xs sm:text-sm text-[#aaaaaa] font-bold">
              {t.tv.total || 'Total'}
            </span>
            <span className="font-mono font-black text-white text-base sm:text-lg md:text-xl tabular-nums">
              {totalMachineShots !== null ? (
                formatShots(totalMachineShots)
              ) : (
                <span className="text-xs text-slate-500 uppercase">NO DATA</span>
              )}
            </span>
          </div>

          {/* Box 3: Today */}
          <div className="flex items-center gap-2 border-r border-[#333333] pr-3 sm:pr-6 flex-shrink-0">
            <span className="text-xs sm:text-sm text-[#aaaaaa] font-bold">
              {t.tv.today || 'Today'}
            </span>
            <span className="font-mono font-black text-white text-base sm:text-lg md:text-xl tabular-nums">
              {todayMachineShots !== null ? (
                formatShots(todayMachineShots)
              ) : (
                <span className="text-xs text-slate-500 uppercase">NO DATA</span>
              )}
            </span>
          </div>

          {/* Box 4: Telemetry Source & Freshness (Explicit separation of Simulation, Real PLC, Status) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-black border ${freshnessColor}`}>
              {freshnessLabel}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold bg-[#1e232d] border border-[#3e4756] text-slate-300">
              SRC: {dataSourceLabel}
            </span>
          </div>
        </div>

        {/* Right: Compact Shot Count Signal Standard & Auto Width (Right Aligned to Table Edge) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold">
            <span className="text-[#888888] font-bold uppercase hidden md:inline mr-0.5 text-[10px] sm:text-xs">
              {t.tv.signalStandard || 'SIGNAL STANDARD:'}
            </span>
            <span className="px-2 py-0.5 bg-[#00ff00] text-black rounded font-black text-[10px] sm:text-xs whitespace-nowrap" title="Normal: < 70%">
              {t.tv.normal || 'Normal'}
            </span>
            <span className="px-2 py-0.5 bg-[#ffff00] text-black rounded font-black text-[10px] sm:text-xs whitespace-nowrap" title="Warning Replace Count: 70% - 84%">
              {t.tv.warning || 'Warning'}
            </span>
            <span className="px-2 py-0.5 bg-[#f97316] text-white rounded font-black text-[10px] sm:text-xs whitespace-nowrap" title="Prepare Replace Count: 85% - 99%">
              {t.tv.prepare || 'Prepare'}
            </span>
            <span className="px-2 py-0.5 bg-[#ff0000] text-white rounded font-black text-[10px] sm:text-xs whitespace-nowrap" title="Over Life Replace Count: >= 100%">
              {t.tv.overLife || 'Over Life'}
            </span>
          </div>

          {/* Auto Width Button */}
          <div className="flex items-center gap-2">
            {/* Reset / Auto Width button */}
            <button
              type="button"
              onClick={() => {
                setColWidths(DEFAULT_TV_COL_WIDTHS);
                localStorage.setItem('findie_tv_col_widths_v7_lg', JSON.stringify(DEFAULT_TV_COL_WIDTHS));
              }}
              className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-300 hover:text-white border border-[#444444] rounded bg-[#181818] hover:bg-[#252525] transition-colors cursor-pointer whitespace-nowrap"
              title="Reset Columns"
            >
              {t.tv.autoWidth || 'Auto Width'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN TABLE: EXACT 8-COLUMN INDUSTRIAL MONITOR GRID */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#000000] table-container">
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px] w-full flex-1 flex flex-col min-h-0">
            
            {/* Table Header: Pure Dark Theme matching top bar, bold white text, clear border (ALL HEADERS CENTERED) */}
            <div className="flex-none bg-[#14161a] text-white font-black flex items-center select-none relative text-xs sm:text-sm md:text-base lg:text-lg border-b-2 border-[#282828] min-h-[46px] sm:min-h-[52px] md:min-h-[58px]">
              
              {/* Col 1: Stage Punch / Die (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.stage}%` }}
              >
                <span className="truncate">{t.tv.stagePunchDie}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'stage')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 2: Replacement Count (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.replacement}%` }}
              >
                <span className="truncate">{t.tv.replacementCount}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'replacement')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 3: Shot Count (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.shot}%` }}
              >
                <span className="truncate">{t.tv.shotCount}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'shot')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 4: Progress (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.progress}%` }}
              >
                <span className="truncate">{t.tv.progress}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'progress')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 5: Life Time (Days) (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.lifetime}%` }}
              >
                <span className="truncate">{t.tv.lifeTime}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'lifetime')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 6: Install Qty. (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.installQty}%` }}
              >
                <span className="truncate">{t.tv.installQty}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'installQty')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 7: Stock Qty. (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 border-r border-[#282828] flex-shrink-0 relative"
                style={{ width: `${colWidths.stockQty}%` }}
              >
                <span className="truncate">{t.tv.stockQty}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-white/50 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'stockQty')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 8: Order Require (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 flex-shrink-0 relative"
                style={{ width: `${colWidths.orderRequire}%` }}
              >
                <span className="truncate">{t.tv.orderRequire}</span>
              </div>

            </div>

            {/* Table Rows Body: solid background, dynamic flex distribution */}
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden bg-[#000000]">
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0c10] text-slate-400 font-mono">
                  <div className="text-center space-y-2">
                    <p className="text-base sm:text-lg font-bold text-amber-400 uppercase tracking-wider">
                      NO TOOLING PARTS CONFIGURED FOR {lineDisplayName}
                    </p>
                    <p className="text-xs text-slate-500">
                      STATUS: {lineData.machineStatus} • SOURCE: {dataSourceLabel}
                    </p>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <TvTableRow
                    key={item.slotId || (item.partCode ? `part-${item.partCode}` : item.stagePunchDie)}
                    item={item}
                    idx={0}
                    colWidths={colWidths}
                    onSelectModalItem={setSelectedModalItem}
                    t={t}
                    isFullscreen={isFullscreenMode}
                  />
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM BAR: LINE SELECTOR BAR (HE1 - HE5) */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#000000] border-t border-[#222222] px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
        {/* Left: Line Selection Buttons (E1 - E5) with Subtag matching Part Master */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {linesList.map((lineId) => {
            const isSelected = selectedLineId === lineId;
            const label = getLineLabel(lineId);
            const subTag = lineId === 'E1' ? 'Ø7 Slit' :
                           lineId === 'E2' ? 'Ø5 Slit' :
                           lineId === 'E4' ? 'Ø5 Slit' :
                           lineId === 'E5' ? 'Ø5 Slit' : '';
            return (
              <button
                key={lineId}
                type="button"
                onClick={() => {
                  setSelectedLineId(lineId);
                  setCountdown(autoCycleInterval);
                }}
                className={`px-2 py-1 text-[11px] sm:text-xs font-mono font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-[125px] sm:min-w-[140px] flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#00ff00] text-black border border-[#00dd00] shadow-[0_0_10px_rgba(0,255,0,0.85)] font-black'
                    : 'bg-[#181818] text-white hover:bg-[#282828] border border-[#444444]'
                }`}
              >
                <span className="truncate">{label}</span>
                {subTag && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold flex-shrink-0 ${
                    isSelected ? 'bg-black text-[#00ff00]' : 'bg-[#2a2a2a] text-slate-300'
                  }`}>
                    {subTag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side Bottom-Right Auto Cycle Controls & Status Badge */}
        <div className="flex items-center gap-2">
          {/* Status Badge matching Auto Cycle button size */}
          {lineData && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded transition-all ${
              lineData.machineStatus === 'STOPPED' 
                ? 'bg-red-950/90 border border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse' :
              lineData.machineStatus === 'IDLE' 
                ? 'bg-amber-950/90 border border-yellow-400 text-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.7)] animate-pulse' :
              lineData.machineStatus === 'MAINTENANCE' 
                ? 'bg-blue-950/90 border border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.7)] animate-pulse' :
              lineData.machineStatus === 'CHANGEOVER'
                ? 'bg-purple-950/90 border border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.7)] animate-pulse' :
              lineData.machineStatus === 'SIMULATION_ACTIVE'
                ? 'bg-amber-950/90 border border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.7)] animate-pulse' :
              lineData.machineStatus === 'CONNECTION_LOST' || lineData.machineStatus === 'NO_DATA'
                ? 'bg-red-950/90 border border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse' :
              lineData.machineStatus === 'STALE_DATA'
                ? 'bg-amber-950/90 border border-amber-400 text-amber-200 animate-pulse' :
              lineData.machineStatus === 'NOT_CONFIGURED'
                ? 'bg-slate-900 border border-slate-600 text-slate-300' :
                'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
            }`} title={`Current Line Status: ${lineData.machineStatus}`}>
              <span>
                {lineData.machineStatus === 'STOPPED' ? '🔴' :
                 lineData.machineStatus === 'IDLE' ? '🟡' :
                 lineData.machineStatus === 'MAINTENANCE' ? '🔧' :
                 lineData.machineStatus === 'CHANGEOVER' ? '🔄' :
                 lineData.machineStatus === 'SIMULATION_ACTIVE' ? '⚡' :
                 lineData.machineStatus === 'CONNECTION_LOST' ? '❌' :
                 lineData.machineStatus === 'STALE_DATA' ? '⏳' :
                 lineData.machineStatus === 'NOT_CONFIGURED' ? '⚙️' :
                 lineData.machineStatus === 'NO_DATA' ? '❓' : '🟢'}
              </span>
              <span className="uppercase tracking-wider">
                {language === 'TH' ? (
                  lineData.machineStatus === 'RUNNING' ? 'กำลังผลิต' :
                  lineData.machineStatus === 'STOPPED' ? 'หยุดทำงาน' :
                  lineData.machineStatus === 'IDLE' ? 'พักสายผลิต' :
                  lineData.machineStatus === 'MAINTENANCE' ? 'ซ่อมบำรุง' :
                  lineData.machineStatus === 'CHANGEOVER' ? 'เปลี่ยนรุ่น' :
                  lineData.machineStatus === 'SIMULATION_ACTIVE' ? 'จำลองการทำงาน' :
                  lineData.machineStatus === 'CONNECTION_LOST' ? 'ขาดการเชื่อมต่อ' :
                  lineData.machineStatus === 'STALE_DATA' ? 'ข้อมูลค้าง' :
                  lineData.machineStatus === 'NOT_CONFIGURED' ? 'ยังไม่ตั้งค่า' :
                  lineData.machineStatus === 'NO_DATA' ? 'ไม่มีข้อมูล' :
                  lineData.machineStatus
                ) : language === 'KO' ? (
                  lineData.machineStatus === 'RUNNING' ? '가동 중' :
                  lineData.machineStatus === 'STOPPED' ? '정지됨' :
                  lineData.machineStatus === 'IDLE' ? '대기 중' :
                  lineData.machineStatus === 'MAINTENANCE' ? '보전 작업' :
                  lineData.machineStatus === 'CHANGEOVER' ? '모델 교체' :
                  lineData.machineStatus === 'SIMULATION_ACTIVE' ? '시뮬레이션 활성' :
                  lineData.machineStatus === 'CONNECTION_LOST' ? '통신 끊김' :
                  lineData.machineStatus === 'STALE_DATA' ? '데이터 지연' :
                  lineData.machineStatus === 'NOT_CONFIGURED' ? '미설정' :
                  lineData.machineStatus === 'NO_DATA' ? '데이터 없음' :
                  lineData.machineStatus
                ) : (
                  lineData.machineStatus.replace(/_/g, ' ')
                )}
              </span>
            </div>
          )}

          {/* Timer Interval selector buttons */}
          <div className="flex items-center gap-0.5 bg-[#141414] border border-[#444444] rounded p-0.5">
            {[5, 10, 15, 20].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setAutoCycleInterval(sec);
                  setCountdown(sec);
                }}
                className={`px-1.5 py-1 text-[10px] sm:text-xs font-bold font-mono rounded transition-colors cursor-pointer ${
                  autoCycleInterval === sec
                    ? 'bg-[#ffcc00] text-black font-black'
                    : 'text-slate-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Single Auto Cycle Toggle & Status Button */}
          <button
            type="button"
            onClick={() => {
              setIsAutoCycleActive(prev => !prev);
              setCountdown(autoCycleInterval);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              isAutoCycleActive
                ? 'bg-[#182818] border-2 border-[#00ff00] text-[#00ff00] shadow-[0_0_12px_rgba(0,255,0,0.6)] animate-pulse'
                : 'bg-[#181818] hover:bg-[#252525] border border-[#555555] text-slate-300 hover:text-white'
            }`}
            title="Toggle Auto Cycle lines"
          >
            {isAutoCycleActive ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-[#00ff00]" />
                <span className="font-black">
                  {language === 'TH' ? `หมุนเวียนอัตโนมัติ (${countdown}s)` : language === 'KO' ? `자동 순환 중 (${countdown}s)` : `AUTO CYCLING (${countdown}s)`}
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#00ff00] fill-current" />
                <span>
                  {language === 'TH' ? 'หมุนเวียนอัตโนมัติ: ปิด' : language === 'KO' ? '자동 순환: 꺼짐' : 'AUTO CYCLE: OFF'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. PART DETAILS MODAL */}
      {/* ========================================================= */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border-2 border-[#555555] text-white rounded-lg p-5 max-w-xl w-full space-y-4 shadow-2xl relative font-mono">
            <button
              type="button"
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white bg-[#282828] p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#333333] pb-2">
              <span className="text-xs text-[#00ff00] font-bold tracking-widest uppercase">
                {lineDisplayName} • STAGE SPECIFICATIONS
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {selectedModalItem.stagePunchDie || selectedModalItem.partName}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">REPLACEMENT COUNT</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedModalItem.lifeLimit > 0 ? formatShots(selectedModalItem.lifeLimit) : '-'}
                </div>
              </div>

              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">SHOT COUNT</div>
                <div className="text-base font-bold text-[#00ff00] mt-0.5">
                  {formatShots(selectedModalItem.usedShot !== undefined ? selectedModalItem.usedShot : selectedModalItem.currentShot)}
                </div>
              </div>

              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">PROGRESS</div>
                <div className="text-base font-bold text-yellow-300 mt-0.5">
                  {selectedModalItem.usagePercent}%
                </div>
              </div>

              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">LIFE TIME (DAYS)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedModalItem.daysRemainingForecast !== undefined && selectedModalItem.daysRemainingForecast > 0
                    ? `${selectedModalItem.daysRemainingForecast} Days`
                    : selectedModalItem.lifeLimit <= 0
                    ? 'STANDARD NOT SET'
                    : 'RATE UNSET'}
                </div>
              </div>

              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">INSTALL QTY.</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedModalItem.installQty > 0 ? `${selectedModalItem.installQty} Pcs` : 'NOT SET'}
                </div>
              </div>

              <div className="bg-[#242424] p-2.5 rounded border border-[#444444]">
                <div className="text-gray-400 text-[10px]">STOCK QTY.</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedModalItem.availableSpare !== undefined
                    ? `${selectedModalItem.availableSpare} Pcs`
                    : selectedModalItem.backupQty !== undefined
                    ? `${selectedModalItem.backupQty} Pcs`
                    : 'NO DATA'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className="px-5 py-2 rounded bg-[#00dd00] hover:bg-[#00ee00] text-black font-bold font-mono text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

