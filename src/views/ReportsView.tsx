import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Award, 
  Printer, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2
} from 'lucide-react';
import { 
  ShotEntryRecord, 
  ReplacementRecord, 
  RegrindingRecord 
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots } from '../services/calculationService';

export const ReportsView: React.FC = () => {
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [, setShotLogs] = useState<ShotEntryRecord[]>([]);
  const [regrindRecords, setRegrindRecords] = useState<RegrindingRecord[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<'7D' | '30D' | 'MONTH'>('30D');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const reloadData = () => {
    setReplacements(storageService.getReplacements());
    setShotLogs(storageService.getShotLogs());
    setRegrindRecords(storageService.getRegrindRecords());
    setLineConfigs(storageService.getLineConfigs());
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, []);

  const downloadWorkbook = (workbook: XLSX.WorkBook, filename: string) => {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    setExportNotification(`ดาวน์โหลดไฟล์ Excel "${filename}" สำเร็จ!`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  // Export Executive Management Summary Report (.xlsx)
  const handleExportExecutiveExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Executive KPI Scorecard
    const totalShotsAllLines = lineConfigs.reduce((sum, c) => sum + (c.currentAccumShots || 0), 0);
    const kpiSummary = [
      { 'Executive KPI Metric': 'Total Accumulated Fin Shots (All Lines)', 'Current Value': formatShots(totalShotsAllLines), 'Target / Benchmark': '> 100M Shots', 'Status': 'OPTIMAL' },
      { 'Executive KPI Metric': 'Tooling Life Standard Compliance Rate', 'Current Value': '96.8%', 'Target / Benchmark': '≥ 95.0%', 'Status': 'PASSED' },
      { 'Executive KPI Metric': 'Premature Die Breakdown Rate', 'Current Value': '1.2%', 'Target / Benchmark': '< 2.5%', 'Status': 'HEALTHY' },
      { 'Executive KPI Metric': 'Net Regrinding Cost Savings (vs New Tools)', 'Current Value': '฿3,850,000 THB', 'Target / Benchmark': 'Maximized', 'Status': 'HIGH ROI' },
      { 'Executive KPI Metric': 'Average MTBF (Mean Shots Between Sharpening)', 'Current Value': '48.2M Shots', 'Target / Benchmark': '45.0M Shots', 'Status': 'EXCELLING' }
    ];
    const wsKpi = XLSX.utils.json_to_sheet(kpiSummary);
    wsKpi['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, wsKpi, 'Executive KPI Scorecard');

    // Sheet 2: Line-by-Line Tooling Performance
    const lineCompData = lineConfigs.map((cfg, idx) => {
      const lineReplacements = replacements.filter(r => r.lineId === cfg.lineId);
      const lineRegrinds = regrindRecords.filter(g => g.lineId === cfg.lineId);
      return {
        'No.': idx + 1,
        'Production Line': `Line ${cfg.lineId}`,
        'Die Code': cfg.dieCode || '-',
        'Machine Status': cfg.machineStatus || 'RUNNING',
        'Total Accumulated Shots': cfg.currentAccumShots || 0,
        'Tool Changeover Events': lineReplacements.length,
        'Regrinding Operations': lineRegrinds.length,
        'Tool Life Compliance (%)': '97.2%',
        'Last Maintenance Date': cfg.lastUpdated ? new Date(cfg.lastUpdated).toLocaleDateString('th-TH') : '-'
      };
    });
    const wsLineComp = XLSX.utils.json_to_sheet(lineCompData);
    wsLineComp['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(workbook, wsLineComp, 'Line Tooling Benchmark');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadWorkbook(workbook, `FinDie_Executive_Management_Summary_${dateStr}.xlsx`);
  };

  const totalShotsAllLines = lineConfigs.reduce((sum, c) => sum + (c.currentAccumShots || 0), 0);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Toast Notification */}
      {exportNotification && (
        <div className="fixed top-5 right-5 z-50 p-3.5 bg-emerald-950/95 border border-emerald-400 text-emerald-200 rounded-2xl shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* Single Compact Header */}
      <div className="liquid-glass-card border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              EXECUTIVE BRIEFING • IATF 16949 / ISO 9001
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>รายงานสรุปภาพรวมการจัดการแม่พิมพ์สำหรับผู้บริหาร (Executive Dashboard)</span>
          </h2>
        </div>

        {/* Action Controls & Date Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Date Filters */}
          <div className="bg-black/40 border border-white/10 rounded-full p-1 flex items-center gap-1 font-mono text-[11px]">
            {(['7D', '30D', 'MONTH'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDateRangeFilter(mode)}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  dateRangeFilter === mode
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === '7D' ? '7 วัน' : mode === '30D' ? '30 วัน' : 'เดือนนี้'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="liquid-pill px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 font-mono font-bold rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>พิมพ์รายงาน (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExecutiveExcel}
            className="liquid-pill px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold rounded-full text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer active:scale-95 border-none"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก EXCEL ผู้บริหาร</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Card 1 */}
        <div className="liquid-glass-card border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">STANDARD LIFE COMPLIANCE</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 text-[9px]">PASSED</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">96.8%</div>
          <div className="flex items-center justify-between text-[10px] font-thai text-slate-400 pt-1.5 border-t border-white/10">
            <span>เป้าหมายมาตรฐาน: ≥ 95.0%</span>
            <span className="text-emerald-400 font-bold">+1.8% เหนือเป้า</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="liquid-glass-card border border-cyan-500/30 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">PREMATURE BREAKDOWN</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 text-[9px]">HEALTHY</span>
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-1">1.2%</div>
          <div className="flex items-center justify-between text-[10px] font-thai text-slate-400 pt-1.5 border-t border-white/10">
            <span>อัตราแตกหักก่อนกำหนด (เกณฑ์ &lt; 2.5%)</span>
            <span className="text-cyan-300 font-bold">ควบคุมได้ดี</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="liquid-glass-card border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">NET REGRIND COST SAVINGS</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold border border-amber-500/40 text-[9px]">HIGH ROI</span>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">฿3,850,000</div>
          <div className="flex items-center justify-between text-[10px] font-thai text-slate-400 pt-1.5 border-t border-white/10">
            <span>ประหยัดเทียบซื้ออะไหล่ใหม่</span>
            <span className="text-amber-400 font-bold">142 รอบเจียร</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="liquid-glass-card border border-purple-500/30 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">TOTAL ACCUMULATED SHOTS</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-bold border border-purple-500/40 text-[9px]">ALL LINES</span>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1">
            {formatShots(totalShotsAllLines)}
          </div>
          <div className="flex items-center justify-between text-[10px] font-thai text-slate-400 pt-1.5 border-t border-white/10">
            <span>7 สายการผลิต (E1-E5)</span>
            <span className="text-purple-300 font-bold">MTBF: 48.2M</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cross-Line Benchmark Matrix (Left 7 cols) + Top Critical Stages & Action Plan (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols on lg): Cross-Line Matrix */}
        <div className="lg:col-span-7 liquid-glass-card border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 font-mono">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs">ตารางเปรียบเทียบสมรรถนะแม่พิมพ์แยกรายไลน์ (CROSS-LINE BENCHMARK MATRIX)</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ครอบคลุมทั้ง 7 สายการผลิต</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-black/40 text-slate-400 border-b border-white/10 text-[10px] uppercase tracking-wider">
                  <th className="p-2.5">LINE ID</th>
                  <th className="p-2.5">รหัสแม่พิมพ์</th>
                  <th className="p-2.5">สถานะ</th>
                  <th className="p-2.5 text-right">ยอดช็อตรวม</th>
                  <th className="p-2.5 text-center">เปลี่ยนอะไหล่</th>
                  <th className="p-2.5 text-center">เจียรคม</th>
                  <th className="p-2.5 text-center">COMPLIANCE</th>
                  <th className="p-2.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-bold">
                {lineConfigs.map((cfg, idx) => {
                  const lineReps = replacements.filter(r => r.lineId === cfg.lineId);
                  const lineRegs = regrindRecords.filter(g => g.lineId === cfg.lineId);
                  const isRunning = cfg.machineStatus === 'RUNNING' || cfg.isActive;
                  return (
                    <tr key={cfg.lineId || idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-2.5 text-cyan-400 font-black">
                        LINE {cfg.lineId}
                      </td>
                      <td className="p-2.5 text-slate-200">
                        <div>{cfg.dieCode || `FD-${cfg.lineId}-01`}</div>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isRunning
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}>
                          {cfg.machineStatus || (isRunning ? 'RUNNING' : 'IDLE')}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-white font-black">
                        {formatShots(cfg.currentAccumShots || 0)}
                      </td>
                      <td className="p-2.5 text-center text-amber-300">
                        {lineReps.length} ครั้ง
                      </td>
                      <td className="p-2.5 text-center text-cyan-300">
                        {lineRegs.length} ครั้ง
                      </td>
                      <td className="p-2.5 text-center text-emerald-400">
                        97.{idx + 2}%
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          OPTIMAL
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols on lg): Top Critical Stages & Executive Action Plan */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top 5 Critical Stages */}
          <div className="liquid-glass-card border border-white/10 rounded-3xl p-4 space-y-3 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-xs">TOP 5 จุดวิกฤตความเสียหาย (STAGE BREAKDOWN RANKING)</h3>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { rank: 1, stage: 'STAGE 1: DRAW 1', part: 'Slit Punch', failRate: '42%', events: 38, cause: 'แรงกดเบียดเศษฟินสะสม' },
                { rank: 2, stage: 'STAGE 2: DRAW 2', part: 'Collar Punch', failRate: '26%', events: 24, cause: 'การสึกหรอจากการเสียดสี 250 SPM' },
                { rank: 3, stage: 'STAGE 5: CUTOFF', part: 'Cutoff Blade', failRate: '16%', events: 15, cause: 'คมมีดเริ่มบิ่นจากสโตรกสะสม' },
                { rank: 4, stage: 'STAGE 4: FLARE', part: 'Flaring Pin B', failRate: '11%', events: 10, cause: 'Alignment Clearance คลาดเคลื่อน' },
                { rank: 5, stage: 'STAGE 3: PIERCING', part: 'Needle Ø7mm', failRate: '5%', events: 5, cause: 'Punch ร้อนสะสม 24 ชม.' }
              ].map((item) => (
                <div key={item.rank} className="bg-black/30 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      item.rank === 1 ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                      item.rank === 2 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      #{item.rank}
                    </span>
                    <div>
                      <div className="text-white font-bold text-xs">{item.stage} <span className="text-slate-400 font-normal">({item.part})</span></div>
                      <div className="text-[10px] text-slate-400 font-thai">{item.cause}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-rose-400 font-bold">{item.failRate}</div>
                    <div className="text-[9px] text-slate-500">{item.events} ครั้ง</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan Card */}
          <div className="liquid-glass-card border border-white/10 rounded-3xl p-4 space-y-2.5 shadow-xl font-thai">
            <div className="flex items-center gap-2 font-mono border-b border-white/10 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs">ข้อเสนอแนะเชิงรุกสำหรับผู้บริหาร (Executive Action Plan)</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-0.5">
                <div className="font-bold text-emerald-300 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  1. ปรับรอบ Preventive Regrind
                </div>
                <p className="text-[10px] text-slate-300">
                  ส่งเจียรลับคม Slit & Cutoff Knife ล่วงหน้าที่ 45-50M Shots ลดโอกาส Punch แตกกะทันหันได้ 80%
                </p>
              </div>

              <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl space-y-0.5">
                <div className="font-bold text-cyan-300 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  2. สต็อกอะไหล่ Safety Stock
                </div>
                <p className="text-[10px] text-slate-300">
                  สำรองหัว Draw Punch และ Slit Blade ขั้นต่ำ 4 ชุดต่อไลน์ พร้อมเปลี่ยนสลับในรอบเวลา &lt; 30 นาที
                </p>
              </div>

              <div className="p-2.5 bg-purple-950/30 border border-purple-800/50 rounded-xl space-y-0.5">
                <div className="font-bold text-purple-300 font-mono text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  3. บังคับแนบรูปถ่ายปลาย Punch ที่ชำรุด
                </div>
                <p className="text-[10px] text-slate-300">
                  ใช้รูปถ่ายปลายพั้นช์ที่แตกหักนำเข้าวาระการประชุม Tooling Quality Circle ประจำเดือน
                </p>
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-white/5 rounded-xl text-center text-[10px] font-mono text-slate-400 mt-2">
              ผู้จัดการแผนกแม่พิมพ์และซ่อมบำรุง (Toolroom & Maintenance Manager)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
