import React from 'react';
import { PartLiveTrackingItem, LifeStatus } from '../../types';
import { formatShots } from '../../services/calculationService';

interface TvTableRowProps {
  item: PartLiveTrackingItem;
  idx: number;
  colWidths: Record<string, number>;
  onSelectModalItem: (item: PartLiveTrackingItem) => void;
  t: any;
}

export const TvTableRow: React.FC<TvTableRowProps> = React.memo(({
  item,
  idx,
  colWidths,
  onSelectModalItem,
  t
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
    rowHighlight = 'bg-red-950/30';
  } else if (status === 'CRITICAL') {
    usageColor = 'text-rose-400 font-extrabold';
    barColor = 'bg-rose-500';
    barBorder = 'border-rose-500';
    rowHighlight = 'bg-rose-950/25';
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
  let statusBadgeClass = 'bg-emerald-600 text-white font-extrabold border-emerald-400 shadow-md shadow-emerald-950/60 hover:bg-emerald-500';
  let statusLabel = t.controls?.normal || 'NORMAL';

  if (status === 'OVER_LIFE') {
    statusBadgeClass = 'bg-red-600 text-white border-red-300 font-black animate-pulse hover:bg-red-500 shadow-lg shadow-red-900/80';
    statusLabel = t.controls?.overLife || 'OVER LIFE';
  } else if (status === 'CRITICAL') {
    statusBadgeClass = 'bg-rose-600 text-white border-rose-300 font-black hover:bg-rose-500 shadow-md shadow-rose-950/60';
    statusLabel = t.controls?.critical || 'CRITICAL';
  } else if (status === 'PREPARE') {
    statusBadgeClass = 'bg-amber-500 text-slate-950 border-amber-300 font-black hover:bg-amber-400 shadow-md shadow-amber-950/60';
    statusLabel = t.controls?.prepare || 'PREPARE';
  } else if (status === 'WARNING') {
    statusBadgeClass = 'bg-yellow-400 text-slate-950 border-yellow-200 font-black hover:bg-yellow-300 shadow-md shadow-yellow-950/60';
    statusLabel = t.controls?.warning || 'WARNING';
  }

  const rowDensityClass = 'flex-1 py-1 px-1 sm:px-1.5 min-h-[36px] sm:min-h-[40px] md:min-h-[44px]';
  const isStdMissing = item.isStandardMissing || item.lifeLimit <= 0;

  return (
    <div 
      className={`flex items-center font-mono transition-colors hover:bg-cyan-950/40 ${rowHighlight} ${rowDensityClass}`}
    >
      {/* No. */}
      <div className="h-full flex items-center justify-center text-slate-100 font-black text-sm sm:text-base md:text-lg lg:text-[1.2vw] flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap min-w-[40px]" style={{ width: `${colWidths.no}%` }}>
        {idx + 1}
      </div>

      {/* Fin Die Spare Parts */}
      <div className="h-full flex items-center justify-start px-2 sm:px-3 font-sans font-black text-white border-r border-slate-800/70 tracking-wide flex-shrink-0 text-sm sm:text-base md:text-lg lg:text-[1.25vw] min-w-[140px] truncate" style={{ width: `${colWidths.stage}%` }}>
        <span className="truncate">{item.stagePunchDie || item.partName}</span>
      </div>

      {/* Life Limit */}
      <div className="h-full flex items-center justify-end px-1.5 sm:px-2.5 text-slate-200 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.2vw] tabular-nums min-w-[85px]" style={{ width: `${colWidths.lifeLimit}%` }}>
        {isStdMissing ? <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-xs font-mono font-bold">{t.controls?.missing || 'MISSING'}</span> : formatShots(item.lifeLimit)}
      </div>

      {/* Used Shot */}
      <div className="h-full flex items-center justify-end px-1.5 sm:px-2.5 text-cyan-200 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.25vw] tracking-tight tabular-nums min-w-[95px]" style={{ width: `${colWidths.currentShot}%` }}>
        {formatShots(usedShotVal)}
      </div>

      {/* Usage % */}
      <div className={`h-full flex items-center justify-center px-1 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.25vw] tabular-nums min-w-[70px] ${usageColor}`} style={{ width: `${colWidths.usage}%` }}>
        {isStdMissing ? (
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs sm:text-sm font-mono font-extrabold">-</span>
        ) : (
          `${item.usagePercent}%`
        )}
      </div>

      {/* Remaining Shot */}
      <div className={`h-full flex items-center justify-end px-1.5 sm:px-2.5 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.25vw] tracking-tight tabular-nums min-w-[95px] ${
        item.remainingShot < 0 ? 'text-red-400' : 'text-slate-100'
      }`} style={{ width: `${colWidths.remaining}%` }}>
        {isStdMissing ? (
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs sm:text-sm font-mono font-extrabold">-</span>
        ) : (
          formatShots(item.remainingShot)
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-full flex items-center justify-center px-1.5 sm:px-2 flex-shrink-0 border-r border-slate-800/70 min-w-[95px]" style={{ width: `${colWidths.progress}%` }}>
        <div className={`relative w-full bg-slate-900/90 h-6 sm:h-7 md:h-8 rounded border ${barBorder} overflow-hidden flex items-center shadow-inner`}>
          {!isStdMissing ? (
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(0, item.usagePercent))}%` }}
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm md:text-base font-mono font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {isStdMissing ? '-' : `${item.usagePercent}%`}
          </span>
        </div>
      </div>

      {/* Shot at Last Change */}
      <div className="h-full flex items-center justify-end px-1.5 sm:px-2.5 text-slate-200 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.2vw] tabular-nums min-w-[95px]" style={{ width: `${colWidths.lastChange}%` }}>
        {formatShots(shotAtLastChangeVal)}
      </div>

      {/* Install Qty */}
      <div className="h-full flex items-center justify-center px-1 text-slate-100 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.2vw] tabular-nums min-w-[65px]" style={{ width: `${colWidths.installQty}%` }}>
        {item.installQty}
      </div>

      {/* Available Spare */}
      <div className="h-full flex items-center justify-center px-1 text-slate-100 font-extrabold flex-shrink-0 border-r border-slate-800/70 whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-[1.2vw] tabular-nums min-w-[65px]" style={{ width: `${colWidths.spareQty}%` }}>
        {availableSpareVal}
      </div>

      {/* Life Status Column */}
      <div className="h-full flex items-center justify-center px-1 flex-shrink-0 min-w-[85px]" style={{ width: `${colWidths.status}%` }}>
        <button
          type="button"
          onClick={() => onSelectModalItem(item)}
          className={`w-full py-1 sm:py-1.5 px-1 rounded text-xs sm:text-sm md:text-base lg:text-[1.1vw] font-black font-mono border whitespace-nowrap transition-all shadow-md ${statusBadgeClass}`}
          title="กดเพื่อดูรายละเอียดสถานะและการจัดการของชิ้นส่วนนี้"
        >
          {statusLabel}
        </button>
      </div>
    </div>
  );
});
