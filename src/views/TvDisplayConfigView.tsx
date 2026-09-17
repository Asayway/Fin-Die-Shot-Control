import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  HelpCircle, 
  AlertCircle,
  Factory,
  Save,
  RotateCw
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { ProductionLineId, PartMaster } from '../types';

export const TvDisplayConfigView: React.FC = () => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>('E1');
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local active selections for current line
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Line labels matching the main application
  const lineDisplayNames: Record<ProductionLineId, string> = {
    'E1': 'LINE E1 (Ø7 Slit)',
    'E2': 'LINE E2 (Ø5 Slit)',
    'E3-1': 'LINE E3 Slit 3P',
    'E3-2': 'LINE E3 WL+ 4P',
    'E3-3': 'LINE E3 New Cor 4P',
    'E4': 'LINE E4 (Ø5 Slit)',
    'E5': 'LINE E5 (Ø5 Slit)'
  };

  const getStageColor = (stage: string) => {
    const stg = (stage || '').toUpperCase();
    if (stg.includes('PIERCE') || stg.includes('BURRING')) return 'border-[#FFCC00] text-[#FFCC00]'; // Yellow/Amber
    if (stg.includes('IRONING')) return 'border-blue-400 text-blue-400';
    if (stg.includes('LOUVER') || stg.includes('SLIT')) return 'border-emerald-400 text-emerald-400';
    if (stg.includes('REFLAIRE') || stg.includes('REFLARE')) return 'border-purple-400 text-purple-400';
    if (stg.includes('NOTCH') || stg.includes('PUNCH')) return 'border-sky-400 text-sky-400';
    if (stg.includes('CUT OFF') || stg.includes('SIDE CUT')) return 'border-rose-400 text-rose-400';
    if (stg.includes('FORMING')) return 'border-teal-400 text-teal-400';
    if (stg.includes('PILOT') || stg.includes('FEED')) return 'border-orange-400 text-orange-400';
    return 'border-slate-500 text-slate-300';
  };

  const loadData = () => {
    const parts = storageService.getPartMasters();
    setPartMasters(parts);
    setLineConfigs(storageService.getLineConfigs());

    // Load saved TV Display configs
    const configs = storageService.getTvDisplayConfigs();
    const activeLineConfig = configs[selectedLineId] || [];
    setSelectedParts(activeLineConfig);
  };

  useEffect(() => {
    loadData();
  }, [selectedLineId]);

  // Current line configuration
  const currentLineConfig = useMemo(() => {
    return lineConfigs.find(cfg => cfg.lineId === selectedLineId);
  }, [lineConfigs, selectedLineId]);

  // Identify which parts are actually installed/active on this line
  const installedPartsMap = useMemo(() => {
    if (!currentLineConfig || !currentLineConfig.installedPartQuantities) {
      return {};
    }
    return currentLineConfig.installedPartQuantities as Record<string, number>;
  }, [currentLineConfig]);

  // Filter & sort part masters for the left pane
  const availableParts = useMemo(() => {
    // Check if parts are already selected
    const selectedSet = new Set(selectedParts);
    
    let list = partMasters.map(pm => {
      const isInstalled = (installedPartsMap[pm.partCode] || 0) > 0;
      const installQty = installedPartsMap[pm.partCode] || 0;
      return {
        ...pm,
        isInstalled,
        installQty,
        isSelected: selectedSet.has(pm.partCode)
      };
    });

    // Query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.partCode.toLowerCase().includes(q) || 
        p.partName.toLowerCase().includes(q) || 
        (p.stageName && p.stageName.toLowerCase().includes(q))
      );
    }

    // Sort: 1) Installed on this line comes first, 2) Then sorted by partCode
    return list.sort((a, b) => {
      if (a.isInstalled && !b.isInstalled) return -1;
      if (!a.isInstalled && b.isInstalled) return 1;
      return a.partCode.localeCompare(b.partCode);
    });
  }, [partMasters, installedPartsMap, selectedParts, searchQuery]);

  // Retrieve the full PartMaster info for the selected parts in the right pane
  const activeTvPartsList = useMemo(() => {
    return selectedParts.map((pCode, index) => {
      const pm = partMasters.find(p => p.partCode === pCode);
      const isInstalled = (installedPartsMap[pCode] || 0) > 0;
      return {
        partCode: pCode,
        partName: pm ? pm.partName : pCode,
        stageName: pm ? pm.stageName : 'Unknown Stage',
        isInstalled,
        index
      };
    });
  }, [selectedParts, partMasters, installedPartsMap]);

  // Add item to TV Display List
  const handleAddPart = (partCode: string) => {
    if (selectedParts.includes(partCode)) return;
    setSelectedParts(prev => [...prev, partCode]);
  };

  // Remove item from TV Display List
  const handleRemovePart = (partCode: string) => {
    setSelectedParts(prev => prev.filter(c => c !== partCode));
  };

  // Move item Up in ordering
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedParts(prev => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return list;
    });
  };

  // Move item Down in ordering
  const handleMoveDown = (index: number) => {
    if (index === selectedParts.length - 1) return;
    setSelectedParts(prev => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      return list;
    });
  };

  // Save the configuration
  const handleSave = () => {
    try {
      const configs = storageService.getTvDisplayConfigs();
      configs[selectedLineId] = selectedParts;
      storageService.saveTvDisplayConfigs(configs);

      // Create detailed logs
      storageService.addAuditLog(
        'SYSTEM',
        `Configured TV display items for ${selectedLineId}: selected ${selectedParts.length} parts`,
        `ตั้งค่ารายการแสดงผล TV ของไลน์ ${selectedLineId} สำเร็จแล้ว (เลือกแล้ว ${selectedParts.length} พาร์ท)`
      );

      setSaveSuccessMsg(`บันทึกการตั้งค่าการแสดงผล TV สำหรับไลน์ ${selectedLineId} เรียบร้อยแล้ว`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    }
  };

  // Reset to default (all installed parts on this line)
  const handleResetToDefault = () => {
    const installedCodes = Object.keys(installedPartsMap).filter(code => (installedPartsMap[code] || 0) > 0);
    setSelectedParts(installedCodes);
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-[#333] space-y-4 font-sans text-slate-200">
      
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-amber-400" />
            <span>ตั้งค่าการแสดงผล TV (TV DISPLAY SETTINGS)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            เลือกชิ้นส่วนอะไหล่ 12 - 14 รายการหลักที่ต้องการแสดงผลในแต่ละไลน์ เพื่อไม่ให้หน้าจอ TV Dashboard หนาแน่นเกินไป
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>ค่าเริ่มต้น</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Line Select Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#161b22] rounded-lg border border-[#30363d]">
        {(['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5'] as ProductionLineId[]).map((lineId) => {
          const isActive = selectedLineId === lineId;
          const display = lineDisplayNames[lineId];
          const hasCustomConfig = (storageService.getTvDisplayConfigs()[lineId] || []).length > 0;

          return (
            <button
              key={lineId}
              onClick={() => setSelectedLineId(lineId)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black' 
                  : 'bg-[#0d1117] text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>{display}</span>
              {hasCustomConfig && (
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-950' : 'bg-amber-400'}`}></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selector Panels Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: AVAILABLE PARTS (Lg 5 spans) */}
        <div className="lg:col-span-5 bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1">
              <span>รายการพาร์ททั้งหมด</span>
              <span className="bg-[#21262d] text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                {availableParts.length}
              </span>
            </span>
            <span className="text-[10px] text-slate-400">เรียงตามการติดตั้งในไลน์</span>
          </div>

          {/* Search box */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="ค้นหาตามพาร์ทโค้ด, ชื่อพาร์ท หรือสเตจ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0d1117] text-xs text-white placeholder-slate-500 border border-[#30363d] rounded-lg focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* List items scroll area */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {availableParts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                ไม่พบข้อมูลพาร์ท
              </div>
            ) : (
              availableParts.map((pm) => {
                const isSelected = selectedParts.includes(pm.partCode);
                return (
                  <div 
                    key={pm.partCode}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      pm.isInstalled 
                        ? 'bg-[#1f242c] border-slate-700' 
                        : 'bg-[#0d1117] border-[#222]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {pm.stageName && (
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black border bg-[#0d1117] uppercase tracking-wider rounded ${getStageColor(pm.stageName)}`}>
                            {pm.stageName}
                          </span>
                        )}
                        {pm.isInstalled && (
                          <span className="bg-[#1c2230] text-indigo-300 text-[9px] px-1 py-0.2 rounded font-semibold border border-indigo-900/60 font-mono">
                            ติดตั้งแล้ว ({pm.installQty} ชิ้น)
                          </span>
                        )}
                        {isSelected && (
                          <span className="bg-amber-950/85 text-amber-400 text-[9px] px-1 py-0.2 rounded font-black border border-amber-900/50">
                            เลือกแล้ว
                          </span>
                        )}
                      </div>
                      <div className="text-white font-extrabold text-[12px] leading-tight">
                        {pm.partName}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddPart(pm.partCode)}
                      disabled={isSelected}
                      className={`p-1.5 rounded-md transition-all shrink-0 ${
                        isSelected 
                          ? 'bg-[#111] text-slate-600 border border-slate-850 cursor-not-allowed' 
                          : 'bg-amber-400/10 text-amber-400 border border-amber-400/30 hover:bg-amber-400 hover:text-slate-950 cursor-pointer'
                      }`}
                      title="เพิ่มพาร์ทลงในรายการแสดงผล TV"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE ADVISORY BADGE (Lg 1 span if small screen or just blank spacer) */}
        
        {/* RIGHT COLUMN: TV DISP ACTIVE ITEMS (Lg 7 spans) */}
        <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-[#2d3139] pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">รายการที่จะนำขึ้นหน้าจอ TV</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                selectedParts.length > 14 
                  ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                  : selectedParts.length >= 12
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-[#21262d] text-slate-300'
              }`}>
                {selectedParts.length} รายการ
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                <span>แนะนำที่ 12 - 14 รายการ</span>
              </span>
            </div>
          </div>

          {/* Recommendation / Limit indicator */}
          {selectedParts.length > 14 && (
            <div className="p-2 bg-rose-950/40 border border-rose-900/60 text-rose-400 rounded-lg text-[10px] mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>คำเตือน:</strong> คุณเลือกไป {selectedParts.length} รายการแล้ว (เกิน 14 รายการ) หน้าจอ TV อาจจะดูอัดแน่นและตัวอักษรเล็กเกินกว่าจะสแกนสายตาได้อย่างรวดเร็ว
              </span>
            </div>
          )}

          {/* List items ordering and remove panel */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {selectedParts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Tv className="w-12 h-12 text-slate-700 stroke-[1.5] mb-2" />
                <p className="text-xs font-bold text-slate-400">ยังไม่มีการเจาะจงรายการตั้งค่า</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[260px]">
                  จะใช้ค่าเริ่มต้นคือดึงรายการชิ้นส่วนอะไหล่ทั้งหมดที่ติดตั้งบนไลน์นี้มาแสดงผล
                </p>
              </div>
            ) : (
              activeTvPartsList.map((item, index) => {
                return (
                  <div 
                    key={item.partCode}
                    className="p-2.5 bg-[#0d1117] border border-[#222] rounded-lg hover:border-[#333] transition-all flex items-center justify-between gap-3 animate-fadeIn"
                  >
                    {/* Index & Reorder Controls */}
                    <div className="flex items-center gap-1 bg-[#161b22] px-1.5 py-1 rounded border border-[#222]">
                      <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-0.5 hover:bg-[#30363d] rounded transition-all cursor-pointer ${
                            index === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300'
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedParts.length - 1}
                          className={`p-0.5 hover:bg-[#30363d] rounded transition-all cursor-pointer ${
                            index === selectedParts.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300'
                          }`}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Part Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {item.stageName && (
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black border bg-[#0d1117] uppercase tracking-wider rounded ${getStageColor(item.stageName)}`}>
                            {item.stageName}
                          </span>
                        )}
                        {!item.isInstalled && (
                          <span className="bg-amber-950/40 text-amber-400 border border-amber-900/45 text-[8px] px-1 rounded font-bold">
                            ไม่ได้ติดตั้ง
                          </span>
                        )}
                      </div>
                      <div className="text-white font-extrabold text-[12px] leading-tight">
                        {item.partName}
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => handleRemovePart(item.partCode)}
                      className="p-1.5 bg-rose-950/40 text-rose-400 border border-rose-900/60 hover:bg-rose-500 hover:text-white rounded-md transition-all cursor-pointer shrink-0"
                      title="ลบออกจากรายการ TV"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
