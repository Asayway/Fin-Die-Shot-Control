import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid3X3, 
  Search, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  Plus, 
  Info, 
  Filter, 
  Check, 
  X, 
  Factory, 
  Edit3, 
  Trash2, 
  Sliders, 
  Database,
  Copy,
  Zap,
  Wrench,
  RotateCcw
} from 'lucide-react';
import { ProductionLineId, LineActiveConfiguration, PartMaster } from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

import { PartMasterModal } from '../components/common/PartMasterModal';
import { DeleteConfirmationModal } from '../components/common/DeleteConfirmationModal';
import { StageManagementModal } from '../components/common/StageManagementModal';
import { exportInstallMatrixExcel } from '../utils/excelExport';
import { DEFAULT_STAGE_GROUPS, deriveLogicalStage, sortStagesInOrder } from '../utils/stageUtils';

interface LineColDefinition {
  id: ProductionLineId;
  label: string;
  headerName: string;
  subName: string;
}

const LINE_COLUMNS: LineColDefinition[] = [
  { id: 'E1', label: 'E1', headerName: 'E1', subName: 'Ø7 Slit' },
  { id: 'E2', label: 'E2', headerName: 'E2', subName: 'Ø5 Slit' },
  { id: 'E3-1', label: 'E3-1', headerName: 'E3-1', subName: 'Slit 3P' },
  { id: 'E3-2', label: 'E3-2', headerName: 'E3-2', subName: 'WL+ 4P' },
  { id: 'E3-3', label: 'E3-3', headerName: 'E3-3', subName: 'New Cor 4P' },
  { id: 'E4', label: 'E4', headerName: 'E4', subName: 'Ø5 Slit' },
  { id: 'E5', label: 'E5', headerName: 'E5', subName: 'Ø5 Slit' },
];

