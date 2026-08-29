import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Copy, 
  GitBranch, 
  ArrowLeftRight, 
  Play, 
  Square, 
  Layers, 
  Save, 
  Clock, 
  Eye, 
  Search, 
  Plus, 
  Trash2, 
  Sliders, 
  ShieldCheck, 
  Check, 
  X, 
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Cpu,
  Hash,
  Activity,
  History
} from 'lucide-react';
import { 
  ProductionLineId, 
  LineActiveConfiguration, 
  ConfigurationStatus,
  FinMaterial, 
  TubeSize, 
  FinType,
  PartMaster,
  PartLifeStandard,
  UserRole,
  SpareStockItem
} from '../types';
import { storageService } from '../services/storageService';
import { findMatchingLifeStandard, generateCompositeKey } from '../services/calculationService';

// Re-export PartMasterView so existing imports continue working seamlessly
export { PartMasterView } from './PartMasterView';

const ALL_LINES: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];
const ALL_MATERIALS: FinMaterial[] = ['PCM', 'GOLD', 'BARE'];
const ALL_TUBE_SIZES: TubeSize[] = ['Ø5', 'Ø7', 'Ø9.52'];
const ALL_FIN_TYPES: FinType[] = [
  'Slit (half)', 
  'Slit (full)', 
  'Standard Corrugated', 
  'Louver High Performance', 
  'Lover',
  'Wide +', 
  'Flat'
];

const MACHINE_PRESETS: Record<ProductionLineId, string[]> = {
  'E1': ['PRESS-E1 (OAK 100T)', 'PRESS-E1 (SECONDARY 80T)'],
  'E2': ['PRESS-E2 (HIDAKA 80T)', 'PRESS-E2 (OAK FP-100)'],
  'E3-1': ['PRESS-E3-1 (OAK 100T)', 'PRESS-E3-1 (SCHULER 120T)'],
  'E3-2': ['PRESS-E3-2 (HIDAKA 100T)', 'PRESS-E3-2 (OAK 100T)'],
  'E3-3': ['PRESS-E3-3 (OAK 100T)', 'PRESS-E3-3 (HIDAKA 80T)'],
  'E4': ['PRESS-E4 (HIDAKA 80T)', 'PRESS-E4 (OAK 60T)'],
  'E5': ['PRESS-E5 (OAK 100T)', 'PRESS-E5 (HIDAKA 80T)'],
  'E6': ['PRESS-E6 (OAK FP-100)', 'PRESS-E6 (OAK FP-150)']
};

