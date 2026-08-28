import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Search, 
  Filter, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Layers,
  Sparkles
} from 'lucide-react';
import { PartLifeStandard, FinMaterial, TubeDiameter } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb, generateCompositeKey } from '../services/calculationService';

export const PartLifeStandardSetupView: React.FC = () => {
  const [standards, setStandards] = useState<PartLifeStandard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedTube, setSelectedTube] = useState<string>('ALL');
  const [selectedStandard, setSelectedStandard] = useState<PartLifeStandard | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reload = () => {
    const data = storageService.getLifeStandards();
    setStandards(data);
    if (data.length > 0 && !selectedStandard) {
      setSelectedStandard({ ...data[0] });
    }
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const filtered = standards.filter(s => {
    const matchSearch = 
      s.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.configKey.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stagePunchDie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMat = selectedMaterial === 'ALL' || s.configKey.material.toUpperCase() === selectedMaterial.toUpperCase();
    const matchTube = selectedTube === 'ALL' || s.configKey.tubeSize === selectedTube;
    return matchSearch && matchMat && matchTube;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStandard) return;

    // Recalculate composite key string
    const compKey = generateCompositeKey(selectedStandard.configKey);
    const updated = {
      ...selectedStandard,
      compositeKeyString: compKey
    };

    storageService.saveLifeStandard(updated);
    setSuccessMsg(`Life standard saved successfully for ${updated.partName} (${formatShots(updated.lifeLimitShots)} shots)`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Fin Die Part Life Standard Matrix Setup
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            กำหนดเกณฑ์อายุการใช้งานชิ้นส่วนแม่พิมพ์ (Life Limit Shots) ตามระบบ 10 Composite Keys จากไฟล์ Excel
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search part name or code..."
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 w-52 focus:border-cyan-500 focus:outline-none"
          />

          <select
            value={selectedMaterial}
            onChange={e => setSelectedMaterial(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Materials</option>
            <option value="PCM">PCM</option>
            <option value="GOLD">GOLD</option>
            <option value="BARE">BARE</option>
          </select>

          <select
            value={selectedTube}
            onChange={e => setSelectedTube(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Tubes</option>
            <option value="Ø5">Ø5</option>
            <option value="Ø7">Ø7</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Master Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">
              Standard Registry ({filtered.length} Items Configured)
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Click row to inspect/edit</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-950 z-10">
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2.5">STAGE / PART</th>
                  <th className="py-2 px-2 text-center">MAT</th>
                  <th className="py-2 px-2 text-center">TUBE</th>
                  <th className="py-2 px-2 text-right">LIFE LIMIT</th>
                  <th className="py-2 px-2 text-center">REGRIND</th>
                  <th className="py-2 px-2 text-right">EST. COST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(s => {
                  const isSelected = selectedStandard?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStandard({ ...s })}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/70 text-cyan-200 border-l-4 border-cyan-400' : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-medium">
                        <div className="text-slate-100 font-bold">{s.partName}</div>
                        <div className="text-[10px] text-slate-500">{s.configKey.partCode} • {s.stagePunchDie}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-300">
                        {s.configKey.material}
                      </td>
                      <td className="py-2.5 px-2 text-center text-cyan-400">
                        {s.configKey.tubeSize}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-emerald-400">
                        {formatShots(s.lifeLimitShots)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[10px]">
                        {s.regrindStandard.disposeAfterUse ? (
                          <span className="text-rose-400">1-Use</span>
                        ) : (
                          <span className="text-slate-300">{s.regrindStandard.maxRegrindCount}x ({s.regrindStandard.oneTimeRegrindMm}mm)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">
                        {formatThb(s.estimatedCostThb || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed 10-Key Standard Editor */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Life Standard Editor</span>
            <span className="text-xs font-mono text-cyan-400">{selectedStandard?.configKey.partCode}</span>
          </h3>

          {selectedStandard ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">10-Composite Key String</div>
                <div className="text-xs text-cyan-300 break-all font-bold">
                  {selectedStandard.compositeKeyString || generateCompositeKey(selectedStandard.configKey)}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Part Name</label>
                <input
                  type="text"
                  value={selectedStandard.partName}
                  onChange={e => setSelectedStandard({ ...selectedStandard, partName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Life Limit (Shots) *</label>
                  <input
                    type="number"
                    step="10000"
                    value={selectedStandard.lifeLimitShots}
                    onChange={e => setSelectedStandard({ ...selectedStandard, lifeLimitShots: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 font-bold text-emerald-400 text-sm focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Est. Part Cost (THB)</label>
                  <input
                    type="number"
                    value={selectedStandard.estimatedCostThb || 0}
                    onChange={e => setSelectedStandard({ ...selectedStandard, estimatedCostThb: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Material</label>
                  <select
                    value={selectedStandard.configKey.material}
                    onChange={e => setSelectedStandard({
                      ...selectedStandard,
                      configKey: { ...selectedStandard.configKey, material: e.target.value as FinMaterial }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-amber-300"
                  >
                    <option value="PCM">PCM</option>
                    <option value="GOLD">GOLD</option>
                    <option value="BARE">BARE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tube Size</label>
                  <select
                    value={selectedStandard.configKey.tubeSize}
                    onChange={e => setSelectedStandard({
                      ...selectedStandard,
                      configKey: { ...selectedStandard.configKey, tubeSize: e.target.value as TubeDiameter }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-cyan-300"
                  >
                    <option value="Ø5">Ø5</option>
                    <option value="Ø7">Ø7</option>
                    <option value="Ø9.52">Ø9.52</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedStandard.configKey.thicknessMm || 0.10}
                    onChange={e => setSelectedStandard({
                      ...selectedStandard,
                      configKey: { ...selectedStandard.configKey, thicknessMm: parseFloat(e.target.value) || 0.10 }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              {/* Re-grinding Standard Setup */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-400">Re-grinding Specification</div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="disposeCheck"
                    checked={selectedStandard.regrindStandard.disposeAfterUse}
                    onChange={e => setSelectedStandard({
                      ...selectedStandard,
                      regrindStandard: { ...selectedStandard.regrindStandard, disposeAfterUse: e.target.checked }
                    })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                  />
                  <label htmlFor="disposeCheck" className="text-slate-300">
                    Dispose After 1 Use (ห้ามเจียรซ้ำ / ปลดระวางทันทีหลังครบอายุ)
                  </label>
                </div>

                {!selectedStandard.regrindStandard.disposeAfterUse && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <div className="text-slate-500 text-[10px]">1-Time mm</div>
                      <input
                        type="number"
                        step="0.005"
                        value={selectedStandard.regrindStandard.oneTimeRegrindMm}
                        onChange={e => setSelectedStandard({
                          ...selectedStandard,
                          regrindStandard: { ...selectedStandard.regrindStandard, oneTimeRegrindMm: parseFloat(e.target.value) || 0.05 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Max Cycles</div>
                      <input
                        type="number"
                        value={selectedStandard.regrindStandard.maxRegrindCount}
                        onChange={e => setSelectedStandard({
                          ...selectedStandard,
                          regrindStandard: { ...selectedStandard.regrindStandard, maxRegrindCount: parseInt(e.target.value, 10) || 5 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Total Max mm</div>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedStandard.regrindStandard.totalRegrindMm}
                        onChange={e => setSelectedStandard({
                          ...selectedStandard,
                          regrindStandard: { ...selectedStandard.regrindStandard, totalRegrindMm: parseFloat(e.target.value) || 0.25 }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Standard Change Interval Notes</label>
                <input
                  type="text"
                  value={selectedStandard.changeIntervalNotes || ''}
                  onChange={e => setSelectedStandard({ ...selectedStandard, changeIntervalNotes: e.target.value })}
                  placeholder="e.g. Standard change every 3 months or upon burr >0.04mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE & COMMIT LIFE STANDARD CONFIGURATION</span>
              </button>
            </form>
          ) : (
            <div className="text-slate-500 text-center py-12">
              Select a part from the table to view and edit its standard configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const InstallQuantitySetupView: React.FC = () => {
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    setLines(storageService.getLineConfigs());
  }, []);

  // Installed Part Quantity Matrix extracted from Excel Sheet
  const installMatrix = [
    { no: 1, part: 'Bucking Punch', code: 'PT-BP-01', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 2, part: 'Ironing Punch', code: 'PT-IP-02', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 3, part: 'Ironing Die', code: 'PT-ID-03', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 4, part: 'Louver Punch', code: 'PT-LP-04', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 5, part: 'Louver Die', code: 'PT-LD-05', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 6, part: 'Reflaire Punch', code: 'PT-RP-06', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 7, part: 'Reflaire Die', code: 'PT-RD-07', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 8, part: 'Row Slit Blade', code: 'PT-RS-08', e1: 42, e2: 42, e3_1: 42, e3_2: 42, e3_3: 42, e4: 42, e5: 42, e6: 42, total: 336 },
    { no: 9, part: 'Side Cutting Punch', code: 'PT-SCP-09', e1: 8, e2: 8, e3_1: 8, e3_2: 8, e3_3: 8, e4: 8, e5: 8, e6: 8, total: 64 },
    { no: 10, part: 'Side Cutting Die', code: 'PT-SCD-10', e1: 8, e2: 8, e3_1: 8, e3_2: 8, e3_3: 8, e4: 8, e5: 8, e6: 8, total: 64 },
    { no: 11, part: 'Cut Off Punch', code: 'PT-COP-11', e1: 4, e2: 4, e3_1: 4, e3_2: 4, e3_3: 4, e4: 4, e5: 4, e6: 4, total: 32 },
    { no: 12, part: 'Cut Off Die', code: 'PT-COD-12', e1: 4, e2: 4, e3_1: 4, e3_2: 4, e3_3: 4, e4: 4, e5: 4, e6: 4, total: 32 }
  ];

  const grandTotal = installMatrix.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Installed Part Quantity Matrix (E1 - E6)
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตารางจำนวนชิ้นส่วนที่ติดตั้งในแม่พิมพ์แต่ละสายการผลิต (อ้างอิงจาก Excel Sheet Total: 11,281 ชิ้นทั่วทั้งโรงงาน)
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2 rounded border border-slate-800 font-mono text-right">
          <div className="text-[10px] text-slate-500 font-bold">TOTAL ACTIVE TOOLING IN FACTORY</div>
          <div className="text-base font-bold text-cyan-300">11,281 EA (All Lines)</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-2 text-center">No.</th>
                <th className="py-2.5 px-3">STAGE PUNCH / DIE</th>
                <th className="py-2.5 px-3">PART CODE</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E1</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E2</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-1</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-2</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-3</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E4</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E5</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E6</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">TOTAL (EA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {installMatrix.map(row => (
                <tr key={row.no} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-2 text-center text-slate-500 font-bold">{row.no}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{row.part}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.code}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e1}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e2}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_1}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_2}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_3}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e4}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e5}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e6}</td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-400">{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-100">
                <td colSpan={3} className="py-3 px-3 text-right text-slate-400">GRAND TOTAL INSTALLED PARTS:</td>
                <td colSpan={8} className="py-3 px-2 text-center text-cyan-300">1,073 EA / Line Avg</td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm font-black">{grandTotal.toLocaleString()} EA</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
