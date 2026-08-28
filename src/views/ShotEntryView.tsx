import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Cpu, 
  RotateCcw, 
  History, 
  CheckCircle2, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProductionLineId, ShotEntryRecord, LineLiveMonitoringData } from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

interface ShotEntryViewProps {
  initialLineId?: ProductionLineId;
}

export const ShotEntryView: React.FC<ShotEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [shotsInput, setShotsInput] = useState<string>('50000');
  const [shift, setShift] = useState<'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)'>('Shift 1 (Day)');
  const [notes, setNotes] = useState<string>('');
  const [shotLogs, setShotLogs] = useState<ShotEntryRecord[]>([]);
  const [currentLine, setCurrentLine] = useState<LineLiveMonitoringData | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const reload = () => {
    setCurrentLine(storageService.getLineMonitoring(selectedLineId));
    setShotLogs(storageService.getShotLogs());
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, [selectedLineId]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shots = parseInt(shotsInput.replace(/,/g, ''), 10);
    if (isNaN(shots) || shots <= 0) {
      alert('Please enter a valid positive number of shots');
      return;
    }

    storageService.addShotEntry(selectedLineId, shots, 'MANUAL_SHIFT', shift, notes || 'Manual shift end log');
    setSuccessMsg(`Successfully added ${shots.toLocaleString()} shots to Line ${selectedLineId}`);
    setNotes('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleQuickAdd = (qty: number) => {
    storageService.addShotEntry(selectedLineId, qty, 'AUTOMATIC_PLC', shift, `Quick test pulse +${qty.toLocaleString()}`);
    setSuccessMsg(`Simulated +${qty.toLocaleString()} shots for Line ${selectedLineId}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            Fin Press Shot Counter Entry
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            บันทึกยอดช็อตการผลิตของเครื่อง Fin Press (รองรับทั้งแบบป้อนข้อมูลกะและสัญญาณ PLC อัตโนมัติ)
          </p>
        </div>

        {/* Line Tabs */}
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
              {line}
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

      {/* Main Grid: Form + Live Line Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Entry Form (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Shift Shot Entry Form (บันทึกยอดประจำกะ)</span>
            </div>
            <span className="text-xs font-mono text-cyan-400">Target Line: {selectedLineId}</span>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Production Line */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Production Line <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedLineId}
                  onChange={e => setSelectedLineId(e.target.value as ProductionLineId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {linesList.map(line => (
                    <option key={line} value={line}>Line {line} (L{line}-1)</option>
                  ))}
                </select>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Work Shift (กะการทำงาน) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Shift 1 (Day)">Shift 1 (Day: 08:00 - 20:00)</option>
                  <option value="Shift 2 (Night)">Shift 2 (Night: 20:00 - 08:00)</option>
                  <option value="Shift 3 (Overtime)">Shift 3 (Overtime)</option>
                </select>
              </div>
            </div>

            {/* Shots Added */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Shots to Add (จำนวนช็อตที่ปั๊มเพิ่ม) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={shotsInput}
                onChange={e => setShotsInput(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2.5 text-base font-mono text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
                required
              />
              <div className="flex gap-2 mt-2">
                {[10000, 50000, 100000, 250000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setShotsInput(String(val))}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 rounded border border-slate-700"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes & Production Batch (หมายเหตุ / ล็อตผลิต)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Batch PCM-0.10mm Coil #A-489"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>COMMIT SHOT ENTRY TO LINE {selectedLineId}</span>
            </button>
          </form>

          {/* Simulated PLC Quick Pulses */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>PLC Optical Sensor Simulator (จำลองสัญญาณพัลส์จาก PLC)</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickAdd(500)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded text-xs font-mono"
              >
                +500 Pulse
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(2500)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded text-xs font-mono"
              >
                +2,500 Pulse
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10000)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 rounded text-xs font-mono"
              >
                +10,000 Pulse
              </button>
            </div>
          </div>
        </div>

        {/* Right: Current Line Live Status (Col 5) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="font-bold text-slate-100">
                Line {selectedLineId} Live Telemetry
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {currentLine?.machineStatus || 'RUNNING'}
              </span>
            </div>

            {currentLine && (
              <div className="mt-4 space-y-3 font-mono">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-xs text-slate-500">MACHINE SHOT TOTAL</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {formatShots(currentLine.machineShotTotal)} <span className="text-xs font-normal text-slate-400">Shots</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">CURRENT SHIFT</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(currentLine.shiftShot)}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">TODAY TOTAL</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(currentLine.dailyShot)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400 font-bold">Active Tooling Config:</div>
                  <div className="text-slate-300">Die Code: <span className="text-cyan-300">{currentLine.activeConfig?.dieCode}</span></div>
                  <div className="text-slate-300">Material: <span className="text-cyan-300">{currentLine.activeConfig?.material} ({currentLine.activeConfig?.thicknessMm}mm)</span></div>
                  <div className="text-slate-300">Tube Size: <span className="text-cyan-300">{currentLine.activeConfig?.tubeSize}</span></div>
                  <div className="text-slate-300">Fin Type: <span className="text-cyan-300">{currentLine.activeConfig?.finType}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-thai border-t border-slate-800 pt-3">
            * ทุกยอดช็อตที่บันทึกจะถูกคำนวณสะสมไปยังชิ้นส่วนแม่พิมพ์ทุกชิ้นที่ติดตั้งบนสายนี้แบบอัตโนมัติ
          </div>
        </div>
      </div>

      {/* Historical Shot Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Recent Shot Entry Log (ประวัติการบันทึกช็อตล่าสุด)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Showing latest entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">SHIFT</th>
                <th className="py-2.5 px-3 text-right">SHOTS ADDED</th>
                <th className="py-2.5 px-3 text-right">NEW TOTAL</th>
                <th className="py-2.5 px-3">OPERATOR</th>
                <th className="py-2.5 px-3">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {shotLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-slate-400">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                  <td className="py-2 px-3 font-bold text-cyan-300">Line {log.lineId}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      log.entryType === 'AUTOMATIC_PLC' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.entryType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">{log.shift}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">+{formatShots(log.shotsAdded)}</td>
                  <td className="py-2 px-3 text-right text-slate-200">{formatShots(log.newTotal)}</td>
                  <td className="py-2 px-3 text-slate-300">{log.operatorName}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[200px]">{log.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
