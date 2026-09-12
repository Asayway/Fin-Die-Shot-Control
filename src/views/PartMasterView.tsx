import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  Factory,
  Info,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronDown,
  Wrench,
  ShieldCheck,
  RotateCw,
  Gauge,
  Tag,
  Hash,
  Eye,
  Filter,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PartMaster, PartLifeStandard, LineActiveConfiguration, ProductionLineId } from '../types';
import { storageService } from '../services/storageService';

import { DeleteConfirmationModal } from '../components/common/DeleteConfirmationModal';
import { PartMasterModal } from '../components/common/PartMasterModal';
import { StageManagementModal } from '../components/common/StageManagementModal';
import { exportPartMasterExcel } from '../utils/excelExport';
import { DEFAULT_STAGE_GROUPS, deriveLogicalStage } from '../utils/stageUtils';

export interface UnifiedPartMasterRow {
  no: number;
  partCode: string;
  partName: string;
  stage: string;
  drawingNo: string;
  material?: string;
  maintenanceType?: 'REGRIND' | 'DISPOSE';
  installQty: {
    e1?: number;
    e2?: number;
    e3_1?: number;
    e3_2?: number;
    e3_3?: number;
    e4?: number;
    e5?: number;
    totalQty: number;
  };
  shotLifeCycle: {
    e1_pcm?: number;
    e2_gold?: number;
    e3_1_pcm?: number;
    e3_2_gold?: number;
    e3_3_gold?: number;
    e4_bare?: number;
    e5_bare?: number;
    partsSpec?: string;
    lowerSpecScrapLimit?: string | number;
  };
  regrindStandard?: {
    perGrindMm?: string;
    totalGrindMm?: string | number;
    regrindCycles?: number | string;
    note?: string;
  };
}

export const normalizeToMillion = (val: any): number => {
  if (val === undefined || val === null || val === '' || val === '-') return 5.0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return 5.0;
  if (num >= 10000) {
    return Number((num / 1_000_000).toFixed(4));
  }
  return num;
};

export const millionToShots = (val: any): number => {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
  if (num >= 10000) return Math.round(num);
  return Math.round(num * 1_000_000);
};

