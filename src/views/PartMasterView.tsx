import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Sliders,
  Layers,
  Settings,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Factory,
  Info
} from 'lucide-react';
import { PartMaster, TubeSizeCompat, ProductionLineId, LINE_INFO_MAP } from '../types';
import { storageService } from '../services/storageService';
import { formatThb } from '../services/calculationService';
import { ResizableReorderableTable } from '../components/common/ResizableReorderableTable';

interface LineInstalledPartItem {
  partCode: string;
  installQty: number;
  displaySeq: number;
  isActive: boolean;
}

const PRODUCTION_LINES: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

// Preset 12-20 part templates for each line to ensure complete die setup per user requirement
const STANDARD_LINE_PARTS_PRESETS: Record<string, Array<{ partCode: string; installQty: number }>> = {
  'E1': [
    { partCode: 'P-BUCK-001', installQty: 180 },
    { partCode: 'P-IRON-001', installQty: 708 },
    { partCode: 'D-IRON-001', installQty: 708 },
    { partCode: 'P-LOUV-001', installQty: 708 },
    { partCode: 'D-LOUV-001', installQty: 708 },
    { partCode: 'P-REFL-001', installQty: 708 },
    { partCode: 'D-REFL-001', installQty: 708 },
    { partCode: 'P-SLIT-A07-OLD', installQty: 354 },
    { partCode: 'P-SLIT-B07-OLD', installQty: 354 },
    { partCode: 'D-SLIT-UP-07-OLD', installQty: 354 },
    { partCode: 'D-SLIT-DN-07-OLD', installQty: 354 },
    { partCode: 'B-ROW-SLIT-07', installQty: 118 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 },
    { partCode: 'D-SIDE-001', installQty: 2 }
  ],
  'E2': [
    { partCode: 'P-BUCK-001', installQty: 120 },
    { partCode: 'P-SLIT-05', installQty: 400 },
    { partCode: 'D-SLIT-A05-4R', installQty: 200 },
    { partCode: 'D-SLIT-B05-4R', installQty: 200 },
    { partCode: 'P-IRON-001', installQty: 600 },
    { partCode: 'D-IRON-001', installQty: 600 },
    { partCode: 'P-LOUV-001', installQty: 600 },
    { partCode: 'D-LOUV-001', installQty: 600 },
    { partCode: 'P-REFL-001', installQty: 600 },
    { partCode: 'D-REFL-001', installQty: 600 },
    { partCode: 'B-ROW-SLIT-05A', installQty: 100 },
    { partCode: 'B-ROW-SLIT-05B', installQty: 100 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 }
  ],
  'E3-1': [
    { partCode: 'P-BUCK-001', installQty: 160 },
    { partCode: 'P-SLIT-NEW-07', installQty: 450 },
    { partCode: 'D-SLIT-NEW-07', installQty: 450 },
    { partCode: 'P-IRON-001', installQty: 708 },
    { partCode: 'D-IRON-001', installQty: 708 },
    { partCode: 'P-LOUV-001', installQty: 708 },
    { partCode: 'D-LOUV-001', installQty: 708 },
    { partCode: 'P-REFL-001', installQty: 708 },
    { partCode: 'D-REFL-001', installQty: 708 },
    { partCode: 'B-ROW-SLIT-07', installQty: 118 },
    { partCode: 'B-ROW-SLIT-WL-4P', installQty: 118 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 },
    { partCode: 'D-SIDE-001', installQty: 2 }
  ],
  'E3-2': [
    { partCode: 'P-BUCK-001', installQty: 160 },
    { partCode: 'P-LOUV-WL-UP', installQty: 350 },
    { partCode: 'P-LOUV-WL-DN', installQty: 350 },
    { partCode: 'P-IRON-001', installQty: 708 },
    { partCode: 'D-IRON-001', installQty: 708 },
    { partCode: 'P-REFL-001', installQty: 708 },
    { partCode: 'D-REFL-001', installQty: 708 },
    { partCode: 'B-ROW-SLIT-WL-4P', installQty: 118 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 },
    { partCode: 'D-SIDE-001', installQty: 2 },
    { partCode: 'P-SLIT-NEW-07', installQty: 350 },
    { partCode: 'D-SLIT-NEW-07', installQty: 350 }
  ],
  'E3-3': [
    { partCode: 'P-BUCK-001', installQty: 160 },
    { partCode: 'P-SLIT-NEW-07', installQty: 350 },
    { partCode: 'D-SLIT-NEW-07', installQty: 350 },
    { partCode: 'P-IRON-001', installQty: 708 },
    { partCode: 'D-IRON-001', installQty: 708 },
    { partCode: 'P-LOUV-WL-UP', installQty: 350 },
    { partCode: 'P-LOUV-WL-DN', installQty: 350 },
    { partCode: 'P-REFL-001', installQty: 708 },
    { partCode: 'D-REFL-001', installQty: 708 },
    { partCode: 'B-ROW-SLIT-WL-4P', installQty: 118 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 },
    { partCode: 'D-SIDE-001', installQty: 2 }
  ],
  'E4': [
    { partCode: 'P-BUCK-001', installQty: 140 },
    { partCode: 'P-SLIT-05', installQty: 380 },
    { partCode: 'D-SLIT-A05-3R', installQty: 190 },
    { partCode: 'D-SLIT-B05-3R', installQty: 190 },
    { partCode: 'P-IRON-001', installQty: 570 },
    { partCode: 'D-IRON-001', installQty: 570 },
    { partCode: 'P-LOUV-001', installQty: 570 },
    { partCode: 'D-LOUV-001', installQty: 570 },
    { partCode: 'P-REFL-001', installQty: 570 },
    { partCode: 'D-REFL-001', installQty: 570 },
    { partCode: 'B-ROW-SLIT-05A', installQty: 95 },
    { partCode: 'B-ROW-SLIT-05B', installQty: 95 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 }
  ],
  'E5': [
    { partCode: 'P-BUCK-001', installQty: 140 },
    { partCode: 'P-SLIT-05', installQty: 380 },
    { partCode: 'D-SLIT-A05-3R', installQty: 190 },
    { partCode: 'D-SLIT-B05-3R', installQty: 190 },
    { partCode: 'P-IRON-001', installQty: 570 },
    { partCode: 'D-IRON-001', installQty: 570 },
    { partCode: 'P-LOUV-001', installQty: 570 },
    { partCode: 'D-LOUV-001', installQty: 570 },
    { partCode: 'P-REFL-001', installQty: 570 },
    { partCode: 'D-REFL-001', installQty: 570 },
    { partCode: 'B-ROW-SLIT-05A', installQty: 95 },
    { partCode: 'B-ROW-SLIT-05B', installQty: 95 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 }
  ],
  'E6': [
    { partCode: 'P-BUCK-001', installQty: 120 },
    { partCode: 'P-IRON-001', installQty: 708 },
    { partCode: 'D-IRON-001', installQty: 708 },
    { partCode: 'P-LOUV-001', installQty: 708 },
    { partCode: 'D-LOUV-001', installQty: 708 },
    { partCode: 'P-REFL-001', installQty: 708 },
    { partCode: 'D-REFL-001', installQty: 708 },
    { partCode: 'P-SLIT-A07-OLD', installQty: 354 },
    { partCode: 'P-SLIT-B07-OLD', installQty: 354 },
    { partCode: 'D-SLIT-UP-07-OLD', installQty: 354 },
    { partCode: 'D-SLIT-DN-07-OLD', installQty: 354 },
    { partCode: 'B-ROW-SLIT-07', installQty: 118 },
    { partCode: 'P-CUT-OFF-WL', installQty: 4 },
    { partCode: 'D-CUT-OFF-WL', installQty: 4 },
    { partCode: 'P-SIDE-001', installQty: 2 },
    { partCode: 'D-SIDE-001', installQty: 2 }
  ]
};

