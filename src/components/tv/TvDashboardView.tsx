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
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { 
  LineLiveMonitoringData, 
  ProductionLineId, 
  MachineStatus, 
  PartLiveTrackingItem,
  LifeStatus,
  StockStatus
} from '../../types';
import { storageService } from '../../services/storageService';
import { 
  formatShots, 
  calculatePartMetrics, 
  sortTrackingItems, 
  calculateSummaryStats, 
  generateDynamicAlertTicker 
} from '../../services/calculationService';

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
  const [autoCycle, setAutoCycle] = useState(false);
  const [isSimulatingPulse, setIsSimulatingPulse] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

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

    // Sort items strictly according to industrial priority:
    // 1. OVER LIFE -> 2. CRITICAL -> 3. PREPARE -> 4. WARNING -> 5. NORMAL -> 6. STANDARD MISSING -> 7. DATA ERROR
    // Secondary: Usage % descending
    const sortedItems = sortTrackingItems(recalculatedItems);

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
  }, [selectedLineId]);

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

  // TV Auto-Cycle lines every 15 seconds if enabled
  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      setSelectedLineId(prev => {
        const nextIdx = (linesList.indexOf(prev) + 1) % linesList.length;
        return linesList[nextIdx];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoCycle]);

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
    <div className="min-h-full bg-[#0B1322] text-slate-100 flex flex-col justify-between font-sans select-none p-3 sm:p-4 border border-slate-800/80 rounded-xl shadow-xl overflow-hidden">
      
      {/* Top TV Controls Bar (Line Switcher, Auto Cycle, Sample Badge, Fullscreen) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-semibold text-slate-400 mr-1 tracking-wide">SELECT LINE:</span>
          {linesList.map(line => (
            <button
              key={line}
              onClick={() => setSelectedLineId(line)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                selectedLineId === line
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              {line}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* SAMPLE DATA - NOT FOR PRODUCTION BADGE */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-500/60 text-amber-300 font-mono font-semibold text-[11px] shadow-sm tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>SAMPLE DATA - NOT FOR PRODUCTION</span>
          </div>

          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors ${
              autoCycle
                ? 'bg-amber-950/70 text-amber-300 border-amber-600/80'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Auto-switch line every 15 seconds"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoCycle ? 'animate-spin' : ''}`} />
            <span>AUTO-CYCLE {autoCycle ? 'ON (15s)' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setIsSimulatingPulse(!isSimulatingPulse)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors ${
              isSimulatingPulse
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/80'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Toggle simulated live PLC shot pulses"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>LIVE PLC PULSE {isSimulatingPulse ? 'ON' : 'PAUSED'}</span>
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700 transition-colors"
              title="Toggle Fullscreen TV"
            >
              {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* TOP HEADER: CLEAN INDUSTRIAL DISPLAY */}
      <div className="grid grid-cols-12 items-center gap-3 px-4 py-3 bg-[#0E172A] border border-slate-800/90 rounded-lg mb-3 shadow-sm">
        {/* Line Code Box */}
        <div className="col-span-3 sm:col-span-2">
          <div className="inline-block px-4 py-1.5 bg-cyan-950/40 border border-cyan-500/60 rounded-md text-cyan-300 font-mono font-bold text-xl sm:text-2xl tracking-wider text-center shadow-inner">
            {selectedLineId}
          </div>
        </div>

        {/* Center Title */}
        <div className="col-span-6 sm:col-span-7 text-center">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-white uppercase font-['Plus_Jakarta_Sans'] leading-tight">
            FIN DIE SPARE PARTS SHOT COUNT
          </h2>
          <div className="text-[11px] sm:text-xs font-mono text-cyan-300/90 flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-1.5">
            <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              DIE: <strong className="text-white">{lineData.activeConfig?.dieCode || `FD-${selectedLineId}-07`}</strong>
            </span>
            <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              TUBE: <strong className="text-white">{lineData.activeConfig?.tubeSize || 'Ø7'}</strong>
            </span>
            <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              MATERIAL: <strong className="text-white">{lineData.activeConfig?.material || 'PCM'} ({lineData.activeConfig?.thicknessMm || 0.10}mm)</strong>
            </span>
            <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              TYPE: <strong className="text-white">{lineData.activeConfig?.finType || 'Slit (half)'}</strong>
            </span>
          </div>
        </div>

        {/* Right Timestamp Box */}
        <div className="col-span-3 sm:col-span-3 text-right">
          <div className="inline-block px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-md text-right shadow-inner">
            <div className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold">LAST UPDATE</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-200">
              {currentTime || lineData.lastUpdate}
            </div>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
        {/* Machine Status */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center flex flex-col justify-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-1">
            MACHINE STATUS
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base sm:text-lg font-mono">
            <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{lineData.machineStatus}</span>
          </div>
        </div>

        {/* Machine Shot Total */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-0.5">
            MACHINE SHOT (TOTAL)
          </div>
          <div className="text-emerald-400 font-bold text-lg sm:text-xl font-mono tracking-tight">
            {formatShots(lineData.machineShotTotal)} <span className="text-xs font-normal text-emerald-500/70">Shot</span>
          </div>
        </div>

        {/* Shift Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-0.5">
            SHIFT SHOT
          </div>
          <div className="text-slate-100 font-bold text-base sm:text-lg font-mono">
            {formatShots(lineData.shiftShot)} <span className="text-xs font-normal text-slate-400">Shot</span>
          </div>
        </div>

        {/* Daily Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-0.5">
            DAILY SHOT
          </div>
          <div className="text-slate-100 font-bold text-base sm:text-lg font-mono">
            {formatShots(lineData.dailyShot)} <span className="text-xs font-normal text-slate-400">Shot</span>
          </div>
        </div>

        {/* Monthly Shot */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-0.5">
            MONTHLY SHOT
          </div>
          <div className="text-slate-100 font-bold text-base sm:text-lg font-mono">
            {formatShots(lineData.monthlyShot)} <span className="text-xs font-normal text-slate-400">Shot</span>
          </div>
        </div>

        {/* Shot Signal */}
        <div className="bg-[#0E172A] border border-slate-800/90 rounded-lg p-2.5 text-center flex flex-col justify-center shadow-sm">
          <div className="text-[11px] font-sans tracking-wide text-slate-400 font-medium uppercase mb-1">
            SHOT SIGNAL
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-base font-mono">
            <span>{lineData.shotSignal}</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* TABLE SECTION TITLE */}
      <div className="bg-[#0C1A33] border border-slate-800 text-center py-1.5 rounded-t-lg text-xs sm:text-sm font-bold tracking-wider text-cyan-200 uppercase font-sans">
        FIN DIE PART LIFE MONITORING
      </div>

      {/* TV MAIN MONITORING TABLE */}
      <div className="flex-1 overflow-x-auto bg-[#070F1E] border-x border-b border-slate-800/90 mb-2.5 rounded-b-lg shadow-inner">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#0B172E] text-cyan-300/90 text-[11px] font-semibold uppercase border-b border-slate-800">
              <th className="py-2.5 px-2 text-center w-10 border-r border-slate-800/70">No.</th>
              <th className="py-2.5 px-3 border-r border-slate-800/70 font-sans">STAGE PUNCH / DIE</th>
              <th className="py-2.5 px-2 text-right border-r border-slate-800/70">LIFE LIMIT (Shot)</th>
              <th className="py-2.5 px-2 text-right border-r border-slate-800/70">USED SHOT (Shot)</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-800/70">USAGE %</th>
              <th className="py-2.5 px-2 text-right border-r border-slate-800/70">REMAINING SHOT (Shot)</th>
              <th className="py-2.5 px-3 text-center min-w-[130px] border-r border-slate-800/70">PROGRESS BAR</th>
              <th className="py-2.5 px-2 text-right border-r border-slate-800/70">SHOT AT LAST CHANGE</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-800/70">INSTALL QTY.</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-800/70">AVAILABLE SPARE</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-800/70">LIFE STATUS</th>
              <th className="py-2.5 px-2 text-center">ORDER STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {items.map((item, idx) => {
              const usedShotVal = item.usedShot !== undefined ? item.usedShot : item.currentShot;
              const shotAtLastChangeVal = item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot;
              const availableSpareVal = item.availableSpare !== undefined ? item.availableSpare : item.backupQty;
              const status: LifeStatus = item.lifeStatus || item.alertStatus || 'NORMAL';

              // Exact color matching for usage percentage & progress bar
              let usageColor = 'text-emerald-400 font-semibold';
              let barColor = 'bg-emerald-500';
              let barBorder = 'border-emerald-600/70';
              let rowHighlight = '';

              if (status === 'OVER_LIFE') {
                usageColor = 'text-red-400 font-bold';
                barColor = 'bg-red-600';
                barBorder = 'border-red-500/80';
                rowHighlight = 'bg-red-950/20';
              } else if (status === 'CRITICAL') {
                usageColor = 'text-rose-400 font-bold';
                barColor = 'bg-rose-500';
                barBorder = 'border-rose-500/80';
                rowHighlight = 'bg-rose-950/15';
              } else if (status === 'PREPARE') {
                usageColor = 'text-amber-400 font-semibold';
                barColor = 'bg-amber-500';
                barBorder = 'border-amber-500/80';
              } else if (status === 'WARNING') {
                usageColor = 'text-yellow-300 font-semibold';
                barColor = 'bg-yellow-400';
                barBorder = 'border-yellow-500/80';
              } else if (status === 'STANDARD_MISSING') {
                usageColor = 'text-amber-400 italic';
                barColor = 'bg-slate-700';
                barBorder = 'border-amber-700/80';
              } else if (status === 'DATA_ERROR') {
                usageColor = 'text-red-400 italic font-bold';
                barColor = 'bg-red-900';
                barBorder = 'border-red-600/80';
              }

              // Life status badge styling
              let statusBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
              let statusLabel = 'NORMAL';

              if (status === 'OVER_LIFE') {
                statusBadgeClass = 'bg-red-950 text-red-300 border-red-600 font-bold';
                statusLabel = 'OVER LIFE';
              } else if (status === 'CRITICAL') {
                statusBadgeClass = 'bg-rose-950/90 text-rose-300 border-rose-600/90 font-bold';
                statusLabel = 'CRITICAL';
              } else if (status === 'PREPARE') {
                statusBadgeClass = 'bg-amber-950/90 text-amber-300 border-amber-600/90 font-semibold';
                statusLabel = 'PREPARE';
              } else if (status === 'WARNING') {
                statusBadgeClass = 'bg-yellow-950/90 text-yellow-300 border-yellow-600/90';
                statusLabel = 'WARNING';
              } else if (status === 'STANDARD_MISSING') {
                statusBadgeClass = 'bg-amber-950 text-amber-400 border-amber-700 italic';
                statusLabel = 'NO STD';
              } else if (status === 'DATA_ERROR') {
                statusBadgeClass = 'bg-red-950 text-red-400 border-red-700 font-bold';
                statusLabel = 'ERROR';
              }

              // Order Status styling
              let orderClass = 'text-emerald-400';
              if (item.orderStatus === 'PR PREPARING') orderClass = 'text-amber-400 font-semibold';
              if (item.orderStatus === 'PO OPEN') orderClass = 'text-rose-400 font-semibold';
              if (item.orderStatus === 'ORDERED') orderClass = 'text-cyan-300 font-semibold';

              const isStdMissing = item.isStandardMissing || item.lifeLimit <= 0;

              return (
                <tr key={item.slotId || idx} className={`hover:bg-cyan-950/30 transition-colors ${rowHighlight}`}>
                  {/* No. */}
                  <td className="py-2 px-2 text-center text-slate-400 font-medium border-r border-slate-800/70">
                    {idx + 1}
                  </td>

                  {/* Stage Punch / Die */}
                  <td className="py-2 px-3 font-sans font-medium text-slate-100 border-r border-slate-800/70">
                    {item.stagePunchDie || item.partName}
                  </td>

                  {/* Life Limit */}
                  <td className="py-2 px-2 text-right text-slate-200 border-r border-slate-800/70">
                    {isStdMissing ? (
                      <span className="text-amber-400 text-[10px] italic">STANDARD MISSING</span>
                    ) : (
                      formatShots(item.lifeLimit)
                    )}
                  </td>

                  {/* Used Shot */}
                  <td className="py-2 px-2 text-right text-slate-100 font-semibold border-r border-slate-800/70">
                    {item.isDataError ? (
                      <span className="text-red-400 text-[10px]">DATA ERROR</span>
                    ) : (
                      formatShots(usedShotVal)
                    )}
                  </td>

                  {/* Usage % */}
                  <td className={`py-2 px-2 text-center text-xs font-bold border-r border-slate-800/70 ${usageColor}`}>
                    {isStdMissing ? 'N/A' : `${item.usagePercent}%`}
                  </td>

                  {/* Remaining Shot */}
                  <td className={`py-2 px-2 text-right border-r border-slate-800/70 ${
                    item.remainingShot < 0 ? 'text-red-400 font-semibold' : 'text-slate-200'
                  }`}>
                    {isStdMissing ? 'N/A' : formatShots(item.remainingShot)}
                  </td>

                  {/* Progress Bar */}
                  <td className="py-1.5 px-3 border-r border-slate-800/70">
                    <div className={`relative w-full bg-slate-900/90 h-4.5 rounded-sm border ${barBorder} overflow-hidden flex items-center`}>
                      {!isStdMissing && (
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${Math.min(100, Math.max(0, item.usagePercent))}%` }}
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-slate-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {isStdMissing ? 'N/A' : `${item.usagePercent}%`}
                      </span>
                    </div>
                  </td>

                  {/* Shot at Last Change */}
                  <td className="py-2 px-2 text-right text-slate-300 border-r border-slate-800/70">
                    {formatShots(shotAtLastChangeVal)}
                  </td>

                  {/* Install Qty */}
                  <td className="py-2 px-2 text-center text-slate-200 border-r border-slate-800/70">
                    {item.installQty}
                  </td>

                  {/* Available Spare */}
                  <td className="py-2 px-2 text-center text-slate-200 border-r border-slate-800/70">
                    {availableSpareVal}
                  </td>

                  {/* Life Status Column */}
                  <td className="py-2 px-2 text-center border-r border-slate-800/70">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </td>

                  {/* Order Status */}
                  <td className={`py-2 px-2 text-center text-[10px] font-mono tracking-wide uppercase ${orderClass}`}>
                    {item.orderStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM SUMMARY STATS BAR */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2 text-center font-mono">
        {/* Total Items */}
        <div className="bg-[#09152B] border border-slate-800 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[10px] text-slate-400 font-medium uppercase">TOTAL ITEMS</div>
          <div className="text-base sm:text-lg font-bold text-slate-100">{items.length}</div>
        </div>

        {/* Normal (0-69%) */}
        <div className="bg-[#06201B] border border-emerald-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-emerald-400/90 font-medium uppercase">NORMAL (0-69%)</div>
          <div className="text-base sm:text-lg font-bold text-emerald-400">{normalCount}</div>
        </div>

        {/* Warning (70-84%) */}
        <div className="bg-[#24210A] border border-yellow-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-yellow-300/90 font-medium uppercase">WARNING (70-84%)</div>
          <div className="text-base sm:text-lg font-bold text-yellow-300">{warningCount}</div>
        </div>

        {/* Prepare (85-94%) */}
        <div className="bg-[#2B1B0A] border border-amber-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-amber-400/90 font-medium uppercase">PREPARE (85-94%)</div>
          <div className="text-base sm:text-lg font-bold text-amber-400">{prepareCount}</div>
        </div>

        {/* Critical (95-99%) */}
        <div className="bg-[#300C12] border border-rose-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-rose-400/90 font-medium uppercase">CRITICAL (95-99%)</div>
          <div className="text-base sm:text-lg font-bold text-rose-400">{criticalCount}</div>
        </div>

        {/* Over Life (>=100%) */}
        <div className="bg-[#3B0707] border border-red-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-red-400/90 font-medium uppercase">OVER LIFE (≥100%)</div>
          <div className="text-base sm:text-lg font-bold text-red-400">{overLifeCount}</div>
        </div>

        {/* Low Stock */}
        <div className="bg-[#2B0E17] border border-rose-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-rose-300/90 font-medium uppercase">LOW STOCK</div>
          <div className="text-base sm:text-lg font-bold text-rose-400">{lowStockCount}</div>
        </div>

        {/* Delivery Risk */}
        <div className="bg-[#350A0A] border border-red-900/80 rounded-md py-1.5 px-1 shadow-sm">
          <div className="text-[9px] text-red-300/90 font-medium uppercase">DELIVERY RISK</div>
          <div className="text-base sm:text-lg font-bold text-red-400">{deliveryRiskCount}</div>
        </div>
      </div>

      {/* BOTTOM MARQUEE / ALERT BANNER */}
      <div className="bg-[#2E0909] border border-red-700/80 rounded-md flex items-center overflow-hidden font-mono text-xs shadow-md">
        <div className="bg-red-600 text-white font-bold px-3 py-1.5 flex items-center gap-1.5 uppercase flex-shrink-0 tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 fill-white text-red-600" />
          <span>ALERT</span>
        </div>
        <div className="px-3 py-1.5 text-red-200 font-medium truncate flex-1 tracking-wide">
          {dynamicTickerMessage}
        </div>
      </div>

    </div>
  );
};
