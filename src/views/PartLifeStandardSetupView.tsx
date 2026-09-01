import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
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
  Trash2
} from 'lucide-react';
import { PartLifeStandard, FinMaterial, TubeDiameter, FinType, ProductionLineId, LINE_INFO_MAP } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb, generateCompositeKey } from '../services/calculationService';
import { ResizableReorderableTable } from '../components/common/ResizableReorderableTable';

interface LineQuickFilter {
  id: string;
  label: string;
  subLabel: string;
  tube: string;
  material: string;
  finType: string;
  paths: string;
}

const LINE_QUICK_FILTERS: LineQuickFilter[] = [
  { id: 'ALL', label: 'ALL LINES', subLabel: 'ทุกสายการผลิต (E1-E6)', tube: 'ALL', material: 'ALL', finType: 'ALL', paths: '-' },
  { id: 'E1', label: 'E1', subLabel: 'Ø7 Slit, PCM', tube: 'Ø7', material: 'PCM', finType: 'Slit Old', paths: '4P (Pitch)' },
  { id: 'E2', label: 'E2', subLabel: 'Ø5 Slit, GOLD', tube: 'Ø5', material: 'GOLD', finType: 'Slit Old', paths: '4P (Pitch)' },
  { id: 'E3-1', label: 'E3-1', subLabel: 'Slit 3P, PCM', tube: 'Ø7', material: 'PCM', finType: 'New Slit', paths: '3P (Pitch)' },
  { id: 'E3-2', label: 'E3-2', subLabel: 'WL+ 4P, GOLD', tube: 'Ø7', material: 'GOLD', finType: 'Wide Louver', paths: '4P (Pitch)' },
  { id: 'E3-3', label: 'E3-3', subLabel: 'Corr 4P, GOLD', tube: 'Ø7', material: 'GOLD', finType: 'Corrugate', paths: '4P (Pitch)' },
  { id: 'E4', label: 'E4', subLabel: 'Ø5 Slit, BARE', tube: 'Ø5', material: 'BARE', finType: 'Slit Old', paths: '3P (Pitch)' },
  { id: 'E5', label: 'E5', subLabel: 'Ø5 Slit, BARE', tube: 'Ø5', material: 'BARE', finType: 'New Slit', paths: '3P (Pitch)' },
  { id: 'E6', label: 'E6', subLabel: 'Ø7 Louver, PCM', tube: 'Ø7', material: 'PCM', finType: 'Louver', paths: '3P (Pitch)' },
];

