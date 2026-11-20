import React, { useEffect, useMemo, useState } from 'react';
import {
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  AlertTriangle,
  Info,
  Radio
} from 'lucide-react';
import {
  LineLiveMonitoringData,
  PartLiveTrackingItem,
  ProductionLineId,
  SystemSettings
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  calculatePartMetrics,
  determineLifeStatus,
  findMatchingLifeStandard,
  formatShots
} from '../../services/calculationService';

const LINES_LIST: ProductionLineId[] = [
  'E1',
  'E2',
  'E3 SLIT',
  'E3 WL+',
  'E3 New Cor',
  'E4',
  'E5'
];

interface MonitorCalculationKnowledgePanelProps {
  settings: SystemSettings;
}

interface SandboxValues {
  dailyShot: number;
  usedShot: number;
  lifeLimit: number;
  installQty: number;
  lineStockQty: number;
  totalStockQty: number;
}

export const MonitorCalculationKnowledgePanel: React.FC<MonitorCalculationKnowledgePanelProps> = ({
  settings
}) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>('E1');
  const [selectedPartCode, setSelectedPartCode] = useState<string>('');
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);
  const [liveRefreshTick, setLiveRefreshTick] = useState<number>(0);

  // Subscribe to storage updates so live figures stay accurate
  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setLiveRefreshTick(t => t + 1);
    });
    return () => unsub();
  }, []);

  // Resolve live context for selected line
  const lineSnapshot = useMemo(() => {
    const monitoring: LineLiveMonitoringData | undefined = storageService.getLineMonitoring(selectedLineId);
    const configs = storageService.getLineConfigs();
    const activeConfig =
      configs.find(c => c.lineId === selectedLineId && c.isActive) ||
      configs.find(c => c.lineId === selectedLineId) ||
      monitoring?.activeConfig ||
      null;
    const standards = storageService.getLifeStandards();
    const stocks = storageService.getSpareStocks();
    const partMasters = storageService.getPartMasters();

    const rawItems = monitoring?.items || [];
    const computedItems: PartLiveTrackingItem[] = rawItems.map(item => {
      const rawCode = (item.partCode || '').trim();
      const strippedCode = rawCode.replace(/^(E\d+(?:-\d+)?-)/i, '').trim();
      const matchedPart = partMasters.find(
        p =>
          p.partCode.toLowerCase() === rawCode.toLowerCase() ||
          p.partCode.toLowerCase() === strippedCode.toLowerCase() ||
          (item.partName && p.partName.toLowerCase() === item.partName.toLowerCase())
      );
      const permanentCode = matchedPart?.partCode || strippedCode || rawCode;

      return calculatePartMetrics(
        {
          slotId: item.slotId || `SLOT-${selectedLineId}-${permanentCode}`,
          partCode: permanentCode,
          partName: item.partName || matchedPart?.partName || item.stagePunchDie,
          stagePunchDie: item.stagePunchDie || matchedPart?.stageName || 'Die Stage',
          position: item.position || item.stagePunchDie || 'ALL',
          installQty: item.installQty,
          backupQty: item.backupQty,
          usedShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          currentShot: item.usedShot !== undefined ? item.usedShot : item.currentShot,
          shotAtLastChange: item.shotAtLastChange ?? item.lastChangeShot,
          lastChangeShot: item.shotAtLastChange ?? item.lastChangeShot,
          regrindCount: item.regrindCount,
          totalMmGround: item.totalMmGround,
          lifeLimit: item.lifeLimit
        },
        activeConfig,
        standards,
        stocks,
        monitoring?.dailyShot || 0
      );
    });

    return {
      monitoring,
      activeConfig,
      standards,
      stocks,
      items: computedItems
    };
  }, [selectedLineId, liveRefreshTick]);

  // Keep selectedPartCode valid when switching lines
  useEffect(() => {
    if (lineSnapshot.items.length === 0) {
      setSelectedPartCode('');
      return;
    }
    const stillExists = lineSnapshot.items.some(i => i.partCode === selectedPartCode);
    if (!stillExists) {
      setSelectedPartCode(lineSnapshot.items[0].partCode);
    }
  }, [lineSnapshot.items, selectedPartCode]);

  const activeLiveItem: PartLiveTrackingItem | null = useMemo(() => {
    if (lineSnapshot.items.length === 0) return null;
    return (
      lineSnapshot.items.find(i => i.partCode === selectedPartCode) ||
      lineSnapshot.items[0]
    );
  }, [lineSnapshot.items, selectedPartCode]);

  const matchedStandard = useMemo(() => {
    if (!activeLiveItem || !lineSnapshot.activeConfig) return null;
    return findMatchingLifeStandard(
      lineSnapshot.standards,
      lineSnapshot.activeConfig,
      activeLiveItem.partCode,
      activeLiveItem.position
    );
  }, [activeLiveItem, lineSnapshot.activeConfig, lineSnapshot.standards]);

  const liveInputs: SandboxValues = useMemo(() => {
    const dailyShot = lineSnapshot.monitoring?.dailyShot || 0;
    const usedShot = activeLiveItem
      ? activeLiveItem.usedShot !== undefined
        ? activeLiveItem.usedShot
        : activeLiveItem.currentShot || 0
      : 0;
    const lifeLimit = activeLiveItem?.lifeLimit || 0;
    const installQty = activeLiveItem?.installQty || 0;
    const lineStockQty =
      activeLiveItem?.lineStockQty !== undefined
        ? activeLiveItem.lineStockQty
        : activeLiveItem?.backupQty || 0;
    const totalStockQty =
      activeLiveItem?.totalStockQty !== undefined
        ? activeLiveItem.totalStockQty
        : lineStockQty;

    return {
      dailyShot,
      usedShot,
      lifeLimit,
      installQty,
      lineStockQty,
      totalStockQty
    };
  }, [lineSnapshot.monitoring?.dailyShot, activeLiveItem]);

  const [sandbox, setSandbox] = useState<SandboxValues>(liveInputs);

  // Sync sandbox inputs from live whenever not actively editing in sandbox mode
  useEffect(() => {
    if (!isSandboxMode) {
      setSandbox(liveInputs);
    }
  }, [liveInputs, isSandboxMode]);

  const eff = isSandboxMode ? sandbox : liveInputs;

  // Derived step-by-step calculations mirroring calculationService.ts + TvTableRow.tsx
  const derived = useMemo(() => {
    const warningTh = settings.warningThresholdPercent || 70;
    const prepareTh = settings.prepareThresholdPercent || 85;
    const criticalTh = settings.criticalThresholdPercent || 95;

    const isStdMissing = eff.lifeLimit <= 0;
    const rawPercent = !isStdMissing ? (eff.usedShot / eff.lifeLimit) * 100 : 0;
    const usagePercent = !isStdMissing ? Math.min(100, Math.round(rawPercent)) : 0;

    const remainingShot = !isStdMissing ? Math.max(0, eff.lifeLimit - eff.usedShot) : 0;
    const rawDays = eff.dailyShot > 0 && remainingShot > 0 ? remainingShot / eff.dailyShot : 0;
    const daysRemaining =
      eff.dailyShot > 0 && remainingShot > 0 ? Math.ceil(rawDays) : 0;

    const lifeStatus = determineLifeStatus(usagePercent, isStdMissing, false, {
      warningThresholdPercent: warningTh,
      prepareThresholdPercent: prepareTh,
      criticalThresholdPercent: criticalTh
    });

    const isZeroInstall = eff.installQty <= 0;
    const isLowStock = eff.lineStockQty <= 0;

    let signalLabel = 'ปกติ (ไม่ขึ้นจุดเตือน)';
    let signalTone: 'none' | 'yellow' | 'amber' | 'rose' | 'orange' = 'none';

    if (lifeStatus === 'OVER_LIFE' || usagePercent >= 100) {
      signalLabel = 'สีแดง — เกินอายุมาตรฐาน (Over Life)';
      signalTone = 'rose';
    } else if (lifeStatus === 'CRITICAL') {
      signalLabel = `สีแดง — วิกฤต (>= ${criticalTh}%)`;
      signalTone = 'rose';
    } else if (lifeStatus === 'PREPARE') {
      signalLabel = `สีส้มอำพัน — เตรียมเปลี่ยน (>= ${prepareTh}%)`;
      signalTone = 'amber';
    } else if (lifeStatus === 'WARNING') {
      signalLabel = `สีเหลือง — เฝ้าระวัง (>= ${warningTh}%)`;
      signalTone = 'yellow';
    } else if (isLowStock) {
      signalLabel = 'สีส้ม — สต็อกเฉพาะไลน์หมด / ต้องสั่งซื้อ';
      signalTone = 'orange';
    }

    const daysDisplayText = isStdMissing
      ? 'STANDARD NOT SET'
      : daysRemaining > 0
      ? `${formatShots(daysRemaining)} วัน`
      : remainingShot === 0
      ? '0 (OVER LIFE)'
      : '0 (ยังไม่เดินเครื่องวันนี้ / ไม่มีพยากรณ์)';

    return {
      warningTh,
      prepareTh,
      criticalTh,
      isStdMissing,
      rawPercent,
      usagePercent,
      remainingShot,
      rawDays,
      daysRemaining,
      daysDisplayText,
      lifeStatus,
      isZeroInstall,
      isLowStock,
      signalLabel,
      signalTone
    };
  }, [eff, settings]);

  const handleResetToLive = () => {
    setSandbox(liveInputs);
    setIsSandboxMode(false);
  };

  const machineShotTotal = lineSnapshot.monitoring?.machineShotTotal || 0;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* 1. LINE & PART SELECTOR + SANDBOX CONTROLS */}
      <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 space-y-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight text-balance">
              หลักการคำนวณ 7 คอลัมน์หน้า Monitor (คำนวณสดและจำลองตัวเลข)
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-thai">
              เลือกสายการผลิตและชิ้นส่วนเพื่อดูที่มาของข้อมูลจริง หรือสลับเป็นโหมดจำลองตัวเลขเพื่อทดสอบสูตรคำนวณทีละขั้น
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsSandboxMode(false);
                  setSandbox(liveInputs);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  !isSandboxMode
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>ค่าสดจากเครื่อง</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSandbox(liveInputs);
                  setIsSandboxMode(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSandboxMode
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>จำลองตัวเลขเอง</span>
              </button>
            </div>

            {isSandboxMode && (
              <button
                type="button"
                onClick={handleResetToLive}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตเป็นค่าสด</span>
              </button>
            )}
          </div>
        </div>

        {/* Line Switcher & Part Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              สายการผลิต (Line)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {LINES_LIST.map(lineId => (
                <button
                  key={lineId}
                  type="button"
                  onClick={() => {
                    setSelectedLineId(lineId);
                    setIsSandboxMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    selectedLineId === lineId
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {lineId}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">
              เลือกชิ้นส่วนบนหน้า Monitor ({lineSnapshot.items.length} รายการ)
            </label>
            <select
              value={activeLiveItem?.partCode || ''}
              onChange={e => {
                setSelectedPartCode(e.target.value);
                setIsSandboxMode(false);
              }}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {lineSnapshot.items.length === 0 ? (
                <option value="">ไม่พบข้อมูลชิ้นส่วนในไลน์นี้</option>
              ) : (
                lineSnapshot.items.map(it => (
                  <option key={it.slotId} value={it.partCode}>
                    {it.partName} ({it.partCode})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Interactive Parameter Inputs (Live Readout or Sandbox Editable) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-white/10 font-mono">
          <div className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-slate-400">มาตรฐานอายุ (Shot)</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                step={100000}
                value={sandbox.lifeLimit}
                onChange={e =>
                  setSandbox(s => ({ ...s, lifeLimit: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-amber-300 tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                {eff.lifeLimit > 0 ? formatShots(eff.lifeLimit) : 'NOT SET'}
              </div>
            )}
          </div>

          <div className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-slate-400">ยอดผลิตปัจจุบัน</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                step={1000}
                value={sandbox.usedShot}
                onChange={e =>
                  setSandbox(s => ({ ...s, usedShot: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-emerald-300 tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                {formatShots(eff.usedShot)}
              </div>
            )}
          </div>

          <div className="bg-black/35 border border-cyan-500/30 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-cyan-300">ยอดผลิตวันนี้ (ตัวหารวัน)</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                step={1000}
                value={sandbox.dailyShot}
                onChange={e =>
                  setSandbox(s => ({ ...s, dailyShot: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-cyan-300 tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div className="text-sm sm:text-base font-bold text-cyan-300 tabular-nums">
                {formatShots(eff.dailyShot)}
              </div>
            )}
          </div>

          <div className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-slate-400">จำนวนติดตั้ง (EA)</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                value={sandbox.installQty}
                onChange={e =>
                  setSandbox(s => ({ ...s, installQty: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-white tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                {eff.installQty > 0 ? formatShots(eff.installQty) : '0 (NOT SET)'}
              </div>
            )}
          </div>

          <div className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-slate-400">สต็อกไลน์ {selectedLineId}</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                value={sandbox.lineStockQty}
                onChange={e =>
                  setSandbox(s => ({ ...s, lineStockQty: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-white tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div
                className={`text-sm sm:text-base font-bold tabular-nums ${
                  eff.lineStockQty <= 0 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {formatShots(eff.lineStockQty)}
              </div>
            )}
          </div>

          <div className="bg-black/35 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="text-[11px] font-sans text-slate-400">สต็อกรวมทุกไลน์</div>
            {isSandboxMode ? (
              <input
                type="number"
                min={0}
                value={sandbox.totalStockQty}
                onChange={e =>
                  setSandbox(s => ({ ...s, totalStockQty: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                }
                className="w-full bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1 text-sm font-bold text-slate-200 tabular-nums focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div className="text-sm sm:text-base font-bold text-slate-200 tabular-nums">
                {formatShots(eff.totalStockQty)}
              </div>
            )}
          </div>
        </div>

        {/* Simulated Single-Row TV Output Strip */}
        <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              ผลลัพธ์บนแถวตาราง Monitor ({isSandboxMode ? 'ค่าจำลอง' : `ข้อมูลสด Line ${selectedLineId}`} · ยอดผลิตรวมเครื่อง {formatShots(machineShotTotal)})
            </span>
            <span className="font-mono text-slate-300">
              {activeLiveItem?.partName || 'เลือกชิ้นส่วน'} {activeLiveItem?.partCode ? `· ${activeLiveItem.partCode}` : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px] grid grid-cols-7 gap-2 pt-2 border-t border-white/10 font-mono tabular-nums text-xs">
              <div>
                <div className="text-[10px] font-sans text-slate-500">1. มาตรฐานอายุ</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {derived.isStdMissing ? 'STANDARD NOT SET' : formatShots(eff.lifeLimit)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">2. ยอดผลิตปัจจุบัน</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatShots(eff.usedShot)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">3. ความคืบหน้า %</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {derived.isStdMissing ? '-' : `${derived.usagePercent}%`}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">4. อายุงาน (วัน)</div>
                <div
                  className={`text-sm font-bold mt-0.5 ${
                    derived.daysRemaining > 0 ? 'text-cyan-300' : 'text-amber-300'
                  }`}
                >
                  {derived.isStdMissing
                    ? 'NOT SET'
                    : derived.daysRemaining > 0
                    ? formatShots(derived.daysRemaining)
                    : '0'}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">5. จำนวนติดตั้ง</div>
                <div className={`text-sm font-bold mt-0.5 ${derived.isZeroInstall ? 'text-amber-400' : 'text-white'}`}>
                  {derived.isZeroInstall ? '0 (NOT SET)' : formatShots(eff.installQty)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">6. สต็อกอะไหล่</div>
                <div className={`text-sm font-bold mt-0.5 ${derived.isLowStock ? 'text-rose-400' : 'text-white'}`}>
                  {formatShots(eff.lineStockQty)}
                  {eff.totalStockQty !== eff.lineStockQty && (
                    <span className="text-[11px] text-slate-400 font-sans ml-1">
                      (รวม: {formatShots(eff.totalStockQty)})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">7. สถานะ</div>
                <div className="text-xs font-sans font-semibold text-slate-200 mt-0.5">
                  {derived.signalLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STEP-BY-STEP BREAKDOWN FOR EACH OF THE 7 MONITOR COLUMNS */}
      <div className="space-y-4">
        {/* Column 01: Standard Life */}
        <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-white">
              01. มาตรฐานอายุการใช้งาน (Standard Replacement Count)
            </h4>
            <span className="text-xs font-mono tabular-nums text-cyan-300">
              ผลลัพธ์: {derived.isStdMissing ? 'STANDARD NOT SET' : `${formatShots(eff.lifeLimit)} ช็อต`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 1 · แหล่งข้อมูลที่ดึง</div>
              <p className="text-slate-400 font-thai">
                ดึงจากฐานข้อมูล <strong>Life Standards</strong> โดยจับคู่เงื่อนไขของไลน์ {selectedLineId} (รหัสแม่พิมพ์, วัสดุ, ขนาดท่อ และรหัสพาร์ท {activeLiveItem?.partCode || '-'})
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 2 · ลำดับการเทียบหา</div>
              <p className="text-slate-400 font-thai">
                ตรงทุกเงื่อนไขของไลน์ → ใช้ค่าทั่วไปของท่อ/วัสดุเดียวกัน → ใช้ค่าจาก Part Master/รายการตั้งต้น
                {matchedStandard ? ` (พบมาตรฐานที่ตรงกัน: ${formatShots(matchedStandard.lifeLimitShots)})` : ''}
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 3 · เงื่อนไขพิเศษ</div>
              <p className="text-slate-400 font-thai">
                หากไม่มีข้อมูลมาตรฐานหรือค่าเป็น 0 ระบบจะแสดง <strong>STANDARD NOT SET</strong> และงดคำนวณ % กับจำนวนวัน
              </p>
            </div>
          </div>
        </section>

        {/* Column 02: Current Shot Count */}
        <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-white">
              02. ยอดผลิตปัจจุบัน (Current Shot Count)
            </h4>
            <span className="text-xs font-mono tabular-nums text-emerald-400">
              ผลลัพธ์: {formatShots(eff.usedShot)} ช็อต
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 1 · แหล่งข้อมูลที่ดึง</div>
              <p className="text-slate-400 font-thai">
                สะสมยอดช็อตเฉพาะชิ้นส่วนนั้นตั้งแต่เปลี่ยน/รีเซ็ตครั้งล่าสุด (<span className="font-mono text-slate-300">usedShot</span>) แยกอิสระจากยอดผลิตรวมของตัวเครื่อง (<span className="font-mono text-slate-300">{formatShots(machineShotTotal)}</span>)
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 2 · การบวกช็อตอัตโนมัติ</div>
              <p className="text-slate-400 font-thai">
                ทุกจังหวะที่เครื่อง/จำลองเดิน (หรือกรอกช็อตรายกะ) ระบบจะบวกเพิ่มทีละเท่ากับช็อตที่เพิ่มขึ้นจริง และรีเซ็ตเป็น 0 เมื่อกดเปลี่ยนยก Stage
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-slate-300">ขั้นที่ 3 · สาเหตุที่บางแถวค้างเป็น 0</div>
              <p className="text-slate-400 font-thai">
                หาก <strong>จำนวนติดตั้ง = 0 (NOT SET)</strong> หรือสถานะเป็น PAUSED / REMOVED ระบบจะข้ามการบวกช็อตให้ชิ้นส่วนนั้นทันที
              </p>
            </div>
          </div>

          {derived.isZeroInstall && (
            <div className="flex items-start gap-2 pt-2 border-t border-white/10 text-xs text-amber-300 font-thai">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ชิ้นส่วนนี้มีจำนวนติดตั้งเป็น 0 (NOT SET) ระบบจึงหยุดการสะสมยอดผลิตปัจจุบันไว้ที่ค่าเดิม
              </span>
            </div>
          )}
        </section>

        {/* Column 03: Progress % */}
        <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-white">
              03. ความคืบหน้า % (Progress Percentage)
            </h4>
            <span className="text-xs font-mono tabular-nums text-cyan-300">
              ผลลัพธ์: {derived.isStdMissing ? '-' : `${derived.usagePercent}%`}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="space-y-1.5 flex-1">
              <div className="font-semibold text-slate-300">สูตรและขั้นตอนการคิด</div>
              <div className="font-mono text-slate-200 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 tabular-nums flex flex-wrap items-center gap-2">
                <span>min(100, round((ยอดผลิตปัจจุบัน ÷ มาตรฐานอายุ) × 100))</span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 hidden lg:block shrink-0" />

            <div className="space-y-1.5 flex-1">
              <div className="font-semibold text-slate-300">แทนค่าจากตัวเลขปัจจุบัน</div>
              <div className="font-mono text-slate-200 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 tabular-nums">
                {derived.isStdMissing ? (
                  <span className="text-slate-500">ไม่สามารถคำนวณได้ (ยังไม่ตั้งมาตรฐานอายุ)</span>
                ) : (
                  <>
                    ({formatShots(eff.usedShot)} ÷ {formatShots(eff.lifeLimit)}) × 100 ={' '}
                    <span className="text-slate-300">{derived.rawPercent.toFixed(2)}%</span>{' '}
                    → ปัดเศษ = <span className="text-cyan-300 font-bold">{derived.usagePercent}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Column 04: Life Time (Days) — Highlighted Step-by-Step Formula */}
        <section className="liquid-glass-card border border-cyan-500/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-cyan-300">
              04. อายุงาน (วัน) — วันคงเหลือก่อนครบอายุมาตรฐาน (Days Remaining Forecast)
            </h4>
            <span className="text-xs font-mono tabular-nums text-cyan-300 font-bold">
              ผลลัพธ์: {derived.daysDisplayText}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-black/35 border border-white/10 rounded-xl p-3.5 space-y-1.5">
              <div className="font-semibold text-slate-200">ขั้นที่ 1 · หาจำนวนช็อตคงเหลือ</div>
              <div className="font-mono text-[11px] text-slate-400">
                remainingShot = max(0, มาตรฐานอายุ - ยอดผลิตปัจจุบัน)
              </div>
              <div className="font-mono text-sm text-white font-bold tabular-nums pt-1">
                {derived.isStdMissing
                  ? '-'
                  : `${formatShots(eff.lifeLimit)} - ${formatShots(eff.usedShot)} = ${formatShots(derived.remainingShot)} ช็อต`}
              </div>
            </div>

            <div className="bg-black/35 border border-white/10 rounded-xl p-3.5 space-y-1.5">
              <div className="font-semibold text-slate-200">ขั้นที่ 2 · ดึงตัวหารรายวันของไลน์</div>
              <div className="font-mono text-[11px] text-slate-400">
                dailyShotRate = ยอดผลิตวันนี้ (dailyShot)
              </div>
              <div className="font-mono text-sm text-cyan-300 font-bold tabular-nums pt-1">
                {formatShots(eff.dailyShot)} ช็อต / วัน
              </div>
              <p className="text-[11px] text-slate-400 font-thai">
                ระบบใช้ยอดผลิตสะสมของวันนี้เป็นความเร็วการผลิตรายวันโดยตรง
              </p>
            </div>

            <div className="bg-black/35 border border-white/10 rounded-xl p-3.5 space-y-1.5">
              <div className="font-semibold text-slate-200">ขั้นที่ 3 · หารแล้วปัดขึ้นเป็นวันเต็ม</div>
              <div className="font-mono text-[11px] text-slate-400">
                days = ceil(remainingShot ÷ dailyShotRate)
              </div>
              <div className="font-mono text-sm text-emerald-300 font-bold tabular-nums pt-1">
                {derived.isStdMissing ? (
                  'STANDARD NOT SET'
                ) : eff.dailyShot > 0 && derived.remainingShot > 0 ? (
                  <>
                    {formatShots(derived.remainingShot)} ÷ {formatShots(eff.dailyShot)} ={' '}
                    {derived.rawDays.toFixed(2)} → <span className="text-white">{formatShots(derived.daysRemaining)} วัน</span>
                  </>
                ) : derived.remainingShot === 0 ? (
                  '0 (OVER LIFE)'
                ) : (
                  '0 (dailyShot = 0)'
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-300 font-thai pt-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>ข้อควรสังเกต:</strong> ช่วงเริ่มต้นวันหรือเพิ่งเปิดเครื่องที่ <span className="font-mono">ยอดผลิตวันนี้ (dailyShot)</span> ยังน้อย จำนวนวันคงเหลือจะคำนวณได้สูงและค่อยๆ ลดลงสมดุลขึ้นเมื่อยอดผลิตวันนี้เพิ่มขึ้น และหาก <span className="font-mono">dailyShot = 0</span> ค่าที่ได้จะเป็น 0 ชั่วคราวจนกว่าเครื่องจะเริ่มเดิน
            </span>
          </div>
        </section>

        {/* Column 05 & 06 Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Column 05: Install Qty */}
          <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
              <h4 className="text-sm sm:text-base font-bold text-white">
                05. จำนวนติดตั้ง (Install Qty)
              </h4>
              <span className="text-xs font-mono tabular-nums text-white">
                ผลลัพธ์: {derived.isZeroInstall ? '0 (NOT SET)' : `${formatShots(eff.installQty)} EA`}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-400 font-thai leading-relaxed">
              <p>
                <strong>ขั้นที่ 1:</strong> อ่านค่าจากตารางตั้งค่า <strong>จำนวนติดตั้งอะไหล่</strong> ของไลน์ {selectedLineId} ตามรหัสชิ้นส่วน (<span className="font-mono text-slate-300">installedPartQuantities</span>)
              </p>
              <p>
                <strong>ขั้นที่ 2:</strong> หากไม่ได้กำหนดใน Matrix จะถอยไปใช้ค่าตั้งต้นของชิ้นส่วน หรือจำนวนเปลี่ยนยกชุดในข้อมูลสต็อก
              </p>
              <p>
                <strong>ขั้นที่ 3:</strong> หากค่าเป็น <strong>0</strong> จะแสดง <span className="font-mono text-amber-400">0 (NOT SET)</span> และหยุดการบวกช็อตให้ชิ้นส่วนนั้น
              </p>
            </div>
          </section>

          {/* Column 06: Stock Qty */}
          <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
              <h4 className="text-sm sm:text-base font-bold text-white">
                06. สต็อกอะไหล่ (Line & Total Stock Qty)
              </h4>
              <span className="text-xs font-mono tabular-nums text-white">
                ผลลัพธ์: {formatShots(eff.lineStockQty)} (รวม: {formatShots(eff.totalStockQty)})
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-400 font-thai leading-relaxed">
              <p>
                <strong>ตัวเลขหลักด้านบน ({formatShots(eff.lineStockQty)}):</strong> ดึงตรงจากตาราง <strong>4. จำนวนสต็อกอะไหล่ (Stock Matrix)</strong> เฉพาะคอลัมน์ของไลน์ {selectedLineId} (<span className="font-mono text-slate-300">stockQuantities</span>)
              </p>
              <p>
                <strong>ตัวเลขในวงเล็บ (รวม: {formatShots(eff.totalStockQty)}):</strong> ดึงจากคลังกลาง (<span className="font-mono text-slate-300">available = onHand - reserved - quarantine</span>) เพื่อแสดงยอดรวมทุกไลน์เมื่อไม่เท่ากับยอดรายไลน์
              </p>
              <p>
                <strong>การตัดอัตโนมัติ:</strong> เมื่อบันทึก <em>เปลี่ยนอะไหล่ใหม่</em> หรือ <em>แจ้งชำรุด</em> ในผัง 2D ยอดสต็อกรายไลน์และยอดรวมจะถูกหักออกให้ทันที
              </p>
            </div>
          </section>
        </div>

        {/* Column 07: Order Require / Status Orb */}
        <section className="liquid-glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-sm sm:text-base font-bold text-white">
              07. สถานะแจ้งเตือน (Alert & Order Indicator)
            </h4>
            <span className="text-xs font-sans font-semibold text-cyan-300">
              ผลลัพธ์ปัจจุบัน: {derived.signalLabel}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 pr-4 font-medium">ลำดับตรวจเช็ก</th>
                  <th className="py-2 pr-4 font-medium">เงื่อนไข</th>
                  <th className="py-2 pr-4 font-medium">เกณฑ์อ้างอิงปัจจุบัน</th>
                  <th className="py-2 font-medium">สัญญาณที่แสดง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono">
                <tr className={derived.lifeStatus === 'OVER_LIFE' || derived.lifeStatus === 'CRITICAL' ? 'bg-rose-950/30 text-rose-200' : 'text-slate-300'}>
                  <td className="py-2 pr-4">1</td>
                  <td className="py-2 pr-4 font-sans">วิกฤต / เกินอายุ</td>
                  <td className="py-2 pr-4 tabular-nums">ความคืบหน้า &gt;= {derived.criticalTh}% (หรือ &gt;= 100%)</td>
                  <td className="py-2 font-sans font-semibold text-rose-400">วงกลมสีแดง (CRITICAL / OVER LIFE)</td>
                </tr>
                <tr className={derived.lifeStatus === 'PREPARE' ? 'bg-amber-950/30 text-amber-200' : 'text-slate-300'}>
                  <td className="py-2 pr-4">2</td>
                  <td className="py-2 pr-4 font-sans">เตรียมเปลี่ยนอะไหล่</td>
                  <td className="py-2 pr-4 tabular-nums">ความคืบหน้า {derived.prepareTh}% – {derived.criticalTh - 1}%</td>
                  <td className="py-2 font-sans font-semibold text-amber-400">วงกลมสีส้มอำพัน (PREPARE)</td>
                </tr>
                <tr className={derived.lifeStatus === 'WARNING' ? 'bg-yellow-950/30 text-yellow-200' : 'text-slate-300'}>
                  <td className="py-2 pr-4">3</td>
                  <td className="py-2 pr-4 font-sans">เฝ้าระวัง</td>
                  <td className="py-2 pr-4 tabular-nums">ความคืบหน้า {derived.warningTh}% – {derived.prepareTh - 1}%</td>
                  <td className="py-2 font-sans font-semibold text-yellow-300">วงกลมสีเหลือง (WARNING)</td>
                </tr>
                <tr className={derived.signalTone === 'orange' ? 'bg-orange-950/30 text-orange-200' : 'text-slate-300'}>
                  <td className="py-2 pr-4">4</td>
                  <td className="py-2 pr-4 font-sans">สต็อกหมด / รอสั่งซื้อ</td>
                  <td className="py-2 pr-4 font-sans">สต็อกเฉพาะไลน์ = 0 หรือ LOW / OUT OF STOCK</td>
                  <td className="py-2 font-sans font-semibold text-orange-400">วงกลมสีส้ม (ORDER REQUIRED)</td>
                </tr>
                <tr className={derived.signalTone === 'none' ? 'bg-emerald-950/20 text-emerald-200' : 'text-slate-300'}>
                  <td className="py-2 pr-4">5</td>
                  <td className="py-2 pr-4 font-sans">ปกติและมีสต็อก</td>
                  <td className="py-2 pr-4 tabular-nums">&lt; {derived.warningTh}% และ สต็อกเฉพาะไลน์ &gt; 0</td>
                  <td className="py-2 font-sans font-semibold text-emerald-400">ปกติ (ไม่แสดงจุดเตือน)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