export const PartMasterView: React.FC = () => {
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [lifeStandards, setLifeStandards] = useState<PartLifeStandard[]>([]);
  const [lineConfigs, setLineConfigs] = useState<LineActiveConfiguration[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');
  const [selectedPartForDetail, setSelectedPartForDetail] = useState<UnifiedPartMasterRow | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPartData, setEditingPartData] = useState<any | null>(null);
  const [showRegrindOnly, setShowRegrindOnly] = useState(false);

  // Inline Add New Part Row State (Top of table, no popup)
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newRowData, setNewRowData] = useState({
    stage: 'Stage 1: Piercing & Burring',
    partName: '',
    partCode: '',
    e1_pcm: 5.0,
    e2_gold: 5.0,
    e3_1_pcm: 5.0,
    e3_2_gold: 5.0,
    e3_3_gold: 5.0,
    e4_bare: 4.0,
    scrapLimit: '62.50',
    perGrindMm: '0.05 mm',
    totalGrindMm: '0.50',
    regrindCycles: 10,
    note: 'Standard regular sharpen'
  });

  // Inline Row Editing State (Direct cell editing on row)
  const [inlineEditingPartCode, setInlineEditingPartCode] = useState<string | null>(null);
  const [inlineEditRowData, setInlineEditRowData] = useState<any | null>(null);

  // Table Batch Edit Mode State (Edit cells across table)
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Stage Grouping Manager Modal State
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);

  // Delete State
  const [deleteTargetPart, setDeleteTargetPart] = useState<UnifiedPartMasterRow | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load from database / storageService
  const loadDatabaseData = () => {
    setPartMasters(storageService.getPartMasters());
    setLifeStandards(storageService.getLifeStandards());
    setLineConfigs(storageService.getLineConfigs());
  };

  useEffect(() => {
    loadDatabaseData();
    const unsub = storageService.subscribe(loadDatabaseData);
    return () => unsub();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Build unified items from database
  const unifiedItems = useMemo<UnifiedPartMasterRow[]>(() => {
    const e1Config = lineConfigs.find(l => l.lineId === 'E1');
    const e2Config = lineConfigs.find(l => l.lineId === 'E2');
    const e3_1Config = lineConfigs.find(l => l.lineId === 'E3-1');
    const e3_2Config = lineConfigs.find(l => l.lineId === 'E3-2');
    const e3_3Config = lineConfigs.find(l => l.lineId === 'E3-3');
    const e4Config = lineConfigs.find(l => l.lineId === 'E4');
    const e5Config = lineConfigs.find(l => l.lineId === 'E5');

    return partMasters.map((pm, idx) => {
      const ls = lifeStandards.find(s => (s as any).partCode === pm.partCode || s.configKey?.partCode === pm.partCode || s.id === pm.partCode);
      
      const qE1 = e1Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE2 = e2Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE3_1 = e3_1Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE3_2 = e3_2Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE3_3 = e3_3Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE4 = e4Config?.installedPartQuantities?.[pm.partCode] || 0;
      const qE5 = e5Config?.installedPartQuantities?.[pm.partCode] || 0;
      const totalQty = qE1 + qE2 + qE3_1 + qE3_2 + qE3_3 + qE4 + qE5;

      const isDisposable = (ls as any)?.disposeAfterUse || pm.maintenanceType === 'DISPOSE' || false;
      const perGrind = (ls as any)?.oneTimeRegrindMm || (isDisposable ? 'Dispose' : '0.05 mm');
      const totalGrind = (ls as any)?.totalRegrindMm || (isDisposable ? '-' : '0.50');
      const maxCycles = (ls as any)?.maxRegrindCount ?? (isDisposable ? 'Dispose' : 10);
      const note = (ls as any)?.specialNotes || (ls as any)?.notes || (isDisposable ? 'เปลี่ยนใหม่เมื่อครบอายุการใช้งาน' : 'ลับคมตามระยะมาตรฐาน');

      const rawLifeM = ls?.lifeLimitShots ? ls.lifeLimitShots / 1_000_000 : 5.0;
      const lifeM = normalizeToMillion(rawLifeM);

      const getStageM = (stageKey: string) => {
        const raw = (ls as any)?.shotLifeStandards?.[stageKey];
        if (raw !== undefined && raw !== null) {
          return normalizeToMillion(raw);
        }
        return lifeM;
      };

      return {
        no: idx + 1,
        partCode: pm.partCode,
        partName: pm.partName,
        stage: deriveLogicalStage(pm.partName, pm.stageName),
        drawingNo: (pm as any).drawingNumber || pm.partCode,
        material: (pm as any).material || 'SKD11 / Carbide',
        maintenanceType: isDisposable ? 'DISPOSE' : 'REGRIND',
        installQty: {
          e1: qE1 || undefined,
          e2: qE2 || undefined,
          e3_1: qE3_1 || undefined,
          e3_2: qE3_2 || undefined,
          e3_3: qE3_3 || undefined,
          e4: qE4 || undefined,
          e5: qE5 || undefined,
          totalQty
        },
        shotLifeCycle: {
          e1_pcm: getStageM('E1'),
          e2_gold: getStageM('E2'),
          e3_1_pcm: getStageM('E3-1'),
          e3_2_gold: getStageM('E3-2'),
          e3_3_gold: getStageM('E3-3'),
          e4_bare: (ls as any)?.shotLifeStandards?.['E4'] !== undefined ? normalizeToMillion((ls as any).shotLifeStandards['E4']) : (lifeM > 4 ? 4.0 : lifeM),
          e5_bare: (ls as any)?.shotLifeStandards?.['E5'] !== undefined ? normalizeToMillion((ls as any).shotLifeStandards['E5']) : (lifeM > 4 ? 4.0 : lifeM),
          partsSpec: (pm as any).material || 'SKD11 / Carbide',
          lowerSpecScrapLimit: (ls as any)?.lowerSpecLimit || (ls as any)?.scrapLimit || '62.50'
        },
        regrindStandard: {
          perGrindMm: perGrind,
          totalGrindMm: totalGrind,
          regrindCycles: maxCycles,
          note
        }
      };
    });
  }, [partMasters, lifeStandards, lineConfigs]);

  // Extract all unique stages (combining defaults and active item stages)
  const allStages = useMemo(() => {
    const stageSet = new Set<string>(DEFAULT_STAGE_GROUPS);
    unifiedItems.forEach(item => {
      if (item.stage && item.stage !== '-') {
        stageSet.add(item.stage);
      }
    });
    return Array.from(stageSet).sort();
  }, [unifiedItems]);

  // Filtered master items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter(item => {
      // Stage filter
      if (selectedStage !== 'ALL') {
        const matchExact = item.stage.toUpperCase() === selectedStage.toUpperCase();
        if (!matchExact) {
          return false;
        }
      }

      // Line filter
      if (selectedLineFilter !== 'ALL') {
        const qtyMap: Record<string, number | undefined> = {
          'E1': item.installQty.e1,
          'E2': item.installQty.e2,
          'E3-1': item.installQty.e3_1,
          'E3-2': item.installQty.e3_2,
          'E3-3': item.installQty.e3_3,
          'E4': item.installQty.e4,
          'E5': item.installQty.e5,
        };
        const lineQty = qtyMap[selectedLineFilter];
        if (!lineQty || lineQty <= 0) return false;
      }

      // Regrind only filter
      if (showRegrindOnly && (item.regrindStandard?.perGrindMm === '-' || item.regrindStandard?.perGrindMm?.includes('Dispose'))) {
        return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.partName.toLowerCase().includes(term);
        const matchCode = item.partCode.toLowerCase().includes(term);
        const matchStage = item.stage.toLowerCase().includes(term);
        const matchNo = item.no.toString() === term;
        return matchName || matchCode || matchStage || matchNo;
      }

      return true;
    });
  }, [unifiedItems, selectedStage, selectedLineFilter, showRegrindOnly, searchTerm]);

  // Save new part entered via inline top row
  const handleSaveNewRowInline = () => {
    if (!newRowData.partName.trim()) {
      showToast('กรุณาระบุ Part Name ให้ครบถ้วน', 'error');
      return;
    }

    const code = newRowData.partCode.trim() 
      ? newRowData.partCode.trim().toUpperCase() 
      : `P-${Date.now().toString().slice(-5)}`;
    
    if (partMasters.some(p => p.partCode.toUpperCase() === code)) {
      showToast(`รายการ ${newRowData.partName} มีอยู่ในระบบแล้ว`, 'error');
      return;
    }

    const newMaster: PartMaster = {
      partCode: code,
      partName: newRowData.partName.trim(),
      partNameTh: newRowData.partName.trim(),
      stageName: newRowData.stage,
      category: 'PUNCH',
      drawingNumber: code,
      unit: 'PCS',
      unitCostThb: 0,
      tubeSizeCompat: 'BOTH'
    };

    const isDispose = newRowData.perGrindMm.toLowerCase().includes('dispose');
    const newLifeStd: PartLifeStandard = {
      id: `STD-ALL-${code}`,
      configKey: {
        lineId: 'ALL',
        configurationId: `CFG-ALL-${code}`,
        dieCode: 'FD-ALL',
        finType: 'Slit (half)',
        material: 'PCM' as any,
        thicknessMm: 0.10,
        tubeSize: 'Ø7' as any,
        partCode: code,
        position: 'ALL',
        effectiveDate: new Date().toISOString().substring(0, 10)
      },
      compositeKeyString: `ALL|PCM|0.10mm|Ø7|${code}`,
      partName: newRowData.partName.trim(),
      stagePunchDie: newRowData.stage,
      lifeLimitShots: millionToShots(newRowData.e1_pcm),
      regrindDepthPerTime: parseFloat(newRowData.perGrindMm) || 0.05,
      maxTotalGrindingLimit: parseFloat(newRowData.totalGrindMm) || 0.50,
      standardShimThickness: 0.20,
      notes: newRowData.note.trim(),
      regrindStandard: {
        oneTimeRegrindMm: newRowData.perGrindMm,
        totalRegrindMm: newRowData.totalGrindMm,
        maxRegrindCount: typeof newRowData.regrindCycles === 'number' ? newRowData.regrindCycles : 10,
        disposeAfterUse: isDispose,
        regrindIntervalNote: newRowData.note.trim()
      },
      createdBy: 'Die Engineer Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    (newLifeStd as any).shotLifeStandards = {
      'E1': millionToShots(newRowData.e1_pcm),
      'E2': millionToShots(newRowData.e2_gold),
      'E3-1': millionToShots(newRowData.e3_1_pcm),
      'E3-2': millionToShots(newRowData.e3_2_gold),
      'E3-3': millionToShots(newRowData.e3_3_gold),
      'E4': millionToShots(newRowData.e4_bare),
      'E5': millionToShots(newRowData.e5_bare),
    };
    (newLifeStd as any).scrapLimit = newRowData.scrapLimit;

    storageService.savePartMaster(newMaster);
    storageService.saveLifeStandard(newLifeStd);

    showToast(`เพิ่มชิ้นส่วนใหม่ ${newMaster.partName} (${newMaster.partCode}) บันทึกลงตารางสำเร็จแล้ว`);
    setIsAddingInline(false);
    setNewRowData({
      stage: 'Stage 1: Piercing & Burring',
      partName: '',
      partCode: '',
      e1_pcm: 5.0,
      e2_gold: 5.0,
      e3_1_pcm: 5.0,
      e3_2_gold: 5.0,
      e3_3_gold: 5.0,
      e4_bare: 4.0,
      scrapLimit: '62.50',
      perGrindMm: '0.05 mm',
      totalGrindMm: '0.50',
      regrindCycles: 10,
      note: 'Standard regular sharpen'
    });
    loadDatabaseData();
  };

  // Start inline editing of an existing row
  const handleStartInlineEdit = (item: UnifiedPartMasterRow) => {
    setInlineEditingPartCode(item.partCode);
    setInlineEditRowData({
      partCode: item.partCode,
      partName: item.partName,
      stage: item.stage,
      e1_pcm: item.shotLifeCycle.e1_pcm ?? 5.0,
      e2_gold: item.shotLifeCycle.e2_gold ?? 5.0,
      e3_1_pcm: item.shotLifeCycle.e3_1_pcm ?? 5.0,
      e3_2_gold: item.shotLifeCycle.e3_2_gold ?? 5.0,
      e3_3_gold: item.shotLifeCycle.e3_3_gold ?? 5.0,
      e4_bare: item.shotLifeCycle.e4_bare ?? 4.0,
      scrapLimit: item.shotLifeCycle.lowerSpecScrapLimit ?? '62.50',
      perGrindMm: item.regrindStandard?.perGrindMm ?? '0.05 mm',
      totalGrindMm: item.regrindStandard?.totalGrindMm ?? '0.50',
      regrindCycles: item.regrindStandard?.regrindCycles ?? 10,
      note: item.regrindStandard?.note ?? ''
    });
  };

  // Save inline edit for a row
  const handleSaveInlineEdit = () => {
    if (!inlineEditRowData) return;
    const pm = partMasters.find(p => p.partCode === inlineEditRowData.partCode);
    if (pm) {
      const updatedPm: PartMaster = {
        ...pm,
        partName: inlineEditRowData.partName,
        stageName: inlineEditRowData.stage
      };
      storageService.savePartMaster(updatedPm);
    }

    const ls = lifeStandards.find(s => (s as any).partCode === inlineEditRowData.partCode || s.configKey?.partCode === inlineEditRowData.partCode || s.id === inlineEditRowData.partCode);
    if (ls) {
      const isDispose = (inlineEditRowData.perGrindMm || '').toLowerCase().includes('dispose');
      const updatedLs: PartLifeStandard = {
        ...ls,
        partName: inlineEditRowData.partName,
        stagePunchDie: inlineEditRowData.stage,
        lifeLimitShots: millionToShots(inlineEditRowData.e1_pcm),
        notes: inlineEditRowData.note,
        regrindStandard: {
          ...ls.regrindStandard,
          oneTimeRegrindMm: inlineEditRowData.perGrindMm,
          totalRegrindMm: inlineEditRowData.totalGrindMm,
          maxRegrindCount: typeof inlineEditRowData.regrindCycles === 'number' ? inlineEditRowData.regrindCycles : 10,
          disposeAfterUse: isDispose,
          regrindIntervalNote: inlineEditRowData.note
        }
      };
      (updatedLs as any).shotLifeStandards = {
        'E1': millionToShots(inlineEditRowData.e1_pcm),
        'E2': millionToShots(inlineEditRowData.e2_gold),
        'E3-1': millionToShots(inlineEditRowData.e3_1_pcm),
        'E3-2': millionToShots(inlineEditRowData.e3_2_gold),
        'E3-3': millionToShots(inlineEditRowData.e3_3_gold),
        'E4': millionToShots(inlineEditRowData.e4_bare),
        'E5': millionToShots(inlineEditRowData.e5_bare),
      };
      (updatedLs as any).scrapLimit = inlineEditRowData.scrapLimit;
      storageService.saveLifeStandard(updatedLs);
    }

    showToast(`บันทึกการแก้ไข ${inlineEditRowData.partName} (${inlineEditRowData.partCode}) ในตารางสำเร็จแล้ว`);
    setInlineEditingPartCode(null);
    setInlineEditRowData(null);
    loadDatabaseData();
  };

  // Table Edit Mode Handlers
  const handleStartEdit = () => {
    const values: Record<string, any> = {};
    unifiedItems.forEach(item => {
      values[item.partCode] = {
        partName: item.partName,
        stage: item.stage,
        e1_pcm: item.shotLifeCycle.e1_pcm ?? 5.0,
        e2_gold: item.shotLifeCycle.e2_gold ?? 5.0,
        e3_1_pcm: item.shotLifeCycle.e3_1_pcm ?? 5.0,
        e3_2_gold: item.shotLifeCycle.e3_2_gold ?? 5.0,
        e3_3_gold: item.shotLifeCycle.e3_3_gold ?? 5.0,
        e4_bare: item.shotLifeCycle.e4_bare ?? 4.0,
        e5_bare: item.shotLifeCycle.e5_bare ?? 4.0,
        scrapLimit: item.shotLifeCycle.lowerSpecScrapLimit ?? '62.50',
        perGrindMm: item.regrindStandard?.perGrindMm ?? '0.05 mm',
        totalGrindMm: item.regrindStandard?.totalGrindMm ?? '0.50',
        regrindCycles: item.regrindStandard?.regrindCycles ?? 10,
        note: item.regrindStandard?.note ?? ''
      };
    });
    setEditValues(values);
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('คุณมีการแก้ไขที่ยังไม่ได้บันทึก ต้องการยกเลิกใช่หรือไม่?')) {
        return;
      }
    }
    setIsEditing(false);
    setEditValues({});
    setHasUnsavedChanges(false);
  };

  const handleCellEditChange = (partCode: string, field: string, val: any) => {
    setEditValues(prev => ({
      ...prev,
      [partCode]: {
        ...(prev[partCode] || {}),
        [field]: val
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveBatchEdit = () => {
    try {
      partMasters.forEach(pm => {
        const rowEdit = editValues[pm.partCode];
        if (rowEdit) {
          const updatedPm: PartMaster = {
            ...pm,
            partName: rowEdit.partName,
            stageName: rowEdit.stage
          };
          storageService.savePartMaster(updatedPm);

          const ls = lifeStandards.find(s => (s as any).partCode === pm.partCode || s.configKey?.partCode === pm.partCode || s.id === pm.partCode);
          if (ls) {
            const isDispose = (rowEdit.perGrindMm || '').toString().toLowerCase().includes('dispose');
            const updatedLs: PartLifeStandard = {
              ...ls,
              partName: rowEdit.partName,
              stagePunchDie: rowEdit.stage,
              lifeLimitShots: millionToShots(rowEdit.e1_pcm),
              notes: rowEdit.note,
              regrindStandard: {
                ...ls.regrindStandard,
                oneTimeRegrindMm: rowEdit.perGrindMm,
                totalRegrindMm: rowEdit.totalGrindMm,
                maxRegrindCount: typeof rowEdit.regrindCycles === 'number' ? rowEdit.regrindCycles : parseInt(rowEdit.regrindCycles) || 10,
                disposeAfterUse: isDispose,
                regrindIntervalNote: rowEdit.note
              }
            };
            (updatedLs as any).shotLifeStandards = {
              'E1': millionToShots(rowEdit.e1_pcm),
              'E2': millionToShots(rowEdit.e2_gold),
              'E3-1': millionToShots(rowEdit.e3_1_pcm),
              'E3-2': millionToShots(rowEdit.e3_2_gold),
              'E3-3': millionToShots(rowEdit.e3_3_gold),
              'E4': millionToShots(rowEdit.e4_bare),
              'E5': millionToShots(rowEdit.e5_bare),
            };
            (updatedLs as any).scrapLimit = rowEdit.scrapLimit;
            storageService.saveLifeStandard(updatedLs);
          }
        }
      });

      showToast(`บันทึกการแก้ไขข้อมูลตาราง ${partMasters.length} รายการลงในฐานข้อมูลเรียบร้อยแล้ว`);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      loadDatabaseData();
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  };

  // Delete part handler
  const handleConfirmDeletePart = () => {
    if (!deleteTargetPart) return;
    try {
      storageService.deletePartMaster(deleteTargetPart.partCode);
      showToast(`ลบข้อมูลชิ้นส่วน ${deleteTargetPart.partName} (${deleteTargetPart.partCode}) เรียบร้อยแล้ว`);
      setDeleteTargetPart(null);
      if (selectedPartForDetail?.partCode === deleteTargetPart.partCode) {
        setSelectedPartForDetail(null);
      }
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'error');
    }
  };

  // Stage color badge style
  const getStageColor = (stage: string) => {
    const stg = stage.toUpperCase();
    if (stg.includes('PIERCE') || stg.includes('BURRING')) return 'bg-amber-950/40 text-amber-300 border-amber-800/60';
    if (stg.includes('IRONING')) return 'bg-blue-950/40 text-blue-300 border-blue-800/60';
    if (stg.includes('LOUVER')) return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
    if (stg.includes('REFLAIRE') || stg.includes('REFLARE')) return 'bg-purple-950/40 text-purple-300 border-purple-800/60';
    if (stg.includes('SLIT')) return 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
    if (stg.includes('CUT OFF') || stg.includes('SIDE CUT')) return 'bg-rose-950/40 text-rose-300 border-rose-800/60';
    if (stg.includes('FORMING')) return 'bg-teal-950/40 text-teal-300 border-teal-800/60';
    return 'bg-slate-800/50 text-slate-300 border-slate-700';
  };

  // Export to Excel Function (.xlsx)
  const handleExportCSV = () => {
    exportPartMasterExcel(filteredItems);
  };

  return (
    <div className="space-y-3.5 font-sans text-white animate-fadeIn pb-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-2.5 border flex items-center justify-between text-xs font-mono font-bold shadow-lg animate-fadeIn ${
          toastMessage.type === 'success'
            ? 'bg-[#111111] border-[#00FF00] text-[#00FF00]'
            : 'bg-rose-950 border-[#C40045] text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HEADER & ACTIONS SUMMARY */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-3 pb-2 border-b border-[#333333]">
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setIsAddingInline(prev => !prev)}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAddingInline 
                ? 'bg-amber-400 text-black font-extrabold shadow-md'
                : 'bg-[#00FF00] hover:bg-[#00dd00] text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มรายการใหม่ (Add Part Master)</span>
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-slate-300 text-xs font-bold border border-[#666666] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ยกเลิก</span>
              </button>
              <button
                type="button"
                onClick={handleSaveBatchEdit}
                className="px-4 py-1.5 bg-[#00FF00] hover:bg-[#00dd00] text-black font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไข ({hasUnsavedChanges ? 'มีการเปลี่ยนแปลง' : 'พร้อมบันทึก'})</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] text-slate-200 border border-[#666666] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF00]" />
                <span>Export Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] text-[#00FF00] border border-[#00FF00] font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขตัวเลขในตาราง (Edit Cells)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH, STAGE DROPDOWN & LINE FILTERS */}
      {/* ======================================================== */}
      <div className="bg-[#111111] border border-[#666666] p-3 space-y-2.5 shadow-md">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          {/* Stage Dropdown Filter & Manager Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#666666] px-2.5 py-1 text-xs min-w-[200px]">
              <Layers className="w-3.5 h-3.5 text-[#00FF00]" />
              <select
                value={selectedStage}
                onChange={e => setSelectedStage(e.target.value)}
                className="bg-transparent text-[#00FF00] font-mono text-xs font-bold focus:outline-none cursor-pointer w-full"
              >
                <option value="ALL" className="bg-[#111111] text-white">ทุกสเตจ (All Stages)</option>
                {allStages.map(stage => (
                  <option key={stage} value={stage} className="bg-[#111111] text-white">
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsStageManagerOpen(true)}
              className="px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#00FF00] border border-[#666666] text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap"
              title="เปิดหน้าต่างจัดกลุ่มและจัดการ Stage"
            >
              <Sliders className="w-3.5 h-3.5 text-[#00FF00]" />
              <span>⚙️ จัดกลุ่ม Stage</span>
            </button>
          </div>
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพาร์ท หรือสเตจ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#666666] pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-[#00FF00]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Additional Line and Regrind Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Line Filter */}
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#666666] px-2.5 py-1 text-xs">
              <Factory className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span className="font-mono text-[11px] text-slate-300">Installed Line:</span>
              <select
                value={selectedLineFilter}
                onChange={e => setSelectedLineFilter(e.target.value)}
                className="bg-transparent text-[#FFCC00] font-mono text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#111111] text-white">ทุกไลน์ (All 7 Lines)</option>
                <option value="E1" className="bg-[#111111] text-white">Line E1 (Ø7 Slit)</option>
                <option value="E2" className="bg-[#111111] text-white">Line E2 (Ø5 Slit)</option>
                <option value="E3-1" className="bg-[#111111] text-white">Line E3-1 (Slit 3P)</option>
                <option value="E3-2" className="bg-[#111111] text-white">Line E3-2 (WL+ 4P)</option>
                <option value="E3-3" className="bg-[#111111] text-white">Line E3-3 (New Cor 4P)</option>
                <option value="E4" className="bg-[#111111] text-white">Line E4 (Ø5 Slit)</option>
                <option value="E5" className="bg-[#111111] text-white">Line E5 (Ø5 Slit)</option>
              </select>
            </div>

            {/* Toggle Re-grind only */}
            <button
              onClick={() => setShowRegrindOnly(!showRegrindOnly)}
              className={`px-2.5 py-1 border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                showRegrindOnly
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold'
                  : 'bg-[#1a1a1a] border-[#666666] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-purple-400" />
              <span>เฉพาะพาร์ทลับคม</span>
            </button>

            {(selectedStage !== 'ALL' || selectedLineFilter !== 'ALL' || showRegrindOnly || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStage('ALL');
                  setSelectedLineFilter('ALL');
                  setShowRegrindOnly(false);
                  setSearchTerm('');
                }}
                className="px-2 py-1 text-xs bg-[#222222] hover:bg-[#333333] text-slate-300 border border-[#666666] flex items-center gap-1 transition-colors cursor-pointer"
                title="รีเซ็ตตัวกรองทั้งหมด"
              >
                <X className="w-3 h-3 text-[#FFCC00]" />
                <span>รีเซ็ต</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MASTER DATA TABLE - TIGHT INDUSTRIAL TABLE WITH LOCKED STICKY HEADER */}
      {/* ======================================================== */}
      <div className="bg-[#111111] border border-[#666666] shadow-xl overflow-hidden">
        <div className="p-2.5 bg-[#1a1a1a] border-b border-[#666666] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00FF00]" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              PARTS MASTER DATA DICTIONARY ({filteredItems.length} / {unifiedItems.length} รายการ)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF00]"></span>
              <span>หัวตารางล็อกคงที่ (Locked Sticky Header)</span>
            </span>
            <span>• คลิกแถวเพื่อดูรายละเอียด</span>
          </div>
        </div>

        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-thin relative">
          <table 
            className="w-full text-left text-xs font-mono min-w-[1200px]" 
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            {/* Multi-tier Locked Sticky Table Header */}
            <thead>
              {/* Header Tier 1 (Sticky Top 0) */}
              <tr className="text-white text-[11px] select-none">
                <th 
                  colSpan={3} 
                  className="sticky top-0 z-20 py-1.5 px-2 border-b border-r border-[#666666] text-white font-bold text-left bg-[#444455] shadow-xs"
                >
                  1. PART IDENTIFICATION & SPEC
                </th>
                <th 
                  colSpan={8} 
                  className="sticky top-0 z-20 py-1.5 px-2 border-b border-r border-[#666666] text-[#00FF00] font-bold text-center bg-[#3a3a4a] shadow-xs"
                >
                  2. STANDARDIZATION OF SHOT USAGE CYCLE (MILLION SHOTS)
                </th>
                <th 
                  colSpan={4} 
                  className="sticky top-0 z-20 py-1.5 px-2 border-b border-r border-[#666666] text-purple-300 font-bold text-center bg-[#444455] shadow-xs"
                >
                  3. STANDARD RE-GRINDING
                </th>
                <th 
                  colSpan={1} 
                  className="sticky top-0 z-20 py-1.5 px-2 border-b border-[#666666] text-[#FFCC00] font-bold text-center bg-[#3a3a4a] shadow-xs w-24"
                >
                  4. ACTIONS
                </th>
              </tr>

              {/* Header Tier 2 (Sticky Top 28px) */}
              <tr className="text-white text-[10px] tracking-wider select-none font-bold">
                {/* 1. Identification */}
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center w-10 border-b border-r border-[#666666] bg-[#555566]">No</th>
                <th className="sticky top-[27px] z-20 py-1 px-2 border-b border-r border-[#666666] bg-[#555566]">Stage</th>
                <th className="sticky top-[27px] z-20 py-1 px-2 border-b border-r border-[#666666] bg-[#555566] min-w-[200px]">Part Name</th>

                {/* 2. Shot Usage Standards (Per reference naming) */}
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E1 (Ø7 Slit)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E2 (Ø5 Slit)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E3-1 (Slit 3P)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E3-2 (WL+ 4P)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E3-3 (New Cor 4P)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E4 (Ø5 Slit)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#00FF00] border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[70px]">
                  E5 (Ø5 Slit)
                </th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-slate-300 border-b border-r border-[#666666] bg-[#4a4a5a] min-w-[75px]">
                  Scrap Limit
                </th>

                {/* 3. Regrinding Standards */}
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-purple-300 border-b border-r border-[#666666] bg-[#555566] min-w-[75px]">1 time (mm)</th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-purple-300 border-b border-r border-[#666666] bg-[#555566] min-w-[70px]">Total (mm)</th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-purple-300 border-b border-r border-[#666666] bg-[#555566] min-w-[70px]">Max Cycles</th>
                <th className="sticky top-[27px] z-20 py-1 px-2 text-purple-200 border-b border-r border-[#666666] bg-[#555566] min-w-[150px]">Note / Standard</th>

                {/* 4. Actions */}
                <th className="sticky top-[27px] z-20 py-1 px-2 text-center text-[#FFCC00] border-b border-[#666666] bg-[#4a4a5a] w-24">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {/* ======================================================== */}
              {/* TOP INLINE ADD ROW (Direct Entry at Top of Table) */}
              {/* ======================================================== */}
              {isAddingInline && (
                <tr className="bg-[#1e2e1e] border-b-2 border-[#00FF00] animate-fadeIn">
                  <td className="py-1 px-2 text-center text-[#00FF00] font-bold border-r border-[#444444]">
                    NEW
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <select
                      value={newRowData.stage}
                      onChange={e => setNewRowData({ ...newRowData, stage: e.target.value })}
                      className="w-full bg-[#111111] text-[#00FF00] border border-[#00FF00] p-1 text-[11px] font-bold font-mono focus:outline-none"
                    >
                      {allStages.length > 0 ? (
                        allStages.map(stg => (
                          <option key={stg} value={stg} className="bg-[#111111] text-white">
                            {stg}
                          </option>
                        ))
                      ) : (
                        <option value="Stage 1: Piercing & Burring">Stage 1: Piercing & Burring</option>
                      )}
                    </select>
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Part Name (e.g. 1st Piercing Punch)"
                        value={newRowData.partName}
                        onChange={e => setNewRowData({ ...newRowData, partName: e.target.value })}
                        className="w-full bg-[#111111] text-white border border-[#00FF00] px-1.5 py-0.5 text-xs font-bold font-mono focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e1_pcm}
                      onChange={e => setNewRowData({ ...newRowData, e1_pcm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e2_gold}
                      onChange={e => setNewRowData({ ...newRowData, e2_gold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e3_1_pcm}
                      onChange={e => setNewRowData({ ...newRowData, e3_1_pcm: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e3_2_gold}
                      onChange={e => setNewRowData({ ...newRowData, e3_2_gold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e3_3_gold}
                      onChange={e => setNewRowData({ ...newRowData, e3_3_gold: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      step="0.5"
                      value={newRowData.e4_bare}
                      onChange={e => setNewRowData({ ...newRowData, e4_bare: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="text"
                      value={newRowData.scrapLimit}
                      onChange={e => setNewRowData({ ...newRowData, scrapLimit: e.target.value })}
                      className="w-full bg-[#111111] text-center text-slate-200 border border-[#666666] py-0.5 text-[11px] font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="text"
                      value={newRowData.perGrindMm}
                      onChange={e => setNewRowData({ ...newRowData, perGrindMm: e.target.value })}
                      className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="text"
                      value={newRowData.totalGrindMm}
                      onChange={e => setNewRowData({ ...newRowData, totalGrindMm: e.target.value })}
                      className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="number"
                      value={newRowData.regrindCycles}
                      onChange={e => setNewRowData({ ...newRowData, regrindCycles: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#111111] text-center text-purple-300 font-bold border border-[#666666] py-0.5 text-xs font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 border-r border-[#444444]">
                    <input
                      type="text"
                      placeholder="Note / Standard"
                      value={newRowData.note}
                      onChange={e => setNewRowData({ ...newRowData, note: e.target.value })}
                      className="w-full bg-[#111111] text-slate-300 border border-[#666666] px-1 py-0.5 text-[11px] font-mono"
                    />
                  </td>
                  <td className="py-1 px-1 text-center bg-[#182818]">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={handleSaveNewRowInline}
                        className="px-2 py-1 bg-[#00FF00] hover:bg-[#00dd00] text-black font-bold text-[11px] flex items-center gap-0.5 cursor-pointer shadow-sm"
                        title="บันทึกรายการใหม่ (Save)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>บันทึก</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingInline(false)}
                        className="p-1 bg-[#222222] hover:bg-[#333333] text-slate-400 hover:text-white border border-[#666666] cursor-pointer"
                        title="ยกเลิก (Cancel)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredItems.length === 0 && !isAddingInline ? (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-slate-500 bg-[#161616] border-b border-[#666666]">
                    ไม่พบข้อมูลชิ้นส่วนที่ตรงกับคำค้นหาหรือตัวกรอง
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isSelected = selectedPartForDetail?.no === item.no;
                  const isEditingThisRow = inlineEditingPartCode === item.partCode;
                  const isDisposable = item.regrindStandard?.perGrindMm?.includes('Dispose') || item.maintenanceType === 'DISPOSE';
                  const rowEdit = editValues[item.partCode];

                  if (isEditing && rowEdit) {
                    return (
                      <tr key={item.partCode} className="bg-[#1e2a1e] border-b border-[#00FF00] animate-fadeIn">
                        <td className="py-1 px-2 text-center font-bold text-[#00FF00] border-r border-[#444444]">
                          {item.no}
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <select
                            value={rowEdit.stage}
                            onChange={e => handleCellEditChange(item.partCode, 'stage', e.target.value)}
                            className="w-full bg-[#111111] text-[#00FF00] border border-[#00FF00] p-1 text-[11px] font-mono focus:outline-none"
                          >
                            {allStages.map(stg => (
                              <option key={stg} value={stg} className="bg-[#111111] text-white">
                                {stg}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={rowEdit.partName}
                            onChange={e => handleCellEditChange(item.partCode, 'partName', e.target.value)}
                            className="w-full bg-[#111111] text-white border border-[#00FF00] px-1 py-0.5 text-xs font-bold font-mono focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e1_pcm}
                            onChange={e => handleCellEditChange(item.partCode, 'e1_pcm', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e2_gold}
                            onChange={e => handleCellEditChange(item.partCode, 'e2_gold', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e3_1_pcm}
                            onChange={e => handleCellEditChange(item.partCode, 'e3_1_pcm', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e3_2_gold}
                            onChange={e => handleCellEditChange(item.partCode, 'e3_2_gold', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e3_3_gold}
                            onChange={e => handleCellEditChange(item.partCode, 'e3_3_gold', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e4_bare}
                            onChange={e => handleCellEditChange(item.partCode, 'e4_bare', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={rowEdit.e5_bare}
                            onChange={e => handleCellEditChange(item.partCode, 'e5_bare', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={rowEdit.scrapLimit}
                            onChange={e => handleCellEditChange(item.partCode, 'scrapLimit', e.target.value)}
                            className="w-full bg-[#111111] text-center text-slate-200 border border-[#666666] py-0.5 text-[11px] font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={rowEdit.perGrindMm}
                            onChange={e => handleCellEditChange(item.partCode, 'perGrindMm', e.target.value)}
                            className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={rowEdit.totalGrindMm}
                            onChange={e => handleCellEditChange(item.partCode, 'totalGrindMm', e.target.value)}
                            className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            value={rowEdit.regrindCycles}
                            onChange={e => handleCellEditChange(item.partCode, 'regrindCycles', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#111111] text-center text-purple-300 font-bold border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={rowEdit.note}
                            onChange={e => handleCellEditChange(item.partCode, 'note', e.target.value)}
                            className="w-full bg-[#111111] text-slate-300 border border-[#666666] px-1 py-0.5 text-[11px] font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 text-center bg-[#182818]">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-[#00FF00] font-mono font-bold">
                            EDITING
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (isEditingThisRow && inlineEditRowData) {
                    return (
                      <tr key={item.partCode} className="bg-[#242416] border-b border-[#FFCC00] animate-fadeIn">
                        <td className="py-1 px-2 text-center font-bold text-[#FFCC00] border-r border-[#444444]">
                          {item.no}
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <select
                            value={inlineEditRowData.stage}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, stage: e.target.value })}
                            className="w-full bg-[#111111] text-[#FFCC00] border border-[#FFCC00] p-1 text-[11px] font-mono focus:outline-none"
                          >
                            {allStages.map(stg => (
                              <option key={stg} value={stg} className="bg-[#111111] text-white">
                                {stg}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={inlineEditRowData.partName}
                              onChange={e => setInlineEditRowData({ ...inlineEditRowData, partName: e.target.value })}
                              className="w-full bg-[#111111] text-white border border-[#FFCC00] px-1 py-0.5 text-xs font-bold font-mono focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e1_pcm}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e1_pcm: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e2_gold}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e2_gold: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e3_1_pcm}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e3_1_pcm: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e3_2_gold}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e3_2_gold: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e3_3_gold}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e3_3_gold: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            step="0.5"
                            value={inlineEditRowData.e4_bare}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, e4_bare: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={inlineEditRowData.scrapLimit}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, scrapLimit: e.target.value })}
                            className="w-full bg-[#111111] text-center text-slate-200 border border-[#666666] py-0.5 text-[11px] font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={inlineEditRowData.perGrindMm}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, perGrindMm: e.target.value })}
                            className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={inlineEditRowData.totalGrindMm}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, totalGrindMm: e.target.value })}
                            className="w-full bg-[#111111] text-center text-purple-300 border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="number"
                            value={inlineEditRowData.regrindCycles}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, regrindCycles: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[#111111] text-center text-purple-300 font-bold border border-[#666666] py-0.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 border-r border-[#444444]">
                          <input
                            type="text"
                            value={inlineEditRowData.note}
                            onChange={e => setInlineEditRowData({ ...inlineEditRowData, note: e.target.value })}
                            className="w-full bg-[#111111] text-slate-300 border border-[#666666] px-1 py-0.5 text-[11px] font-mono"
                          />
                        </td>
                        <td className="py-1 px-1 text-center bg-[#282414]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveInlineEdit}
                              className="px-2 py-1 bg-[#FFCC00] hover:bg-[#e6b800] text-black font-bold text-[11px] flex items-center gap-0.5 cursor-pointer shadow-sm"
                              title="บันทึกการแก้ไข (Save)"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>บันทึก</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineEditingPartCode(null);
                                setInlineEditRowData(null);
                              }}
                              className="p-1 bg-[#222222] hover:bg-[#333333] text-slate-400 hover:text-white border border-[#666666] cursor-pointer"
                              title="ยกเลิก (Cancel)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={item.partCode}
                      className={`transition-colors border-b border-[#444444] ${
                        isSelected
                          ? 'bg-[#2a2a2a]'
                          : 'bg-[#1e1e1e] hover:bg-[#282828]'
                      }`}
                    >
                      {/* 1. Identification */}
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center font-bold text-slate-400 border-r border-[#444444] cursor-pointer"
                      >
                        {item.no}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 border-r border-[#444444] cursor-pointer"
                      >
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${getStageColor(item.stage)}`}>
                          {item.stage}
                        </span>
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 font-bold text-white border-r border-[#444444] cursor-pointer"
                      >
                        <div>
                          <span className="hover:text-[#00FF00] transition-colors block">{item.partName}</span>
                        </div>
                      </td>

                      {/* 2. Shot Usage Cycle Standards */}
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e1_pcm !== undefined ? `${item.shotLifeCycle.e1_pcm}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e2_gold !== undefined ? `${item.shotLifeCycle.e2_gold}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e3_1_pcm !== undefined ? `${item.shotLifeCycle.e3_1_pcm}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e3_2_gold !== undefined ? `${item.shotLifeCycle.e3_2_gold}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e3_3_gold !== undefined ? `${item.shotLifeCycle.e3_3_gold}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e4_bare !== undefined ? `${item.shotLifeCycle.e4_bare}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-[#00FF00] border-r border-[#444444] cursor-pointer"
                      >
                        {item.shotLifeCycle.e5_bare !== undefined ? `${item.shotLifeCycle.e5_bare}M` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-slate-300 border-r border-[#444444] text-[10px] cursor-pointer"
                      >
                        {item.shotLifeCycle.lowerSpecScrapLimit ? `${item.shotLifeCycle.lowerSpecScrapLimit} mm` : '-'}
                      </td>

                      {/* 3. Regrind Standards */}
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center border-r border-[#444444] cursor-pointer"
                      >
                        {isDisposable ? (
                          <span className="text-[10px] text-[#C40045] bg-[#22000c] px-1 py-0.2 border border-[#C40045]">
                            Disposable
                          </span>
                        ) : (
                          <span className="text-purple-300">{item.regrindStandard?.perGrindMm || '-'}</span>
                        )}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-purple-300 border-r border-[#444444] cursor-pointer"
                      >
                        {item.regrindStandard?.totalGrindMm !== '-' && item.regrindStandard?.totalGrindMm ? `${item.regrindStandard.totalGrindMm} mm` : '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-center text-purple-300 font-bold border-r border-[#444444] cursor-pointer"
                      >
                        {item.regrindStandard?.regrindCycles ?? '-'}
                      </td>
                      <td 
                        onClick={() => setSelectedPartForDetail(item)}
                        className="py-1 px-2 text-slate-300 text-[11px] truncate max-w-[180px] border-r border-[#444444] cursor-pointer" 
                        title={item.regrindStandard?.note}
                      >
                        {item.regrindStandard?.note && item.regrindStandard?.note !== '-' ? item.regrindStandard.note : '-'}
                      </td>

                      {/* 4. Row Action Buttons: Edit and Delete */}
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartInlineEdit(item);
                            }}
                            className="p-1 bg-[#111111] hover:bg-[#333333] text-[#00FF00] border border-[#555555] hover:border-[#00FF00] transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลชิ้นส่วนพาร์ทแบบ Inline (Edit Part Row)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetPart(item);
                            }}
                            className="p-1 bg-[#111111] hover:bg-[#2b000a] text-slate-400 hover:text-[#C40045] border border-[#555555] hover:border-[#C40045] transition-colors cursor-pointer"
                            title="ลบชิ้นส่วนนี้ (Delete Part)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DETAIL SPECIFICATION DRAWER / MODAL */}
      {/* ======================================================== */}
      {selectedPartForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111111] border border-[#666666] p-5 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#666666] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1a1a1a] border border-[#00FF00] flex items-center justify-center text-[#00FF00] font-bold font-mono">
                  #{selectedPartForDetail.no}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border ${getStageColor(selectedPartForDetail.stage)}`}>
                      {selectedPartForDetail.stage}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                    {selectedPartForDetail.partName}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleStartInlineEdit(selectedPartForDetail);
                    setSelectedPartForDetail(null);
                  }}
                  className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#262626] text-[#00FF00] border border-[#00FF00] text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลในตาราง (Edit Inline)</span>
                </button>
                <button
                  onClick={() => setSelectedPartForDetail(null)}
                  className="text-slate-400 hover:text-white px-2.5 py-1 bg-[#222222] hover:bg-[#333333] border border-[#666666] text-xs font-mono cursor-pointer"
                >
                  ปิด (Close)
                </button>
              </div>
            </div>

            {/* 4 Main Data Sections */}
            <div className="space-y-3 text-xs font-mono">
              {/* 1. Identification */}
              <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-2">
                <div className="text-[#00FF00] font-bold flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5" />
                  <span>1. PART IDENTIFICATION & CLASSIFICATION</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">STAGE NAME:</span>
                    <span className="text-white font-bold">{selectedPartForDetail.stage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PART SPEC / MATERIAL:</span>
                    <span className="text-[#00FF00] font-bold">{selectedPartForDetail.material || 'SKD11 / Carbide'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Line Installed Quantities - Direct Single Source of Truth */}
              <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-2">
                <div className="text-[#FFCC00] font-bold flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    <span>2. LINKED INSTALL QUANTITY BY LINE (SINGLE SOURCE OF TRUTH)</span>
                  </div>
                  <span className="text-xs bg-[#222222] px-2 py-0.5 border border-[#666666]">
                    TOTAL: <strong className="text-[#FFCC00]">{selectedPartForDetail.installQty.totalQty} EA</strong>
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                  {[
                    { line: 'E1', val: selectedPartForDetail.installQty.e1 },
                    { line: 'E2', val: selectedPartForDetail.installQty.e2 },
                    { line: 'E3-1', val: selectedPartForDetail.installQty.e3_1 },
                    { line: 'E3-2', val: selectedPartForDetail.installQty.e3_2 },
                    { line: 'E3-3', val: selectedPartForDetail.installQty.e3_3 },
                    { line: 'E4', val: selectedPartForDetail.installQty.e4 },
                    { line: 'E5', val: selectedPartForDetail.installQty.e5 },
                  ].map(slot => (
                    <div key={slot.line} className="bg-[#111111] border border-[#666666] p-1.5 text-center">
                      <span className="text-[10px] text-slate-400 block">{slot.line}</span>
                      <span className={`text-xs font-bold ${slot.val ? 'text-[#FFCC00]' : 'text-slate-600'}`}>
                        {slot.val || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Standardization of Shot Usage Cycle */}
              <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-2">
                <div className="text-[#00FF00] font-bold flex items-center gap-1.5 text-xs">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>3. STANDARDIZATION OF SHOT USAGE CYCLE (MILLION SHOTS)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">E1 PCM / E3-1 PCM:</span>
                    <span className="text-[#00FF00] font-bold">
                      {selectedPartForDetail.shotLifeCycle.e1_pcm ? `${selectedPartForDetail.shotLifeCycle.e1_pcm}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">E2 GOLD:</span>
                    <span className="text-[#00FF00] font-bold">
                      {selectedPartForDetail.shotLifeCycle.e2_gold ? `${selectedPartForDetail.shotLifeCycle.e2_gold}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">E4 / E5 BARE:</span>
                    <span className="text-[#00FF00] font-bold">
                      {selectedPartForDetail.shotLifeCycle.e4_bare ? `${selectedPartForDetail.shotLifeCycle.e4_bare}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">SCRAP / LOWER LIMIT:</span>
                    <span className="text-[#C40045] font-bold">
                      {selectedPartForDetail.shotLifeCycle.lowerSpecScrapLimit ? `${selectedPartForDetail.shotLifeCycle.lowerSpecScrapLimit} mm` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Standard Re-grinding & Maintenance Standard */}
              <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-2">
                <div className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>4. STANDARD RE-GRINDING & TOOLROOM INSTRUCTION</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-300">
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">1 TIME / RE-GRIND:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard?.perGrindMm || '-'}</span>
                  </div>
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">TOTAL GRIND DEPTH:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard?.totalGrindMm || '-'} mm</span>
                  </div>
                  <div className="bg-[#111111] border border-[#666666] p-1.5">
                    <span className="text-slate-500 block text-[10px]">MAX RE-GRIND CYCLES:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard?.regrindCycles ?? '-'}</span>
                  </div>
                </div>
                {selectedPartForDetail.regrindStandard?.note && selectedPartForDetail.regrindStandard.note !== '-' && (
                  <div className="bg-[#111111] border border-purple-900/60 p-2 text-purple-200 text-xs mt-1">
                    <span className="font-bold text-[10px] text-purple-400 block uppercase">Special Note / Guideline:</span>
                    {selectedPartForDetail.regrindStandard.note}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#666666]">
              <button
                onClick={() => setSelectedPartForDetail(null)}
                className="px-4 py-1.5 bg-[#00FF00] hover:bg-[#00dd00] text-black text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                ตกลง (OK)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <DeleteConfirmationModal
        isOpen={!!deleteTargetPart}
        onClose={() => setDeleteTargetPart(null)}
        onConfirm={handleConfirmDeletePart}
        title="ยืนยันการลบชิ้นส่วนแม่พิมพ์ (Delete Part Master)"
        itemName={deleteTargetPart ? `${deleteTargetPart.partName} (${deleteTargetPart.partCode})` : ''}
        itemDetails={deleteTargetPart ? `Stage: ${deleteTargetPart.stage} | Total Installed: ${deleteTargetPart.installQty.totalQty} EA` : ''}
        warningText="การลบชิ้นส่วนนี้จะลบสเปกอายุการใช้งาน (Life Standards) และจำนวนติดตั้งในสายการผลิต (Matrix) ทั้งหมดออกอย่างถาวร"
      />

      {/* ======================================================== */}
      {/* 7. ADD / EDIT PART MODAL */}
      {/* ======================================================== */}
      <PartMasterModal
        isOpen={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingPartData(null);
        }}
        onSaved={() => {
          loadDatabaseData();
        }}
        editItem={editingPartData}
      />

      {/* ======================================================== */}
      {/* 8. STAGE GROUPING MANAGEMENT MODAL */}
      {/* ======================================================== */}
      <StageManagementModal
        isOpen={isStageManagerOpen}
        onClose={() => setIsStageManagerOpen(false)}
        onSave={loadDatabaseData}
      />

    </div>
  );
};