export const PartMasterView: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'CATALOG' | 'LINE_MAPPING'>('CATALOG');
  const [parts, setParts] = useState<PartMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'PUNCH' | 'DIE' | 'BLADE' | 'PIN' | 'CORNER_CUT' | 'CENTER_PUNCH' | 'OTHER' | 'ALL'>('ALL');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, Partial<PartMaster>>>({});
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPart, setNewPart] = useState<PartMaster>({
    partCode: '',
    partName: '',
    partNameTh: '',
    stageName: '',
    category: 'PUNCH',
    drawingNumber: '',
    unitCostThb: 0,
    tubeSizeCompat: 'BOTH'
  });

  // Line Installed Parts & Qty State
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>('E6');
  const [linePartsList, setLinePartsList] = useState<LineInstalledPartItem[]>([]);
  const [selectedAddPartCode, setSelectedAddPartCode] = useState<string>('');
  const [customInstallQty, setCustomInstallQty] = useState<number>(100);
  
  const [feedback, setFeedback] = useState<{type: 'success'|'error', message: string} | null>(null);

  const loadCatalogData = () => {
    setParts(storageService.getPartMasters());
  };

  const loadLinePartsData = (lineId: ProductionLineId) => {
    const lineMonitoring = storageService.getLineMonitoring(lineId);
    const lineConfigs = storageService.getLineConfigs();
    const activeCfg = lineConfigs.find(c => c.lineId === lineId && c.isActive) || lineConfigs.find(c => c.lineId === lineId);
    
    let items: LineInstalledPartItem[] = [];

    if (lineMonitoring && lineMonitoring.items && lineMonitoring.items.length > 0) {
      items = lineMonitoring.items.map((it, idx) => ({
        partCode: it.partCode,
        installQty: it.installQty || 1,
        displaySeq: idx + 1,
        isActive: it.isActive !== false
      }));
    } else if (activeCfg && activeCfg.installedPartQuantities && Object.keys(activeCfg.installedPartQuantities).length > 0) {
      items = Object.entries(activeCfg.installedPartQuantities).map(([code, qty], idx) => ({
        partCode: code,
        installQty: qty,
        displaySeq: idx + 1,
        isActive: true
      }));
    } else {
      // Load preset 12-20 parts
      const preset = STANDARD_LINE_PARTS_PRESETS[lineId] || STANDARD_LINE_PARTS_PRESETS['E6'];
      items = preset.map((p, idx) => ({
        partCode: p.partCode,
        installQty: p.installQty,
        displaySeq: idx + 1,
        isActive: true
      }));
    }

    setLinePartsList(items);
  };

  useEffect(() => {
    loadCatalogData();
    loadLinePartsData(selectedLineId);
    const unsub = storageService.subscribe(() => {
      loadCatalogData();
      loadLinePartsData(selectedLineId);
    });
    return () => unsub();
  }, [selectedLineId]);

  const handleSelectLine = (lineId: ProductionLineId) => {
    setSelectedLineId(lineId);
    loadLinePartsData(lineId);
  };

  const handleApplyPresetTemplate = () => {
    const preset = STANDARD_LINE_PARTS_PRESETS[selectedLineId] || STANDARD_LINE_PARTS_PRESETS['E6'];
    const items: LineInstalledPartItem[] = preset.map((p, idx) => ({
      partCode: p.partCode,
      installQty: p.installQty,
      displaySeq: idx + 1,
      isActive: true
    }));
    setLinePartsList(items);
    setFeedback({ type: 'success', message: `โหลดเทมเพลตมาตรฐาน ${items.length} รายการ สำหรับไลน์ ${selectedLineId} เรียบร้อยแล้ว (กดบันทึกเพื่อซิงค์ข้อมูลลง TV Dashboard)` });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddPartToLine = () => {
    if (!selectedAddPartCode) return;
    if (linePartsList.some(p => p.partCode === selectedAddPartCode)) {
      setFeedback({ type: 'error', message: `รหัสชิ้นส่วน ${selectedAddPartCode} มีอยู่ในรายการของไลน์นี้แล้ว` });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const newItem: LineInstalledPartItem = {
      partCode: selectedAddPartCode,
      installQty: customInstallQty > 0 ? customInstallQty : 100,
      displaySeq: linePartsList.length + 1,
      isActive: true
    };

    setLinePartsList(prev => [...prev, newItem]);
    setSelectedAddPartCode('');
    setFeedback({ type: 'success', message: `เพิ่ม ${selectedAddPartCode} (จำนวน ${newItem.installQty}) เข้าไลน์ ${selectedLineId} แล้ว` });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRemovePartFromLine = (partCode: string) => {
    setLinePartsList(prev => prev.filter(p => p.partCode !== partCode));
  };

  const handleLineQtyChange = (partCode: string, qty: number) => {
    setLinePartsList(prev => prev.map(p => p.partCode === partCode ? { ...p, installQty: Math.max(1, qty) } : p));
  };

  const handleLineActiveToggle = (partCode: string) => {
    setLinePartsList(prev => prev.map(p => p.partCode === partCode ? { ...p, isActive: !p.isActive } : p));
  };

  const handleMoveLineSeq = (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === linePartsList.length - 1)) return;
    const newList = [...linePartsList];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;

    // re-index displaySeq
    newList.forEach((item, idx) => {
      item.displaySeq = idx + 1;
    });

    setLinePartsList(newList);
  };

  const handleSaveLineInstalledParts = () => {
    const activeItems = linePartsList.filter(p => p.isActive && p.installQty > 0);
    const result = storageService.saveLineInstalledParts(selectedLineId, activeItems);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      loadLinePartsData(selectedLineId);
    } else {
      setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const filteredParts = parts.filter(p => {
    const matchesSearch = 
      p.partCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.partNameTh && p.partNameTh.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.drawingNumber && p.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    
    return matchesSearch && matchesCat;
  });

  const handleEditClick = () => {
    const initialEdits: Record<string, Partial<PartMaster>> = {};
    parts.forEach(p => {
      initialEdits[p.partCode] = { ...p };
    });
    setEditValues(initialEdits);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setEditValues({});
    setIsEditing(false);
  };

  const handleSaveMatrix = () => {
    const updatedParts = parts.map(p => {
      if (editValues[p.partCode]) {
        return { ...p, ...editValues[p.partCode] } as PartMaster;
      }
      return p;
    });
    
    updatedParts.forEach(p => storageService.savePartMaster(p));
    
    setFeedback({ type: 'success', message: 'Matrix changes saved successfully' });
    setTimeout(() => setFeedback(null), 3000);
    setIsEditing(false);
    loadCatalogData();
  };

  const handleValueChange = (partCode: string, field: keyof PartMaster, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [partCode]: {
        ...prev[partCode],
        [field]: value
      }
    }));
  };

  const handleDelete = (partCode: string) => {
    if (window.confirm(`Are you sure you want to delete ${partCode}?`)) {
      storageService.deletePartMaster(partCode);
      setFeedback({ type: 'success', message: `Deleted ${partCode}` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.partCode || !newPart.partName) {
      setFeedback({ type: 'error', message: 'Part Code and Name are required' });
      return;
    }
    
    if (parts.some(p => p.partCode === newPart.partCode)) {
      setFeedback({ type: 'error', message: `Part Code ${newPart.partCode} already exists` });
      return;
    }
    
    storageService.savePartMaster(newPart);
    setShowAddModal(false);
    setNewPart({
      partCode: '',
      partName: '',
      partNameTh: '',
      stageName: '',
      category: 'PUNCH',
      drawingNumber: '',
      unitCostThb: 0,
      tubeSizeCompat: 'BOTH'
    });
    setFeedback({ type: 'success', message: 'New part added successfully' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAutoAlignTubeSizes = () => {
    let updatedCount = 0;
    parts.forEach(p => {
      let expectedTube: 'Ø5' | 'Ø7' | 'Ø9.52' | 'BOTH' = 'BOTH';
      const code = p.partCode.toUpperCase();
      if (code.includes('-05') || code.includes('05')) {
        expectedTube = 'Ø5';
      } else if (code.includes('-07') || code.includes('07') || code.includes('WL') || code.includes('CORR')) {
        expectedTube = 'Ø7';
      } else if (p.category === 'PUNCH' || p.category === 'DIE') {
        if (code.includes('SLIT')) {
          expectedTube = code.includes('05') ? 'Ø5' : 'Ø7';
        }
      }

      if (p.tubeSizeCompat !== expectedTube && expectedTube !== 'BOTH') {
        p.tubeSizeCompat = expectedTube;
        storageService.savePartMaster(p);
        updatedCount++;
      }
    });

    setFeedback({ type: 'success', message: `ตั้งค่าขนาดท่อตรงตามสเปกไลน์อัตโนมัติสำเร็จ (${updatedCount} รายการได้รับการปรับปรุง)` });
    setTimeout(() => setFeedback(null), 4000);
    loadCatalogData();
  };

  const stats = {
    total: parts.length,
    punch: parts.filter(p => p.category === 'PUNCH').length,
    die: parts.filter(p => p.category === 'DIE').length,
    blade: parts.filter(p => p.category === 'BLADE').length,
    pin: parts.filter(p => p.category === 'PIN').length,
    corner: parts.filter(p => p.category === 'CORNER_CUT').length,
    center: parts.filter(p => p.category === 'CENTER_PUNCH').length,
    other: parts.filter(p => p.category === 'OTHER').length,
  };

  const spareStocks = storageService.getSpareStocks();

  return (
    <div className="space-y-6">
      {/* Sticky Header & Navigation Tabs */}
      <div className="sticky top-[130px] sm:top-[115px] z-20 space-y-4 pb-2 bg-slate-900/95 backdrop-blur-sm -mx-2 px-2">
        {/* Header Title Bar */}
        <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Fin Die Parts Master & Line Setup (เครื่องมือตั้งค่าชิ้นส่วนแม่พิมพ์)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-thai">
              จัดการฐานข้อมูลชิ้นส่วนหลัก และกำหนดรายการชิ้นส่วนติดตั้งพร้อมจำนวนสำหรับแต่ละสายผลิต (12-20 รายการต่อไลน์สำหรับ TV Dashboard)
            </p>
          </div>
          
          {/* Main Module Tabs Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveMainTab('CATALOG')}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'CATALOG'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>1. คลังชิ้นส่วนหลัก (Part Catalog)</span>
            </button>

            <button
              onClick={() => setActiveMainTab('LINE_MAPPING')}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeMainTab === 'LINE_MAPPING'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>2. ตั้งค่าชิ้นส่วนและจำนวนตามไลน์ E1-E6 (12-20 รายการ)</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`p-3 rounded flex items-center gap-2 text-sm font-bold ${
            feedback.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400' : 
            'bg-rose-950/80 border border-rose-800 text-rose-400'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Line & Tube Size Configuration Guide Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                  คำแนะนำการกำหนดชิ้นส่วนตามไลน์ (Line & Tube Size Configuration Guide)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 font-thai">
                  เพื่อป้องกันการใช้ชื่อซ้ำซ้อนระหว่างไลน์ และกำหนดขนาดท่อให้ตรงกับสเปกแม่พิมพ์:
                </p>
              </div>
            </div>
            
            <button
              onClick={handleAutoAlignTubeSizes}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md flex items-center gap-2 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>✨ จัดระเบียบและจับคู่ขนาดท่อตามสเปกไลน์อัตโนมัติ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-indigo-900/40 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-cyan-400 block mb-1">📌 ไลน์ท่อ Ø5 (E2, E4, E5)</span>
              <span className="text-slate-300">ใช้รหัสชิ้นส่วนลงท้ายด้วย <strong className="text-white">-05</strong> (เช่น P-SLIT-05, D-SLIT-A05-4R) กำหนดขนาดท่อเป็น <strong>Ø5</strong></span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-indigo-300 block mb-1">📌 ไลน์ท่อ Ø7 (E1, E3-1, E3-2, E3-3, E6)</span>
              <span className="text-slate-300">ใช้รหัสชิ้นส่วนลงท้ายด้วย <strong className="text-white">-07</strong> หรือ <strong className="text-white">WL</strong> (เช่น P-SLIT-NEW-07, P-LOUV-WL-UP) กำหนดขนาดท่อเป็น <strong>Ø7</strong></span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">📌 ชิ้นส่วนใช้ร่วมกัน (BOTH / Common)</span>
              <span className="text-slate-300">เช่น Punch/Die ทั่วไป (P-BUCK-001, P-IRON-001, D-IRON-001, P-LOUV-001) สามารถตั้งค่าเป็น <strong>BOTH</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: MASTER PART CATALOG */}
      {activeMainTab === 'CATALOG' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar for Catalog */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชิ้นส่วน / รหัส / ชื่อ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none w-full sm:w-64 font-mono"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancelClick} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors">
                    ยกเลิก (Cancel)
                  </button>
                  <button onClick={handleSaveMatrix} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors">
                    บันทึกทั้งหมด (Save Matrix)
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={handleEditClick} 
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
                  >
                    แก้ไขตาราง (Edit Matrix)
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)} 
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs shadow-lg shadow-cyan-900/50 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มชิ้นส่วนใหม่</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Category Quick Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: `ทั้งหมด (${stats.total})` },
              { id: 'PUNCH', label: `PUNCH (${stats.punch})` },
              { id: 'DIE', label: `DIE (${stats.die})` },
              { id: 'BLADE', label: `BLADE (${stats.blade})` },
              { id: 'PIN', label: `PIN (${stats.pin})` },
              { id: 'CORNER_CUT', label: `CORNER CUT (${stats.corner})` },
              { id: 'CENTER_PUNCH', label: `CENTER PUNCH (${stats.center})` },
              { id: 'OTHER', label: `OTHER (${stats.other})` }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors border ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Catalog Data Table */}
          <ResizableReorderableTable<PartMaster>
            data={filteredParts}
            keyExtractor={(item) => item.partCode}
            columns={[
              {
                id: 'partCode',
                label: 'PART CODE',
                width: 130,
                render: (p) => <span className="font-mono font-black text-cyan-300">{p.partCode}</span>
              },
              {
                id: 'partName',
                label: 'PART NAME (EN & THAI)',
                width: 220,
                render: (p) => isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={editValues[p.partCode]?.partName ?? p.partName}
                      onChange={(e) => handleValueChange(p.partCode, 'partName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-sans font-bold"
                      placeholder="English Name"
                    />
                    <input
                      type="text"
                      value={editValues[p.partCode]?.partNameTh ?? p.partNameTh ?? ''}
                      onChange={(e) => handleValueChange(p.partCode, 'partNameTh', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 font-thai"
                      placeholder="ชื่อภาษาไทย"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="font-sans font-bold text-slate-100">{p.partName}</div>
                    {p.partNameTh && <div className="text-xs text-slate-400 font-thai">{p.partNameTh}</div>}
                  </div>
                )
              },
              {
                id: 'category',
                label: 'CATEGORY',
                width: 120,
                render: (p) => isEditing ? (
                  <select
                    value={editValues[p.partCode]?.category ?? p.category}
                    onChange={(e) => handleValueChange(p.partCode, 'category', e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  >
                    <option value="PUNCH">PUNCH</option>
                    <option value="DIE">DIE</option>
                    <option value="BLADE">BLADE</option>
                    <option value="PIN">PIN</option>
                    <option value="CORNER_CUT">CORNER_CUT</option>
                    <option value="CENTER_PUNCH">CENTER_PUNCH</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                ) : (
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
                    p.category === 'PUNCH' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                    p.category === 'DIE' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                    p.category === 'BLADE' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {p.category}
                  </span>
                )
              },
              {
                id: 'stageName',
                label: 'STAGE NAME',
                width: 150,
                render: (p) => isEditing ? (
                  <input
                    type="text"
                    value={editValues[p.partCode]?.stageName ?? p.stageName ?? ''}
                    onChange={(e) => handleValueChange(p.partCode, 'stageName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    placeholder="Stage Name"
                  />
                ) : (
                  <span className="text-slate-300 text-xs font-mono">{p.stageName || '-'}</span>
                )
              },
              {
                id: 'drawingNumber',
                label: 'DRAWING NO.',
                width: 120,
                render: (p) => isEditing ? (
                  <input
                    type="text"
                    value={editValues[p.partCode]?.drawingNumber ?? p.drawingNumber ?? ''}
                    onChange={(e) => handleValueChange(p.partCode, 'drawingNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                    placeholder="Drawing No."
                  />
                ) : (
                  <span className="font-mono text-xs text-amber-300 font-semibold">{p.drawingNumber || '-'}</span>
                )
              },
              {
                id: 'tubeSizeCompat',
                label: 'TUBE SIZE',
                width: 100,
                render: (p) => isEditing ? (
                  <select
                    value={editValues[p.partCode]?.tubeSizeCompat ?? p.tubeSizeCompat}
                    onChange={(e) => handleValueChange(p.partCode, 'tubeSizeCompat', e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono font-bold"
                  >
                    <option value="Ø5">Ø5</option>
                    <option value="Ø7">Ø7</option>
                    <option value="Ø9.52">Ø9.52</option>
                    <option value="BOTH">BOTH</option>
                  </select>
                ) : (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {p.tubeSizeCompat}
                  </span>
                )
              },
              {
                id: 'unitCostThb',
                label: 'UNIT COST (THB)',
                width: 120,
                render: (p) => isEditing ? (
                  <input
                    type="number"
                    value={editValues[p.partCode]?.unitCostThb ?? p.unitCostThb ?? 0}
                    onChange={(e) => handleValueChange(p.partCode, 'unitCostThb', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-mono font-bold"
                  />
                ) : (
                  <span className="font-mono text-xs text-emerald-400 font-semibold">{formatThb(p.unitCostThb)}</span>
                )
              },
              {
                id: 'actions',
                label: 'ACTION',
                width: 80,
                render: (p) => (
                  <button
                    type="button"
                    onClick={() => handleDelete(p.partCode)}
                    disabled={isEditing}
                    className="p-1.5 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 transition-colors disabled:opacity-50"
                    title="Delete Part"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* TAB 2: LINE INSTALLED PARTS & QTY SETUP (12-20 ITEMS PER LINE) */}
      {activeMainTab === 'LINE_MAPPING' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Production Line Button Bar */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                  <Factory className="w-5 h-5 text-amber-400" />
                  <span>เลือกสายการผลิตเพื่อตั้งค่ารายการและจำนวนชิ้นส่วนติดตั้ง (Line Part Setup)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  กำหนดชิ้นส่วนสำหรับสายผลิต <span className="text-amber-300 font-bold font-mono">LINE {selectedLineId}</span> เพื่อให้แสดงผลใน TV Dashboard ครบถ้วน 12 - 20 รายการต่อไลน์
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyPresetTemplate}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
                  title="โหลดชุดชิ้นส่วนมาตรฐาน 12-20 รายการสำหรับไลน์นี้"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>✨ โหลดชุดมาตรฐาน 12-20 รายการ (Load Preset)</span>
                </button>
              </div>
            </div>

            {/* Line Selection Tabs */}
            <div className="flex flex-wrap gap-2">
              {PRODUCTION_LINES.map(lineId => {
                const info = LINE_INFO_MAP[lineId];
                const isSelected = selectedLineId === lineId;
                const displayLine = lineId.startsWith('E3-') ? 'E3' : lineId;

                return (
                  <button
                    key={lineId}
                    onClick={() => handleSelectLine(lineId)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg scale-105 ring-2 ring-amber-400/50'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span>{displayLine}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-slate-900 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {info?.shortTag || lineId} ({info?.tubeSize || 'Ø7'})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Add Part to Current Line Bar */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <span className="text-xs font-bold text-slate-300 font-mono whitespace-nowrap">เพิ่มชิ้นส่วนเข้าไลน์ {selectedLineId}:</span>
              <select
                value={selectedAddPartCode}
                onChange={e => setSelectedAddPartCode(e.target.value)}
                className="bg-slate-950 text-cyan-300 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 flex-1 max-w-md"
              >
                <option value="">-- เลือกชิ้นส่วนจาก Master Catalog --</option>
                {parts.map(p => (
                  <option key={p.partCode} value={p.partCode}>
                    [{p.partCode}] {p.partName} ({p.partNameTh || p.category})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-mono">จำนวน:</span>
                <input
                  type="number"
                  value={customInstallQty}
                  onChange={e => setCustomInstallQty(parseInt(e.target.value, 10) || 1)}
                  className="w-20 bg-transparent text-amber-300 font-bold text-xs font-mono focus:outline-none"
                  min="1"
                />
                <span className="text-[11px] text-slate-400 font-mono">EA</span>
              </div>
            </div>

            <button
              onClick={handleAddPartToLine}
              disabled={!selectedAddPartCode}
              className="w-full md:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเข้าไลน์ {selectedLineId}</span>
            </button>
          </div>

          {/* Line Installed Parts Matrix Table */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  รายการชิ้นส่วนที่ติดตั้งในไลน์ <span className="text-amber-300">{selectedLineId}</span> ({linePartsList.length} รายการที่กำหนด)
                </span>
              </div>
              
              <span className={`text-xs font-mono px-2.5 py-1 rounded font-bold ${
                linePartsList.length >= 12 && linePartsList.length <= 20
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {linePartsList.length >= 12 && linePartsList.length <= 20 
                  ? `✓ แสดงครบถ้วนตามเป้าหมาย (12-20 รายการ)` 
                  : `กำลังตั้งค่า (${linePartsList.length} รายการ)`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase">
                    <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                    <th className="py-2.5 px-3 text-center w-16">เปิดใช้</th>
                    <th className="py-2.5 px-3">รหัสชิ้นส่วน (PART CODE)</th>
                    <th className="py-2.5 px-3">ชื่อชิ้นส่วน (PART NAME)</th>
                    <th className="py-2.5 px-3">หมวดหมู่ & STAGE</th>
                    <th className="py-2.5 px-3 text-center">จำนวนติดตั้ง (INSTALLED QTY)</th>
                    <th className="py-2.5 px-3 text-center">คลังอะไหล่ (SPARE STOCK)</th>
                    <th className="py-2.5 px-3 text-center w-24">ลำดับ / จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {linePartsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 font-mono">
                        ยังไม่มีชิ้นส่วนที่กำหนดในไลน์นี้ กดปุ่ม "✨ โหลดชุดมาตรฐาน 12-20 รายการ" ด้านบนเพื่อเริ่มต้น
                      </td>
                    </tr>
                  ) : (
                    linePartsList.map((item, idx) => {
                      const master = parts.find(p => p.partCode === item.partCode);
                      const stock = spareStocks.find(s => s.partCode === item.partCode);
                      const availableStock = stock ? stock.currentStockQty : 0;

                      return (
                        <tr key={item.partCode} className={`hover:bg-slate-800/50 transition-colors ${!item.isActive ? 'opacity-40 bg-slate-950/40' : ''}`}>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.isActive}
                              onChange={() => handleLineActiveToggle(item.partCode)}
                              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                              title="เปิด/ปิดการแสดงผลในไลน์"
                            />
                          </td>

                          <td className="py-2.5 px-3 font-bold text-cyan-300">
                            {item.partCode}
                          </td>

                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-100">{master?.partName || item.partCode}</div>
                            {master?.partNameTh && <div className="text-[11px] text-slate-400 font-thai">{master.partNameTh}</div>}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {master?.stageName || master?.category || 'Fin Die Part'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-amber-500/50 rounded px-2.5 py-1">
                              <input
                                type="number"
                                value={item.installQty}
                                onChange={(e) => handleLineQtyChange(item.partCode, parseInt(e.target.value, 10) || 1)}
                                className="w-20 bg-transparent text-amber-300 font-bold text-xs text-center focus:outline-none"
                                min="1"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">ชิ้น</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              availableStock >= item.installQty
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : availableStock > 0
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {availableStock} EA (พร้อมใช้)
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleMoveLineSeq(idx, 'UP')}
                                disabled={idx === 0}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                                title="เลื่อนขึ้น"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveLineSeq(idx, 'DOWN')}
                                disabled={idx === linePartsList.length - 1}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                                title="เลื่อนลง"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemovePartFromLine(item.partCode)}
                                className="p-1 rounded bg-slate-800 hover:bg-red-950 text-rose-400 hover:text-red-300 ml-1"
                                title="ลบออก"
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

            {/* Bottom Save Action Bar */}
            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 font-mono">
                รวมทั้งหมด <span className="text-amber-300 font-bold">{linePartsList.filter(p => p.isActive).length}</span> รายการชิ้นส่วนพร้อมใช้งานสำหรับไลน์ <span className="text-cyan-300 font-bold">{selectedLineId}</span>
              </div>

              <button
                onClick={handleSaveLineInstalledParts}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all font-sans"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกและอัปเดตไปยัง TV Dashboard (Save & Apply to TV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Catalog Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Add New Tooling Part Master</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPart} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PART CODE *</label>
                  <input
                    type="text"
                    value={newPart.partCode}
                    onChange={e => setNewPart({ ...newPart, partCode: e.target.value.toUpperCase() })}
                    placeholder="รหัสชิ้นส่วน..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">CATEGORY *</label>
                  <select
                    value={newPart.category}
                    onChange={e => setNewPart({ ...newPart, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="PUNCH">PUNCH</option>
                    <option value="DIE">DIE</option>
                    <option value="BLADE">BLADE</option>
                    <option value="PIN">PIN</option>
                    <option value="CORNER_CUT">CORNER_CUT</option>
                    <option value="CENTER_PUNCH">CENTER_PUNCH</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">PART NAME (ENGLISH) *</label>
                <input
                  type="text"
                  value={newPart.partName}
                  onChange={e => setNewPart({ ...newPart, partName: e.target.value })}
                  placeholder="ชื่อภาษาอังกฤษ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-sans font-semibold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold font-thai">ชื่อชิ้นส่วนภาษาไทย (THAI NAME)</label>
                <input
                  type="text"
                  value={newPart.partNameTh || ''}
                  onChange={e => setNewPart({ ...newPart, partNameTh: e.target.value })}
                  placeholder="ชื่อภาษาไทย..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-thai focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">STAGE NAME</label>
                  <input
                    type="text"
                    value={newPart.stageName}
                    onChange={e => setNewPart({ ...newPart, stageName: e.target.value })}
                    placeholder="สเตจงาน..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">DRAWING NUMBER</label>
                  <input
                    type="text"
                    value={newPart.drawingNumber || ''}
                    onChange={e => setNewPart({ ...newPart, drawingNumber: e.target.value })}
                    placeholder="เลขที่แบบ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">UNIT COST (THB)</label>
                  <input
                    type="number"
                    value={newPart.unitCostThb}
                    onChange={e => setNewPart({ ...newPart, unitCostThb: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">TUBE COMPATIBILITY</label>
                  <select
                    value={newPart.tubeSizeCompat}
                    onChange={e => setNewPart({ ...newPart, tubeSizeCompat: e.target.value as TubeSizeCompat })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Ø5">Ø5</option>
                    <option value="Ø7">Ø7</option>
                    <option value="Ø9.52">Ø9.52</option>
                    <option value="BOTH">BOTH (All Tube Sizes)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-sans text-xs shadow-lg shadow-cyan-900/50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Part Master Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
