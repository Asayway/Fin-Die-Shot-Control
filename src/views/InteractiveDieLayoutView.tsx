import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { DateRangeFilter, isDateInSelectedRange } from '../components/common/DateRangeFilter';
import {
  Grid as GridIcon,
  Wrench,
  RotateCcw,
  Lock,
  Unlock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Sliders,
  Layers,
  CircleDot,
  Clock,
  UserCheck,
  FileSpreadsheet,
  X,
  Plus,
  Info,
  Sparkles,
  ShieldAlert,
  Calendar,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react';
import {
  ProductionLineId,
  PositionLockRecord,
  PositionLockStatus,
  ReplacementRecord,
  RegrindingRecord,
  User
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';
import { LineFilterSelector } from '../components/common/LineFilterSelector';

// Pin status definition
export type PinStatus = 'normal' | 'warning' | 'broken' | 'locked' | 'bypass';

export interface DiePinItem {
  id: string; // e.g. E1-S1-P-03
  pinCode: string; // e.g. P-03
  stageId: string; // s1, s2, s3, s4
  stageName: string; // Stage 1: Piercing / Burring
  partCode: string; // e.g. P-PIERCE-01
  partName: string; // e.g. Pierce Punch
  material: string; // e.g. SKH-51 / Carbide
  tubeSize: string; // e.g. Ø7
  drawingNo: string; // DWG-FD-07-001
  row: number; // 1, 2, 3
  col: number; // 1 to 60
  status: PinStatus;
  isLocked: boolean;
  lockType?: PositionLockStatus;
  currentShots: number;
  maxShots: number;
  lastReplacementShot: number;
  lastReplacementDate?: string;
  regrindCount: number;
  maxRegrind: number;
  totalGrindDepthMm: number;
  shimThicknessMm: number;
  lastAction?: string;
  lastTechnician?: string;
  historyLogs: PinHistoryEntry[];
}

export interface PinHistoryEntry {
  id: string;
  dateTime: string;
  lineId: ProductionLineId;
  stageId: string;
  stageName: string;
  pinCode: string;
  partName: string;
  actionType: 'REPLACE_NEW' | 'REGRIND' | 'BROKEN' | 'LOCK' | 'UNLOCK';
  actionLabelTh: string;
  machineShot: number;
  pinShot: number;
  technician: string;
  regrindDepthMm?: number;
  shimThicknessMm?: number;
  remarks: string;
}

interface StageConfig {
  id: string;
  name: string;
  partName: string;
  partCode: string;
  material: string;
  drawingNo: string;
  cols: number;
  rows: number;
  maxShots: number;
  maxRegrind: number;
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    id: 's1',
    name: 'Stage 1: Piercing / Burring',
    partName: 'Pierce Punch / Burring Punch',
    partCode: 'P-BURR-01',
    material: 'SKH-51 (Powder HSS)',
    drawingNo: 'DWG-FD-07-001',
    cols: 60,
    rows: 3,
    maxShots: 100000000,
    maxRegrind: 4
  },
  {
    id: 's2',
    name: 'Stage 2: Louver / Ironing',
    partName: 'Louver Blade / Ironing Punch',
    partCode: 'P-LOUV-01',
    material: 'Carbide V30 / DC53',
    drawingNo: 'DWG-FD-07-002',
    cols: 56,
    rows: 3,
    maxShots: 80000000,
    maxRegrind: 4
  },
  {
    id: 's3',
    name: 'Stage 3: Slit / Reflaire',
    partName: 'Row Slit Blade / Reflaire Punch',
    partCode: 'P-SLIT-01',
    material: 'SKH-51 (TiCN Coated)',
    drawingNo: 'DWG-FD-07-003',
    cols: 60,
    rows: 3,
    maxShots: 90000000,
    maxRegrind: 4
  },
  {
    id: 's4',
    name: 'Stage 4: Cut Off / Corner Cut',
    partName: 'Cut Off Blade / Corner Cut Punch',
    partCode: 'P-CUT-01',
    material: 'SKD11 / DC53',
    drawingNo: 'DWG-FD-07-004',
    cols: 20,
    rows: 2,
    maxShots: 50000000,
    maxRegrind: 6
  }
];

const COMMON_REASONS = [
  'Normal PM Life Cycle Limit Reached (หมดอายุการใช้งานตามรอบ)',
  'Punch Tip Chipped / Broken (ปลายพันช์บิ่น/แตกหัก)',
  'Louver Blade Edge Dull (คมตัดใบมีดทื่อ - ตัดครีบไม่ขาด)',
  'Die Clearance Out of Spec (ระยะเคลียแรนซ์แม่พิมพ์หลวมเกินเกณฑ์)',
  'Periodic Regrinding Scheduled (ส่งเจียระไนลับคมตามรอบช็อต)',
  'Slot Isolated with Bypass Dummy Pin (สวมพินหลอก/บายพาส)',
  'Coating Worn Out / Scoring Mark (ผิวเคลือบสึก/เกิดรอยครูด)'
];

const LOCAL_STORAGE_PINS_KEY = 'FIN_DIE_INTERACTIVE_PINS_V2_';

interface InteractiveDieLayoutViewProps {
  initialLineId?: ProductionLineId;
  showLineSelector?: boolean;
}

export const InteractiveDieLayoutView: React.FC<InteractiveDieLayoutViewProps> = ({
  initialLineId = 'E6',
  showLineSelector = true
}) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);

  useEffect(() => {
    if (initialLineId) {
      setSelectedLineId(initialLineId);
    }
  }, [initialLineId]);
  const [pins, setPins] = useState<DiePinItem[]>([]);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [selectedPin, setSelectedPin] = useState<DiePinItem | null>(null);
  const [actionType, setActionType] = useState<'REPLACE_NEW' | 'REGRIND' | 'BROKEN' | 'LOCK'>('REPLACE_NEW');
  const [technicianName, setTechnicianName] = useState<string>('');
  const [actionDateTime, setActionDateTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [remarks, setRemarks] = useState<string>('');
  const [regrindDepthMm, setRegrindDepthMm] = useState<number>(0.25);
  const [shimThicknessMm, setShimThicknessMm] = useState<number>(0.20);
  const [lockStatusOption, setLockStatusOption] = useState<PositionLockStatus>('LOCKED_MAINTENANCE');
  
  // History table filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStageFilter, setHistoryStageFilter] = useState<string>('ALL');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  
  // Toast notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const currentUser: User = storageService.getCurrentUser();

  // Load pins for current line
  const loadLinePins = () => {
    const rawSaved = localStorage.getItem(`${LOCAL_STORAGE_PINS_KEY}${selectedLineId}`);
    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const machineShot = lineMonitoring?.machineShotTotal || 128450190;
    const locks = storageService.getPositionLocks(selectedLineId);

    if (rawSaved) {
      try {
        const parsed: DiePinItem[] = JSON.parse(rawSaved);
        // Sync lock status with storageService locks
        const synced = parsed.map(pin => {
          const matchedLock = locks && Array.isArray(locks) ? locks.find(l => 
            l && l.positionId === pin.pinCode && 
            l.stageCode && typeof l.stageCode === 'string' &&
            l.stageCode.toLowerCase().includes(pin.stageId.toLowerCase())
          ) : undefined;
          if (matchedLock && matchedLock.isLocked) {
            return {
              ...pin,
              isLocked: true,
              lockType: matchedLock.lockType,
              status: matchedLock.lockType === 'LOCKED_BYPASS' ? ('bypass' as PinStatus) : ('locked' as PinStatus)
            };
          }
          return pin;
        });
        setPins(synced);
        return;
      } catch (e) {
        console.error('Error loading saved pins, generating fresh seed:', e);
      }
    }

    // Generate initial pins for line
    const generatedPins: DiePinItem[] = [];
    const tubeSize = (selectedLineId === 'E2' || selectedLineId === 'E4' || selectedLineId === 'E5') ? 'Ø5' : 'Ø7';

    STAGE_CONFIGS.forEach(stage => {
      const totalPins = stage.cols * stage.rows;
      for (let i = 1; i <= totalPins; i++) {
        const col = ((i - 1) % stage.cols) + 1;
        const row = Math.floor((i - 1) / stage.cols) + 1;
        const pinCode = `P-${String(i).padStart(2, '0')}`;
        const pinId = `${selectedLineId}-${stage.id}-${pinCode}`;

        // Seed realistic shot & condition
        const rand = (Math.sin(i * 99 + stage.cols) + 1) / 2;
        let status: PinStatus = 'normal';
        let isLocked = false;
        let lockType: PositionLockStatus | undefined = undefined;

        // Current pin running shot (0 to max)
        let pinShots = Math.floor(rand * stage.maxShots * 0.7);
        const lastReplacementShot = Math.max(0, machineShot - pinShots);
        let regrindCount = Math.floor(rand * 3);

        // Seed some warning / locked / broken for realistic visualization
        if (i === 4 && stage.id === 's1') {
          status = 'broken';
          isLocked = true;
          lockType = 'LOCKED_MAINTENANCE';
        } else if (i === 12 && stage.id === 's1') {
          status = 'locked';
          isLocked = true;
          lockType = 'LOCKED_TRIAL';
        } else if (i === 18 && stage.id === 's2') {
          status = 'bypass';
          isLocked = true;
          lockType = 'LOCKED_BYPASS';
        } else if (i % 23 === 0) {
          status = 'warning';
          pinShots = Math.floor(stage.maxShots * 0.92);
        } else if (regrindCount >= stage.maxRegrind) {
          status = 'warning';
        }

        generatedPins.push({
          id: pinId,
          pinCode,
          stageId: stage.id,
          stageName: stage.name,
          partCode: stage.partCode,
          partName: stage.partName,
          material: stage.material,
          tubeSize,
          drawingNo: stage.drawingNo,
          row,
          col,
          status,
          isLocked,
          lockType,
          currentShots: pinShots,
          maxShots: stage.maxShots,
          lastReplacementShot,
          lastReplacementDate: '2026-08-15 08:30',
          regrindCount,
          maxRegrind: stage.maxRegrind,
          totalGrindDepthMm: Number((regrindCount * 0.25).toFixed(2)),
          shimThicknessMm: Number((regrindCount * 0.20).toFixed(2)),
          lastAction: status === 'broken' ? 'Reported Broken' : (regrindCount > 0 ? 'Reground #2' : 'New Install'),
          lastTechnician: 'Somchai M. (Lead Tech)',
          historyLogs: [
            {
              id: `LOG-INIT-${pinId}`,
              dateTime: '2026-08-15 08:30',
              lineId: selectedLineId,
              stageId: stage.id,
              stageName: stage.name,
              pinCode,
              partName: stage.partName,
              actionType: 'REPLACE_NEW',
              actionLabelTh: 'เปลี่ยนอะไหล่ใหม่ (Set Install)',
              machineShot: lastReplacementShot,
              pinShot: 0,
              technician: 'Somchai M. (Lead Tech)',
              remarks: 'Initial scheduled assembly and alignment'
            }
          ]
        });
      }
    });

    setPins(generatedPins);
    localStorage.setItem(`${LOCAL_STORAGE_PINS_KEY}${selectedLineId}`, JSON.stringify(generatedPins));
  };

  useEffect(() => {
    loadLinePins();
    const unsub = storageService.subscribe(loadLinePins);
    return () => unsub();
  }, [selectedLineId]);

  // Set technician name when opening modal
  useEffect(() => {
    if (currentUser?.name) {
      setTechnicianName(currentUser.name);
    }
  }, [currentUser]);

  // Save pins helper
  const persistPins = (updated: DiePinItem[]) => {
    setPins(updated);
    localStorage.setItem(`${LOCAL_STORAGE_PINS_KEY}${selectedLineId}`, JSON.stringify(updated));
  };

  // KPIs
  const stats = useMemo(() => {
    const total = pins.length;
    const normal = pins.filter(p => p.status === 'normal').length;
    const warning = pins.filter(p => p.status === 'warning').length;
    const broken = pins.filter(p => p.status === 'broken').length;
    const locked = pins.filter(p => p.status === 'locked').length;
    const bypass = pins.filter(p => p.status === 'bypass').length;
    return { total, normal, warning, broken, locked, bypass };
  }, [pins]);

  // Filtered Pins for display
  const filteredPins = useMemo(() => {
    return pins.filter(pin => {
      const matchStage = selectedStageFilter === 'ALL' || pin.stageId === selectedStageFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || pin.status === selectedStatusFilter;
      const matchSearch =
        !searchQuery ||
        pin.pinCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.stageName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStage && matchStatus && matchSearch;
    });
  }, [pins, selectedStageFilter, selectedStatusFilter, searchQuery]);

  // Master History Logs aggregated from all pins of current line
  const masterHistoryLogs = useMemo(() => {
    const allLogs: PinHistoryEntry[] = [];
    pins.forEach(pin => {
      if (pin.historyLogs && pin.historyLogs.length > 0) {
        allLogs.push(...pin.historyLogs);
      }
    });

    // Sort descending by date
    allLogs.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    return allLogs.filter(log => {
      const matchStage = historyStageFilter === 'ALL' || log.stageId === historyStageFilter;
      const matchAction = historyActionFilter === 'ALL' || log.actionType === historyActionFilter;
      const matchDate = isDateInSelectedRange(log.dateTime, historyStartDate, historyEndDate);
      const matchSearch =
        !historySearch ||
        log.pinCode.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.partName.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.technician.toLowerCase().includes(historySearch.toLowerCase()) ||
        log.remarks.toLowerCase().includes(historySearch.toLowerCase());
      return matchStage && matchAction && matchDate && matchSearch;
    });
  }, [pins, historyStageFilter, historyActionFilter, historySearch, historyStartDate, historyEndDate]);

  // Handle Pin Click -> Open Modal
  const handlePinClick = (pin: DiePinItem) => {
    setSelectedPin(pin);
    setActionType('REPLACE_NEW');
    setRemarks(COMMON_REASONS[0]);
    setActionDateTime(new Date().toISOString().slice(0, 16));
    setRegrindDepthMm(0.25);
    setShimThicknessMm(0.20);
    setLockStatusOption(pin.lockType || 'LOCKED_MAINTENANCE');
  };

  // Toggle Lock switch directly in modal
  const handleToggleLockSwitch = () => {
    if (!selectedPin) return;
    const nextIsLocked = !selectedPin.isLocked;
    const nextStatus: PinStatus = nextIsLocked ? 'locked' : (selectedPin.currentShots >= selectedPin.maxShots * 0.9 ? 'warning' : 'normal');

    const logEntry: PinHistoryEntry = {
      id: `LOG-${Date.now()}`,
      dateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      lineId: selectedLineId,
      stageId: selectedPin.stageId,
      stageName: selectedPin.stageName,
      pinCode: selectedPin.pinCode,
      partName: selectedPin.partName,
      actionType: nextIsLocked ? 'LOCK' : 'UNLOCK',
      actionLabelTh: nextIsLocked ? 'ล็อคตำแหน่ง (Lock Position)' : 'ปลดล็อคใช้งาน (Unlock Active)',
      machineShot: selectedPin.lastReplacementShot + selectedPin.currentShots,
      pinShot: selectedPin.currentShots,
      technician: technicianName || currentUser.name,
      remarks: nextIsLocked ? 'Quick lock switch engaged' : 'Unlocked and restored to active production'
    };

    const updatedPin: DiePinItem = {
      ...selectedPin,
      isLocked: nextIsLocked,
      status: nextStatus,
      lockType: nextIsLocked ? 'LOCKED_MAINTENANCE' : undefined,
      lastAction: nextIsLocked ? 'LOCKED' : 'UNLOCKED',
      lastTechnician: technicianName || currentUser.name,
      historyLogs: [logEntry, ...(selectedPin.historyLogs || [])].slice(0, 10)
    };

    const nextPins = pins.map(p => (p.id === selectedPin.id ? updatedPin : p));
    persistPins(nextPins);
    setSelectedPin(updatedPin);

    setFeedback({
      type: 'info',
      message: `${selectedPin.pinCode} is now ${nextIsLocked ? 'LOCKED (หยุดนับช็อต)' : 'UNLOCKED (เปิดใช้งาน)'}`
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Execute Action from Modal Form
  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPin) return;

    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const currentMachineShot = lineMonitoring?.machineShotTotal || 128450190;

    let nextStatus: PinStatus = 'normal';
    let nextShots = selectedPin.currentShots;
    let nextLastReplacementShot = selectedPin.lastReplacementShot;
    let nextRegrindCount = selectedPin.regrindCount;
    let nextGrindDepth = selectedPin.totalGrindDepthMm;
    let nextShim = selectedPin.shimThicknessMm;
    let nextIsLocked = selectedPin.isLocked;
    let nextLockType = selectedPin.lockType;
    let actionLabelTh = '';

    if (actionType === 'REPLACE_NEW') {
      nextStatus = 'normal';
      nextShots = 0;
      nextLastReplacementShot = currentMachineShot;
      nextRegrindCount = 0;
      nextGrindDepth = 0;
      nextShim = 0;
      nextIsLocked = false;
      nextLockType = undefined;
      actionLabelTh = 'เปลี่ยนอะไหล่ใหม่ (Replace New)';

      // Record to storageService replacement history
      storageService.recordReplacement({
        lineId: selectedLineId,
        partCode: selectedPin.partCode,
        stageName: selectedPin.stageName,
        position: selectedPin.pinCode,
        replacementType: 'PARTIAL REPLACEMENT',
        fullSetOrPartial: 'PARTIAL',
        installedQuantity: 1,
        changedQuantity: 1,
        machineShotAtReplacement: currentMachineShot,
        removedPartUsedShot: selectedPin.currentShots,
        removedPartRegrindCount: selectedPin.regrindCount,
        changedBy: technicianName || currentUser.name,
        replacementReason: remarks || 'Partial replacement via 2D Die Layout',
        note: remarks
      });
    } else if (actionType === 'REGRIND') {
      nextRegrindCount = Math.min(selectedPin.regrindCount + 1, selectedPin.maxRegrind);
      nextGrindDepth = Number((nextGrindDepth + regrindDepthMm).toFixed(2));
      nextShim = Number((nextShim + shimThicknessMm).toFixed(2));
      nextShots = 0; // Reset shots for reground cycle
      nextStatus = nextRegrindCount >= selectedPin.maxRegrind ? 'warning' : 'normal';
      nextIsLocked = false;
      nextLockType = undefined;
      actionLabelTh = `ถอดเจียรลับคมครั้งที่ ${nextRegrindCount} (-${regrindDepthMm}mm / +Shim ${shimThicknessMm}mm)`;

      // Save regrind in storageService
      try {
        storageService.recordRegrind({
          lineId: selectedLineId,
          partCode: selectedPin.partCode,
          partName: selectedPin.partName,
          stageName: selectedPin.stageName,
          position: selectedPin.pinCode,
          grindThickness: regrindDepthMm,
          shimThicknessAdded: shimThicknessMm,
          technicianName: technicianName || currentUser.name,
          reason: remarks || 'Periodic regrinding via 2D Die Layout',
          note: remarks
        } as any);
      } catch (err) {
        console.warn('Auto-logging regrind record:', err);
      }
    } else if (actionType === 'BROKEN') {
      nextStatus = 'broken';
      nextIsLocked = true;
      nextLockType = 'LOCKED_MAINTENANCE';
      actionLabelTh = 'แจ้งชำรุด/แตกหัก (Broken Alert & Lock)';
    } else if (actionType === 'LOCK') {
      nextIsLocked = true;
      nextLockType = lockStatusOption;
      nextStatus = lockStatusOption === 'LOCKED_BYPASS' ? 'bypass' : 'locked';
      actionLabelTh = `ปิดใช้งาน/ล็อค (${lockStatusOption})`;
    }

    const historyEntry: PinHistoryEntry = {
      id: `LOG-${Date.now()}`,
      dateTime: actionDateTime.replace('T', ' '),
      lineId: selectedLineId,
      stageId: selectedPin.stageId,
      stageName: selectedPin.stageName,
      pinCode: selectedPin.pinCode,
      partName: selectedPin.partName,
      actionType,
      actionLabelTh,
      machineShot: currentMachineShot,
      pinShot: nextShots,
      technician: technicianName || currentUser.name,
      regrindDepthMm: actionType === 'REGRIND' ? regrindDepthMm : undefined,
      shimThicknessMm: actionType === 'REGRIND' ? shimThicknessMm : undefined,
      remarks: remarks || '-'
    };

    const updatedPin: DiePinItem = {
      ...selectedPin,
      status: nextStatus,
      currentShots: nextShots,
      lastReplacementShot: nextLastReplacementShot,
      lastReplacementDate: actionDateTime.replace('T', ' '),
      regrindCount: nextRegrindCount,
      totalGrindDepthMm: nextGrindDepth,
      shimThicknessMm: nextShim,
      isLocked: nextIsLocked,
      lockType: nextLockType,
      lastAction: actionLabelTh,
      lastTechnician: technicianName || currentUser.name,
      historyLogs: [historyEntry, ...(selectedPin.historyLogs || [])].slice(0, 10)
    };

    const nextPins = pins.map(p => (p.id === selectedPin.id ? updatedPin : p));
    persistPins(nextPins);

    setFeedback({
      type: 'success',
      message: `บันทึกรายการ ${actionLabelTh} สำหรับตำแหน่ง ${selectedPin.pinCode} (${selectedPin.stageName}) สำเร็จ!`
    });
    setTimeout(() => setFeedback(null), 3500);

    setSelectedPin(null);
  };

  // Export Master History to Excel (.xlsx)
  const handleExportCSV = () => {
    const data = masterHistoryLogs.map(log => ({
      'Date & Time': log.dateTime,
      'Line': `Line ${log.lineId}`,
      'Stage': log.stageName,
      'Position Code': log.pinCode,
      'Tooling Part': log.partName,
      'Action Taken': log.actionLabelTh || log.actionType,
      'Machine Shot at Event': log.machineShot,
      'Pin Accumulated Shot': log.pinShot,
      'Technician': log.technician,
      'Grind Depth (mm)': log.regrindDepthMm ?? '',
      'Shim Thickness (mm)': log.shimThicknessMm ?? '',
      'Remarks': log.remarks || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance Log');
    
    // Auto column width
    const colWidths = [
      { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
      { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `FinDie_Layout_Maintenance_Log_${selectedLineId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans text-slate-100 pb-16">
      {/* ======================================================== */}
      {/* 1. TOP BAR: LINE SELECTOR + SUMMARY KPIS + FILTERS */}
      {/* ======================================================== */}
      <div className="sticky top-[-1rem] lg:top-[-1.5rem] z-30 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-2xl space-y-3.5 border bg-[#0E172A]/95 border-slate-800/90">
        {/* Row 1: Line Selector & Title (Rendered if showLineSelector is true) */}
        {showLineSelector && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/90 border border-cyan-500/80 flex items-center justify-center shadow-md">
                <GridIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight uppercase">
                    PART REPLACEMENT & 2D DIE LAYOUT
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono">
                    LIVE INTERACTIVE MATRIX
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-thai">
                  แผนผังแม่พิมพ์ 2 มิติและบันทึกการเปลี่ยนอะไหล่/ซ่อมบำรุงรายตำแหน่งแบบ Real-time
                </p>
              </div>
            </div>

            {/* Line Selection Pills */}
            <div className="flex items-center gap-2">
              <LineFilterSelector
                selectedLine={selectedLineId}
                onSelectLine={(l) => setSelectedLineId(l)}
                label="SELECT LINE:"
              />
            </div>
          </div>
        )}

        {/* Row 2: Summary Counters (KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {/* Total Positions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                TOTAL POSITIONS
              </div>
              <div className="text-lg font-bold text-white font-mono">{stats.total} <span className="text-xs font-normal text-slate-400">PINS</span></div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {/* Active / Normal 🟢 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'normal' ? 'ALL' : 'normal')}
            className={`cursor-pointer transition-all border rounded-lg p-2.5 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'normal' 
                ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-500/50' 
                : 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE (ปกติ)
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono">{stats.normal}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Warning / Regrind Limit 🟡 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'warning' ? 'ALL' : 'warning')}
            className={`cursor-pointer transition-all border rounded-lg p-2.5 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'warning' 
                ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-500/50' 
                : 'bg-amber-950/40 border-amber-800/60 hover:bg-amber-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                WARNING / REGRIND
              </div>
              <div className="text-lg font-bold text-amber-300 font-mono">{stats.warning}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-900/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Broken / Damaged 🔴 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'broken' ? 'ALL' : 'broken')}
            className={`cursor-pointer transition-all border rounded-lg p-2.5 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'broken' 
                ? 'bg-rose-950 border-rose-400 ring-2 ring-rose-500/50' 
                : 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                BROKEN (ชำรุด)
              </div>
              <div className="text-lg font-bold text-rose-300 font-mono">{stats.broken}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-900/60 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>

          {/* Locked / Inactive 🔒 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'locked' ? 'ALL' : 'locked')}
            className={`cursor-pointer transition-all border rounded-lg p-2.5 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'locked' 
                ? 'bg-purple-950 border-purple-400 ring-2 ring-purple-500/50' 
                : 'bg-purple-950/40 border-purple-800/60 hover:bg-purple-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-400" />
                LOCKED (ล็อค)
              </div>
              <div className="text-lg font-bold text-purple-300 font-mono">{stats.locked}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-900/60 flex items-center justify-center text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* Bypass / Dummy 🟧 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'bypass' ? 'ALL' : 'bypass')}
            className={`cursor-pointer transition-all border rounded-lg p-2.5 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'bypass' 
                ? 'bg-orange-950 border-orange-400 ring-2 ring-orange-500/50' 
                : 'bg-orange-950/40 border-orange-800/60 hover:bg-orange-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                BYPASS (สวมหลอก)
              </div>
              <div className="text-lg font-bold text-orange-300 font-mono">{stats.bypass}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-900/60 flex items-center justify-center text-orange-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Row 3: Stage Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Stage Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
            <button
              onClick={() => setSelectedStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStageFilter === 'ALL'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              ALL STAGES
            </button>
            <button
              onClick={() => setSelectedStageFilter('s1')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStageFilter === 's1'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Stage 1: Piercing / Burring
            </button>
            <button
              onClick={() => setSelectedStageFilter('s2')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStageFilter === 's2'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Stage 2: Louver / Ironing
            </button>
            <button
              onClick={() => setSelectedStageFilter('s3')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStageFilter === 's3'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Stage 3: Slit / Reflaire
            </button>
            <button
              onClick={() => setSelectedStageFilter('s4')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedStageFilter === 's4'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Stage 4: Cut Off / Corner Cut
            </button>
          </div>

          {/* Search Box & Quick Reset */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Pin Code (e.g. P-03, Burring)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-64 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(selectedStageFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStageFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700"
                title="Reset all filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-lg flex items-center justify-between gap-3 text-sm font-bold shadow-lg animate-fadeIn border ${
          feedback.type === 'success'
            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
            : feedback.type === 'error'
            ? 'bg-rose-950 border-rose-600 text-rose-300'
            : 'bg-cyan-950 border-cyan-600 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Info className="w-5 h-5 text-cyan-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE: INTERACTIVE 2D DIE LAYOUT */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {STAGE_CONFIGS.filter(s => selectedStageFilter === 'ALL' || s.id === selectedStageFilter).map(stage => {
          const stagePins = filteredPins.filter(p => p.stageId === stage.id);
          const allStagePins = pins.filter(p => p.stageId === stage.id);
          const stageWarningCount = allStagePins.filter(p => p.status === 'warning').length;
          const stageBrokenCount = allStagePins.filter(p => p.status === 'broken' || p.status === 'locked').length;

          return (
            <div
              key={stage.id}
              className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4"
            >
              {/* Stage Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-600/70 flex items-center justify-center">
                    <CircleDot className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-cyan-300 font-mono tracking-wide uppercase flex items-center gap-2">
                      <span>{stage.name}</span>
                      <span className="text-xs font-normal text-slate-400">({stage.cols} Cols × {stage.rows} Rows = {stage.cols * stage.rows} Pins)</span>
                    </h2>
                    <div className="text-xs text-slate-400 flex items-center gap-3 font-mono mt-0.5">
                      <span>Material: <strong className="text-slate-200">{stage.material}</strong></span>
                      <span>•</span>
                      <span>Drawing: <strong className="text-slate-200">{stage.drawingNo}</strong></span>
                      <span>•</span>
                      <span>Max Life: <strong className="text-slate-200">{formatShots(stage.maxShots)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Stage Health Badges */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  {stageWarningCount > 0 && (
                    <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      {stageWarningCount} Warnings
                    </span>
                  )}
                  {stageBrokenCount > 0 && (
                    <span className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-600 text-rose-300 font-bold flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      {stageBrokenCount} Broken/Locked
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                    Line {selectedLineId}
                  </span>
                </div>
              </div>

              {/* 2D Die Grid Container with Synced Scroll */}
              <div className="overflow-x-auto custom-scrollbar p-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <div className="inline-block min-w-max space-y-2">
                  {/* Column Index Markers (Every 5 cols) */}
                  <div className="flex items-center gap-1 pl-12 text-[10px] font-mono text-slate-500 font-bold select-none">
                    {Array.from({ length: stage.cols }).map((_, cIdx) => {
                      const colNum = cIdx + 1;
                      return (
                        <div
                          key={colNum}
                          className="w-7 text-center"
                        >
                          {colNum % 5 === 0 || colNum === 1 || colNum === stage.cols ? colNum : '·'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Rows Matrix */}
                  {Array.from({ length: stage.rows }).map((_, rIdx) => {
                    const rowNum = rIdx + 1;
                    const rowLabel = rowNum === 1 ? 'ROW A' : rowNum === 2 ? 'ROW B' : 'ROW C';

                    return (
                      <div key={rowNum} className="flex items-center gap-1">
                        {/* Row Identifier */}
                        <div className="w-11 text-right pr-2 text-[11px] font-mono font-bold text-slate-400 select-none whitespace-nowrap">
                          {rowLabel}
                        </div>

                        {/* Row Pins */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: stage.cols }).map((_, cIdx) => {
                            const colNum = cIdx + 1;
                            const pinIndex = (rowNum - 1) * stage.cols + colNum;
                            const pinCode = `P-${String(pinIndex).padStart(2, '0')}`;
                            const pin = allStagePins.find(p => p.pinCode === pinCode && p.row === rowNum && p.col === colNum);

                            if (!pin) {
                              return (
                                <div
                                  key={colNum}
                                  className="w-7 h-7 rounded border border-dashed border-slate-800 bg-slate-950/40"
                                />
                              );
                            }

                            // Determine visual styles
                            let bgStyle = 'bg-emerald-500 text-emerald-950 border-emerald-400 hover:ring-2 hover:ring-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                            let icon = null;

                            if (pin.status === 'warning') {
                              bgStyle = 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse hover:ring-2 hover:ring-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.6)]';
                            } else if (pin.status === 'broken') {
                              bgStyle = 'bg-rose-500 text-white border-rose-300 animate-pulse hover:ring-2 hover:ring-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.7)]';
                              icon = <AlertOctagon className="w-3.5 h-3.5" />;
                            } else if (pin.status === 'locked') {
                              bgStyle = 'bg-purple-900 text-purple-200 border-purple-500 hover:ring-2 hover:ring-purple-300';
                              icon = <Lock className="w-3 h-3" />;
                            } else if (pin.status === 'bypass') {
                              bgStyle = 'bg-orange-600 text-white border-orange-400 hover:ring-2 hover:ring-orange-200';
                              icon = <ShieldAlert className="w-3 h-3" />;
                            }

                            const shotPct = Math.round((pin.currentShots / pin.maxShots) * 100);

                            return (
                              <button
                                key={colNum}
                                type="button"
                                onClick={() => handlePinClick(pin)}
                                title={`${pin.pinCode} | ${pin.stageName}\nStatus: ${pin.status.toUpperCase()}\nShots: ${formatShots(pin.currentShots)} / ${formatShots(pin.maxShots)} (${shotPct}%)\nRegrind: ${pin.regrindCount}/${pin.maxRegrind} cycles\nClick to record replacement/regrind/lock`}
                                className={`w-7 h-7 rounded text-[10px] font-mono font-black border flex items-center justify-center transition-all cursor-pointer relative group ${bgStyle}`}
                              >
                                {icon ? icon : pinIndex}

                                {/* Mini Tooltip on Hover */}
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none">
                                  <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-[11px] shadow-2xl whitespace-nowrap space-y-0.5">
                                    <div className="font-bold text-cyan-300 flex items-center gap-1">
                                      <span>{pin.pinCode}</span>
                                      <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-normal">Pos {pinIndex}</span>
                                    </div>
                                    <div className="text-slate-400 text-[10px]">{pin.stageName}</div>
                                    <div className="text-emerald-400 font-mono">Shots: {formatShots(pin.currentShots)} ({shotPct}%)</div>
                                    <div className="text-amber-300 text-[10px]">Regrind: {pin.regrindCount}/{pin.maxRegrind} cycles</div>
                                    {pin.isLocked && <div className="text-rose-400 font-bold text-[10px]">LOCKED: {pin.lockType}</div>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. SMART ACTION & HISTORY MODAL (ON PIN CLICK) */}
      {/* ======================================================== */}
      {selectedPin && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-[#0D1527] border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header & Quick Lock Switch */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-lg ${
                  selectedPin.status === 'broken'
                    ? 'bg-rose-950 text-rose-300 border-rose-500'
                    : selectedPin.status === 'warning'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : selectedPin.status === 'locked'
                    ? 'bg-purple-950 text-purple-300 border-purple-500'
                    : selectedPin.status === 'bypass'
                    ? 'bg-orange-950 text-orange-300 border-orange-500'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                }`}>
                  {selectedPin.pinCode}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{selectedPin.partName} ({selectedPin.pinCode})</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                      Line {selectedLineId}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 font-thai">
                    {selectedPin.stageName} • Pos {selectedPin.col}, Row {selectedPin.row === 1 ? 'A' : selectedPin.row === 2 ? 'B' : 'C'}
                  </div>
                </div>
              </div>

              {/* Quick Lock / Unlock Switch Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleLockSwitch}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 border transition-all shadow-md ${
                    selectedPin.isLocked
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                  title="Toggle Lock to pause/freeze shot counting"
                >
                  {selectedPin.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>POSITION LOCKED</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>UNLOCKED (RUNNING)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Current Metrics & History Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">CURRENT SHOT LIFE</div>
                <div className="text-base font-bold text-cyan-300">
                  {formatShots(selectedPin.currentShots)} <span className="text-xs text-slate-400 font-normal">/ {formatShots(selectedPin.maxShots)}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${
                      selectedPin.currentShots >= selectedPin.maxShots * 0.9 ? 'bg-rose-500' : selectedPin.currentShots >= selectedPin.maxShots * 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, (selectedPin.currentShots / selectedPin.maxShots) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">LAST REPLACEMENT SHOT</div>
                <div className="text-base font-bold text-slate-200">
                  {formatShots(selectedPin.lastReplacementShot)}
                </div>
                <div className="text-[10px] text-slate-400 font-thai">
                  วิ่งมาแล้ว {formatShots(selectedPin.currentShots)} ช็อต
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">REGRIND COUNT</div>
                <div className="text-base font-bold text-amber-300">
                  {selectedPin.regrindCount} <span className="text-xs text-slate-400 font-normal">/ {selectedPin.maxRegrind} cycles</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  เจียรสะสม: {selectedPin.totalGrindDepthMm}mm / Shim: +{selectedPin.shimThicknessMm}mm
                </div>
              </div>
            </div>

            {/* Action Entry Form (บันทึกเปลี่ยนสถานะ) */}
            <form onSubmit={handleSaveAction} className="space-y-4">
              {/* 4 Large Touch Action Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  CHOOSE MAINTENANCE ACTION TYPE (เลือกประเภทการซ่อมบำรุง) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('REPLACE_NEW')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'REPLACE_NEW'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      {actionType === 'REPLACE_NEW' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold font-mono text-emerald-300">เปลี่ยนอะไหล่ใหม่</div>
                      <div className="text-[10px] text-slate-400 font-thai">Replace New (Reset 0)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('REGRIND')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'REGRIND'
                        ? 'bg-amber-950/90 border-amber-400 text-amber-300 ring-2 ring-amber-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      {actionType === 'REGRIND' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold font-mono text-amber-300">ถอดไปเจียรลับคม</div>
                      <div className="text-[10px] text-slate-400 font-thai">Regrinding (+1 cycle)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('BROKEN')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'BROKEN'
                        ? 'bg-rose-950/90 border-rose-400 text-rose-300 ring-2 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      {actionType === 'BROKEN' && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold font-mono text-rose-300">ชำรุด / แตกหัก</div>
                      <div className="text-[10px] text-slate-400 font-thai">Broken & Emergency Lock</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('LOCK')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'LOCK'
                        ? 'bg-purple-950/90 border-purple-400 text-purple-300 ring-2 ring-purple-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Lock className="w-4 h-4 text-purple-400" />
                      {actionType === 'LOCK' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold font-mono text-purple-300">ปิดใช้งาน / ล็อค</div>
                      <div className="text-[10px] text-slate-400 font-thai">Lock / Bypass Dummy</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Sub-fields */}
              {actionType === 'REGRIND' && (
                <div className="grid grid-cols-2 gap-3 bg-amber-950/30 border border-amber-800/50 rounded-xl p-3.5 font-mono text-xs">
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">ความหนาที่เจียรออก (Depth mm) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.05"
                      max="1.50"
                      value={regrindDepthMm}
                      onChange={e => setRegrindDepthMm(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">ความหนาแผ่นชิมรอง (Shim mm) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      max="1.50"
                      value={shimThicknessMm}
                      onChange={e => setShimThicknessMm(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              )}

              {actionType === 'LOCK' && (
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-3.5 font-mono text-xs space-y-2">
                  <label className="block text-purple-300 font-bold">LOCK TYPE (ประเภทการล็อค) *</label>
                  <select
                    value={lockStatusOption}
                    onChange={e => setLockStatusOption(e.target.value as PositionLockStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-purple-300 font-bold focus:outline-none focus:border-purple-400"
                  >
                    <option value="LOCKED_MAINTENANCE">LOCKED_MAINTENANCE - รอเจียระไน / ซ่อมบำรุง</option>
                    <option value="LOCKED_BYPASS">LOCKED_BYPASS - ใส่พินหลอก (Bypass Dummy Pin)</option>
                    <option value="LOCKED_TRIAL">LOCKED_TRIAL - สุ่มทดลองคอยล์ตัวอย่าง</option>
                    <option value="LOCKED_CALIBRATION">LOCKED_CALIBRATION - ปรับระยะเคลียแรนซ์</option>
                    <option value="LOCKED_HOLD">LOCKED_HOLD - อายัดตรวจสอบคุณภาพ (QC Hold)</option>
                  </select>
                </div>
              )}

              {/* Form Fields: Technician, Date-Time, Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ผู้ปฏิบัติงาน / ช่างซ่อม (TECHNICIAN) *</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={technicianName}
                      onChange={e => setTechnicianName(e.target.value)}
                      placeholder="e.g. Somchai M. (Tooling Lead)"
                      className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">วันที่-เวลา (DATE & TIME) *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="datetime-local"
                      value={actionDateTime}
                      onChange={e => setActionDateTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 text-xs font-mono">
                  สาเหตุ / หมายเหตุ (REMARKS / REASON) *
                </label>
                <div className="space-y-1.5">
                  <select
                    onChange={e => {
                      if (e.target.value) setRemarks(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 font-thai focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- เลือกสาเหตุมาตรฐาน (Quick Common Reasons) --</option>
                    {COMMON_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="พิมพ์รายละเอียดเพิ่มเติม เช่น เปลี่ยนสเปก, คมตัดบิ่น, เลขที่ใบสั่งงาน..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100 font-thai focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {/* In-Modal History Log Tab (ประวัติเฉพาะหมุดนี้) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    RECENT HISTORY (ประวัติ 3-5 รายการล่าสุดเฉพาะตำแหน่ง {selectedPin.pinCode})
                  </span>
                  <span className="text-[10px] text-slate-500">{(selectedPin.historyLogs || []).length} logs</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {(selectedPin.historyLogs && selectedPin.historyLogs.length > 0) ? (
                    selectedPin.historyLogs.slice(0, 5).map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.actionType === 'REPLACE_NEW'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : log.actionType === 'REGRIND'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : log.actionType === 'BROKEN'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : 'bg-purple-950 text-purple-300 border border-purple-700'
                          }`}>
                            {log.actionType}
                          </span>
                          <span className="text-slate-300 font-thai">{log.remarks}</span>
                        </div>
                        <div className="text-slate-500 text-[10px] flex items-center gap-2">
                          <span>{log.dateTime}</span>
                          <span>•</span>
                          <span className="text-slate-400">{log.technician}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-xs text-slate-500 font-thai">
                      ยังไม่มีประวัติการซ่อมบำรุงสำหรับตำแหน่งนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                >
                  Cancel (ยกเลิก)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-900/50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save Transaction (บันทึกข้อมูล)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LOWER PANEL: MASTER LOG HISTORY TABLE */}
      {/* ======================================================== */}
      <div className="bg-[#0E172A] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight uppercase">
                MASTER LOG HISTORY TABLE (ประวัติการเปลี่ยน/ซ่อมบำรุงย้อนหลัง)
              </h3>
              <p className="text-xs text-slate-400 font-thai">
                ตารางบันทึกประวัติการเปลี่ยนอะไหล่ ลับคมเจียร และการล็อคตำแหน่งของไลน์ {selectedLineId}
              </p>
            </div>
          </div>

          {/* Table Filters & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              startDate={historyStartDate}
              endDate={historyEndDate}
              onChangeRange={(start, end) => {
                setHistoryStartDate(start);
                setHistoryEndDate(end);
              }}
              maxDaysAllowed={31}
            />

            <select
              value={historyStageFilter}
              onChange={e => setHistoryStageFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Stages</option>
              <option value="s1">Stage 1</option>
              <option value="s2">Stage 2</option>
              <option value="s3">Stage 3</option>
              <option value="s4">Stage 4</option>
            </select>

            <select
              value={historyActionFilter}
              onChange={e => setHistoryActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Actions</option>
              <option value="REPLACE_NEW">REPLACE_NEW</option>
              <option value="REGRIND">REGRIND</option>
              <option value="BROKEN">BROKEN</option>
              <option value="LOCK">LOCK</option>
              <option value="UNLOCK">UNLOCK</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-44 font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Master History Table */}
        <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl bg-slate-950/70">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-cyan-300 border-b border-slate-800 uppercase font-black">
                <th className="p-3">วัน-เวลา (DATE & TIME)</th>
                <th className="p-3">LINE</th>
                <th className="p-3">STAGE</th>
                <th className="p-3">POSITION CODE</th>
                <th className="p-3">รายการซ่อม (ACTION)</th>
                <th className="p-3 text-right">SHOT ณ วันที่เปลี่ยน</th>
                <th className="p-3">ผู้บันทึก (TECHNICIAN)</th>
                <th className="p-3">หมายเหตุ (REMARKS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {masterHistoryLogs.length > 0 ? (
                masterHistoryLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 text-slate-300 whitespace-nowrap">{log.dateTime}</td>
                    <td className="p-3 font-bold text-white">Line {log.lineId}</td>
                    <td className="p-3 text-slate-400">{log.stageName}</td>
                    <td className="p-3 font-bold text-cyan-300">{log.pinCode}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                        log.actionType === 'REPLACE_NEW'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : log.actionType === 'REGRIND'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600'
                          : log.actionType === 'BROKEN'
                          ? 'bg-rose-950 text-rose-300 border border-rose-600'
                          : 'bg-purple-950 text-purple-300 border border-purple-600'
                      }`}>
                        {log.actionLabelTh || log.actionType}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {formatShots(log.machineShot)}
                    </td>
                    <td className="p-3 text-slate-200">{log.technician}</td>
                    <td className="p-3 text-slate-400 font-thai max-w-xs truncate" title={log.remarks}>
                      {log.remarks || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-thai text-sm">
                    ไม่พบรายการประวัติการซ่อมบำรุงตามตัวกรองที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
