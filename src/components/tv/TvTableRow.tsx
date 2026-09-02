import React from 'react';
import { PartLiveTrackingItem, LifeStatus } from '../../types';
import { formatShots } from '../../services/calculationService';

interface TvTableRowProps {
  item: PartLiveTrackingItem;
  idx: number;
  colWidths: Record<string, number>;
  onSelectModalItem: (item: PartLiveTrackingItem) => void;
  t: any;
  isFullscreen?: boolean;
}

export const TvTableRow: React.FC<TvTableRowProps> = React.memo(({
  item,
  idx,
  colWidths,
  onSelectModalItem,
  t,
  isFullscreen
}) => {
  const usedShotVal = item.usedShot !== undefined ? item.usedShot : item.currentShot;
  const shotAtLastChangeVal = item.shotAtLastChange !== undefined ? item.shotAtLastChange : item.lastChangeShot;
  const availableSpareVal = item.availableSpare !== undefined ? item.availableSpare : item.backupQty;
  const status: LifeStatus = item.lifeStatus || item.alertStatus || 'NORMAL';

  let usageColor = 'text-emerald-400 font-extrabold';
  let barColor = 'bg-emerald-500';
  let barBorder = 'border-emerald-500';
  let rowHighlight = '';

  if (status === 'OVER_LIFE') {
    usageColor = 'text-red-400 font-extrabold';
    barColor = 'bg-red-600';
    barBorder = 'border-red-500';
    rowHighlight = 'bg-red-950/40 border-y border-red-900/50';
  } else if (status === 'CRITICAL') {
    usageColor = 'text-rose-400 font-extrabold';
    barColor = 'bg-rose-500';
    barBorder = 'border-rose-500';
    rowHighlight = 'bg-rose-950/30';
  } else if (status === 'PREPARE') {
    usageColor = 'text-amber-400 font-extrabold';
    barColor = 'bg-amber-500';
    barBorder = 'border-amber-500';
  } else if (status === 'WARNING') {
    usageColor = 'text-yellow-300 font-extrabold';
    barColor = 'bg-yellow-400';
    barBorder = 'border-yellow-500';
  }

  // High-visibility block color badges for shop floor visibility
  let statusBadgeClass = 'bg-emerald-600 text-white font-black border-emerald-400 shadow-sm hover:bg-emerald-500';
  let statusLabel = t.controls?.normal || 'NORMAL';

  if (status === 'OVER_LIFE') {
    statusBadgeClass = 'bg-red-600 text-white border-red-300 font-black animate-pulse hover:bg-red-500 shadow-lg';
    statusLabel = t.controls?.overLife || 'OVER LIFE';
  } else if (status === 'CRITICAL') {
    statusBadgeClass = 'bg-rose-600 text-white border-rose-300 font-black hover:bg-rose-500 shadow-lg';
    statusLabel = t.controls?.critical || 'CRITICAL';
  } else if (status === 'PREPARE') {
    statusBadgeClass = 'bg-amber-500 text-slate-950 border-amber-300 font-black hover:bg-amber-400 shadow-md';
    statusLabel = t.controls?.prepare || 'PREPARE';
  } else if (status === 'WARNING') {
    statusBadgeClass = 'bg-yellow-400 text-slate-950 border-yellow-200 font-black hover:bg-yellow-300 shadow-md';
    statusLabel = t.controls?.warning || 'WARNING';
  }

  // Row height and text scale dynamically expand when in Fullscreen / TV view
  const rowDensityClass = isFullscreen
    ? 'flex-1 py-1.5 lg:py-2.5 px-1.5 lg:px-2.5 min-h-[42px] lg:min-h-[50px] xl:min-h-[56px]'
    : 'flex-1 py-1 sm:py-1.5 px-1.5 min-h-[38px] sm:min-h-[44px] lg:min-h-[48px]';

  const cellTextBase = isFullscreen
    ? 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl'
    : 'text-sm sm:text-base md:text-lg lg:text-xl';

  const isStdMissing = item.isStandardMissing || item.lifeLimit <= 0;

  return (
    <div 
      className={`flex items-center font-mono transition-colors hover:bg-cyan-950/40 ${rowHighlight} ${rowDensityClass}`}
    >
      {/* No. */}
      <div className={`h-full flex items-center justify-center text-slate-300 font-black ${cellTextBase} flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap min-w-[40px]`} style={{ width: `${colWidths.no}%` }}>
        {idx + 1}
      </div>

      {/* Fin Die Spare Parts */}
      <div className={`h-full flex items-center justify-start px-2 sm:px-3 font-sans font-black text-white border-r border-slate-800/70 tracking-wide flex-shrink-0 ${cellTextBase} min-w-[140px] truncate`} style={{ width: `${colWidths.stage}%` }}>
        <span className="truncate drop-shadow-sm">{item.stagePunchDie || item.partName}</span>
      </div>

      {/* Life Limit */}
      <div className={`h-full flex items-center justify-end px-2 sm:px-3 text-slate-200 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tabular-nums min-w-[85px]`} style={{ width: `${colWidths.lifeLimit}%` }}>
        {isStdMissing ? <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 text-xs sm:text-sm lg:text-base font-mono font-black">{t.controls?.missing || 'MISSING'}</span> : formatShots(item.lifeLimit)}
      </div>

      {/* Used Shot */}
      <div className={`h-full flex items-center justify-end px-2 sm:px-3 text-cyan-300 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tracking-tight tabular-nums min-w-[90px]`} style={{ width: `${colWidths.currentShot}%` }}>
        {formatShots(usedShotVal)}
      </div>

      {/* Usage % */}
      <div className={`h-full flex items-center justify-center px-1.5 sm:px-2 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tabular-nums min-w-[70px] ${usageColor}`} style={{ width: `${colWidths.usage}%` }}>
        {isStdMissing ? (
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs sm:text-sm font-mono font-bold">-</span>
        ) : (
          `${item.usagePercent}%`
        )}
      </div>

      {/* Remaining Shot */}
      <div className={`h-full flex items-center justify-end px-2 sm:px-3 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tracking-tight tabular-nums min-w-[90px] ${
        item.remainingShot < 0 ? 'text-red-400' : 'text-slate-100'
      }`} style={{ width: `${colWidths.remaining}%` }}>
        {isStdMissing ? (
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs sm:text-sm font-mono font-bold">-</span>
        ) : (
          formatShots(item.remainingShot)
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-full flex items-center justify-center px-1.5 sm:px-2 flex-shrink-0 border-r border-slate-800/70 min-w-[90px]" style={{ width: `${colWidths.progress}%` }}>
        <div className={`relative w-full bg-slate-900/90 ${isFullscreen ? 'h-7 sm:h-8 lg:h-9' : 'h-6 sm:h-7'} rounded-md border ${barBorder} overflow-hidden flex items-center shadow-inner`}>
          {!isStdMissing ? (
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, item.usagePercent))}%` }}
            />
          ) : null}
          <span className={`absolute inset-0 flex items-center justify-center ${isFullscreen ? 'text-sm sm:text-base lg:text-lg' : 'text-xs sm:text-sm md:text-base'} font-mono font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}>
            {isStdMissing ? '-' : `${item.usagePercent}%`}
          </span>
        </div>
      </div>

      {/* Shot at Last Change */}
      <div className={`h-full flex items-center justify-end px-2 sm:px-3 text-slate-200 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tabular-nums min-w-[90px]`} style={{ width: `${colWidths.lastChange}%` }}>
        {formatShots(shotAtLastChangeVal)}
      </div>

      {/* Install Qty */}
      <div className={`h-full flex items-center justify-center px-1.5 sm:px-2 text-slate-100 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tabular-nums min-w-[60px]`} style={{ width: `${colWidths.installQty}%` }}>
        {item.installQty}
      </div>

      {/* Available Spare */}
      <div className={`h-full flex items-center justify-center px-1.5 sm:px-2 text-slate-100 font-black flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap ${cellTextBase} tabular-nums min-w-[60px]`} style={{ width: `${colWidths.spareQty}%` }}>
        {availableSpareVal}
      </div>

      {/* Life Status Column */}
      <div className="h-full flex items-center justify-center px-1 sm:px-1.5 flex-shrink-0 min-w-[80px]" style={{ width: `${colWidths.status}%` }}>
        <button
          type="button"
          onClick={() => onSelectModalItem(item)}
          className={`w-full ${isFullscreen ? 'py-2 lg:py-2.5 px-2 text-sm sm:text-base lg:text-lg xl:text-xl' : 'py-1.5 px-1.5 text-xs sm:text-sm md:text-base'} rounded-md font-black font-mono border whitespace-nowrap transition-all shadow-md active:scale-95 ${statusBadgeClass}`}
          title="กดเพื่อดูรายละเอียดสถานะและการจัดการของชิ้นส่วนนี้"
        >
          {statusLabel}
        </button>
      </div>
    </div>
  );
});
