import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  Factory,
  Info,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ChevronDown,
  Wrench,
  ShieldCheck,
  RotateCw,
  Gauge,
  Tag,
  Hash,
  Eye,
  Filter,
  Check
} from 'lucide-react';
import { MoldDieMasterItem, ProductionLineId } from '../types';
import { MOLD_DIE_MASTER_ITEMS_2025 } from '../data/moldDieMasterData';

export const PartMasterView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');
  const [selectedPartForDetail, setSelectedPartForDetail] = useState<MoldDieMasterItem | null>(null);
  const [showRegrindOnly, setShowRegrindOnly] = useState(false);

  // Extract all unique stages
  const allStages = useMemo(() => {
    const stageSet = new Set<string>();
    MOLD_DIE_MASTER_ITEMS_2025.forEach(item => stageSet.add(item.stage));
    return Array.from(stageSet);
  }, []);

  // Filtered master items
  const filteredItems = useMemo(() => {
    return MOLD_DIE_MASTER_ITEMS_2025.filter(item => {
      // Stage filter
      if (selectedStage !== 'ALL' && item.stage !== selectedStage) {
        return false;
      }

      // Line filter
      if (selectedLineFilter !== 'ALL') {
        const qtyMap: Record<string, number | undefined> = {
          'E1': item.installQty.e1,
          'E2': item.installQty.e2,
          'E3-1': item.installQty.e3_1,
          'E3-2': item.installQty.e3_2,
          'E3-3': item.installQty.e3_3,
          'E4': item.installQty.e4,
          'E5': item.installQty.e5,
          'E6': item.installQty.e6,
        };
        const lineQty = qtyMap[selectedLineFilter];
        if (!lineQty || lineQty <= 0) return false;
      }

      // Regrind only filter
      if (showRegrindOnly && (item.regrindStandard.perGrindMm === '-' || item.regrindStandard.perGrindMm.includes('Dispose'))) {
        return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.partName.toLowerCase().includes(term);
        const matchStage = item.stage.toLowerCase().includes(term);
        const matchDwg = item.drawingNo?.toLowerCase().includes(term) || false;
        const matchNo = item.no.toString() === term;
        return matchName || matchStage || matchDwg || matchNo;
      }

      return true;
    });
  }, [selectedStage, selectedLineFilter, showRegrindOnly, searchTerm]);

  // Stage color mapper
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PIERCE & BURRING':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/60';
      case 'IRONING':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/60';
      case 'LOUVER':
      case 'WIDE LOWER':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
      case 'REFLARE':
        return 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
      case 'SLIT':
      case 'ROW SLIT':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/60';
      case 'CUT OFF':
      case 'SIDE CUT':
        return 'bg-rose-950/40 text-rose-300 border-rose-800/60';
      case 'S5 CENTER NOTCH':
      case 'CORNER CUT':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60';
      case 'HITCH FEED':
      case 'BACK STOP':
        return 'bg-teal-950/40 text-teal-300 border-teal-800/60';
      case 'FORMING':
        return 'bg-orange-950/40 text-orange-300 border-orange-800/60';
      default:
        return 'bg-slate-800/50 text-slate-300 border-slate-700';
    }
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Stage',
      'Part Name',
      'Drawing No',
      'E1 Qty',
      'E2 Qty',
      'E3(1) Qty',
      'E3(2) Qty',
      'E3(3) Qty',
      'E4 Qty',
      'E5 Qty',
      'E6 Qty',
      'Total Qty',
      'E1 Shot Life (M)',
      'E2 Shot Life (M)',
      'E3(1) Shot Life (M)',
      'E3(2) Shot Life (M)',
      'E3(3) Shot Life (M)',
      'E4 Shot Life (M)',
      'E5 Shot Life (M)',
      'E6 Shot Life (M)',
      'Spec Parts',
      'Lower Spec Limit',
      '1 time / re-grind (mm)',
      'Total re-grind (mm)',
      'Number of re-grinding',
      'Note'
    ];

    const rows = filteredItems.map(item => [
      item.no,
      `"${item.stage}"`,
      `"${item.partName}"`,
      `"${item.drawingNo || ''}"`,
      item.installQty.e1 || '-',
      item.installQty.e2 || '-',
      item.installQty.e3_1 || '-',
      item.installQty.e3_2 || '-',
      item.installQty.e3_3 || '-',
      item.installQty.e4 || '-',
      item.installQty.e5 || '-',
      item.installQty.e6 || '-',
      item.installQty.totalQty,
      item.shotLifeCycle.e1_pcm || '-',
      item.shotLifeCycle.e2_gold || '-',
      item.shotLifeCycle.e3_1_pcm || '-',
      item.shotLifeCycle.e3_2_gold || '-',
      item.shotLifeCycle.e3_3_gold || '-',
      item.shotLifeCycle.e4_bare || '-',
      item.shotLifeCycle.e5_bare || '-',
      item.shotLifeCycle.e6_pcm || '-',
      item.shotLifeCycle.partsSpec || '-',
      item.shotLifeCycle.lowerSpecScrapLimit || '-',
      `"${item.regrindStandard.perGrindMm}"`,
      `"${item.regrindStandard.totalGrindMm}"`,
      `"${item.regrindStandard.regrindCycles}"`,
      `"${item.regrindStandard.note}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mold_Die_Parts_Master_TH_31.01.2025_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* ======================================================== */}
      {/* 1. HEADER & KPI METRICS SUMMARY */}
      {/* ======================================================== */}
      <div className="bg-[#0B132B] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 uppercase tracking-wider">
                Engineering Standard Dictionary
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                Revise: 31.01.2025
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Database className="w-6 h-6 text-cyan-400" />
              <span>Parts Master Hub: Mold & Die Heat Exchanger (TH)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              พจนานุกรมกลางและฐานข้อมูลอะไหล่แม่พิมพ์มาตรฐาน 4 ส่วนหลัก (Classification, Line Install Qty, Shot Life Cycle, Maintenance Standards)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-mono font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Master (CSV)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-md shadow-cyan-950 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบสเปก (Print)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-mono">1. TOTAL MASTER ITEMS</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              157 <span className="text-xs text-cyan-400 font-normal">Parts</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">ครอบคลุม No. 1 ถึง 157</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-mono">2. DIE STAGES</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              17 <span className="text-xs text-slate-400 font-normal">Stages</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">PB, Iron, Slit, CutOff, etc.</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-mono">3. PRODUCTION LINES</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              E1 - E6 <span className="text-xs text-slate-400 font-normal">(8 Line Configs)</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">PCM, Gold, Bare Fin Types</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-mono">4. MAINTENANCE POLICIES</div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
              Re-grind & Disposable
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Standard depth & max cycles</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SEARCH, STAGE TABS & ADVANCED FILTERS */}
      {/* ======================================================== */}
      <div className="bg-[#0D1527] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        {/* Search Bar & Primary Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพาร์ท (เช่น PIERCE PUNCH, ROW SLIT), ลำดับ No, หรือสเตจ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Line */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <Factory className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-[11px]">Line:</span>
              <select
                value={selectedLineFilter}
                onChange={e => setSelectedLineFilter(e.target.value)}
                className="bg-transparent border-none text-cyan-300 font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">ทุกไลน์ (All Lines)</option>
                <option value="E1" className="bg-slate-900 text-white">Line E1 (Ø7 Slit)</option>
                <option value="E2" className="bg-slate-900 text-white">Line E2 (Ø5 Slit)</option>
                <option value="E3-1" className="bg-slate-900 text-white">Line E3 (Slit 3P)</option>
                <option value="E3-2" className="bg-slate-900 text-white">Line E3 (WL+ 4P)</option>
                <option value="E3-3" className="bg-slate-900 text-white">Line E3 (Corr 4P)</option>
                <option value="E4" className="bg-slate-900 text-white">Line E4 (Ø5 Slit)</option>
                <option value="E5" className="bg-slate-900 text-white">Line E5 (Ø5 Slit)</option>
                <option value="E6" className="bg-slate-900 text-white">Line E6 (Ø7 Louver)</option>
              </select>
            </div>

            {/* Toggle Re-grind only */}
            <button
              onClick={() => setShowRegrindOnly(!showRegrindOnly)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                showRegrindOnly
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-purple-400" />
              <span>เฉพาะพาร์ทที่ลับคมได้ (Re-grindable)</span>
            </button>
          </div>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <button
            onClick={() => setSelectedStage('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
              selectedStage === 'ALL'
                ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/50'
                : 'bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            All Stages (ทั้งหมด {MOLD_DIE_MASTER_ITEMS_2025.length})
          </button>

          {allStages.map(stage => {
            const count = MOLD_DIE_MASTER_ITEMS_2025.filter(i => i.stage === stage).length;
            const isSelected = selectedStage === stage;
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {stage} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MASTER DATA TABLE - 4 STRUCTURED SECTIONS */}
      {/* ======================================================== */}
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              PARTS MASTER DATA DICTIONARY ({filteredItems.length} รายการ)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            คลิกที่แถวพาร์ทเพื่อดูเอกสารสเปกแบบละเอียด (Click row to view specs)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[1200px]">
            {/* Multi-tier Table Header */}
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[11px]">
                <th colSpan={3} className="py-2.5 px-3 border-r border-slate-800 text-cyan-400 font-bold">
                  1. PART IDENTIFICATION
                </th>
                <th colSpan={9} className="py-2.5 px-3 border-r border-slate-800 text-amber-400 font-bold text-center bg-amber-950/10">
                  2. INSTALL QUANTITY BY LINE (EA)
                </th>
                <th colSpan={8} className="py-2.5 px-3 border-r border-slate-800 text-blue-400 font-bold text-center bg-blue-950/10">
                  3. STANDARDIZATION OF SHOT USAGE CYCLE (MILLION SHOTS)
                </th>
                <th colSpan={4} className="py-2.5 px-3 text-purple-400 font-bold text-center bg-purple-950/10">
                  4. STANDARD RE-GRINDING
                </th>
              </tr>
              <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800 text-[10px] tracking-wider">
                {/* 1. Identification */}
                <th className="py-2 px-2.5 text-center w-12 border-r border-slate-800/80">No</th>
                <th className="py-2 px-3 border-r border-slate-800/80">Stage</th>
                <th className="py-2 px-4 border-r border-slate-800 min-w-[220px]">Part Name</th>

                {/* 2. Line Install Qty */}
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E1</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E2</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E3(1)</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E3(2)</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E3(3)</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E4</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E5</th>
                <th className="py-2 px-2 text-center text-amber-300 bg-amber-950/20">E6</th>
                <th className="py-2 px-2.5 text-center text-white font-bold bg-amber-900/30 border-r border-slate-800">
                  Total
                </th>

                {/* 3. Shot Usage Standards */}
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E1 (PCM)</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E2 (Gold)</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E3(1)</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E3(2)</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E3(3)</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E4/E5</th>
                <th className="py-2 px-2 text-center text-blue-300 bg-blue-950/20">E6 (PCM)</th>
                <th className="py-2 px-2.5 text-center text-slate-400 bg-blue-950/20 border-r border-slate-800">
                  Scrap Limit
                </th>

                {/* 4. Regrinding Standards */}
                <th className="py-2 px-2.5 text-center text-purple-300 bg-purple-950/20">1 time (mm)</th>
                <th className="py-2 px-2.5 text-center text-purple-300 bg-purple-950/20">Total (mm)</th>
                <th className="py-2 px-3 text-center text-purple-300 bg-purple-950/20">Max Cycles</th>
                <th className="py-2 px-4 text-purple-200 bg-purple-950/20 min-w-[180px]">Note / Standard</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map(item => {
                const isSelected = selectedPartForDetail?.no === item.no;
                const isDisposable = item.regrindStandard.perGrindMm.includes('Dispose');

                return (
                  <tr
                    key={item.no}
                    onClick={() => setSelectedPartForDetail(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/40 bg-slate-900/20'
                    }`}
                  >
                    {/* 1. Identification */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-slate-400 border-r border-slate-800/60">
                      {item.no}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-800/60">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageColor(item.stage)}`}>
                        {item.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-white border-r border-slate-800 flex items-center justify-between gap-2">
                      <span>{item.partName}</span>
                      {item.drawingNo && (
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.drawingNo}
                        </span>
                      )}
                    </td>

                    {/* 2. Line Install Qty */}
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e1 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e2 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e3_1 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e3_2 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e3_3 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e4 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e5 || '-'}</td>
                    <td className="py-2.5 px-2 text-center text-slate-300">{item.installQty.e6 || '-'}</td>
                    <td className="py-2.5 px-2.5 text-center font-bold text-amber-300 bg-amber-950/20 border-r border-slate-800">
                      {item.installQty.totalQty > 0 ? item.installQty.totalQty : '-'}
                    </td>

                    {/* 3. Shot Usage Cycle Standards */}
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e1_pcm !== undefined ? `${item.shotLifeCycle.e1_pcm}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e2_gold !== undefined ? `${item.shotLifeCycle.e2_gold}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e3_1_pcm !== undefined ? `${item.shotLifeCycle.e3_1_pcm}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e3_2_gold !== undefined ? `${item.shotLifeCycle.e3_2_gold}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e3_3_gold !== undefined ? `${item.shotLifeCycle.e3_3_gold}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e4_bare !== undefined ? `${item.shotLifeCycle.e4_bare}M` : '-'}</td>
                    <td className="py-2.5 px-2 text-center text-blue-300">{item.shotLifeCycle.e6_pcm !== undefined ? `${item.shotLifeCycle.e6_pcm}M` : '-'}</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-400 border-r border-slate-800 text-[10px]">
                      {item.shotLifeCycle.lowerSpecScrapLimit ? `${item.shotLifeCycle.lowerSpecScrapLimit} mm` : '-'}
                    </td>

                    {/* 4. Regrind Standards */}
                    <td className="py-2.5 px-2.5 text-center">
                      {isDisposable ? (
                        <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/60">
                          Disposable
                        </span>
                      ) : (
                        <span className="text-purple-300">{item.regrindStandard.perGrindMm}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-purple-300">
                      {item.regrindStandard.totalGrindMm !== '-' ? `${item.regrindStandard.totalGrindMm} mm` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-purple-300 font-bold">
                      {item.regrindStandard.regrindCycles}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] font-thai truncate max-w-[240px]" title={item.regrindStandard.note}>
                      {item.regrindStandard.note !== '-' ? item.regrindStandard.note : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DETAIL SPECIFICATION DRAWER / MODAL */}
      {/* ======================================================== */}
      {selectedPartForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0D1527] border border-cyan-500/60 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400 font-bold font-mono">
                  #{selectedPartForDetail.no}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageColor(selectedPartForDetail.stage)}`}>
                      {selectedPartForDetail.stage}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Standard Ref 31.01.2025</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono mt-0.5">
                    {selectedPartForDetail.partName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartForDetail(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono"
              >
                ปิด (Close)
              </button>
            </div>

            {/* 4 Main Data Sections */}
            <div className="space-y-4 text-xs font-mono">
              {/* 1. Identification */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5" />
                  <span>1. PART IDENTIFICATION & CLASSIFICATION</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">STAGE NAME:</span>
                    <span className="text-white font-bold">{selectedPartForDetail.stage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ITEM NUMBER:</span>
                    <span className="text-white font-bold">No. {selectedPartForDetail.no}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DRAWING / SPEC NO:</span>
                    <span className="text-cyan-300 font-bold">{selectedPartForDetail.drawingNo || 'STANDARD SPEC'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Line Installed Quantities */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                  <Factory className="w-3.5 h-3.5" />
                  <span>2. INSTALL QUANTITY BY LINE (EA) - TOTAL: {selectedPartForDetail.installQty.totalQty} EA</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                  {[
                    { line: 'E1', val: selectedPartForDetail.installQty.e1 },
                    { line: 'E2', val: selectedPartForDetail.installQty.e2 },
                    { line: 'E3(1)', val: selectedPartForDetail.installQty.e3_1 },
                    { line: 'E3(2)', val: selectedPartForDetail.installQty.e3_2 },
                    { line: 'E3(3)', val: selectedPartForDetail.installQty.e3_3 },
                    { line: 'E4', val: selectedPartForDetail.installQty.e4 },
                    { line: 'E5', val: selectedPartForDetail.installQty.e5 },
                    { line: 'E6', val: selectedPartForDetail.installQty.e6 },
                  ].map(slot => (
                    <div key={slot.line} className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                      <span className="text-[10px] text-slate-400 block">{slot.line}</span>
                      <span className={`text-xs font-bold ${slot.val ? 'text-amber-300' : 'text-slate-600'}`}>
                        {slot.val || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Standardization of Shot Usage Cycle */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-blue-400 font-bold flex items-center gap-1.5 text-xs">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>3. STANDARDIZATION OF SHOT USAGE CYCLE (MILLION SHOTS)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-slate-300">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">E1 PCM / E6 PCM:</span>
                    <span className="text-blue-300 font-bold">
                      {selectedPartForDetail.shotLifeCycle.e1_pcm ? `${selectedPartForDetail.shotLifeCycle.e1_pcm}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">E2 GOLD:</span>
                    <span className="text-blue-300 font-bold">
                      {selectedPartForDetail.shotLifeCycle.e2_gold ? `${selectedPartForDetail.shotLifeCycle.e2_gold}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">E4 / E5 BARE:</span>
                    <span className="text-blue-300 font-bold">
                      {selectedPartForDetail.shotLifeCycle.e4_bare ? `${selectedPartForDetail.shotLifeCycle.e4_bare}M shots` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">SCRAP / LOWER LIMIT:</span>
                    <span className="text-rose-400 font-bold">
                      {selectedPartForDetail.shotLifeCycle.lowerSpecScrapLimit ? `${selectedPartForDetail.shotLifeCycle.lowerSpecScrapLimit} mm` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Standard Re-grinding & Maintenance Standard */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-purple-400 font-bold flex items-center gap-1.5 text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>4. STANDARD RE-GRINDING & TOOLROOM INSTRUCTION</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-300">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">1 TIME / RE-GRIND:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard.perGrindMm}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">TOTAL GRIND DEPTH:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard.totalGrindMm} mm</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                    <span className="text-slate-500 block text-[10px]">MAX RE-GRIND CYCLES:</span>
                    <span className="text-purple-300 font-bold">{selectedPartForDetail.regrindStandard.regrindCycles}</span>
                  </div>
                </div>
                {selectedPartForDetail.regrindStandard.note && selectedPartForDetail.regrindStandard.note !== '-' && (
                  <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-2.5 text-purple-200 text-xs font-thai mt-2">
                    <span className="font-bold font-mono text-[10px] text-purple-400 block uppercase">Special Note / Guideline:</span>
                    {selectedPartForDetail.regrindStandard.note}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPartForDetail(null)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-950"
              >
                ตกลง (OK)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
