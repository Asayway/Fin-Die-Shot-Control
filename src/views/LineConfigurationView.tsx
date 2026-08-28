import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import { ProductionLineId, LineActiveConfiguration, FinMaterial, TubeDiameter } from '../types';
import { storageService } from '../services/storageService';

export const LineConfigurationView: React.FC = () => {
  const [configs, setConfigs] = useState<LineActiveConfiguration[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>('E6');
  const [editingConfig, setEditingConfig] = useState<LineActiveConfiguration | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const reload = () => {
    const all = storageService.getLineConfigs();
    setConfigs(all);
    const curr = all.find(c => c.lineId === selectedLineId) || all[0];
    if (curr) setEditingConfig({ ...curr });
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, [selectedLineId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    storageService.saveLineConfig(editingConfig);
    setSuccessMsg(`Line ${editingConfig.lineId} configuration successfully updated and broadcast to active tooling!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            Fin Press & Fin Die Line Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            กำหนดค่าโครงสร้างแม่พิมพ์และคุณสมบัติวัสดุสำหรับสายการผลิต E1 - E6 (Die Code, Tube Size, Fin Type, Material & Thickness)
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1.5 rounded-md border border-slate-800">
          {linesList.map(line => (
            <button
              key={line}
              onClick={() => setSelectedLineId(line)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                selectedLineId === line
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Line {line}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {editingConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editor Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Active Tooling Spec: Line {selectedLineId}</span>
              <span className="text-xs font-mono text-cyan-400">Config ID: {editingConfig.id}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fin Die Model Name
                  </label>
                  <input
                    type="text"
                    value={editingConfig.dieName}
                    onChange={e => setEditingConfig({ ...editingConfig, dieName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Die Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingConfig.dieCode}
                    onChange={e => setEditingConfig({ ...editingConfig, dieCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tube Size (ขนาดท่อ) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editingConfig.tubeSize}
                    onChange={e => setEditingConfig({ ...editingConfig, tubeSize: e.target.value as TubeDiameter })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Ø5">Ø5 mm</option>
                    <option value="Ø7">Ø7 mm</option>
                    <option value="Ø9.52">Ø9.52 mm (3/8")</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fin Type (ชนิดฟิน) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editingConfig.finType}
                    onChange={e => setEditingConfig({ ...editingConfig, finType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Slit (half)">Slit (half)</option>
                    <option value="Standard Corrugated">Standard Corrugated</option>
                    <option value="Louver High Performance">Louver High Performance</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Aluminum Material <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editingConfig.material}
                    onChange={e => setEditingConfig({ ...editingConfig, material: e.target.value as FinMaterial })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="PCM">PCM (Pre-Coated Material)</option>
                    <option value="GOLD">GOLD (Gold Hydrophilic)</option>
                    <option value="BARE">BARE (Bare Aluminum)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Thickness (mm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    value={editingConfig.thicknessMm}
                    onChange={e => setEditingConfig({ ...editingConfig, thicknessMm: parseFloat(e.target.value) || 0.10 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Rows & Columns
                  </label>
                  <input
                    type="text"
                    value={`${editingConfig.rowsCount || 4} Rows × ${editingConfig.columnsCount || 42} Cols`}
                    disabled
                    className="w-full bg-slate-950/60 border border-slate-800 rounded px-3 py-2 text-sm text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={editingConfig.effectiveFrom}
                    onChange={e => setEditingConfig({ ...editingConfig, effectiveFrom: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Configuration Change Notes
                </label>
                <input
                  type="text"
                  value={editingConfig.notes || ''}
                  onChange={e => setEditingConfig({ ...editingConfig, notes: e.target.value })}
                  placeholder="Reason for line configuration adjustment..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE & APPLY CONFIGURATION TO LINE {selectedLineId}</span>
              </button>
            </form>
          </div>

          {/* Right Rules Card */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">
              Composite Configuration Key Standard
            </h3>
            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-cyan-400 font-bold mb-1">Standard 10-Component Key:</div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Line + Configuration ID + Die Code + Fin Type + Material + Thickness + Tube Size + Part Code + Position + Effective Date
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">Active Line Resolved Key:</div>
                <div className="text-[11px] text-emerald-400 break-all">
                  {selectedLineId}|{editingConfig.id}|{editingConfig.dieCode}|{editingConfig.finType}|{editingConfig.material}|{editingConfig.thicknessMm}mm|{editingConfig.tubeSize}|ALL|ALL|{editingConfig.effectiveFrom}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-thai">
                * กฎเหล็ก: ห้ามกำหนดเกณฑ์อายุช็อตด้วยชื่อชิ้นส่วนเพียงอย่างเดียว ต้องผูกกับชุดค่าคอนฟิก 10 ตัวแปรข้างต้นเสมอ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Lines Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-100">
          All Production Lines Configuration Matrix (E1 - E6)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">DIE CODE</th>
                <th className="py-2.5 px-3">DIE NAME</th>
                <th className="py-2.5 px-3">TUBE</th>
                <th className="py-2.5 px-3">FIN TYPE</th>
                <th className="py-2.5 px-3">MATERIAL</th>
                <th className="py-2.5 px-3">THICKNESS</th>
                <th className="py-2.5 px-3">EFFECTIVE</th>
                <th className="py-2.5 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {configs.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">Line {c.lineId}</td>
                  <td className="py-2.5 px-3 text-slate-200">{c.dieCode}</td>
                  <td className="py-2.5 px-3 text-slate-300">{c.dieName}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{c.tubeSize}</td>
                  <td className="py-2.5 px-3 text-slate-300">{c.finType}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-300">{c.material}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{c.thicknessMm} mm</td>
                  <td className="py-2.5 px-3 text-slate-400">{c.effectiveFrom}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedLineId(c.lineId)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 text-[11px]"
                    >
                      Edit
                    </button>
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

export const PartMasterView: React.FC = () => {
  const [parts, setParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setParts(storageService.getPartMasters());
    const unsub = storageService.subscribe(() => setParts(storageService.getPartMasters()));
    return () => unsub();
  }, []);

  const filtered = parts.filter(p =>
    p.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.stagePunchDie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Part Master Catalog
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ฐานข้อมูลชิ้นส่วนแม่พิมพ์ฟินเพรส (Drawing Number, Category, Tool Steel Material, Unit Cost)
          </p>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by part code or name..."
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 w-64 focus:border-cyan-500 focus:outline-none"
        />
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
                <th className="py-2.5 px-3">MATERIAL / STEEL</th>
                <th className="py-2.5 px-3">COATING</th>
                <th className="py-2.5 px-3 text-right">UNIT COST (THB)</th>
                <th className="py-2.5 px-3 text-center">TUBE SIZE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(p => (
                <tr key={p.partCode} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{p.partCode}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{p.partName}</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.stagePunchDie}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{p.drawingNumber || '-'}</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.materialSteelGrade}</td>
                  <td className="py-2.5 px-3 text-amber-300">{p.surfaceCoating || 'None'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    ฿{p.unitCostThb.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center text-cyan-400">{p.tubeCompatibility.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
