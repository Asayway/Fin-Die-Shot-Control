import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Layers,
  History,
  ShieldAlert,
  FileText,
  UploadCloud,
  Save,
  ArrowRight,
  Eye,
  Download,
  Check,
  X,
  Search,
  Filter,
  Calendar,
  Hash,
  UserCheck,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  ProductionLineId, 
  ReplacementType, 
  ReplacementRecord, 
  LineLiveMonitoringData,
  PartLiveTrackingItem,
  SpareStockItem,
  RegrindMasterStandard
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

interface ReplacementEntryViewProps {
  initialLineId?: ProductionLineId;
}

const REPLACEMENT_TYPES: ReplacementType[] = [
  'NEW PART',
  'RE-GROUND PART',
  'PARTIAL REPLACEMENT',
  'FULL SET REPLACEMENT',
  'EMERGENCY REPLACEMENT',
  'SCRAP',
  'INSPECTION REPLACEMENT'
];

export const ReplacementEntryView: React.FC<ReplacementEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [lineData, setLineData] = useState<LineLiveMonitoringData | null>(null);
  const [stocks, setStocks] = useState<SpareStockItem[]>([]);
  const [regrindStandards, setRegrindStandards] = useState<RegrindMasterStandard[]>([]);
  const [historyRecords, setHistoryRecords] = useState<ReplacementRecord[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());

  // Form Fields
  const [selectedPartCode, setSelectedPartCode] = useState<string>('P-LOUV-001');
  const [replacementType, setReplacementType] = useState<ReplacementType>('FULL SET REPLACEMENT');
  const [fullSetOrPartial, setFullSetOrPartial] = useState<'FULL_SET' | 'PARTIAL'>('FULL_SET');
  const [position, setPosition] = useState<string>('ALL');
  const [installedQuantity, setInstalledQuantity] = useState<number>(168);
  const [changedQuantity, setChangedQuantity] = useState<number>(168);
  const [machineShotAtReplacement, setMachineShotAtReplacement] = useState<number>(0);
  const [removedPartUsedShot, setRemovedPartUsedShot] = useState<number>(0);
  const [removedPartRegrindCount, setRemovedPartRegrindCount] = useState<number>(0);
  const [newPartLotNumber, setNewPartLotNumber] = useState<string>('');
  const [newPartSerialNumber, setNewPartSerialNumber] = useState<string>('');
  const [replacementDateTime, setReplacementDateTime] = useState<string>(
    new Date().toISOString().substring(0, 16)
  );
  const [replacementReason, setReplacementReason] = useState<string>('Normal Preventive Life Limit Reached');
  const [workOrderNumber, setWorkOrderNumber] = useState<string>('');
  const [changedBy, setChangedBy] = useState<string>(currentUser.name);
  const [verifiedBy, setVerifiedBy] = useState<string>('Somchai M. (Tooling Lead)');
  const [quantityMismatchReason, setQuantityMismatchReason] = useState<string>('');
  const [quantityMismatchApprovedBy, setQuantityMismatchApprovedBy] = useState<string>('');
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'drafts'>('entry');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');
  const [inspectModalRecord, setInspectModalRecord] = useState<ReplacementRecord | null>(null);

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const reloadData = () => {
    const ld = storageService.getLineMonitoring(selectedLineId);
    setLineData(ld);
    setStocks(storageService.getSpareStocks());
    setRegrindStandards(storageService.getRegrindMasterStandards());
    setHistoryRecords(storageService.getReplacements());
    setDrafts(storageService.getReplacementDrafts());
    setCurrentUser(storageService.getCurrentUser());
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, [selectedLineId]);

  // When line or part changes, populate default values
  useEffect(() => {
    if (lineData) {
      setMachineShotAtReplacement(lineData.machineShotTotal || 0);
      const item = lineData.items.find(i => i.partCode === selectedPartCode) || lineData.items[0];
      if (item) {
        setSelectedPartCode(item.partCode);
        setInstalledQuantity(item.installQty || 1);
        if (fullSetOrPartial === 'FULL_SET') {
          setChangedQuantity(item.installQty || 1);
          setPosition('ALL');
        }
        setRemovedPartUsedShot(item.usedShot !== undefined ? item.usedShot : item.currentShot);
        setRemovedPartRegrindCount(item.regrindCount || 0);
      }
    }
  }, [selectedLineId, lineData?.machineShotTotal]);

  // Auto-update changed qty and position when fullSetOrPartial changes
  useEffect(() => {
    if (!lineData) return;
    const item = lineData.items.find(i => i.partCode === selectedPartCode);
    if (item) {
      if (fullSetOrPartial === 'FULL_SET') {
        setChangedQuantity(item.installQty || 1);
        setPosition('ALL');
      } else {
        if (position === 'ALL') setPosition('Row 1 - Pos 1..10');
        if (changedQuantity >= (item.installQty || 1)) {
          setChangedQuantity(Math.max(1, Math.min(10, Math.floor((item.installQty || 1) / 4))));
        }
      }
    }
  }, [fullSetOrPartial]);

  // When selectedPartCode changes, update quantities and removed shots
  const handlePartChange = (code: string) => {
    setSelectedPartCode(code);
    if (lineData) {
      const item = lineData.items.find(i => i.partCode === code);
      if (item) {
        setInstalledQuantity(item.installQty || 1);
        if (fullSetOrPartial === 'FULL_SET') {
          setChangedQuantity(item.installQty || 1);
          setPosition('ALL');
        }
        setRemovedPartUsedShot(item.usedShot !== undefined ? item.usedShot : item.currentShot);
        setRemovedPartRegrindCount(item.regrindCount || 0);
      }
    }
    // Generate default lot number
    setNewPartLotNumber(`LOT-${new Date().getFullYear()}-${code.replace('P-', '')}-01`);
    if (!workOrderNumber) {
      setWorkOrderNumber(`WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Sync replacement type with fullSet/partial
  const handleReplacementTypeChange = (type: ReplacementType) => {
    setReplacementType(type);
    if (type === 'PARTIAL REPLACEMENT') {
      setFullSetOrPartial('PARTIAL');
    } else if (type === 'FULL SET REPLACEMENT') {
      setFullSetOrPartial('FULL_SET');
    }
  };

  const selectedItem: PartLiveTrackingItem | undefined = lineData?.items.find(i => i.partCode === selectedPartCode);
  const matchedStock: SpareStockItem | undefined = stocks.find(s => s.partCode === selectedPartCode);
  const matchedRegrindStd: RegrindMasterStandard | undefined = regrindStandards.find(r => r.partCode === selectedPartCode);

  // Form Validation and Preview Trigger
  const handleOpenPreview = () => {
    if (!selectedItem || !lineData) {
      setNotification({ type: 'error', message: 'No tooling part selected.' });
      return;
    }

    // Rule 5: Partial replacements require position numbers
    if (fullSetOrPartial === 'PARTIAL' && (!position || position.trim() === '' || position.toUpperCase() === 'ALL')) {
      setNotification({ type: 'error', message: 'Rule 5 Violation: Partial replacement requires specific position numbers (e.g., Row 1-2, Pos 01-14).' });
      return;
    }

    // Rule 8 & 9: Full set quantity mismatch verification
    if (fullSetOrPartial === 'FULL_SET' && changedQuantity !== installedQuantity && (!quantityMismatchReason || quantityMismatchReason.trim() === '')) {
      setNotification({ type: 'error', message: 'Rule 8/9 Violation: Full set changed quantity does not match installed quantity. Please enter a Mismatch Reason & Supervisor Override.' });
      return;
    }

    // Rule 10: Block scrapped parts
    if (newPartLotNumber && (newPartLotNumber.toUpperCase().includes('SCRAP') || newPartLotNumber.toUpperCase().includes('REJECT'))) {
      setNotification({ type: 'error', message: 'Rule 10 Violation: Installation of a scrapped/rejected part is strictly blocked.' });
      return;
    }

    const preview = storageService.previewReplacement({
      lineId: selectedLineId,
      configurationId: lineData.activeConfig?.id,
      partCode: selectedPartCode,
      partName: selectedItem.partName,
      stageName: selectedItem.stagePunchDie,
      position,
      replacementType,
      fullSetOrPartial,
      installedQuantity,
      changedQuantity,
      machineShotAtReplacement,
      removedPartUsedShot,
      removedPartRegrindCount,
      newPartLotNumber,
      newPartSerialNumber,
      quantityMismatchReason,
      quantityMismatchApprovedBy
    });

    setPreviewData(preview);
    setShowPreviewModal(true);
  };

  // Submit final replacement
  const handleConfirmSubmit = () => {
    if (!selectedItem || !lineData) return;

    const result = storageService.recordReplacement({
      draftId: activeDraftId || undefined,
      lineId: selectedLineId,
      configurationId: lineData.activeConfig?.id,
      configurationSlot: lineData.activeConfig?.configurationSlot || 'Slot 1',
      dieCode: lineData.activeConfig?.dieCode || 'N/A',
      partCode: selectedItem.partCode,
      partName: selectedItem.partName,
      stageName: selectedItem.stagePunchDie,
      position,
      replacementType,
      fullSetOrPartial,
      installedQuantity,
      changedQuantity,
      machineShotAtReplacement,
      removedPartUsedShot, // Preserves removed part's actual accumulated shots
      removedPartRegrindCount,
      newPartLotNumber: newPartLotNumber || `LOT-${new Date().getFullYear()}-01`,
      newPartSerialNumber,
      replacementDateTime: replacementDateTime.replace('T', ' '),
      replacementReason,
      workOrderNumber: workOrderNumber || `WO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      changedBy: changedBy || currentUser.name,
      changedById: currentUser.employeeId,
      verifiedBy: verifiedBy || 'Supervisor',
      verifiedById: 'EMP-SUP-01',
      evidenceAttachment: evidenceFileName || undefined,
      note,
      quantityMismatchReason: fullSetOrPartial === 'FULL_SET' && changedQuantity !== installedQuantity ? quantityMismatchReason : undefined,
      quantityMismatchApprovedBy: fullSetOrPartial === 'FULL_SET' && changedQuantity !== installedQuantity ? quantityMismatchApprovedBy : undefined
    });

    if (result.success) {
      setShowPreviewModal(false);
      setNotification({
        type: 'success',
        message: `Successfully executed replacement transaction ${result.record?.id}. Tooling life counter reset to 0 with preserved removed history.`
      });
      // Reset draft tracking if any
      setActiveDraftId(null);
      // Reload
      reloadData();
      // Auto-switch to history tab to view newly registered record
      setTimeout(() => setActiveTab('history'), 1500);
    } else {
      setNotification({
        type: 'error',
        message: result.error || 'Failed to submit replacement record.'
      });
    }
  };

  // Save Draft
  const handleSaveDraft = () => {
    const draftObj = {
      id: activeDraftId || `DRAFT-REP-${Date.now()}`,
      lineId: selectedLineId,
      partCode: selectedPartCode,
      replacementType,
      fullSetOrPartial,
      position,
      installedQuantity,
      changedQuantity,
      machineShotAtReplacement,
      removedPartUsedShot,
      removedPartRegrindCount,
      newPartLotNumber,
      newPartSerialNumber,
      replacementDateTime,
      replacementReason,
      workOrderNumber,
      changedBy,
      verifiedBy,
      quantityMismatchReason,
      quantityMismatchApprovedBy,
      note
    };

    const saved = storageService.saveReplacementDraft(draftObj);
    setActiveDraftId(saved.id);
    setNotification({
      type: 'success',
      message: `Replacement entry saved as draft (${saved.id}).`
    });
    setDrafts(storageService.getReplacementDrafts());
  };

  // Load Draft into Form
  const handleLoadDraft = (draft: any) => {
    setActiveDraftId(draft.id);
    setSelectedLineId(draft.lineId || 'E6');
    setSelectedPartCode(draft.partCode || 'P-LOUV-001');
    setReplacementType(draft.replacementType || 'FULL SET REPLACEMENT');
    setFullSetOrPartial(draft.fullSetOrPartial || 'FULL_SET');
    setPosition(draft.position || 'ALL');
    setInstalledQuantity(draft.installedQuantity || 168);
    setChangedQuantity(draft.changedQuantity || 168);
    setMachineShotAtReplacement(draft.machineShotAtReplacement || 0);
    setRemovedPartUsedShot(draft.removedPartUsedShot || 0);
    setRemovedPartRegrindCount(draft.removedPartRegrindCount || 0);
    setNewPartLotNumber(draft.newPartLotNumber || '');
    setNewPartSerialNumber(draft.newPartSerialNumber || '');
    setReplacementDateTime(draft.replacementDateTime || new Date().toISOString().substring(0, 16));
    setReplacementReason(draft.replacementReason || '');
    setWorkOrderNumber(draft.workOrderNumber || '');
    setChangedBy(draft.changedBy || currentUser.name);
    setVerifiedBy(draft.verifiedBy || '');
    setQuantityMismatchReason(draft.quantityMismatchReason || '');
    setQuantityMismatchApprovedBy(draft.quantityMismatchApprovedBy || '');
    setNote(draft.note || '');

    setActiveTab('entry');
    setNotification({
      type: 'info',
      message: `Draft ${draft.id} loaded into form.`
    } as any);
  };

  // Delete Draft
  const handleDeleteDraft = (draftId: string) => {
    storageService.deleteReplacementDraft(draftId);
    setDrafts(storageService.getReplacementDrafts());
    if (activeDraftId === draftId) setActiveDraftId(null);
    setNotification({ type: 'warning', message: `Draft ${draftId} removed.` });
  };

  // Approve pending record
  const handleApproveRecord = (recId: string) => {
    const res = storageService.approveReplacement(recId, currentUser.name, currentUser.employeeId);
    if (res.success) {
      setNotification({ type: 'success', message: `Replacement record ${recId} approved and applied.` });
      reloadData();
      if (inspectModalRecord?.id === recId) {
        setInspectModalRecord(null);
      }
    } else {
      setNotification({ type: 'error', message: res.error || 'Approval failed' });
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyRecords.filter(rec => {
      const matchesSearch = 
        rec.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        rec.partName.toLowerCase().includes(historySearch.toLowerCase()) ||
        rec.partCode.toLowerCase().includes(historySearch.toLowerCase()) ||
        (rec.workOrderNumber && rec.workOrderNumber.toLowerCase().includes(historySearch.toLowerCase())) ||
        (rec.newPartLotNumber && rec.newPartLotNumber.toLowerCase().includes(historySearch.toLowerCase()));
      const matchesType = historyTypeFilter === 'ALL' || rec.replacementType === historyTypeFilter;
      const matchesLine = rec.lineId === selectedLineId;
      return matchesSearch && matchesType && matchesLine;
    });
  }, [historyRecords, historySearch, historyTypeFilter, selectedLineId]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Line',
      'Die Code',
      'Part Code',
      'Part Name',
      'Position',
      'Replacement Type',
      'Scope',
      'Installed Qty',
      'Changed Qty',
      'Machine Shot at Replacement',
      'Removed Part Shot',
      'Removed Regrind Count',
      'New Lot No',
      'New Serial No',
      'Date Time',
      'Work Order',
      'Changed By',
      'Verified By',
      'Approval Status',
      'Reason'
    ];

    const rows = filteredHistory.map(r => [
      r.id,
      r.lineId,
      r.dieCode,
      r.partCode,
      `"${r.partName}"`,
      `"${r.position}"`,
      r.replacementType,
      r.fullSetOrPartial,
      r.installedQuantity,
      r.changedQuantity,
      r.machineShotAtReplacement,
      r.removedPartUsedShot,
      r.removedPartRegrindCount,
      r.newPartLotNumber || '',
      r.newPartSerialNumber || '',
      r.replacementDateTime || r.timestamp,
      r.workOrderNumber || '',
      `"${r.changedBy || r.technicianName}"`,
      `"${r.verifiedBy || r.approverName || ''}"`,
      r.approvalStatus,
      `"${r.replacementReason || r.reason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinPress_Replacements_${selectedLineId}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Integrated Top Header Card & Line + Tabs Navigation */}
      <div id="replacement-header" className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3 shadow-lg">
        {/* Row 1: Title & Line Selector Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                <Wrench className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Part Replacement Entry & Life Initialization
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-thai">
              บันทึกการเปลี่ยนอะไหล่แม่พิมพ์ Fin Press (เริ่มนับอายุรอบใหม่ พร้อมเก็บประวัติชิ้นเดิม)
            </p>
          </div>

          {/* Line Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-xs font-mono font-black text-cyan-400 px-2 uppercase tracking-wider">LINE:</span>
            {linesList.map(line => (
              <button
                id={`line-tab-${line}`}
                key={line}
                onClick={() => setSelectedLineId(line)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-black transition-all ${
                  selectedLineId === line
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/40 ring-2 ring-cyan-300 scale-105'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
                }`}
              >
                {line}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Navigation Tabs */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <button
              id="tab-entry"
              onClick={() => setActiveTab('entry')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeTab === 'entry'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              New Replacement Entry
            </button>
            <button
              id="tab-drafts"
              onClick={() => setActiveTab('drafts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeTab === 'drafts'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              Drafts ({drafts.length})
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History Log ({historyRecords.length})
            </button>
          </div>

          {activeDraftId && activeTab === 'entry' && (
            <span className="text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Editing Draft: {activeDraftId}
            </span>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div 
          className={`p-4 rounded-lg text-sm flex items-center justify-between gap-3 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
              : notification.type === 'warning'
              ? 'bg-amber-950/80 border border-amber-600 text-amber-300'
              : 'bg-rose-950/80 border border-rose-600 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-black/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: NEW REPLACEMENT ENTRY */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Entry Form (Col 8) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Replacement Transaction Form</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 text-cyan-400 rounded font-mono">
                    Line {selectedLineId}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Die Code: <span className="font-mono text-slate-200">{lineData?.activeConfig?.dieCode || 'N/A'}</span> • Active Config: <span className="font-mono text-slate-200">{lineData?.activeConfig?.id || 'Slot 1'}</span>
                </p>
              </div>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleOpenPreview(); }} className="space-y-6">
              {/* Section 1: Tooling Identification */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  1. Tooling Component & Stage Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Part Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tooling Part Code & Name <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="select-part-code"
                      value={selectedPartCode}
                      onChange={e => handlePartChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      {lineData?.items.map(item => (
                        <option key={item.slotId} value={item.partCode}>
                          {item.stagePunchDie || item.partName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stage Name (Readonly) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Station / Stage Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={selectedItem ? `${selectedItem.stagePunchDie} (Slot ${selectedItem.slotId})` : 'N/A'}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Replacement Scope & Quantities */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  2. Replacement Scope & Quantities
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Replacement Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Replacement Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="select-replacement-type"
                      value={replacementType}
                      onChange={e => handleReplacementTypeChange(e.target.value as ReplacementType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      {REPLACEMENT_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Full Set vs Partial */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Scope (Full Set vs Partial) <span className="text-rose-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setFullSetOrPartial('FULL_SET')}
                        className={`py-1.5 text-xs font-semibold rounded text-center transition-colors ${
                          fullSetOrPartial === 'FULL_SET'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Full Set
                      </button>
                      <button
                        type="button"
                        onClick={() => setFullSetOrPartial('PARTIAL')}
                        className={`py-1.5 text-xs font-semibold rounded text-center transition-colors ${
                          fullSetOrPartial === 'PARTIAL'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Partial
                      </button>
                    </div>
                  </div>

                  {/* Position Numbers */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Position Numbers {fullSetOrPartial === 'PARTIAL' && <span className="text-rose-400">*</span>}
                    </label>
                    <input
                      id="input-position"
                      type="text"
                      value={position}
                      onChange={e => setPosition(e.target.value)}
                      placeholder={fullSetOrPartial === 'PARTIAL' ? 'e.g. Row 1 Pos 1..10' : 'ALL'}
                      disabled={fullSetOrPartial === 'FULL_SET'}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none ${
                        fullSetOrPartial === 'PARTIAL'
                          ? 'border-amber-500/60 text-amber-200 focus:border-amber-400'
                          : 'border-slate-800 text-slate-400'
                      }`}
                      required={fullSetOrPartial === 'PARTIAL'}
                    />
                    {fullSetOrPartial === 'PARTIAL' && (
                      <p className="text-[11px] text-amber-400 mt-1 font-thai">
                        * กฎข้อ 5: เปลี่ยนบางส่วนต้องระบุเลขตำแหน่ง / แถวที่เปลี่ยน
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Installed Qty */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Installed Quantity in Die (EA)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={installedQuantity}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 font-bold"
                    />
                  </div>

                  {/* Changed Qty */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Changed / Replaced Quantity (EA) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-changed-quantity"
                      type="number"
                      min="1"
                      max={installedQuantity}
                      value={changedQuantity}
                      onChange={e => setChangedQuantity(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Full Set Quantity Mismatch Warning / Supervisor Override */}
                {fullSetOrPartial === 'FULL_SET' && changedQuantity !== installedQuantity && (
                  <div className="p-4 bg-amber-950/60 border border-amber-600/80 rounded-lg space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Quantity Mismatch Rule (Rule 8 & 9): Full set replacement requested but changed qty ({changedQuantity}) ≠ installed qty ({installedQuantity})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-200 mb-1">
                          Mismatch Justification Reason <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={quantityMismatchReason}
                          onChange={e => setQuantityMismatchReason(e.target.value)}
                          placeholder="e.g. 4 spare punches defective in lot, emergency partial swap"
                          className="w-full bg-slate-950 border border-amber-500/60 rounded px-3 py-1.5 text-xs text-amber-100 focus:border-amber-400 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-200 mb-1">
                          Supervisor Approval Override <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={quantityMismatchApprovedBy}
                          onChange={e => setQuantityMismatchApprovedBy(e.target.value)}
                          placeholder="e.g. Somchai M. (Lead Supervisor)"
                          className="w-full bg-slate-950 border border-amber-500/60 rounded px-3 py-1.5 text-xs text-amber-100 focus:border-amber-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Machine & Part Meter Tracking (Rules 1, 3, 4) */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  3. Machine Shot Meter & Removed Part History
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Machine Shot at Replacement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Machine Shot at Replacement <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-machine-shot"
                      type="number"
                      value={machineShotAtReplacement}
                      onChange={e => setMachineShotAtReplacement(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Fin Press Meter: {formatShots(lineData?.machineShotTotal || 0)}
                    </p>
                  </div>

                  {/* Removed Part Used Shot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Removed Part Used Shot (Preserved)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={removedPartUsedShot}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      * กฎข้อ 3: เก็บบันทึกประวัติช็อตสะสมเดิมไว้ถาวร
                    </p>
                  </div>

                  {/* Removed Part Regrind Count */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Removed Part Regrind Count
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={removedPartRegrindCount}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-300"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Max Allowed: {matchedRegrindStd?.maxRegrindCount || 4} cycles
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Traceability, Lots, Work Order & Personnel */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  4. Traceability, Work Order & Personnel
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* New Part Lot Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      New Part Lot Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-new-lot"
                      type="text"
                      value={newPartLotNumber}
                      onChange={e => setNewPartLotNumber(e.target.value)}
                      placeholder="e.g. LOT-2026-NP-882"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* New Part Serial Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      New Part Serial No. (If applicable)
                    </label>
                    <input
                      type="text"
                      value={newPartSerialNumber}
                      onChange={e => setNewPartSerialNumber(e.target.value)}
                      placeholder="e.g. SN-LP-092-A"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Replacement Date & Time */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Replacement Date & Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={replacementDateTime}
                      onChange={e => setReplacementDateTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Work Order Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Work Order Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="input-work-order"
                      type="text"
                      value={workOrderNumber}
                      onChange={e => setWorkOrderNumber(e.target.value)}
                      placeholder="e.g. WO-2026-4412"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Changed By */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Changed By (Technician) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={changedBy}
                      onChange={e => setChangedBy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Verified By */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Verified By (Lead / Supervisor) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={verifiedBy}
                      onChange={e => setVerifiedBy(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Replacement Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Replacement Reason <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={replacementReason}
                    onChange={e => setReplacementReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Normal Preventive Life Limit Reached">Normal Preventive Life Limit Reached (ถึงเกณฑ์อายุการใช้งานตามแผน)</option>
                    <option value="Burr Height Exceeded Limit (>0.035mm)">Burr Height Exceeded Limit (ครีบเสี้ยนสูงเกินมาตรฐาน &gt;0.035mm)</option>
                    <option value="Chipping / Edge Breakage">Chipping / Edge Breakage (คมมีดบิ่น/แตกหักระหว่างการผลิต)</option>
                    <option value="Severe Abrasive Wear / Scoring">Severe Abrasive Wear / Scoring (ผิวสึกหรอหรือเกิดรอยขูดขีดรุนแรง)</option>
                    <option value="Die Clearance Alignment Issue">Die Clearance Alignment Issue (ช่องว่างคัดตัดคลาดเคลื่อน)</option>
                    <option value="Scheduled Die Overhaul & Regrind Swap">Scheduled Die Overhaul & Regrind Swap (สลับชุดโอเวอร์ฮอลล์ประจำรอบ)</option>
                    <option value="Product Specification Change">Product Specification Change (เปลี่ยนสเปกผลิตภัณฑ์/Fin Profile)</option>
                  </select>
                </div>

                {/* Evidence Attachment & Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload / Attachment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Evidence Attachment (Inspection Sheet / Photo / WO)
                    </label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-lg p-3 text-center bg-slate-950/50 transition-colors">
                      <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      {evidenceFileName ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 font-mono">
                          <span>{evidenceFileName}</span>
                          <button
                            type="button"
                            onClick={() => setEvidenceFileName(null)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <span className="text-xs text-cyan-400 font-semibold hover:underline">
                            Click to upload photo/sheet
                          </span>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            PNG, JPG, PDF up to 10MB
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setEvidenceFileName(e.target.files[0].name);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Technician Remarks / Maintenance Note
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Enter detailed maintenance notes, torque inspection results, alignment checks..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    handlePartChange(selectedPartCode);
                    setNotification({ type: 'warning', message: 'Form reset to current line values.' });
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
                >
                  Clear / Reset Form
                </button>

                <button
                  id="btn-open-preview"
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01]"
                >
                  <Eye className="w-4 h-4" />
                  Review Before & After Preview
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary & Live Tooling Info Card (Col 4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Live Part Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Current Active Tool State
                </h3>
                <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
                  selectedItem?.alertStatus === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  selectedItem?.alertStatus === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {selectedItem?.alertStatus || 'NORMAL'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Selected Component:</span>
                  <span className="font-mono font-bold text-slate-200 text-right">{selectedItem?.partName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Current Accumulated Shot:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatShots(selectedItem?.usedShot !== undefined ? selectedItem.usedShot : (selectedItem?.currentShot || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Life Limit:</span>
                  <span className="font-mono text-slate-300">{formatShots(selectedItem?.lifeLimit || 0)} shots</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Life Consumed:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedItem?.usagePercent || 0}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Remaining Life:</span>
                  <span className="font-mono text-slate-300">{formatShots(selectedItem?.remainingShot || 0)} shots</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Current Regrind Cycle:</span>
                  <span className="font-mono text-slate-200">{selectedItem?.regrindCount || 0} / {matchedRegrindStd?.maxRegrindCount || 4} cycles</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Warehouse Backup Stock:</span>
                  <span className={`font-mono font-bold ${
                    (matchedStock?.currentStockQty || 0) < 10 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {matchedStock?.currentStockQty || 0} EA available
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Replacement Rules Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Compliance & Quality Safeguards
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Rule 1 & 2:</strong> Used shots reset strictly upon approved replacement transaction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Rule 3 & 4:</strong> Removed part final shots and machine meter recorded permanently.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Rule 5 & 6:</strong> Partial replacements require station position tracking.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Rule 8 & 9:</strong> Full set replacement verifies changed qty vs die install qty.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Rule 10 & 11:</strong> Blocks scrapped lots or tools exceeding max regrind cycles.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Replacement Audit Trail & Life History Ledger
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-thai">
                ประวัติการเปลี่ยนชิ้นส่วนแม่พิมพ์และบันทึกยอดช็อตสะสมเดิมของชิ้นส่วนที่ถูกถอดออก (Line {selectedLineId})
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Part, WO, Lot..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Type Filter */}
              <select
                value={historyTypeFilter}
                onChange={e => setHistoryTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                {REPLACEMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                  <th className="p-3">ID / Work Order</th>
                  <th className="p-3">Component / Stage</th>
                  <th className="p-3">Type & Scope</th>
                  <th className="p-3 text-center">Changed Qty</th>
                  <th className="p-3 text-right">Machine Shot</th>
                  <th className="p-3 text-right">Removed Part Shot</th>
                  <th className="p-3">New Lot / Serial</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No replacement history records found for Line {selectedLineId}.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-cyan-400 block">{rec.id}</span>
                        <span className="text-[11px] text-slate-400">{rec.workOrderNumber || 'WO-N/A'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-200 block">{rec.partName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{rec.partCode} ({rec.stageName})</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.replacementType === 'NEW PART' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' :
                          rec.replacementType === 'RE-GROUND PART' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                          rec.replacementType === 'PARTIAL REPLACEMENT' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          rec.replacementType === 'SCRAP' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {rec.replacementType}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Pos: {rec.position || 'ALL'}</span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="font-bold text-slate-100">{rec.changedQuantity || rec.replacedQty}</span>
                        <span className="text-slate-500 text-[10px] block">/ {rec.installedQuantity || rec.installQtyTotal || rec.changedQuantity} EA</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-cyan-300">
                        {formatShots(rec.machineShotAtReplacement || rec.shotAtReplacement || 0)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className="font-bold text-amber-300 block">
                          {formatShots(rec.removedPartUsedShot !== undefined ? rec.removedPartUsedShot : (rec.partAccumulatedShots || 0))}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Cycle: {rec.removedPartRegrindCount || rec.regrindCycleCount || 0}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        <span className="text-slate-300 block">{rec.newPartLotNumber || '-'}</span>
                        {rec.newPartSerialNumber && (
                          <span className="text-[11px] text-slate-400">SN: {rec.newPartSerialNumber}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 text-xs">
                        {rec.replacementDateTime || rec.replacementDate || rec.timestamp}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.approvalStatus === 'APPROVED' || rec.approvalStatus === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : rec.approvalStatus === 'SUBMITTED' || rec.approvalStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {rec.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setInspectModalRecord(rec)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(rec.approvalStatus === 'SUBMITTED' || rec.approvalStatus === 'PENDING') && currentUser.role !== 'OPERATOR' && (
                            <button
                              onClick={() => handleApproveRecord(rec.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors"
                              title="Approve & Apply"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRAFTS */}
      {activeTab === 'drafts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Save className="w-5 h-5 text-amber-400" />
              Saved Replacement Drafts
            </h2>
            <span className="text-xs text-slate-400">{drafts.length} drafts stored in local cache</span>
          </div>

          {drafts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No replacement drafts currently saved.</p>
              <button
                onClick={() => setActiveTab('entry')}
                className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold"
              >
                Create New Replacement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drafts.map(d => (
                <div key={d.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{d.id}</span>
                    <span className="text-[10px] text-slate-500">{d.updatedAt?.substring(0, 16)}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-200 font-semibold">{d.partCode} ({d.lineId})</p>
                    <p className="text-slate-400">Type: <span className="text-slate-300">{d.replacementType}</span></p>
                    <p className="text-slate-400">Scope: <span className="text-slate-300">{d.fullSetOrPartial} (Qty: {d.changedQuantity})</span></p>
                    <p className="text-slate-400">WO: <span className="font-mono text-slate-300">{d.workOrderNumber || 'N/A'}</span></p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleLoadDraft(d)}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold transition-colors"
                    >
                      Load into Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BEFORE AND AFTER PREVIEW MODAL */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  Tooling Replacement Verification & Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm the changes before executing the replacement transaction.
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warnings / Error notice */}
            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/70 border border-amber-600/80 rounded-lg space-y-1">
                {previewData.warnings.map((w: string, idx: number) => (
                  <p key={idx} className="text-xs text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Before vs After Comparison Card */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before State */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>BEFORE REPLACEMENT</span>
                  <span className="text-rose-400">Current</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tool Accumulated Shot:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatShots(previewData.before?.partUsedShot || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Regrind Cycle:</span>
                    <span className="font-mono text-slate-200">{previewData.before?.partRegrindCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Warehouse Stock:</span>
                    <span className="font-mono text-slate-300">{previewData.before?.warehouseStockQty || 0} EA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alert Status:</span>
                    <span className="font-mono text-amber-400">{previewData.before?.partAlertStatus || 'NORMAL'}</span>
                  </div>
                </div>
              </div>

              {/* After State */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-lg p-4 space-y-3 shadow-lg shadow-cyan-500/5">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>AFTER REPLACEMENT</span>
                  <span className="text-emerald-400 font-bold">New Life Cycle</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tool Accumulated Shot:</span>
                    <span className="font-mono font-bold text-emerald-400">0 shots (Reset)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Regrind Cycle:</span>
                    <span className="font-mono text-cyan-300 font-bold">{previewData.after?.partRegrindCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Warehouse Stock:</span>
                    <span className="font-mono text-cyan-300 font-bold">{previewData.after?.warehouseStockQty || 0} EA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preserved Old Shot:</span>
                    <span className="font-mono text-amber-300 font-bold">{formatShots(previewData.after?.preservedRemovedShot || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Summary */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5 font-mono">
              <p className="text-slate-300">
                <span className="text-slate-500">Transaction:</span> {replacementType} ({fullSetOrPartial}) • {changedQuantity} EA
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">Work Order / Lot:</span> {workOrderNumber} • {newPartLotNumber}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">Machine Meter:</span> {machineShotAtReplacement.toLocaleString()} shots on Line {selectedLineId}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Back to Edit
              </button>
              <button
                id="btn-confirm-submit"
                type="button"
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                Confirm & Execute Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT RECORD MODAL */}
      {inspectModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Replacement Details: {inspectModalRecord.id}
                </h3>
                <span className="text-xs text-slate-400">Line {inspectModalRecord.lineId} • Die {inspectModalRecord.dieCode}</span>
              </div>
              <button
                onClick={() => setInspectModalRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Part Name:</span>
                <span className="font-bold text-slate-200">{inspectModalRecord.partName}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Part Code:</span>
                <span className="font-mono text-cyan-300">{inspectModalRecord.partCode}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Replacement Type:</span>
                <span className="font-bold text-amber-300">{inspectModalRecord.replacementType}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Position:</span>
                <span className="font-mono text-slate-200">{inspectModalRecord.position || 'ALL'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Machine Meter at Change:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {formatShots(inspectModalRecord.machineShotAtReplacement || inspectModalRecord.shotAtReplacement || 0)}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Removed Part Final Shot:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {formatShots(inspectModalRecord.removedPartUsedShot !== undefined ? inspectModalRecord.removedPartUsedShot : (inspectModalRecord.partAccumulatedShots || 0))}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">New Lot / Serial:</span>
                <span className="font-mono text-slate-200">{inspectModalRecord.newPartLotNumber || '-'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Work Order:</span>
                <span className="font-mono text-slate-200">{inspectModalRecord.workOrderNumber || '-'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Changed By:</span>
                <span className="text-slate-200">{inspectModalRecord.changedBy || inspectModalRecord.technicianName}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-400 block">Verified By:</span>
                <span className="text-slate-200">{inspectModalRecord.verifiedBy || inspectModalRecord.approverName || 'Pending'}</span>
              </div>
            </div>

            {inspectModalRecord.note && (
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                <span className="text-slate-400 block font-semibold mb-1">Maintenance Notes:</span>
                <p className="text-slate-300">{inspectModalRecord.note}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectModalRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
