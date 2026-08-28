import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  FileText,
  Calendar,
  Truck
} from 'lucide-react';
import { SpareStockItem, OrderStatus } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb } from '../services/calculationService';
import { Badge } from '../components/common/Badge';

export const SpareStockProcurementView: React.FC = () => {
  const [stocks, setStocks] = useState<SpareStockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedStock, setSelectedStock] = useState<SpareStockItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reload = () => {
    const data = storageService.getSpareStocks();
    setStocks(data);
    if (data.length > 0 && !selectedStock) {
      setSelectedStock({ ...data[0] });
    }
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const filtered = stocks.filter(s => {
    const matchSearch =
      s.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || s.orderStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    storageService.saveSpareStock(selectedStock);
    setSuccessMsg(`Procurement and inventory status updated for ${selectedStock.partName}`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Fin Die Spare Parts Inventory & Procurement Monitor
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ติดตามสต็อกอะไหล่สำรอง (Backup Quantity), สถานะใบขอซื้อ/ใบสั่งซื้อ (PR/PO), และประเมินความเสี่ยงการส่งมอบล่าช้า (Delivery Risk)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search part or supplier..."
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 w-52 focus:border-cyan-500 focus:outline-none"
          />

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="NOT REQUIRED">NOT REQUIRED</option>
            <option value="PR PREPARING">PR PREPARING</option>
            <option value="PO OPEN">PO OPEN</option>
            <option value="ORDERED">ORDERED</option>
            <option value="ARRIVED">ARRIVED</option>
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
        {/* Table */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm">
            Spare Parts Warehouse Inventory & PO Status
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">PART CODE / NAME</th>
                  <th className="py-2.5 px-2 text-center">STOCK (EA)</th>
                  <th className="py-2.5 px-2 text-center">TARGET</th>
                  <th className="py-2.5 px-2 text-center">STATUS</th>
                  <th className="py-2.5 px-2">PO NO.</th>
                  <th className="py-2.5 px-2">PO ETA</th>
                  <th className="py-2.5 px-3">SUPPLIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(s => {
                  const isSelected = selectedStock?.id === s.id;
                  const isLow = s.currentStockQty < s.safetyStockQty;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStock({ ...s })}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/70 border-l-4 border-cyan-400 text-cyan-100' : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-100">{s.partName}</div>
                        <div className="text-[10px] text-slate-500">{s.partCode}</div>
                      </td>
                      <td className={`py-2.5 px-2 text-center font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {s.currentStockQty}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-400">
                        {s.backupTargetQty}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge orderStatus={s.orderStatus} />
                      </td>
                      <td className="py-2.5 px-2 text-cyan-300 font-bold">{s.poNumber || '-'}</td>
                      <td className="py-2.5 px-2 text-slate-300">{s.poEtaDate || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]">{s.supplierName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Editor */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3">
            Inventory & PO Editor
          </h3>

          {selectedStock ? (
            <form onSubmit={handleUpdateStock} className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-sm font-bold text-cyan-300">{selectedStock.partName}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Code: {selectedStock.partCode}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Current Stock (EA)</label>
                  <input
                    type="number"
                    value={selectedStock.currentStockQty}
                    onChange={e => setSelectedStock({ ...selectedStock, currentStockQty: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-emerald-400 font-bold text-sm focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Backup Target (EA)</label>
                  <input
                    type="number"
                    value={selectedStock.backupTargetQty}
                    onChange={e => setSelectedStock({ ...selectedStock, backupTargetQty: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Order Status</label>
                <select
                  value={selectedStock.orderStatus}
                  onChange={e => setSelectedStock({ ...selectedStock, orderStatus: e.target.value as OrderStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-amber-300 font-bold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="NOT REQUIRED">NOT REQUIRED</option>
                  <option value="PR PREPARING">PR PREPARING</option>
                  <option value="PO OPEN">PO OPEN</option>
                  <option value="ORDERED">ORDERED</option>
                  <option value="ARRIVED">ARRIVED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">PO Number</label>
                  <input
                    type="text"
                    value={selectedStock.poNumber || ''}
                    onChange={e => setSelectedStock({ ...selectedStock, poNumber: e.target.value })}
                    placeholder="PO-2025-089"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">PO ETA Date</label>
                  <input
                    type="date"
                    value={selectedStock.poEtaDate || ''}
                    onChange={e => setSelectedStock({ ...selectedStock, poEtaDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={selectedStock.supplierName}
                  onChange={e => setSelectedStock({ ...selectedStock, supplierName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                COMMIT STOCK & PO CHANGES
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const ReplacementHistoryView: React.FC = () => {
  const [replacements, setReplacements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setReplacements(storageService.getReplacements());
    const unsub = storageService.subscribe(() => setReplacements(storageService.getReplacements()));
    return () => unsub();
  }, []);

  const filtered = replacements.filter(r =>
    r.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.lineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.replacementType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Fin Die Tooling Replacement Audit Trail
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ประวัติการเปลี่ยนอะไหล่แม่พิมพ์ทั้งหมด พร้อมยอดช็อตสะสม สาเหตุ และผู้ปฏิบัติงาน
          </p>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter by part, line, reason..."
          className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 w-64 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">RECORD ID</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">PART / STAGE</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3 text-right">SHOT AT CHANGE</th>
                <th className="py-2.5 px-3 text-center">QTY</th>
                <th className="py-2.5 px-3">REASON</th>
                <th className="py-2.5 px-3">OPERATOR</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{r.id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-white">Line {r.lineId}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{r.stageName || r.partName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {r.replacementType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-400">
                    {formatShots(r.shotAtReplacement)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-cyan-300 font-bold">{r.replacedQty}</td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px] truncate max-w-[180px]">{r.reason}</td>
                  <td className="py-2.5 px-3 text-slate-300">{r.operatorName}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.approvalStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {r.approvalStatus}
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
