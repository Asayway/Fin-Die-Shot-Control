import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Cpu, 
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
  Sliders,
  Sparkles,
  HelpCircle,
  Download,
  AlertOctagon,
  ShieldCheck,
  Calendar,
  UserCheck,
  Split,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  ProductionLineId, 
  ShotEntryRecord, 
  LineLiveMonitoringData, 
  ShotInputMethod, 
  ShotSplitPeriod, 
  LineActiveConfiguration,
  PartLiveTrackingItem 
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

interface ShotEntryViewProps {
  initialLineId?: ProductionLineId;
}

export const ShotEntryView: React.FC<ShotEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'drafts' | 'counter-reset'>('entry');

  // Input Fields
  const [inputMethod, setInputMethod] = useState<ShotInputMethod>('METER_READING');
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [shift, setShift] = useState<'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)'>('Shift 1 (Day)');
  const [entryReason, setEntryReason] = useState<string>('Daily Shift Production (การผลิตประจำกะ)');
  const [notes, setNotes] = useState<string>('');
  const [allowMultiEntry, setAllowMultiEntry] = useState<boolean>(false);

  // Meter Reading States
  const [previousReadingInput, setPreviousReadingInput] = useState<string>('0');
  const [newReadingInput, setNewReadingInput] = useState<string>('0');
  const [shotIncrementInput, setShotIncrementInput] = useState<string>('50000');

  // Split Configuration Interval
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

  const [correctionModalOpen, setCorrectionModalOpen] = useState<boolean>(false);
  const [targetLogForCorrection, setTargetLogForCorrection] = useState<ShotEntryRecord | null>(null);
  const [correctionShotsInput, setCorrectionShotsInput] = useState<string>('');
  const [correctionReasonInput, setCorrectionReasonInput] = useState<string>('');

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
    setNewReadingInput(val);
    const prev = parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0;
    const next = parseInt(val.replace(/,/g, ''), 10) || 0;
    const diff = next - prev;
    setShotIncrementInput(String(Math.max(0, diff)));
  };

  const handleIncrementChange = (val: string) => {
    setShotIncrementInput(val);
    const prev = parseInt(previousReadingInput.replace(/,/g, ''), 10) || 0;
    const inc = parseInt(val.replace(/,/g, ''), 10) || 0;
    setNewReadingInput(String(prev + inc));
  };

  const handleQuickPreset = (shots: number) => {
    handleIncrementChange(String(shots));
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

  // Validation Checks
  const isWholeNumber = useMemo(() => {
    return Number.isInteger(prevShotsVal) && Number.isInteger(newShotsVal) && Number.isInteger(incrementVal);
  }, [prevShotsVal, newShotsVal, incrementVal]);

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

  // --- Actions ---

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
    showNotification('info', `Draft saved successfully (${draftRecord.id}). You can resume anytime from the Drafts tab.`);
  };

  const handleLoadDraft = (draft: ShotEntryRecord) => {
    setSelectedLineId(draft.lineId);
    setProductionDate(draft.productionDate || new Date().toISOString().substring(0, 10));
    setShift(draft.shift);
    setInputMethod(draft.inputMethod || 'METER_READING');
    setPreviousReadingInput(String(draft.previousTotal));
    setNewReadingInput(String(draft.newTotal));
    setShotIncrementInput(String(draft.shotsAdded));
    setEntryReason(draft.entryReason || 'Daily Shift Production (การผลิตประจำกะ)');
    setNotes(draft.notes || '');
    setAllowMultiEntry(draft.allowMultiEntry || false);
    setActiveDraftId(draft.id);
    setActiveTab('entry');
    showNotification('info', `Loaded draft ${draft.id} for Line ${draft.lineId}`);
  };

  const handleDeleteDraft = (draftId: string) => {
    storageService.deleteShotDraft(draftId);
    if (activeDraftId === draftId) setActiveDraftId(null);
    showNotification('info', `Draft ${draftId} removed.`);
  };

  const handleOpenSubmissionPreview = () => {
    // Validations
    if (!isWholeNumber) {
      showNotification('error', 'Shot values must be strictly whole numbers (จำนวนช็อตต้องเป็นเลขจำนวนเต็ม)');
      return;
    }
    if (!isIncrementPositive) {
      showNotification('error', 'Shot Increment must be greater than zero (ยอดช็อตที่เพิ่มต้องมากกว่า 0)');
      return;
    }
    if (isLowerReadingDetected) {
      showNotification('error', 'New Machine Reading is lower than Previous Reading. If a counter reset occurred, please use the Counter Reset workflow.');
      return;
    }
    if (isDuplicateEntry && !allowMultiEntry) {
      showNotification('error', `Duplicate entry detected for Line ${selectedLineId} on ${productionDate} (${shift}). Enable "Allow Multi-Entry" if intentional.`);
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
      showNotification('success', `Successfully committed ${incrementVal.toLocaleString()} shots to Line ${selectedLineId}. Resulting meter: ${resultingTotal.toLocaleString()} shots.`);
      // Reset form to next interval
      setNotes('');
      reloadData();
    } else {
      showNotification('error', result.error || 'Submission failed.');
    }
  };

  const handleResetForm = () => {
    setActiveDraftId(null);
    setNotes('');
    reloadData();
    showNotification('info', 'Form reset to current line meter reading.');
  };

  // Counter Reset Execution
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
      showNotification('success', `Counter Reset executed for Line ${selectedLineId}. New meter set to ${newMeter.toLocaleString()} shots.`);
      reloadData();
    } else {
      showNotification('error', result.error || 'Counter reset failed');
    }
  };

  // Correction Workflow Execution
  const handleStartCorrection = (log: ShotEntryRecord) => {
    setTargetLogForCorrection(log);
    setCorrectionShotsInput(String(Math.abs(log.shotsAdded)));
    setCorrectionReasonInput('');
    setCorrectionModalOpen(true);
  };

  const handleExecuteCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLogForCorrection) return;

    const correctedShots = parseInt(correctionShotsInput.replace(/,/g, ''), 10);
    if (isNaN(correctedShots) || correctedShots <= 0) {
      showNotification('error', 'Please enter a valid positive number of corrected shots.');
      return;
    }
    if (!correctionReasonInput.trim()) {
      showNotification('error', 'A mandatory reason is required for manual shot correction.');
      return;
    }

    const result = storageService.correctShotEntry(targetLogForCorrection.id, {
      correctedShotsAdded: correctedShots,
      newTotal: (targetLogForCorrection.previousTotal || 0) + correctedShots,
      correctionReason: correctionReasonInput,
      shift: targetLogForCorrection.shift,
      productionDate: targetLogForCorrection.productionDate
    });

    if (result.success) {
      setCorrectionModalOpen(false);
      setTargetLogForCorrection(null);
      showNotification('success', `Entry ${targetLogForCorrection.id} corrected. Generated Reversal (${result.reversalRecord?.id}) and Corrected Record (${result.correctedRecord?.id}).`);
      reloadData();
    } else {
      showNotification('error', result.error || 'Correction failed');
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
        const matchReason = (log.entryReason || '').toLowerCase().includes(query);
        const matchDie = (log.dieCode || '').toLowerCase().includes(query);
        if (!matchId && !matchOp && !matchNotes && !matchReason && !matchDie) return false;
      }
      return true;
    });
  }, [shotLogs, historyLineFilter, historyShiftFilter, historySearch]);

  // Quick PLC Pulse Simulation
  const handleQuickPulse = (qty: number) => {
    storageService.addShotEntry(selectedLineId, qty, 'AUTOMATIC_PLC', shift, `Quick optical pulse simulator +${qty.toLocaleString()}`);
    showNotification('success', `Simulated +${qty.toLocaleString()} shots for Line ${selectedLineId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Fin Press Shot Counter Entry
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Version 4.2 Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-thai">
                ระบบบันทึกยอดช็อตการผลิตประจำกะ ตรวจสอบการสึกหรอแม่พิมพ์ และควบคุมมิเตอร์เครื่อง Fin Press
              </p>
            </div>
          </div>
        </div>

        {/* Top View Mode Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-center">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'entry'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Shot Recording Form</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Shot Log & History ({shotLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'drafts'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Drafts ({drafts.length})</span>
          </button>

          <button
            onClick={() => setCounterResetModalOpen(true)}
            className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Counter Reset</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div className={`p-3.5 rounded-lg border text-sm flex items-center justify-between shadow-lg animate-fadeIn ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-600 text-rose-200' :
          notification.type === 'warning' ? 'bg-amber-950/90 border-amber-600 text-amber-200' :
          'bg-slate-900 border-cyan-700 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {notification.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Line Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 ml-1">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Target Line:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {linesList.map(line => (
              <button
                key={line}
                onClick={() => setSelectedLineId(line)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedLineId === line
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                Line {line}
              </button>
            ))}
          </div>
        </div>

        {/* Live Line Status Indicator */}
        {currentLine && (
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-bold">Line {selectedLineId}:</span>
              <span className="text-emerald-400 font-bold">{formatShots(currentLine.machineShotTotal)}</span>
              <span className="text-slate-500">shots</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-slate-400 truncate max-w-[240px]">
              Die: <span className="text-cyan-300">{currentLine.activeConfig?.dieCode || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: MAIN ENTRY FORM */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form (Col 7) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-sm">
            {/* Form Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Daily Fin Press Shift Shot Recording</span>
                </h3>
                <p className="text-xs text-slate-400 font-thai mt-0.5">
                  กรอกยอดช็อตหรือยอดอ่านมิเตอร์เพื่อสะสมการสึกหรอของแม่พิมพ์
                </p>
              </div>

              {activeDraftId && (
                <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-700 text-amber-300 text-xs font-mono flex items-center gap-1 self-start sm:self-auto">
                  <FileText className="w-3 h-3" />
                  Editing Draft: {activeDraftId}
                </span>
              )}
            </div>

            {/* Entry Method Selector: Method A vs Method B */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Entry Method (เลือกวิธีการบันทึก) <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInputMethod('METER_READING')}
                  className={`p-3 rounded-lg text-left border transition-all flex flex-col justify-between ${
                    inputMethod === 'METER_READING'
                      ? 'bg-cyan-950/50 border-cyan-500 text-slate-100 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-cyan-300">
                      <Gauge className="w-3.5 h-3.5" />
                      Method A: Machine Meter Reading
                    </span>
                    {inputMethod === 'METER_READING' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    ป้อนเลขมิเตอร์หน้าเครื่อง (ยอดอ่านใหม่) → คำนวณช็อตเพิ่มอัตโนมัติ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMethod('DIRECT_INCREMENT')}
                  className={`p-3 rounded-lg text-left border transition-all flex flex-col justify-between ${
                    inputMethod === 'DIRECT_INCREMENT'
                      ? 'bg-cyan-950/50 border-cyan-500 text-slate-100 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                      <PlusCircle className="w-3.5 h-3.5" />
                      Method B: Direct Shot Increment
                    </span>
                    {inputMethod === 'DIRECT_INCREMENT' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    ป้อนจำนวนช็อตที่ปั๊มเพิ่มโดยตรง → คำนวณเลขมิเตอร์สะสมใหม่
                  </span>
                </button>
              </div>
            </div>

            {/* Core Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Production Line */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Production Line (สายการผลิต) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedLineId}
                  onChange={e => setSelectedLineId(e.target.value as ProductionLineId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {linesList.map(line => (
                    <option key={line} value={line}>Line {line} (L{line}-1)</option>
                  ))}
                </select>
              </div>

              {/* Active Configuration (Auto-loaded) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Configuration Slot</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Active</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={`${activeConfig?.configurationSlot || 'Slot 1'} (${activeConfig?.dieCode || 'N/A'})`}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 cursor-not-allowed"
                />
              </div>

              {/* Production Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Production Date (วันที่ผลิต) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={e => setProductionDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Shift (กะการทำงาน) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Shift 1 (Day)">Shift 1 (Day: 08:00 - 20:00)</option>
                  <option value="Shift 2 (Night)">Shift 2 (Night: 20:00 - 08:00)</option>
                  <option value="Shift 3 (Overtime)">Shift 3 (Overtime / Special Run)</option>
                </select>
              </div>
            </div>

            {/* Meter Reading vs Increment Calculation Area */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Previous Machine Reading */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Previous Reading (ยอดอ่านเดิม)
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-base font-mono font-bold text-slate-300">
                    {formatShots(prevShotsVal)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Total machine base</span>
                </div>

                {/* Method A: New Machine Reading */}
                {inputMethod === 'METER_READING' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      New Reading (ยอดอ่านใหม่) *
                    </label>
                    <input
                      type="number"
                      min={prevShotsVal}
                      step="1"
                      value={newReadingInput}
                      onChange={e => handleNewReadingChange(e.target.value)}
                      className="w-full bg-slate-900 border border-cyan-600 rounded-lg px-3 py-2 text-base font-mono font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Input from machine meter</span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" />
                      Shot Increment (ช็อตที่เพิ่ม) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={shotIncrementInput}
                      onChange={e => handleIncrementChange(e.target.value)}
                      className="w-full bg-slate-900 border border-emerald-600 rounded-lg px-3 py-2 text-base font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Direct shot delta count</span>
                  </div>
                )}

                {/* Calculated Result */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {inputMethod === 'METER_READING' ? 'Calculated Increment' : 'Resulting New Meter'}
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-base font-mono font-bold text-emerald-400 flex items-center justify-between">
                    <span>
                      {inputMethod === 'METER_READING'
                        ? `+${formatShots(incrementVal)}`
                        : formatShots(resultingTotal)}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {inputMethod === 'METER_READING' ? 'New - Previous' : 'Previous + Increment'}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons for Increment */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-500">Quick Presets:</span>
                {[10000, 25000, 50000, 80000, 100000, 150000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickPreset(val)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 rounded border border-slate-800 transition-colors"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Lower Reading Alert / Counter Reset Detector (Rule 6) */}
              {isLowerReadingDetected && (
                <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-lg text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Machine Counter Reset Detected (ตรวจพบมิเตอร์รอบต่ำกว่าเดิม)</div>
                    <div>
                      New Machine Reading ({newShotsVal.toLocaleString()}) cannot be lower than Previous Reading ({prevShotsVal.toLocaleString()}).
                      If the machine physical counter was reset or rolled over, please use the approved Counter Reset transaction.
                    </div>
                    <button
                      type="button"
                      onClick={() => setCounterResetModalOpen(true)}
                      className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
                    >
                      Open Approved Counter Reset Workflow
                    </button>
                  </div>
                </div>
              )}

              {/* Abnormal Increase Alert (Rule 5) */}
              {isAbnormalIncrease && (
                <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-xs text-rose-200 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Abnormal Shot Increase Warning (ยอดช็อตสูงผิดปกติเกินขีดจำกัด)</div>
                    <div>
                      The entered increment of +{incrementVal.toLocaleString()} shots exceeds the configured single-shift threshold of {maxShiftLimit.toLocaleString()} shots. This requires verification before submission.
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate Entry Warning (Rule 4) */}
              {isDuplicateEntry && (
                <div className="p-3 bg-blue-950/80 border border-blue-600 rounded-lg text-xs text-blue-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Existing Entry Found for Line {selectedLineId} ({shift})</div>
                    <div>
                      A record has already been logged for this line, date, and shift. Check the box below to allow multi-entry in the same shift, or use "Correct Entry" to adjust the prior entry.
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={allowMultiEntry}
                        onChange={e => setAllowMultiEntry(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                      />
                      <span className="font-bold text-cyan-300">Allow multi-entry recording in the same shift</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Split Configuration Interval Accordion (Rule 13) */}
            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSplitInterval}
                    onChange={e => setEnableSplitInterval(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Split className="w-3.5 h-3.5 text-cyan-400" />
                    Split Configuration Periods (มีการเปลี่ยนโมเดล/สลับแม่พิมพ์ระหว่างกะ)
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Rule #13</span>
              </div>

              {enableSplitInterval && (
                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs animate-fadeIn">
                  <p className="text-slate-400 font-thai text-[11px]">
                    ระบบจะแบ่งการกระจายยอดช็อตไปยังชิ้นส่วนแม่พิมพ์ตามสัดส่วนของแต่ละช่วงการติดตั้งอย่างแม่นยำ
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-bold text-cyan-300">Period 1: {activeConfig?.configurationSlot || 'Slot 1'} ({activeConfig?.dieCode || 'Die 1'})</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Time Interval</label>
                          <input
                            type="text"
                            value={splitPeriod1Time}
                            onChange={e => setSplitPeriod1Time(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Shots (ช็อต)</label>
                          <input
                            type="number"
                            value={splitPeriod1Shots}
                            onChange={e => setSplitPeriod1Shots(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="font-bold text-amber-300">Period 2: Slot 2 (New Revision / Tool Change)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">Time Interval</label>
                          <input
                            type="text"
                            value={splitPeriod2Time}
                            onChange={e => setSplitPeriod2Time(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Shots (ช็อต)</label>
                          <input
                            type="number"
                            value={splitPeriod2Shots}
                            onChange={e => setSplitPeriod2Shots(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Reason & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Entry Reason (เหตุผลการบันทึก) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={entryReason}
                  onChange={e => setEntryReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Daily Shift Production (การผลิตประจำกะ)">Daily Shift Production (การผลิตประจำกะ)</option>
                  <option value="Overtime Production (การผลิตล่วงเวลา)">Overtime Production (การผลิตล่วงเวลา)</option>
                  <option value="Test Run / Tooling Setup (ทดสอบตั้งแม่พิมพ์)">Test Run / Tooling Setup (ทดสอบตั้งแม่พิมพ์)</option>
                  <option value="Sampling & Quality Trial (ทดลองสุ่มเก็บตัวอย่าง QC)">Sampling & Quality Trial (ทดลองสุ่มเก็บตัวอย่าง QC)</option>
                  <option value="Coil Lot Change Trial (เปลี่ยนคอยล์อลูมิเนียมล็อตใหม่)">Coil Lot Change Trial (เปลี่ยนคอยล์อลูมิเนียมล็อตใหม่)</option>
                  <option value="Maintenance & Die Verification (ทดสอบหลังซ่อมบำรุง)">Maintenance & Die Verification (ทดสอบหลังซ่อมบำรุง)</option>
                  <option value="Other (อื่นๆ)">Other (อื่นๆ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notes & Coil Batch Lot (หมายเหตุ / ล็อตผลิต)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Coil #PCM-0.10-A991, Fin pitch verified"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Operator Metadata Badge */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Entered By: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.employeeId || 'EMP-1001'})</span>
              </div>
              <div className="text-slate-500">
                {new Date().toISOString().replace('T', ' ').substring(0, 19)}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-3 pt-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cancel / Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg text-xs transition-colors border border-cyan-800/80 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleOpenSubmissionPreview}
                disabled={!isIncrementPositive || isLowerReadingDetected}
                className={`w-full py-3.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !isIncrementPositive || isLowerReadingDetected
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>REVIEW & SUBMIT SHOT ENTRY (+{formatShots(incrementVal)})</span>
              </button>
            </div>

            {/* Quick Pulse Simulator for Optical PLC Sensor */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Optical Sensor / PLC Pulse Simulator (จำลองสัญญาณ PLC)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Live Hardware Signal</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQuickPulse(500)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono"
                >
                  +500 Pulse
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPulse(2500)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono"
                >
                  +2,500 Pulse
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPulse(10000)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono"
                >
                  +10,000 Pulse
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPulse(50000)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-mono"
                >
                  +50,000 Pulse
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Line Telemetry & Part Wear Status (Col 5) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    Line {selectedLineId} Live Telemetry
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Last Update: {currentLine?.lastUpdate || 'Just now'}
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {currentLine?.machineStatus || 'RUNNING'}
                </span>
              </div>

              {/* Machine Shot Metrics */}
              <div className="grid grid-cols-1 gap-3 font-mono">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase font-bold">Current Machine Meter Total</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-baseline justify-between">
                    <span>{formatShots(currentLine?.machineShotTotal || 0)}</span>
                    <span className="text-xs font-normal text-slate-400">Total Shots</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Projected: {formatShots(resultingTotal)} (+{formatShots(incrementVal)})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-[10px]">CURRENT SHIFT</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(currentLine?.shiftShot || 0)}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-[10px]">TODAY TOTAL</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(currentLine?.dailyShot || 0)}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-slate-500 text-[10px]">MONTH TOTAL</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(currentLine?.monthlyShot || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tooling Configuration Snapshot */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Active Tooling Setup
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {activeConfig?.revision || 'Rev 1.0'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-slate-300 font-mono text-[11px]">
                  <div>Slot: <strong className="text-slate-100">{activeConfig?.configurationSlot || 'Slot 1'}</strong></div>
                  <div>Die Code: <strong className="text-cyan-300">{activeConfig?.dieCode || 'N/A'}</strong></div>
                  <div>Material: <strong className="text-amber-300">{activeConfig?.material} ({activeConfig?.thicknessMm}mm)</strong></div>
                  <div>Tube Size: <strong className="text-slate-100">{activeConfig?.tubeSize}</strong></div>
                  <div>Fin Type: <strong className="text-slate-100">{activeConfig?.finType}</strong></div>
                  <div>Rows / Paths: <strong className="text-slate-100">{activeConfig?.rowsCount || 4}R / {activeConfig?.pathsCount || '4P'}</strong></div>
                </div>
              </div>

              {/* Active Installed Tooling Preview (Top 5 items) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Installed Tooling Wear Sample</span>
                  <span className="text-[11px] text-slate-400 font-mono">{currentLine?.items.length || 0} Parts Loaded</span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {currentLine?.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{item.stagePunchDie}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.partCode} • Qty: {item.installQty}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-300">
                          {formatShots(item.usedShot || item.currentShot || 0)} / {formatShots(item.lifeLimit || 0)}
                        </div>
                        <div className="text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            (item.usagePercent || 0) >= 95 ? 'bg-rose-950 text-rose-300' :
                            (item.usagePercent || 0) >= 85 ? 'bg-amber-950 text-amber-300' :
                            (item.usagePercent || 0) >= 70 ? 'bg-yellow-950 text-yellow-300' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {item.usagePercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer rules reminder */}
            <div className="text-[11px] text-slate-500 font-thai border-t border-slate-800 pt-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                ทุกยอดช็อตจะถูกคำนวณสะสมและอัปเดตสถานะการสึกหรอของแม่พิมพ์โดยอัตโนมัติตามมาตรฐาน composite key 10 ตัวแปร
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOT ENTRY LOG & HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                <History className="w-5 h-5 text-cyan-400" />
                <span>Historical Fin Press Shot Entry Logs (ประวัติการบันทึกช็อต)</span>
              </h3>
              <p className="text-xs text-slate-400 font-thai mt-0.5">
                ประวัติการบันทึกยอดช็อตทั้งหมด รองรับการตรวจสอบย้อนกลับ รายการแก้ไข และการรีเวอร์สัลตามเกณฑ์ความปลอดภัย
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID, Operator, Notes..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none w-[190px]"
                />
              </div>

              <select
                value={historyLineFilter}
                onChange={e => setHistoryLineFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">All Lines</option>
                {linesList.map(line => (
                  <option key={line} value={line}>Line {line}</option>
                ))}
              </select>

              <select
                value={historyShiftFilter}
                onChange={e => setHistoryShiftFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">All Shifts</option>
                <option value="Shift 1 (Day)">Shift 1 (Day)</option>
                <option value="Shift 2 (Night)">Shift 2 (Night)</option>
                <option value="Shift 3 (Overtime)">Shift 3 (Overtime)</option>
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3">RECORD ID</th>
                  <th className="py-3 px-3">TIMESTAMP / DATE</th>
                  <th className="py-3 px-3">LINE</th>
                  <th className="py-3 px-3">SHIFT</th>
                  <th className="py-3 px-3">STATUS / TYPE</th>
                  <th className="py-3 px-3 text-right">SHOT INCREMENT</th>
                  <th className="py-3 px-3 text-right">NEW METER TOTAL</th>
                  <th className="py-3 px-3">OPERATOR</th>
                  <th className="py-3 px-3">REASON / NOTES</th>
                  <th className="py-3 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredShotLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-thai">
                      ไม่พบประวัติการบันทึกยอดช็อตที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredShotLogs.map(log => (
                    <tr key={log.id} className={`hover:bg-slate-800/50 transition-colors ${
                      log.status === 'REVERSED' ? 'opacity-60 bg-rose-950/20' :
                      log.status === 'CORRECTION' ? 'bg-amber-950/20' :
                      log.status === 'COUNTER_RESET' ? 'bg-blue-950/20' : ''
                    }`}>
                      <td className="py-2.5 px-3 font-bold text-slate-300">{log.id}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {log.timestamp.replace('T', ' ').substring(0, 19)}
                        {log.productionDate && <div className="text-[10px] text-slate-500">Date: {log.productionDate}</div>}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-300">Line {log.lineId}</td>
                      <td className="py-2.5 px-3 text-slate-300">{log.shift}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block self-start ${
                            log.status === 'REVERSED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            log.status === 'CORRECTION' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            log.status === 'COUNTER_RESET' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {log.status || 'SUBMITTED'}
                          </span>
                          <span className="text-[9px] text-slate-500">{log.entryType}</span>
                        </div>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        log.shotsAdded < 0 ? 'text-rose-400' :
                        log.shotsAdded === 0 ? 'text-slate-400' : 'text-emerald-400'
                      }`}>
                        {log.shotsAdded > 0 ? `+${formatShots(log.shotsAdded)}` : formatShots(log.shotsAdded)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200 font-bold">
                        {formatShots(log.newTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{log.operatorName}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[220px] truncate" title={log.notes || log.entryReason}>
                        <div className="text-slate-300 font-medium truncate">{log.entryReason || '-'}</div>
                        <div className="text-slate-500 truncate">{log.notes || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {log.status !== 'REVERSED' && log.status !== 'COUNTER_RESET' ? (
                          <button
                            onClick={() => handleStartCorrection(log)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors"
                            title="Correct this entry (creates reversal and new corrected record)"
                          >
                            <Edit3 className="w-3 h-3" />
                            Correct
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRAFTS MANAGER */}
      {activeTab === 'drafts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Saved Shot Entry Drafts (ฉบับร่างที่บันทึกไว้)</span>
              </h3>
              <p className="text-xs text-slate-400 font-thai mt-0.5">
                รายการฉบับร่างยังไม่ได้กระทบต่อยอดสะสมจริงในเครื่อง สามารถเรียกกลับมาแก้ไขและยืนยันการบันทึกได้
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">{drafts.length} Drafts Available</span>
          </div>

          {drafts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-thai border border-dashed border-slate-800 rounded-xl">
              ไม่มีฉบับร่างที่บันทึกไว้ (กด "Save Draft" ในหน้าแบบฟอร์มเพื่อบันทึกงานไว้ชั่วคราว)
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drafts.map(draft => (
                <div key={draft.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 font-mono text-sm">Line {draft.lineId}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {draft.shift}
                      </span>
                    </div>

                    <div className="text-xs font-mono space-y-1 text-slate-400">
                      <div>Date: <span className="text-slate-200">{draft.productionDate}</span></div>
                      <div>Shots: <strong className="text-emerald-400">+{formatShots(draft.shotsAdded)}</strong></div>
                      <div>Meter: <span className="text-slate-300">{formatShots(draft.previousTotal)} → {formatShots(draft.newTotal)}</span></div>
                      <div className="truncate">Reason: <span className="text-slate-300">{draft.entryReason}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleLoadDraft(draft)}
                      className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Resume Draft
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-200 rounded text-xs transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: PRE-SUBMISSION PREVIEW MODAL (Rule 16) --- */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>Submission Preview & Tooling Impact Verification</span>
                </h3>
                <p className="text-xs text-slate-400 font-thai">
                  ตรวจสอบผลกระทบต่ออายุการใช้งานชิ้นส่วนแม่พิมพ์ก่อนยืนยันบันทึกเข้าระบบ
                </p>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">TARGET LINE</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">Line {selectedLineId}</div>
                <div className="text-[10px] text-slate-400">{activeConfig?.dieCode}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">PRODUCTION SHIFT</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">{shift}</div>
                <div className="text-[10px] text-slate-400">{productionDate}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">SHOT INCREMENT</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">+{formatShots(incrementVal)}</div>
                <div className="text-[10px] text-slate-400">{inputMethod}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">RESULTING METER</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{formatShots(resultingTotal)}</div>
                <div className="text-[10px] text-emerald-400">Total Shots</div>
              </div>
            </div>

            {/* Warnings if any */}
            {previewData.abnormalIncreaseWarning && (
              <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-xs text-rose-200 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span><strong>Abnormal Increase Detected:</strong> Shot count exceeds single-shift limit ({maxShiftLimit.toLocaleString()} shots). Verified by supervisor.</span>
              </div>
            )}

            {previewData.hasMissingStandard && (
              <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-lg text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span><strong>Missing Standard Warning:</strong> One or more parts do not have a defined Part Life Standard. Shots will still be tracked.</span>
              </div>
            )}

            {/* Affected Parts Table (Rule 16) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">
                  Affected Tooling Parts ({previewData.affectedParts.length} Parts Receiving Wear)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Excluded Non-Shot Controlled / Paused: {previewData.excludedParts.length} Parts
                </span>
              </div>

              <div className="overflow-x-auto max-h-[260px] border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">STAGE / PART</th>
                      <th className="py-2 px-3 text-right">PRE-SHOT</th>
                      <th className="py-2 px-3 text-right">DELTA</th>
                      <th className="py-2 px-3 text-right">POST-SHOT</th>
                      <th className="py-2 px-3 text-right">LIFE LIMIT</th>
                      <th className="py-2 px-3 text-center">USAGE %</th>
                      <th className="py-2 px-3 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {previewData.affectedParts.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-200">{item.stagePunchDie}</div>
                          <div className="text-[10px] text-slate-500">{item.partCode}</div>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatShots(item.oldShot)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">+{formatShots(item.addedShot)}</td>
                        <td className="py-2 px-3 text-right text-slate-200 font-bold">{formatShots(item.newShot)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{formatShots(item.lifeLimit)}</td>
                        <td className="py-2 px-3 text-center font-bold">
                          <span className={item.newUsage >= 95 ? 'text-rose-400' : item.newUsage >= 85 ? 'text-amber-400' : 'text-slate-300'}>
                            {item.newUsage}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.newStatus === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            item.newStatus === 'PREPARE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            item.newStatus === 'WARNING' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {item.newStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Excluded parts summary */}
            {previewData.excludedParts.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Excluded Parts (ไม่นับยอดช็อตตามเกณฑ์การควบคุม):
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {previewData.excludedParts.map((ex: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                      {ex.stagePunchDie || ex.partCode} ({ex.reason})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSubmit}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRM & COMMIT SHOT ENTRY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: COUNTER RESET TRANSACTION MODAL (Rule 7) --- */}
      {counterResetModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-amber-700/80 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <span>Approved Machine Counter Reset Transaction</span>
                </h3>
                <p className="text-xs text-slate-400 font-thai">
                  การรีเซ็ตมิเตอร์เครื่อง Fin Press (ต้องมีรหัสอนุมัติจากหัวหน้างาน / Die Specialist)
                </p>
              </div>
              <button
                onClick={() => setCounterResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCounterReset} className="space-y-4 text-xs">
              <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-800/80 text-amber-200 font-mono space-y-1">
                <div>Target Line: <strong className="text-slate-100">Line {selectedLineId}</strong></div>
                <div>Current Meter Reading: <strong className="text-amber-400">{formatShots(prevShotsVal)}</strong> shots</div>
                <div className="text-[11px] text-slate-400 font-thai">
                  * การรีเซ็ตมิเตอร์จะไม่ลบประวัติการสึกหรอสะสมของแม่พิมพ์ แต่จะตั้งค่าฐานมิเตอร์ใหม่ของเครื่อง
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  New Reset Base Meter Reading (เลขฐานมิเตอร์ใหม่) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={resetNewMeterInput}
                  onChange={e => setResetNewMeterInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Approval ID (รหัสเอกสารอนุมัติ) *
                  </label>
                  <input
                    type="text"
                    value={resetApprovalIdInput}
                    onChange={e => setResetApprovalIdInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Approved By (ผู้อนุมัติ) *
                  </label>
                  <input
                    type="text"
                    value={resetApprovedByInput}
                    onChange={e => setResetApprovedByInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Reset Reason (เหตุผลการรีเซ็ตมิเตอร์) *
                </label>
                <select
                  value={resetReasonInput}
                  onChange={e => setResetReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="Physical Gauge Replacement (เปลี่ยนมิเตอร์วัดรอบใหม่)">Physical Gauge Replacement (เปลี่ยนมิเตอร์วัดรอบใหม่)</option>
                  <option value="PLC Optical Sensor Recalibration (ปรับแต่งเซนเซอร์ PLC ใหม่)">PLC Optical Sensor Recalibration (ปรับแต่งเซนเซอร์ PLC ใหม่)</option>
                  <option value="Major Overhaul Maintenance (ซ่อมบำรุงใหญ่โอเวอร์ฮอล)">Major Overhaul Maintenance (ซ่อมบำรุงใหญ่โอเวอร์ฮอล)</option>
                  <option value="Counter Roll-Over Reset (มิเตอร์ชนเพดานรอบ)">Counter Roll-Over Reset (มิเตอร์ชนเพดานรอบ)</option>
                  <option value="Other Approved Calibration (การปรับเทียบอื่นๆ ตามใบสั่งงาน)">Other Approved Calibration (การปรับเทียบอื่นๆ ตามใบสั่งงาน)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCounterResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>EXECUTE COUNTER RESET</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: MANUAL CORRECTION MODAL (Rules 8, 9, 10) --- */}
      {correctionModalOpen && targetLogForCorrection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <span>Correct Submitted Shot Entry ({targetLogForCorrection.id})</span>
                </h3>
                <p className="text-xs text-slate-400 font-thai">
                  สร้างรายการ Reversal เพื่อยกเลิกรายการเดิม และสร้างรายการ Corrected ที่ถูกต้องเข้าระบบ
                </p>
              </div>
              <button
                onClick={() => setCorrectionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCorrection} className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono space-y-1 text-slate-300">
                <div>Original Entry: <strong className="text-slate-100">{targetLogForCorrection.id}</strong></div>
                <div>Line: <strong className="text-cyan-300">Line {targetLogForCorrection.lineId}</strong> • Shift: {targetLogForCorrection.shift}</div>
                <div>Original Shot Increment: <strong className="text-rose-400">+{formatShots(targetLogForCorrection.shotsAdded)}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Corrected Shot Increment (จำนวนช็อตที่ถูกต้องจริง) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={correctionShotsInput}
                  onChange={e => setCorrectionShotsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Mandatory Correction Reason (เหตุผลการแก้ไขข้อมูล) *
                </label>
                <textarea
                  rows={3}
                  value={correctionReasonInput}
                  onChange={e => setCorrectionReasonInput(e.target.value)}
                  placeholder="e.g. Typo in morning meter reading log, verified by QC supervisor..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>APPLY REVERSAL & CORRECTION</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
