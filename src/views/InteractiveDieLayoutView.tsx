import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { DateRangeFilter, isDateInSelectedRange } from '../components/common/DateRangeFilter';
import {
  Grid as GridIcon,
  Wrench,
  RotateCcw,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Search,
  Filter,
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
  Calendar,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings,
  ShieldCheck,
  Hammer,
  Zap,
  LayoutGrid,
  FileText,
  Lock,
  KeyRound
} from 'lucide-react';
import {
  ProductionLineId,
  ReplacementRecord,
  RegrindingRecord,
  User
} from '../types';
import { storageService } from '../services/storageService';
import { regrindService } from '../services/regrindService';
import { formatShots } from '../services/calculationService';
import { LineFilterSelector } from '../components/common/LineFilterSelector';

// Pin status definition: Strictly 3 industrial states (Active, Warning, Broken)
export type PinStatus = 'normal' | 'warning' | 'broken';

export interface DiePinItem {
  id: string; // e.g. E1-s1-P-03
  pinCode: string; // e.g. P-03
  stageId: string; // s1, s2, s3, s4
  stageName: string; // Stage 1: Piercing / Burring
  partCode: string; // e.g. P-BURR-01
  partName: string; // e.g. Pierce Punch / Burring Punch
  material: string; // e.g. SKH-51 / Carbide
  tubeSize: string; // e.g. Ø7
  drawingNo: string; // DWG-FD-07-001
  row: number; // 1, 2, 3
  col: number; // 1 to 60
  status: PinStatus;
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
  actionType: 'REPLACE_NEW' | 'REGRIND' | 'BROKEN' | 'SETUP_CHANGE';
  actionLabelTh: string;
  machineShot: number;
  pinShot: number;
  technician: string;
  regrindDepthMm?: number;
  shimThicknessMm?: number;
  remarks: string;
}

export interface StageConfig {
  id: string;
  name: string;
  shortName: string;
  partName: string;
  partCode: string;
  material: string;
  drawingNo: string;
  cols: number;
  rows: number;
  maxShots: number;
  maxRegrind: number;
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id: 's1',
    name: 'Stage 1: Piercing / Burring',
    shortName: 'Stage 1: Piercing',
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
    shortName: 'Stage 2: Louver',
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
    shortName: 'Stage 3: Slit',
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
    shortName: 'Stage 4: Cut Off',
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
  'หมดอายุตามรอบ (PM Limit Reached)',
  'ปลายพันช์บิ่น/แตกหัก (Tip Broken)',
  'คมใบมีดทื่อ (Blade Dull)',
  'ระยะเคลียแรนซ์หลวม (Clearance Out)',
  'เจียรลับคมตามรอบ (Periodic Regrind)',
  'ผิวเคลือบสึก/เกิดรอย (Coating Worn)',
  'ตรวจสอบพบค่า Burr สูงเกินเกณฑ์ (High Burr Height)'
];

const COMPACT_PIN_OVERRIDES_KEY = 'FIN_DIE_PIN_OVERRIDES_V4_';

// Purge any legacy bloated full-die pin arrays from localStorage
const cleanUpAllLegacyPinBlobs = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('FIN_DIE_INTERACTIVE_PINS_') || key.startsWith('FIN_DIE_PINS_') || key.startsWith('FIN_DIE_PIN_OVERRIDES_V3_'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Legacy pin storage cleanup notice:', err);
  }
};

