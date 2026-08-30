import React, { useState, useEffect, useMemo } from 'react';
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
  Delete
} from 'lucide-react';
import { 
  ProductionLineId, 
  ShotEntryRecord, 
  LineLiveMonitoringData, 
  ShotInputMethod, 
  ShotSplitPeriod, 
  LineActiveConfiguration 
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

interface ShotEntryViewProps {
  initialLineId?: ProductionLineId;
}

export const ShotEntryView: React.FC<ShotEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'drafts'>('entry');

  // Input Fields
  const [inputMethod, setInputMethod] = useState<ShotInputMethod>('METER_READING');
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [shift, setShift] = useState<'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)'>('Shift 1 (Day)');
  const [entryReason, setEntryReason] = useState<string>('Daily Shift Production (การผลิตประจำกะ)');
  const [notes, setNotes] = useState<string>('');
  const [allowMultiEntry, setAllowMultiEntry] = useState<boolean>(false);
  const [showTouchKeypad, setShowTouchKeypad] = useState<boolean>(false);

  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Meter Reading States
  const [previousReadingInput, setPreviousReadingInput] = useState<string>('0');
  const [newReadingInput, setNewReadingInput] = useState<string>('0');
  const [shotIncrementInput, setShotIncrementInput] = useState<string>('50000');

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
  const [resetNewMeterInput, setResetNewMeterInput] = useState<string>('0');
  const [resetApprovalIdInput, setResetApprovalIdInput] = useState<string>('RST-APPR-2026-001');
  const [resetApprovedByInput, setResetApprovedByInput] = useState<string>(currentUser.name || 'Somchai Prasert');
  const [resetReasonInput, setResetReasonInput] = useState<string>('Physical Gauge Replacement (เปลี่ยนมิเตอร์วัดรอบใหม่)');

  // History Filters
  const [historyLineFilter, setHistoryLineFilter] = useState<string>('ALL');
  const [historyShiftFilter, setHistoryShiftFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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
      if (inputMethod === 'METER_READING') {
        const inc = parseInt(shotIncrementInput.replace(/,/g, ''), 10) || 50000;
        setNewReadingInput(String(prevTotal + inc));
      } else {
        const inc = parseInt(shotIncrementInput.replace(/,/g, ''), 10) || 50000;
        setNewReadingInput(String(prevTotal + inc));
      }
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, [selectedLineId]);

  // Sync calculations between Method A (Meter Reading) and Method B (Direct Increment)
  const handleNewReadingChange = (val: string) => {
    // Filter only digits
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
    if (inputMethod === 'METER_READING') {
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
    } else {
      if (key === 'CLEAR') {
        setShotIncrementInput('0');
        handleIncrementChange('0');
      } else if (key === 'BACKSPACE') {
        const nextVal = shotIncrementInput.length > 1 ? shotIncrementInput.slice(0, -1) : '0';
        handleIncrementChange(nextVal);
      } else {
        const nextVal = shotIncrementInput === '0' ? key : shotIncrementInput + key;
        handleIncrementChange(nextVal);
      }
    }
  };

  // Derived Values & Validations
  const prevShotsVal = useMemo(() => parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0, [previousReadingInput]);
  const newShotsVal = useMemo(() => parseInt(newReadingInput.replace(/,/g, ''), 10) || 0, [newReadingInput]);
  
  const incrementVal = useMemo(() => {
    if (enableSplitInterval) {
      const s1 = parseInt(splitPeriod1Shots.replace(/,/g, ''), 10) || 0;
      const s2 = parseInt(splitPeriod2Shots.replace(/,/g, ''), 10) || 0;
      return s1 + s2;
    }
    if (inputMethod === 'METER_READING') {
      return newShotsVal - prevShotsVal;
    }
    return parseInt(shotIncrementInput.replace(/,/g, ''), 10) || 0;
  }, [inputMethod, newShotsVal, prevShotsVal, shotIncrementInput, enableSplitInterval, splitPeriod1Shots, splitPeriod2Shots]);

  const resultingTotal = useMemo(() => prevShotsVal + incrementVal, [prevShotsVal, incrementVal]);

  const isIncrementPositive = incrementVal > 0;
  const isLowerReadingDetected = inputMethod === 'METER_READING' && newShotsVal < prevShotsVal;
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

  // --- Submissions ---

  const handleOpenSubmissionPreview = () => {
    if (isLowerReadingDetected) {
      showNotification('error', 'New Machine Reading is lower than Previous Reading. If a counter reset occurred, please use Counter Reset.');
      return;
    }
    if (!isIncrementPositive) {
      showNotification('error', 'Shot Increment must be greater than 0 (ยอดช็อตที่เพิ่มต้องมากกว่า 0)');
      return;
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

  const handleConfirmFinalSubmit = () => {
    const result = storageService.submitShotEntry({
      lineId: selectedLineId,
      productionDate,
      shift,
      inputMethod,
      previousTotal: prevShotsVal,
      newTotal: resultingTotal,
      shotsAdded: incrementVal,
      entryReason,
      notes,
      draftId: activeDraftId || undefined,
      allowMultiEntry,
      splitPeriods: getSplitPeriodsPayload()
    });

    if (result.success && result.record) {
      setPreviewModalOpen(false);
      setActiveDraftId(null);
      showNotification('success', `SUBMITTED: +${incrementVal.toLocaleString()} shots on Line ${selectedLineId}. New Meter Total: ${resultingTotal.toLocaleString()} shots.`);
      setNotes('');
      reloadData();
    } else {
      showNotification('error', result.error || 'Submission failed.');
    }
  };

  const handleSaveDraft = () => {
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
      showNotification('error', 'Please enter a valid non-negative counter reading.');
      return;
    }

    const result = storageService.executeCounterReset({
      lineId: selectedLineId,
      previousTotal: prevShotsVal,
      newResetTotal: newMeter,
      approvalId: resetApprovalIdInput,
      approvedBy: resetApprovedByInput,
      resetReason: resetReasonInput,
      shift,
      productionDate,
      notes: `Counter reset from ${prevShotsVal.toLocaleString()} -> ${newMeter.toLocaleString()}`
    });

    if (result.success) {
      setCounterResetModalOpen(false);
      showNotification('success', `Counter Reset for Line ${selectedLineId}. New base: ${newMeter.toLocaleString()} shots.`);
      reloadData();
    } else {
      showNotification('error', result.error || 'Counter reset failed');
    }
  };

  // Quick PLC Pulse Simulation
  const handleQuickPulse = (qty: number) => {
    storageService.addShotEntry(selectedLineId, qty, 'AUTOMATIC_PLC', shift, `Optical sensor pulse +${qty.toLocaleString()}`);
    showNotification('success', `[PLC PULSE] Added +${qty.toLocaleString()} shots to Line ${selectedLineId}`);
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
      
      {/* Top Header: Integrated Line Bar + Terminal Header + Action Tabs */}
      <div className={`rounded-xl p-3 sm:p-4 shadow-xl space-y-3 border ${
        isHmi 
          ? 'bg-black border-2 border-green-500 text-green-400' 
          : 'bg-[#0E172A] border-slate-800/90 text-slate-100'
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
                isHmi ? 'text-green-400 text-matrix-glow font-mono font-extrabold' : 'text-white font-["Plus_Jakarta_Sans"]'
              }`}>
                MANUAL SHOT ENTRY TERMINAL (LINE {selectedLineId})
              </h2>
              <p className={`text-[11px] ${isHmi ? 'text-green-500/80 font-mono' : 'text-slate-400'}`}>
                FIN DIE SHOT COUNTER RECORDING | <span className="font-thai">บันทึกยอดช็อตสายผลิต</span>
              </p>
            </div>
          </div>

          {/* Line Selector Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs font-mono font-black text-cyan-400 mr-0.5 tracking-wider uppercase">LINE:</span>
            {linesList.map(line => (
              <button
                key={line}
                onClick={() => setSelectedLineId(line)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-black transition-all ${
                  selectedLineId === line
                    ? isHmi
                      ? 'bg-green-500 text-black shadow-lg shadow-green-500/40 ring-2 ring-green-300 scale-105'
                      : 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 ring-2 ring-cyan-300 scale-105'
                    : isHmi
                      ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border border-green-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                }`}
              >
                {line}
              </button>
            ))}
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

      {/* TAB 1: MAIN ENTRY FORM (STREAMLINED MINIMALIST OPERATOR INTERFACE) */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Main Operator Form Column (Col 8) */}
          <div className={`lg:col-span-8 rounded-xl p-3.5 sm:p-4 space-y-4 shadow-xl border ${
            isHmi 
              ? 'bg-black border-2 border-green-500/90' 
              : 'bg-[#0E172A] border-slate-800/90'
          }`}>
            
            {/* Operator Instructions / Help Guide (Collapsible) */}
            {showGuide && (
              <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
                isHmi ? 'bg-zinc-950 border-green-800 text-green-300' : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="flex items-start gap-2.5">
                  <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isHmi ? 'text-green-500' : 'text-cyan-400'}`} />
                  <div className="space-y-1">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isHmi ? 'text-green-400' : 'text-white'}`}>
                      คู่มือการบันทึกยอดช็อตและการคำนวณสะสมอายุอะไหล่ (Shift Shot Entry Guide)
                    </h3>
                    <div className="text-xs space-y-1 font-thai leading-relaxed">
                      <p><strong className="text-emerald-400">หลักการทำงานคำนวณสะสมยอดช็อต:</strong></p>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        <li><strong>ระบุเลขมิเตอร์ตั้งต้นก่อนเริ่มนับ (Start Record Shot):</strong> เช่น เลขเดิมหน้าเครื่องก่อนเริ่มงาน = <strong>10,000</strong> ช็อต</li>
                        <li><strong>กรอกตัวเลขมิเตอร์ที่อ่านได้จากหน้าตู้ควบคุม (Machine Panel Meter):</strong> เมื่อเดินเครื่องเสร็จกะเช้า (19:30 น.) อ่านเลขได้ <strong>23,000</strong> ช็อต</li>
                        <li><strong>คำนวณยอดช็อตประจำกะ (Shift Increment):</strong> ระบบคำนวณผลต่าง <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300">23,000 - 10,000 = +13,000 ช็อต</code></li>
                        <li><strong>สะสมลงรายการอะไหล่ Parts 1..N:</strong> นำยอดเพิ่ม <strong className="text-emerald-400">+13,000 ช็อต</strong> ไปสะสมเข้ายอดใช้อะไหล่แม่พิมพ์ทุกชิ้นประจำสายผลิตนั้นๆ สะสมไปเรื่อยๆ ทุกวัน</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode Selector: Method A (Manual Meter Reading) vs Method B (Direct PLC Increment) */}
            <div className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border ${
              isHmi ? 'bg-zinc-950 border-green-800' : 'bg-slate-950 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setInputMethod('METER_READING')}
                className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 active:ring-4 touch-manipulation ${
                  inputMethod === 'METER_READING'
                    ? isHmi
                      ? 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30 ring-2 ring-green-300 active:ring-green-400 active:bg-green-300'
                      : 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 active:ring-cyan-400 active:bg-cyan-300'
                    : isHmi
                      ? 'text-green-400 hover:text-green-200 active:bg-green-500 active:text-black active:ring-green-400'
                      : 'text-slate-400 hover:text-white active:bg-cyan-500 active:text-slate-950 active:ring-cyan-400'
                }`}
              >
                <Gauge className="w-4.5 h-4.5" />
                <span>MODE 1: MANUAL METER READING (ยอดอ่านมิเตอร์)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMethod('DIRECT_INCREMENT')}
                className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 active:ring-4 touch-manipulation ${
                  inputMethod === 'DIRECT_INCREMENT'
                    ? isHmi
                      ? 'bg-green-500 text-black font-black shadow-lg shadow-green-500/30 ring-2 ring-green-300 active:ring-green-400 active:bg-green-300'
                      : 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 active:ring-cyan-400 active:bg-cyan-300'
                    : isHmi
                      ? 'text-green-400 hover:text-green-200 active:bg-green-500 active:text-black active:ring-green-400'
                      : 'text-slate-400 hover:text-white active:bg-cyan-500 active:text-slate-950 active:ring-cyan-400'
                }`}
              >
                <Cpu className="w-4.5 h-4.5" />
                <span>MODE 2: DIRECT / PLC INCREMENT (ยอดช็อตเพิ่ม)</span>
              </button>
            </div>

            {/* Core Operator Dropdowns: Production Line & Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
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
                  className={`w-full rounded-lg px-4 py-3 text-base sm:text-lg font-bold font-mono focus:outline-none focus:ring-1 border transition-colors ${
                    isHmi
                      ? 'bg-zinc-950 border-2 border-green-500/80 text-green-300 focus:border-green-400 focus:ring-green-400'
                      : 'bg-slate-950 border-slate-700/90 text-white focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                >
                  {linesList.map(line => (
                    <option key={line} value={line} className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>
                      LINE {line} (L{line}-1) {currentLine?.activeConfig?.dieCode ? `| DIE: ${currentLine.activeConfig.dieCode}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Shift Dropdown */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider flex items-center justify-between ${
                  isHmi ? 'text-green-400' : 'text-slate-300'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${isHmi ? 'text-green-400' : 'text-cyan-400'}`} />
                    2. SHIFT (กะการทำงาน)
                  </span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className={`w-full rounded-lg px-4 py-3 text-base sm:text-lg font-bold font-mono focus:outline-none focus:ring-1 border transition-colors ${
                    isHmi
                      ? 'bg-zinc-950 border-2 border-green-500/80 text-green-300 focus:border-green-400 focus:ring-green-400'
                      : 'bg-slate-950 border-slate-700/90 text-white focus:border-cyan-400 focus:ring-cyan-400'
                  }`}
                >
                  <option value="Shift 1 (Day)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 1 (DAY: 08:00 - 20:00)</option>
                  <option value="Shift 2 (Night)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 2 (NIGHT: 20:00 - 08:00)</option>
                  <option value="Shift 3 (Overtime)" className={isHmi ? 'bg-black text-green-400' : 'bg-slate-900 text-slate-100'}>กะ 3 (OVERTIME / SPECIAL)</option>
                </select>
              </div>
            </div>

            {/* Readouts & Extra Large Numeric Input */}
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
                    {inputMethod === 'METER_READING' ? 'CALCULATED INCREMENT (ยอดช็อตเพิ่ม)' : 'RESULTING METER (ยอดมิเตอร์สะสม)'}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-0.5 flex items-center justify-between ${
                    isHmi ? 'text-green-400' : 'text-emerald-400'
                  }`}>
                    <span>
                      {inputMethod === 'METER_READING'
                        ? `+${formatShots(incrementVal)}`
                        : formatShots(resultingTotal)}
                    </span>
                    <span className="text-xs font-normal text-slate-500">shots</span>
                  </div>
                </div>
              </div>

              {/* 3. Extra-Large Numeric Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs sm:text-sm font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
                    isHmi ? 'text-green-400 text-matrix-glow font-mono' : 'text-cyan-300'
                  }`}>
                    <Hash className="w-4 h-4" />
                    {inputMethod === 'METER_READING'
                      ? '3. NEW READING (กรอกเลขมิเตอร์หน้าเครื่อง)'
                      : '3. SHOT INCREMENT (กรอกจำนวนช็อตที่ปั๊มเพิ่ม)'}
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

                {inputMethod === 'METER_READING' ? (
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
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={shotIncrementInput}
                      onChange={e => handleIncrementChange(e.target.value)}
                      className={`w-full text-4xl sm:text-6xl font-black font-mono py-4 px-4 text-center rounded-xl tracking-wider focus:outline-none border-2 transition-all ${
                        isHmi
                          ? 'bg-black border-green-500 focus:border-green-300 text-green-400 box-matrix-glow selection:bg-green-500 selection:text-black'
                          : 'bg-slate-900 border-cyan-500/80 focus:border-cyan-300 text-cyan-400 selection:bg-cyan-500 selection:text-slate-950 shadow-inner'
                      }`}
                      placeholder="50000"
                      required
                    />
                    <div className={`text-center text-xs mt-1 font-mono ${isHmi ? 'text-green-500/80' : 'text-slate-400'}`}>
                      Cumulative Total: <strong className={isHmi ? 'text-green-300' : 'text-emerald-400'}>{formatShots(resultingTotal)} shots</strong> ({prevShotsVal.toLocaleString()} + {incrementVal.toLocaleString()})
                    </div>
                  </div>
                )}

                {/* Quick Add Step Buttons (Touchscreen Friendly) */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap pt-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isHmi ? 'text-green-500' : 'text-slate-400'}`}>
                    QUICK ADD:
                  </span>
                  {[5000, 10000, 25000, 50000, 100000].map(addQty => (
                    <button
                      key={addQty}
                      type="button"
                      onClick={() => handleQuickAddIncrement(addQty)}
                      className={`flex-1 min-w-[60px] py-2.5 px-1 rounded-md text-xs sm:text-sm font-bold font-mono transition-all border active:scale-90 active:ring-4 touch-manipulation select-none ${
                        isHmi
                          ? 'bg-black hover:bg-green-950 text-green-300 border-green-600 active:bg-green-400 active:text-black active:ring-green-400'
                          : 'bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border-slate-700/90 active:bg-cyan-400 active:text-slate-950 active:ring-cyan-300'
                      }`}
                    >
                      +{addQty >= 1000 ? `${addQty / 1000}k` : addQty}
                    </button>
                  ))}
                </div>

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
              </div>

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
              <span className={`text-xs font-bold px-2 py-0.5 rounded border animate-pulse font-mono ${
                isHmi 
                  ? 'bg-green-950 text-green-300 border-green-500' 
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-600/70'
              }`}>
                {currentLine?.machineStatus || 'RUNNING'}
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
                <div className={`font-mono ${isHmi ? 'text-green-300' : 'text-slate-200'}`}>
                  {currentUser.name} ({currentUser.role})
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
                {linesList.map(line => (
                  <option key={line} value={line}>Line {line}</option>
                ))}
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
            <table className="w-full text-left text-xs font-mono">
              <thead className={`uppercase border-b ${
                isHmi ? 'bg-zinc-950 text-green-400 border-green-800' : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">RECORD ID</th>
                  <th className="py-2.5 px-3">LINE</th>
                  <th className="py-2.5 px-3">DATE / SHIFT</th>
                  <th className="py-2.5 px-3">METHOD</th>
                  <th className="py-2.5 px-3 text-right">PREVIOUS</th>
                  <th className="py-2.5 px-3 text-right">INCREMENT</th>
                  <th className="py-2.5 px-3 text-right">NEW TOTAL</th>
                  <th className="py-2.5 px-3">OPERATOR</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isHmi ? 'divide-green-950 text-green-300' : 'divide-slate-800/60 text-slate-200'
              }`}>
                {filteredShotLogs.map(log => (
                  <tr key={log.id} className={`transition-colors ${
                    isHmi ? 'hover:bg-green-950/40' : 'hover:bg-slate-900/60'
                  }`}>
                    <td className={`py-2 px-3 font-bold ${isHmi ? 'text-green-400' : 'text-cyan-400'}`}>{log.id}</td>
                    <td className="py-2 px-3">LINE {log.lineId}</td>
                    <td className="py-2 px-3">{log.productionDate} ({log.shift})</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.inputMethod === 'AUTOMATIC_PLC'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : isHmi
                          ? 'bg-green-950 text-green-300 border border-green-700'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      }`}>
                        {log.inputMethod || 'MANUAL'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">{formatShots(log.previousTotal)}</td>
                    <td className={`py-2 px-3 text-right font-bold ${isHmi ? 'text-green-400' : 'text-emerald-400'}`}>+{formatShots(log.shotsAdded)}</td>
                    <td className={`py-2 px-3 text-right font-extrabold ${isHmi ? 'text-green-300' : 'text-slate-100'}`}>{formatShots(log.newTotal)}</td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">{log.operatorName || 'System'}</td>
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

      {/* COUNTER RESET MODAL */}
      {counterResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E172A] border border-amber-500/80 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl font-mono text-amber-300">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                METER COUNTER RESET (เปลี่ยนมิเตอร์ใหม่)
              </h3>
              <button onClick={() => setCounterResetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCounterReset} className="space-y-3 text-xs">
              <div>
                <label className="block text-amber-400 font-bold mb-1">TARGET LINE</label>
                <input
                  type="text"
                  disabled
                  value={`LINE ${selectedLineId} (Current: ${formatShots(prevShotsVal)} shots)`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">NEW INITIAL METER READING *</label>
                <input
                  type="number"
                  min="0"
                  value={resetNewMeterInput}
                  onChange={e => setResetNewMeterInput(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/80 rounded-lg p-2 text-amber-300 font-mono text-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">REASON *</label>
                <input
                  type="text"
                  value={resetReasonInput}
                  onChange={e => setResetReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterResetModalOpen(false)}
                  className="flex-1 py-2 bg-slate-900 text-slate-400 rounded-lg text-xs font-bold border border-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold uppercase shadow"
                >
                  EXECUTE RESET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
