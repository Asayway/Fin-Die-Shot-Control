import React from 'react';
import { PartLiveTrackingItem } from '../../types';
import { formatShots } from '../../services/calculationService';

interface TvTableRowProps {
  item: PartLiveTrackingItem;
  idx: number;
  colWidths: Record<string, number>;
  onSelectModalItem: (item: PartLiveTrackingItem) => void;
  t?: any;
  isFullscreen?: boolean;
}

export const TvTableRow: React.FC<TvTableRowProps> = React.memo(({
  item,
  colWidths,
  onSelectModalItem,
  isFullscreen = false
}) => {
  const usedShotVal = item.usedShot !== undefined ? item.usedShot : item.currentShot;
  const availableSpareVal = item.availableSpare !== undefined ? item.availableSpare : item.backupQty;
  const isStdMissing = item.isStandardMissing || item.lifeLimit <= 0;
  const percentVal = Math.round(item.usagePercent || (item.lifeLimit > 0 ? (usedShotVal / item.lifeLimit) * 100 : 0));
  const stageLower = (item.stagePunchDie || item.partName || '').toLowerCase();

  // Low stock & order flags
  const isLowStock = item.stockStatus === 'OUT_OF_STOCK' || item.stockStatus === 'LOW_STOCK' || (availableSpareVal !== undefined && availableSpareVal <= 0);
  const isOrderFlagged = item.orderStatus === 'PO OPEN' || item.orderStatus === 'PR PREPARING' || item.orderStatus === 'ORDERED';
  const isCriticalWear = item.lifeStatus === 'CRITICAL' || item.lifeStatus === 'OVER_LIFE';

  // Determine Order Require alert circle color based on Signal Standard thresholds
  let orderRequireColor = '';
  let orderRequireTitle = '';

  if (item.lifeStatus === 'OVER_LIFE' || percentVal >= 100) {
    orderRequireColor = 'bg-[#ff0000] border-[#b91c1c] shadow-[0_0_14px_rgba(255,0,0,0.9)]';
    orderRequireTitle = 'Over Life Replace Count - Order Required';
  } else if (item.lifeStatus === 'CRITICAL' || isCriticalWear) {
    orderRequireColor = 'bg-[#ff0000] border-[#b91c1c] shadow-[0_0_14px_rgba(255,0,0,0.9)]';
    orderRequireTitle = 'Critical Replace Count - Order Required';
  } else if (item.lifeStatus === 'PREPARE') {
    orderRequireColor = 'bg-[#f97316] border-[#c2410c] shadow-[0_0_14px_rgba(249,115,22,0.9)]';
    orderRequireTitle = 'Prepare Replace Count - Order Required';
  } else if (item.lifeStatus === 'WARNING') {
    orderRequireColor = 'bg-[#ffff00] border-[#ca8a04] shadow-[0_0_14px_rgba(255,255,0,0.9)]';
    orderRequireTitle = 'Warning Replace Count - Order Required';
  } else if (isLowStock || isOrderFlagged) {
    orderRequireColor = 'bg-[#f97316] border-[#c2410c] shadow-[0_0_14px_rgba(249,115,22,0.9)]';
    orderRequireTitle = 'Low Stock - Order Required';
  }

  const needsOrder = !!orderRequireColor;

  // Progress percentage clamp & fill color (Grey bar fill as requested)
  const clampPercent = item.lifeLimit > 0 ? Math.min(100, Math.max(0, percentVal)) : 0;
  const progressFillColor = '#555555'; // Grey bar fill matching TV reference image

  // Life Time (Days) calculation or explicit state
  let lifeTimeDisplay: React.ReactNode = '-';
  if (isStdMissing) {
    lifeTimeDisplay = (
      <span className="text-xs font-mono font-bold text-slate-500 uppercase">
        STANDARD NOT SET
      </span>
    );
  } else if (item.daysRemainingForecast !== undefined && item.daysRemainingForecast > 0) {
    lifeTimeDisplay = item.daysRemainingForecast;
  } else if (item.daysRemainingForecast === 0) {
    lifeTimeDisplay = (
      <span className="text-xs font-mono font-bold text-red-500 uppercase">
        0 (OVER LIFE)
      </span>
    );
  } else {
    // If daily rate is 0 or unconfigured, we do not invent arbitrary divisors
    lifeTimeDisplay = (
      <span className="text-xs font-mono font-bold text-slate-500 uppercase">
        NO FORECAST
      </span>
    );
  }

  // Row height: flex-1 min-h-0 so rows fill available screen height dynamically
  const rowHeightClass = 'flex-1 min-h-[36px] sm:min-h-[40px] md:min-h-[46px] py-0.5 sm:py-1';

  // Shot Count Column background color: Always solid Green (#00ff00 text-black) as requested
  const shotBgClass = item.lifeLimit > 0 ? 'bg-[#00ff00] text-black' : 'bg-[#000000] text-white';

  // Format clean English display name for TV Monitor (strip any stage group Thai translations and specs)
  const getCleanDisplayName = () => {
    let name = item.partName || item.stagePunchDie || '';
    // Strip everything inside parentheses like (Ø7) or (3P) and Thai text
    if (name.includes('(')) {
      name = name.replace(/\s*\(.*?\)/g, '').trim();
    }
    return name || item.partName || item.stagePunchDie || 'Tooling Part';
  };
  const displayName = getCleanDisplayName();

  return (
    <div 
      className={`flex items-center font-sans bg-[#000000] hover:bg-[#151515] border-b border-[#282828] transition-colors ${rowHeightClass}`}
    >
      {/* 1. Stage Punch / Die (Left aligned, white bold text, large display for distance reading) */}
      <div 
        onClick={() => onSelectModalItem(item)}
        className="h-full flex items-center justify-start px-2 sm:px-3 font-sans font-black text-white border-r border-[#282828] flex-shrink-0 cursor-pointer truncate text-base sm:text-xl md:text-2xl lg:text-3xl tracking-tight"
        style={{ width: `${colWidths.stage}%` }}
        title={displayName}
      >
        <span className="truncate">{displayName}</span>
      </div>

      {/* 2. Replacement Count (Right aligned, white bold text, large display) */}
      <div 
        className="h-full flex items-center justify-end px-2 sm:px-3 text-white font-black flex-shrink-0 border-r border-[#282828] whitespace-nowrap tabular-nums font-mono text-base sm:text-xl md:text-2xl lg:text-3xl"
        style={{ width: `${colWidths.replacement}%` }}
      >
        {isStdMissing ? (
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">STANDARD NOT SET</span>
        ) : (
          formatShots(item.lifeLimit)
        )}
      </div>

      {/* 3. Shot Count (Always solid Green #00ff00 text-black, bold text, right aligned, extra large display) */}
      <div 
        className={`h-full flex items-center justify-end px-2 sm:px-3 flex-shrink-0 border-r border-[#282828] whitespace-nowrap tabular-nums font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black ${shotBgClass}`}
        style={{ width: `${colWidths.shot}%` }}
      >
        {usedShotVal !== undefined && !isNaN(usedShotVal) ? (
          formatShots(usedShotVal)
        ) : (
          <span className="text-xs font-mono font-bold text-slate-400 uppercase">NO DATA</span>
        )}
      </div>

      {/* 4. Progress (Proportional grey fill bar matching percentage over dark grey background) */}
      <div 
        className="h-full flex items-center justify-center flex-shrink-0 border-r border-[#282828] relative overflow-hidden bg-[#1f232b]"
        style={{ width: `${colWidths.progress}%` }}
      >
        {item.lifeLimit > 0 && clampPercent > 0 && (
          <div 
            className="absolute left-0 top-0 bottom-0 transition-all duration-300 opacity-80"
            style={{ width: `${clampPercent}%`, backgroundColor: progressFillColor }}
          />
        )}
        <span className="relative z-10 select-none text-base sm:text-xl md:text-2xl lg:text-3xl font-mono font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          {item.lifeLimit > 0 ? `${percentVal}%` : '-'}
        </span>
      </div>

      {/* 5. Life Time (Days) (Right aligned, white bold text, large display) */}
      <div 
        className="h-full flex items-center justify-end px-2 sm:px-3 text-white font-black flex-shrink-0 border-r border-[#282828] whitespace-nowrap tabular-nums font-mono text-base sm:text-xl md:text-2xl lg:text-3xl"
        style={{ width: `${colWidths.lifetime}%` }}
      >
        {lifeTimeDisplay}
      </div>

      {/* 6. Install Qty. (Right aligned, white bold text, large display) */}
      <div 
        className="h-full flex items-center justify-end px-2 sm:px-3 text-white font-black flex-shrink-0 border-r border-[#282828] whitespace-nowrap tabular-nums font-mono text-base sm:text-xl md:text-2xl lg:text-3xl"
        style={{ width: `${colWidths.installQty}%` }}
      >
        {item.installQty !== undefined && item.installQty > 0 ? (
          item.installQty
        ) : item.installQty === 0 ? (
          <span className="text-xs font-mono font-bold text-amber-500 uppercase">0 (NOT SET)</span>
        ) : (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 uppercase">INSTALL QTY. NOT SET</span>
        )}
      </div>

      {/* 7. Stock Qty. (Right aligned, white bold text, large display) */}
      <div 
        className="h-full flex items-center justify-end px-2 sm:px-3 text-white font-black flex-shrink-0 border-r border-[#282828] whitespace-nowrap tabular-nums font-mono text-base sm:text-xl md:text-2xl lg:text-3xl"
        style={{ width: `${colWidths.stockQty}%` }}
      >
        {item.lineStockQty !== undefined || availableSpareVal !== undefined ? (
          <div className="flex flex-col items-end justify-center leading-none">
            <span className={`${(item.lineStockQty ?? availableSpareVal) === 0 ? 'text-red-400' : 'text-white font-black'}`}>
              {item.lineStockQty ?? availableSpareVal}
            </span>
            {item.totalStockQty !== undefined && item.totalStockQty !== (item.lineStockQty ?? availableSpareVal) && (
              <span className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-400 font-bold mt-0.5 font-sans">
                (รวม: {item.totalStockQty})
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500 uppercase">STOCK DATA NOT AVAILABLE</span>
        )}
      </div>

      {/* 8. Order Require (Color-coded indicator matching Signal Standard: Green/Yellow/Orange/Red) */}
      <div 
        onClick={() => onSelectModalItem(item)}
        className="h-full flex items-center justify-center px-2 flex-shrink-0 cursor-pointer select-none"
        style={{ width: `${colWidths.orderRequire}%` }}
        title={orderRequireTitle}
      >
        {needsOrder && (
          <div className="flex items-center justify-center gap-2">
            <span className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full border-2 inline-block ${orderRequireColor}`} />
          </div>
        )}
      </div>
    </div>
  );
});
