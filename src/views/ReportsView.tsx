import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { formatShots, formatThb } from '../services/calculationService';

export const ReportsView: React.FC = () => {
  const [replacements, setReplacements] = useState<any[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);

  useEffect(() => {
    setReplacements(storageService.getReplacements());
    setLineConfigs(storageService.getLineConfigs());
  }, []);

  const handleExportCSV = () => {
    const data = storageService.getReplacements();
    const headers = 'ID,Timestamp,Line,DieCode,PartName,Type,ShotAtReplacement,Qty,Reason,Operator\n';
    const rows = data.map(d => `"${d.id}","${d.timestamp}","${d.lineId}","${d.dieCode}","${d.partName}","${d.replacementType}",${d.shotAtReplacement},${d.replacedQty},"${d.reason}","${d.operatorName}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinDie_Shot_Replacement_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Fin Die Tooling Analytics & MTBF Reports
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/80 shadow-sm ml-2">
              SAMPLE DATA - NOT FOR PRODUCTION
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            รายงานสถิติอัตราสิ้นเปลืองอะไหล่แม่พิมพ์ ค่าเฉลี่ยช็อตระหว่างการเปลี่ยน (MTBF) และประมาณการต้นทุน
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-all shadow font-mono"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EXPORT CSV / EXCEL REPORT</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">TOTAL TOOL CHANGEOVERS</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{replacements.length} Events</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 8 production lines</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">AVG MTBF (MEAN SHOTS)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">48.2M Shots</div>
          <div className="text-[11px] text-slate-500 mt-1">Avg run before sharpening</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">EST. SPARE CONSUMPTION</div>
          <div className="text-2xl font-black text-amber-300 mt-1">฿1,420,000</div>
          <div className="text-[11px] text-slate-500 mt-1">Rolling 90-day period</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">RE-GRIND SAVINGS</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">฿3,850,000</div>
          <div className="text-[11px] text-slate-500 mt-1">Saved vs new tool purchase</div>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm">
          Tooling Consumption & Life Performance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
            <div className="text-slate-400 font-bold">Top High-Wear Stages (ความถี่ในการเปลี่ยนสูงสุด)</div>
            <div className="space-y-2">
              {[
                { name: 'Louver Punch (40M / 100M Standard)', wear: 97, count: 18 },
                { name: 'Side Cutting Punch (15M / 50M Standard)', wear: 88, count: 12 },
                { name: 'Ironing Punch (45M / 100M Standard)', wear: 78, count: 9 },
                { name: 'Cut Off Die (12M / 40M Standard)', wear: 65, count: 6 },
              ].map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-slate-200">
                    <span>{item.name}</span>
                    <span className="font-bold text-amber-300">{item.count} Changes</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden border border-slate-800">
                    <div className="bg-cyan-500 h-full" style={{ width: `${item.wear}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
            <div className="text-slate-400 font-bold">Material Abrasiveness Impact</div>
            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>PCM (Pre-Coated):</span>
                <span className="text-amber-400 font-bold">100% Base Wear Rate (Standard)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>GOLD (Hydrophilic):</span>
                <span className="text-cyan-400 font-bold">115% Faster Edge Blunting</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>BARE (Bare Aluminum):</span>
                <span className="text-emerald-400 font-bold">85% Lower Tool Wear</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-thai">
              * ข้อมูลอ้างอิงจากเกณฑ์อายุการใช้งาน Excel 31.01.2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserApprovalView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);

  useEffect(() => {
    setUsers(storageService.getUsers());
    setReplacements(storageService.getReplacements());
  }, []);

  const pendingApprovals = replacements.filter(r => r.approvalStatus === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Role-Based Access Control & Approvals</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-thai">
          จัดการสิทธิ์ผู้ใช้งาน (Admin, Supervisor, Die Specialist, Maintenance Tech, Operator) และคิวอนุมัติการเปลี่ยนอะไหล่
        </p>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">System Users & Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => (
            <div key={u.id} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{u.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 text-[10px]">
                  {u.role}
                </span>
              </div>
              <div className="text-slate-400">{u.nameTh}</div>
              <div className="text-slate-500 text-[10px]">{u.department} • ID: {u.employeeId}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs(storageService.getAuditLogs());
    const unsub = storageService.subscribe(() => setLogs(storageService.getAuditLogs()));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-white tracking-tight">
          System-Wide Immutable Audit Log
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-thai">
          บันทึกประวัติการเปลี่ยนแปลงทั้งหมดในระบบ (การแก้ไขเกณฑ์อายุ, การปรับแต่งสเปกแม่พิมพ์, การบันทึกช็อต และการเปลี่ยนอะไหล่)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">USER</th>
                <th className="py-2.5 px-3">ROLE</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">LINE</th>
                <th className="py-2.5 px-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/50">
                  <td className="py-2 px-3 text-slate-400">{l.timestamp}</td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{l.userName}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                      {l.userRole}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-amber-300 font-bold">{l.actionCategory}</td>
                  <td className="py-2 px-3 text-slate-300">{l.lineId ? `Line ${l.lineId}` : '-'}</td>
                  <td className="py-2 px-3 text-slate-300">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
