import React, { useState, useEffect } from 'react';
import { Layers, Search, DollarSign, Wrench, FileText } from 'lucide-react';
import { PartMaster } from '../types';
import { storageService } from '../services/storageService';

export const PartMasterView: React.FC = () => {
  const [parts, setParts] = useState<PartMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    setParts(storageService.getPartMasters());
    const unsub = storageService.subscribe(() => setParts(storageService.getPartMasters()));
    return () => unsub();
  }, []);

  const filtered = parts.filter(p => {
    const matchesSearch =
      p.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.drawingNumber && p.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'PUNCH', 'DIE', 'BLADE', 'PIN', 'CORNER_CUT', 'CENTER_PUNCH', 'OTHER'];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Part Master Catalog
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ฐานข้อมูลชิ้นส่วนแม่พิมพ์ฟินเพรส (Drawing Number, Category, Tool Steel Material, Unit Cost, Tube Size Compatibility)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search code, name, drawing..."
              className="bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 w-64 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

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

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">PART CODE</th>
                <th className="py-2.5 px-3">PART NAME</th>
                <th className="py-2.5 px-3">STAGE</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">DRAWING NO.</th>
                <th className="py-2.5 px-3 text-right">UNIT COST (THB)</th>
                <th className="py-2.5 px-3 text-center">TUBE COMPATIBILITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(p => (
                <tr key={p.partCode} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{p.partCode}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-100">{p.partName}</div>
                    {p.partNameTh && <div className="text-[11px] text-slate-500 font-thai">{p.partNameTh}</div>}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
