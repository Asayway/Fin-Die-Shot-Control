import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ArrowRight, 
  Wrench,
  ShieldAlert,
  BellRing,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { ProductionLineId } from '../../types';
import { formatShots } from '../../services/calculationService';
import { ToolingLifeAlert, toolingAlertService } from '../../services/toolingAlertService';

interface TvToolingAlertToastProps {
  alerts: ToolingLifeAlert[];
  currentLineId: ProductionLineId;
  onSelectLine?: (lineId: ProductionLineId) => void;
  onDismissAlert?: (alertId: string) => void;
  onSnoozeAlert?: (alertId: string, minutes: number) => void;
}

export const TvToolingAlertToast: React.FC<TvToolingAlertToastProps> = ({
  alerts,
  currentLineId,
  onSelectLine,
  onDismissAlert,
  onSnoozeAlert
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(!toolingAlertService.isSoundEnabled());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const lastAlertsCountRef = useRef<number>(alerts.length);

  // Play audio chime when new alerts arrive
  useEffect(() => {
    if (alerts.length > 0 && alerts.length > lastAlertsCountRef.current) {
      if (!isSoundMuted) {
        toolingAlertService.playAlertSound();
      }
    }
    lastAlertsCountRef.current = alerts.length;
  }, [alerts.length, isSoundMuted]);

  // Adjust current index if list shrank
  useEffect(() => {
    if (currentIndex >= alerts.length && alerts.length > 0) {
      setCurrentIndex(alerts.length - 1);
    }
  }, [alerts.length, currentIndex]);

  // Auto-cycle between multiple alerts every 7 seconds
  useEffect(() => {
    if (!isAutoCycling || alerts.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % alerts.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [alerts.length, isAutoCycling]);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentIndex] || alerts[0];
  if (!currentAlert) return null;

  const isOverLife = currentAlert.severity === 'OVER_LIFE_100';
  const isCritical = currentAlert.severity === 'CRITICAL_95';

  const themeStyles = isOverLife
    ? {
        border: 'border-rose-500/80',
        bg: 'bg-[#15060a]/95',
        shadow: 'shadow-[0_0_35px_rgba(225,29,72,0.65)]',
        accentText: 'text-rose-400',
        badgeBg: 'bg-rose-500 text-slate-950',
        progressBg: 'bg-rose-500',
        iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        tagText: 'OVER DESIGNATED LIFE (100%+)'
      }
    : isCritical
    ? {
        border: 'border-orange-500/80',
        bg: 'bg-[#170a04]/95',
        shadow: 'shadow-[0_0_35px_rgba(234,88,12,0.6)]',
        accentText: 'text-orange-400',
        badgeBg: 'bg-orange-500 text-slate-950',
        progressBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        tagText: 'CRITICAL WEAR (≥ 95% LIFE LIMIT)'
      }
    : {
        border: 'border-amber-400/80',
        bg: 'bg-[#140e03]/95',
        shadow: 'shadow-[0_0_35px_rgba(245,158,11,0.6)]',
        accentText: 'text-amber-300',
        badgeBg: 'bg-amber-400 text-slate-950',
        progressBg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        tagText: 'TOOLING LIFE LIMIT WARNING (≥ 90%)'
      };

  const handleToggleSound = () => {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    toolingAlertService.setSoundEnabled(!nextMuted);
    if (!nextMuted) {
      toolingAlertService.playAlertSound();
    }
  };

  const handleDismiss = (id: string) => {
    if (onDismissAlert) {
      onDismissAlert(id);
    } else {
      toolingAlertService.dismissAlert(id);
    }
  };

  const handleSnooze = (id: string, mins: number = 10) => {
    if (onSnoozeAlert) {
      onSnoozeAlert(id, mins);
    } else {
      toolingAlertService.snoozeAlert(id, mins);
    }
  };

  const isOtherLine = currentAlert.lineId !== currentLineId;

  return (
    <aside 
      aria-label="Tooling Life Alerts"
      className="fixed top-16 right-4 sm:right-6 z-50 max-w-lg w-[calc(100vw-2rem)] sm:w-[480px] select-none transition-all duration-300 ease-out"
    >
      <div 
        className={`backdrop-blur-2xl rounded-2xl border-2 ${themeStyles.border} ${themeStyles.bg} ${themeStyles.shadow} overflow-hidden text-white font-sans`}
      >
        {/* Top Glowing Header Strip */}
        <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOverLife ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOverLife ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
            </span>

            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase font-mono ${themeStyles.badgeBg} flex items-center gap-1 shadow-sm`}>
              <BellRing className="w-3 h-3 flex-shrink-0 animate-bounce" />
              <span>{themeStyles.tagText}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Multiple Alerts Indicator & Pagination */}
            {alerts.length > 1 && (
              <div className="flex items-center gap-1 bg-black/50 border border-white/15 px-2 py-0.5 rounded-full text-[10.5px] font-mono text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoCycling(false);
                    setCurrentIndex(prev => (prev - 1 + alerts.length) % alerts.length);
                  }}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Previous Alert"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-white tabular-nums px-0.5">
                  {currentIndex + 1}/{alerts.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoCycling(false);
                    setCurrentIndex(prev => (prev + 1) % alerts.length);
                  }}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Next Alert"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-1.5 rounded-full border cursor-pointer transition-colors ${
                !isSoundMuted 
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900' 
                  : 'bg-white/[0.06] border-white/15 text-slate-400 hover:text-white'
              }`}
              title={!isSoundMuted ? 'Mute Alert Sound' : 'Enable Alert Sound'}
            >
              {!isSoundMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => handleDismiss(currentAlert.id)}
              className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.2] border border-white/15 text-slate-300 hover:text-white cursor-pointer transition-transform active:scale-90"
              title="Acknowledge & Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Tool Identity Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black border ${
                  currentAlert.isCurrentLine 
                    ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-purple-950/80 border-purple-400/50 text-purple-300'
                }`}>
                  {currentAlert.lineLabel}
                </span>

                <span className="text-xs font-mono font-semibold text-slate-400">
                  {currentAlert.partCode}
                </span>

                {isOtherLine && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                    Line In Background
                  </span>
                )}
              </div>

              <h4 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                {currentAlert.stageName} • {currentAlert.partName}
              </h4>
            </div>

            {/* Percentage Gauge Box */}
            <div className={`flex flex-col items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl border ${themeStyles.iconBg} flex-shrink-0 min-w-[76px]`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
                LIFE USED
              </span>
              <span className={`text-xl sm:text-2xl font-black font-mono tabular-nums leading-none mt-0.5 ${themeStyles.accentText}`}>
                {currentAlert.usagePercent}%
              </span>
            </div>
          </div>

          {/* Shot Count Comparison & Progress Bar */}
          <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Current Press Shots:</span>
              <span className="font-black text-white tabular-nums">
                {formatShots(currentAlert.currentShots)} / {formatShots(currentAlert.lifeLimit)}
              </span>
            </div>

            {/* High-visibility Progress Bar with 90% threshold notch */}
            <div className="relative w-full h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/15 p-0.5">
              <div 
                className={`h-full rounded-full ${themeStyles.progressBg} transition-all duration-500 relative`}
                style={{ width: `${Math.min(100, Math.max(0, currentAlert.usagePercent))}%` }}
              >
                {/* Diagonal caution stripes */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.25)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.25)_50%,rgba(0,0,0,0.25)_75%,transparent_75%,transparent)] bg-[length:12px_12px] opacity-60"></div>
              </div>

              {/* 90% Threshold Warning Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow-[0_0_6px_#fde047] z-10" 
                style={{ left: '90%' }}
                title="90% Life Threshold Limit"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
              <span className="text-slate-400">
                {currentAlert.remainingShots <= 0 ? (
                  <span className="text-rose-400 font-bold">
                    ⚠️ Exceeded by {formatShots(Math.abs(currentAlert.remainingShots))} shots
                  </span>
                ) : (
                  <span className={`${themeStyles.accentText} font-bold`}>
                    Remaining: {formatShots(currentAlert.remainingShots)} shots
                  </span>
                )}
              </span>
              <span className="text-slate-400">
                Limit: <span className="text-white font-bold">{formatShots(currentAlert.lifeLimit)}</span>
              </span>
            </div>
          </div>

          {/* Action Directive & Spare Stock Badge */}
          <div className="flex items-center justify-between gap-2 text-xs bg-white/[0.03] p-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="text-[11.5px] text-slate-200 leading-tight truncate">
                <span className="font-bold text-white">Action Required:</span> Schedule tooling regrind/replacement
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                currentAlert.spareStockQty > 0 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse'
              }`}>
                Stock: {currentAlert.spareStockQty} EA
              </span>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-2 pt-1">
            {/* If alert is on another line, give one-click jump button */}
            {isOtherLine && onSelectLine && (
              <button
                type="button"
                onClick={() => {
                  onSelectLine(currentAlert.lineId);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-bold font-mono text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <span>Switch to {currentAlert.lineId}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Snooze 10m */}
            <button
              type="button"
              onClick={() => handleSnooze(currentAlert.id, 10)}
              className="py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-slate-300 hover:text-white font-bold font-mono text-xs cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              title="Snooze this alert for 10 minutes"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Snooze (10m)</span>
            </button>

            {/* Acknowledge Button */}
            <button
              type="button"
              onClick={() => handleDismiss(currentAlert.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl font-black font-mono text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md ${
                isOverLife 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-950/50' 
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-950/50'
              }`}
            >
              <span>Acknowledge</span>
            </button>
          </div>

          {/* Collapsible View All Alerts Tray if multiple */}
          {alerts.length > 1 && (
            <div className="pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full text-center text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1 cursor-pointer py-0.5"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} all active 90%+ alerts ({alerts.length})</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {isExpanded && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {alerts.map((al, idx) => (
                    <div
                      key={al.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        idx === currentIndex 
                          ? 'bg-white/[0.12] border border-cyan-400/50 text-white' 
                          : 'bg-black/30 border border-white/5 text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${al.severity === 'OVER_LIFE_100' ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                        <span className="font-bold text-white">{al.lineId}:</span>
                        <span className="truncate">{al.stageName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-bold">
                        <span className={al.severity === 'OVER_LIFE_100' ? 'text-rose-400' : 'text-amber-300'}>
                          {al.usagePercent}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(al.id);
                          }}
                          className="hover:text-rose-400 p-0.5"
                          title="Dismiss this tool alert"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </aside>
  );
};
