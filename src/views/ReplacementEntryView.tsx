import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  History,
  ShieldAlert
} from 'lucide-react';
import { 
  ProductionLineId, 
  ReplacementType, 
  ReplacementRecord, 
  LineLiveMonitoringData,
  PartLiveTrackingItem,
  SpareStockItem
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

interface ReplacementEntryViewProps {
  initialLineId?: ProductionLineId;
}

export const ReplacementEntryView: React.FC<ReplacementEntryViewProps> = ({ initialLineId = 'E6' }) => {
  const [selectedLineId, setSelectedLineId] = useState<ProductionLineId>(initialLineId);
  const [lineData, setLineData] = useState<LineLiveMonitoringData | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('Louver Punch');
  const [replacementType, setReplacementType] = useState<ReplacementType>('FULL_SET');
  const [replacedQty, setReplacedQty] = useState<number>(168);
  const [reason, setReason] = useState<string>('Normal Life Limit Reached');
  const [positionNotes, setPositionNotes] = useState<string>('Full set all rows');
  const [burrHeightAtChange, setBurrHeightAtChange] = useState<number>(0.038);
  const [remarks, setRemarks] = useState<string>('');
  const [stocks, setStocks] = useState<SpareStockItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const linesList: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  const reload = () => {
    const ld = storageService.getLineMonitoring(selectedLineId);
    setLineData(ld);
    setStocks(storageService.getSpareStocks());
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, [selectedLineId]);

  // When stage changes, automatically update the default quantity based on install qty
  useEffect(() => {
    if (lineData) {
      const activePart = lineData.items.find(i => i.stagePunchDie === selectedStage || i.partName === selectedStage);
      if (activePart) {
        if (replacementType === 'FULL_SET') {
          setReplacedQty(activePart.installQty);
        }
      }
    }
  }, [selectedStage, replacementType, lineData]);

  const activePart = lineData?.items.find(i => i.stagePunchDie === selectedStage || i.partName === selectedStage);
  const matchedStock = stocks.find(s => s.partName === selectedStage || s.partCode === activePart?.partCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePart || !lineData) return;

    const user = storageService.getCurrentUser();

    storageService.recordReplacement({
      lineId: selectedLineId,
      dieCode: lineData.activeConfig?.dieCode || 'N/A',
      partCode: activePart.partCode,
      partName: activePart.partName,
      stageName: selectedStage,
      replacementType,
      reason,
      shotAtReplacement: activePart.currentShot,
      lifeLimitAtReplacement: activePart.lifeLimit,
      replacedQty,
      operatorName: user.name,
      operatorId: user.employeeId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      regrindCycleCount: activePart.regrindCount,
      positionNotes,
      burrHeightAtChange,
      remarks
    });

    setSuccessMsg(`Replacement successfully logged for ${selectedStage} on Line ${selectedLineId}. Tool shot reset to 0.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Fin Die Tooling Replacement & Swap Entry
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            บันทึกการเปลี่ยนอะไหล่แม่พิมพ์ (เปลี่ยนทั้งชุด / สลับชุดเจียระไน / เปลี่ยนเฉพาะแถว / ปลดระวาง Scrap)
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (Col 7) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Replacement Work Order (ใบสั่งงานเปลี่ยนชิ้นส่วน)</span>
            <span className="text-xs font-mono text-cyan-400">Line: {selectedLineId}</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Stage */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Stage Punch / Die <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedStage}
                  onChange={e => setSelectedStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  {lineData?.items.map(item => (
                    <option key={item.slotId} value={item.stagePunchDie}>
                      {item.stagePunchDie} ({item.usagePercent}% life - {formatShots(item.currentShot)} shots)
                    </option>
                  ))}
                </select>
              </div>

              {/* Replacement Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Replacement Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={replacementType}
                  onChange={e => setReplacementType(e.target.value as ReplacementType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="FULL_SET">FULL_SET (เปลี่ยนยกชุดทั้งโมดูล)</option>
                  <option value="PARTIAL_POSITION">PARTIAL_POSITION (เปลี่ยนเฉพาะตำแหน่ง/แถว)</option>
                  <option value="RE_GROUND">RE_GROUND (สลับชุดผ่านการเจียระไนลับคม)</option>
                  <option value="EMERGENCY">EMERGENCY (เปลี่ยนฉุกเฉิน / คมบิ่นแตกระหว่างกะ)</option>
                  <option value="SCRAP">SCRAP (ปลดระวาง / หมดสภาพถาวร)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity Replaced (EA) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={replacedQty}
                  onChange={e => setReplacedQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Burr height at change */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Measured Burr Height (mm) (ความสูงครีบ)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={burrHeightAtChange}
                  onChange={e => setBurrHeightAtChange(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 0.038"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Reason for Replacement (สาเหตุการเปลี่ยน) <span className="text-rose-400">*</span>
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Normal Life Limit Reached">Normal Life Limit Reached (ครบเกณฑ์อายุการใช้งานตามสเปก)</option>
                <option value="High Burr Exceeding Drawing Spec (>0.05mm)">High Burr Exceeding Drawing Spec (ครีบฟินสูงเกินสเปก)</option>
                <option value="Chipped Cutting Edge">Chipped Cutting Edge (คมตัดบิ่น/แตก)</option>
                <option value="Severe Galling / Aluminum Sticking">Severe Galling / Aluminum Sticking (อลูมิเนียมติดอัดแน่น)</option>
                <option value="Scheduled Die PM Overhaul">Scheduled Die PM Overhaul (การซ่อมบำรุงแม่พิมพ์ตามรอบ)</option>
                <option value="Crack / Fracture Detected">Crack / Fracture Detected (ตรวจพบรอยร้าว)</option>
              </select>
            </div>

            {/* Position Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Installed Position / Cavity Location (ตำแหน่งแถว/พิกัดในแม่พิมพ์)
              </label>
              <input
                type="text"
                value={positionNotes}
                onChange={e => setPositionNotes(e.target.value)}
                placeholder="e.g. Row 2-4, Punch #18 to #32"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Technician Remarks & Observation (บันทึกช่างเทคนิค)
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Additional notes on tool condition, clearance adjustments, or trial stamp results..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>COMMIT REPLACEMENT & RESET TOOL SHOT TO 0</span>
            </button>
          </form>
        </div>

        {/* Right Details Card (Col 5) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Target Part Snapshot</span>
              <span className="text-xs font-mono text-emerald-400">Line {selectedLineId}</span>
            </h3>

            {activePart && (
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-slate-400 font-bold text-sm text-cyan-300">
                    {activePart.stagePunchDie}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Part Code: {activePart.partCode}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">CURRENT SHOT</div>
                    <div className="text-sm font-bold text-rose-400 mt-0.5">
                      {formatShots(activePart.currentShot)}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">LIFE LIMIT</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {formatShots(activePart.lifeLimit)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Life Usage:</span>
                    <span className="font-bold text-rose-400">{activePart.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded overflow-hidden border border-slate-700">
                    <div
                      className={`h-full ${activePart.usagePercent >= 95 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, activePart.usagePercent)}%` }}
                    />
                  </div>
                </div>

                {/* Stock Readiness */}
                <div className="bg-slate-950/80 p-3 rounded border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-bold">Warehouse Stock Readiness:</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Installed in Die:</span>
                    <span className="font-bold text-slate-100">{activePart.installQty} EA</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Available Backup Stock:</span>
                    <span className={`font-bold ${matchedStock && matchedStock.currentStockQty < activePart.installQty ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {matchedStock ? `${matchedStock.currentStockQty} EA` : `${activePart.backupQty} EA`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Order / PO Status:</span>
                    <span className="font-bold text-amber-300">{activePart.orderStatus}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-thai border-t border-slate-800 pt-3">
            * การบันทึกการเปลี่ยนอะไหล่จะตัดยอดสต็อกในคลัง และบันทึกประวัติการเปลี่ยนโดยอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
};