export const PartLifeStandardSetupView: React.FC = () => {
  const [standards, setStandards] = useState<PartLifeStandard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedTube, setSelectedTube] = useState<string>('ALL');
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  
  // Maps standard.id -> { field: value } (supports number, boolean, string)
  const [editValues, setEditValues] = useState<Record<string, Record<string, number | boolean | string>>>({});

  // New Standard Form State
  const [newStd, setNewStd] = useState({
    partName: '',
    partCode: '',
    stagePunchDie: '',
    lineId: 'ALL',
    material: 'PCM',
    tubeSize: 'Ø7',
    thicknessMm: 0.10,
    lifeLimitShots: 1500000,
    regrindDepthPerTime: 0.20,
    maxTotalGrindingLimit: 3.00,
    standardShimThickness: 0.20,
    disposeAfterUse: false,
    notes: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)'
  });

  const reload = () => {
    const data = storageService.getLifeStandards();
    setStandards(data);
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const handleEditClick = () => {
    const currentVals: Record<string, Record<string, number | boolean | string>> = {};
    standards.forEach(std => {
      currentVals[std.id] = {
        material: std.configKey?.material || 'PCM',
        tubeSize: std.configKey?.tubeSize || 'Ø7',
        lifeLimitShots: std.lifeLimitShots,
        regrindDepthPerTime: std.regrindDepthPerTime ?? (parseFloat(std.regrindStandard?.oneTimeRegrindMm || '0.20') || 0.20),
        maxTotalGrindingLimit: std.maxTotalGrindingLimit ?? std.regrindStandard?.totalRegrindMm ?? 3.00,
        standardShimThickness: std.standardShimThickness ?? 0.20,
        disposeAfterUse: !!std.regrindStandard?.disposeAfterUse,
        notes: std.notes || std.regrindStandard?.regrindIntervalNote || std.changeIntervalNotes || ''
      };
    });
    setEditValues(currentVals);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setEditValues({});
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    standards.forEach(std => {
      const updates = editValues[std.id];
      if (updates) {
        if (updates.material) {
          std.configKey.material = updates.material as any;
        }
        if (updates.tubeSize) {
          std.configKey.tubeSize = updates.tubeSize as any;
        }
        std.lifeLimitShots = updates.lifeLimitShots as number;
        std.regrindDepthPerTime = updates.regrindDepthPerTime as number;
        std.maxTotalGrindingLimit = updates.maxTotalGrindingLimit as number;
        std.standardShimThickness = updates.standardShimThickness as number;
        std.notes = (updates.notes as string) || '';
        
        if (std.regrindStandard) {
          std.regrindStandard.disposeAfterUse = updates.disposeAfterUse as boolean;
          std.regrindStandard.oneTimeRegrindMm = (std.regrindDepthPerTime || 0.20).toFixed(2);
          std.regrindStandard.totalRegrindMm = std.maxTotalGrindingLimit;
          std.regrindStandard.maxTotalGrindingLimit = std.maxTotalGrindingLimit;
          std.regrindStandard.regrindDepthPerTime = std.regrindDepthPerTime;
          std.regrindStandard.standardShimThickness = std.standardShimThickness;
          std.regrindStandard.regrindIntervalNote = std.notes;
        }
        
        std.updatedAt = new Date().toISOString();
        storageService.saveLifeStandard(std);
      }
    });
    setIsEditing(false);
    setSaveSuccessMsg('บันทึกการแก้ไขเกณฑ์มาตรฐานเรียบร้อยแล้ว (Matrix Saved Successfully)');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    reload();
  };

  const handleValueChange = (stdId: string, field: string, value: string | boolean | number) => {
    setEditValues(prev => {
      const current = prev[stdId] || {};
      let parsedVal: any = value;
      if (field === 'lifeLimitShots' || field === 'maxTotalGrindingLimit' || field === 'regrindDepthPerTime' || field === 'standardShimThickness') {
        parsedVal = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value) || 0) : value;
      }
      return {
        ...prev,
        [stdId]: {
          ...current,
          [field]: parsedVal
        }
      };
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStd.partName.trim() || !newStd.partCode.trim()) {
      alert('กรุณากรอก Part Name และ Part Code');
      return;
    }

    const newId = `STD-${newStd.material}-${newStd.partCode.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString().slice(-4)}`;
    const createdStandard: PartLifeStandard = {
      id: newId,
      configKey: {
        lineId: newStd.lineId,
        configurationId: `CFG-${newStd.lineId}-${newStd.material}`,
        dieCode: `FD-${newStd.lineId}`,
        finType: 'Slit (half)',
        material: newStd.material as any,
        thicknessMm: 0.10,
        tubeSize: newStd.tubeSize as any,
        partCode: newStd.partCode.trim(),
        position: 'ALL',
        effectiveDate: new Date().toISOString().substring(0, 10)
      },
      compositeKeyString: `${newStd.lineId}|${newStd.material}|0.10mm|${newStd.tubeSize}|${newStd.partCode}`,
      partName: newStd.partName.trim(),
      stagePunchDie: newStd.stagePunchDie.trim() || newStd.partName.trim(),
      lifeLimitShots: Number(newStd.lifeLimitShots) || 1500000,
      regrindDepthPerTime: Number(newStd.regrindDepthPerTime) || 0.20,
      maxTotalGrindingLimit: Number(newStd.maxTotalGrindingLimit) || 3.00,
      standardShimThickness: Number(newStd.standardShimThickness) || 0.20,
      notes: newStd.notes.trim(),
      regrindStandard: {
        oneTimeRegrindMm: (Number(newStd.regrindDepthPerTime) || 0.20).toFixed(2),
        totalRegrindMm: Number(newStd.maxTotalGrindingLimit) || 3.00,
        maxRegrindCount: 7,
        disposeAfterUse: newStd.disposeAfterUse,
        regrindIntervalNote: newStd.notes.trim()
      },
      createdBy: 'Die Engineer Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.saveLifeStandard(createdStandard);
    setShowAddModal(false);
    setSaveSuccessMsg(`เพิ่มเกณฑ์มาตรฐานสำหรับ ${newStd.partName} สำเร็จแล้ว`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    reload();
  };

  // Filter standards by Line, Search, Material, Tube
  const filtered = standards.filter(s => {
    const matchSearch = 
      s.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.configKey.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.stagePunchDie && s.stagePunchDie.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Line matching
    let matchLine = true;
    if (selectedLine !== 'ALL') {
      const lineOpt = LINE_QUICK_FILTERS.find(f => f.id === selectedLine);
      if (lineOpt) {
        // If standard has matching lineId or matches line's tube and material
        const stdLine = s.configKey?.lineId || 'ALL';
        const stdMat = (s.configKey?.material || '').toUpperCase();
        const stdTube = s.configKey?.tubeSize;

        if (stdLine === selectedLine) {
          matchLine = true;
        } else if (stdLine === 'ALL') {
          const matchTube = lineOpt.tube === 'ALL' || stdTube === lineOpt.tube;
          const matchMat = lineOpt.material === 'ALL' || stdMat.includes(lineOpt.material);
          matchLine = matchTube && matchMat;
        } else {
          matchLine = false;
        }
      }
    }

    const mat = (s.configKey.material || '').toUpperCase();
    const matchMat = 
      selectedMaterial === 'ALL' || 
      mat === selectedMaterial.toUpperCase() ||
      mat.includes(selectedMaterial.toUpperCase());

    const matchTube = selectedTube === 'ALL' || s.configKey.tubeSize === selectedTube;

    return matchSearch && matchLine && matchMat && matchTube;
  });

  const activeLineFilterObj = LINE_QUICK_FILTERS.find(f => f.id === selectedLine) || LINE_QUICK_FILTERS[0];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-900/90 border border-emerald-500 text-emerald-200 rounded-lg flex items-center justify-between shadow-xl animate-fadeIn text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-thai font-medium">{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sticky Header Section */}
      <div className="sticky top-[130px] sm:top-[115px] z-20 pb-1 bg-slate-900/95 backdrop-blur-sm -mx-2 px-2 space-y-3">
        {/* Header & Action Bar */}
        <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Fin Die Part Life Standard Matrix</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-thai">
              เกณฑ์อายุการใช้งานชิ้นส่วนแม่พิมพ์และพารามิเตอร์การเจียรตามมาตรฐานวัสดุ (PCM, BARE, GOLD ความหนา 0.1mm)
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชิ้นส่วน/รหัส..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none w-36 sm:w-44"
              />
            </div>
            
            {/* Material Filter */}
            <select 
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-thai font-bold"
            >
              <option value="ALL">All Materials (ทุกวัสดุ)</option>
              <option value="PCM">PCM (0.1mm)</option>
              <option value="BARE">BARE (0.1mm)</option>
              <option value="GOLD">GOLD (0.1mm)</option>
            </select>
            
            {/* Tube Filter */}
            <select 
              value={selectedTube}
              onChange={(e) => setSelectedTube(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-thai font-bold"
            >
              <option value="ALL">All Tubes (ท่อทั้งหมด)</option>
              <option value="Ø5">Ø5</option>
              <option value="Ø7">Ø7</option>
            </select>

            {/* Add New Standard Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Standard</span>
            </button>

            {/* Edit / Save Action */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleCancelClick} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveClick} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-lg shadow-emerald-950">
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Matrix</span>
                </button>
              </div>
            ) : (
              <button onClick={handleEditClick} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-lg shadow-cyan-950">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Matrix</span>
              </button>
            )}
          </div>
        </div>

        {/* Line Quick Selection Buttons (แถบเลือก Line เหมือนหน้า Line Die Specification) */}
        <div className="bg-[#0B1528] border border-slate-800 rounded-lg p-2 flex flex-wrap items-center gap-1.5 shadow-inner">
          <span className="text-[11px] font-mono font-bold text-slate-400 px-2 flex items-center gap-1">
            <Factory className="w-3.5 h-3.5 text-cyan-400" />
            <span>LINE:</span>
          </span>

          {LINE_QUICK_FILTERS.map(lf => {
            const isSelected = selectedLine === lf.id;
            return (
              <button
                key={lf.id}
                onClick={() => setSelectedLine(lf.id)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-extrabold scale-105 z-10'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                <span>{lf.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  ({lf.subLabel})
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Line Profile Banner */}
        {selectedLine !== 'ALL' && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300 font-mono">SELECTED LINE: {activeLineFilterObj.label}</span>
              <span className="text-slate-400">|</span>
              <span>Tube: <strong className="text-white font-mono">{activeLineFilterObj.tube}</strong></span>
              <span className="text-slate-400">|</span>
              <span>Material: <strong className="text-amber-300 font-mono">{activeLineFilterObj.material} (0.1mm)</strong></span>
              <span className="text-slate-400">|</span>
              <span>Fin Type: <strong className="text-slate-200">{activeLineFilterObj.finType}</strong></span>
              <span className="text-slate-400">|</span>
              <span>Paths: <strong className="text-slate-200">{activeLineFilterObj.paths}</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              พบ {filtered.length} รายการมาตรฐาน
            </div>
          </div>
        )}
      </div>

      {/* Main Matrix Table Container */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-700 p-4 shadow-lg">
        <ResizableReorderableTable<PartLifeStandard>
          data={filtered}
          keyExtractor={(s) => s.id}
          emptyMessage="ไม่พบข้อมูลเกณฑ์มาตรฐานอายุการใช้งานที่ตรงกับเงื่อนไขการค้นหา"
          columns={[
            {
              id: 'no',
              label: 'NO.',
              width: 55,
              minWidth: 45,
              align: 'center',
              render: (_, idx) => (
                <span className="text-cyan-400/80 font-mono font-bold text-xs">{idx + 1}</span>
              )
            },
            {
              id: 'part',
              label: 'STAGE / PART NAME',
              width: 200,
              minWidth: 150,
              render: (s) => (
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-100 truncate" title={s.partName}>{s.partName}</div>
                  <div className="text-[11px] text-cyan-400 font-mono">{s.configKey.partCode}</div>
                  <div className="text-[10px] text-slate-400 truncate">{s.stagePunchDie || s.partName}</div>
                </div>
              )
            },
            {
              id: 'material',
              label: 'MAT / THICK',
              width: 140,
              minWidth: 120,
              align: 'center',
              render: (s) => {
                const currentMat = (editValues[s.id]?.material as string) ?? s.configKey.material ?? 'PCM';
                
                if (isEditing) {
                  return (
                    <select
                      value={currentMat}
                      onChange={(e) => handleValueChange(s.id, 'material', e.target.value)}
                      className="bg-slate-900 border border-cyan-500/80 text-cyan-300 font-bold font-mono rounded px-2 py-1 text-xs focus:border-cyan-400 focus:outline-none w-full"
                    >
                      <option value="PCM">PCM (0.1mm)</option>
                      <option value="BARE">BARE (0.1mm)</option>
                      <option value="GOLD">GOLD (0.1mm)</option>
                    </select>
                  );
                }

                const mat = currentMat.toUpperCase();
                const isPcm = mat.includes('PCM');
                const isGold = mat.includes('GOLD');
                const isBare = mat.includes('BARE');
                const isHydro = mat.includes('HYDRO');
                const thick = s.configKey.thicknessMm ? `${s.configKey.thicknessMm}mm` : '0.1mm';

                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                    isPcm ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                    isGold ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    isBare ? 'bg-slate-500/25 text-slate-200 border border-slate-500/40' :
                    isHydro ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    'bg-slate-700 text-slate-200'
                  }`}>
                    <span>{isPcm ? 'PCM' : isGold ? 'GOLD' : isBare ? 'BARE' : isHydro ? 'HYDRO' : mat}</span>
                    <span className="opacity-75 text-[10px]">({thick})</span>
                  </span>
                );
              }
            },
            {
              id: 'tubeSize',
              label: 'TUBE',
              width: 80,
              minWidth: 60,
              align: 'center',
              render: (s) => {
                const currentTube = (editValues[s.id]?.tubeSize as string) ?? s.configKey.tubeSize ?? 'Ø7';
                if (isEditing) {
                  return (
                    <select
                      value={currentTube}
                      onChange={(e) => handleValueChange(s.id, 'tubeSize', e.target.value)}
                      className="bg-slate-900 border border-slate-600 text-cyan-300 font-bold font-mono rounded px-1.5 py-1 text-xs focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="Ø5">Ø5</option>
                      <option value="Ø7">Ø7</option>
                    </select>
                  );
                }
                return (
                  <span className="text-cyan-300 font-bold font-mono text-xs">
                    {currentTube}
                  </span>
                );
              }
            },
            {
              id: 'lifeLimitShots',
              label: 'LIFE LIMIT (SHOTS)',
              width: 145,
              minWidth: 110,
              align: 'right',
              render: (s) => isEditing ? (
                <input
                  type="number"
                  value={editValues[s.id]?.lifeLimitShots as number}
                  onChange={(e) => handleValueChange(s.id, 'lifeLimitShots', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              ) : (
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {formatShots(s.lifeLimitShots)}
                </span>
              )
            },
            {
              id: 'regrindDepth',
              label: '1 TIME / REGRIND (MM)',
              width: 135,
              minWidth: 95,
              align: 'right',
              render: (s) => isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editValues[s.id]?.regrindDepthPerTime as number}
                  onChange={(e) => handleValueChange(s.id, 'regrindDepthPerTime', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              ) : (
                <span className="font-mono text-slate-300 text-xs">
                  {(s.regrindDepthPerTime ?? (parseFloat(s.regrindStandard?.oneTimeRegrindMm || '0.20') || 0.20)).toFixed(2)}
                </span>
              )
            },
            {
              id: 'maxRegrind',
              label: 'MAX REGRIND (MM)',
              width: 130,
              minWidth: 90,
              align: 'right',
              render: (s) => isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  value={editValues[s.id]?.maxTotalGrindingLimit as number}
                  onChange={(e) => handleValueChange(s.id, 'maxTotalGrindingLimit', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              ) : (
                <span className="font-mono text-slate-300 text-xs">
                  {(s.maxTotalGrindingLimit ?? s.regrindStandard?.totalRegrindMm ?? 3.0).toFixed(2)}
                </span>
              )
            },
            {
              id: 'shimThickness',
              label: 'SHIM (MM)',
              width: 100,
              minWidth: 80,
              align: 'right',
              render: (s) => isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editValues[s.id]?.standardShimThickness as number}
                  onChange={(e) => handleValueChange(s.id, 'standardShimThickness', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-right text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              ) : (
                <span className="font-mono text-slate-300 text-xs">
                  {(s.standardShimThickness ?? 0.20).toFixed(2)}
                </span>
              )
            },
            {
              id: 'dispose',
              label: '1-USE (DISPOSE)',
              width: 100,
              minWidth: 80,
              align: 'center',
              render: (s) => isEditing ? (
                <input
                  type="checkbox"
                  checked={editValues[s.id]?.disposeAfterUse as boolean}
                  onChange={(e) => handleValueChange(s.id, 'disposeAfterUse', e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
              ) : (
                <span className={`text-[11px] font-bold ${s.regrindStandard?.disposeAfterUse ? 'text-rose-400' : 'text-slate-500'}`}>
                  {s.regrindStandard?.disposeAfterUse ? 'YES' : 'NO'}
                </span>
              )
            },
            {
              id: 'notes',
              label: 'NOTE / REMARK',
              width: 240,
              minWidth: 150,
              render: (s) => {
                const currentNote = (editValues[s.id]?.notes as string) ?? (s.notes || s.regrindStandard?.regrindIntervalNote || s.changeIntervalNotes || '');
                if (isEditing) {
                  return (
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => handleValueChange(s.id, 'notes', e.target.value)}
                      placeholder="ระบุหมายเหตุ..."
                      className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none font-thai"
                    />
                  );
                }
                return currentNote ? (
                  <span className="text-xs text-slate-300 font-thai line-clamp-2" title={currentNote}>
                    {currentNote}
                  </span>
                ) : (
                  <span className="text-xs text-slate-600 italic">-</span>
                );
              }
            }
          ]}
        />
      </div>

      {/* Modal: Add New Part Life Standard */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F172A] border border-slate-700 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">เพิ่มเกณฑ์มาตรฐานอายุการใช้งาน (Add Part Life Standard)</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 font-thai text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Part Code (รหัสชิ้นส่วน) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุรหัสอะไหล่..."
                    value={newStd.partCode}
                    onChange={e => setNewStd({ ...newStd, partCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Part Name (ชื่อชิ้นส่วน) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่ออะไหล่..."
                    value={newStd.partName}
                    onChange={e => setNewStd({ ...newStd, partName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Line (สายการผลิต)</label>
                  <select
                    value={newStd.lineId}
                    onChange={e => setNewStd({ ...newStd, lineId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="ALL">ALL (ทุกไลน์)</option>
                    <option value="E1">E1 (Ø7 Slit, PCM)</option>
                    <option value="E2">E2 (Ø5 Slit, GOLD)</option>
                    <option value="E3-1">E3-1 (Slit 3P, PCM)</option>
                    <option value="E3-2">E3-2 (WL+ 4P, GOLD)</option>
                    <option value="E3-3">E3-3 (Corr 4P, GOLD)</option>
                    <option value="E4">E4 (Ø5 Slit, BARE)</option>
                    <option value="E5">E5 (Ø5 Slit, BARE)</option>
                    <option value="E6">E6 (Ø7 Louver, PCM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Material (ประเภทวัสดุ)</label>
                  <select
                    value={newStd.material}
                    onChange={e => setNewStd({ ...newStd, material: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="PCM">PCM (0.1mm)</option>
                    <option value="BARE">BARE (0.1mm)</option>
                    <option value="GOLD">GOLD (0.1mm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tube Size (ขนาดท่อ)</label>
                  <select
                    value={newStd.tubeSize}
                    onChange={e => setNewStd({ ...newStd, tubeSize: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Ø7">Ø7</option>
                    <option value="Ø5">Ø5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Life Limit (Shots เกณฑ์อายุ)</label>
                  <input
                    type="number"
                    step="100000"
                    value={newStd.lifeLimitShots}
                    onChange={e => setNewStd({ ...newStd, lifeLimitShots: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">1 Time Regrind (mm/ครั้ง)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStd.regrindDepthPerTime}
                    onChange={e => setNewStd({ ...newStd, regrindDepthPerTime: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Regrind Limit (mm รวม)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStd.maxTotalGrindingLimit}
                    onChange={e => setNewStd({ ...newStd, maxTotalGrindingLimit: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Note / Remark (หมายเหตุ / ความถี่เปลี่ยน)</label>
                <input
                  type="text"
                  placeholder="ระบุหมายเหตุ/ข้อกำหนด..."
                  value={newStd.notes}
                  onChange={e => setNewStd({ ...newStd, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-dispose"
                  checked={newStd.disposeAfterUse}
                  onChange={e => setNewStd({ ...newStd, disposeAfterUse: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="chk-dispose" className="text-xs text-slate-300 cursor-pointer">
                  Single Use / Dispose after use (ชิ้นส่วนใช้ครั้งเดียวทิ้ง ไม่นำกลับมาเจียร)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-extrabold transition-colors shadow-lg shadow-cyan-950 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกเพิ่มเกณฑ์มาตรฐาน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const InstallQuantitySetupView: React.FC = () => {
  const [lines, setLines] = useState<any[]>([]);
  const [partMasters, setPartMasters] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const loadAll = () => {
      setLines(storageService.getLineConfigs());
      setPartMasters(storageService.getPartMasters());
    };
    loadAll();
    const unsub = storageService.subscribe(loadAll);
    return () => unsub();
  }, []);

  const lineIds = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  interface InstallMatrixRow {
    no: number;
    part: string;
    code: string;
    total: number;
    [key: string]: string | number;
  }

  // Dynamically build matrix from part masters
  const matrixParts = partMasters.map((pm, index) => ({
    no: index + 1,
    part: pm.partName,
    code: pm.partCode
  }));

  const getCellKey = (partCode: string, lineId: string) => `${partCode}_${lineId}`;

  const installMatrix: InstallMatrixRow[] = matrixParts.map(mp => {
    const row: InstallMatrixRow = { ...mp, total: 0 };
    let total = 0;
    lineIds.forEach(lId => {
      let qty = 0;
      const lineConfig = lines.find(l => l.lineId === lId);
      if (lineConfig && lineConfig.installedPartQuantities) {
        qty = lineConfig.installedPartQuantities[mp.code] || 0;
      }
      // If we are editing, use editValues if it exists
      if (isEditing) {
        qty = editValues[getCellKey(mp.code, lId)] !== undefined ? editValues[getCellKey(mp.code, lId)] : qty;
      }
      row[lId] = qty;
      total += qty;
    });
    row.total = total;
    return row;
  });

  const grandTotal = installMatrix.reduce((sum, item) => sum + item.total, 0);

  const handleEditClick = () => {
    // Populate edit state
    const currentValues: Record<string, number> = {};
    matrixParts.forEach(mp => {
      lineIds.forEach(lId => {
        const lineConfig = lines.find(l => l.lineId === lId);
        if (lineConfig && lineConfig.installedPartQuantities) {
          currentValues[getCellKey(mp.code, lId)] = lineConfig.installedPartQuantities[mp.code] || 0;
        }
      });
    });
    setEditValues(currentValues);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // Build updates array
    const updates = Object.keys(editValues).map(key => {
      const [partCode, lineId] = key.split('_');
      return { lineId, partCode, installQty: editValues[key] };
    });
    
    // Save via storage service
    storageService.updateInstallQuantities(updates);
    
    // Reload local state
    setLines(storageService.getLineConfigs());
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditValues({});
    setIsEditing(false);
  };

  const handleCellValueChange = (partCode: string, lineId: string, value: string) => {
    const num = parseInt(value, 10);
    setEditValues(prev => ({
      ...prev,
      [getCellKey(partCode, lineId)]: isNaN(num) ? 0 : num
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header Container */}
      <div className="sticky top-[130px] sm:top-[115px] z-20 pb-2 bg-slate-900/95 backdrop-blur-sm -mx-2 px-2">
        <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Fin Die Installed Part Quantity Matrix
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-thai">
              ตารางจำนวนชิ้นส่วนที่ติดตั้งในแม่พิมพ์แต่ละสายการผลิต (สามารถแก้ไขจำนวนติดตั้งต่อไลน์ได้)
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#1E293B] px-4 py-2 rounded border border-slate-700 font-mono text-right">
              <div className="text-[10px] text-slate-400 font-bold">TOTAL ACTIVE TOOLING</div>
              <div className="text-base font-bold text-cyan-300">{grandTotal.toLocaleString()} EA (All Lines)</div>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleCancelClick} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveClick} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-bold transition-colors">
                  Save Matrix
                </button>
              </div>
            ) : (
              <button onClick={handleEditClick} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold transition-colors">
                Edit Matrix
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
        <ResizableReorderableTable
          data={installMatrix}
          keyExtractor={(row) => row.no.toString()}
          emptyMessage="ไม่พบข้อมูล Install Matrix"
          columns={[
            {
              id: 'no',
              label: 'NO.',
              width: 55,
              minWidth: 45,
              align: 'center',
              render: (row) => <span className="text-cyan-400/80 font-mono font-bold text-xs">{row.no}</span>
            },
            {
              id: 'part',
              label: 'STAGE PUNCH / DIE',
              width: 180,
              render: (row) => <span className="font-semibold text-slate-100">{row.part}</span>
            },
            {
              id: 'code',
              label: 'PART CODE',
              width: 110,
              render: (row) => <span className="text-slate-400 font-mono">{row.code}</span>
            },
            ...lineIds.map(lId => ({
              id: lId,
              label: lId.startsWith('E3-') ? `E3 (${LINE_INFO_MAP[lId]?.shortTag || lId})` : lId,
              width: 85,
              align: 'center' as const,
              render: (row: any) => (
                isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={row[lId]}
                    onChange={(e) => handleCellValueChange(row.code, lId, e.target.value)}
                    className="w-14 sm:w-16 bg-slate-900 border border-slate-600 rounded px-1 py-1 text-center text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                ) : (
                  <span className="text-slate-300 font-mono">{row[lId]}</span>
                )
              )
            })),
            {
              id: 'total',
              label: 'TOTAL (EA)',
              width: 110,
              align: 'right',
              render: (row) => <span className="font-black text-emerald-400 font-mono">{row.total.toLocaleString()}</span>
            }
          ]}
        />
      </div>
    </div>
  );
};
