import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  X,
  Search,
  Plus,
  RefreshCw,
  FolderPlus,
  Sparkles,
  Filter
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { PartMaster } from '../../types';
import { DEFAULT_STAGE_GROUPS, deriveLogicalStage, sortStagesInOrder } from '../../utils/stageUtils';

interface StageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const StageManagementModal: React.FC<StageManagementModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [partMasters, setPartMasters] = useState<PartMaster[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // New Stage Form
  const [newStageInput, setNewStageInput] = useState('');
  const [customStageList, setCustomStageList] = useState<string[]>([]);

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    const masters = storageService.getPartMasters();
    setPartMasters(masters);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // All valid Stage Groups
  const allStageGroups = useMemo(() => {
    const stageSet = new Set<string>(DEFAULT_STAGE_GROUPS);
    
    partMasters.forEach(pm => {
      const derived = deriveLogicalStage(pm.partName, pm.stageName);
      if (derived && derived !== '-') {
        stageSet.add(derived);
      }
    });

    customStageList.forEach(stg => stageSet.add(stg));

    return sortStagesInOrder(Array.from(stageSet));
  }, [partMasters, customStageList]);

  if (!isOpen) return null;

  // Handler: Add new Stage Group
  const handleAddNewStage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStageInput.trim();
    if (!trimmed) return;

    if (allStageGroups.includes(trimmed)) {
      showToast('⚠️ ชื่อ Stage นี้มีอยู่อยู่แล้วในระบบ');
      return;
    }

    setCustomStageList(prev => [...prev, trimmed]);
    setNewStageInput('');
    showToast(`✅ เพิ่ม Stage ใหม่ "${trimmed}" เรียบร้อย`);
  };

  // Handler: Reassign Single Part Stage
  const handleReassignSinglePart = (partCode: string, partName: string, newStage: string) => {
    const list = storageService.getPartMasters();
    const idx = list.findIndex(p => p.partCode === partCode);
    if (idx >= 0) {
      list[idx].stageName = newStage;
      storageService.savePartMaster(list[idx]);
      loadData();
      if (onSave) onSave();
      showToast(`✅ ย้าย "${partName}" ไปยัง "${newStage}" สำเร็จ`);
    }
  };

  // Handler: Auto-Group & Clean Raw Duplicate Stages
  const handleAutoCleanAndGroup = () => {
    const list = storageService.getPartMasters();
    let updatedCount = 0;

    list.forEach(pm => {
      const logical = deriveLogicalStage(pm.partName, pm.stageName);
      if (pm.stageName !== logical) {
        pm.stageName = logical;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      storageService.savePartMasters(list);
      loadData();
      if (onSave) onSave();
      showToast(`⚡ ทำความสะอาดและจัดกลุ่ม Stage อัตโนมัติสำเร็จ ${updatedCount} รายการ!`);
    } else {
      showToast(`ℹ️ รายการทั้งหมดอยู่ในกลุ่ม Stage มาตรฐานเรียบร้อยแล้ว`);
    }
  };

  // Filtered Parts
  const filteredParts = partMasters.filter(p => {
    const currentStg = deriveLogicalStage(p.partName, p.stageName);
    if (stageFilter !== 'ALL' && currentStg !== stageFilter) {
      return false;
    }

    if (!partSearch.trim()) return true;
    const q = partSearch.toLowerCase();
    return (
      p.partName.toLowerCase().includes(q) ||
      currentStg.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[#00FF00]/40 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#1f2937] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>⚙️ จัดกลุ่มและจัดการ Stage (Stage Grouping Management)</span>
              </h2>
              <p className="text-xs text-slate-400">
                กำหนด/แก้ไข Stage ให้กับชิ้นส่วนแม่พิมพ์แต่ละรายการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert Banner */}
        {toast && (
          <div className="bg-[#00FF00]/20 border-b border-[#00FF00] px-4 py-2 text-xs font-bold text-[#00FF00] flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00FF00]" />
              {toast}
            </span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        {/* Top Control Bar: Add Stage & Auto Clean */}
        <div className="p-3 bg-[#172131] border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Add New Stage Group */}
          <form onSubmit={handleAddNewStage} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <FolderPlus className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="พิมพ์ชื่อ Stage ใหม่... (e.g. Stage 11: Special Punch)"
                value={newStageInput}
                onChange={e => setNewStageInput(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-white rounded-xl placeholder:text-slate-500 font-mono focus:outline-none focus:border-[#00FF00]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#00FF00] hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม Stage</span>
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCleanAndGroup}
              className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-[#00FF00] border border-[#00FF00]/40 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
              title="สแกนและจัดกลุ่มชื่อ Stage ที่ซ้ำหรือเป็นชื่อพาร์ทเดิม ให้เข้ากลุ่ม Stage มาตรฐานอัตโนมัติ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>⚡ ล้างสเตจซ้ำ & จัดกลุ่มอัตโนมัติ</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 bg-[#131d2e] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อพาร์ท หรือสเตจ..."
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
                className="w-full bg-[#111827] border border-slate-700 pl-9 pr-3 py-1.5 text-xs text-slate-200 rounded-xl focus:outline-none focus:border-[#00FF00]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-[#00FF00]" />
              <span className="text-slate-400 font-bold">กรองตาม Stage:</span>
              <select
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                className="bg-[#111827] text-[#00FF00] border border-slate-700 px-2 py-1 text-xs font-bold rounded-lg focus:outline-none focus:border-[#00FF00] cursor-pointer"
              >
                <option value="ALL">ทุกสเตจ (All Stages)</option>
                {allStageGroups.map(stg => (
                  <option key={stg} value={stg} className="bg-[#111827] text-white">
                    {stg}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              แสดง <strong className="text-[#00FF00]">{filteredParts.length}</strong> จาก {partMasters.length} รายการ
            </div>
          </div>
        </div>

        {/* Main Table Body - Exactly matching requested layout (No Part Code, No DWG No.) */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#0c121e]">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#1a2536] text-slate-300 border-b border-slate-700">
                <th className="p-3 w-16 text-center font-bold">No</th>
                <th className="p-3 font-bold text-white">ชื่อชิ้นส่วนแม่พิมพ์ (Part Name)</th>
                <th className="p-3 w-80 font-bold text-[#00FF00]">Stage สเตจที่สังกัด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500 font-sans">
                    ไม่พบรายการชิ้นส่วนตรงกับคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredParts.map((part, idx) => {
                  const currentStg = deriveLogicalStage(part.partName, part.stageName);
                  return (
                    <tr key={part.partCode || idx} className="hover:bg-[#162234] transition-colors">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-white text-sm">{part.partName}</td>
                      <td className="p-3">
                        <select
                          value={currentStg}
                          onChange={e =>
                            handleReassignSinglePart(part.partCode, part.partName, e.target.value)
                          }
                          className="w-full bg-[#111827] text-[#00FF00] border border-emerald-600/60 px-3 py-1.5 text-xs font-bold rounded-lg focus:outline-none focus:border-[#00FF00] cursor-pointer shadow-sm"
                        >
                          {allStageGroups.map(stg => (
                            <option key={stg} value={stg} className="bg-[#111827] text-white">
                              {stg}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#1f2937] border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            จำนวน Stage ทั้งหมด: <strong className="text-[#00FF00]">{allStageGroups.length}</strong> กลุ่ม | ชิ้นส่วนทั้งหมด: <strong className="text-white">{partMasters.length}</strong> รายการ
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#00FF00] hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            เสร็จสิ้น (Done)
          </button>
        </div>

      </div>
    </div>
  );
};
