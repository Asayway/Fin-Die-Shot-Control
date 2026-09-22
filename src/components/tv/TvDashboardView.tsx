import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  X,
  Play,
  Pause,
  RotateCw,
  Sliders
} from 'lucide-react';
import { 
  LineLiveMonitoringData, 
  ProductionLineId, 
  PartLiveTrackingItem,
  MachineStatus
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
import { 
  TvAutoCycleConfig, 
  TvAutoCycleOrderModal, 
  getSavedAutoCycleConfig, 
  saveAutoCycleConfig 
} from './TvAutoCycleOrderModal';

const LINES_LIST: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5'];

interface TvDashboardViewProps {
  initialLineId?: ProductionLineId;
  isFullscreenMode?: boolean;
  onToggleFullscreen?: () => void;
}

export type TvLayoutMode = 'DETAILED' | 'COMPACT';

// Pure deterministic helper to calculate the next line in the active rotation flow
export const computeNextCycleLine = (
  currentLine: ProductionLineId,
  config: TvAutoCycleConfig,
  currentMonitoring?: Record<string, LineLiveMonitoringData>
): ProductionLineId => {
  const order = config?.order && config.order.length > 0
    ? config.order
    : (['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5'] as ProductionLineId[]);

  let activePool: ProductionLineId[] = [];

  if (config.mode === 'RUNNING_ONLY') {
    activePool = order.filter(lineId => {
      const mon = currentMonitoring?.[lineId];
      const status = mon?.machineStatus;
      if (status) {
        return status === 'RUNNING' || status === 'SIMULATION_ACTIVE';
      }
      return lineId !== 'E5'; // Default fallback
    });
  } else {
    activePool = order.filter(lineId => config.enabledLines?.[lineId] !== false);
  }

  // If no lines in pool, fallback to entire order
  if (activePool.length === 0) {
    activePool = order;
  }

  const currentIdx = activePool.indexOf(currentLine);
  if (currentIdx >= 0) {
    return activePool[(currentIdx + 1) % activePool.length];
  }

  // If currentLine is not in active pool (e.g. user manually selected an excluded line),
  // search forward in the full order to find the next active line:
  const orderIdx = order.indexOf(currentLine);
  if (orderIdx >= 0) {
    for (let offset = 1; offset <= order.length; offset++) {
      const candidate = order[(orderIdx + offset) % order.length];
      if (activePool.includes(candidate)) {
        return candidate;
      }
    }
  }

  return activePool[0];
};

export const TvDashboardView: React.FC<TvDashboardViewProps> = ({
  initialLineId = 'E1',
  isFullscreenMode = false,
  onToggleFullscreen
}) => {
  const { t: translate, language } = useLanguage();
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [lineData, setLineData] = useState<LineLiveMonitoringData | null>(null);
  const [monitoringData, setMonitoringData] = useState(() => storageService.getLinesMonitoring());

  // Auto Cycle (Auto Rotate Lines) State & Order Configuration
  const [isAutoCycleActive, setIsAutoCycleActive] = useState<boolean>(true);
  const [autoCycleInterval, setAutoCycleInterval] = useState<number>(5); // Default to 5 seconds
  const [countdown, setCountdown] = useState<number>(5);
  const [cycleConfig, setCycleConfig] = useState<TvAutoCycleConfig>(getSavedAutoCycleConfig);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  // Synchronized refs to avoid stale closures in high-frequency / timer callbacks
  const selectedLineIdRef = useRef<ProductionLineId>(selectedLineId);
  selectedLineIdRef.current = selectedLineId;

  const cycleConfigRef = useRef<TvAutoCycleConfig>(cycleConfig);
  cycleConfigRef.current = cycleConfig;

  const autoCycleIntervalRef = useRef<number>(autoCycleInterval);
  autoCycleIntervalRef.current = autoCycleInterval;

  const isAutoCycleActiveRef = useRef<boolean>(isAutoCycleActive);
  isAutoCycleActiveRef.current = isAutoCycleActive;

  // Active Display Language
  const currentLang = language;
  const t = getI18n(currentLang);
  
  // Sort Mode State
  const [tvSortMode, setTvSortMode] = useState<TvSortMode>(() => {
    return (localStorage.getItem('findie_tv_sort_mode') as TvSortMode) || 'STAGE_ORDER';
  });

  // Stage Layout Mode (Detailed vs Compact for small displays)
  const [tvLayoutMode, setTvLayoutMode] = useState<TvLayoutMode>(() => {
    const saved = localStorage.getItem('findie_tv_layout_mode');
    if (saved === 'DETAILED' || saved === 'COMPACT') return saved as TvLayoutMode;
    try {
      const sys = storageService.getSettings();
      if (sys?.stageDisplayMode) return sys.stageDisplayMode;
    } catch {
      // ignore
    }
    return 'DETAILED';
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

  const linesList = LINES_LIST;

  // Format line display title
  const getLineLabel = useCallback((id: ProductionLineId) => {
    if (id === 'E1') return 'E1';
    if (id === 'E2') return 'E2';
    if (id === 'E3-1') return 'E3 SLit';
    if (id === 'E3-2') return 'E3 WL';
    if (id === 'E3-3') return 'E3 New corr';
    if (id === 'E4') return 'E4';
    if (id === 'E5') return 'E5';
    return id;
  }, []);

  const getLineSubTag = useCallback((id: ProductionLineId) => {
    if (id === 'E1') return 'Ø7 Slit';
    if (id === 'E2') return 'Ø5 Slit';
    if (id === 'E3-1') return '3P';
    if (id === 'E3-2') return '4P';
    if (id === 'E3-3') return '4P';
    if (id === 'E4') return 'Ø5 Slit';
    if (id === 'E5') return 'Ø5 Slit';
    return '';
  }, []);

  // Helper to get real-time machine status of any line
  const getLineMachineStatus = React.useCallback((lineId: ProductionLineId): MachineStatus => {
    const monitoring = monitoringData[lineId];
    if (monitoring?.machineStatus) {
      return monitoring.machineStatus;
    }
    const configs = storageService.getLineConfigs();
    const cfg = configs.find(c => c.lineId === lineId);
    if (cfg && !cfg.isActive) {
      return 'IDLE';
    }
    return lineId === 'E5' ? 'STOPPED' : 'RUNNING';
  }, [monitoringData]);

  // Check if a line is active/running
  const isLineActiveForCycle = React.useCallback((lineId: ProductionLineId): boolean => {
    const status = getLineMachineStatus(lineId);
    return status === 'RUNNING' || status === 'SIMULATION_ACTIVE';
  }, [getLineMachineStatus]);

  // Find the next line in strict sequential order based on user-configured order and active selections
  const getNextActiveCycleLine = React.useCallback((currentLine: ProductionLineId): ProductionLineId => {
    return computeNextCycleLine(currentLine, cycleConfig, monitoringData);
  }, [cycleConfig, monitoringData]);

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
    const activeConfig = lineConfigs.find(c => c.lineId === selectedLineId && c.isActive) || lineConfigs.find(c => c.lineId === selectedLineId) || rawData.activeConfig;

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

    // Reconcile candidate items: combine rawData.items with any installed parts for this line
    const lineInstalledMap = activeConfig?.installedPartQuantities || {};
    const installedPartCodes = Object.keys(lineInstalledMap).filter(code => (lineInstalledMap[code] || 0) > 0);
    const existingPartCodes = new Set((rawData.items || []).map(i => (i.partCode || '').trim().toUpperCase()));

    const missingInstalledParts = installedPartCodes
      .filter(code => !existingPartCodes.has(code.trim().toUpperCase()))
      .map(code => {
        const pm = partMasters.find(p => p.partCode === code);
        const std = standards.find(s => s.configKey?.partCode === code || s.partName === pm?.partName || s.stagePunchDie === pm?.stageName);
        const stock = stocks.find(s => s.partCode === code || s.partName === pm?.partName);
        const installQty = lineInstalledMap[code] || (pm ? 1 : 0);
        const lifeLimit = std?.lifeLimitShots || 15000000;
        const totalShots = rawData.machineShotTotal || 0;
        const curShot = 0;

        return {
          slotId: `SLOT-${selectedLineId}-${code}`,
          partCode: code,
          partName: pm?.partName || `Part ${code}`,
          stagePunchDie: pm?.stageName || 'Die Stage',
          position: pm?.stageName || 'ALL',
          installQty: installQty,
          backupQty: stock?.availableQuantity ?? 10,
          usedShot: curShot,
          currentShot: curShot,
          shotAtLastChange: Math.max(0, totalShots - curShot),
          lastChangeShot: Math.max(0, totalShots - curShot),
          regrindCount: 0,
          totalMmGround: 0,
          lifeLimit: lifeLimit
        };
      });

    const allCandidateItems = [...(rawData.items || []), ...missingInstalledParts];

    const recalculatedItems = allCandidateItems.map((item) => {
      // Match with Part Master using strict precedence (partCode -> partName)
      // Never match purely on stage name alone, which would cause all parts in the same stage to collapse to one part
      const rawCode = (item.partCode || '').trim();
      const strippedCode = rawCode.replace(/^(E\d+(?:-\d+)?-)/i, '').trim();
      const rawName = (item.partName || '').trim();
      const cleanName = rawName.replace(/\s*\(.*?\)/g, '').trim().toLowerCase();

      let matchedPart = partMasters.find(p => 
        p.partCode.toLowerCase() === rawCode.toLowerCase() ||
        p.partCode.toLowerCase() === strippedCode.toLowerCase()
      );

      if (!matchedPart && rawName) {
        matchedPart = partMasters.find(p => 
          p.partName.toLowerCase() === rawName.toLowerCase() ||
          p.partName.replace(/\s*\(.*?\)/g, '').trim().toLowerCase() === cleanName
        );
      }
      
      // Match with Life Standards
      const matchedStd = standards.find(s => 
        (item.partCode && ((s as any).partCode === item.partCode || s.configKey?.partCode === item.partCode)) || 
        (strippedCode && ((s as any).partCode === strippedCode || s.configKey?.partCode === strippedCode)) ||
        (matchedPart && ((s as any).partCode === matchedPart.partCode || s.configKey?.partCode === matchedPart.partCode)) ||
        (item.partName && s.partName === item.partName) ||
        (matchedPart && s.partName === matchedPart.partName)
      );

      // Match with Spare Stock
      const matchedStock = stocks.find(s => 
        (item.partCode && s.partCode === item.partCode) || 
        (strippedCode && s.partCode === strippedCode) ||
        (matchedPart && s.partCode === matchedPart.partCode) ||
        (item.partName && s.partName === item.partName) ||
        (matchedPart && s.partName === matchedPart.partName)
      );

      // Use actual permanent part code or existing slotId without deriving from array indexes
      const permanentPartCode = matchedPart?.partCode || strippedCode || item.partCode || '';
      const legacyCode = item.partCode || '';
      const permanentSlotId = item.slotId || (permanentPartCode ? `SLOT-${permanentPartCode}` : (item.stagePunchDie ? `SLOT-${item.stagePunchDie.replace(/\s+/g, '_')}` : 'SLOT-UNASSIGNED'));

      // 1. Resolve Install Qty from active line config (Stock Matrix / Part Install Matrix)
      let installQtyVal: number | undefined = undefined;
      if (activeConfig && activeConfig.installedPartQuantities) {
        const normInstallMap = Object.entries(activeConfig.installedPartQuantities).reduce((acc, [k, v]) => {
          acc[k.trim().toUpperCase()] = v;
          return acc;
        }, {} as Record<string, number>);

        const lookupCode = permanentPartCode?.trim().toUpperCase() || legacyCode?.trim().toUpperCase();
        if (lookupCode && normInstallMap[lookupCode] !== undefined) {
          installQtyVal = normInstallMap[lookupCode];
        }
      }
      if (installQtyVal === undefined) {
        installQtyVal = item.installQty > 0 ? item.installQty : (matchedStock?.requiredQuantityPerFullReplacement || 0);
      }

      // 2. Resolve Stock Qty from active line config (Stock Matrix)
      let stockQtyVal: number | undefined = undefined;
      if (activeConfig && activeConfig.stockQuantities) {
        const normStockMap = Object.entries(activeConfig.stockQuantities).reduce((acc, [k, v]) => {
          acc[k.trim().toUpperCase()] = v;
          return acc;
        }, {} as Record<string, number>);

        const lookupCode = permanentPartCode?.trim().toUpperCase() || legacyCode?.trim().toUpperCase();
        if (lookupCode && normStockMap[lookupCode] !== undefined) {
          stockQtyVal = normStockMap[lookupCode];
        } else {
          // If stockQuantities map exists on activeConfig, default missing parts to 0 to align with Stock Matrix
          stockQtyVal = 0;
        }
      }
      if (stockQtyVal === undefined) {
        stockQtyVal = matchedStock 
          ? (matchedStock.availableQuantity !== undefined ? matchedStock.availableQuantity : (matchedStock.currentStockQty !== undefined ? matchedStock.currentStockQty : matchedStock.onHandQuantity)) 
          : (item.backupQty || 0);
      }

      const lifeLimitVal = item.lifeLimit > 0 ? item.lifeLimit : (matchedStd?.lifeLimitShots || 0);

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

    let sortedItems: PartLiveTrackingItem[] = [];

    if (lineTvConfig.length > 0) {
      // Find matching items for each key in lineTvConfig in exact sequence:
      const matchedList: PartLiveTrackingItem[] = [];
      const usedSlots = new Set<string>();

      lineTvConfig.forEach(targetKey => {
        if (!targetKey) return;
        const targetNorm = targetKey.trim().toLowerCase();
        const targetCleanCode = targetNorm.replace(/^(e\d+(?:-\d+)?-)/i, '').trim();
        const targetCleanName = targetNorm.replace(/\s*\(.*?\)/g, '').trim();

        // 1. Exact or normalized partCode match
        let matched = recalculatedItems.find(item => {
          if (usedSlots.has(item.slotId)) return false;
          const iCode = (item.partCode || '').trim().toLowerCase();
          const iCleanCode = iCode.replace(/^(e\d+(?:-\d+)?-)/i, '').trim();
          return iCode === targetNorm || iCleanCode === targetCleanCode || iCode === targetCleanCode;
        });

        // 2. Exact slotId match
        if (!matched) {
          matched = recalculatedItems.find(item => 
            !usedSlots.has(item.slotId) && item.slotId.toLowerCase() === targetNorm
          );
        }

        // 3. Normalized partName match
        if (!matched) {
          matched = recalculatedItems.find(item => {
            if (usedSlots.has(item.slotId)) return false;
            const iName = (item.partName || '').trim().toLowerCase();
            const iCleanName = iName.replace(/\s*\(.*?\)/g, '').trim();
            return iName === targetNorm || (targetCleanName && iCleanName === targetCleanName);
          });
        }

        // 4. Match via PartMaster lookup
        if (!matched) {
          const pm = partMasters.find(p => 
            p.partCode.toLowerCase() === targetNorm ||
            p.partCode.toLowerCase() === targetCleanCode ||
            p.partName.toLowerCase() === targetNorm ||
            p.partName.replace(/\s*\(.*?\)/g, '').trim().toLowerCase() === targetCleanName
          );
          if (pm) {
            matched = recalculatedItems.find(item => {
              if (usedSlots.has(item.slotId)) return false;
              const iCode = (item.partCode || '').trim().toLowerCase();
              const iCleanCode = iCode.replace(/^(e\d+(?:-\d+)?-)/i, '').trim();
              const pmCode = pm.partCode.toLowerCase();
              const pmName = pm.partName.toLowerCase();
              const iName = (item.partName || '').trim().toLowerCase();
              return iCode === pmCode || iCleanCode === pmCode || iName === pmName;
            });
          }
        }

        // 5. Fallback: match by stagePunchDie only if no code/name match
        if (!matched) {
          matched = recalculatedItems.find(item => 
            !usedSlots.has(item.slotId) && item.stagePunchDie && item.stagePunchDie.toLowerCase() === targetNorm
          );
        }

        if (matched) {
          usedSlots.add(matched.slotId);
          matchedList.push(matched);
        } else {
          // Dynamic fallback: If not yet in candidate list, construct metric item on the fly from PartMaster!
          const pm = partMasters.find(p => 
            p.partCode.toLowerCase() === targetNorm || 
            p.partCode.toLowerCase() === targetCleanCode || 
            p.partName.toLowerCase() === targetNorm || 
            p.partName.replace(/\s*\(.*?\)/g, '').trim().toLowerCase() === targetCleanName
          );
          if (pm) {
            const std = standards.find(s => s.configKey?.partCode === pm.partCode || s.partName === pm.partName || s.stagePunchDie === pm.stageName);
            const stock = stocks.find(s => s.partCode === pm.partCode || s.partName === pm.partName);

            const normInstallMap = activeConfig?.installedPartQuantities
              ? Object.entries(activeConfig.installedPartQuantities).reduce((acc, [k, v]) => {
                  acc[k.trim().toUpperCase()] = v;
                  return acc;
                }, {} as Record<string, number>)
              : {};

            const normStockMap = activeConfig?.stockQuantities
              ? Object.entries(activeConfig.stockQuantities).reduce((acc, [k, v]) => {
                  acc[k.trim().toUpperCase()] = v;
                  return acc;
                }, {} as Record<string, number>)
              : {};

            const lookupCode = pm.partCode.trim().toUpperCase();

            const lineInstallQty = normInstallMap[lookupCode] !== undefined 
              ? normInstallMap[lookupCode] 
              : (lineInstalledMap[pm.partCode] || 0);

            const lineStockQty = normStockMap[lookupCode] !== undefined 
              ? normStockMap[lookupCode] 
              : (activeConfig?.stockQuantities ? 0 : (stock?.availableQuantity ?? 0));

            const lifeLimit = std?.lifeLimitShots || 15000000;
            const totalShots = rawData.machineShotTotal || 0;
            const curShot = 0;

            const dynamicMetric = calculatePartMetrics(
              {
                slotId: `SLOT-${selectedLineId}-${pm.partCode}`,
                partCode: pm.partCode,
                partName: pm.partName,
                stagePunchDie: pm.stageName || 'Die Stage',
                position: pm.stageName || 'ALL',
                installQty: lineInstallQty,
                backupQty: lineStockQty,
                usedShot: curShot,
                currentShot: curShot,
                shotAtLastChange: totalShots,
                lastChangeShot: totalShots,
                regrindCount: 0,
                totalMmGround: 0,
                lifeLimit: lifeLimit
              },
              activeConfig,
              standards,
              stocks,
              rawData.dailyShot || 0
            );
            usedSlots.add(dynamicMetric.slotId);
            matchedList.push(dynamicMetric);
          }
        }
      });

      // Strict User Intent: When custom TV display order is configured, keep the EXACT manual sequence
      sortedItems = matchedList;
    } else {
      // If no custom config is saved, display items in standard stage order
      sortedItems = sortTrackingItems(recalculatedItems, 'STAGE_ORDER');
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
      setMonitoringData(storageService.getLinesMonitoring());
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

  // Listen for storage events when auto-cycle config changes in other views/modals
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'findie_tv_autocycle_config_v2') {
        const updated = getSavedAutoCycleConfig();
        setCycleConfig(updated);
        cycleConfigRef.current = updated;
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auto Cycle (Auto Switch Line) Engine - single deterministic interval, no race conditions
  useEffect(() => {
    if (!isAutoCycleActive) {
      setCountdown(autoCycleInterval);
      return;
    }

    // Reset countdown to the full interval whenever active state or interval changes
    setCountdown(autoCycleInterval);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time reached: Advance strictly to the next line in the configured cycle order
          const currentLine = selectedLineIdRef.current;
          const currentCfg = cycleConfigRef.current;
          const liveMonitoring = storageService.getLinesMonitoring();
          const nextLine = computeNextCycleLine(currentLine, currentCfg, liveMonitoring);

          // Asynchronously trigger selected line switch outside of setCountdown reducer
          setTimeout(() => {
            setSelectedLineId(nextLine);
            selectedLineIdRef.current = nextLine;
          }, 0);

          return autoCycleIntervalRef.current;
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

  const lineLabel = getLineLabel(selectedLineId);
  const lineDisplayName = selectedLineId === 'E1' ? 'LINE E1 (HE1 Ø7)' :
                          selectedLineId === 'E2' ? 'LINE E2 (HE2 Ø5)' :
                          selectedLineId === 'E3-1' ? 'LINE E3 SLit (3P)' :
                          selectedLineId === 'E3-2' ? 'LINE E3 WL (4P)' :
                          selectedLineId === 'E3-3' ? 'LINE E3 New corr (4P)' :
                          selectedLineId === 'E4' ? 'LINE E4 (HE4 Ø5)' :
                          selectedLineId === 'E5' ? 'LINE E5 (HE5 Ø5)' :
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
    <div className="flex-1 flex flex-col min-h-0 liquid-backdrop text-white select-none overflow-hidden font-sans">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: LIQUID OBSIDIAN GLASS BRANDED HEADER BAR */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#0a0e17]/80 backdrop-blur-2xl border-b border-white/10 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-3 shadow-md">
        {/* Left: LG Electronics Text */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-black text-xl sm:text-2xl md:text-3xl tracking-tight text-white font-sans flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] inline-block"></span>
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
              className="liquid-pill p-2 sm:px-3 sm:py-2 bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Toggle Fullscreen"
            >
              {isFullscreenMode ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline text-xs font-mono font-bold">FULLSCREEN</span>
            </button>
          )}

          {/* Live Clock: YYYY.MM.DD HH:mm:ss */}
          <div className="liquid-pill font-mono font-black text-xs sm:text-sm md:text-base text-white px-3 sm:px-4 py-1.5 sm:py-2 bg-white/[0.04] border border-white/15 tabular-nums shadow-inner tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {currentTime || '2026.09.12 10:36:57'}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUB-HEADER: LIQUID GLASS CONTROL RIBBON */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#090d15]/85 backdrop-blur-xl text-white border-y border-white/10 px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3 overflow-x-auto shadow-inner">
        {/* Left Stats: Main Fin Die | Total | Today */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap min-w-0">
          
          {/* Box 1: Main Fin Die */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1 flex-shrink-0 backdrop-blur-md">
            <span className="font-bold text-amber-300 text-xs sm:text-sm uppercase tracking-wide">
              {t.tv.mainFinDie || 'MAIN FIN DIE'}
            </span>
            <span className="font-black text-white text-xs sm:text-sm md:text-base">
              {dieNameDisplay}
            </span>
          </div>

          {/* Box 2: Total */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1 flex-shrink-0 backdrop-blur-md">
            <span className="text-xs sm:text-sm text-slate-400 font-medium">
              {t.tv.total || 'Total'}
            </span>
            <span className="font-mono font-black text-white text-sm sm:text-base md:text-lg tabular-nums">
              {totalMachineShots !== null ? (
                formatShots(totalMachineShots)
              ) : (
                <span className="text-xs text-slate-500 uppercase">NO DATA</span>
              )}
            </span>
          </div>

          {/* Box 3: Today */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1 flex-shrink-0 backdrop-blur-md">
            <span className="text-xs sm:text-sm text-slate-400 font-medium">
              {t.tv.today || 'Today'}
            </span>
            <span className="font-mono font-black text-cyan-300 text-sm sm:text-base md:text-lg tabular-nums">
              {todayMachineShots !== null ? (
                formatShots(todayMachineShots)
              ) : (
                <span className="text-xs text-slate-500 uppercase">NO DATA</span>
              )}
            </span>
          </div>
        </div>

        {/* Right: Compact Shot Count Signal Standard & Auto Width */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold bg-white/[0.03] border border-white/10 rounded-full px-2.5 py-1">
            <span className="text-slate-400 font-bold uppercase hidden md:inline mr-0.5 text-[10px] sm:text-xs">
              {t.tv.signalStandard || 'SIGNAL STANDARD:'}
            </span>
            <span className="liquid-pill px-2.5 py-0.5 bg-emerald-500/80 text-slate-950 font-black text-[10px] sm:text-xs whitespace-nowrap shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Normal: < 70%">
              {t.tv.normal || 'Normal'}
            </span>
            <span className="liquid-pill px-2.5 py-0.5 bg-amber-400/90 text-slate-950 font-black text-[10px] sm:text-xs whitespace-nowrap shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Warning: 70% - 84%">
              {t.tv.warning || 'Warning'}
            </span>
            <span className="liquid-pill px-2.5 py-0.5 bg-orange-500/90 text-white font-black text-[10px] sm:text-xs whitespace-nowrap shadow-[0_0_8px_rgba(249,115,22,0.5)]" title="Prepare: 85% - 99%">
              {t.tv.prepare || 'Prepare'}
            </span>
            <span className="liquid-pill px-2.5 py-0.5 bg-rose-600/90 text-white font-black text-[10px] sm:text-xs whitespace-nowrap shadow-[0_0_8px_rgba(225,29,72,0.5)]" title="Over Life: >= 100%">
              {t.tv.overLife || 'Over Life'}
            </span>
          </div>

          {/* Auto Width Button & Detailed/Compact Layout Toggle */}
          <div className="flex items-center gap-2">
            {/* Detailed / Compact Stage Layout Toggle Switch */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-1 shadow-inner" title="Switch Display Mode (Detailed vs. Compact)">
              <button
                type="button"
                onClick={() => {
                  setTvLayoutMode('DETAILED');
                  localStorage.setItem('findie_tv_layout_mode', 'DETAILED');
                }}
                className={`px-3 py-0.5 text-[10.5px] sm:text-xs font-bold rounded-full ios-spring cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  tvLayoutMode === 'DETAILED'
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Detailed</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTvLayoutMode('COMPACT');
                  localStorage.setItem('findie_tv_layout_mode', 'COMPACT');
                }}
                className={`px-3 py-0.5 text-[10.5px] sm:text-xs font-bold rounded-full ios-spring cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  tvLayoutMode === 'COMPACT'
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Compact</span>
              </button>
            </div>

            {/* Reset / Auto Width button */}
            <button
              type="button"
              onClick={() => {
                setColWidths(DEFAULT_TV_COL_WIDTHS);
                localStorage.setItem('findie_tv_col_widths_v7_lg', JSON.stringify(DEFAULT_TV_COL_WIDTHS));
              }}
              className="liquid-pill px-3 py-1 text-[10.5px] sm:text-xs font-bold text-slate-200 hover:text-white border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] ios-spring cursor-pointer whitespace-nowrap shadow-sm active:scale-95"
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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-transparent table-container p-2 sm:p-2.5">
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar liquid-glass-card rounded-2xl border border-white/10 shadow-2xl">
          <div className="min-w-[1000px] w-full flex-1 flex flex-col min-h-0">
            
            {/* Table Header: Pure Dark Theme matching top bar, bold white text, clear border (ALL HEADERS CENTERED) */}
            <div className={`flex-none bg-white/[0.06] backdrop-blur-md text-slate-200 font-black flex items-center select-none relative border-b border-white/10 transition-all ${
              tvLayoutMode === 'COMPACT'
                ? 'min-h-[34px] sm:min-h-[38px] text-[11px] sm:text-xs md:text-sm'
                : 'min-h-[46px] sm:min-h-[52px] md:min-h-[58px] text-xs sm:text-sm md:text-base lg:text-lg'
            }`}>
              
              {/* Col 1: Stage Punch / Die (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.stage}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.stagePunchDie}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'stage')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 2: Replacement Count (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.replacement}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.replacementCount}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'replacement')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 3: Shot Count (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.shot}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.shotCount}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'shot')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 4: Progress (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.progress}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.progress}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'progress')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 5: Life Time (Days) (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1.5 sm:px-2 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.lifetime}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.lifeTime}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'lifetime')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 6: Install Qty. (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-1.5 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.installQty}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.installQty}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'installQty')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 7: Stock Qty. (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-1.5 border-r border-white/10 flex-shrink-0 relative"
                style={{ width: `${colWidths.stockQty}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.stockQty}</span>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-cyan-400/40 z-20" 
                  onMouseDown={(e) => handleResizeStart(e, 'stockQty')} 
                  title="Drag to resize column"
                />
              </div>

              {/* Col 8: Order Require (centered) */}
              <div 
                className="h-full flex items-center justify-center text-center px-1 sm:px-2 flex-shrink-0 relative"
                style={{ width: `${colWidths.orderRequire}%` }}
              >
                <span className="truncate tracking-wide text-white">{t.tv.orderRequire}</span>
              </div>

            </div>

            {/* Table Rows Body: solid background, dynamic flex distribution */}
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden divide-y divide-white/5 bg-transparent">
              {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-transparent text-slate-400 font-mono">
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
                    layoutMode={tvLayoutMode}
                  />
                ))
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM BAR: LIQUID PILL LINE SELECTOR BAR (HE1 - HE5) */}
      {/* ========================================================= */}
      <div className="flex-none bg-[#090d15]/85 backdrop-blur-xl border-t border-white/10 px-3.5 sm:px-5 py-2 flex items-center justify-between gap-3 overflow-x-auto shadow-lg">
        {/* Left: Line Selection Buttons ordered according to user-configured sequence */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap bg-black/30 p-1 rounded-full border border-white/10">
          {cycleConfig.order.map((lineId, idx) => {
            const isSelected = selectedLineId === lineId;
            const label = getLineLabel(lineId);
            const subTag = getLineSubTag(lineId);
            const status = getLineMachineStatus(lineId);
            const isRunning = status === 'RUNNING' || status === 'SIMULATION_ACTIVE';
            const isIdle = status === 'IDLE';
            const isStopped = status === 'STOPPED' || status === 'MAINTENANCE';
            const isEnabledInCycle = cycleConfig.mode === 'RUNNING_ONLY' 
              ? isRunning 
              : cycleConfig.enabledLines[lineId] !== false;

            return (
              <button
                key={lineId}
                type="button"
                onClick={() => {
                  setSelectedLineId(lineId);
                  selectedLineIdRef.current = lineId;
                  setCountdown(autoCycleInterval);
                }}
                className={`liquid-pill px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold cursor-pointer flex items-center justify-center gap-1.5 min-w-[105px] sm:min-w-[125px] flex-shrink-0 active:scale-95 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none'
                    : !isEnabledInCycle
                    ? 'bg-white/[0.02] text-slate-400 border border-white/5 opacity-70 hover:opacity-100 hover:text-white'
                    : isIdle
                    ? 'bg-amber-950/30 text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/50 border border-amber-500/30'
                    : isStopped
                    ? 'bg-rose-950/30 text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/50 border border-rose-500/30'
                    : 'bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/10'
                }`}
                title={`Line ${lineId} (ลำดับที่ ${idx + 1}) - Status: ${status} ${!isEnabledInCycle ? '(ปิดไว้ใน Auto Cycle - คลิกเพื่อดูเฉพาะไลน์)' : '(หมุนเวียนใน Auto Cycle)'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isSelected 
                    ? 'bg-slate-950 ring-1 ring-white/50' 
                    : isRunning 
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' 
                    : isIdle 
                    ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]' 
                    : 'bg-rose-400 shadow-[0_0_4px_#f87171]'
                }`} />
                <span className="truncate">{label}</span>
                {subTag && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-bold flex-shrink-0 ${
                    isSelected ? 'bg-slate-950/80 text-cyan-300' : 'bg-white/[0.08] text-slate-300'
                  }`}>
                    {subTag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side Bottom-Right Auto Cycle Controls */}
        <div className="flex items-center gap-2.5">
          {/* Machine Operational Status Badge */}
          {lineData && lineData.machineStatus && lineData.machineStatus !== 'STALE_DATA' && lineData.machineStatus !== 'CONNECTION_LOST' && (
            <div className={`inline-flex items-center gap-2 px-3.5 py-1 text-xs font-mono font-bold rounded-full border shadow-sm ${
              lineData.machineStatus === 'STOPPED' 
                ? 'bg-red-950/70 border-red-500/60 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse' :
              lineData.machineStatus === 'IDLE' 
                ? 'bg-amber-950/70 border-yellow-400/60 text-yellow-200 shadow-[0_0_12px_rgba(234,179,8,0.4)] animate-pulse' :
              lineData.machineStatus === 'MAINTENANCE' 
                ? 'bg-blue-950/70 border-blue-400/60 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.4)] animate-pulse' :
              lineData.machineStatus === 'CHANGEOVER'
                ? 'bg-purple-950/70 border-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse' :
              lineData.machineStatus === 'SIMULATION_ACTIVE'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse' :
              lineData.machineStatus === 'NOT_CONFIGURED'
                ? 'bg-slate-900/80 border-white/10 text-slate-300' :
                'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
            }`} title={`Machine Status: ${lineData.machineStatus}`}>
              <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_6px_currentColor]"></span>
              <span className="uppercase tracking-wider">
                {language === 'TH' ? (
                  lineData.machineStatus === 'RUNNING' ? 'กำลังผลิต' :
                  lineData.machineStatus === 'STOPPED' ? 'หยุดทำงาน' :
                  lineData.machineStatus === 'IDLE' ? 'พักสายผลิต' :
                  lineData.machineStatus === 'MAINTENANCE' ? 'ซ่อมบำรุง' :
                  lineData.machineStatus === 'CHANGEOVER' ? 'เปลี่ยนรุ่น' :
                  lineData.machineStatus === 'SIMULATION_ACTIVE' ? 'จำลองการทำงาน' :
                  lineData.machineStatus === 'NOT_CONFIGURED' ? 'ยังไม่ตั้งค่า' :
                  lineData.machineStatus
                ) : language === 'KO' ? (
                  lineData.machineStatus === 'RUNNING' ? '가동 중' :
                  lineData.machineStatus === 'STOPPED' ? '정지됨' :
                  lineData.machineStatus === 'IDLE' ? '대기 중' :
                  lineData.machineStatus === 'MAINTENANCE' ? '보전 작업' :
                  lineData.machineStatus === 'CHANGEOVER' ? '모델 교체' :
                  lineData.machineStatus === 'SIMULATION_ACTIVE' ? '시뮬레이션 활성' :
                  lineData.machineStatus === 'NOT_CONFIGURED' ? '미설정' :
                  lineData.machineStatus
                ) : (
                  lineData.machineStatus.replace(/_/g, ' ')
                )}
              </span>
            </div>
          )}

          {/* Timer Interval selector buttons */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-full p-1 shadow-inner">
            {[5, 10, 15, 20].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setAutoCycleInterval(sec);
                  setCountdown(sec);
                }}
                className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold font-mono rounded-full transition-all cursor-pointer ${
                  autoCycleInterval === sec
                    ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Auto Cycle Controls with Sequence Preview and Order Settings */}
          {(() => {
            const nextLineId = getNextActiveCycleLine(selectedLineId);
            const nextLineLabel = getLineLabel(nextLineId);

            // Compute active sequence string for tooltip
            const activePool = cycleConfig.mode === 'RUNNING_ONLY'
              ? cycleConfig.order.filter(l => {
                  const s = getLineMachineStatus(l);
                  return s === 'RUNNING' || s === 'SIMULATION_ACTIVE';
                })
              : cycleConfig.order.filter(l => cycleConfig.enabledLines[l] !== false);
            const sequenceStr = activePool.map(l => getLineLabel(l)).join(' → ');

            return (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoCycleActive(prev => !prev);
                    setCountdown(autoCycleInterval);
                  }}
                  className={`liquid-pill inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold cursor-pointer active:scale-95 transition-all ${
                    isAutoCycleActive
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/15 text-slate-200 hover:text-white'
                  }`}
                  title={isAutoCycleActive 
                    ? `หมุนเวียนตามลำดับ: ${sequenceStr} | ถัดไป: ${nextLineLabel} ใน ${countdown} วินาที (คลิกปุ่ม ⚙️ ด้านข้างเพื่อจัดเรียงลำดับใหม่)` 
                    : `เปิดการหมุนเวียนอัตโนมัติ (ตามลำดับ: ${sequenceStr})`}
                >
                  {isAutoCycleActive ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
                      <span className="font-black flex items-center gap-1.5">
                        <span>{language === 'TH' ? `หมุนเวียน (${countdown}s)` : language === 'KO' ? `순환 (${countdown}s)` : `CYCLING (${countdown}s)`}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                        → {nextLineLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-cyan-400 fill-current" />
                      <span>
                        {language === 'TH' ? 'หมุนเวียนอัตโนมัติ' : language === 'KO' ? '자동 순환' : 'AUTO CYCLE'}
                      </span>
                    </>
                  )}
                </button>

                {/* Settings Gear to customize line cycle order */}
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="liquid-pill p-1.5 text-xs font-mono font-bold cursor-pointer active:scale-95 transition-all bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-amber-300 rounded-full"
                  title="ตั้งค่าลำดับการสลับไลน์ (Auto Cycle Order Settings)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. PART DETAILS MODAL: LIQUID GLASS SHEET */}
      {/* ========================================================= */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-sheet text-white p-6 max-w-xl w-full space-y-4 shadow-2xl relative font-mono animate-scaleUp">
            <button
              type="button"
              onClick={() => setSelectedModalItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] p-2 rounded-full cursor-pointer ios-spring active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-3">
              <span className="text-xs text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"></span>
                {lineDisplayName} • STAGE SPECIFICATIONS
              </span>
              <h3 className="text-xl font-black text-white mt-1.5">
                {selectedModalItem.stagePunchDie || selectedModalItem.partName}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">REPLACEMENT COUNT</div>
                <div className="text-base font-black text-white mt-1 tabular-nums">
                  {selectedModalItem.lifeLimit > 0 ? formatShots(selectedModalItem.lifeLimit) : '-'}
                </div>
              </div>

              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">SHOT COUNT</div>
                <div className="text-base font-black text-cyan-300 mt-1 tabular-nums">
                  {formatShots(selectedModalItem.usedShot !== undefined ? selectedModalItem.usedShot : selectedModalItem.currentShot)}
                </div>
              </div>

              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">PROGRESS</div>
                <div className="text-base font-black text-amber-300 mt-1 tabular-nums">
                  {selectedModalItem.usagePercent}%
                </div>
              </div>

              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">LIFE TIME (DAYS)</div>
                <div className="text-base font-black text-white mt-1">
                  {selectedModalItem.daysRemainingForecast !== undefined && selectedModalItem.daysRemainingForecast > 0
                    ? `${selectedModalItem.daysRemainingForecast} Days`
                    : selectedModalItem.lifeLimit <= 0
                    ? 'STANDARD NOT SET'
                    : 'RATE UNSET'}
                </div>
              </div>

              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">INSTALL QTY.</div>
                <div className="text-base font-black text-white mt-1 tabular-nums">
                  {selectedModalItem.installQty > 0 ? `${selectedModalItem.installQty} Pcs` : 'NOT SET'}
                </div>
              </div>

              <div className="liquid-glass-card p-3 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">STOCK QTY.</div>
                <div className="text-base font-black text-white mt-1 tabular-nums">
                  {selectedModalItem.availableSpare !== undefined
                    ? `${selectedModalItem.availableSpare} Pcs`
                    : selectedModalItem.backupQty !== undefined
                    ? `${selectedModalItem.backupQty} Pcs`
                    : 'NO DATA'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className="liquid-pill px-6 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black font-mono text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Cycle Line Order Configuration Modal */}
      <TvAutoCycleOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        config={cycleConfig}
        onSaveConfig={(newCfg) => {
          setCycleConfig(newCfg);
          cycleConfigRef.current = newCfg;
          setCountdown(autoCycleInterval);
        }}
        currentLineId={selectedLineId}
        getLineMachineStatus={getLineMachineStatus}
        getLineLabel={getLineLabel}
        getLineSubTag={getLineSubTag}
      />

    </div>
  );
};