// Generate deterministic base pins for a line in memory (0 KB localStorage footprint)
const generateBasePins = (lineId: ProductionLineId, machineShot: number): DiePinItem[] => {
  const generatedPins: DiePinItem[] = [];
  const tubeSize = (lineId === 'E2' || lineId === 'E4' || lineId === 'E5') ? 'Ø5' : 'Ø7';

  STAGE_CONFIGS.forEach(stage => {
    const totalPins = stage.cols * stage.rows;
    for (let i = 1; i <= totalPins; i++) {
      const col = ((i - 1) % stage.cols) + 1;
      const row = Math.floor((i - 1) / stage.cols) + 1;
      const pinCode = `P-${String(i).padStart(2, '0')}`;
      const pinId = `${lineId}-${stage.id}-${pinCode}`;

      // Seed realistic shot & condition
      const rand = (Math.sin(i * 99 + stage.cols) + 1) / 2;
      let status: PinStatus = 'normal';

      // Current pin running shot (0 to max)
      let pinShots = Math.floor(rand * stage.maxShots * 0.7);
      const lastReplacementShot = Math.max(0, machineShot - pinShots);
      let regrindCount = Math.floor(rand * 3);

      // Seed realistic warning / broken examples
      if (i === 4 && stage.id === 's1') {
        status = 'broken';
      } else if (i === 18 && stage.id === 's2') {
        status = 'broken';
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
            lineId,
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

  return generatedPins;
};

// Load compact overrides for modified pins only
const loadPinOverrides = (lineId: ProductionLineId): Record<string, Partial<DiePinItem>> => {
  try {
    const savedCompact = localStorage.getItem(`${COMPACT_PIN_OVERRIDES_KEY}${lineId}`);
    if (savedCompact) {
      return JSON.parse(savedCompact);
    }
  } catch (err) {
    console.warn('Error loading pin overrides:', err);
  }
  return {};
};

// Safely persist compact overrides
const savePinOverrides = (lineId: ProductionLineId, overrides: Record<string, Partial<DiePinItem>>) => {
  try {
    localStorage.setItem(`${COMPACT_PIN_OVERRIDES_KEY}${lineId}`, JSON.stringify(overrides));
  } catch (err) {
    cleanUpAllLegacyPinBlobs();
    try {
      localStorage.setItem(`${COMPACT_PIN_OVERRIDES_KEY}${lineId}`, JSON.stringify(overrides));
    } catch (retryErr) {
      console.error('Could not save pin overrides:', retryErr);
    }
  }
};

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

  // View Mode: 'DIE_LAYOUT' (Single unified Stage Summary & 2D Pin Control) | 'MASTER_HISTORY' | 'TOOLROOM_SETUP'
  const [viewMode, setViewMode] = useState<'DIE_LAYOUT' | 'MASTER_HISTORY' | 'TOOLROOM_SETUP'>('DIE_LAYOUT');
  
  // Toolroom Secure PIN Modal States
  const [showToolroomPinModal, setShowToolroomPinModal] = useState<boolean>(false);
  const [toolroomPinInput, setToolroomPinInput] = useState<string>('');
  const [toolroomPinError, setToolroomPinError] = useState<string>('');
  
  // Per-Stage Accordion Expand/Collapse Map (stages with warnings/broken start expanded automatically)
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  // Operator Action Modal State (Clean & Focused)
  const [selectedPin, setSelectedPin] = useState<DiePinItem | null>(null);
  const [actionType, setActionType] = useState<'REPLACE_NEW' | 'REGRIND' | 'BROKEN'>('REPLACE_NEW');
  const [technicianName, setTechnicianName] = useState<string>('');
  const [actionDateTime, setActionDateTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [remarks, setRemarks] = useState<string>('');
  const [regrindDepthMm, setRegrindDepthMm] = useState<number>(0.25);
  const [shimThicknessMm, setShimThicknessMm] = useState<number>(0.20);

  // Toolroom / Setup Mode States
  const [setupSelectedStage, setSetupSelectedStage] = useState<string>('s1');
  const [setupPatternType, setSetupPatternType] = useState<string>('FULL_180');
  const [setupTechnician, setSetupTechnician] = useState<string>('');
  const [setupRemarks, setSetupRemarks] = useState<string>('Periodic Die Overhaul & Pattern Calibration');
  const [setupActionSuccess, setSetupActionSuccess] = useState<string | null>(null);

  // History table filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStageFilter, setHistoryStageFilter] = useState<string>('ALL');
  const [historyActionFilter, setHistoryActionFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  // Toast notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  const currentUser: User = storageService.getCurrentUser();

  // Load pins for current line: generated in memory + merged with compact user overrides
  const loadLinePins = () => {
    cleanUpAllLegacyPinBlobs();

    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const machineShot = lineMonitoring?.machineShotTotal || 128450190;

    const basePins = generateBasePins(selectedLineId, machineShot);
    const overrides = loadPinOverrides(selectedLineId);

    // Merge base deterministic pins with user-overridden modifications (ignoring legacy locked/bypass states)
    const merged = basePins.map(pin => {
      const override = overrides[pin.id];
      if (!override) return pin;

      // Ensure any legacy locked/bypass status is converted to clean standard states
      let mappedStatus: PinStatus = override.status as PinStatus;
      if ((override.status as any) === 'locked' || (override.status as any) === 'bypass') {
        mappedStatus = 'broken';
      }

      return {
        ...pin,
        ...override,
        status: mappedStatus || pin.status
      };
    });

    setPins(merged);

    // Automatically expand any stages that have Warning or Broken pins
    const initialExpanded: Record<string, boolean> = {};
    STAGE_CONFIGS.forEach(stage => {
      const hasIssues = merged.some(p => p.stageId === stage.id && (p.status === 'warning' || p.status === 'broken'));
      initialExpanded[stage.id] = hasIssues;
    });
    setExpandedStages(initialExpanded);
  };

  useEffect(() => {
    loadLinePins();
    const unsub = storageService.subscribe(loadLinePins);
    return () => unsub();
  }, [selectedLineId]);

  // Force technician name to be blank when modal opens
  useEffect(() => {
    if (selectedPin) {
      setTechnicianName('');
      setActionType(selectedPin.status === 'broken' ? 'REPLACE_NEW' : 'REPLACE_NEW');
      setRemarks(COMMON_REASONS[0]);
      setActionDateTime(new Date().toISOString().slice(0, 16));
      setRegrindDepthMm(0.25);
      setShimThicknessMm(0.20);
    }
  }, [selectedPin]);

  // Save pins helper
  const persistPins = (updated: DiePinItem[]) => {
    setPins(updated);

    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const machineShot = lineMonitoring?.machineShotTotal || 128450190;
    const basePins = generateBasePins(selectedLineId, machineShot);
    const baseMap = new Map(basePins.map(p => [p.id, p]));

    const overrides: Record<string, Partial<DiePinItem>> = {};
    updated.forEach(pin => {
      const base = baseMap.get(pin.id);
      if (!base) return;

      const hasExtraLogs = (pin.historyLogs && pin.historyLogs.length > 1);
      const hasStatusChange = pin.status !== base.status;
      const hasShotChange = pin.currentShots !== base.currentShots;
      const hasRegrindChange = pin.regrindCount !== base.regrindCount;

      if (hasExtraLogs || hasStatusChange || hasShotChange || hasRegrindChange) {
        overrides[pin.id] = {
          status: pin.status,
          currentShots: pin.currentShots,
          lastReplacementShot: pin.lastReplacementShot,
          lastReplacementDate: pin.lastReplacementDate,
          regrindCount: pin.regrindCount,
          maxRegrind: pin.maxRegrind,
          totalGrindDepthMm: pin.totalGrindDepthMm,
          shimThicknessMm: pin.shimThicknessMm,
          lastAction: pin.lastAction,
          lastTechnician: pin.lastTechnician,
          historyLogs: (pin.historyLogs || []).slice(0, 10)
        };
      }
    });

    savePinOverrides(selectedLineId, overrides);
  };

  // KPIs - Strictly 3 statuses (Active, Warning, Broken)
  const stats = useMemo(() => {
    const total = pins.length;
    const normal = pins.filter(p => p.status === 'normal').length;
    const warning = pins.filter(p => p.status === 'warning').length;
    const broken = pins.filter(p => p.status === 'broken').length;
    return { total, normal, warning, broken };
  }, [pins]);

  // Stage Summary metrics calculated per stage
  const stageSummaries = useMemo(() => {
    return STAGE_CONFIGS.map(stage => {
      const stagePins = pins.filter(p => p.stageId === stage.id);
      const total = stagePins.length;
      const normal = stagePins.filter(p => p.status === 'normal').length;
      const warning = stagePins.filter(p => p.status === 'warning').length;
      const broken = stagePins.filter(p => p.status === 'broken').length;
      const activeCount = normal; // In policy: broken & warning are pending action
      const activePercent = total > 0 ? Math.round((normal / total) * 100) : 100;
      
      const totalShots = stagePins.reduce((sum, p) => sum + p.currentShots, 0);
      const avgShots = total > 0 ? Math.round(totalShots / total) : 0;
      const avgShotPercent = Math.min(100, Math.round((avgShots / stage.maxShots) * 100));

      const hasIssues = warning > 0 || broken > 0;

      return {
        stage,
        total,
        normal,
        warning,
        broken,
        activeCount,
        activePercent,
        avgShots,
        avgShotPercent,
        hasIssues
      };
    });
  }, [pins]);

  // Filtered Pins for 2D Grid
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

  // Handle Pin Click -> Open Clean Operator Modal
  const handlePinClick = (pin: DiePinItem) => {
    setSelectedPin(pin);
  };

  // Toggle stage accordion expand/collapse
  const toggleStageExpand = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  // Expand all or collapse all stages
  const handleToggleAllStages = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    STAGE_CONFIGS.forEach(s => {
      next[s.id] = expand;
    });
    setExpandedStages(next);
  };

  // Execute Operator Action (Replace New, Regrind, Broken)
  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPin) return;

    if (!technicianName.trim()) {
      setFeedback({
        type: 'error',
        message: 'กรุณากรอกชื่อช่างซ่อม / ผู้บันทึก (Technician Name is required)'
      });
      return;
    }

    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const currentMachineShot = lineMonitoring?.machineShotTotal || 128450190;

    let nextStatus: PinStatus = 'normal';
    let nextShots = selectedPin.currentShots;
    let nextLastReplacementShot = selectedPin.lastReplacementShot;
    let nextRegrindCount = selectedPin.regrindCount;
    let nextGrindDepth = selectedPin.totalGrindDepthMm;
    let nextShim = selectedPin.shimThicknessMm;
    let actionLabelTh = '';

    if (actionType === 'REPLACE_NEW') {
      nextStatus = 'normal';
      nextShots = 0;
      nextLastReplacementShot = currentMachineShot;
      nextRegrindCount = 0;
      nextGrindDepth = 0;
      nextShim = 0;
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
      nextShots = 0;
      nextStatus = nextRegrindCount >= selectedPin.maxRegrind ? 'warning' : 'normal';
      actionLabelTh = `ส่งเจียรลับคมครั้งที่ ${nextRegrindCount} (-${regrindDepthMm}mm / +Shim ${shimThicknessMm}mm)`;

      // Auto-queue ticket to Tooling Regrinding Management System
      try {
        regrindService.receiveFromDieLayout({
          lineId: selectedLineId,
          stageName: selectedPin.stageName,
          positionId: selectedPin.pinCode,
          partName: selectedPin.partName,
          partCode: selectedPin.partCode,
          removedPartRegrindCount: selectedPin.regrindCount,
          defectReason: selectedPin.currentShots >= selectedPin.maxShots ? 'NORMAL_WEAR' : 'CHIPPED',
          notes: remarks || 'Sent from 2D Die Layout',
          technicianName: technicianName || currentUser.name
        });
      } catch (err) {
        console.warn('Auto-logging regrind record:', err);
      }
    } else if (actionType === 'BROKEN') {
      nextStatus = 'broken';
      actionLabelTh = 'แจ้งชำรุด / แตกหัก (Broken Alert)';
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
      lastAction: actionLabelTh,
      lastTechnician: technicianName || currentUser.name,
      historyLogs: [historyEntry, ...(selectedPin.historyLogs || [])].slice(0, 10)
    };

    const nextPins = pins.map(p => (p.id === selectedPin.id ? updatedPin : p));
    persistPins(nextPins);

    setFeedback({
      type: 'success',
      message: `บันทึกรายการ "${actionLabelTh}" สำหรับตำแหน่ง ${selectedPin.pinCode} (${selectedPin.stageName}) เรียบร้อยแล้ว`
    });
    setTimeout(() => setFeedback(null), 3500);

    setSelectedPin(null);
  };

  // Toolroom / Setup Mode: Apply Batch Pattern or Stage Reset
  const handleApplyToolroomSetup = () => {
    if (!setupTechnician.trim()) {
      setFeedback({
        type: 'error',
        message: 'กรุณากรอกชื่อช่างแม่พิมพ์ / Toolroom Specialist ผู้รับผิดชอบ'
      });
      return;
    }

    const lineMonitoring = storageService.getLineMonitoring(selectedLineId);
    const currentMachineShot = lineMonitoring?.machineShotTotal || 128450190;
    const stageTarget = STAGE_CONFIGS.find(s => s.id === setupSelectedStage);

    if (setupPatternType === 'RESET_ALL_PINS') {
      // Full Stage Reset (All pins reset to 0 shots, normal status)
      const nextPins = pins.map(p => {
        if (setupSelectedStage === 'ALL' || p.stageId === setupSelectedStage) {
          const logEntry: PinHistoryEntry = {
            id: `LOG-TOOLROOM-${Date.now()}-${p.id}`,
            dateTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
            lineId: selectedLineId,
            stageId: p.stageId,
            stageName: p.stageName,
            pinCode: p.pinCode,
            partName: p.partName,
            actionType: 'SETUP_CHANGE',
            actionLabelTh: 'Toolroom: รีเซ็ตประกอบแม่พิมพ์ใหม่ทั้งชุด (Full Die Overhaul Set Reset)',
            machineShot: currentMachineShot,
            pinShot: 0,
            technician: setupTechnician,
            remarks: setupRemarks
          };

          return {
            ...p,
            status: 'normal' as PinStatus,
            currentShots: 0,
            lastReplacementShot: currentMachineShot,
            lastReplacementDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
            regrindCount: 0,
            totalGrindDepthMm: 0,
            shimThicknessMm: 0,
            lastAction: 'Toolroom Setup Overhaul',
            lastTechnician: setupTechnician,
            historyLogs: [logEntry, ...(p.historyLogs || [])].slice(0, 10)
          };
        }
        return p;
      });

      persistPins(nextPins);
      setSetupActionSuccess(`รีเซ็ตชุดพินแม่พิมพ์สำหรับ ${setupSelectedStage === 'ALL' ? 'ทุก Stage' : stageTarget?.name} เรียบร้อยแล้ว (สถานะ Active 100%)`);
    } else {
      // Pattern Calibration
      setSetupActionSuccess(`บันทึกการตั้งค่า Pattern ${setupPatternType} สำหรับ ${stageTarget?.name} สำเร็จ (พร้อมรันงานตามนโยบายมาตรฐาน)`);
    }

    setFeedback({
      type: 'success',
      message: `Toolroom Setup: ดำเนินการปรับปรุงและบันทึกประวัติการตั้งค่าแม่พิมพ์เรียบร้อยแล้ว`
    });
    setTimeout(() => {
      setFeedback(null);
      setSetupActionSuccess(null);
    }, 4000);
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
    
    const colWidths = [
      { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
      { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 30 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `FinDie_Layout_Maintenance_Log_${selectedLineId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-3.5 animate-fadeIn font-sans text-slate-100 pb-8 w-full">
      {/* ======================================================== */}
      {/* 1. TOP BAR: LINE SELECTOR + 3 CLEAN KPIS + MODE SWITCH */}
      {/* ======================================================== */}
      <div className="sticky top-[-1rem] lg:top-[-1.5rem] z-30 backdrop-blur-md rounded-xl p-3 shadow-xl space-y-3 border bg-[#0E172A]/95 border-slate-800/90">
        {/* Row 1: Line Selector & Clean Master History Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-500/80 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight uppercase">
                  DIE STAGES & PIN MATRIX
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono">
                  {viewMode === 'DIE_LAYOUT' ? 'DIE LAYOUT & 2D GRID' : viewMode === 'MASTER_HISTORY' ? 'MASTER HISTORY LOG' : 'TOOLROOM SETUP'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-thai">
                ระบบสรุปสถานะสเตจแม่พิมพ์และผัง 2D Pin Control ประจำไลน์ {selectedLineId}
              </p>
            </div>
          </div>

          {/* Clean Top Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {showLineSelector && (
              <LineFilterSelector
                selectedLine={selectedLineId}
                onSelectLine={(l) => setSelectedLineId(l)}
                label="SELECT LINE:"
              />
            )}

            {/* Master History Log Shortcut / Back Toggle Button */}
            {viewMode === 'MASTER_HISTORY' ? (
              <button
                type="button"
                onClick={() => setViewMode('DIE_LAYOUT')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all active:scale-95"
                title="กลับสู่หน้าผังแม่พิมพ์ (Die Layout & Stage Summary)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>กลับสู่ผังแม่พิมพ์ (Die Layout)</span>
              </button>
            ) : viewMode === 'TOOLROOM_SETUP' ? (
              <button
                type="button"
                onClick={() => setViewMode('DIE_LAYOUT')}
                className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                title="ออกจากโหมด Toolroom Setup กลับสู่หน้าหลัก HMI"
              >
                <X className="w-4 h-4" />
                <span>ออกจากโหมด Toolroom Setup</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setViewMode('MASTER_HISTORY')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500/60 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                title="เปิดตาราง Master Log History (ประวัติการเปลี่ยน/ซ่อมบำรุงย้อนหลัง)"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Master History Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: 3 Clean Summary Counters (Total, Active, Warning, Broken) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Positions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                TOTAL PINS IN DIE
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {stats.total} <span className="text-xs font-normal text-slate-400">PINS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">4 Stages (S1 - S4)</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Active / Normal 🟢 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'normal' ? 'ALL' : 'normal')}
            className={`cursor-pointer transition-all border rounded-xl p-3 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'normal' 
                ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-500/50' 
                : 'bg-emerald-950/40 border-emerald-800/60 hover:bg-emerald-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE (ปกติ 100%)
              </div>
              <div className="text-xl font-bold text-emerald-300 font-mono">{stats.normal} <span className="text-xs font-normal text-emerald-400">PINS</span></div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                {stats.total > 0 ? Math.round((stats.normal / stats.total) * 100) : 100}% สมบูรณ์
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Warning / Regrind Limit 🟡 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'warning' ? 'ALL' : 'warning')}
            className={`cursor-pointer transition-all border rounded-xl p-3 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'warning' 
                ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-500/50' 
                : 'bg-amber-950/40 border-amber-800/60 hover:bg-amber-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                WARNING (ใกล้ครบอายุ)
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono">{stats.warning} <span className="text-xs font-normal text-amber-400">PINS</span></div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">≥90% หรือเจียรใกล้ลิมิต</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-900/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Broken / Damaged 🔴 */}
          <div 
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'broken' ? 'ALL' : 'broken')}
            className={`cursor-pointer transition-all border rounded-xl p-3 flex items-center justify-between shadow-sm ${
              selectedStatusFilter === 'broken' 
                ? 'bg-rose-950 border-rose-400 ring-2 ring-rose-500/50' 
                : 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-950/70'
            }`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                BROKEN (ชำรุด / ต้องเปลี่ยน)
              </div>
              <div className="text-xl font-bold text-rose-300 font-mono">{stats.broken} <span className="text-xs font-normal text-rose-400">PINS</span></div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">นโยบาย: ชำรุดต้องเปลี่ยนทันที</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-900/60 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm font-bold shadow-lg animate-fadeIn border ${
          feedback.type === 'success'
            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
            : feedback.type === 'error'
            ? 'bg-rose-950 border-rose-600 text-rose-300'
            : feedback.type === 'warning'
            ? 'bg-amber-950 border-amber-600 text-amber-300'
            : 'bg-cyan-950 border-cyan-600 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : feedback.type === 'error' ? (
              <AlertOctagon className="w-5 h-5 text-rose-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODE CONTENT: STAGE SUMMARY / MASTER HISTORY / 2D GRID / TOOLROOM SETUP */}
      {/* ======================================================== */}
      {viewMode === 'MASTER_HISTORY' ? (
        /* ======================================================== */
        /* MASTER LOG HISTORY VIEW (ประวัติการเปลี่ยน/ซ่อมบำรุงย้อนหลัง) */
        /* ======================================================== */
        <div className="bg-[#0E172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center shadow-md">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight uppercase">
                    MASTER LOG HISTORY TABLE (ประวัติการเปลี่ยน/ซ่อมบำรุงย้อนหลัง)
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                    {masterHistoryLogs.length} LOGS
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-thai">
                  ตารางบันทึกประวัติการเปลี่ยนอะไหล่ ส่งเจียรลับคม และแจ้งชำรุดของไลน์ {selectedLineId}
                </p>
              </div>
            </div>

            {/* Quick Action to return to Die Layout */}
            <button
              type="button"
              onClick={() => setViewMode('DIE_LAYOUT')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>กลับสู่ผังแม่พิมพ์ (Die Layout)</span>
            </button>
          </div>

          {/* Table Filters & Export Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
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
                <option value="ALL">All Stages (ทุกสเตจ)</option>
                <option value="s1">Stage 1: Piercing</option>
                <option value="s2">Stage 2: Louver</option>
                <option value="s3">Stage 3: Slit</option>
                <option value="s4">Stage 4: Cut Off</option>
              </select>

              <select
                value={historyActionFilter}
                onChange={e => setHistoryActionFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Actions (ทุกรายการ)</option>
                <option value="REPLACE_NEW">REPLACE_NEW (เปลี่ยนใหม่)</option>
                <option value="REGRIND">REGRIND (ส่งเจียรลับคม)</option>
                <option value="BROKEN">BROKEN (แจ้งชำรุด)</option>
                <option value="SETUP_CHANGE">SETUP_CHANGE (Toolroom เซ็ตติ้ง)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา Pin, ช่าง, หมายเหตุ..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-56 font-mono"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
      ) : viewMode === 'TOOLROOM_SETUP' ? (
        /* ======================================================== */
        /* TOOLROOM / SETUP MODE (สำหรับช่างแม่พิมพ์ตอนล้างเซ็ตติ้ง) */
        /* ======================================================== */
        <div className="bg-[#0B1222] border border-purple-900/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-purple-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-purple-300 font-mono tracking-tight uppercase flex items-center gap-2">
                  <span>TOOLROOM & DIE SETUP MODE</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-600">
                    AUTHORIZED DIE TECH ONLY
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-thai">
                  โหมดตั้งค่าสำหรับช่างแม่พิมพ์: ปรับแต่ง Pattern สลับตำแหน่งพิน และรีเซ็ตการประกอบแม่พิมพ์ยกชุด
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('DIE_LAYOUT')}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>กลับสู่หน้าหลัก (Operator Mode)</span>
            </button>
          </div>

          {setupActionSuccess && (
            <div className="p-4 rounded-xl bg-purple-950/80 border border-purple-500 text-purple-200 text-xs font-mono font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>{setupActionSuccess}</span>
            </div>
          )}

          {/* Setup Options Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Target Stage Selection */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                1. เลือกสเตจแม่พิมพ์ (Target Stage)
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSetupSelectedStage('ALL')}
                  className={`w-full p-3 rounded-lg border text-left text-xs font-mono font-bold transition-all ${
                    setupSelectedStage === 'ALL'
                      ? 'bg-purple-950 border-purple-400 text-purple-300 ring-2 ring-purple-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>ALL STAGES (ทุกสเตจทั้งชุดแม่พิมพ์)</span>
                    {setupSelectedStage === 'ALL' && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                </button>

                {STAGE_CONFIGS.map(stage => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSetupSelectedStage(stage.id)}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-mono font-bold transition-all ${
                      setupSelectedStage === stage.id
                        ? 'bg-purple-950 border-purple-400 text-purple-300 ring-2 ring-purple-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div>{stage.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{stage.cols} Cols × {stage.rows} Rows ({stage.cols * stage.rows} Pins)</div>
                      </div>
                      {setupSelectedStage === stage.id && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pattern & Overhaul Setup Action */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                2. เลือกประเภทการปรับตั้งค่า (Setup Configuration)
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSetupPatternType('FULL_180')}
                  className={`w-full p-3 rounded-lg border text-left text-xs font-mono font-bold transition-all ${
                    setupPatternType === 'FULL_180'
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div>Full Standard Pattern (รันเต็มพิกัด 100%)</div>
                      <div className="text-[10px] text-slate-400 font-normal">กดยึดพินครบทุกแถวตามแบบดรออิ้งมาตรฐาน</div>
                    </div>
                    {setupPatternType === 'FULL_180' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupPatternType('PITCH_3P_4P')}
                  className={`w-full p-3 rounded-lg border text-left text-xs font-mono font-bold transition-all ${
                    setupPatternType === 'PITCH_3P_4P'
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div>Pitch Pattern Adaptation (สลับระยะ 3P / 4P)</div>
                      <div className="text-[10px] text-slate-400 font-normal">สลับระยะพิทช์ครีบตาม Lot Order ลูกค้า</div>
                    </div>
                    {setupPatternType === 'PITCH_3P_4P' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupPatternType('RESET_ALL_PINS')}
                  className={`w-full p-3 rounded-lg border text-left text-xs font-mono font-bold transition-all ${
                    setupPatternType === 'RESET_ALL_PINS'
                      ? 'bg-rose-950 border-rose-400 text-rose-300 ring-2 ring-rose-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-rose-400">Full Die Overhaul Set Reset (รีเซ็ตชุดใหม่)</div>
                      <div className="text-[10px] text-slate-400 font-normal">ล้างและประกอบพินใหม่ยกชุด (รีเซ็ตนับช็อต 0)</div>
                    </div>
                    {setupPatternType === 'RESET_ALL_PINS' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Technician Signoff & Apply Button */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  3. บันทึกและลงนามช่างแม่พิมพ์
                </label>

                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1 font-mono">ชื่อช่างแม่พิมพ์ (Die Tech) *</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={setupTechnician}
                      onChange={e => setSetupTechnician(e.target.value)}
                      placeholder="ระบุชื่อช่างแม่พิมพ์..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1 font-mono">หมายเหตุการเซ็ตติ้ง *</label>
                  <textarea
                    rows={2}
                    value={setupRemarks}
                    onChange={e => setSetupRemarks(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-thai focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyToolroomSetup}
                className="w-full mt-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2"
              >
                <Hammer className="w-4 h-4" />
                <span>ยืนยันการตั้งค่า Toolroom Setup</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* STAGE SUMMARY MODE & 2D GRID WORKSPACE */
        /* ======================================================== */
        <div className="space-y-3.5">
          {/* Quick Filter Bar for 2D Grid */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            {/* Stage Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
              <button
                onClick={() => setSelectedStageFilter('ALL')}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  selectedStageFilter === 'ALL'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm font-black'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                ALL STAGES (4)
              </button>
              {STAGE_CONFIGS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStageFilter(s.id)}
                  className={`px-3 py-1 rounded-lg border transition-all ${
                    selectedStageFilter === s.id
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {s.shortName}
                </button>
              ))}
            </div>

            {/* Search Box & Expand/Collapse Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหา Pin Code เช่น P-01..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-48 font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleToggleAllStages(!Object.values(expandedStages).some(Boolean))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700"
                title="Toggle all 2D Grids"
              >
                {Object.values(expandedStages).some(Boolean) ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ย่อเก็บทั้งหมด</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>กางผังทั้งหมด</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Each Stage Card / Strip */}
          {stageSummaries
            .filter(item => selectedStageFilter === 'ALL' || item.stage.id === selectedStageFilter)
            .map(item => {
              const { stage, total, normal, warning, broken, activeCount, activePercent, avgShots, avgShotPercent, hasIssues } = item;
              const isExpanded = expandedStages[stage.id] ?? false;
              const stagePins = filteredPins.filter(p => p.stageId === stage.id);
              const allStagePins = pins.filter(p => p.stageId === stage.id);

              return (
                <div
                  key={stage.id}
                  className={`border rounded-xl transition-all shadow-xl ${
                    broken > 0
                      ? 'bg-[#0E1526] border-rose-800/80 shadow-rose-950/20'
                      : warning > 0
                      ? 'bg-[#0E1526] border-amber-800/80 shadow-amber-950/20'
                      : 'bg-[#0B1222] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* ======================================================== */}
                  {/* STAGE SUMMARY STRIP (Clean Header Banner) */}
                  {/* ======================================================== */}
                  <div
                    onClick={() => toggleStageExpand(stage.id)}
                    className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-900/40 rounded-xl transition-colors"
                  >
                    {/* Stage Left Info */}
                    <div className="flex items-center gap-3">
                      {/* Health Status LED */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-md ${
                        broken > 0
                          ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                          : warning > 0
                          ? 'bg-amber-950 border-amber-500 text-amber-300'
                          : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      }`}>
                        {broken > 0 ? (
                          <AlertOctagon className="w-5 h-5 text-rose-400" />
                        ) : warning > 0 ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-white font-mono uppercase">
                            {stage.name}
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-700">
                            {activeCount}/{total} Pins Active
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 font-mono mt-0.5">
                          <span>Material: <strong className="text-slate-200">{stage.material}</strong></span>
                          <span>•</span>
                          <span>Drawing: <strong className="text-slate-200">{stage.drawingNo}</strong></span>
                          <span>•</span>
                          <span>Max Life: <strong className="text-slate-200">{formatShots(stage.maxShots)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Middle & Right: Health Summary & Expand Button */}
                    <div className="flex items-center gap-3">
                      {/* Health Status Badges */}
                      <div className="flex items-center gap-2 text-xs font-mono">
                        {broken > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-500 text-rose-300 font-bold flex items-center gap-1.5 animate-pulse">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            {broken} ชำรุด (Broken)
                          </span>
                        ) : warning > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-500 text-amber-300 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            {warning} ใกล้ครบอายุ (Warning)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            100% Operational (ปกติ)
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                          Avg: {formatShots(avgShots)} shots ({avgShotPercent}%)
                        </span>
                      </div>

                      {/* Expand / Collapse Action Button */}
                      <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        <span>{isExpanded ? 'ย่อผัง' : 'กาง 2D Grid'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* COLLAPSIBLE 2D DIE PIN GRID CONTAINER */}
                  {/* ======================================================== */}
                  {isExpanded && (
                    <div className="p-3.5 pt-0 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-3">
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <GridIcon className="w-3.5 h-3.5" />
                            2D Interactive Pin Grid ({stage.cols} คอลัมน์ × {stage.rows} แถว)
                          </span>
                          <span>คลิกที่หมุดพินเพื่อบันทึกเปลี่ยนอะไหล่ / ส่งเจียร / แจ้งชำรุด</span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> ปกติ
                          </span>
                          <span className="flex items-center gap-1 text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> ใกล้ครบอายุ
                          </span>
                          <span className="flex items-center gap-1 text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> ชำรุด
                          </span>
                        </div>
                      </div>

                      {/* 2D Die Grid Scroll Area */}
                      <div className="overflow-x-auto custom-scrollbar p-3 bg-slate-950/90 rounded-xl border border-slate-800/90">
                        <div className="inline-block min-w-max space-y-2">
                          {/* Column Index Markers */}
                          <div className="flex items-center gap-1 pl-12 text-[10px] font-mono text-slate-500 font-bold select-none">
                            {Array.from({ length: stage.cols }).map((_, cIdx) => {
                              const colNum = cIdx + 1;
                              return (
                                <div key={colNum} className="w-7 text-center">
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

                                    // 3 Clean Visual Statuses
                                    let bgStyle = 'bg-emerald-500 text-emerald-950 border-emerald-400 hover:ring-2 hover:ring-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                                    let icon = null;

                                    if (pin.status === 'warning') {
                                      bgStyle = 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse hover:ring-2 hover:ring-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.6)]';
                                    } else if (pin.status === 'broken') {
                                      bgStyle = 'bg-rose-500 text-white border-rose-300 animate-pulse hover:ring-2 hover:ring-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.7)]';
                                      icon = <AlertOctagon className="w-3.5 h-3.5" />;
                                    }

                                    const shotPct = Math.round((pin.currentShots / pin.maxShots) * 100);

                                    return (
                                      <button
                                        key={colNum}
                                        type="button"
                                        onClick={() => handlePinClick(pin)}
                                        title={`${pin.pinCode} | ${pin.stageName}\nสถานะ: ${pin.status.toUpperCase()}\nช็อตใช้งาน: ${formatShots(pin.currentShots)} / ${formatShots(pin.maxShots)} (${shotPct}%)\nรอบเจียร: ${pin.regrindCount}/${pin.maxRegrind}\nคลิกเพื่อเปลี่ยนอะไหล่ / ส่งเจียร / แจ้งชำรุด`}
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
                                            {pin.status === 'broken' && (
                                              <div className="text-rose-400 font-bold text-[10px]">สถานะ: ชำรุด (BROKEN)</div>
                                            )}
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
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CLEAN OPERATOR ACTION MODAL (ON PIN CLICK) */}
      {/* ======================================================== */}
      {selectedPin && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-[#0D1527] border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border shadow-lg ${
                  selectedPin.status === 'broken'
                    ? 'bg-rose-950 text-rose-300 border-rose-500'
                    : selectedPin.status === 'warning'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
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

              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Metrics Snapshot */}
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

            {/* Operator Action Entry Form (3 Focused Choices: Replace, Regrind, Broken) */}
            <form onSubmit={handleSaveAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  เลือกการดำเนินการสำหรับตำแหน่งนี้ *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. เปลี่ยนอะไหล่ใหม่ (Replace New) */}
                  <button
                    type="button"
                    onClick={() => setActionType('REPLACE_NEW')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'REPLACE_NEW'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wrench className="w-5 h-5 text-emerald-400" />
                      {actionType === 'REPLACE_NEW' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xs font-bold font-mono text-emerald-300">เปลี่ยนอะไหล่ใหม่ (Replace)</div>
                      <div className="text-[10px] text-slate-400 font-thai">รีเซ็ตช็อตเริ่มต้น 0 (Reset)</div>
                    </div>
                  </button>

                  {/* 2. ส่งเจียรลับคม (Send to Regrind) */}
                  <button
                    type="button"
                    onClick={() => setActionType('REGRIND')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'REGRIND'
                        ? 'bg-amber-950/90 border-amber-400 text-amber-300 ring-2 ring-amber-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <RotateCcw className="w-5 h-5 text-amber-400" />
                      {actionType === 'REGRIND' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xs font-bold font-mono text-amber-300">ส่งเจียรลับคม (Regrind)</div>
                      <div className="text-[10px] text-slate-400 font-thai">+1 รอบเจียร & ออกใบงาน</div>
                    </div>
                  </button>

                  {/* 3. แจ้งชำรุด (Report Broken) */}
                  <button
                    type="button"
                    onClick={() => setActionType('BROKEN')}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      actionType === 'BROKEN'
                        ? 'bg-rose-950/90 border-rose-400 text-rose-300 ring-2 ring-rose-500/50 shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <AlertOctagon className="w-5 h-5 text-rose-400" />
                      {actionType === 'BROKEN' && <Check className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xs font-bold font-mono text-rose-300">แจ้งชำรุด (Report Broken)</div>
                      <div className="text-[10px] text-slate-400 font-thai">แจ้งเตือนเปลี่ยนด่วน (แดง)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Regrind Parameters (if Regrind selected) */}
              {actionType === 'REGRIND' && (
                <div className="grid grid-cols-2 gap-3 bg-amber-950/30 border border-amber-800/50 rounded-xl p-3.5 font-mono text-xs">
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">ความหนาเจียรออก (มม.) *</label>
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
                    <label className="block text-amber-300 font-bold mb-1">ความหนาชิมรองชดเชย (มม.) *</label>
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

              {/* Form Fields: Technician, Date-Time, Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ช่างซ่อม / ผู้บันทึก *</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={technicianName}
                      onChange={e => setTechnicianName(e.target.value)}
                      placeholder="ระบุชื่อช่าง..."
                      className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">วัน-เวลา *</label>
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
                  สาเหตุ / หมายเหตุ *
                </label>
                <div className="space-y-1.5">
                  <select
                    onChange={e => {
                      if (e.target.value) setRemarks(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 font-thai focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- เลือกสาเหตุมาตรฐาน --</option>
                    {COMMON_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-100 font-thai focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              {/* Mini Recent History Log */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    RECENT HISTORY (ประวัติการซ่อมเฉพาะตำแหน่ง {selectedPin.pinCode})
                  </span>
                  <span className="text-[10px] text-slate-500">{(selectedPin.historyLogs || []).length} logs</span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
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
                              : 'bg-rose-950 text-rose-300 border border-rose-700'
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
                    <div className="text-center py-2.5 text-xs text-slate-500 font-thai">
                      ยังไม่มีประวัติการซ่อมบำรุงสำหรับตำแหน่งนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPin(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-900/50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการดำเนินการ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. FOOTER STATUS BAR WITH SECURED TOOLROOM ACCESS LINK */}
      {/* ======================================================== */}
      {viewMode === 'DIE_LAYOUT' && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">HMI Line Operator Mode • Line {selectedLineId} Active</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setToolroomPinInput('');
              setToolroomPinError('');
              setShowToolroomPinModal(true);
            }}
            className="px-2.5 py-1 rounded bg-slate-900/80 hover:bg-purple-950/60 text-slate-400 hover:text-purple-300 border border-slate-800 hover:border-purple-600/50 flex items-center gap-1.5 transition-all"
            title="เฉพาะช่างแม่พิมพ์ / Toolroom Engineer (PIN: 8888)"
          >
            <Lock className="w-3 h-3 text-purple-400" />
            <span>โหมดช่างแม่พิมพ์ (Toolroom Setup)</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TOOLROOM SECURITY AUTHENTICATION PIN MODAL */}
      {/* ======================================================== */}
      {showToolroomPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F172A] border border-purple-500/60 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Toolroom Access PIN
                  </h3>
                  <p className="text-[11px] text-purple-300 font-thai">
                    กรุณากรอกรหัสผ่านเฉพาะช่างแม่พิมพ์ / Toolroom
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToolroomPinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Valid toolroom PINs: 8888, 1234, 9999
                if (toolroomPinInput === '8888' || toolroomPinInput === '1234' || toolroomPinInput === '9999') {
                  setShowToolroomPinModal(false);
                  setViewMode('TOOLROOM_SETUP');
                } else {
                  setToolroomPinError('รหัสผ่านไม่ถูกต้อง (Default PIN: 8888)');
                }
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  ENTER 4-DIGIT PIN:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="••••"
                  value={toolroomPinInput}
                  onChange={(e) => {
                    setToolroomPinInput(e.target.value);
                    setToolroomPinError('');
                  }}
                  className="w-full bg-slate-950 border border-purple-700/60 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.5em] text-purple-200 font-mono focus:outline-none focus:border-purple-400"
                />
                {toolroomPinError && (
                  <p className="text-xs text-rose-400 mt-1.5 font-thai">
                    {toolroomPinError}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-2 font-mono text-center">
                  🔒 Authorized Toolroom Personnel Only (Hint: 8888)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowToolroomPinModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-purple-950"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ยืนยันปลดล็อก</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
