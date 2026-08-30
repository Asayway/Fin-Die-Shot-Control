import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Tv, 
  Wrench, 
  PlusCircle, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ProductionLineId, LineLiveMonitoringData, LINE_INFO_MAP } from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';

interface LineOverviewViewProps {
  onNavigate: (route: string, lineId?: ProductionLineId) => void;
}

export const LineOverviewView: React.FC<LineOverviewViewProps> = ({ onNavigate }) => {
  const [lines, setLines] = useState<Record<ProductionLineId, LineLiveMonitoringData>>({} as any);

  useEffect(() => {
    setLines(storageService.getLinesMonitoring());
    const unsub = storageService.subscribe(() => {
      setLines(storageService.getLinesMonitoring());
    });
    return () => unsub();
  }, []);

  const lineIds: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Fin Press Production Lines Overview
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              8 Lines Monitored
            </span>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/80 shadow-sm">
              SAMPLE DATA - NOT FOR PRODUCTION
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ภาพรวมสายการผลิตปั๊มฟินแลกเปลี่ยนความร้อน E1 - E6 พร้อมสถานะชิ้นส่วนแม่พิมพ์แบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('tv-monitoring')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            <Tv className="w-4 h-4" />
            <span>OPEN TV DASHBOARD</span>
          </button>

          <button
            onClick={() => onNavigate('shot-entry')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>SHOT ENTRY</span>
          </button>
        </div>
      </div>

      {/* Grid of All 8 Production Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {lineIds.map(lineId => {
          const lineData = lines[lineId];
          if (!lineData) return null;

          const items = lineData.items || [];
          const criticalItems = items.filter(i => i.alertStatus === 'CRITICAL' || i.alertStatus === 'OVER_LIFE');
          const warningItems = items.filter(i => i.alertStatus === 'WARNING' || i.alertStatus === 'PREPARE');
          const maxUsageItem = [...items].sort((a, b) => b.usagePercent - a.usagePercent)[0];

          return (
            <div
              key={lineId}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg overflow-hidden shadow-lg transition-all flex flex-col justify-between group"
            >
              {/* Header */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-cyan-300">
                      Line {lineId.startsWith('E3-') ? 'E3' : lineId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({LINE_INFO_MAP[lineId]?.shortTag || lineData.lineName})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {lineData.activeConfig?.dieCode || 'N/A'} • {lineData.activeConfig?.tubeSize || 'Ø7'} • {lineData.activeConfig?.material || 'PCM'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold">
                  <Play className="w-3 h-3 fill-emerald-400 animate-pulse" />
                  <span>{lineData.machineStatus}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 flex-1">
                {/* Shots KPI */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold">TOTAL SHOTS</div>
                    <div className="text-sm font-bold text-slate-100 mt-0.5">
                      {formatShots(lineData.machineShotTotal)}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-bold">DAILY SHOTS</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {formatShots(lineData.dailyShot)}
                    </div>
                  </div>
                </div>

                {/* Most Critical Part on this line */}
                {maxUsageItem && (
                  <div className="bg-slate-950/70 p-3 rounded border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium truncate max-w-[140px]">
                        {maxUsageItem.stagePunchDie || maxUsageItem.partName}
                      </span>
                      <span className={`font-mono font-bold ${
                        maxUsageItem.usagePercent >= 95 ? 'text-rose-400' :
                        maxUsageItem.usagePercent >= 85 ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                        {maxUsageItem.usagePercent}% Life
                      </span>
                    </div>
                    <ProgressBar percent={maxUsageItem.usagePercent} size="sm" />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Rem: {formatShots(maxUsageItem.remainingShot)}</span>
                      <span>Stock: {maxUsageItem.backupQty} EA</span>
                    </div>
                  </div>
                )}

                {/* Alert Indicators */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  {criticalItems.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      {criticalItems.length} Critical
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-xs">✓ All Tools Healthy</span>
                  )}

                  {warningItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px]">
                      {warningItems.length} Warning
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('tv-monitoring', lineId)}
                  className="flex-1 py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>TV View</span>
                </button>

                <button
                  onClick={() => onNavigate('replacement-entry', lineId)}
                  className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Replace or Swap Die Tooling"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Swap</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
