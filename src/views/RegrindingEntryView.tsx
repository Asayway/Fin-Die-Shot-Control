import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Wrench,
  Sparkles,
  History
} from 'lucide-react';
import { ProductionLineId, RegrindingRecord } from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

export const RegrindingEntryView: React.FC = () => {
  const [lineId, setLineId] = useState<ProductionLineId>('E6');
  const [stageName, setStageName] = useState<string>('Louver Punch');
  const [grindingVendor, setGrindingVendor] = useState<string>('Internal Tool Room (In-House)');
  const [mmRemoved, setMmRemoved] = useState<number>(0.05);
  const [grindCycle, setGrindCycle] = useState<number>(2);
  const [maxCycles, setMaxCycles] = useState<number>(5);
  const [measuredRa, setMeasuredRa] = useState<number>(0.12);
  const [measuredHardness, setMeasuredHardness] = useState<string>('62.5 HRC');
  const [remarks, setRemarks] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [regrinds, setRegrinds] = useState<RegrindingRecord[]>([]);

  const stagesList = [
    'Bucking Punch',
    'Ironing Punch',
    'Ironing Die',
    'Louver Punch',
    'Louver Die',
    'Reflaire Punch',
    'Reflaire Die',
    'Row Slit Blade',
    'Side Cutting Punch',
    'Side Cutting Die',
    'Cut Off Punch',
    'Cut Off Die'
  ];

  const reload = () => {
    setRegrinds(storageService.getRegrindRecords());
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = storageService.getCurrentUser();
    const totalAccumulatedMm = (grindCycle * mmRemoved);

    storageService.recordRegrind({
      jobCode: `JOB-RGD-${Date.now().toString().slice(-6)}`,
      lineId,
      dieCode: `FD-${lineId}-07`,
      partCode: `PT-${stageName.replace(/\s+/g, '-').toUpperCase()}`,
      partName: stageName,
      regrindCycleCount: grindCycle,
      maxAllowedCycles: maxCycles,
      mmRemovedThisCycle: mmRemoved,
      totalMmRemovedAccumulated: totalAccumulatedMm,
      technicianName: user.name,
      grindingVendor,
      measuredHardness,
      measuredRa,
      completionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isScrappedAfterRegrind: grindCycle >= maxCycles,
      remarks
    });

    setSuccessMsg(`Re-grinding job logged successfully for ${stageName}. Total accumulated mm removed: ${totalAccumulatedMm.toFixed(3)} mm`);
    setRemarks('');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            Fin Die Tooling Re-grinding & Sharpening Entry
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            บันทึกประวัติการเจียระไนลับคมชิ้นส่วนแม่พิมพ์ (ควบคุมความหนาที่เจียรออกและจำนวนรอบสูงสุด)
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Re-grinding Work Record (บันทึกผลงานการเจียระไนลับคม)
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Production Line <span className="text-rose-400">*</span>
                </label>
                <select
                  value={lineId}
                  onChange={e => setLineId(e.target.value as ProductionLineId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'].map(l => (
                    <option key={l} value={l}>Line {l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Stage Punch / Die <span className="text-rose-400">*</span>
                </label>
                <select
                  value={stageName}
                  onChange={e => setStageName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {stagesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Grind Cycle (รอบที่) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={grindCycle}
                  onChange={e => setGrindCycle(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Max Cycles (จำกัด)
                </label>
                <input
                  type="number"
                  value={maxCycles}
                  onChange={e => setMaxCycles(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  mm Removed (เจียรออก mm) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.005"
                  value={mmRemoved}
                  onChange={e => setMmRemoved(parseFloat(e.target.value) || 0.05)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Grinding Vendor / Shop
                </label>
                <input
                  type="text"
                  value={grindingVendor}
                  onChange={e => setGrindingVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Surface Ra (µm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={measuredRa}
                  onChange={e => setMeasuredRa(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hardness (HRC)
                </label>
                <input
                  type="text"
                  value={measuredHardness}
                  onChange={e => setMeasuredHardness(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Technical Notes / Inspection Results
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optical microscope inspection: edge radius <0.01mm, no micro-cracks detected after grinding..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>COMMIT RE-GRINDING RECORD</span>
            </button>
          </form>
        </div>

        {/* Right Info */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">
            Re-grind Standards & Limits
          </h3>
          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-cyan-400 font-bold mb-1">Standard Regrind Rules:</div>
              <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                <li>One-time grind limit: 0.05 mm per cycle</li>
                <li>Max total grind depth: 0.25 mm (5 cycles max)</li>
                <li>Surface finish requirement: Ra ≤ 0.15 µm</li>
                <li>Edge radius after sharpening: r ≤ 0.015 mm</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">Cycle Wear Alert:</div>
              <div className="flex justify-between">
                <span>Current Selected Cycle:</span>
                <span className="text-cyan-300 font-bold">{grindCycle} / {maxCycles}</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded overflow-hidden mt-2 border border-slate-700">
                <div
                  className={`h-full ${grindCycle >= maxCycles ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${(grindCycle / maxCycles) * 100}%` }}
                />
              </div>
              {grindCycle >= maxCycles && (
                <div className="text-rose-400 text-[11px] mt-1.5 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>WARNING: Final regrind cycle. Part must be scrapped after this run!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regrind Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Re-grinding History Log (ประวัติการเจียระไนลับคม)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">JOB CODE</th>
                <th className="py-2.5 px-3">DATE</th>
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">PART NAME</th>
                <th className="py-2.5 px-3 text-center">CYCLE</th>
                <th className="py-2.5 px-3 text-right">MM REMOVED</th>
                <th className="py-2.5 px-3 text-right">TOTAL MM</th>
                <th className="py-2.5 px-3">HARDNESS</th>
                <th className="py-2.5 px-3">TECHNICIAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {regrinds.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-cyan-300 font-bold">{r.jobCode}</td>
                  <td className="py-2 px-3 text-slate-400">{r.completionDate}</td>
                  <td className="py-2 px-3">Line {r.lineId}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{r.partName}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {r.regrindCycleCount}/{r.maxAllowedCycles}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400">-{r.mmRemovedThisCycle.toFixed(3)} mm</td>
                  <td className="py-2 px-3 text-right text-slate-200">-{r.totalMmRemovedAccumulated.toFixed(3)} mm</td>
                  <td className="py-2 px-3 text-slate-300">{r.measuredHardness || '62 HRC'}</td>
                  <td className="py-2 px-3 text-slate-300">{r.technicianName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
