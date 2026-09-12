import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Layers, 
  Tag, 
  Factory, 
  Gauge, 
  Wrench, 
  ShieldCheck, 
  AlertCircle,
  Database,
  Sliders
} from 'lucide-react';
import { PartMaster, PartLifeStandard, LineActiveConfiguration, ProductionLineId } from '../../types';
import { storageService } from '../../services/storageService';

interface PartMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: {
    partCode: string;
    partName: string;
    stage: string;
    drawingNo?: string;
    material?: string;
    maintenanceType?: 'REGRIND' | 'DISPOSE';
    installQty?: {
      e1?: number;
      e2?: number;
      e3_1?: number;
      e3_2?: number;
      e3_3?: number;
      e4?: number;
      e5?: number;
    };
    shotLifeCycle?: {
      e1_pcm?: number;
      e2_gold?: number;
      e3_1_pcm?: number;
      e3_2_gold?: number;
      e3_3_gold?: number;
      e4_bare?: number;
      e5_bare?: number;
      lowerSpecScrapLimit?: string | number;
    };
    regrindStandard?: {
      perGrindMm?: string;
      totalGrindMm?: string | number;
      regrindCycles?: number | string;
      note?: string;
    };
  } | null;
  onSaved?: (savedCode: string) => void;
  availableStages?: string[];
}

