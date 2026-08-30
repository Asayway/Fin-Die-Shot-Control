import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings2, 
  Sliders, 
  Wrench, 
  History, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Package, 
  ShoppingCart, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Layers, 
  Eye, 
  Activity,
  Check,
  RefreshCw,
  Info,
  Power
} from 'lucide-react';
import { 
  ProductionLineId, 
  LineActiveConfiguration, 
  PartMaster, 
  PartLifeStandard, 
  RegrindMasterStandard, 
  SpareStockItem, 
  ReplacementRecord, 
  RegrindingRecord,
  TubeSize,
  FinType,
  LINE_INFO_MAP,
  MachineStatus,
  LineLiveMonitoringData
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb } from '../services/calculationService';
import { LineFilterSelector } from '../components/common/LineFilterSelector';

export const UnifiedLineSettingView: React.FC = () => {
  // Production Line Selection
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId | 'ALL'>('E1');

  // Master Data State
  const [lineConfigs, setLineConfigs] = useState<LineActiveConfiguration[]>([]);
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [lifeStandards, setLifeStandards] = useState<PartLifeStandard[]>([]);
  const [regrindStandards, setRegrindStandards] = useState<RegrindMasterStandard[]>([]);
  const [spareStocks, setSpareStocks] = useState<SpareStockItem[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [regrindRecords, setRegrindRecords] = useState<RegrindingRecord[]>([]);
  const [linesMonitoring, setLinesMonitoring] = useState<Record<ProductionLineId, LineLiveMonitoringData>>({} as any);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Part Log Modal State
  const [selectedLogPartCode, setSelectedLogPartCode] = useState<string | null>(null);

  // Add Part Modal
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [newPartForm, setNewPartForm] = useState({
    partCode: '',
    partName: '',
    partNameTh: '',
    stageName: 'Piercing Stage',
    category: 'PUNCH',
    installQty: 1,
    pcmLife: 18000000,
    goldLife: 40000000,
    bareLife: 40000000,
    unitCostThb: 15000,
    maxRegrindMm: 3.0,
    regrindStepMm: 0.5,
    maxRegrindCycles: 4
  });

  // Feedback Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAllData = () => {
    setLineConfigs(storageService.getLineConfigs());
    setPartMasters(storageService.getPartMasters());
    setLifeStandards(storageService.getLifeStandards());
    setRegrindStandards(storageService.getRegrindMasterStandards());
    setSpareStocks(storageService.getSpareStocks());
    setReplacements(storageService.getReplacements());
    setRegrindRecords(storageService.getRegrindRecords());
    setLinesMonitoring(storageService.getLinesMonitoring());
  };

  useEffect(() => {
    loadAllData();
    const unsub = storageService.subscribe(loadAllData);
    return () => unsub();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateLineMachineStatus = (lineId: ProductionLineId, status: MachineStatus, isActive: boolean = true) => {
    storageService.updateLineMachineStatus(lineId, status, true);
    setLinesMonitoring(storageService.getLinesMonitoring());
    const statusLabel = status === 'RUNNING' ? '🟢 RUNNING (เปิดผลิตปกติ)' :
                        status === 'IDLE' ? '🟡 IDLE (พักสายการผลิต)' :
                        status === 'MAINTENANCE' ? '🔧 MAINTENANCE (ซ่อมบำรุง)' : '🔴 STOPPED (ปิดไลน์ผลิต)';
    showNotification('success', `อัปเดตสถานะการผลิต LINE ${lineId} เป็น ${statusLabel} เรียบร้อยแล้ว`);
  };

  // Get current active line config
  const currentLineConfig = useMemo(() => {
    if (selectedLineId === 'ALL') return null;
    return lineConfigs.find(c => c.lineId === selectedLineId) || null;
  }, [lineConfigs, selectedLineId]);

  // Handle Line Spec Updates (Tube Size, Fin Type, Die Pitch, Material, Die Code/Name)
  const handleUpdateLineSpec = (field: keyof LineActiveConfiguration, value: any) => {
    if (!currentLineConfig) return;
    const updated: LineActiveConfiguration = {
      ...currentLineConfig,
      [field]: value
    };
    storageService.saveLineConfig(updated);
    showNotification('success', `อัปเดตสเปกสายการผลิต ${selectedLineId} (${field} = ${value}) เรียบร้อยแล้ว`);
  };

  // Calculate Total Installed Quantity across ALL Lines for a given part code
  const calculateTotalInstalledAllLines = (partCode: string): number => {
    let total = 0;
    lineConfigs.forEach(cfg => {
      if (cfg.installedPartQuantities && cfg.installedPartQuantities[partCode] !== undefined) {
        total += cfg.installedPartQuantities[partCode];
      }
    });
    return total;
  };

  // Move Part Position / Swap Order (Up/Down)
  const handleMovePartOrder = (index: number, direction: 'UP' | 'DOWN') => {
    if (index < 0) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= partMasters.length) return;

    const newParts = [...partMasters];
    const temp = newParts[index];
    newParts[index] = newParts[targetIdx];
    newParts[targetIdx] = temp;

    storageService.savePartMasters(newParts);
    showNotification('success', `สลับตำแหน่งชิ้นส่วน ${temp.partCode} เรียบร้อยแล้ว`);
  };

  // Inline Part Master Updating (Part Code, Part Name, Stage Name, Unit Price)
  const handleInlinePartUpdate = (partCode: string, updates: Partial<PartMaster>) => {
    const original = partMasters.find(p => p.partCode === partCode);
    if (!original) return;
    const updated: PartMaster = {
      ...original,
      ...updates
    };
    storageService.savePartMaster(updated);
  };

  // Inline Install Quantity Updating for the selected line
  const handleInlineInstallQtyUpdate = (partCode: string, qty: number) => {
    if (selectedLineId === 'ALL') return;
    const safeQty = Math.max(0, qty);
    storageService.updateInstallQuantities([
      { lineId: selectedLineId, partCode, installQty: safeQty }
    ]);
  };

  // Inline Life Standard Updating for Material (PCM, GOLD, BARE)
  const handleInlineLifeStandardUpdate = (partCode: string, material: 'PCM' | 'GOLD' | 'BARE', newShots: number) => {
    const safeShots = Math.max(100000, newShots);
    const existing = lifeStandards.find(s => s.configKey.partCode === partCode && s.configKey.material === material);
    
    if (existing) {
      storageService.saveLifeStandard({
        ...existing,
        lifeLimitShots: safeShots
      });
    } else {
      const part = partMasters.find(p => p.partCode === partCode);
      const stageName = part ? part.stageName : 'Main Tooling';
      const partName = part ? part.partName : partCode;
      
      const compositeKeyString = `${selectedLineId === 'ALL' ? 'E6' : selectedLineId}|CFG-AUTO|${partCode}|${material}|Ø7|${partCode}|ALL|${new Date().toISOString().substring(0, 10)}`;
      storageService.saveLifeStandard({
        id: `STD-GEN-${partCode}-${material}`,
        compositeKeyString,
        configKey: {
          lineId: selectedLineId === 'ALL' ? 'ALL' : selectedLineId,
          configurationId: 'CFG-AUTO',
          dieCode: 'FD-DIE-01',
          finType: 'Slit Old',
          thicknessMm: 0.10,
          tubeSize: 'Ø7',
          material,
          partCode,
          position: 'ALL',
          effectiveDate: new Date().toISOString().substring(0, 10)
        },
        partName,
        stagePunchDie: stageName,
        lifeLimitShots: safeShots,
        regrindStandard: {
          oneTimeRegrindMm: '0.50',
          totalRegrindMm: 3.0,
          maxRegrindCount: 4
        },
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Inline Regrind Standard Update
  const handleInlineRegrindUpdate = (partCode: string, updates: { totalGrindingAllowanceMm?: number; grindingAmountPerTimeMm?: number; maxRegrindCount?: number }) => {
    const existing = regrindStandards.find(r => r.partCode === partCode);
    const part = partMasters.find(p => p.partCode === partCode);
    const updated: RegrindMasterStandard = {
      id: existing ? existing.id : `RSTD-${partCode}`,
      partCode,
      partName: part ? part.partName : partCode,
      regrindAllowed: true,
      maxRegrindCount: updates.maxRegrindCount !== undefined ? updates.maxRegrindCount : (existing ? existing.maxRegrindCount : 4),
      grindingAmountPerTimeMm: updates.grindingAmountPerTimeMm !== undefined ? updates.grindingAmountPerTimeMm : (existing ? existing.grindingAmountPerTimeMm : 0.5),
      totalGrindingAllowanceMm: updates.totalGrindingAllowanceMm !== undefined ? updates.totalGrindingAllowanceMm : (existing ? existing.totalGrindingAllowanceMm : 3.0),
      nominalLengthMm: 50.0,
      minAllowedLengthMm: 47.0,
      disposeAfterOneUse: false,
      inspectionRequirements: 'Visual & Dimension Check'
    };
    storageService.saveRegrindMasterStandard(updated);
  };

  // Inline Spare Stock Status Update
  const handleInlineStockUpdate = (partCode: string, updates: Partial<SpareStockItem>) => {
    const existing = spareStocks.find(s => s.partCode === partCode);
    const part = partMasters.find(p => p.partCode === partCode);
    const updatedList = spareStocks.map(s => {
      if (s.partCode === partCode) {
        return { ...s, ...updates };
      }
      return s;
    });

    if (!existing) {
      updatedList.push({
        id: `STK-${partCode}`,
        partCode,
        partName: part ? part.partName : partCode,
        specification: 'Standard Fin Tooling Part',
        warehouseLocation: 'RACK-MAIN',
        onHandQuantity: 3,
        reservedQuantity: 0,
        quarantineQuantity: 0,
        availableQuantity: 3,
        minimumStock: 2,
        maximumStock: 5,
        requiredQuantityPerFullReplacement: 1,
        replacementCoverage: 3,
        stockStatus: 'AVAILABLE',
        purchaseRequirementStatus: 'NORMAL',
        supplier: 'DAIKIN TOOLING VENDOR',
        orderedQuantity: 0,
        confirmedQuantity: 0,
        procurementStatus: updates.procurementStatus || 'IN STOCK',
        buyer: 'PROCUREMENT TEAM',
        currentStockQty: updates.currentStockQty !== undefined ? updates.currentStockQty : 3,
        safetyStockQty: 2,
        safetyStockMin: 2,
        orderStatus: 'NOT REQUIRED'
      });
    }

    localStorage.setItem('fin_press_spare_stocks', JSON.stringify(updatedList));
    storageService.addAuditLog('SYSTEM', `Updated Spare Stock & PO Status for Part ${partCode}`);
  };

  // Add New Part Submit
  const handleCreateNewPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartForm.partCode.trim() || !newPartForm.partName.trim()) {
      showNotification('error', 'กรุณาระบุรหัสชิ้นส่วน (Part Code) และชื่อชิ้นส่วน (Part Name)');
      return;
    }

    const code = newPartForm.partCode.trim().toUpperCase();
    const newPart: PartMaster = {
      partCode: code,
      partName: newPartForm.partName.trim(),
      partNameTh: newPartForm.partNameTh.trim(),
      stageName: newPartForm.stageName,
      category: newPartForm.category as any,
      unitCostThb: newPartForm.unitCostThb,
      unit: 'EA',
      drawingNumber: `DWG-${code}`,
      tubeSizeCompat: 'BOTH'
    };

    storageService.savePartMaster(newPart);

    // Save install qty if line selected
    if (selectedLineId !== 'ALL') {
      storageService.updateInstallQuantities([
        { lineId: selectedLineId, partCode: code, installQty: newPartForm.installQty }
      ]);
    }

    // Save Life standards for PCM, GOLD, BARE
    handleInlineLifeStandardUpdate(code, 'PCM', newPartForm.pcmLife);
    handleInlineLifeStandardUpdate(code, 'GOLD', newPartForm.goldLife);
    handleInlineLifeStandardUpdate(code, 'BARE', newPartForm.bareLife);

    // Save Regrind Standard
    handleInlineRegrindUpdate(code, {
      totalGrindingAllowanceMm: newPartForm.maxRegrindMm,
      grindingAmountPerTimeMm: newPartForm.regrindStepMm,
      maxRegrindCount: newPartForm.maxRegrindCycles
    });

    setShowAddPartModal(false);
    showNotification('success', `เพิ่มชิ้นส่วนใหม่ ${code} (${newPartForm.partName}) เรียบร้อยแล้ว`);
  };

  // Filter Parts List based on Search & Selected Line
  const displayParts = useMemo(() => {
    return partMasters.filter(part => {
      // Line filter: if a line is selected, check if install quantity > 0 OR if registered
      if (selectedLineId !== 'ALL' && currentLineConfig) {
        const installMap = currentLineConfig.installedPartQuantities || {};
        const isInstalled = (installMap[part.partCode] || 0) > 0;
        // Keep part visible if installed on line OR if explicitly searched
        if (!isInstalled && !searchQuery) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mCode = part.partCode.toLowerCase().includes(q);
        const mName = part.partName.toLowerCase().includes(q);
        const mTh = (part.partNameTh || '').toLowerCase().includes(q);
        const mStage = (part.stageName || '').toLowerCase().includes(q);
        if (!mCode && !mName && !mTh && !mStage) return false;
      }

      return true;
    });
  }, [partMasters, selectedLineId, currentLineConfig, searchQuery]);

  // Log History Data for Modal Popup
  const logModalPartData = useMemo(() => {
    if (!selectedLogPartCode) return null;
    const part = partMasters.find(p => p.partCode === selectedLogPartCode);
    const partReplacements = replacements.filter(r => r.partCode === selectedLogPartCode);
    const partRegrinds = regrindRecords.filter(r => r.partCode === selectedLogPartCode);
    const stock = spareStocks.find(s => s.partCode === selectedLogPartCode);

    return {
      partCode: selectedLogPartCode,
      partName: part ? part.partName : selectedLogPartCode,
      stageName: part ? part.stageName : 'Main Tooling',
      partNameTh: part ? part.partNameTh : '',
      replacements: partReplacements,
      regrinds: partRegrinds,
      stock
    };
  }, [selectedLogPartCode, partMasters, replacements, regrindRecords, spareStocks]);

  const lineList: Array<ProductionLineId> = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  return (
    <div className="space-y-3 font-sans text-slate-100 pb-8">
      
      {/* PAGE HEADER & INTEGRATED COMPACT LINE SELECTOR (Sticky Locked at Top) */}
      <div className="sticky top-0 z-30 bg-[#0B1528]/95 backdrop-blur-md border border-cyan-800/80 rounded-xl p-3 sm:p-3.5 shadow-2xl space-y-2.5">
        {/* ROW 1: TOP LINE SELECTOR & ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-2.5">
          <div className="overflow-x-auto custom-scrollbar">
            <LineFilterSelector
              selectedLine={selectedLineId}
              onSelectLine={(l) => setSelectedLineId(l)}
              allowAll={true}
              allLabel="ALL LINES (E1-E6)"
              label="LINE:"
            />
          </div>

          <button
            onClick={() => setShowAddPartModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 transition-all font-mono whitespace-nowrap ml-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>เพิ่มชิ้นส่วนใหม่ (ADD NEW PART)</span>
          </button>
        </div>

        {/* ROW 2: TITLE & DESCRIPTION SUB-ROW */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono">
              UNIFIED LINE & DIE SETTING
            </span>
            <span className="text-slate-400 text-xs font-mono">| ตั้งค่าสเปกไลน์ผลิตและสถานะเปิด/ปิดการทำงาน</span>
          </div>
          <span className="text-xs text-slate-400 font-thai">
            {selectedLineId === 'ALL' ? 'แสดงข้อมูลรวมทุกไลน์การผลิต (E1-E6)' : `กำลังตั้งค่า: LINE ${selectedLineId}`}
          </span>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-xl animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span className="font-bold font-thai">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: LINE & DIE SPECIFICATIONS & OPERATIONAL STATUS (If specific line selected) */}
      {selectedLineId !== 'ALL' && currentLineConfig && (
        <div className="bg-[#0E1B33] border border-cyan-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center font-black text-cyan-300 font-mono text-lg shadow">
                {selectedLineId}
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-mono flex items-center gap-2 flex-wrap">
                  <span>สเปกและสถานะสายการผลิต (LINE SPEC & STATUS) - {LINE_INFO_MAP[selectedLineId]?.nameTh || selectedLineId}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${
                    (linesMonitoring[selectedLineId]?.machineStatus || 'RUNNING') === 'RUNNING'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                      : (linesMonitoring[selectedLineId]?.machineStatus) === 'IDLE'
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : (linesMonitoring[selectedLineId]?.machineStatus) === 'MAINTENANCE'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                      : 'bg-rose-950 text-rose-300 border-rose-600'
                  }`}>
                    {linesMonitoring[selectedLineId]?.machineStatus || 'RUNNING'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-thai mt-0.5">
                  ปรับสเปกขนาดท่อ, ลายฟิน, Pitch, ชนิดวัสดุ และกำหนดสถานะเปิด/ปิดการทำงานของไลน์ผลิต
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-mono">
            {/* Tube Size */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 font-bold block">1. TUBE SIZE (ขนาดท่อ)</label>
              <select
                value={currentLineConfig.tubeSize || 'Ø7'}
                onChange={e => handleUpdateLineSpec('tubeSize', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
              >
                <option value="Ø5">Ø5 (ท่อ 5 มม.)</option>
                <option value="Ø7">Ø7 (ท่อ 7 มม.)</option>
                <option value="Ø9.52">Ø9.52 (ท่อ 9.52 มม.)</option>
              </select>
            </div>

            {/* Fin Type */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 font-bold block">2. FIN TYPE (ลายฟิน)</label>
              <select
                value={currentLineConfig.finType || 'Slit Old'}
                onChange={e => handleUpdateLineSpec('finType', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
              >
                <option value="Slit Old">Slit Old</option>
                <option value="NEW Slit">NEW Slit</option>
                <option value="Full Slit">Full Slit</option>
                <option value="Corrugate">Corrugate</option>
                <option value="NEW Corrugate">NEW Corrugate</option>
                <option value="Louver">Louver</option>
                <option value="Wide Louver">Wide Louver</option>
              </select>
            </div>

            {/* Die Spec / Pitch */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 font-bold block">3. DIE SPEC / PITCH</label>
              <select
                value={currentLineConfig.pathsCount || '3P'}
                onChange={e => handleUpdateLineSpec('pathsCount', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
              >
                <option value="3P">3P (3 Paths)</option>
                <option value="4P">4P (4 Paths)</option>
                <option value="2P">2P (2 Paths)</option>
                <option value="6P">6P (6 Paths)</option>
              </select>
            </div>

            {/* Material Type */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 font-bold block">4. FIN MATERIAL (ชนิดวัสดุ)</label>
              <select
                value={currentLineConfig.material || 'PCM'}
                onChange={e => handleUpdateLineSpec('material', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-400 font-bold focus:border-cyan-400 focus:outline-none"
              >
                <option value="PCM">PCM (0.1mm) [Louver 18M / Cut 50M]</option>
                <option value="GOLD">GOLD (0.1mm) [Standard 40M]</option>
                <option value="BARE">BARE (0.1mm) [Standard 40M]</option>
              </select>
            </div>

            {/* Die Code & Name */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 font-bold block">5. DIE CODE & DIE NAME</label>
              <input
                type="text"
                value={currentLineConfig.dieCode || ''}
                onChange={e => handleUpdateLineSpec('dieCode', e.target.value)}
                placeholder="Die Code"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono font-bold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Default SPM */}
            <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative group">
              <label className="text-cyan-400 font-bold block flex items-center gap-1.5">
                6. DEFAULT SPM
              </label>
              <input
                type="number"
                min="0"
                value={currentLineConfig.defaultSpm || ''}
                onChange={e => handleUpdateLineSpec('defaultSpm', parseInt(e.target.value) || 0)}
                placeholder="e.g. 100"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <div className="absolute top-full left-0 mt-1 w-[280px] z-10 hidden group-hover:block bg-slate-900 text-slate-400 text-[10px] p-2 border border-slate-700 rounded shadow-lg font-thai whitespace-normal">
                ค่าความเร็วมาตรฐานของแม่พิมพ์ไลน์นี้ ใช้สำหรับโหมดจำลอง SPM และคำนวณ Loss Time อัตโนมัติ
              </div>
            </div>
          </div>

          {/* Line Operational Status & Shutdown Control */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-white font-bold flex items-center gap-2 font-mono text-sm">
                  <Power className="w-4 h-4 text-cyan-400" />
                  <span>กำหนดสถานะการเปิด/ปิดไลน์ผลิต (LINE OPERATIONAL & PRODUCTION STATUS)</span>
                </label>
                <p className="text-xs text-slate-400 font-thai mt-0.5">
                  เลือกสถานะไลน์ผลิต หากไลน์ไม่มีแผนผลิต ให้ตั้งค่าเป็น IDLE หรือ STOPPED (ปิดไลน์) ระบบจะแสดงสัญลักษณ์และแจ้งเตือนพนักงาน
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border flex items-center gap-1.5 ${
                (linesMonitoring[selectedLineId]?.machineStatus || 'RUNNING') === 'RUNNING'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                  : (linesMonitoring[selectedLineId]?.machineStatus) === 'IDLE'
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : (linesMonitoring[selectedLineId]?.machineStatus) === 'MAINTENANCE'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                  : 'bg-rose-950 text-rose-300 border-rose-600'
              }`}>
                STATUS: {(linesMonitoring[selectedLineId]?.machineStatus || 'RUNNING') === 'RUNNING' && '🟢 RUNNING'}
                {(linesMonitoring[selectedLineId]?.machineStatus) === 'IDLE' && '🟡 IDLE'}
                {(linesMonitoring[selectedLineId]?.machineStatus) === 'MAINTENANCE' && '🔧 MAINTENANCE'}
                {(linesMonitoring[selectedLineId]?.machineStatus) === 'STOPPED' && '🔴 STOPPED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <button
                type="button"
                onClick={() => handleUpdateLineMachineStatus(selectedLineId, 'RUNNING', true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  (linesMonitoring[selectedLineId]?.machineStatus || 'RUNNING') === 'RUNNING'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>🟢 RUNNING (เปิดผลิตปกติ)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateLineMachineStatus(selectedLineId, 'IDLE', true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  (linesMonitoring[selectedLineId]?.machineStatus) === 'IDLE'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>🟡 IDLE (พักสาย/ไม่มีแผน)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateLineMachineStatus(selectedLineId, 'MAINTENANCE', true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  (linesMonitoring[selectedLineId]?.machineStatus) === 'MAINTENANCE'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>🔧 MAINTENANCE (ซ่อมบำรุง)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateLineMachineStatus(selectedLineId, 'STOPPED', true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  (linesMonitoring[selectedLineId]?.machineStatus) === 'STOPPED'
                    ? 'bg-rose-600 text-white border-rose-300 font-black shadow-lg shadow-rose-600/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>🔴 STOPPED (ปิดไลน์ผลิต)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PARTS MASTER, INSTALLATION, LIFE LIMITS & REPAIR TABLE */}
      <div className="bg-[#0E172A] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        
        {/* Table Filter & Search Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-400" />
              <span>ตารางรายการ Part & สเปกมาตรฐาน (ทุกช่องสามารถแก้ไขและซิงค์เชื่อมโยงได้)</span>
            </h2>
            <p className="text-xs text-slate-400 font-thai mt-0.5">
              {selectedLineId === 'ALL'
                ? 'แสดงรายการอะไหล่แม่พิมพ์ทั้งหมดในระบบ สามารถสลับตำแหน่ง แก้ไขชื่อ และดูประวัติการซ่อม'
                : `แสดงรายการอะไหล่ประจำสายการผลิต LINE ${selectedLineId} - สามารถสลับตำแหน่ง ปรับจำนวนติดตั้ง และแก้ไขเกณฑ์อายุ`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส Part Code, ชื่อ หรือ Stage..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm sm:text-base font-mono border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#080F1E] text-slate-300 uppercase text-xs sm:text-sm font-black border-b border-slate-800">
                <th className="py-3.5 px-2 text-center w-12">POS</th>
                <th className="py-3.5 px-3 w-44">PART CODE & NAME (แก้ไขได้)</th>
                <th className="py-3.5 px-3 w-36">STAGE / FUNCTION</th>
                <th className="py-3.5 px-3 text-center w-36">
                  {selectedLineId === 'ALL' ? 'จำนวนติดตั้งรวม' : `ติดตั้งใน LINE ${selectedLineId}`}
                </th>
                <th className="py-3.5 px-3 text-right w-40">PCM LIFE (SHOTS)</th>
                <th className="py-3.5 px-3 text-right w-40">GOLD LIFE (SHOTS)</th>
                <th className="py-3.5 px-3 text-right w-40">BARE LIFE (SHOTS)</th>
                <th className="py-3.5 px-3 text-center w-36">การซ่อม (MAX REGRIND)</th>
                <th className="py-3.5 px-3 text-right w-28">ราคา UNIT PRICE</th>
                <th className="py-3.5 px-3 text-center w-32">สต็อก & PO STATUS</th>
                <th className="py-3.5 px-2 text-center w-24">ดู LOG / ประวัติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
              {displayParts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-mono">
                    ไม่พบรายการอะไหล่ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                displayParts.map((part, idx) => {
                  const pcmStd = lifeStandards.find(s => s.configKey.partCode === part.partCode && s.configKey.material === 'PCM');
                  const goldStd = lifeStandards.find(s => s.configKey.partCode === part.partCode && s.configKey.material === 'GOLD');
                  const bareStd = lifeStandards.find(s => s.configKey.partCode === part.partCode && s.configKey.material === 'BARE');
                  
                  const regrindStd = regrindStandards.find(r => r.partCode === part.partCode);
                  const stock = spareStocks.find(s => s.partCode === part.partCode);

                  const installQtyLine = currentLineConfig && currentLineConfig.installedPartQuantities 
                    ? (currentLineConfig.installedPartQuantities[part.partCode] || 0) 
                    : 1;

                  const totalInstalledAll = calculateTotalInstalledAllLines(part.partCode);

                  return (
                    <tr key={part.partCode} className="hover:bg-slate-900/80 transition-colors">
                      {/* Position / Swap Buttons */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMovePartOrder(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 disabled:opacity-30"
                            title="สลับขึ้น (Move Up)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-cyan-400 font-mono text-[11px] min-w-[18px]">
                            {idx + 1}
                          </span>
                          <button
                            onClick={() => handleMovePartOrder(idx, 'DOWN')}
                            disabled={idx === displayParts.length - 1}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 disabled:opacity-30"
                            title="สลับลง (Move Down)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Part Code & Part Name (Editable) */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <span className="font-extrabold text-cyan-300 font-mono text-xs block">{part.partCode}</span>
                          <input
                            type="text"
                            value={part.partName}
                            onChange={e => handleInlinePartUpdate(part.partCode, { partName: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 font-bold text-xs focus:border-cyan-400 focus:outline-none"
                            placeholder="Part Name"
                          />
                        </div>
                      </td>

                      {/* Stage Name */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={part.stageName || ''}
                          onChange={e => handleInlinePartUpdate(part.partCode, { stageName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-300 text-xs focus:border-cyan-400 focus:outline-none"
                          placeholder="Stage Name"
                        />
                      </td>

                      {/* Install Quantity */}
                      <td className="py-2.5 px-3 text-center">
                        {selectedLineId === 'ALL' ? (
                          <div className="space-y-1">
                            <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold font-mono">
                              {totalInstalledAll} EA (รวมทุกไลน์)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={installQtyLine}
                              onChange={e => handleInlineInstallQtyUpdate(part.partCode, parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-900 border border-cyan-600 rounded px-2 py-1 text-center font-bold text-white text-xs focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400">EA (รวม {totalInstalledAll})</span>
                          </div>
                        )}
                      </td>

                      {/* PCM Life (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="1000000"
                          value={pcmStd ? pcmStd.lifeLimitShots : 18000000}
                          onChange={e => handleInlineLifeStandardUpdate(part.partCode, 'PCM', parseInt(e.target.value) || 0)}
                          className="w-28 bg-slate-900 border border-amber-900/80 text-amber-300 font-bold text-right rounded px-2 py-1 text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </td>

                      {/* GOLD Life (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="1000000"
                          value={goldStd ? goldStd.lifeLimitShots : 40000000}
                          onChange={e => handleInlineLifeStandardUpdate(part.partCode, 'GOLD', parseInt(e.target.value) || 0)}
                          className="w-28 bg-slate-900 border border-yellow-900/80 text-yellow-300 font-bold text-right rounded px-2 py-1 text-xs focus:border-yellow-400 focus:outline-none"
                        />
                      </td>

                      {/* BARE Life (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="1000000"
                          value={bareStd ? bareStd.lifeLimitShots : 40000000}
                          onChange={e => handleInlineLifeStandardUpdate(part.partCode, 'BARE', parseInt(e.target.value) || 0)}
                          className="w-28 bg-slate-900 border border-cyan-900/80 text-cyan-300 font-bold text-right rounded px-2 py-1 text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </td>

                      {/* Regrind Standard */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={regrindStd ? regrindStd.totalGrindingAllowanceMm : 3.0}
                            onChange={e => handleInlineRegrindUpdate(part.partCode, { totalGrindingAllowanceMm: parseFloat(e.target.value) || 0 })}
                            className="w-14 bg-slate-900 border border-slate-700 text-slate-200 text-center rounded px-1.5 py-1 text-xs focus:border-cyan-400 focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400">mm ({regrindStd ? regrindStd.maxRegrindCount : 4}x)</span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="500"
                          value={part.unitCostThb || 0}
                          onChange={e => handleInlinePartUpdate(part.partCode, { unitCostThb: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-slate-900 border border-emerald-900/80 text-emerald-400 font-bold text-right rounded px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                      </td>

                      {/* Stock & PO Status */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="space-y-1">
                          <select
                            value={stock ? stock.procurementStatus : 'IN STOCK'}
                            onChange={e => handleInlineStockUpdate(part.partCode, { procurementStatus: e.target.value as any })}
                            className="w-28 bg-slate-900 border border-slate-700 text-[10px] font-bold rounded px-1.5 py-1 text-slate-200 focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="IN STOCK">IN STOCK (ปกติ)</option>
                            <option value="LOW STOCK">LOW STOCK (เหลือน้อย)</option>
                            <option value="REORDER REQUIRED">REORDER REQ. (ต้องสั่งซื้อ)</option>
                            <option value="PO PENDING">PO PENDING (รอส่งมอบ)</option>
                          </select>
                        </div>
                      </td>

                      {/* Log / History Button */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLogPartCode(part.partCode)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 hover:border-cyan-400 font-bold text-[11px] transition-all flex items-center gap-1 mx-auto shadow"
                          title="กดเพื่อดูประวัติการเปลี่ยนและเจียระไนเฉพาะ Part นี้"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>ดู LOG</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PART SPECIFIC AUDIT & LOG HISTORY DRAWER */}
      {selectedLogPartCode && logModalPartData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1528] border border-cyan-700 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-cyan-900/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300 font-black">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>ประวัติเปลี่ยนและซ่อมเฉพาะ Part: {logModalPartData.partCode}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">{logModalPartData.partName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-thai">
                    ประวัติการเปลี่ยนอะไหล่ (Replacements) และประวัติการเจียระไนลับคม (Re-grinding) ของรหัสชิ้นส่วนนี้
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLogPartCode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-bold">TOTAL REPLACEMENTS</span>
                <span className="text-xl font-bold text-cyan-300">{logModalPartData.replacements.length} รายการ</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-bold">TOTAL RE-GRINDINGS</span>
                <span className="text-xl font-bold text-amber-300">{logModalPartData.regrinds.length} รายการ</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-bold">CURRENT WAREHOUSE STOCK</span>
                <span className="text-xl font-bold text-emerald-400">
                  {logModalPartData.stock ? logModalPartData.stock.currentStockQty : 0} EA
                </span>
              </div>
            </div>

            {/* Replacement History Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>ประวัติการเปลี่ยนชิ้นส่วน (REPLACEMENT LOGS)</span>
              </h4>

              {logModalPartData.replacements.length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono">
                  ยังไม่มีประวัติการเปลี่ยนชิ้นส่วนสำหรับรหัสอะไหล่นี้
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">REF ID</th>
                        <th className="p-2">LINE</th>
                        <th className="p-2">DATE / TIME</th>
                        <th className="p-2">TYPE</th>
                        <th className="p-2 text-right">SHOT AT CHANGE</th>
                        <th className="p-2">OPERATOR</th>
                        <th className="p-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                      {logModalPartData.replacements.map(rep => (
                        <tr key={rep.id} className="hover:bg-slate-800/50">
                          <td className="p-2 font-bold text-cyan-300">{rep.id}</td>
                          <td className="p-2">LINE {rep.lineId}</td>
                          <td className="p-2 text-slate-300">{rep.replacementDateTime || rep.timestamp}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px]">
                              {rep.replacementType}
                            </span>
                          </td>
                          <td className="p-2 text-right font-bold text-amber-300">
                            {formatShots(rep.removedPartUsedShot || 0)}
                          </td>
                          <td className="p-2 text-slate-300">{rep.technicianName || rep.verifiedBy || 'Technician'}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">
                              {rep.approvalStatus || 'APPROVED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Re-grinding History Section */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>ประวัติการเจียระไนส่งซ่อม (RE-GRINDING LOGS)</span>
              </h4>

              {logModalPartData.regrinds.length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono">
                  ยังไม่มีประวัติการส่งเจียระไนลับคมสำหรับรหัสอะไหล่นี้
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">REF ID</th>
                        <th className="p-2">GRIND DATE</th>
                        <th className="p-2 text-right">MM GROUND</th>
                        <th className="p-2 text-right">SHIM THICKNESS</th>
                        <th className="p-2">GRINDER / OPERATOR</th>
                        <th className="p-2">RESULT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                      {logModalPartData.regrinds.map(reg => (
                        <tr key={reg.id} className="hover:bg-slate-800/50">
                          <td className="p-2 font-bold text-amber-300">{reg.id}</td>
                          <td className="p-2 text-slate-300">{reg.grindingDate || reg.timestamp}</td>
                          <td className="p-2 text-right font-bold text-cyan-300">{reg.actualGrindingRemovedMm || 0.5} mm</td>
                          <td className="p-2 text-right text-emerald-400">{reg.shimAddedMm || 0.5} mm</td>
                          <td className="p-2 text-slate-300">{reg.grinderOperatorName || 'Toolroom Team'}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px]">
                              {reg.grindingResult || 'PASSED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLogPartCode(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono"
              >
                ปิดหน้าต่าง (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW PART FORM */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B1528] border border-cyan-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>เพิ่มชิ้นส่วนอะไหล่ใหม่ (Add New Tooling Part)</span>
              </h3>
              <button onClick={() => setShowAddPartModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPartSubmit} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-bold mb-1">PART CODE *</label>
                  <input
                    type="text"
                    value={newPartForm.partCode}
                    onChange={e => setNewPartForm({ ...newPartForm, partCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. P-SLIT-03"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block font-bold mb-1">CATEGORY</label>
                  <select
                    value={newPartForm.category}
                    onChange={e => setNewPartForm({ ...newPartForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="PUNCH">PUNCH</option>
                    <option value="DIE">DIE</option>
                    <option value="BLADE">BLADE</option>
                    <option value="PIN">PIN</option>
                    <option value="CORNER_CUT">CORNER_CUT</option>
                    <option value="CENTER_PUNCH">CENTER_PUNCH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block font-bold mb-1">PART NAME (ENGLISH) *</label>
                <input
                  type="text"
                  value={newPartForm.partName}
                  onChange={e => setNewPartForm({ ...newPartForm, partName: e.target.value })}
                  placeholder="e.g. Slit Blade 0.1mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-bold mb-1">STAGE NAME</label>
                  <input
                    type="text"
                    value={newPartForm.stageName}
                    onChange={e => setNewPartForm({ ...newPartForm, stageName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block font-bold mb-1">UNIT PRICE (THB)</label>
                  <input
                    type="number"
                    value={newPartForm.unitCostThb}
                    onChange={e => setNewPartForm({ ...newPartForm, unitCostThb: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-amber-400 block font-bold text-[10px]">PCM LIFE</label>
                  <input
                    type="number"
                    value={newPartForm.pcmLife}
                    onChange={e => setNewPartForm({ ...newPartForm, pcmLife: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-amber-300 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-yellow-400 block font-bold text-[10px]">GOLD LIFE</label>
                  <input
                    type="number"
                    value={newPartForm.goldLife}
                    onChange={e => setNewPartForm({ ...newPartForm, goldLife: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-yellow-300 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-cyan-400 block font-bold text-[10px]">BARE LIFE</label>
                  <input
                    type="number"
                    value={newPartForm.bareLife}
                    onChange={e => setNewPartForm({ ...newPartForm, bareLife: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs font-mono flex items-center gap-1.5 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกชิ้นส่วน (Save Part)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