export const InstallQuantityMatrixView: React.FC = () => {
  const [lines, setLines] = useState<LineActiveConfiguration[]>([]);
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editMatrixValues, setEditMatrixValues] = useState<Record<string, number>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Inline Add State
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newRowData, setNewRowData] = useState<{
    stage: string;
    partName: string;
    partCode: string;
    quantities: Record<string, number>;
  }>({
    stage: DEFAULT_STAGE_GROUPS[0],
    partName: '',
    partCode: '',
    quantities: {
      'E1': 0,
      'E2': 0,
      'E3-1': 0,
      'E3-2': 0,
      'E3-3': 0,
      'E4': 0,
      'E5': 0,
    }
  });

  // CRUD Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPartData, setEditingPartData] = useState<any | null>(null);
  const [deleteTargetPart, setDeleteTargetPart] = useState<{ partCode: string; partName: string; stage: string; total: number } | null>(null);

  // Batch Update Modal / Panel State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'FILL' | 'COPY' | 'RESET'>('FILL');
  const [batchTargetStage, setBatchTargetStage] = useState<string>('ALL');
  const [batchTargetLine, setBatchTargetLine] = useState<string>('ALL');
  const [batchFillQty, setBatchFillQty] = useState<number>(180);
  const [batchCopySourceLine, setBatchCopySourceLine] = useState<ProductionLineId>('E4');
  const [batchCopyTargetLine, setBatchCopyTargetLine] = useState<ProductionLineId>('E5');

  // Stage Grouping Manager Modal State
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);

  const loadData = () => {
    setLines(storageService.getLineConfigs());
    setPartMasters(storageService.getPartMasters());
  };

  useEffect(() => {
    loadData();
    const unsub = storageService.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleSaveNewRowInline = () => {
    if (!newRowData.partName.trim()) {
      alert('กรุณากรอก Part Name');
      return;
    }
    const finalPartCode = newRowData.partCode.trim() 
      ? newRowData.partCode.trim().toUpperCase() 
      : `P-${Date.now().toString().slice(-4)}`;

    const exists = partMasters.some(p => p.partCode.toUpperCase() === finalPartCode);
    if (exists) {
      alert(`รหัส Part Code "${finalPartCode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }

    try {
      // 1. Save new Part Master
      const newPart: PartMaster = {
        partCode: finalPartCode,
        partName: newRowData.partName.trim(),
        partNameTh: newRowData.partName.trim(),
        stageName: newRowData.stage,
        description: `${newRowData.stage} Part`,
        category: 'PUNCH',
        unit: 'PCS',
        unitCostThb: 0,
        tubeSizeCompat: 'BOTH',
        drawingNumber: finalPartCode
      };
      storageService.savePartMaster(newPart);

      // 2. Save line quantities
      const currentConfigs = storageService.getLineConfigs();
      const updatedConfigs = currentConfigs.map(lineConfig => {
        const lineId = lineConfig.lineId;
        const qty = newRowData.quantities[lineId] || 0;
        return {
          ...lineConfig,
          installedPartQuantities: {
            ...(lineConfig.installedPartQuantities || {}),
            [finalPartCode]: qty
          }
        };
      });
      storageService.saveLineConfigs(updatedConfigs);

      // Reset and notify
      setIsAddingInline(false);
      setNewRowData({
        stage: stageOptions[0] || DEFAULT_STAGE_GROUPS[0],
        partName: '',
        partCode: '',
        quantities: {
          'E1': 0,
          'E2': 0,
          'E3-1': 0,
          'E3-2': 0,
          'E3-3': 0,
          'E4': 0,
          'E5': 0,
        }
      });
      loadData();
      setSaveSuccessMsg(`เพิ่มชิ้นส่วน "${newPart.partName}" (${finalPartCode}) สำเร็จแล้ว`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const getCellKey = (partCode: string, lineId: string) => `${partCode}__${lineId}`;

  // Unique list of stages for dropdown (combining default stage groups and active stages)
  const stageOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_STAGE_GROUPS);
    partMasters.forEach(pm => {
      const derived = deriveLogicalStage(pm.partName, pm.stageName);
      if (derived && derived !== '-') {
        set.add(derived);
      }
    });
    return sortStagesInOrder(Array.from(set));
  }, [partMasters]);

  // Build the live matrix rows
  const matrixRows = useMemo(() => {
    return partMasters.map((pm, index) => {
      const rowData: {
        no: number;
        partCode: string;
        partName: string;
        drawingCode: string;
        stageName: string;
        material?: string;
        maintenanceType?: 'REGRIND' | 'DISPOSE';
        quantities: Record<string, number>;
        total: number;
      } = {
        no: index + 1,
        partCode: pm.partCode,
        partName: pm.partName,
        drawingCode: (pm as any).drawingNumber || pm.partCode,
        stageName: deriveLogicalStage(pm.partName, pm.stageName),
        material: (pm as any).material || 'SKD11',
        maintenanceType: (pm as any).maintenanceType || 'REGRIND',
        quantities: {},
        total: 0
      };

      let rowTotal = 0;
      LINE_COLUMNS.forEach(col => {
        let val = 0;
        const lineConfig = lines.find(l => l.lineId === col.id);
        if (lineConfig && lineConfig.installedPartQuantities) {
          val = lineConfig.installedPartQuantities[pm.partCode] || 0;
        }

        // If in edit mode and user modified this cell, reflect the edit value
        if (isEditing) {
          const key = getCellKey(pm.partCode, col.id);
          if (editMatrixValues[key] !== undefined) {
            val = editMatrixValues[key];
          }
        }

        rowData.quantities[col.id] = val;
        rowTotal += val;
      });

      rowData.total = rowTotal;
      return rowData;
    });
  }, [partMasters, lines, isEditing, editMatrixValues]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return matrixRows.filter(row => {
      const matchSearch = 
        row.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.drawingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.no.toString() === searchTerm.trim();

      if (!matchSearch) return false;

      if (selectedStageFilter !== 'ALL') {
        if (row.stageName.toUpperCase() !== selectedStageFilter.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [matrixRows, searchTerm, selectedStageFilter]);

  // Grand totals across all lines
  const grandTotalActiveTooling = useMemo(() => {
    return matrixRows.reduce((sum, row) => sum + row.total, 0);
  }, [matrixRows]);

  const lineSubTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    LINE_COLUMNS.forEach(col => {
      totals[col.id] = matrixRows.reduce((sum, row) => sum + (row.quantities[col.id] || 0), 0);
    });
    return totals;
  }, [matrixRows]);

  // Enter Edit Mode
  const handleStartEdit = () => {
    const currentValues: Record<string, number> = {};
    matrixRows.forEach(row => {
      LINE_COLUMNS.forEach(col => {
        currentValues[getCellKey(row.partCode, col.id)] = row.quantities[col.id] || 0;
      });
    });
    setEditMatrixValues(currentValues);
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  // Cell Value Changed
  const handleCellChange = (partCode: string, lineId: string, val: number) => {
    const safeVal = Math.max(0, Math.floor(val || 0));
    setEditMatrixValues(prev => ({
      ...prev,
      [getCellKey(partCode, lineId)]: safeVal
    }));
    setHasUnsavedChanges(true);
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('คุณมีการแก้ไขที่ยังไม่ได้บันทึก ต้องการยกเลิกใช่หรือไม่?')) {
        return;
      }
    }
    setIsEditing(false);
    setEditMatrixValues({});
    setHasUnsavedChanges(false);
  };

  // Apply Batch Update into Matrix Edit State
  const handleApplyBatchOperation = () => {
    let updatedValues: Record<string, number> = { ...editMatrixValues };
    if (!isEditing) {
      matrixRows.forEach(row => {
        LINE_COLUMNS.forEach(col => {
          updatedValues[getCellKey(row.partCode, col.id)] = row.quantities[col.id] || 0;
        });
      });
    }

    let affectedCount = 0;

    if (batchActionType === 'FILL') {
      matrixRows.forEach(row => {
        if (batchTargetStage === 'ALL' || row.stageName.toUpperCase() === batchTargetStage.toUpperCase()) {
          LINE_COLUMNS.forEach(col => {
            if (batchTargetLine === 'ALL' || col.id === batchTargetLine) {
              updatedValues[getCellKey(row.partCode, col.id)] = batchFillQty;
              affectedCount++;
            }
          });
        }
      });
    } else if (batchActionType === 'COPY') {
      matrixRows.forEach(row => {
        if (batchTargetStage === 'ALL' || row.stageName.toUpperCase() === batchTargetStage.toUpperCase()) {
          const sourceVal = updatedValues[getCellKey(row.partCode, batchCopySourceLine)] ?? row.quantities[batchCopySourceLine] ?? 0;
          updatedValues[getCellKey(row.partCode, batchCopyTargetLine)] = sourceVal;
          affectedCount++;
        }
      });
    } else if (batchActionType === 'RESET') {
      matrixRows.forEach(row => {
        if (batchTargetStage === 'ALL' || row.stageName.toUpperCase() === batchTargetStage.toUpperCase()) {
          LINE_COLUMNS.forEach(col => {
            if (batchTargetLine === 'ALL' || col.id === batchTargetLine) {
              updatedValues[getCellKey(row.partCode, col.id)] = 0;
              affectedCount++;
            }
          });
        }
      });
    }

    setEditMatrixValues(updatedValues);
    setIsEditing(true);
    setHasUnsavedChanges(true);
    setShowBatchModal(false);
    setSaveSuccessMsg(`ดำเนินการ Batch Update เสร็จสิ้น (${affectedCount} จุด) - กรุณากดบันทึกเพื่อยืนยัน`);
  };

  // Save All Changes to Database
  const handleSaveMatrix = () => {
    try {
      const currentConfigs = storageService.getLineConfigs();
      const updatedConfigs = currentConfigs.map(lineConfig => {
        const lineId = lineConfig.lineId;
        const newQuantities: Record<string, number> = { ...(lineConfig.installedPartQuantities || {}) };

        partMasters.forEach(pm => {
          const key = getCellKey(pm.partCode, lineId);
          if (editMatrixValues[key] !== undefined) {
            newQuantities[pm.partCode] = editMatrixValues[key];
          }
        });

        return {
          ...lineConfig,
          installedPartQuantities: newQuantities
        };
      });

      storageService.saveLineConfigs(updatedConfigs);
      storageService.addAuditLog(
        'CONFIGURATION',
        `Batch updated Fin Die Installed Quantities Matrix across ${partMasters.length} parts and 7 lines`,
        `อัปเดตตารางจำนวนติดตั้งชิ้นส่วนแม่พิมพ์แยกตามสายการผลิต (E1-E5) เรียบร้อยแล้ว`
      );

      setIsEditing(false);
      setHasUnsavedChanges(false);
      setSaveSuccessMsg(`บันทึกจำนวนติดตั้ง ${partMasters.length} รายการลงในฐานข้อมูลสำเร็จแล้ว`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
    }
  };

  // Delete Part
  const handleConfirmDelete = () => {
    if (!deleteTargetPart) return;
    try {
      storageService.deletePartMaster(deleteTargetPart.partCode);
      setSaveSuccessMsg(`ลบชิ้นส่วน ${deleteTargetPart.partName} (${deleteTargetPart.partCode}) เรียบร้อยแล้ว`);
      setDeleteTargetPart(null);
      loadData();
    } catch (err: any) {
      alert(`ลบไม่สำเร็จ: ${err.message}`);
    }
  };

  // Open Edit Modal for a row
  const handleOpenEditModalForRow = (row: typeof matrixRows[0]) => {
    const lifeStandards = storageService.getLifeStandards();
    const ls = lifeStandards.find(s => (s as any).partCode === row.partCode || s.configKey?.partCode === row.partCode || s.id === row.partCode);

    setEditingPartData({
      partCode: row.partCode,
      partName: row.partName,
      stage: row.stageName,
      drawingNo: row.drawingCode,
      material: row.material,
      maintenanceType: row.maintenanceType,
      installQty: {
        e1: row.quantities['E1'],
        e2: row.quantities['E2'],
        e3_1: row.quantities['E3-1'],
        e3_2: row.quantities['E3-2'],
        e3_3: row.quantities['E3-3'],
        e4: row.quantities['E4'],
        e5: row.quantities['E5'],
      },
      shotLifeCycle: {
        e1_pcm: (ls as any)?.shotLifeStandards?.['E1'] ? ((ls as any).shotLifeStandards['E1'] / 1_000_000) : 5.0,
        e2_gold: (ls as any)?.shotLifeStandards?.['E2'] ? ((ls as any).shotLifeStandards['E2'] / 1_000_000) : 5.0,
        e3_1_pcm: (ls as any)?.shotLifeStandards?.['E3-1'] ? ((ls as any).shotLifeStandards['E3-1'] / 1_000_000) : 5.0,
        e3_2_gold: (ls as any)?.shotLifeStandards?.['E3-2'] ? ((ls as any).shotLifeStandards['E3-2'] / 1_000_000) : 5.0,
        e3_3_gold: (ls as any)?.shotLifeStandards?.['E3-3'] ? ((ls as any).shotLifeStandards['E3-3'] / 1_000_000) : 5.0,
        e4_bare: (ls as any)?.shotLifeStandards?.['E4'] ? ((ls as any).shotLifeStandards['E4'] / 1_000_000) : 4.0,
        e5_bare: (ls as any)?.shotLifeStandards?.['E5'] ? ((ls as any).shotLifeStandards['E5'] / 1_000_000) : 4.0,
        lowerSpecScrapLimit: (ls as any)?.lowerSpecLimit || (ls as any)?.scrapLimit || '62.50'
      },
      regrindStandard: {
        perGrindMm: (ls as any)?.oneTimeRegrindMm || '0.05 mm',
        totalGrindMm: (ls as any)?.totalRegrindMm || '0.50',
        regrindCycles: (ls as any)?.maxRegrindCount || 10,
        note: (ls as any)?.specialNotes || (ls as any)?.notes || ''
      }
    });
    setShowAddEditModal(true);
  };

  // Export Matrix to Excel (.xlsx)
  const handleExportCsv = () => {
    exportInstallMatrixExcel(matrixRows, LINE_COLUMNS);
  };

  return (
    <div className="space-y-3.5 font-sans text-white animate-fadeIn pb-8">
      
      {/* Alert Banner for Success */}
      {saveSuccessMsg && (
        <div className="bg-[#111111] border border-[#00FF00] text-[#00FF00] px-3 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00FF00] flex-shrink-0" />
            <span className="text-xs font-mono font-bold">{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 pb-2 border-b border-[#333333]">
        <div className="flex items-center gap-2 flex-wrap font-mono">
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
                onClick={handleSaveMatrix}
                className="px-4 py-1.5 bg-[#00FF00] hover:bg-[#00dd00] text-black font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไข ({hasUnsavedChanges ? 'มีการเปลี่ยนแปลง' : 'พร้อมบันทึก'})</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] text-slate-300 border border-[#666666] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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



      {/* Search and Stage Selector Bar */}
      <div className="bg-[#111111] border border-[#666666] p-3 space-y-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Stage Dropdown Filter & Manager Button */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#666666] px-2.5 py-1 text-xs min-w-[200px]">
              <Layers className="w-3.5 h-3.5 text-[#00FF00]" />
              <select
                value={selectedStageFilter}
                onChange={e => setSelectedStageFilter(e.target.value)}
                className="bg-transparent text-[#00FF00] font-mono text-xs font-bold focus:outline-none cursor-pointer w-full"
              >
                <option value="ALL" className="bg-[#111111] text-white">ทุกสเตจ (All Stages)</option>
                {stageOptions.map(stage => (
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

          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อชิ้นส่วน หรือ Stage..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#1a1a1a] border border-[#666666] text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#00FF00]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00]"></span>
            <span>หัวตารางล็อกคงที่ (Locked Sticky Header)</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INDUSTRIAL DATA TABLE WITH LOCKED STICKY HEADER */}
      {/* ======================================================== */}
      <div className="bg-[#111111] border border-[#666666] shadow-xl overflow-hidden">
        {/* Scrollable Container with Sticky Table Headers */}
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-thin relative">
          <table 
            className="w-full text-left text-xs font-mono min-w-[1100px]" 
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            {/* Top Multi-Header Row (Locked at top) */}
            <thead>
              {/* Row 1 Header: Main Divisions (Sticky top-0) */}
              <tr className="text-white select-none">
                <th 
                  colSpan={3} 
                  className="sticky top-0 z-20 bg-[#444455] text-white font-black py-1.5 px-2 border-b border-r border-[#666666] text-left uppercase tracking-wider text-xs shadow-xs"
                >
                  1. PART IDENTIFICATION
                </th>
                <th 
                  colSpan={8} 
                  className="sticky top-0 z-20 bg-[#3a3a4a] text-[#00FF00] font-black py-1.5 px-2 border-b border-r border-[#666666] text-center uppercase tracking-wider text-xs shadow-xs"
                >
                  2. INSTALL QUANTITY BY LINE (EA)
                </th>
                <th 
                  colSpan={1} 
                  className="sticky top-0 z-20 bg-[#444455] text-[#FFCC00] font-black py-1.5 px-2 border-b border-[#666666] text-center uppercase tracking-wider text-xs shadow-xs w-24"
                >
                  3. ACTIONS
                </th>
              </tr>

              {/* Sub Columns Header: Row 2 (Sticky top-27px) */}
              <tr className="text-white font-bold text-xs select-none">
                {/* Col: No */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-12 text-center border-b border-r border-[#666666] bg-[#555566]">
                  No
                </th>

                {/* Col: Stage */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-36 text-center border-b border-r border-[#666666] bg-[#555566]">
                  Stage
                </th>

                {/* Col: Part Name */}
                <th className="sticky top-[27px] z-20 py-1 px-2 min-w-[220px] text-left border-b border-r border-[#666666] bg-[#555566]">
                  Part Name
                </th>

                {/* Col: E1 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E1</div>
                  <div className="text-[9px] text-slate-300 font-normal">Ø7 Slit</div>
                </th>

                {/* Col: E2 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E2</div>
                  <div className="text-[9px] text-slate-300 font-normal">Ø5 Slit</div>
                </th>

                {/* Col: E3-1 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E3-1</div>
                  <div className="text-[9px] text-slate-300 font-normal">Slit 3P</div>
                </th>

                {/* Col: E3-2 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E3-2</div>
                  <div className="text-[9px] text-slate-300 font-normal">WL+ 4P</div>
                </th>

                {/* Col: E3-3 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E3-3</div>
                  <div className="text-[9px] text-slate-300 font-normal">New Cor 4P</div>
                </th>

                {/* Col: E4 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E4</div>
                  <div className="text-[9px] text-slate-300 font-normal">Ø5 Slit</div>
                </th>

                {/* Col: E5 */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-16 text-center border-b border-r border-[#666666] bg-[#4a4a5a] text-[#00FF00]">
                  <div>E5</div>
                  <div className="text-[9px] text-slate-300 font-normal">Ø5 Slit</div>
                </th>

                {/* Col: Total */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-20 text-center bg-[#444455] text-[#FFCC00] font-bold border-b border-r border-[#666666]">
                  Total
                </th>

                {/* Col: Actions */}
                <th className="sticky top-[27px] z-20 py-1 px-2 w-24 text-center bg-[#4a4a5a] text-[#FFCC00] font-bold border-b border-[#666666]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Rows Body */}
            <tbody>
              {/* TOP INLINE ADD ROW (Direct Entry at Top of Table - No Popup) */}
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
                      {stageOptions.length > 0 ? (
                        stageOptions.map(stg => (
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
                    <input
                      type="text"
                      placeholder="Part Name (e.g. Louver Punch)"
                      value={newRowData.partName}
                      onChange={e => setNewRowData({ ...newRowData, partName: e.target.value })}
                      className="w-full bg-[#111111] text-white border border-[#00FF00] px-1.5 py-0.5 text-xs font-bold font-mono focus:outline-none"
                    />
                  </td>
                  {LINE_COLUMNS.map(col => (
                    <td key={col.id} className="py-1 px-1 border-r border-[#444444]">
                      <input
                        type="number"
                        min="0"
                        value={newRowData.quantities[col.id] || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setNewRowData({
                            ...newRowData,
                            quantities: {
                              ...newRowData.quantities,
                              [col.id]: val
                            }
                          });
                        }}
                        className="w-full bg-[#111111] text-center text-[#00FF00] border border-[#666666] py-0.5 text-xs font-mono font-bold"
                      />
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center text-[#FFCC00] font-bold border-r border-[#444444]">
                    {(Object.values(newRowData.quantities) as number[]).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0)}
                  </td>
                  <td className="py-1 px-2 text-center border-[#444444] bg-[#182818]">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={handleSaveNewRowInline}
                        className="px-2 py-0.5 bg-[#00FF00] hover:bg-[#00dd00] text-black font-bold text-[11px] rounded flex items-center gap-0.5 cursor-pointer shadow-sm"
                        title="บันทึกรายการใหม่"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>บันทึก</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingInline(false)}
                        className="p-1 bg-[#222222] hover:bg-[#333333] text-rose-400 rounded border border-[#666666] cursor-pointer"
                        title="ยกเลิก"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ======================================================== */}
              {filteredRows.length === 0 && !isAddingInline ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500 bg-[#161616] border-b border-[#666666]">
                    ไม่พบรายการชิ้นส่วนที่ตรงกับคำค้นหา "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr 
                      key={row.partCode} 
                      className="bg-[#1e1e1e] hover:bg-[#282828] transition-colors border-b border-[#444444]"
                    >
                      {/* Col 1: No */}
                      <td className="py-1 px-2 text-center text-slate-400 font-bold border-r border-[#444444]">
                        {row.no}
                      </td>

                      {/* Col 2: Stage */}
                      <td className="py-1 px-2 text-center border-r border-[#444444]">
                        <span className="inline-block px-1.5 py-0.2 text-[10px] font-bold border border-[#555555] bg-[#111111] text-slate-200 uppercase">
                          {row.stageName}
                        </span>
                      </td>

                      {/* Col 3: Part Name */}
                      <td className="py-1 px-2 text-left border-r border-[#444444]">
                        <div>
                          <span className="font-bold text-white text-xs uppercase hover:text-[#00FF00] transition-colors block">
                            {row.partName}
                          </span>
                        </div>
                      </td>

                      {/* Col 4 - 10: E1 to E5 Line Quantities */}
                      {LINE_COLUMNS.map(col => {
                        const qty = row.quantities[col.id] || 0;
                        return (
                          <td 
                            key={col.id} 
                            className="py-1 px-1.5 text-center border-r border-[#444444] font-mono"
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                max={9999}
                                value={qty === 0 ? '' : qty}
                                placeholder="-"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                                  handleCellChange(row.partCode, col.id, val);
                                }}
                                className={`w-full py-0.5 text-center text-xs font-bold border focus:outline-none ${
                                  qty > 0 
                                    ? 'bg-[#111111] text-[#00FF00] border-[#00FF00]' 
                                    : 'bg-[#1a1a1a] text-slate-500 border-[#555555]'
                                }`}
                              />
                            ) : (
                              <span className={`font-bold text-xs ${qty > 0 ? 'text-[#00FF00] font-black' : 'text-slate-500'}`}>
                                {qty > 0 ? qty : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Col 11: Row Total */}
                      <td className="py-1 px-2 text-center bg-[#181818] border-r border-[#444444]">
                        <span className={`text-xs font-black font-mono ${row.total > 0 ? 'text-[#FFCC00]' : 'text-slate-500'}`}>
                          {row.total > 0 ? row.total : 0}
                        </span>
                      </td>

                      {/* Col 12: Actions (Edit & Delete) */}
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModalForRow(row)}
                            className="p-1 bg-[#111111] hover:bg-[#333333] text-[#00FF00] border border-[#555555] hover:border-[#00FF00] transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลพาร์ท (Edit Part Details)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setDeleteTargetPart({
                              partCode: row.partCode,
                              partName: row.partName,
                              stage: row.stageName,
                              total: row.total
                            })}
                            className="p-1 bg-[#111111] hover:bg-[#2b000a] text-slate-400 hover:text-[#C40045] border border-[#555555] hover:border-[#C40045] transition-colors cursor-pointer"
                            title="ลบพาร์ทนี้ (Delete Part)"
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

            {/* Table Footer: Line Summary Totals (Sticky bottom) */}
            <tfoot>
              <tr className="bg-[#333344] text-white font-bold border-t-2 border-[#666666] text-xs select-none">
                <td colSpan={3} className="py-1.5 px-2 text-right font-black uppercase tracking-wider text-slate-200 border-r border-[#555555]">
                  TOTAL ACTIVE TOOLING PER LINE (EA):
                </td>
                {LINE_COLUMNS.map(col => (
                  <td key={col.id} className="py-1.5 px-2 text-center border-r border-[#555555] font-mono font-black text-[#00FF00] text-xs">
                    {formatShots(lineSubTotals[col.id] || 0)}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-center bg-[#282838] font-mono font-black text-[#FFCC00] text-xs border-r border-[#555555]">
                  {formatShots(grandTotalActiveTooling)}
                </td>
                <td className="py-1.5 px-2 text-center bg-[#282838] text-[10px] text-slate-400">
                  {filteredRows.length} พาร์ท
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* ======================================================== */}

      {/* 4. MODALS */}
      {/* ======================================================== */}
      
      <PartMasterModal
        isOpen={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingPartData(null);
        }}
        onSaved={() => {
          loadData();
        }}
        editItem={editingPartData}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteTargetPart}
        onClose={() => setDeleteTargetPart(null)}
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบชิ้นส่วน (Delete Part)"
        itemName={deleteTargetPart ? `${deleteTargetPart.partName} (${deleteTargetPart.partCode})` : "" }
        itemDetails={deleteTargetPart ? `Stage: ${deleteTargetPart.stage} | Total Installed: ${deleteTargetPart.total} EA` : "" }
        warningText="การลบพาร์ทจากหน้านี้ จะเป็นการลบออกจากฐานข้อมูล Part Master ทั้งหมดอย่างถาวร"
      />

      {/* Stage Grouping Management Modal */}
      <StageManagementModal
        isOpen={isStageManagerOpen}
        onClose={() => setIsStageManagerOpen(false)}
        onSave={loadData}
      />
    </div>
  );
};