export const LineConfigurationView: React.FC = () => {
  const [allConfigs, setAllConfigs] = useState<LineActiveConfiguration[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>('E6');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [editingConfig, setEditingConfig] = useState<LineActiveConfiguration | null>(null);

  // External reference data
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [lifeStandards, setLifeStandards] = useState<PartLifeStandard[]>([]);
  const [spareStocks, setSpareStocks] = useState<SpareStockItem[]>([]);
  const currentUser = storageService.getCurrentUser();

  // Filter and preview tab state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [previewTab, setPreviewTab] = useState<'parts' | 'quantities' | 'standards' | 'validation'>('parts');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Dialogs
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [showNewSlotModal, setShowNewSlotModal] = useState<boolean>(false);

  // Workflow Form fields
  const [activationReason, setActivationReason] = useState<string>('');
  const [approverName, setApproverName] = useState<string>(currentUser.name);
  const [customSlotName, setCustomSlotName] = useState<string>('');
  const [deactivateReason, setDeactivateReason] = useState<string>('');

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Reload data from storage
  const reloadData = () => {
    const configs = storageService.getLineConfigs();
    setAllConfigs(configs);
    setPartMasters(storageService.getPartMasters());
    setLifeStandards(storageService.getLifeStandards());
    setSpareStocks(storageService.getSpareStocks());

    // Select matching or active config for current line
    const lineConfigs = configs.filter(c => c.lineId === selectedLineId);
    let target = lineConfigs.find(c => c.id === selectedConfigId);
    if (!target) {
      target = lineConfigs.find(c => c.isActive) || lineConfigs[0];
    }

    if (target) {
      setSelectedConfigId(target.id);
      setEditingConfig(JSON.parse(JSON.stringify(target)));
    } else {
      // Fallback empty config template
      const fallback: LineActiveConfiguration = {
        id: `CFG-${selectedLineId}-${Date.now().toString().slice(-4)}`,
        lineId: selectedLineId,
        lineName: `Fin Press Line ${selectedLineId}`,
        configurationSlot: 'SLOT-01 (Primary Run)',
        machineId: MACHINE_PRESETS[selectedLineId]?.[0] || `PRESS-${selectedLineId}`,
        mainFinDie: `Fin Die ${selectedLineId}`,
        dieCode: `FD-${selectedLineId}-07`,
        dieName: `Fin Die ${selectedLineId}`,
        tubeSize: 'Ø7',
        rowsCount: 4,
        columnsCount: 42,
        pathsCount: '4P',
        finType: 'Slit (half)',
        material: 'PCM',
        thicknessMm: 0.10,
        effectiveFrom: new Date().toISOString().substring(0, 16),
        status: 'DRAFT',
        isActive: false,
        revision: 'Rev 1.0',
        versionNumber: 1,
        reasonForChange: 'New configuration draft',
        installedPartQuantities: {}
      };
      setEditingConfig(fallback);
      setSelectedConfigId(fallback.id);
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, [selectedLineId]);

  // Configurations for selected line
  const currentLineConfigs = useMemo(() => {
    return allConfigs.filter(c => c.lineId === selectedLineId);
  }, [allConfigs, selectedLineId]);

  // Conflict detection: Check for multiple active configs on any line
  const conflictingActiveConfigs = useMemo(() => {
    const activeByLine: Record<string, LineActiveConfiguration[]> = {};
    allConfigs.forEach(c => {
      if (c.isActive) {
        if (!activeByLine[c.lineId]) activeByLine[c.lineId] = [];
        activeByLine[c.lineId].push(c);
      }
    });

    const conflicts: { lineId: string; configs: LineActiveConfiguration[] }[] = [];
    Object.entries(activeByLine).forEach(([lineId, list]) => {
      if (list.length > 1) {
        conflicts.push({ lineId, configs: list });
      }
    });
    return conflicts;
  }, [allConfigs]);

  // Active configuration for current line
  const activeLineConfig = useMemo(() => {
    return currentLineConfigs.find(c => c.isActive);
  }, [currentLineConfigs]);

  // Part assembly analysis for editingConfig
  const assemblyAnalysis = useMemo(() => {
    if (!editingConfig) return { items: [], missingStandardsCount: 0, missingQtyCount: 0, totalInstalledParts: 0 };

    const installedMap = editingConfig.installedPartQuantities || {};
    const partCodes = Object.keys(installedMap);

    // If no explicit installedPartQuantities configured, infer from compatible PartMasters
    const relevantPartCodes = partCodes.length > 0
      ? partCodes
      : partMasters
          .filter(p => p.tubeSizeCompat === editingConfig.tubeSize || p.tubeSizeCompat === 'BOTH')
          .slice(0, 12)
          .map(p => p.partCode);

    let missingStandardsCount = 0;
    let missingQtyCount = 0;
    let totalInstalledParts = 0;

    const items = relevantPartCodes.map(code => {
      const master = partMasters.find(p => p.partCode === code);
      const qty = installedMap[code] ?? 0;
      if (qty <= 0) missingQtyCount++;
      totalInstalledParts += qty;

      const matchedStandard = findMatchingLifeStandard(lifeStandards, editingConfig, code, 'ALL');
      const isMissingStandard = !matchedStandard;
      if (isMissingStandard) missingStandardsCount++;

      const stock = spareStocks.find(s => s.partCode === code);

      return {
        partCode: code,
        partName: master ? master.partName : code,
        partNameTh: master?.partNameTh || '',
        stageName: master ? master.stageName : 'Tooling Stage',
        category: master ? master.category : 'OTHER',
        drawingNumber: master ? master.drawingNumber : '-',
        unitCostThb: master ? master.unitCostThb : 0,
        installQty: qty,
        standard: matchedStandard,
        isMissingStandard,
        isMissingQty: qty <= 0,
        stockQty: stock ? stock.currentStockQty : 0,
        compositeKey: matchedStandard ? matchedStandard.compositeKeyString : generateCompositeKey({
          lineId: editingConfig.lineId,
          configurationId: editingConfig.id,
          dieCode: editingConfig.dieCode,
          finType: editingConfig.finType,
          material: editingConfig.material,
          thicknessMm: editingConfig.thicknessMm,
          tubeSize: editingConfig.tubeSize,
          partCode: code,
          position: 'ALL',
          effectiveDate: editingConfig.effectiveFrom?.substring(0, 10) || '2025-01-31'
        })
      };
    });

    return {
      items,
      missingStandardsCount,
      missingQtyCount,
      totalInstalledParts
    };
  }, [editingConfig, partMasters, lifeStandards, spareStocks]);

  // Handle switching selected config
  const handleSelectConfig = (cfgId: string) => {
    const target = allConfigs.find(c => c.id === cfgId);
    if (target) {
      setSelectedConfigId(target.id);
      setSelectedLineId(target.lineId);
      setEditingConfig(JSON.parse(JSON.stringify(target)));
    }
  };

  // Function 1: Load Standard (Match & populate standard parts and life limits)
  const handleLoadStandard = () => {
    if (!editingConfig) return;

    // Find all standards that match this line or general standards with same tube & material
    const matchedStandards = lifeStandards.filter(s => {
      const matchTube = s.configKey.tubeSize === editingConfig.tubeSize || s.configKey.tubeSize === 'BOTH';
      const matchMat = s.configKey.material.toUpperCase() === editingConfig.material.toUpperCase();
      const matchLine = s.configKey.lineId === 'ALL' || s.configKey.lineId === editingConfig.lineId;
      return matchTube && (matchMat || matchLine);
    });

    const newQuantities: Record<string, number> = { ...editingConfig.installedPartQuantities };

    // Auto-populate install quantities if empty
    if (Object.keys(newQuantities).length === 0 || Object.values(newQuantities).every(v => v === 0)) {
      matchedStandards.forEach(s => {
        const code = s.configKey.partCode;
        if (!newQuantities[code]) {
          if (code.includes('SLIT') && code.includes('P-')) newQuantities[code] = 138;
          else if (code.includes('SLIT') && code.includes('D-')) newQuantities[code] = 12;
          else if (code.includes('ROW-SLIT')) newQuantities[code] = 90;
          else if (code.includes('CUT-OFF')) newQuantities[code] = 3;
          else if (code.includes('SIDE-CUT')) newQuantities[code] = 2;
          else if (code.includes('FEED') || code.includes('PIN')) newQuantities[code] = 138;
          else newQuantities[code] = 4;
        }
      });
    }

    setEditingConfig({
      ...editingConfig,
      installedPartQuantities: newQuantities
    });

    showToast('success', `Standard specifications loaded! Found ${matchedStandards.length} matching life standards for ${editingConfig.tubeSize} ${editingConfig.material}.`);
  };

  // Save changes to current config
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    storageService.saveLineConfig(editingConfig);
    showToast('success', `Configuration ${editingConfig.id} (${editingConfig.revision || 'Rev 1.0'}) saved successfully!`);
  };

  // Function 5: Activate Configuration
  const handleConfirmActivation = () => {
    if (!editingConfig) return;
    if (!activationReason.trim()) {
      showToast('error', 'Reason for change is mandatory before activating a production configuration.');
      return;
    }

    const result = storageService.activateLineConfig(
      editingConfig.id,
      activationReason,
      approverName || currentUser.name,
      editingConfig.effectiveFrom
    );

    if (result.success) {
      setShowActivationModal(false);
      setActivationReason('');
      showToast('success', result.message);
      reloadData();
    } else {
      showToast('error', result.message);
    }
  };

  // Function 6: Deactivate Configuration
  const handleConfirmDeactivation = () => {
    if (!editingConfig) return;
    const result = storageService.deactivateLineConfig(editingConfig.id, deactivateReason);
    if (result.success) {
      setShowDeactivateModal(false);
      setDeactivateReason('');
      showToast('warning', result.message);
      reloadData();
    } else {
      showToast('error', result.message);
    }
  };

  // Function 7: Clone Configuration
  const handleCloneConfig = () => {
    if (!editingConfig) return;
    const cloned = storageService.cloneLineConfig(editingConfig.id);
    if (cloned) {
      setSelectedConfigId(cloned.id);
      setEditingConfig(cloned);
      showToast('success', `Configuration cloned as ${cloned.id} in DRAFT status.`);
    }
  };

  // Function 8: Create New Revision
  const handleCreateRevision = () => {
    if (!editingConfig) return;
    const rev = storageService.createLineConfigRevision(editingConfig.id);
    if (rev) {
      setSelectedConfigId(rev.id);
      setEditingConfig(rev);
      showToast('success', `Created new engineering revision ${rev.revision} (${rev.id}) in DRAFT status.`);
    }
  };

  // Submit for Approval
  const handleSubmitApproval = () => {
    if (!editingConfig) return;
    const ok = storageService.submitConfigForApproval(editingConfig.id);
    if (ok) {
      showToast('success', `Configuration ${editingConfig.id} submitted for supervisor approval.`);
      reloadData();
    }
  };

  // Delete Draft
  const handleDeleteConfig = () => {
    if (!editingConfig) return;
    if (window.confirm(`Are you sure you want to delete draft configuration ${editingConfig.id}?`)) {
      const res = storageService.deleteLineConfig(editingConfig.id);
      if (res.success) {
        showToast('warning', res.message);
        reloadData();
      } else {
        showToast('error', res.message);
      }
    }
  };

  // Quick helper to add a part to the assembly
  const handleAddPartToAssembly = (partCode: string) => {
    if (!editingConfig) return;
    const updated = { ...editingConfig.installedPartQuantities, [partCode]: 1 };
    setEditingConfig({ ...editingConfig, installedPartQuantities: updated });
    showToast('success', `Added ${partCode} to installation assembly.`);
  };

  // Helper to remove part from assembly
  const handleRemovePartFromAssembly = (partCode: string) => {
    if (!editingConfig) return;
    const updated = { ...editingConfig.installedPartQuantities };
    delete updated[partCode];
    setEditingConfig({ ...editingConfig, installedPartQuantities: updated });
  };

  // Helper to update quantity for a part
  const handleUpdateQty = (partCode: string, qty: number) => {
    if (!editingConfig) return;
    const updated = { ...editingConfig.installedPartQuantities, [partCode]: Math.max(0, qty) };
    setEditingConfig({ ...editingConfig, installedPartQuantities: updated });
  };

  // Comparison target config
  const compareConfig = useMemo(() => {
    if (!compareTargetId) {
      return activeLineConfig || allConfigs.find(c => c.id !== editingConfig?.id) || null;
    }
    return allConfigs.find(c => c.id === compareTargetId) || null;
  }, [allConfigs, compareTargetId, activeLineConfig, editingConfig]);

  // Filtered configurations list for status panel
  const filteredConfigs = useMemo(() => {
    return currentLineConfigs.filter(c => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return c.isActive;
      return (c.status || 'DRAFT') === statusFilter;
    });
  }, [currentLineConfigs, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Settings2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Line & Tooling Master Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-thai">
                ระบบจัดการและควบคุมโครงสร้างแม่พิมพ์สำหรับสายการผลิต E1 - E6 พร้อมระบบตรวจสอบมาตรฐานอายุและประวัติการสับเปลี่ยนชุดแม่พิมพ์
              </p>
            </div>
          </div>
        </div>

        {/* Line Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          {ALL_LINES.map(line => {
            const hasActive = allConfigs.some(c => c.lineId === line && c.isActive);
            const lineCount = allConfigs.filter(c => c.lineId === line).length;
            const isSelected = selectedLineId === line;
            return (
              <button
                key={line}
                onClick={() => setSelectedLineId(line)}
                className={`relative px-3 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <span>Line {line}</span>
                {hasActive && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}`} />
                )}
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {lineCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conflicting Active Configuration Banner (Req #12) */}
      {conflictingActiveConfigs.length > 0 && (
        <div className="p-4 bg-rose-950/70 border-2 border-rose-600/80 rounded-lg text-rose-200 flex items-start gap-3 animate-fadeIn">
          <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-300 flex items-center gap-2">
              <span>CONFLICT DETECTED: Multiple Active Configurations Found</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-mono">
                {conflictingActiveConfigs.map(c => `Line ${c.lineId}`).join(', ')}
              </span>
            </div>
            <p className="text-xs text-rose-300/90 leading-relaxed font-thai">
              มีคอนฟิกกูเรชันเปิดใช้งานพร้อมกันมากกว่า 1 รายการในสายการผลิตเดียวกัน กรุณากำหนดให้มีคอนฟิกที่ ACTIVE ได้เพียง 1 รายการต่อสาย เพื่อป้องกันความคลาดเคลื่อนของยอดช็อตสะสม
            </p>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toastMessage && (
        <div className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-3 animate-fadeIn ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' 
            : toastMessage.type === 'warning'
            ? 'bg-amber-950/80 border-amber-600 text-amber-300'
            : 'bg-rose-950/80 border-rose-600 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {toastMessage.type === 'error' && <AlertOctagon className="w-4 h-4 text-rose-400" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Configuration Status Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'ALL SLOTS', count: currentLineConfigs.length, status: 'ALL', color: 'border-slate-800 text-slate-300 bg-slate-900' },
          { label: 'ACTIVE', count: currentLineConfigs.filter(c => c.isActive).length, status: 'ACTIVE', color: 'border-emerald-700/60 text-emerald-300 bg-emerald-950/30' },
          { label: 'DRAFT', count: currentLineConfigs.filter(c => (c.status || 'DRAFT') === 'DRAFT' && !c.isActive).length, status: 'DRAFT', color: 'border-slate-700 text-slate-400 bg-slate-950' },
          { label: 'PENDING APPROVAL', count: currentLineConfigs.filter(c => c.status === 'PENDING APPROVAL').length, status: 'PENDING APPROVAL', color: 'border-amber-700/60 text-amber-300 bg-amber-950/30' },
          { label: 'INACTIVE', count: currentLineConfigs.filter(c => c.status === 'INACTIVE').length, status: 'INACTIVE', color: 'border-blue-900/60 text-blue-300 bg-blue-950/30' },
          { label: 'EXPIRED', count: currentLineConfigs.filter(c => c.status === 'EXPIRED').length, status: 'EXPIRED', color: 'border-zinc-800 text-zinc-400 bg-zinc-950' }
        ].map(item => (
          <button
            key={item.status}
            onClick={() => setStatusFilter(item.status)}
            className={`p-3 rounded-lg border text-left transition-all ${item.color} ${
              statusFilter === item.status ? 'ring-2 ring-cyan-500 shadow-md' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <div className="text-[10px] font-bold tracking-wider uppercase">{item.label}</div>
            <div className="text-xl font-bold font-mono mt-1 flex items-baseline justify-between">
              <span>{item.count}</span>
              {item.status === 'ACTIVE' && item.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans font-normal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main Configuration Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Slot Selector and Config Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slot Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <span>Configuration Slot for Line {selectedLineId}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                    {currentLineConfigs.length} total
                  </span>
                </h3>
              </div>

              {/* Slot Action toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCloneConfig}
                  title="Clone this configuration to a new draft slot"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Clone</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateRevision}
                  title="Create new engineering revision"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Revision</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowComparisonModal(true)}
                  title="Compare old and new configuration parameters"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compare</span>
                </button>
              </div>
            </div>

            {/* Slot List Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentLineConfigs.map(c => {
                const isSelected = selectedConfigId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConfig(c.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-200 truncate">
                        {c.configurationSlot || c.id}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.isActive 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : c.status === 'PENDING APPROVAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.isActive ? 'ACTIVE' : c.status || 'DRAFT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                      <span className="text-cyan-400">{c.dieCode}</span>
                      <span>•</span>
                      <span>{c.tubeSize}</span>
                      <span>•</span>
                      <span className="text-amber-300">{c.material}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{c.thicknessMm}mm</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{c.revision || 'Rev 1.0'}</span>
                      <span>{c.effectiveFrom?.substring(0, 10)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form */}
          {editingConfig && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Configuration Parameters: {editingConfig.id}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Revision: <span className="font-mono text-cyan-300">{editingConfig.revision || 'Rev 1.0'}</span> • Status: <span className="font-bold text-slate-200">{editingConfig.status || 'DRAFT'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadStandard}
                    className="px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Load standard tooling specs matching these parameters"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Load Standard</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveDraft} className="space-y-4">
                {/* Line & Slot & Machine */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Production Line <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editingConfig.lineId}
                      onChange={e => {
                        const lId = e.target.value as ProductionLineId;
                        setEditingConfig({
                          ...editingConfig,
                          lineId: lId,
                          machineId: MACHINE_PRESETS[lId]?.[0] || `PRESS-${lId}`
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      {ALL_LINES.map(l => (
                        <option key={l} value={l}>Line {l}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Configuration Slot <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingConfig.configurationSlot || ''}
                      onChange={e => setEditingConfig({ ...editingConfig, configurationSlot: e.target.value })}
                      placeholder="e.g. SLOT-01 (Primary Run)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Machine Model / ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingConfig.machineId || ''}
                      onChange={e => setEditingConfig({ ...editingConfig, machineId: e.target.value })}
                      placeholder="e.g. PRESS-E6 (OAK FP-100)"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Main Fin Die & Die Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Main Fin Die Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingConfig.dieName || editingConfig.mainFinDie || ''}
                      onChange={e => setEditingConfig({ 
                        ...editingConfig, 
                        dieName: e.target.value,
                        mainFinDie: e.target.value 
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Die Code (รหัสแม่พิมพ์) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingConfig.dieCode}
                      onChange={e => setEditingConfig({ ...editingConfig, dieCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. FD-E6-07"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Tube Size & Fin Type & Aluminum Material */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Tube Size (ขนาดท่อ) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editingConfig.tubeSize}
                      onChange={e => setEditingConfig({ ...editingConfig, tubeSize: e.target.value as TubeSize })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-400 font-bold focus:border-cyan-500 focus:outline-none"
                    >
                      {ALL_TUBE_SIZES.map(t => (
                        <option key={t} value={t}>{t} mm</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Fin Type (ชนิดฟิน) <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editingConfig.finType}
                      onChange={e => setEditingConfig({ ...editingConfig, finType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    >
                      {ALL_FIN_TYPES.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Aluminum Material <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editingConfig.material}
                      onChange={e => setEditingConfig({ ...editingConfig, material: e.target.value as FinMaterial })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:border-cyan-500 focus:outline-none"
                    >
                      {ALL_MATERIALS.map(m => (
                        <option key={m} value={m}>{m} ({m === 'PCM' ? 'Pre-Coated' : m === 'GOLD' ? 'Gold Hydrophilic' : 'Bare Aluminum'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Thickness & Rows & Paths */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Material Thickness (mm) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      min="0.05"
                      max="0.50"
                      value={editingConfig.thicknessMm}
                      onChange={e => setEditingConfig({ ...editingConfig, thicknessMm: parseFloat(e.target.value) || 0.10 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Number of Rows (จำนวนแถว)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={editingConfig.rowsCount || 4}
                      onChange={e => setEditingConfig({ ...editingConfig, rowsCount: parseInt(e.target.value, 10) || 4 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Number of Paths (จำนวนทาง/พาส)
                    </label>
                    <input
                      type="text"
                      value={editingConfig.pathsCount || '4P'}
                      onChange={e => setEditingConfig({ ...editingConfig, pathsCount: e.target.value })}
                      placeholder="e.g. 4P, 3P, 42"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Effective Date & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Effective Date & Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={editingConfig.effectiveFrom?.substring(0, 16) || ''}
                      onChange={e => setEditingConfig({ ...editingConfig, effectiveFrom: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Configuration Status
                    </label>
                    <select
                      value={editingConfig.status || 'DRAFT'}
                      onChange={e => setEditingConfig({ ...editingConfig, status: e.target.value as ConfigurationStatus })}
                      disabled={editingConfig.isActive}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PENDING APPROVAL">PENDING APPROVAL</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="CONFIGURATION ERROR">CONFIGURATION ERROR</option>
                    </select>
                  </div>
                </div>

                {/* Reason for change */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reason for Change / Engineering Notes <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editingConfig.reasonForChange || editingConfig.notes || ''}
                    onChange={e => setEditingConfig({ 
                      ...editingConfig, 
                      reasonForChange: e.target.value,
                      notes: e.target.value 
                    })}
                    placeholder="Describe engineering rationale, die adjustment, material change, or customer model specifications..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4 text-cyan-400" />
                    <span>SAVE DRAFT PARAMETERS</span>
                  </button>

                  {!editingConfig.isActive && (
                    <button
                      type="button"
                      onClick={() => setShowActivationModal(true)}
                      className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>ACTIVATE ON LINE {selectedLineId}</span>
                    </button>
                  )}

                  {editingConfig.isActive && (
                    <button
                      type="button"
                      onClick={() => setShowDeactivateModal(true)}
                      className="w-full sm:w-auto py-2.5 px-4 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold rounded text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>DEACTIVATE</span>
                    </button>
                  )}

                  {!editingConfig.isActive && (
                    <button
                      type="button"
                      onClick={handleDeleteConfig}
                      className="p-2.5 rounded bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs"
                      title="Delete draft configuration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: 10-Component Composite Key & Tooling Assembly Previews */}
        <div className="lg:col-span-5 space-y-6">
          {/* 10-Component Key Standard Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2 uppercase tracking-wider">
                <Hash className="w-4 h-4 text-cyan-400" />
                <span>10-Component Composite Key Resolution</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">Strict Standard</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-cyan-400 font-bold text-[11px] mb-1">Composite Key Structure:</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Line + Config ID + Die Code + Fin Type + Material + Thickness + Tube Size + Part Code + Position + Effective Date
                </div>
              </div>

              {editingConfig && (
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="text-amber-400 font-bold text-[11px]">Active Resolved Baseline Key:</div>
                  <div className="text-[11px] text-emerald-400 break-all bg-slate-900/90 p-2 rounded border border-slate-800">
                    {editingConfig.lineId}|{editingConfig.id}|{editingConfig.dieCode}|{editingConfig.finType}|{editingConfig.material}|{(editingConfig.thicknessMm !== undefined && editingConfig.thicknessMm !== null ? Number(editingConfig.thicknessMm) : 0.10).toFixed(2)}mm|{editingConfig.tubeSize}|ALL|ALL|{editingConfig.effectiveFrom?.substring(0, 10) || '2025-01-31'}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 font-thai leading-normal">
                * กฎเหล็ก: เกณฑ์อายุช็อตต้องผูกกับค่าคอนฟิก 10 ตัวแปรข้างต้นเสมอ ห้ามใช้ชื่อชิ้นส่วนเพียงอย่างเดียว
              </div>
            </div>
          </div>

          {/* Assembly Validation Alert Badges (Req #10, #11) */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              assemblyAnalysis.missingStandardsCount > 0
                ? 'bg-rose-950/40 border-rose-700/80 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300'
            }`}>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">Missing Standard</div>
                <div className="text-base font-bold font-mono mt-0.5">
                  {assemblyAnalysis.missingStandardsCount} {assemblyAnalysis.missingStandardsCount === 1 ? 'part' : 'parts'}
                </div>
              </div>
              {assemblyAnalysis.missingStandardsCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
            </div>

            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              assemblyAnalysis.missingQtyCount > 0
                ? 'bg-amber-950/40 border-amber-700/80 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300'
            }`}>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase">Missing Install Qty</div>
                <div className="text-base font-bold font-mono mt-0.5">
                  {assemblyAnalysis.missingQtyCount} {assemblyAnalysis.missingQtyCount === 1 ? 'part' : 'parts'}
                </div>
              </div>
              {assemblyAnalysis.missingQtyCount > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Preview Tabs (Req #2, #3, #4, #10, #11) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('parts')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewTab === 'parts' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Part List ({assemblyAnalysis.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('quantities')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewTab === 'quantities' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Install Qty ({assemblyAnalysis.totalInstalledParts} EA)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('standards')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    previewTab === 'standards' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Life Standards
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Line {selectedLineId}
              </div>
            </div>

            {/* Tab 1: Preview Part List */}
            {previewTab === 'parts' && (
              <div className="space-y-3">
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {assemblyAnalysis.items.map(item => (
                    <div
                      key={item.partCode}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-300">{item.partCode}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                            {item.category}
                          </span>
                          {item.isMissingStandard && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700 text-[10px]">
                              NO STANDARD
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-200 truncate">{item.partName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Stage: {item.stageName}</span>
                          <span>DWG: {item.drawingNumber}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono flex-shrink-0">
                        <div className="text-emerald-400 font-bold">฿{item.unitCostThb.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Install: {item.installQty} EA</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Preview Install Quantities */}
            {previewTab === 'quantities' && (
              <div className="space-y-3">
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {assemblyAnalysis.items.map(item => (
                    <div
                      key={item.partCode}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-bold text-cyan-300">{item.partCode}</div>
                        <div className="text-slate-300 truncate text-[11px]">{item.partName}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-slate-400">Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={item.installQty}
                          onChange={e => handleUpdateQty(item.partCode, parseInt(e.target.value, 10) || 0)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-emerald-400 text-xs focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">EA</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePartFromAssembly(item.partCode)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="Remove part from configuration assembly"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Installed Components:</span>
                  <span className="font-bold text-emerald-400 text-sm">{assemblyAnalysis.totalInstalledParts} EA</span>
                </div>
              </div>
            )}

            {/* Tab 3: Preview Life Standards */}
            {previewTab === 'standards' && (
              <div className="space-y-3">
                <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                  {assemblyAnalysis.items.map(item => (
                    <div
                      key={item.partCode}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{item.partCode}</span>
                        {item.standard ? (
                          <span className="text-emerald-400 font-bold">
                            {item.standard.lifeLimitShots.toLocaleString()} Shots
                          </span>
                        ) : (
                          <span className="text-rose-400 text-[10px] font-bold">STANDARD NOT FOUND</span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-300 font-sans">{item.partName}</div>

                      {item.standard ? (
                        <div className="text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800/80 flex items-center justify-between">
                          <span>Regrind: {item.standard.regrindStandard.oneTimeRegrindMm} mm/pass</span>
                          <span>Max Cycles: {item.standard.regrindStandard.maxRegrindCount}</span>
                          <span>Total: {item.standard.regrindStandard.totalRegrindMm} mm</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 font-thai">
                          * ไม่พบเกณฑ์อายุสำหรับ {editingConfig?.tubeSize} {editingConfig?.material} กรุณาสร้างมาตรฐานในหน้า Life Standard Setup
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Production Lines Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>All Production Lines Tooling Configurations (E1 - E6)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-thai">
              ตารางแสดงสถานะคอนฟิกกูเรชันทั้งหมดในระบบ พร้อมสลับมุมมอง แก้ไข หรือเปิดใช้งาน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search line, die, material..."
                className="bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs font-mono text-slate-100 w-52 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">LINE / SLOT</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">REVISION</th>
                <th className="py-2.5 px-3">DIE CODE</th>
                <th className="py-2.5 px-3">MACHINE</th>
                <th className="py-2.5 px-3">TUBE</th>
                <th className="py-2.5 px-3">FIN TYPE</th>
                <th className="py-2.5 px-3">MATERIAL</th>
                <th className="py-2.5 px-3">THICKNESS</th>
                <th className="py-2.5 px-3">EFFECTIVE</th>
                <th className="py-2.5 px-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {allConfigs
                .filter(c => {
                  const matchSearch =
                    c.lineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.dieCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (c.configurationSlot && c.configurationSlot.toLowerCase().includes(searchTerm.toLowerCase()));
                  return matchSearch;
                })
                .map(c => {
                  const isCurrent = c.id === selectedConfigId;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        isCurrent ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-cyan-300">Line {c.lineId}</div>
                        <div className="text-[10px] text-slate-400">{c.configurationSlot || c.id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : c.status === 'PENDING APPROVAL'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.isActive ? 'ACTIVE' : c.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{c.revision || 'Rev 1.0'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{c.dieCode}</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">{c.machineId || '-'}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{c.tubeSize}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.finType}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">{c.material}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{c.thicknessMm} mm</td>
                      <td className="py-2.5 px-3 text-slate-400">{c.effectiveFrom?.substring(0, 10)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleSelectConfig(c.id)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 text-[11px] transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Activation Confirmation Summary (Req #5 & Activation Workflow) */}
      {showActivationModal && editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Play className="w-5 h-5 fill-current" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Confirm Production Activation: Line {editingConfig.lineId}
                  </h3>
                  <p className="text-xs text-slate-400 font-thai">
                    สรุปผลกระทบและข้อกำหนดก่อนเปิดใช้งานโครงสร้างแม่พิมพ์ใหม่บนสายการผลิต
                  </p>
                </div>
              </div>
              <button onClick={() => setShowActivationModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Impact Matrix */}
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activation Workflow Guarantees:</span>
                </div>
                <ul className="text-slate-300 space-y-1.5 list-disc list-inside font-sans text-xs">
                  <li>Previous configuration installation period will close at current machine shot count.</li>
                  <li><strong>Part Shot Continuity:</strong> Accumulated shots for parts physically remaining installed will continue uninterrupted.</li>
                  <li><strong>Shot Reset Protection:</strong> Part shots will NOT be reset unless an explicit replacement record is recorded.</li>
                  <li>Removed parts will be paused from accumulation.</li>
                </ul>
              </div>

              {/* Summary of Configuration to Activate */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-500 text-[10px]">NEW CONFIGURATION ID</div>
                  <div className="font-bold text-cyan-300">{editingConfig.id} ({editingConfig.revision || 'Rev 1.0'})</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">DIE CODE & TUBE SIZE</div>
                  <div className="font-bold text-slate-200">{editingConfig.dieCode} • {editingConfig.tubeSize}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">MATERIAL & THICKNESS</div>
                  <div className="font-bold text-amber-300">{editingConfig.material} ({editingConfig.thicknessMm}mm)</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">INSTALLED TOOLING COMPONENTS</div>
                  <div className="font-bold text-emerald-400">{assemblyAnalysis.totalInstalledParts} EA ({assemblyAnalysis.items.length} slots)</div>
                </div>
              </div>

              {/* Reason & Approver Credentials Input */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Reason for Activation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={activationReason}
                    onChange={e => setActivationReason(e.target.value)}
                    placeholder="e.g. Scheduled model changeover for Q3 high-efficiency coil..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Authorized Approver Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={e => setApproverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowActivationModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>CONFIRM & ACTIVATE PRODUCTION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Compare Old and New Configuration (Req #9) */}
      {showComparisonModal && editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                  <ArrowLeftRight className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Side-by-Side Configuration Comparison
                  </h3>
                  <p className="text-xs text-slate-400 font-thai">
                    เปรียบเทียบพารามิเตอร์และรายการชิ้นส่วนระหว่างคอนฟิกปัจจุบันกับคอนฟิกเป้าหมาย
                  </p>
                </div>
              </div>
              <button onClick={() => setShowComparisonModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compare Target Selector */}
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-bold text-slate-300">Compare with:</span>
              <select
                value={compareConfig?.id || ''}
                onChange={e => setCompareTargetId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
              >
                {allConfigs.map(c => (
                  <option key={c.id} value={c.id}>
                    Line {c.lineId} - {c.configurationSlot || c.id} ({c.revision || 'Rev 1.0'} - {c.isActive ? 'ACTIVE' : c.status})
                  </option>
                ))}
              </select>
            </div>

            {compareConfig && (
              <div className="space-y-4">
                {/* Parameter diff table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border border-slate-800 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3 text-left">PARAMETER</th>
                        <th className="py-2.5 px-3 text-left text-cyan-400">
                          TARGET ({editingConfig.id})
                        </th>
                        <th className="py-2.5 px-3 text-left text-amber-400">
                          REFERENCE ({compareConfig.id})
                        </th>
                        <th className="py-2.5 px-3 text-center">MATCH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { label: 'Line ID', val1: editingConfig.lineId, val2: compareConfig.lineId },
                        { label: 'Die Code', val1: editingConfig.dieCode, val2: compareConfig.dieCode },
                        { label: 'Tube Size', val1: editingConfig.tubeSize, val2: compareConfig.tubeSize },
                        { label: 'Fin Type', val1: editingConfig.finType, val2: compareConfig.finType },
                        { label: 'Aluminum Material', val1: editingConfig.material, val2: compareConfig.material },
                        { label: 'Thickness', val1: `${editingConfig.thicknessMm} mm`, val2: `${compareConfig.thicknessMm} mm` },
                        { label: 'Rows × Paths', val1: `${editingConfig.rowsCount || 4} Rows (${editingConfig.pathsCount || '4P'})`, val2: `${compareConfig.rowsCount || 4} Rows (${compareConfig.pathsCount || '4P'})` },
                        { label: 'Machine ID', val1: editingConfig.machineId || '-', val2: compareConfig.machineId || '-' },
                        { label: 'Effective Date', val1: editingConfig.effectiveFrom?.substring(0, 10) || '-', val2: compareConfig.effectiveFrom?.substring(0, 10) || '-' },
                        { label: 'Total Installed Tooling', val1: `${Object.values(editingConfig.installedPartQuantities || {}).reduce<number>((a, b) => Number(a) + Number(b), 0)} EA`, val2: `${Object.values(compareConfig.installedPartQuantities || {}).reduce<number>((a, b) => Number(a) + Number(b), 0)} EA` }
                      ].map(row => {
                        const isMatch = row.val1 === row.val2;
                        return (
                          <tr key={row.label} className={isMatch ? 'bg-slate-900/50' : 'bg-amber-950/20'}>
                            <td className="py-2 px-3 font-bold text-slate-300">{row.label}</td>
                            <td className={`py-2 px-3 font-bold ${isMatch ? 'text-slate-200' : 'text-cyan-300'}`}>
                              {row.val1}
                            </td>
                            <td className={`py-2 px-3 ${isMatch ? 'text-slate-400' : 'text-amber-300 font-bold'}`}>
                              {row.val2}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isMatch ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">MATCH</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px]">CHANGED</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Deactivation Modal */}
      {showDeactivateModal && editingConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Square className="w-4 h-4 text-rose-400 fill-current" />
                <span>Deactivate Line {editingConfig.lineId} Config</span>
              </h3>
              <button onClick={() => setShowDeactivateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-thai leading-relaxed">
              การปิดใช้งานจะเปลี่ยนสถานะคอนฟิกกูเรชัน {editingConfig.id} เป็น INACTIVE และบันทึกวันที่สิ้นสุดผลการใช้งาน
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Reason for Deactivation
              </label>
              <input
                type="text"
                value={deactivateReason}
                onChange={e => setDeactivateReason(e.target.value)}
                placeholder="e.g. End of model production run..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivation}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