export const PartMasterModal: React.FC<PartMasterModalProps> = ({
  isOpen,
  onClose,
  editItem,
  onSaved,
  availableStages = []
}) => {
  const isEditMode = !!editItem;

  // Form State
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partNameTh, setPartNameTh] = useState('');
  const [stageName, setStageName] = useState('PIERCE');
  const [customStage, setCustomStage] = useState('');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [material, setMaterial] = useState('SKD11');
  const [maintenanceType, setMaintenanceType] = useState<'REGRIND' | 'DISPOSE'>('REGRIND');

  // Shot Life Standards (in Millions)
  const [lifeE1, setLifeE1] = useState<number | string>(5.0);
  const [lifeE2, setLifeE2] = useState<number | string>(5.0);
  const [lifeE3_1, setLifeE3_1] = useState<number | string>(5.0);
  const [lifeE3_2, setLifeE3_2] = useState<number | string>(5.0);
  const [lifeE3_3, setLifeE3_3] = useState<number | string>(5.0);
  const [lifeE4, setLifeE4] = useState<number | string>(4.0);
  const [lifeE5, setLifeE5] = useState<number | string>(4.0);
  const [scrapLimit, setScrapLimit] = useState<string>('62.50');

  // Regrind Specs
  const [perGrindMm, setPerGrindMm] = useState<string>('0.05 mm');
  const [totalGrindMm, setTotalGrindMm] = useState<string>('0.50');
  const [regrindCycles, setRegrindCycles] = useState<number | string>(10);
  const [regrindNote, setRegrindNote] = useState<string>('ลับคมตามระยะมาตรฐาน');

  // Install Quantities per line
  const [qtyE1, setQtyE1] = useState<number>(0);
  const [qtyE2, setQtyE2] = useState<number>(0);
  const [qtyE3_1, setQtyE3_1] = useState<number>(0);
  const [qtyE3_2, setQtyE3_2] = useState<number>(0);
  const [qtyE3_3, setQtyE3_3] = useState<number>(0);
  const [qtyE4, setQtyE4] = useState<number>(0);
  const [qtyE5, setQtyE5] = useState<number>(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    if (editItem) {
      setPartCode(editItem.partCode || '');
      setPartName(editItem.partName || '');
      setPartNameTh((editItem as any).partNameTh || editItem.partName || '');
      setStageName(editItem.stage || 'PIERCE');
      setDrawingNumber(editItem.drawingNo || '');
      setMaterial(editItem.material || 'SKD11');
      setMaintenanceType(editItem.maintenanceType || (editItem.regrindStandard?.perGrindMm?.includes('Dispose') ? 'DISPOSE' : 'REGRIND'));

      // Shot Life
      if (editItem.shotLifeCycle) {
        setLifeE1(editItem.shotLifeCycle.e1_pcm ?? 5.0);
        setLifeE2(editItem.shotLifeCycle.e2_gold ?? 5.0);
        setLifeE3_1(editItem.shotLifeCycle.e3_1_pcm ?? 5.0);
        setLifeE3_2(editItem.shotLifeCycle.e3_2_gold ?? 5.0);
        setLifeE3_3(editItem.shotLifeCycle.e3_3_gold ?? 5.0);
        setLifeE4(editItem.shotLifeCycle.e4_bare ?? 4.0);
        setLifeE5(editItem.shotLifeCycle.e5_bare ?? 4.0);
        setScrapLimit(String(editItem.shotLifeCycle.lowerSpecScrapLimit ?? '62.50'));
      }

      // Regrind
      if (editItem.regrindStandard) {
        setPerGrindMm(editItem.regrindStandard.perGrindMm || '0.05 mm');
        setTotalGrindMm(String(editItem.regrindStandard.totalGrindMm || '0.50'));
        setRegrindCycles(editItem.regrindStandard.regrindCycles ?? 10);
        setRegrindNote(editItem.regrindStandard.note || 'ลับคมตามระยะมาตรฐาน');
      }

      // Quantities
      if (editItem.installQty) {
        setQtyE1(editItem.installQty.e1 || 0);
        setQtyE2(editItem.installQty.e2 || 0);
        setQtyE3_1(editItem.installQty.e3_1 || 0);
        setQtyE3_2(editItem.installQty.e3_2 || 0);
        setQtyE3_3(editItem.installQty.e3_3 || 0);
        setQtyE4(editItem.installQty.e4 || 0);
        setQtyE5(editItem.installQty.e5 || 0);
      }
    } else {
      // New Part defaults
      setPartCode(`FD-PRT-${Date.now().toString().slice(-4)}`);
      setPartName('');
      setPartNameTh('');
      setStageName(availableStages[0] || 'Piercing Punch');
      setDrawingNumber('');
      setMaterial('SKD11');
      setMaintenanceType('REGRIND');

      setLifeE1(5.0);
      setLifeE2(5.0);
      setLifeE3_1(5.0);
      setLifeE3_2(5.0);
      setLifeE3_3(5.0);
      setLifeE4(4.0);
      setLifeE5(4.0);
      setScrapLimit('62.50');

      setPerGrindMm('0.05 mm');
      setTotalGrindMm('0.50');
      setRegrindCycles(10);
      setRegrindNote('ลับคมตามระยะมาตรฐาน');

      setQtyE1(0);
      setQtyE2(0);
      setQtyE3_1(0);
      setQtyE3_2(0);
      setQtyE3_3(0);
      setQtyE4(0);
      setQtyE5(0);
    }
    setErrorMsg(null);
  }, [isOpen, editItem, availableStages]);

  if (!isOpen) return null;

  const totalInstalled = qtyE1 + qtyE2 + qtyE3_1 + qtyE3_2 + qtyE3_3 + qtyE4 + qtyE5;

  const handleSave = () => {
    if (!partCode.trim()) {
      setErrorMsg('กรุณากรอกรหัสชิ้นส่วน (Part Code)');
      return;
    }
    if (!partName.trim()) {
      setErrorMsg('กรุณากรอกชื่อชิ้นส่วน (Part Name)');
      return;
    }

    const finalStage = stageName === '__NEW__' ? (customStage.trim() || 'General') : stageName;

    try {
      // 1. Save Part Master
      const partMasterRecord: PartMaster = {
        partCode: partCode.trim(),
        partName: partName.trim(),
        partNameTh: partNameTh.trim() || partName.trim(),
        stageName: finalStage,
        category: partName.toUpperCase().includes('DIE') ? 'DIE' : 'PUNCH',
        drawingNumber: drawingNumber.trim() || partCode.trim(),
        unit: 'PCS',
        unitCostThb: 1500,
        tubeSizeCompat: 'BOTH',
        material: material,
        maintenanceType: maintenanceType,
      } as any;

      storageService.savePartMaster(partMasterRecord);

      // 2. Save / Update Life Standard
      const existingStds = storageService.getLifeStandards();
      const stdIdx = existingStds.findIndex(s => (s as any).partCode === partCode || s.configKey?.partCode === partCode || s.id === partCode);
      const isDispose = maintenanceType === 'DISPOSE';

      const toShots = (val: any) => {
        const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
        if (n <= 0) return 5000000;
        if (n >= 10000) return Math.round(n);
        return Math.round(n * 1_000_000);
      };

      const lifeStdRecord: PartLifeStandard = {
        id: partCode.trim(),
        partCode: partCode.trim(),
        partName: partName.trim(),
        stagePunchDie: finalStage,
        configKey: {
          partCode: partCode.trim(),
          material: 'PCM',
          tubeSize: 'Ø7',
          finType: 'Slit Old',
          thicknessMm: 0.10,
          productionLine: 'E1'
        },
        lifeLimitShots: toShots(lifeE1 || 5.0),
        regrindDepthPerTime: isDispose ? 0 : parseFloat(perGrindMm) || 0.05,
        maxTotalGrindingLimit: isDispose ? 0 : parseFloat(totalGrindMm) || 0.50,
        standardShimThickness: 0.20,
        disposeAfterUse: isDispose,
        notes: regrindNote,
        // Detailed specifications
        oneTimeRegrindMm: isDispose ? 'Dispose' : perGrindMm,
        totalRegrindMm: isDispose ? '-' : totalGrindMm,
        maxRegrindCount: isDispose ? 'Dispose' : Number(regrindCycles) || 10,
        scrapLimit: scrapLimit,
        shotLifeStandards: {
          'E1': toShots(lifeE1 || 5.0),
          'E2': toShots(lifeE2 || 5.0),
          'E3-1': toShots(lifeE3_1 || 5.0),
          'E3-2': toShots(lifeE3_2 || 5.0),
          'E3-3': toShots(lifeE3_3 || 5.0),
          'E4': toShots(lifeE4 || 4.0),
          'E5': toShots(lifeE5 || 4.0),
        }
      } as any;

      if (stdIdx >= 0) {
        existingStds[stdIdx] = lifeStdRecord;
      } else {
        existingStds.push(lifeStdRecord);
      }
      storageService.saveLifeStandards(existingStds);

      // 3. Update Line Configs for Installed Quantities
      const configs = storageService.getLineConfigs();
      const qtyByLineMap: Record<string, number> = {
        'E1': qtyE1,
        'E2': qtyE2,
        'E3-1': qtyE3_1,
        'E3-2': qtyE3_2,
        'E3-3': qtyE3_3,
        'E4': qtyE4,
        'E5': qtyE5,
      };

      const updatedConfigs = configs.map(cfg => {
        const lineQty = qtyByLineMap[cfg.lineId] || 0;
        const currentQtyMap = { ...(cfg.installedPartQuantities || {}) };
        currentQtyMap[partCode.trim()] = lineQty;
        return {
          ...cfg,
          installedPartQuantities: currentQtyMap
        };
      });
      storageService.saveLineConfigs(updatedConfigs);

      if (onSaved) {
        onSaved(partCode.trim());
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-[#111111] border border-[#666666] w-full max-w-3xl shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden text-white font-sans">
        
        {/* Modal Header */}
        <div className="bg-[#1a1a1a] border-b border-[#666666] p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#111111] border border-[#00FF00] flex items-center justify-center text-[#00FF00]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{isEditMode ? 'แก้ไขข้อมูลชิ้นส่วนแม่พิมพ์ (EDIT PART MASTER)' : 'เพิ่มรายการชิ้นส่วนแม่พิมพ์ใหม่ (ADD PART MASTER)'}</span>
                {isEditMode && <span className="text-xs font-mono text-[#00FF00] border border-[#666666] px-1.5 py-0.2 bg-[#111111]">{partCode}</span>}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                กำหนดคุณลักษณะ สเปกอายุการใช้งาน (Shot Cycle Standards) และจำนวนติดตั้งแยกสายการผลิต
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-[#222222] border border-transparent hover:border-[#666666] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs font-mono">
          
          {errorMsg && (
            <div className="bg-rose-950/40 border border-[#C40045] text-rose-300 p-2.5 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-[#C40045] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Part Identification */}
          <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-3">
            <div className="text-[#00FF00] font-bold flex items-center justify-between border-b border-[#333333] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span className="uppercase">1. ข้อมูลระบุชิ้นส่วน (PART IDENTIFICATION & SPEC)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">จำเป็นต้องระบุ Part Code & Name</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  PART CODE <span className="text-[#C40045]">*</span>:
                </label>
                <input
                  type="text"
                  value={partCode}
                  disabled={isEditMode}
                  onChange={e => setPartCode(e.target.value.toUpperCase())}
                  placeholder="เช่น PUNCH-01, DIE-05"
                  className={`w-full bg-[#111111] border px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                    isEditMode ? 'border-[#444444] text-slate-400 cursor-not-allowed' : 'border-[#666666] focus:border-[#00FF00]'
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  PART NAME (ชื่อชิ้นส่วน) <span className="text-[#C40045]">*</span>:
                </label>
                <input
                  type="text"
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  placeholder="เช่น Burring Punch Ø7"
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF00]"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  DRAWING / SPEC NO (รหัสแบบ):
                </label>
                <input
                  type="text"
                  value={drawingNumber}
                  onChange={e => setDrawingNumber(e.target.value)}
                  placeholder="เช่น DWG-FD-701"
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  STAGE GROUP (สเตจ):
                </label>
                <select
                  value={stageName}
                  onChange={e => setStageName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-[#00FF00] font-bold focus:outline-none focus:border-[#00FF00] cursor-pointer"
                >
                  {Array.from(new Set([
                    'PIERCE & BURRING',
                    'IRONING',
                    'LOUVER',
                    'REFLARE',
                    'SLIT',
                    'CORRUGATE',
                    'WIDE LOWER',
                    'ROW SLIT',
                    'CUT OFF',
                    'SIDE CUT',
                    'CORNER CUT',
                    'CENTER NOTCH',
                    'HITCH FEED',
                    'BACK STOP',
                    'FORMING',
                    ...availableStages
                  ])).map(stg => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))}
                  <option value="__NEW__">+ สร้างสเตจใหม่ (Custom Stage)...</option>
                </select>
                {stageName === '__NEW__' && (
                  <input
                    type="text"
                    value={customStage}
                    onChange={e => setCustomStage(e.target.value)}
                    placeholder="พิมพ์ชื่อสเตจใหม่..."
                    className="w-full mt-1.5 bg-[#111111] border border-[#00FF00] px-2 py-1 text-xs text-white"
                  />
                )}
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  MATERIAL / SPEC (เกรดวัสดุ):
                </label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF00]"
                >
                  <option value="SKD11">SKD11 (Tool Steel)</option>
                  <option value="Carbide">Carbide (Tungsten)</option>
                  <option value="SKH51">SKH51 (High Speed Steel)</option>
                  <option value="HAP40">HAP40 (Powder HSS)</option>
                  <option value="Standard">Standard Die Spec</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1 font-bold">
                  MAINTENANCE TYPE (ประเภทการบำรุงรักษา):
                </label>
                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setMaintenanceType('REGRIND')}
                    className={`py-1 text-xs font-bold border transition-colors cursor-pointer ${
                      maintenanceType === 'REGRIND'
                        ? 'bg-[#111111] text-purple-300 border-purple-500'
                        : 'bg-[#111111] text-slate-400 border-[#666666]'
                    }`}
                  >
                    Re-grind (ลับคม)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintenanceType('DISPOSE')}
                    className={`py-1 text-xs font-bold border transition-colors cursor-pointer ${
                      maintenanceType === 'DISPOSE'
                        ? 'bg-[#22000c] text-[#C40045] border-[#C40045]'
                        : 'bg-[#111111] text-slate-400 border-[#666666]'
                    }`}
                  >
                    1-Use (เปลี่ยนทิ้ง)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Installed Quantities by Line (E1-E5) */}
          <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-3">
            <div className="text-[#FFCC00] font-bold flex items-center justify-between border-b border-[#333333] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" />
                <span className="uppercase">2. จำนวนติดตั้งในแม่พิมพ์แยกตามสายการผลิต (INSTALL QUANTITY BY LINE)</span>
              </div>
              <span className="text-xs bg-[#111111] px-2 py-0.5 border border-[#666666]">
                รวมติดตั้ง: <strong className="text-[#FFCC00]">{totalInstalled} EA</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { line: 'E1', sub: 'Ø7 Slit', val: qtyE1, set: setQtyE1 },
                { line: 'E2', sub: 'Ø5 Slit', val: qtyE2, set: setQtyE2 },
                { line: 'E3-1', sub: 'Slit 3P', val: qtyE3_1, set: setQtyE3_1 },
                { line: 'E3-2', sub: 'WL+ 4P', val: qtyE3_2, set: setQtyE3_2 },
                { line: 'E3-3', sub: 'Corr 4P', val: qtyE3_3, set: setQtyE3_3 },
                { line: 'E4', sub: 'Ø5 Slit', val: qtyE4, set: setQtyE4 },
                { line: 'E5', sub: 'Ø5 Slit', val: qtyE5, set: setQtyE5 },
              ].map(slot => (
                <div key={slot.line} className="bg-[#111111] border border-[#666666] p-1.5 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-300">{slot.line}</div>
                  <div className="text-[9px] text-slate-500">{slot.sub}</div>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={slot.val === 0 ? '' : slot.val}
                    placeholder="0"
                    onChange={e => slot.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full py-0.5 text-center text-xs font-bold bg-[#1a1a1a] border border-[#555555] text-[#FFCC00] focus:outline-none focus:border-[#00FF00]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Standardization of Shot Usage Cycle (Million Shots) */}
          <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-3">
            <div className="text-[#00FF00] font-bold flex items-center justify-between border-b border-[#333333] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                <span className="uppercase">3. เกณฑ์อายุการใช้งานช็อต (STANDARDIZATION OF SHOT USAGE CYCLE - MILLION SHOTS)</span>
              </div>
              <span className="text-[10px] text-slate-400">หน่วย: ล้านช็อต (M Shots)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E1 (Ø7 Slit / PCM):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE1}
                    onChange={e => setLifeE1(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E2 (Ø5 Slit / GOLD):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE2}
                    onChange={e => setLifeE2(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E3-1 (Slit 3P / PCM):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE3_1}
                    onChange={e => setLifeE3_1(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E3-2 (WL+ 4P / GOLD):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE3_2}
                    onChange={e => setLifeE3_2(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E3-3 (Corr 4P / GOLD):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE3_3}
                    onChange={e => setLifeE3_3(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E4 (Ø5 Slit / BARE):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE4}
                    onChange={e => setLifeE4(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">E5 (Ø5 Slit / BARE):</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="number"
                    step={0.1}
                    value={lifeE5}
                    onChange={e => setLifeE5(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#00FF00] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">M</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">SCRAP / LOWER LIMIT:</label>
                <div className="flex items-center gap-1 bg-[#111111] border border-[#666666] px-2 py-1">
                  <input
                    type="text"
                    value={scrapLimit}
                    onChange={e => setScrapLimit(e.target.value)}
                    placeholder="62.50"
                    className="w-full bg-transparent text-xs text-[#C40045] font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Standard Re-grinding Specifications */}
          <div className="bg-[#1a1a1a] border border-[#666666] p-3 space-y-3">
            <div className="text-purple-300 font-bold flex items-center justify-between border-b border-[#333333] pb-1.5">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span className="uppercase">4. เกณฑ์การลับคมและการซ่อมบำรุง (STANDARD RE-GRINDING SPEC)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block text-[10px] mb-1">1 TIME / RE-GRIND (ระยะเจียรต่อครั้ง):</label>
                <input
                  type="text"
                  value={perGrindMm}
                  onChange={e => setPerGrindMm(e.target.value)}
                  placeholder="0.05 mm"
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">TOTAL RE-GRIND DEPTH (ระยะเจียรรวมสูงสุด):</label>
                <input
                  type="text"
                  value={totalGrindMm}
                  onChange={e => setTotalGrindMm(e.target.value)}
                  placeholder="0.50 mm"
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block text-[10px] mb-1">MAX CYCLES (จำนวนครั้งสูงสุด):</label>
                <input
                  type="text"
                  value={regrindCycles}
                  onChange={e => setRegrindCycles(e.target.value)}
                  placeholder="10"
                  className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block text-[10px] mb-1">NOTE / STANDARD INSTRUCTION (หมายเหตุคำแนะนำ):</label>
              <input
                type="text"
                value={regrindNote}
                onChange={e => setRegrindNote(e.target.value)}
                placeholder="คำแนะนำการลับคมหรือมาตรฐานการเปลี่ยน..."
                className="w-full bg-[#111111] border border-[#666666] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00FF00]"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-[#1a1a1a] border-t border-[#666666] p-3 flex items-center justify-between shrink-0 font-mono">
          <div className="text-[11px] text-slate-400">
            ระบบจะอัปเดตข้อมูล Master, มาตรฐาน Life Standard และ Matrix พร้อมกัน
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-slate-300 border border-[#666666] text-xs cursor-pointer"
            >
              ยกเลิก (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#00FF00] hover:bg-[#00dd00] text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'บันทึกการแก้ไข (Save Changes)' : 'เพิ่มชิ้นส่วนลงฐานข้อมูล (Add Part)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
