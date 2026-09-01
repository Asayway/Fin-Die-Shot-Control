import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  RotateCcw, 
  History, 
  CheckCircle2, 
  Zap, 
  Layers,
  ArrowRight,
  AlertTriangle,
  FileText,
  Save,
  Trash2,
  Edit3,
  Search,
  Filter,
  Check,
  X,
  Clock,
  Gauge,
  Activity,
  Download,
  AlertOctagon,
  Calendar,
  UserCheck,
  Split,
  ChevronRight,
  RefreshCw,
  Info,
  Terminal,
  Cpu,
  Hash,
  Delete,
  Play,
  Square,
  Flame
} from 'lucide-react';
import { 
  ProductionLineId, 
  ShotEntryRecord, 
  LineLiveMonitoringData, 
  ShotInputMethod, 
  ShotSplitPeriod, 
  LineActiveConfiguration,
  LINE_INFO_MAP
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';
import { LineFilterSelector } from '../components/common/LineFilterSelector';

interface ShotEntryViewProps {
  initialLineId?: ProductionLineId;
}

// Break Time Windows Definition for Mode 2 Break Deduction
const BREAK_WINDOWS = [
  // Day breaks
  { name: 'Morning Break', startMin: 600, endMin: 610, duration: 10 },      // 10:00 - 10:10
  { name: 'Lunch Break', startMin: 720, endMin: 780, duration: 60 },        // 12:00 - 13:00
  { name: 'Afternoon Break', startMin: 900, endMin: 910, duration: 10 },    // 15:00 - 15:10
  { name: 'Pre-OT Day Break', startMin: 1020, endMin: 1050, duration: 30 }, // 17:00 - 17:30
  // Night breaks
  { name: 'Night 1st Break', startMin: 1290, endMin: 1300, duration: 10 },  // 21:30 - 21:40
  { name: 'Midnight Meal Break', startMin: 1410, endMin: 1470, duration: 60 }, // 23:30 - 00:30
  { name: 'Late Night Break', startMin: 150, endMin: 160, duration: 10 },    // 02:30 - 02:40
  { name: 'Pre-OT Night Break', startMin: 270, endMin: 330, duration: 60 }  // 04:30 - 05:30
];

function calculateBreakOverlapMinutes(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate || endDate <= startDate) return 0;
  let breakMinutes = 0;
  const cur = new Date(startDate.getTime());
  const end = endDate.getTime();

  while (cur.getTime() < end) {
    const h = cur.getHours();
    const m = cur.getMinutes();
    const minOfDay = h * 60 + m;

    const inBreak = BREAK_WINDOWS.some(w => {
      if (w.startMin <= w.endMin) {
        return minOfDay >= w.startMin && minOfDay < w.endMin;
      } else {
        return minOfDay >= 1410 || minOfDay < 30;
      }
    });

    if (inBreak) {
      breakMinutes += 1;
    }
    cur.setMinutes(cur.getMinutes() + 1);
  }

  return breakMinutes;
}

function getShiftInfo(date: Date = new Date()): { shiftName: string; shiftKey: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)'; description: string } {
  const h = date.getHours();
  const m = date.getMinutes();
  const minOfDay = h * 60 + m;

  // Special Overlap Periods
  if (minOfDay >= 450 && minOfDay < 480) { // 07:30 - 08:00
    return { shiftName: 'คาบเกี่ยวส่งมอบงาน (07:30 - 08:00)', shiftKey: 'Shift 2 (Night)', description: 'ช่วงคาบเกี่ยวกะดึก -> กะเช้า' };
  }
  if (minOfDay >= 480 && minOfDay <= 510) { // 08:00 - 08:30
    return { shiftName: 'คาบเกี่ยวเริ่มกะ (07:30 - 08:30)', shiftKey: 'Shift 1 (Day)', description: 'ช่วงเวลาพิเศษ คาบเกี่ยวกะเช้า' };
  }

  // Day Shift (08:00 - 17:00)
  if (minOfDay >= 480 && minOfDay < 1020) {
    return { shiftName: 'กะเช้า (08:00 - 17:00)', shiftKey: 'Shift 1 (Day)', description: 'กะเช้าปกติ (Day Shift)' };
  }

  // Day Shift OT (17:30 - 19:30 & 21:30)
  if (minOfDay >= 1050 && minOfDay < 1170) {
    return { shiftName: 'กะเช้า OT 1 (17:30 - 19:30)', shiftKey: 'Shift 3 (Overtime)', description: 'กะเช้า ต่อเวลาพิเศษ OT 1' };
  }
  if (minOfDay >= 1170 && minOfDay < 1290) {
    return { shiftName: 'กะเช้า OT 2 (19:30 - 21:30)', shiftKey: 'Shift 3 (Overtime)', description: 'กะเช้า ต่อเวลาพิเศษ OT 2' };
  }

  // Night Shift OT (06:30 - 07:30)
  if (minOfDay >= 390 && minOfDay < 450) {
    return { shiftName: 'กะดึก OT (06:30 - 07:30)', shiftKey: 'Shift 3 (Overtime)', description: 'กะดึก ต่อเวลาพิเศษ OT' };
  }

  // Night Shift (19:30 - 05:30)
  if (minOfDay >= 1170 || minOfDay < 330) {
    return { shiftName: 'กะดึก (19:30 - 05:30)', shiftKey: 'Shift 2 (Night)', description: 'กะดึกปกติ (Night Shift)' };
  }

  return { shiftName: 'กะพิเศษ (Special Shift)', shiftKey: 'Shift 3 (Overtime)', description: 'ช่วงปรับตั้งแม่พิมพ์ / พักเบรค' };
}

