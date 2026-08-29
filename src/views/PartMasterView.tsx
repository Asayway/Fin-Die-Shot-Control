import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { PartMaster, TubeSizeCompat } from '../types';
import { storageService } from '../services/storageService';

export const PartMasterView: React.FC = () => {
  const [parts, setParts] = useState<PartMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modal / Form state for Add/Edit
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  const [editingPart, setEditingPart] = useState<PartMaster>({
    partCode: '',
    partName: '',
    partNameTh: '',
    stageName: 'Piercing Stage',
    category: 'PUNCH',
    drawingNumber: '',
    toolSteelMaterial: 'SKD11 / Carbide',
    unitCostThb: 5000,
    tubeSizeCompat: 'BOTH'
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setParts(storageService.getPartMasters());
    const unsub = storageService.subscribe(() => setParts(storageService.getPartMasters()));
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setIsEditingExisting(false);
    setEditingPart({
      partCode: `PT-NEW-${Date.now().toString().slice(-4)}`,
      partName: '',
      partNameTh: '',
      stageName: 'Piercing Stage',
      category: 'PUNCH',
      drawingNumber: 'DWG-001',
      toolSteelMaterial: 'SKD11 / Carbide',
      unitCostThb: 6500,
      tubeSizeCompat: 'BOTH'
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (p: PartMaster) => {
    setIsEditingExisting(true);
    setEditingPart({ ...p });
    setShowEditModal(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart.partCode.trim() || !editingPart.partName.trim()) {
      setFeedback({ type: 'error', message: 'Part Code and Part Name are strictly required.' });
      return;
    }

    storageService.savePartMaster(editingPart);
    setShowEditModal(false);
    setFeedback({ 
      type: 'success', 
      message: `Part Master ${editingPart.partCode} (${editingPart.partName}) saved successfully!` 
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filtered = parts.filter(p => {
    const matchesSearch =
      p.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.partNameTh && p.partNameTh.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.drawingNumber && p.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'PUNCH', 'DIE', 'BLADE', 'PIN', 'CORNER_CUT', 'CENTER_PUNCH', 'OTHER'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Part Master Catalog (ตั้งค่าชื่อและรหัสชิ้นส่วน)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-thai">
            จัดการฐานข้อมูลชื่อชิ้นส่วนแม่พิมพ์ฟินเพรส กำหนด Drawing Number, Stage, Tool Steel Material, ราคา และการรองรับขนาดท่อ
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search code, name, drawing..."
              className="bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 w-56 sm:w-64 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Part (เพิ่มชิ้นส่วนใหม่)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-600 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat} ({cat === 'ALL' ? parts.length : parts.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Parts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">PART CODE</th>
                <th className="py-2.5 px-3">PART NAME & THAI NAME</th>
                <th className="py-2.5 px-3">STAGE</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">DRAWING NO.</th>
                <th className="py-2.5 px-3 text-right">UNIT COST (THB)</th>
                <th className="py-2.5 px-3 text-center">TUBE COMPAT</th>
                <th className="py-2.5 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(p => (
                <tr key={p.partCode} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{p.partCode}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-100">{p.partName}</div>
                    {p.partNameTh && <div className="text-[11px] text-slate-400 font-thai">{p.partNameTh}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{p.stageName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{p.drawingNumber || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    ฿{p.unitCostThb ? p.unitCostThb.toLocaleString() : '0'}
                  </td>
                  <td className="py-2.5 px-3 text-center text-cyan-400">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[10px]">
                      {p.tubeSizeCompat}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-600 transition-colors"
                      title="Edit Part Name and Parameters"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{isEditingExisting ? `Edit Part: ${editingPart.partCode}` : 'Add New Tooling Part Master'}</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">PART CODE *</label>
                  <input
                    type="text"
                    value={editingPart.partCode}
                    onChange={e => setEditingPart({ ...editingPart, partCode: e.target.value.toUpperCase() })}
                    disabled={isEditingExisting}
                    placeholder="e.g. PT-BP-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">CATEGORY *</label>
                  <select
                    value={editingPart.category}
                    onChange={e => setEditingPart({ ...editingPart, category: e.target.value as any })}
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
                  value={editingPart.partName}
                  onChange={e => setEditingPart({ ...editingPart, partName: e.target.value })}
                  placeholder="e.g. Bucking Punch, Louver Blade, etc."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-sans font-semibold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold font-thai">ชื่อชิ้นส่วนภาษาไทย (THAI NAME)</label>
                <input
                  type="text"
                  value={editingPart.partNameTh || ''}
                  onChange={e => setEditingPart({ ...editingPart, partNameTh: e.target.value })}
                  placeholder="เช่น พันช์ขึ้นรูปแถวแรก, ใบมีดตัดซอย ฯลฯ"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-thai focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">STAGE NAME</label>
                  <input
                    type="text"
                    value={editingPart.stageName}
                    onChange={e => setEditingPart({ ...editingPart, stageName: e.target.value })}
                    placeholder="e.g. Piercing Stage"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">DRAWING NUMBER</label>
                  <input
                    type="text"
                    value={editingPart.drawingNumber || ''}
                    onChange={e => setEditingPart({ ...editingPart, drawingNumber: e.target.value })}
                    placeholder="e.g. DWG-FD-07-001"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">UNIT COST (THB)</label>
                  <input
                    type="number"
                    value={editingPart.unitCostThb}
                    onChange={e => setEditingPart({ ...editingPart, unitCostThb: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">TUBE COMPATIBILITY</label>
                  <select
                    value={editingPart.tubeSizeCompat}
                    onChange={e => setEditingPart({ ...editingPart, tubeSizeCompat: e.target.value as TubeSizeCompat })}
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
                  onClick={() => setShowEditModal(false)}
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