export const ShotEntryView: React.FC<ShotEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'drafts'>('entry');

  // Input Fields & 3 Entry Modes
  const [entryMode, setEntryMode] = useState<'MODE_1' | 'MODE_2' | 'MODE_3'>('MODE_1');
  const [inputMethod, setInputMethod] = useState<ShotInputMethod>('METER_READING');
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().substring(0, 10));
  
  // Real-time Shift Auto-Detection
  const initialShift = useMemo(() => getShiftInfo(new Date()), []);
  const [shift, setShift] = useState<'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)'>(initialShift.shiftKey);
  const [detectedShiftInfo, setDetectedShiftInfo] = useState(initialShift);
  const [entryReason, setEntryReason] = useState<string>('Daily Shift Production (การผลิตประจำกะ)');
  const [notes, setNotes] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [allowMultiEntry, setAllowMultiEntry] = useState<boolean>(false);
  const [showTouchKeypad, setShowTouchKeypad] = useState<boolean>(false);

  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Meter Reading States (Mode 1)
  const [previousReadingInput, setPreviousReadingInput] = useState<string>('0');
  const [newReadingInput, setNewReadingInput] = useState<string>('0');
  const [shotIncrementInput, setShotIncrementInput] = useState<string>('50000');

  // Mode 2: SPM Machine Simulation States
  const [spmInput, setSpmInput] = useState<number>(100);
  const [isMachineRunning, setIsMachineRunning] = useState<boolean>(false);
  const [machineStartTime, setMachineStartTime] = useState<Date | null>(null);
  const [machineStopTime, setMachineStopTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [mode2ActualShotsInput, setMode2ActualShotsInput] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mode 2: OEE Loss Time Modal State
  const [lossModalOpen, setLossModalOpen] = useState<boolean>(false);
  const [lossData, setLossData] = useState<{
    expected: number;
    actual: number;
    missing: number;
    lossMinutes: string;
    lossType: string;
    reason: string;
  } | null>(null);
  const [lossTypeInput, setLossTypeInput] = useState<string>('COIL_CHANGE');
  const [lossReasonInput, setLossReasonInput] = useState<string>('');

  // Mode 3: Direct / PLC Pulse States
  const [plcBuffer, setPlcBuffer] = useState<number>(0);

  // Split Configuration Interval (Advanced)
  const [enableSplitInterval, setEnableSplitInterval] = useState<boolean>(false);
  const [splitPeriod1Shots, setSplitPeriod1Shots] = useState<string>('25000');
  const [splitPeriod2Shots, setSplitPeriod2Shots] = useState<string>('25000');
  const [splitPeriod1Time, setSplitPeriod1Time] = useState<string>('08:00 - 14:00');
  const [splitPeriod2Time, setSplitPeriod2Time] = useState<string>('14:00 - 20:00');

  // Data States
  const [currentLine, setCurrentLine] = useState<LineLiveMonitoringData | null>(null);
  const [allConfigs, setAllConfigs] = useState<LineActiveConfiguration[]>([]);
  const [shotLogs, setShotLogs] = useState<ShotEntryRecord[]>([]);
  const [drafts, setDrafts] = useState<ShotEntryRecord[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState(storageService.getSettings());
  const currentUser = storageService.getCurrentUser();

  // Notification / Alert
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [counterResetModalOpen, setCounterResetModalOpen] = useState<boolean>(false);
  const [resetTargetScope, setResetTargetScope] = useState<'ALL' | ProductionLineId>('ALL');
  const [resetNewMeterInput, setResetNewMeterInput] = useState<string>('0');
  const [resetPartWearOption, setResetPartWearOption] = useState<boolean>(true);
  const [resetShiftCountersOption, setResetShiftCountersOption] = useState<boolean>(true);
  const [resetApprovalIdInput, setResetApprovalIdInput] = useState<string>('RST-APPR-2026-001');
  const [resetApprovedByInput, setResetApprovedByInput] = useState<string>(currentUser.name || 'Somchai Prasert');
  const [resetReasonInput, setResetReasonInput] = useState<string>('Full Factory Shot Reset & Calibration (รีเซ็ตยอดช็อตทุกสายการผลิต)');

  // History Filters
  const [historyLineFilter, setHistoryLineFilter] = useState<string>('ALL');
  const [historyShiftFilter, setHistoryShiftFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Shift Detection Clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const info = getShiftInfo(new Date());
      setDetectedShiftInfo(info);
    }, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  // SPM Timer Effect for Mode 2
  useEffect(() => {
    if (isMachineRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMachineRunning]);

  const reloadData = () => {
    const monitoring = storageService.getLineMonitoring(selectedLineId);
    setCurrentLine(monitoring);
    setShotLogs(storageService.getShotLogs());
    setDrafts(storageService.getShotDrafts());
    setAllConfigs(storageService.getLineConfigs());
    setSystemSettings(storageService.getSettings());

    if (monitoring) {
      const prevTotal = monitoring.machineShotTotal || 0;
      setPreviousReadingInput(String(prevTotal));
      const inc = parseInt(shotIncrementInput.replace(/,/g, ''), 10) || 50000;
      setNewReadingInput(String(prevTotal + inc));
      
      if (monitoring.activeConfig?.defaultSpm && !isMachineRunning) {
        setSpmInput(monitoring.activeConfig.defaultSpm);
      }
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, [selectedLineId]);

  // Mode 2 Calculations: Break Time Deduction
  const mode2ElapsedMinutes = elapsedSeconds / 60;
  const mode2BreakMinutes = useMemo(() => {
    if (!machineStartTime) return 0;
    const end = machineStopTime || new Date();
    return calculateBreakOverlapMinutes(machineStartTime, end);
  }, [machineStartTime, machineStopTime, elapsedSeconds]);

  const mode2NetWorkingMinutes = Math.max(0, mode2ElapsedMinutes - mode2BreakMinutes);
  const mode2ExpectedShots = Math.round(mode2NetWorkingMinutes * spmInput);

  const handleStartMachine = () => {
    if (isMachineRunning) return;
    setIsMachineRunning(true);
    setMachineStartTime(new Date());
    setMachineStopTime(null);
    setElapsedSeconds(0);
    showNotification('success', `Machine Running at ${spmInput} SPM on Line ${selectedLineId}`);
  };

  const handleStopMachine = () => {
    if (!isMachineRunning) return;
    setIsMachineRunning(false);
    setMachineStopTime(new Date());
    showNotification('info', `Machine Stopped. Expected Shots: ${mode2ExpectedShots.toLocaleString()} shots`);
  };

  // Mode 3 Quick PLC Pulse Trigger
  const handleSendPlcPulse = (qty: number) => {
    setPlcBuffer(prev => prev + qty);
    showNotification('info', `[PLC PULSE] Received +${qty} pulse trigger`);
  };

  // Sync calculations between Method A (Meter Reading) and Method B (Direct Increment)
  const handleNewReadingChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setNewReadingInput(cleaned);
    const prev = parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0;
    const next = parseInt(cleaned || '0', 10) || 0;
    const diff = next - prev;
    setShotIncrementInput(String(Math.max(0, diff)));
  };

  const handleIncrementChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setShotIncrementInput(cleaned);
    const prev = parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0;
    const inc = parseInt(cleaned || '0', 10) || 0;
    setNewReadingInput(String(prev + inc));
  };

  const handleQuickAddIncrement = (addQty: number) => {
    const prev = parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0;
    const currentNew = parseInt(newReadingInput.replace(/,/g, ''), 10) || prev;
    const target = currentNew < prev ? prev + addQty : currentNew + addQty;
    handleNewReadingChange(String(target));
  };

  // Touchpad input for shopfloor glove use
  const handleKeypadPress = (key: string) => {
    if (entryMode === 'MODE_1') {
      if (key === 'CLEAR') {
        setNewReadingInput('0');
        handleNewReadingChange('0');
      } else if (key === 'BACKSPACE') {
        const nextVal = newReadingInput.length > 1 ? newReadingInput.slice(0, -1) : '0';
        handleNewReadingChange(nextVal);
      } else {
        const nextVal = newReadingInput === '0' ? key : newReadingInput + key;
        handleNewReadingChange(nextVal);
      }
    } else if (entryMode === 'MODE_2') {
      if (key === 'CLEAR') {
        setMode2ActualShotsInput('');
      } else if (key === 'BACKSPACE') {
        setMode2ActualShotsInput(prev => prev.length > 1 ? prev.slice(0, -1) : '');
      } else {
        setMode2ActualShotsInput(prev => prev + key);
      }
    }
  };

  // Derived Values & Validations
  const prevShotsVal = useMemo(() => parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0, [previousReadingInput]);
  const newShotsVal = useMemo(() => parseInt(newReadingInput.replace(/,/g, ''), 10) || 0, [newReadingInput]);
  
  const incrementVal = useMemo(() => {
    if (entryMode === 'MODE_2') {
      return parseInt(mode2ActualShotsInput.replace(/,/g, ''), 10) || 0;
    }
    if (entryMode === 'MODE_3') {
      return plcBuffer;
    }
    if (enableSplitInterval) {
      const s1 = parseInt(splitPeriod1Shots.replace(/,/g, ''), 10) || 0;
      const s2 = parseInt(splitPeriod2Shots.replace(/,/g, ''), 10) || 0;
      return s1 + s2;
    }
    return newShotsVal - prevShotsVal;
  }, [entryMode, mode2ActualShotsInput, plcBuffer, newShotsVal, prevShotsVal, enableSplitInterval, splitPeriod1Shots, splitPeriod2Shots]);

  const resultingTotal = useMemo(() => prevShotsVal + incrementVal, [prevShotsVal, incrementVal]);

  const isIncrementPositive = incrementVal > 0;
  const isLowerReadingDetected = entryMode === 'MODE_1' && newShotsVal < prevShotsVal;
  const maxShiftLimit = systemSettings.maxShotsPerShift || 150000;
  const isAbnormalIncrease = incrementVal > maxShiftLimit;

  // Duplicate Check
  const isDuplicateEntry = useMemo(() => {
    return storageService.checkDuplicateShotEntry(selectedLineId, productionDate, shift);
  }, [selectedLineId, productionDate, shift, shotLogs]);

  // Active Tooling Configuration on Target Line
  const activeConfig = currentLine?.activeConfig || null;

  // Split periods payload if enabled
  const getSplitPeriodsPayload = (): ShotSplitPeriod[] | undefined => {
    if (!enableSplitInterval) return undefined;
    const s1 = parseInt(splitPeriod1Shots.replace(/,/g, ''), 10) || 0;
    const s2 = parseInt(splitPeriod2Shots.replace(/,/g, ''), 10) || 0;
    return [
      {
        configId: activeConfig?.id || `CFG-${selectedLineId}-1`,
        dieCode: activeConfig?.dieCode || 'PRIMARY-DIE',
        configurationSlot: activeConfig?.configurationSlot || 'Slot 1',
        shotsAdded: s1,
        timeInterval: splitPeriod1Time,
        reason: 'Period 1 Production'
      },
      {
        configId: `CFG-${selectedLineId}-2`,
        dieCode: `${activeConfig?.dieCode || 'DIE'}-ALT`,
        configurationSlot: 'Slot 2 (Model Changeover)',
        shotsAdded: s2,
        timeInterval: splitPeriod2Time,
        reason: 'Period 2 Post-Changeover Production'
      }
    ];
  };

  // Submission handler with Mode 2 Loss Time Catcher Check
  const handleOpenSubmissionPreview = () => {
    if (!operatorName.trim()) {
      showNotification('error', 'กรุณาระบุชื่อพนักงานผู้บันทึก (Operator Name is required) - บังคับลงชื่อพนักงานทุกครั้งก่อนทำรายการ');
      return;
    }
    if (entryMode === 'MODE_1' && isLowerReadingDetected) {
      showNotification('error', 'New Machine Reading is lower than Previous Reading. If a counter reset occurred, please use Counter Reset.');
      return;
    }
    if (!isIncrementPositive) {
      showNotification('error', 'Shot Increment must be greater than 0 (ยอดช็อตที่เพิ่มต้องมากกว่า 0)');
      return;
    }

    // MODE 2: OEE Loss Time Catcher Verification
    if (entryMode === 'MODE_2') {
      const actualVal = parseInt(mode2ActualShotsInput.replace(/,/g, ''), 10) || 0;
      if (actualVal < mode2ExpectedShots) {
        const missing = mode2ExpectedShots - actualVal;
        const lossMins = (missing / (spmInput || 100)).toFixed(1);
        setLossData({
          expected: mode2ExpectedShots,
          actual: actualVal,
          missing,
          lossMinutes: lossMins,
          lossType: 'COIL_CHANGE',
          reason: ''
        });
        setLossModalOpen(true);
        return;
      }
    }

    if (isDuplicateEntry && !allowMultiEntry) {
      showNotification('error', `Duplicate entry found for Line ${selectedLineId} on ${productionDate} (${shift}). Check "Allow Multi-Entry" if intentional.`);
      return;
    }

    const preview = storageService.previewShotSubmission({
      lineId: selectedLineId,
      shotsAdded: incrementVal,
      splitPeriods: getSplitPeriodsPayload()
    });

    setPreviewData(preview);
    setPreviewModalOpen(true);
  };

  const handleConfirmFinalSubmit = (customNotes?: string) => {
    if (!operatorName.trim()) {
      showNotification('error', 'กรุณาระบุชื่อพนักงานผู้บันทึก (Operator Name is strictly mandatory) ก่อนบันทึกข้อมูล');
      return;
    }
    const finalNotes = [notes, customNotes].filter(Boolean).join(' | ');

    const result = storageService.submitShotEntry({
      lineId: selectedLineId,
      productionDate,
      shift,
      inputMethod: entryMode === 'MODE_3' ? 'AUTOMATIC_PLC' : inputMethod,
      previousTotal: prevShotsVal,
      newTotal: resultingTotal,
      shotsAdded: incrementVal,
      entryReason,
      notes: finalNotes,
      operatorName: operatorName.trim(),
      draftId: activeDraftId || undefined,
      allowMultiEntry,
      splitPeriods: getSplitPeriodsPayload()
    });

    if (result.success && result.record) {
      setPreviewModalOpen(false);
      setLossModalOpen(false);
      setActiveDraftId(null);
      if (entryMode === 'MODE_3') setPlcBuffer(0);
      if (entryMode === 'MODE_2') setMode2ActualShotsInput('');
      showNotification('success', `SUBMITTED: +${incrementVal.toLocaleString()} shots on Line ${selectedLineId}. New Meter Total: ${resultingTotal.toLocaleString()} shots.`);
      setNotes('');
      reloadData();
    } else {
      showNotification('error', result.error || 'Submission failed.');
    }
  };

  const handleConfirmLossAndSubmit = () => {
    if (!operatorName.trim()) {
      showNotification('error', 'กรุณาระบุชื่อพนักงานผู้บันทึก (Operator Name is required)');
      return;
    }
    if (!lossReasonInput.trim()) {
      showNotification('error', 'กรุณาระบุรายละเอียด Action / Remarks สำหรับยอดที่สูญเสีย');
      return;
    }
    const lossNote = `[OEE LOSS: ${lossTypeInput} - ${lossData?.lossMinutes} min lost] ${lossReasonInput}`;
    handleConfirmFinalSubmit(lossNote);
  };

  const handleSaveDraft = () => {
    if (!operatorName.trim()) {
      showNotification('error', 'กรุณาระบุชื่อพนักงานผู้บันทึก (Operator Name is required) ก่อนบันทึกแบบร่าง (Draft)');
      return;
    }
    const draftRecord = storageService.saveShotDraft({
      id: activeDraftId || undefined,
      lineId: selectedLineId,
      configurationId: activeConfig?.id,
      configurationSlot: activeConfig?.configurationSlot,
      dieCode: activeConfig?.dieCode,
      productionDate,
      shift,
      inputMethod,
      previousTotal: prevShotsVal,
      newTotal: resultingTotal,
      shotsAdded: incrementVal,
      entryReason,
      notes,
      operatorName: operatorName.trim(),
      allowMultiEntry,
      splitPeriods: getSplitPeriodsPayload()
    });
    setActiveDraftId(draftRecord.id);
    showNotification('info', `Saved draft: ${draftRecord.id}`);
  };

  const handleExecuteCounterReset = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeter = parseInt(resetNewMeterInput.replace(/,/g, ''), 10);
    if (isNaN(newMeter) || newMeter < 0) {
      showNotification('error', 'กรุณาระบุเลขมิเตอร์ที่เป็นจำนวนเต็มบวกหรือ 0 (Please enter a valid non-negative counter reading)');
      return;
    }

    const isAll = resetTargetScope === 'ALL';
    const result = storageService.executeCounterReset({
      targetLine: resetTargetScope,
      lineId: isAll ? undefined : resetTargetScope,
      previousTotal: prevShotsVal,
      newResetTotal: newMeter,
      resetPartWear: resetPartWearOption,
      resetShiftCounters: resetShiftCountersOption,
      approvalId: resetApprovalIdInput,
      approvedBy: resetApprovedByInput,
      resetReason: resetReasonInput,
      shift,
      productionDate,
      notes: isAll
        ? `Factory-wide reset across all 8 lines to ${newMeter.toLocaleString()} shots (Parts reset: ${resetPartWearOption ? 'YES' : 'NO'}, Shift reset: ${resetShiftCountersOption ? 'YES' : 'NO'})`
        : `Line ${resetTargetScope} counter reset to ${newMeter.toLocaleString()} shots (Parts reset: ${resetPartWearOption ? 'YES' : 'NO'}, Shift reset: ${resetShiftCountersOption ? 'YES' : 'NO'})`
    });

    if (result.success) {
      setCounterResetModalOpen(false);
      const targetText = isAll ? 'ALL 8 LINES (E1-E6)' : `Line ${resetTargetScope}`;
      showNotification('success', `✅ รีเซ็ตช็อตสำเร็จ: ${targetText} -> ฐานใหม่ ${newMeter.toLocaleString()} ช็อต (เชื่อมต่อข้อมูล TV Monitor และทั้งระบบเรียบร้อย)`);
      setPreviousReadingInput(String(newMeter));
      setNewReadingInput(String(newMeter + 50000));
      reloadData();
    } else {
      showNotification('error', result.error || 'Counter reset failed');
    }
  };

  // Filtered History
  const filteredShotLogs = useMemo(() => {
    return shotLogs.filter(log => {
      if (historyLineFilter !== 'ALL' && log.lineId !== historyLineFilter) return false;
      if (historyShiftFilter !== 'ALL' && log.shift !== historyShiftFilter) return false;
      if (historySearch) {
        const query = historySearch.toLowerCase();
        const matchId = log.id.toLowerCase().includes(query);
        const matchOp = (log.operatorName || '').toLowerCase().includes(query);
        const matchNotes = (log.notes || '').toLowerCase().includes(query);
        if (!matchId && !matchOp && !matchNotes) return false;
      }
      return true;
    });
  }, [shotLogs, historyLineFilter, historyShiftFilter, historySearch]);

  const isHmi = systemSettings?.theme === 'hmi' || systemSettings?.theme === 'industrial-dark';

  return (
    <div className={`space-y-3 select-none ${isHmi ? 'font-mono' : 'font-sans'}`}>
      
      {/* Top Header: Integrated Line Bar + Terminal Header + Action Tabs (Sticky Locked at Top) */}
      <div className={`sticky top-0 z-30 backdrop-blur-md rounded-xl p-3 sm:p-4 shadow-2xl space-y-3 border ${
        isHmi 
          ? 'bg-black/95 border-2 border-green-500 text-green-400' 
          : 'bg-[#0E172A]/95 border-slate-800/90 text-slate-100'
      }`}>
        
        {/* Row 1: Terminal Title & Line Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${
              isHmi 
                ? 'bg-green-950 border-green-500 text-green-400' 
                : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
            }`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wider ${
                isHmi ? 'text-green-400 font-mono font-extrabold' : 'text-white font-["Plus_Jakarta_Sans"]'
              }`}>
                FIN DIE SHOT CONTROL TERMINAL (LINE {selectedLineId})
              </h2>
              <p className={`text-[11px] flex items-center gap-2 ${isHmi ? 'text-green-500/80 font-mono' : 'text-slate-400'}`}>
                <span>DIE: <strong className="text-cyan-300">{currentLine?.activeConfig?.dieCode || `FD-${selectedLineId}-07`}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{detectedShiftInfo.shiftName}</span>
              </p>
            </div>
          </div>

          {/* Line Selector Pills */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-1 custom-scrollbar flex-nowrap sm:flex-wrap">
            <LineFilterSelector
              selectedLine={selectedLineId}
              onSelectLine={(line) => setSelectedLineId(line)}
              isHmi={isHmi}
              label="LINE:"
            />
          </div>
        </div>

        {/* Row 2: Action Tabs & Help Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${
            isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 active:ring-4 ${
                activeTab === 'entry'
                  ? isHmi
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/30 font-extrabold ring-2 ring-green-300'
                    : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-bold ring-2 ring-cyan-300'
                  : isHmi
                    ? 'text-green-400 hover:bg-green-950/80'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>RECORD FORM</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 active:ring-4 ${
                activeTab === 'history'
                  ? isHmi
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/30 font-extrabold ring-2 ring-green-300'
                    : 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-bold ring-2 ring-cyan-300'
                  : isHmi
                    ? 'text-green-400 hover:bg-green-950/80'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>HISTORY ({shotLogs.length})</span>
            </button>

            <button
              onClick={() => setCounterResetModalOpen(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 active:ring-4 ${
                isHmi
                  ? 'bg-zinc-900 hover:bg-amber-950 text-amber-400 border-amber-600/70'
                  : 'bg-slate-900 hover:bg-amber-950/60 text-amber-300 border-amber-600/60'
              }`}
              title="รีเซ็ตมิเตอร์หน้าเครื่องเมื่อเปลี่ยนเกจใหม่"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>RESET METER</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showGuide
                ? isHmi ? 'bg-green-950 text-green-300 border-green-700' : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : isHmi ? 'bg-black text-green-400 border-green-900 hover:bg-zinc-900' : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showGuide ? 'HIDE GUIDE (ซ่อนคู่มือ)' : 'คู่มือการบันทึก (GUIDE)'}</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between shadow-lg ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' 
            : notification.type === 'error' 
            ? 'bg-rose-950/90 border-rose-500 text-rose-200' 
            : notification.type === 'warning' 
            ? 'bg-amber-950/90 border-amber-500 text-amber-200' 
            : isHmi
            ? 'bg-zinc-950 border-green-500 text-green-300'
            : 'bg-slate-900 border-cyan-500 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {notification.type === 'error' && <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {notification.type === 'info' && <Info className={`w-4 h-4 flex-shrink-0 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />}
            <span className="font-bold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white p-1 active:scale-90 active:bg-slate-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LINE OPERATIONAL STATUS WARNING (If line is STOPPED, IDLE, or MAINTENANCE) */}
      {currentLine?.machineStatus && currentLine.machineStatus !== 'RUNNING' && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg ${
          currentLine.machineStatus === 'STOPPED'
            ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
            : currentLine.machineStatus === 'IDLE'
            ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
            : 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse text-amber-300" />
            <div>
              <span className="font-extrabold uppercase font-sans text-sm block">
                ⚠️ สถานะสายการผลิต {selectedLineId}: {
                  currentLine.machineStatus === 'STOPPED' ? '🔴 STOPPED (ปิดไลน์ผลิต)' :
                  currentLine.machineStatus === 'IDLE' ? '🟡 IDLE (พักสายการผลิต / ไม่มีแผน)' :
                  '🔧 MAINTENANCE (ซ่อมบำรุง / ปรับเปลี่ยนแม่พิมพ์)'
                }
              </span>
              <p className="text-[11px] opacity-90 font-thai mt-0.5">
                สามารถเปลี่ยนสถานะสายการผลิตกลับเป็น RUNNING ได้ตลอดเวลาในหน้า "ศูนย์ตั้งค่าสายการผลิต (Line Settings)"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: MAIN ENTRY FORM (STREAMLINED MINIMALIST OPERATOR INTERFACE) */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Main Operator Form Column (Col 8) */}
          <div className={`lg:col-span-8 rounded-xl p-3.5 sm:p-4 space-y-4 shadow-xl border ${
            isHmi 
              ? 'bg-black border-2 border-green-500/90' 
              : 'bg-[#0E172A] border-slate-800/90'
          }`}>
            
            {/* Operator Instructions / Help Guide (Collapsible - Updated) */}
            {showGuide && (
              <div className={`p-3.5 sm:p-4 rounded-xl border text-xs space-y-3 animate-fadeIn ${
                isHmi ? 'bg-zinc-950 border-green-800 text-green-300' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                  <div className="space-y-2.5 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-1.5">
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isHmi ? 'text-green-400' : 'text-white'}`}>
                        คู่มือการใช้งานระบบบันทึกยอดช็อตและการสะสมอายุอะไหล่แม่พิมพ์ (SHOT ENTRY GUIDE)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700">
                        VERSION 2.4 - UPDATED
                      </span>
                    </div>

                    {/* Section 1: 3 Recording Modes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-thai">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono text-xs">
                          <Gauge className="w-3.5 h-3.5" />
                          MODE 1: MANUAL METER
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          กรอกตัวเลขมิเตอร์จริงที่อ่านได้จากหน้าตู้ควบคุม (Panel Meter) ระบบจะคำนวณผลต่างยอดช็อต <code className="text-emerald-400 font-mono font-bold">(New - Previous)</code> และสะสมเข้าอะไหล่อัตโนมัติ
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-xs">
                          <Activity className="w-3.5 h-3.5" />
                          MODE 2: SPM SIMULATION
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          คำนวณจากความเร็วรอบ SPM × เวลาทำงาน พร้อมระบบ <strong>หักเวลาพักเบรกอัตโนมัติ (Break Deduction 30-60 นาที)</strong> และระบบ <strong>Loss Time OEE Catcher</strong> บันทึกสาเหตุยอดสูญเสีย
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-mono text-xs">
                          <Cpu className="w-3.5 h-3.5" />
                          MODE 3: DIRECT PLC PULSE
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          รับสัญญาณ Pulse Counter จริงจากตู้คอนโทรล PLC อัตโนมัติ Real-Time โดยไม่ต้องคีย์ตัวเลขเอง
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Core Workflow & Mandatory Rules */}
                    <div className="text-xs space-y-1.5 font-thai leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ข้อกำหนดและการสะสมอายุอะไหล่แม่พิมพ์ (Key Rules & Accumulation):
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
                        <li>
                          <strong className="text-white">บังคับลงชื่อพนักงาน (Mandatory Operator Name):</strong> ช่องลงชื่อจะเริ่มต้นเป็นค่าว่างเสมอ และบังคับกรอกชื่อพนักงานผู้บันทึกทุกครั้งเพื่อความโปร่งใสของ Audit Trail
                        </li>
                        <li>
                          <strong className="text-white">การสะสมอายุอะไหล่ (Parts Wear Accumulation):</strong> ยอดผลต่างช็อตที่บันทึก (<span className="text-emerald-300 font-mono font-bold">+Shots Added</span>) จะถูกนำไปสะสมเข้าชิ้นส่วนอะไหล่แม่พิมพ์ทุกชิ้นที่ติดตั้งในสายผลิตนั้นทันที
                        </li>
                        <li>
                          <strong className="text-white">การเปลี่ยนแม่พิมพ์ในกะ (Multi-Die / Split Shift):</strong> หากมีการเปลี่ยนสลับแม่พิมพ์ระหว่างกะ ให้เลือก <em>"บันทึกแยกช่วงเวลาตามแม่พิมพ์ (Split Shift)"</em> เพื่อเฉลี่ยยอดช็อตตามแม่พิมพ์ที่ใช้งานจริง
                        </li>
                        <li>
                          <strong className="text-white">การรีเซ็ตมิเตอร์ (Counter Reset):</strong> หากมิเตอร์หน้าตู้ถูกหมุนกลับหรือเปลี่ยนเกจใหม่ ให้กดปุ่ม <strong>RESET METER</strong> ด้านบนเพื่อบันทึกฐานนับใหม่พร้อมลายเซ็นอนุมัติ
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3 Entry Mode Selector: Mode 1 (Manual Meter) vs Mode 2 (SPM Simulation + Break Deduction) vs Mode 3 (Direct PLC Pulse) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className={isHmi ? 'text-green-400' : 'text-cyan-300'}>SELECT SHOT RECORDING MODE (เลือกโหมดบันทึกข้อมูล):</span>
                <span className="text-[11px] text-slate-400 font-thai">รองรับ 3 รูปแบบตามหน้างานจริง</span>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-lg border ${
                isHmi ? 'bg-zinc-950 border-green-800' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setEntryMode('MODE_1')}
                  className={`py-2.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 active:ring-2 touch-manipulation ${
                    entryMode === 'MODE_1'
                      ? isHmi
                        ? 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30 ring-2 ring-green-300'
                        : 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                      : isHmi
                        ? 'text-green-400 hover:text-green-200'
                        : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Gauge className="w-4 h-4 flex-shrink-0" />
                  <span>MODE 1: MANUAL METER</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('MODE_2')}
                  className={`py-2.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 active:ring-2 touch-manipulation ${
                    entryMode === 'MODE_2'
                      ? isHmi
                        ? 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30 ring-2 ring-green-300'
                        : 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                      : isHmi
                        ? 'text-green-400 hover:text-green-200'
                        : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span>MODE 2: SPM SIMULATION</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryMode('MODE_3')}
                  className={`py-2.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 active:ring-2 touch-manipulation ${
                    entryMode === 'MODE_3'
                      ? isHmi
                        ? 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30 ring-2 ring-green-300'
                        : 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300'
                      : isHmi
                        ? 'text-green-400 hover:text-green-200'
                        : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-4 h-4 flex-shrink-0" />
                  <span>MODE 3: DIRECT / PLC</span>
                </button>
              </div>
            </div>

            {/* Core Operator Dropdowns: Production Line, Shift & Operator Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* 1. Production Line Dropdown */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                  isHmi ? 'text-green-400' : 'text-slate-300'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Gauge className={`w-4 h-4 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                    1. PRODUCTION LINE (สายการผลิต)
                  </span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedLineId}
                  onChange={e => setSelectedLineId(e.target.value as ProductionLineId)}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-bold font-mono focus:outline-none focus:ring-1 border transition-colors ${
                    isHmi
                      ? 'bg-zinc-950 border-2 border-green-500/80 text-green-300 focus:border-green-400 focus:ring-green-400'
                      : 'bg-slate-950 border-slate-700/90 text-white focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                >
                  {linesList.map(line => {
                    const lineCfg = allConfigs.find(c => c.lineId === line && (c.isActive || c.status === 'ACTIVE')) || allConfigs.find(c => c.lineId === line);
                    const lineDie = lineCfg?.dieCode || 'N/A';
                    const displayLine = line.startsWith('E3-') ? 'E3' : line;
                    const tag = LINE_INFO_MAP[line]?.shortTag || line;
                    return (
                      <option key={line} value={line} className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>
                        LINE {displayLine} ({tag}) | DIE: {lineDie}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Shift Dropdown (With Auto-detected Shift Hint) */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                  isHmi ? 'text-green-400' : 'text-slate-300'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                    2. SHIFT (กะการทำงาน)
                  </span>
                  <span className="text-emerald-400 text-[10px] font-mono">[AUTO: {detectedShiftInfo.shiftKey.slice(0, 7)}]</span>
                </label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-bold font-mono focus:outline-none focus:ring-1 border transition-colors ${
                    isHmi
                      ? 'bg-zinc-950 border-2 border-green-500/80 text-green-300 focus:border-green-400 focus:ring-green-400'
                      : 'bg-slate-950 border-slate-700/90 text-white focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                >
                  <option value="Shift 1 (Day)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 1 (DAY: 08:00 - 17:00 / 20:00)</option>
                  <option value="Shift 2 (Night)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 2 (NIGHT: 19:30 - 05:30 / 08:00)</option>
                  <option value="Shift 3 (Overtime)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 3 (OVERTIME: 17:30-21:30 / 06:30-07:30)</option>
                </select>
              </div>

              {/* 3. Operator Name Input (Strictly Mandatory) */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                  isHmi ? 'text-green-400' : 'text-slate-300'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <UserCheck className={`w-4 h-4 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                    3. OPERATOR NAME (ชื่อพนักงานผู้บันทึก)
                  </span>
                  <span className="text-rose-400 font-mono text-[10px] font-bold">(จำเป็นต้องลงชื่อ) *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={operatorName}
                    onChange={e => setOperatorName(e.target.value)}
                    placeholder="กรุณากรอกชื่อพนักงาน (บังคับลงชื่อ)..."
                    className={`w-full rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-bold font-mono focus:outline-none focus:ring-2 transition-all ${
                      !operatorName.trim()
                        ? 'border-2 border-rose-500/80 bg-rose-950/20 text-rose-200 placeholder-rose-400/60 focus:border-rose-400 focus:ring-rose-500/40'
                        : isHmi
                        ? 'bg-zinc-950 border-2 border-green-500/80 text-green-300 focus:border-green-400 focus:ring-green-400 placeholder-green-800'
                        : 'bg-slate-950 border border-slate-700/90 text-white focus:border-cyan-400 focus:ring-cyan-400 placeholder-slate-600'
                    }`}
                    required
                  />
                  {!operatorName.trim() && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-400 pointer-events-none">
                      ยังไม่ระบุชื่อ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Readouts & Extra Large Numeric Input for Active Mode */}
            <div className={`rounded-xl p-4 sm:p-5 space-y-4 shadow-inner border ${
              isHmi ? 'bg-zinc-950 border-2 border-green-500/80' : 'bg-slate-950 border border-slate-800/90'
            }`}>
              
              {/* Previous Reading & Calculated Result Header */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b ${
                isHmi ? 'border-green-900/80' : 'border-slate-800'
              }`}>
                <div className={`p-3 rounded-lg border ${
                  isHmi ? 'bg-black border-green-900' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${
                    isHmi ? 'text-green-500' : 'text-slate-400'
                  }`}>
                    PREVIOUS READING (ยอดอ่านเดิม)
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-0.5 ${
                    isHmi ? 'text-green-300' : 'text-slate-100'
                  }`}>
                    {formatShots(prevShotsVal)} <span className="text-xs font-normal text-slate-500">shots</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${
                  isHmi ? 'bg-black border-green-900' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${
                    isHmi ? 'text-green-500' : 'text-slate-400'
                  }`}>
                    {entryMode === 'MODE_1' ? 'CALCULATED INCREMENT (ยอดช็อตเพิ่ม)' : 'RESULTING METER (ยอดมิเตอร์สะสม)'}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-0.5 flex items-center justify-between ${
                    isHmi ? 'text-green-400' : 'text-emerald-400'
                  }`}>
                    <span>
                      {entryMode === 'MODE_1'
                        ? `+${formatShots(incrementVal)}`
                        : formatShots(resultingTotal)}
                    </span>
                    <span className="text-xs font-normal text-slate-500">shots</span>
                  </div>
                </div>
              </div>

              {/* ============================================== */}
              {/* MODE 1: PURE MANUAL METER READING INTERFACE   */}
              {/* ============================================== */}
              {entryMode === 'MODE_1' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs sm:text-sm font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
                      isHmi ? 'text-green-400 text-matrix-glow font-mono' : 'text-cyan-300'
                    }`}>
                      <Hash className="w-4 h-4" />
                      NEW READING (กรอกเลขมิเตอร์หน้าเครื่อง 100% Manual)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTouchKeypad(!showTouchKeypad)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-bold transition-colors ${
                        isHmi 
                          ? 'bg-green-950 text-green-300 border-green-600 hover:bg-green-900'
                          : 'bg-slate-900 text-cyan-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {showTouchKeypad ? '✕ HIDE KEYPAD' : '⌨ TOUCH KEYPAD'}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newReadingInput}
                      onChange={e => handleNewReadingChange(e.target.value)}
                      className={`w-full text-4xl sm:text-6xl font-black font-mono py-4 px-4 text-center rounded-xl tracking-wider focus:outline-none border-2 transition-all ${
                        isHmi
                          ? 'bg-black border-green-500 focus:border-green-300 text-green-400 box-matrix-glow selection:bg-green-500 selection:text-black'
                          : 'bg-slate-900 border-cyan-500/80 focus:border-cyan-300 text-cyan-400 selection:bg-cyan-500 selection:text-slate-950 shadow-inner'
                      }`}
                      placeholder="0"
                      required
                    />
                    <div className={`text-center text-xs mt-1 font-mono ${isHmi ? 'text-green-500/80' : 'text-slate-400'}`}>
                      Delta: <strong className={isHmi ? 'text-green-300' : 'text-emerald-400'}>+{formatShots(incrementVal)} shots</strong> ({newShotsVal.toLocaleString()} - {prevShotsVal.toLocaleString()})
                    </div>
                  </div>

                  {/* Quick Add Step Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isHmi ? 'text-green-500' : 'text-slate-400'}`}>
                      QUICK ADD (บวกยอดด่วน):
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                      {[5000, 10000, 25000, 50000, 100000].map(addQty => (
                        <button
                          key={addQty}
                          type="button"
                          onClick={() => handleQuickAddIncrement(addQty)}
                          className={`py-2 px-0.5 rounded-md text-[11px] sm:text-xs font-bold font-mono transition-all border active:scale-90 active:ring-2 touch-manipulation select-none flex items-center justify-center ${
                            isHmi
                              ? 'bg-black hover:bg-green-950 text-green-300 border-green-600 active:bg-green-400 active:text-black active:ring-green-400'
                              : 'bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border-slate-700/90 active:bg-cyan-400 active:text-slate-950 active:ring-cyan-300'
                          }`}
                        >
                          +{addQty >= 1000 ? `${addQty / 1000}k` : addQty}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* MODE 2: SPM MACHINE SIMULATION & DEDUCTION WITH LOSS CATCHER        */}
              {/* =================================================================== */}
              {entryMode === 'MODE_2' && (
                <div className="space-y-3.5 font-mono">
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    isHmi ? 'bg-black border-green-500' : 'bg-slate-900/90 border-cyan-500/80'
                  }`}>
                    
                    {/* Machine SPM Speed & Control Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-300">SPM SPEED (รอบ/นาที):</label>
                        <input
                          type="number"
                          min="10"
                          max="400"
                          value={spmInput}
                          onChange={e => setSpmInput(Math.max(1, parseInt(e.target.value) || 100))}
                          className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-center"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {!isMachineRunning ? (
                          <button
                            type="button"
                            onClick={handleStartMachine}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>START MACHINE</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStopMachine}
                            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 active:scale-95 transition-all animate-pulse"
                          >
                            <Square className="w-4 h-4 fill-current" />
                            <span>STOP MACHINE</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Timing & Break Deduction Metric Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">ELAPSED TIME</span>
                        <strong className="text-sm text-cyan-300">
                          {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-amber-400 block">BREAK DEDUCTION</span>
                        <strong className="text-sm text-amber-300">
                          -{mode2BreakMinutes.toFixed(1)} min
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-emerald-400 block">NET RUN TIME</span>
                        <strong className="text-sm text-emerald-300">
                          {mode2NetWorkingMinutes.toFixed(1)} min
                        </strong>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-purple-400 block">EXPECTED SHOTS</span>
                        <strong className="text-sm text-purple-300">
                          {mode2ExpectedShots.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Actual Shot Counter Input */}
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-slate-200 block">
                        ACTUAL SHOTS FROM MACHINE (กรอกยอดที่ผลิตได้จริง):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mode2ActualShotsInput}
                        onChange={e => setMode2ActualShotsInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder={String(mode2ExpectedShots || 45000)}
                        className="w-full text-3xl font-black font-mono py-3 px-4 text-center rounded-xl bg-slate-950 border-2 border-cyan-500/80 text-cyan-400 focus:outline-none"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Expected: <strong className="text-slate-200">{mode2ExpectedShots.toLocaleString()} shots</strong></span>
                        {incrementVal > 0 && incrementVal < mode2ExpectedShots && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Shortfall: -{(mode2ExpectedShots - incrementVal).toLocaleString()} shots
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* MODE 3: DIRECT / PLC PULSE MODE INTERFACE                           */}
              {/* =================================================================== */}
              {entryMode === 'MODE_3' && (
                <div className="space-y-3 font-mono">
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isHmi ? 'bg-black border-green-500' : 'bg-slate-900/90 border-cyan-500/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-300">PLC SENSOR STREAM ONLINE</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">LINE {selectedLineId}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase">UNCOMMITTED PLC PULSE BUFFER</span>
                      <div className="text-4xl font-black text-cyan-400">
                        +{plcBuffer.toLocaleString()} <span className="text-xs font-normal text-slate-500">shots</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">SIMULATE PLC PULSE TRIGGERS:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 10, 100, 1000].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => handleSendPlcPulse(qty)}
                            className="py-2.5 rounded-lg bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs active:scale-95 transition-all shadow"
                          >
                            +{qty >= 1000 ? `${qty / 1000}k` : qty} PULSE
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional On-Screen Touch Keypad for Shopfloor Gloves */}
              {showTouchKeypad && (
                <div className={`p-3 rounded-lg grid grid-cols-3 gap-2.5 text-xl font-bold font-mono animate-fadeIn mt-2 border ${
                  isHmi ? 'bg-black border-green-500' : 'bg-slate-900 border-slate-700'
                }`}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACKSPACE'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      className={`py-3.5 rounded-lg border font-mono font-black transition-all active:scale-90 active:ring-4 touch-manipulation select-none flex items-center justify-center ${
                        key === 'CLEAR'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900 text-sm active:bg-rose-500 active:text-black active:ring-rose-400'
                          : key === 'BACKSPACE'
                          ? isHmi
                            ? 'bg-zinc-900 border-green-700 text-green-300 hover:bg-zinc-800 text-sm active:bg-green-500 active:text-black active:ring-green-400'
                            : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 text-sm active:bg-cyan-400 active:text-slate-950 active:ring-cyan-300'
                          : isHmi
                            ? 'bg-zinc-950 border-2 border-green-500/80 text-green-400 hover:bg-green-950 text-2xl active:bg-green-400 active:text-black active:ring-green-400 shadow-lg shadow-green-500/20'
                            : 'bg-slate-950 border-2 border-slate-700 text-slate-100 hover:bg-cyan-950/40 text-2xl active:bg-cyan-400 active:text-slate-950 active:ring-cyan-300 shadow-lg shadow-cyan-500/20'
                      }`}
                    >
                      {key === 'BACKSPACE' ? <Delete className="w-6 h-6 stroke-[2.5]" /> : key}
                    </button>
                  ))}
                </div>
              )}

              {/* Lower Reading Alert / Warning */}
              {isLowerReadingDetected && (
                <div className="p-3 bg-amber-950/90 border border-amber-500 rounded-lg text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">METER READING LOWER THAN PREVIOUS (ตรวจพบเลขมิเตอร์ต่ำกว่าเดิม)</div>
                    <div>
                      New Reading ({newShotsVal.toLocaleString()}) cannot be less than Previous Reading ({prevShotsVal.toLocaleString()}).
                      If gauge was reset or replaced, please use the Reset Meter button.
                    </div>
                  </div>
                </div>
              )}

              {/* Abnormal Increase Alert */}
              {isAbnormalIncrease && (
                <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-lg text-xs text-rose-200 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">HIGH INCREMENT WARNING (+{incrementVal.toLocaleString()} shots)</div>
                    <div>Increment exceeds standard single-shift limit of {maxShiftLimit.toLocaleString()} shots. Please verify before submitting.</div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Large Primary Submit Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleOpenSubmissionPreview}
                disabled={!isIncrementPositive || isLowerReadingDetected}
                className={`w-full py-4 sm:py-5 px-6 rounded-xl text-lg sm:text-xl font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-wider shadow-xl active:scale-95 active:ring-8 touch-manipulation select-none ${
                  !isIncrementPositive || isLowerReadingDetected
                    ? isHmi 
                      ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : isHmi
                      ? 'bg-green-500 hover:bg-green-400 text-black font-black shadow-green-500/30 ring-2 ring-green-300 active:ring-green-300 active:bg-green-300 font-mono'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/25 ring-2 ring-cyan-400 active:ring-cyan-300 active:bg-cyan-300'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                <span>บันทึกข้อมูล (SUBMIT SHOTS +{formatShots(incrementVal)})</span>
              </button>

              {/* Secondary Options (Date, Note, Save Draft) */}
              <div className={`flex items-center justify-between gap-3 flex-wrap text-xs ${
                isHmi ? 'text-green-500/80' : 'text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-3.5 h-3.5 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                  <span>Date:</span>
                  <input
                    type="date"
                    value={productionDate}
                    onChange={e => setProductionDate(e.target.value)}
                    className={`rounded px-2.5 py-1.5 text-xs font-mono border active:ring-2 ${
                      isHmi 
                        ? 'bg-black border-green-800 text-green-300 active:ring-green-400' 
                        : 'bg-slate-950 border-slate-700 text-slate-200 active:ring-cyan-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-all active:scale-95 active:ring-2 touch-manipulation ${
                      isHmi
                        ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border-green-800 active:bg-green-500 active:text-black active:ring-green-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 active:bg-cyan-400 active:text-slate-950 active:ring-cyan-400'
                    }`}
                  >
                    SAVE DRAFT
                  </button>
                  <button
                    type="button"
                    onClick={reloadData}
                    className={`px-3 py-1.5 rounded text-xs font-bold border transition-all active:scale-95 active:ring-2 touch-manipulation ${
                      isHmi
                        ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border-green-800 active:bg-green-500 active:text-black active:ring-green-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 active:bg-cyan-400 active:text-slate-950 active:ring-cyan-400'
                    }`}
                  >
                    RESET
                  </button>
                </div>
              </div>
            </div>

            

          </div>

          {/* Right Column: Line Status Telemetry & Die Overview (Col 4) */}
          <div className={`lg:col-span-4 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl border ${
            isHmi 
              ? 'bg-black border-2 border-green-500/80' 
              : 'bg-[#0E172A] border-slate-800/90'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isHmi ? 'border-green-900' : 'border-slate-800'
            }`}>
              <div>
                <h3 className={`font-bold text-base uppercase tracking-wider ${
                  isHmi ? 'text-green-400 font-extrabold font-mono' : 'text-white'
                }`}>
                  LINE {selectedLineId} TELEMETRY
                </h3>
                <span className={`text-[10px] font-mono ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>
                  ACTIVE DIE & SHOT WEAR
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${
                (currentLine?.machineStatus || 'RUNNING') === 'RUNNING' 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                  : (currentLine?.machineStatus) === 'IDLE'
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : (currentLine?.machineStatus) === 'MAINTENANCE'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                  : 'bg-rose-950 text-rose-300 border-rose-600'
              }`}>
                {currentLine?.machineStatus === 'RUNNING' && '🟢 RUNNING'}
                {currentLine?.machineStatus === 'IDLE' && '🟡 IDLE'}
                {currentLine?.machineStatus === 'MAINTENANCE' && '🔧 MAINTENANCE'}
                {currentLine?.machineStatus === 'STOPPED' && '🔴 STOPPED'}
                {(!currentLine?.machineStatus) && '🟢 RUNNING'}
              </span>
            </div>

            {/* Line Overview Metrics */}
            <div className="space-y-3 font-mono">
              <div className={`p-3 rounded-lg border space-y-1 ${
                isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className={`text-[10px] uppercase ${isHmi ? 'text-green-500' : 'text-slate-400'}`}>
                  ACTIVE DIE CODE
                </div>
                <div className={`text-lg font-bold truncate ${isHmi ? 'text-green-300' : 'text-cyan-300'}`}>
                  {currentLine?.activeConfig?.dieCode || `DIE-L${selectedLineId}-01`}
                </div>
                <div className={`text-[10px] ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>
                  Model: {currentLine?.activeConfig?.modelName || 'Air Conditioner Evaporator'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-lg border ${
                  isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className={`text-[10px] ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>CURRENT SHIFT</div>
                  <div className={`text-base font-bold mt-0.5 ${isHmi ? 'text-green-300' : 'text-slate-100'}`}>
                    {formatShots(currentLine?.shiftShot || 0)}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className={`text-[10px] ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>TODAY TOTAL</div>
                  <div className={`text-base font-bold mt-0.5 ${isHmi ? 'text-green-300' : 'text-slate-100'}`}>
                    {formatShots(currentLine?.dailyShot || 0)}
                  </div>
                </div>
              </div>

              {/* Operator Info */}
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className={`flex items-center gap-1.5 font-bold ${isHmi ? 'text-green-400' : 'text-cyan-300'}`}>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>LOGGED OPERATOR:</span>
                </div>
                <div className={`font-mono font-bold ${isHmi ? 'text-green-300' : 'text-slate-200'}`}>
                  {operatorName} <span className="text-[10px] text-slate-400 font-normal">({currentUser.role})</span>
                </div>
              </div>

              {/* Live Impact Preview: Parts Shot Accumulation on Line */}
              <div className={`p-3 rounded-lg border space-y-2.5 ${
                isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isHmi ? 'text-green-400' : 'text-cyan-300'
                  }`}>
                    <Layers className="w-4 h-4" />
                    <span>PARTS WEAR ACCUMULATION</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isHmi ? 'bg-green-950 text-green-300 border border-green-700' : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  }`}>
                    +{formatShots(incrementVal)} shots
                  </span>
                </div>

                <p className={`text-[11px] font-thai leading-tight ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>
                  ยอดช็อต +{formatShots(incrementVal)} จะถูกนำไปสะสมเพิ่มเข้าชิ้นส่วนแม่พิมพ์ทุกรายการประจำสาย {selectedLineId}:
                </p>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {currentLine?.items?.slice(0, 10).map((item, idx) => {
                    const curShot = item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0);
                    const newShot = curShot + incrementVal;
                    const limit = item.lifeLimit || 18000000;
                    const usagePct = Math.round((newShot / limit) * 100);

                    let statusBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
                    if (usagePct >= 100) statusBadgeClass = 'bg-rose-950 text-rose-300 border-rose-700 font-bold animate-pulse';
                    else if (usagePct >= 85) statusBadgeClass = 'bg-amber-950 text-amber-300 border-amber-700 font-bold';

                    return (
                      <div key={item.slotId || idx} className={`p-2 rounded border text-xs font-mono space-y-1 transition-colors ${
                        isHmi ? 'bg-black border-green-900/80 hover:border-green-600' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold truncate max-w-[160px] ${isHmi ? 'text-green-300' : 'text-slate-200'}`}>
                            {item.stagePunchDie || item.partName}
                          </span>
                          <span className={`text-[10px] px-1 py-0.5 rounded border ${statusBadgeClass}`}>
                            {usagePct}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{formatShots(curShot)} → <strong className={isHmi ? 'text-green-400' : 'text-emerald-400'}>{formatShots(newShot)}</strong></span>
                          <span className="text-[10px] text-slate-500">Max: {formatShots(limit)}</span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all ${
                              usagePct >= 100 ? 'bg-rose-500' : usagePct >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, usagePct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SHOT LOG HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className={`rounded-xl p-4 sm:p-5 space-y-4 shadow-xl border ${
          isHmi ? 'bg-black border-2 border-green-500' : 'bg-[#0E172A] border-slate-800/90'
        }`}>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${
            isHmi ? 'border-green-900' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`font-bold text-base uppercase tracking-wider ${
                isHmi ? 'text-green-400 font-extrabold font-mono' : 'text-white'
              }`}>
                HISTORICAL SHOT LOGS ({filteredShotLogs.length} RECORDS)
              </h3>
              <p className={`text-xs ${isHmi ? 'text-green-600' : 'text-slate-400'}`}>
                ประวัติการบันทึกช็อตรายกะและข้อมูลซิงค์ PLC
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => {
                  const data = filteredShotLogs;
                  const headers = 'Log ID,Production Date,Line ID,Shift,Input Method,Previous Total,New Total,Shots Added,Operator,Reason,Notes,Timestamp\n';
                  const rows = data.map(log => 
                    `"${log.id}","${log.productionDate}","${log.lineId}","${log.shift}","${log.inputMethod}",${log.previousTotal},${log.newTotal},${log.shotsAdded},"${log.operatorName || ''}","${log.entryReason || ''}","${(log.notes || '').replace(/"/g, '""')}","${log.timestamp}"`
                  ).join('\n');
                  
                  const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Shot_Accumulation_Logs_${new Date().toISOString().substring(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className={`px-3 py-1 rounded font-bold font-mono transition-all flex items-center gap-1.5 border shadow ${
                  isHmi 
                    ? 'bg-green-500 text-black border-green-400 hover:bg-green-400 font-extrabold' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT CSV (ส่งออกไฟล์ CSV)</span>
              </button>

              <select
                value={historyLineFilter}
                onChange={e => setHistoryLineFilter(e.target.value)}
                className={`rounded px-2.5 py-1 font-mono border ${
                  isHmi 
                    ? 'bg-zinc-950 border-green-700 text-green-300' 
                    : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <option value="ALL">ALL LINES</option>
                {linesList.map(line => {
                  const displayLine = line.startsWith('E3-') ? 'E3' : line;
                  const tag = LINE_INFO_MAP[line]?.shortTag || line;
                  return (
                    <option key={line} value={line}>Line {displayLine} ({tag})</option>
                  );
                })}
              </select>

              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search logs..."
                className={`rounded px-2.5 py-1 font-mono border ${
                  isHmi
                    ? 'bg-zinc-950 border-green-700 text-green-300 placeholder:text-green-800'
                    : 'bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>

          <div className={`overflow-x-auto custom-scrollbar border rounded-lg ${
            isHmi ? 'border-green-900' : 'border-slate-800'
          }`}>
            <table className="w-full text-left text-sm sm:text-base font-mono">
              <thead className={`uppercase border-b text-sm font-black tracking-wide ${
                isHmi ? 'bg-zinc-950 text-green-400 border-green-800' : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}>
                <tr>
                  <th className="py-3 px-3.5">RECORD ID</th>
                  <th className="py-3 px-3.5">LINE</th>
                  <th className="py-3 px-3.5">DATE / SHIFT</th>
                  <th className="py-3 px-3.5">METHOD</th>
                  <th className="py-3 px-3.5 text-right">PREVIOUS</th>
                  <th className="py-3 px-3.5 text-right">INCREMENT</th>
                  <th className="py-3 px-3.5 text-right">NEW TOTAL</th>
                  <th className="py-3 px-3.5">OPERATOR</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm font-bold ${
                isHmi ? 'divide-green-950 text-green-300' : 'divide-slate-800/60 text-slate-200'
              }`}>
                {filteredShotLogs.map(log => (
                  <tr key={log.id} className={`transition-colors ${
                    isHmi ? 'hover:bg-green-950/40' : 'hover:bg-slate-900/60'
                  }`}>
                    <td className={`py-3 px-3.5 font-bold ${isHmi ? 'text-green-400' : 'text-cyan-400'}`}>{log.id}</td>
                    <td className="py-3 px-3.5">LINE {log.lineId}</td>
                    <td className="py-3 px-3.5">{log.productionDate} ({log.shift})</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        log.inputMethod === 'AUTOMATIC_PLC'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : isHmi
                          ? 'bg-green-950 text-green-300 border border-green-700'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      }`}>
                        {log.inputMethod || 'MANUAL'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-400 font-mono">{formatShots(log.previousTotal)}</td>
                    <td className={`py-3 px-3.5 text-right font-black ${isHmi ? 'text-green-400' : 'text-emerald-400'}`}>+{formatShots(log.shotsAdded)}</td>
                    <td className={`py-3 px-3.5 text-right font-black text-base ${isHmi ? 'text-green-300' : 'text-slate-100'}`}>{formatShots(log.newTotal)}</td>
                    <td className="py-3 px-3.5 text-slate-300 truncate max-w-[140px]">{log.operatorName || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION & REVIEW MODAL */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-scaleUp font-mono border ${
            isHmi 
              ? 'bg-black border-2 border-green-500 text-green-300' 
              : 'bg-[#0E172A] border-slate-700 text-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isHmi ? 'border-green-900' : 'border-slate-800'
            }`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${
                isHmi ? 'text-green-400' : 'text-white'
              }`}>
                <CheckCircle2 className={`w-5 h-5 ${isHmi ? 'text-green-400' : 'text-emerald-400'}`} />
                CONFIRM SHOT RECORDING
              </h3>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-4 rounded-lg border space-y-2.5 text-xs ${
              isHmi ? 'bg-zinc-950 border-green-900' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className={`flex justify-between py-1 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/80'}`}>
                <span className="text-slate-400">TARGET LINE:</span>
                <span className={`font-bold ${isHmi ? 'text-green-400' : 'text-cyan-300'}`}>LINE {selectedLineId}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/80'}`}>
                <span className="text-slate-400">SHIFT & DATE:</span>
                <span className="font-bold text-slate-200">{shift} | {productionDate}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/80'}`}>
                <span className="text-slate-400">PREVIOUS METER:</span>
                <span className="font-mono text-slate-300">{formatShots(prevShotsVal)} shots</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/80'}`}>
                <span className="text-slate-400">ADDED INCREMENT:</span>
                <span className={`font-bold font-mono text-base ${isHmi ? 'text-green-400' : 'text-emerald-400'}`}>+{formatShots(incrementVal)} shots</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">NEW METER TOTAL:</span>
                <span className={`font-extrabold font-mono text-base ${isHmi ? 'text-green-400' : 'text-cyan-300'}`}>{formatShots(resultingTotal)} shots</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSubmit}
                className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg ${
                  isHmi
                    ? 'bg-green-500 hover:bg-green-400 text-black font-black shadow-green-500/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/25'
                }`}
              >
                CONFIRM & COMMIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTER & SHOT RESET MODAL */}
      {counterResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className={`border rounded-xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl font-mono ${
            isHmi 
              ? 'bg-black border-amber-500 text-amber-300' 
              : 'bg-[#0E172A] border-amber-500/80 text-amber-200'
          }`}>
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <h3 className="font-bold text-amber-400 text-sm sm:text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <span>SHOT & METER RESET (ระบบรีเซ็ตช็อตและมิเตอร์)</span>
              </h3>
              <button onClick={() => setCounterResetModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCounterReset} className="space-y-3.5 text-xs">
              {/* 1. Target Scope Selector */}
              <div>
                <label className="block text-amber-400 font-bold mb-1.5 uppercase tracking-wider">
                  1. TARGET PRODUCTION LINE (เลือกสายการผลิตที่ต้องการรีเซ็ต) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResetTargetScope('ALL')}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      resetTargetScope === 'ALL'
                        ? 'bg-amber-500 text-black font-extrabold border-amber-300 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">🌐</span>
                    <div>
                      <div className="font-bold text-xs">ALL LINES (ทุกไลน์)</div>
                      <div className="text-[10px] opacity-80">8 สาย (E1, E2, E3, E4, E5, E6)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetTargetScope(selectedLineId)}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      resetTargetScope !== 'ALL'
                        ? 'bg-amber-500 text-black font-extrabold border-amber-300 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">🎯</span>
                    <div>
                      <div className="font-bold text-xs">CURRENT LINE ({selectedLineId})</div>
                      <div className="text-[10px] opacity-80">เฉพาะสาย {selectedLineId}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Reset Scope Checkboxes */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2.5">
                <label className="block text-amber-400 font-bold uppercase tracking-wider">
                  2. RESET ACTIONS & SYNCHRONIZATION (รายการที่จะรีเซ็ตและเชื่อมต่อระบบ)
                </label>
                
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="checkbox"
                    checked={resetPartWearOption}
                    onChange={e => setResetPartWearOption(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                  />
                  <div>
                    <strong className="text-amber-300">Reset Tooling Parts Wear to 0 (รีเซ็ตยอดสะสมชิ้นส่วนอะไหล่ทั้งหมดเป็น 0)</strong>
                    <p className="text-[10.5px] text-slate-400">
                      ชิ้นส่วนแม่พิมพ์ทุกชิ้น (Punches, Dies, Blades) จะรีเซ็ตยอดใช้งานเป็น 0 ช็อต (0% NORMAL) และอัปเดตบน TV Monitor ทันที
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 hover:text-white">
                  <input
                    type="checkbox"
                    checked={resetShiftCountersOption}
                    onChange={e => setResetShiftCountersOption(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                  />
                  <div>
                    <strong className="text-amber-300">Reset Shift, Daily & Monthly Tallies (รีเซ็ตยอดช็อตประจำกะ / วัน / เดือน)</strong>
                    <p className="text-[10.5px] text-slate-400">
                      รีเซ็ตตัวนับการผลิตของรอบกะ, วัน และเดือนให้เริ่มต้นนับ 0 ช็อตใหม่
                    </p>
                  </div>
                </label>
              </div>

              {/* 3. New Meter Base Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-amber-400 font-bold uppercase tracking-wider">
                    3. NEW BASE METER READING (เลขมิเตอร์ตั้งต้นใหม่) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetNewMeterInput('0')}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 font-bold"
                  >
                    SET TO 0 SHOTS
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={resetNewMeterInput}
                  onChange={e => setResetNewMeterInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-amber-500/80 rounded-lg p-2.5 text-amber-300 font-mono text-xl font-bold tracking-wider"
                  required
                />
              </div>

              {/* 4. Reason & Approver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">APPROVAL ID (รหัสอนุมัติ) *</label>
                  <input
                    type="text"
                    value={resetApprovalIdInput}
                    onChange={e => setResetApprovalIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">APPROVED BY (ผู้อนุมัติ) *</label>
                  <input
                    type="text"
                    value={resetApprovedByInput}
                    onChange={e => setResetApprovedByInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">RESET REASON / ACTION (เหตุผลการรีเซ็ต) *</label>
                <input
                  type="text"
                  value={resetReasonInput}
                  onChange={e => setResetReasonInput(e.target.value)}
                  placeholder="เช่น New Die Setup / Full Routine Calibration / เปลี่ยนมิเตอร์เกจใหม่"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              {/* Preview Impact Summary Box */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 rounded-lg text-cyan-200 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <span>ℹ️</span>
                  <span>SYSTEM SYNCHRONIZATION SUMMARY:</span>
                </div>
                <p>
                  • ข้อมูลจะถูกบันทึกและเชื่อมต่ออัปเดตแบบ Real-time ไปยัง <strong>TV Monitoring Wall</strong>, <strong>Shot Entry Terminal</strong>, <strong>Tooling Master Hub</strong>, <strong>Stock & Reports</strong> ทันที
                </p>
                <p>
                  • เป้าหมาย: <strong className="text-amber-300">{resetTargetScope === 'ALL' ? 'ทุกสายการผลิต 8 สาย (E1-E6)' : `เฉพาะสาย ${resetTargetScope}`}</strong>
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCounterResetModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold uppercase shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-black" />
                  <span>CONFIRM & EXECUTE RESET</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OEE LOSS TIME CATCHER MODAL (Triggered when Actual Shots < Expected Shots in Mode 2) */}
      {lossModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E172A] border-2 border-rose-500 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
              <h3 className="font-bold text-rose-400 text-base flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
                OEE LOSS TIME DETECTED (บันทึก Loss Time)
              </h3>
              <button onClick={() => setLossModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">EXPECTED SHOTS:</span>
                <strong className="text-slate-200">{mode2ExpectedShots.toLocaleString()} shots</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ACTUAL PRODUCED:</span>
                <strong className="text-cyan-300">{incrementVal.toLocaleString()} shots</strong>
              </div>
              <div className="flex justify-between text-rose-400 font-bold border-t border-rose-900/60 pt-1">
                <span>SHORTFALL LOSS:</span>
                <span>-{Math.max(0, mode2ExpectedShots - incrementVal).toLocaleString()} shots (~{((Math.max(0, mode2ExpectedShots - incrementVal)) / (spmInput || 100)).toFixed(1)} mins)</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  1. PRIMARY LOSS CATEGORY (สาเหตุหลักที่ยอดขาด) *
                </label>
                <select
                  value={lossTypeInput}
                  onChange={e => setLossTypeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                >
                  <option value="COIL_CHANGE">Coil / Material Change (เปลี่ยนคอยล์/รอวัตถุดิบ)</option>
                  <option value="DIE_JAM">Die Jam / Breakdown (แม่พิมพ์ติดขัด/พัง)</option>
                  <option value="BLADE_PUNCH_CHANGE">Blade / Punch Change (เปลี่ยนใบมีด/พันช์)</option>
                  <option value="QUALITY_CHECK">Quality Inspection (ตรวจสอบคุณภาพชิ้นงาน)</option>
                  <option value="SPEED_LOSS">Minor Stoppages / Speed Loss (หยุดย่อย/ลดความเร็ว)</option>
                  <option value="OTHER">Other Unplanned Downtime (อื่นๆ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  2. LOSS REMARKS & ACTION TAKEN (หมายเหตุการแก้ไข)
                </label>
                <textarea
                  rows={2}
                  value={lossReasonInput}
                  onChange={e => setLossReasonInput(e.target.value)}
                  placeholder="ระบุสาเหตุเพิ่มเติมและการแก้ไข..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLossModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 text-slate-400 rounded-lg text-xs font-bold border border-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLossModalOpen(false);
                    const calcMins = ((Math.max(0, mode2ExpectedShots - incrementVal)) / (spmInput || 100)).toFixed(1);
                    setNotes(prev => prev ? `${prev} | Loss [${lossTypeInput}: ${calcMins}m] ${lossReasonInput}` : `Loss [${lossTypeInput}: ${calcMins}m] ${lossReasonInput}`);
                    showNotification('warning', `Loss time noted: ${calcMins} mins (${lossTypeInput}). Proceeding with preview.`);
                    handleOpenSubmissionPreview();
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-rose-600/30"
                >
                  LOG LOSS & PROCEED
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
