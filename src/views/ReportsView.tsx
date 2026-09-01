import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Layers,
  FileSpreadsheet,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Filter,
  UserCheck,
  Server,
  Calendar,
  Lock,
  Plus,
  Wrench,
  Activity,
  History,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  AuditLogEntry, 
  AuditModuleType, 
  AuditActionType, 
  UserRole, 
  User, 
  ProductionLineId, 
  ShotEntryRecord, 
  ReplacementRecord, 
  RegrindingRecord, 
  ConditionInspectionRecord 
} from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb } from '../services/calculationService';
import { getRolePermissions } from '../services/authService';
import { LineFilterSelector } from '../components/common/LineFilterSelector';
import { DateRangeFilter, isDateInSelectedRange } from '../components/common/DateRangeFilter';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'PRODUCTION' | 'MAINTENANCE' | 'REGRIND'>('ANALYTICS');
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [shotLogs, setShotLogs] = useState<ShotEntryRecord[]>([]);
  const [regrindRecords, setRegrindRecords] = useState<RegrindingRecord[]>([]);
  const [inspections, setInspections] = useState<ConditionInspectionRecord[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('ALL');
  const [selectedExportCategory, setSelectedExportCategory] = useState<'ALL' | 'PRODUCTION' | 'MAINTENANCE' | 'REGRIND'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const reloadData = () => {
    setReplacements(storageService.getReplacements());
    setShotLogs(storageService.getShotLogs());
    setRegrindRecords(storageService.getRegrindRecords());
    setInspections(storageService.getInspections());
    setLineConfigs(storageService.getLineConfigs());
  };

  useEffect(() => {
    reloadData();
    const unsub = storageService.subscribe(reloadData);
    return () => unsub();
  }, []);

  // Helper to trigger XLSX workbook file download
  const downloadWorkbook = (workbook: XLSX.WorkBook, filename: string) => {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
    setExportNotification(`ดาวน์โหลดไฟล์ Excel "${filename}" สำเร็จ!`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  // 1. Export Production Shot History Excel (.xlsx)
  const handleExportProductionExcel = () => {
    const data = (selectedLineFilter === 'ALL' 
      ? shotLogs 
      : shotLogs.filter(s => s.lineId === selectedLineFilter)
    ).map((s, idx) => ({
      'No.': idx + 1,
      'Record ID': s.id,
      'Production Line': `Line ${s.lineId}`,
      'Production Date': s.productionDate || (s.timestamp ? s.timestamp.slice(0, 10) : ''),
      'Shift': s.shift || 'N/A',
      'Input Method': s.inputMethod || 'MANUAL',
      'Entry Type': s.entryType,
      'Previous Machine Shot': s.previousTotal ?? 0,
      'Shots Added (Increment)': s.shotsAdded ?? 0,
      'New Total Machine Shot': s.newTotal ?? 0,
      'Operator Name': s.operatorName || 'N/A',
      'Operator ID': s.operatorId || '',
      'Entry Reason / Cause': s.entryReason || '-',
      'Notes / Die Code': s.notes || s.dieCode || '-',
      'Recorded Timestamp': s.timestamp ? new Date(s.timestamp).toLocaleString('th-TH') : '',
      'Status': s.status || 'SUBMITTED'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
      { wch: 20 }, { wch: 14 }, { wch: 26 }, { wch: 24 }, { wch: 22 }, { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shot Production History');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadWorkbook(workbook, `FinDie_Shot_Production_History_${selectedLineFilter}_${dateStr}.xlsx`);
  };

  // 2. Export Maintenance & Replacement History Excel (.xlsx)
  const handleExportMaintenanceExcel = () => {
    const data = (selectedLineFilter === 'ALL'
      ? replacements
      : replacements.filter(r => r.lineId === selectedLineFilter)
    ).map((r, idx) => ({
      'No.': idx + 1,
      'Replacement ID': r.id,
      'Work Order No': r.workOrderNumber || '-',
      'Production Line': `Line ${r.lineId}`,
      'Die Code': r.dieCode || '-',
      'Part Code': r.partCode,
      'Part Name': r.partName || '-',
      'Stage / Function': r.stageName || '-',
      'Position / Slot': r.position || 'ALL',
      'Replacement Type': r.replacementType,
      'Total Installed Qty': r.installedQuantity || (r as any).installQtyTotal || 1,
      'Replaced Qty': r.changedQuantity || (r as any).replacedQty || 1,
      'Machine Shot At Change': r.machineShotAtReplacement || (r as any).shotAtReplacement || 0,
      'Part Used Shot': r.removedPartUsedShot || (r as any).partAccumulatedShots || 0,
      'Regrind Cycle Count': r.removedPartRegrindCount || (r as any).regrindCount || 0,
      'New Part Lot No': r.newPartLotNumber || '-',
      'Technician / Changed By': r.changedBy || (r as any).technicianName || 'N/A',
      'Verified By': r.verifiedBy || (r as any).approverName || '-',
      'Reason / Note': r.replacementReason || (r as any).reason || '-',
      'Date & Time': r.timestamp ? new Date(r.timestamp).toLocaleString('th-TH') : '',
      'Status': r.approvalStatus || 'APPROVED'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
      { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
      { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tooling Replacements');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadWorkbook(workbook, `FinDie_Maintenance_Replacements_${selectedLineFilter}_${dateStr}.xlsx`);
  };

  // 3. Export Regrinding Workshop Excel (.xlsx)
  const handleExportRegrindingExcel = () => {
    const data = (selectedLineFilter === 'ALL'
      ? regrindRecords
      : regrindRecords.filter(g => (g.lineId === selectedLineFilter || (g as any).lineLastUsed === selectedLineFilter))
    ).map((g, idx) => ({
      'No.': idx + 1,
      'Job ID / Code': g.jobCode || g.id,
      'Date': g.regrindDate || (g as any).date || '',
      'Production Line': `Line ${g.lineId || (g as any).lineLastUsed || 'E1'}`,
      'Die Code': g.dieCode || (g as any).finDie || '-',
      'Part Code': g.partCode,
      'Part Name': g.partName || '-',
      'Regrind Cycle Count': g.regrindCountAfter || 1,
      'Previous Length (mm)': g.previousLength ?? 0,
      'Current Length (mm)': g.currentLength ?? 0,
      'Grinding Removed (mm)': g.actualGrindingRemovedMm ? `-${g.actualGrindingRemovedMm}` : '0.00',
      'Inspection Result': g.inspectionResult || 'PASSED',
      'Supplier / Workshop': g.supplierOrInternalProcess || 'INTERNAL_TOOL_ROOM',
      'Technician / Vendor Name': g.vendorName || (g as any).technicianName || '-',
      'Notes': g.id || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 24 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Regrinding Ledger');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadWorkbook(workbook, `FinDie_Regrinding_Ledger_${selectedLineFilter}_${dateStr}.xlsx`);
  };

  // 4. Export Comprehensive All-in-One Master Report (.xlsx Multi-Sheet Workbook)
  const handleExportAllInOneMasterExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Line & Die Active Status
    const lineData = lineConfigs.map((cfg, idx) => ({
      'No.': idx + 1,
      'Production Line': `Line ${cfg.lineId}`,
      'Machine Status': cfg.machineStatus || (cfg.isActive ? 'RUNNING' : 'IDLE'),
      'Die Code': cfg.dieCode || '-',
      'Die Model Name': cfg.dieName || cfg.mainFinDie || '-',
      'Tube Size': cfg.tubeSize || 'Ø7',
      'Fin Profile': cfg.finType || 'Slit Old',
      'Pitch / Paths': cfg.pathsCount || '3P (Pitch)',
      'Material / Thickness': `${cfg.material || 'PCM'} (${cfg.finThickness || 0.10}mm)`,
      'Current Machine Shot': cfg.currentAccumShots ?? 0,
      'Last Updated': cfg.lastUpdated ? new Date(cfg.lastUpdated).toLocaleString('th-TH') : '-'
    }));
    const wsLine = XLSX.utils.json_to_sheet(lineData);
    wsLine['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 26 },
      { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsLine, 'Line & Die Overview');

    // Sheet 2: Shot Production History
    const prodData = (selectedLineFilter === 'ALL' ? shotLogs : shotLogs.filter(s => s.lineId === selectedLineFilter))
      .map((s, idx) => ({
        'No.': idx + 1,
        'Record ID': s.id,
        'Line': `Line ${s.lineId}`,
        'Date': s.productionDate || (s.timestamp ? s.timestamp.slice(0, 10) : ''),
        'Shift': s.shift || 'N/A',
        'Method': s.inputMethod || 'MANUAL',
        'Previous Shot': s.previousTotal ?? 0,
        'Added Shot': s.shotsAdded ?? 0,
        'New Total Shot': s.newTotal ?? 0,
        'Operator': s.operatorName || 'N/A',
        'Reason / Notes': s.entryReason || s.notes || '-'
      }));
    const wsProd = XLSX.utils.json_to_sheet(prodData);
    wsProd['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 26 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsProd, 'Production Shots');

    // Sheet 3: Tooling Maintenance & Replacement
    const maintData = (selectedLineFilter === 'ALL' ? replacements : replacements.filter(r => r.lineId === selectedLineFilter))
      .map((r, idx) => ({
        'No.': idx + 1,
        'Replacement ID': r.id,
        'Line': `Line ${r.lineId}`,
        'Die Code': r.dieCode || '-',
        'Part Code': r.partCode,
        'Part Name': r.partName || '-',
        'Stage': r.stageName || '-',
        'Position': r.position || 'ALL',
        'Type': r.replacementType,
        'Qty': r.changedQuantity || (r as any).replacedQty || 1,
        'Machine Shot At Change': r.machineShotAtReplacement || (r as any).shotAtReplacement || 0,
        'Part Used Shot': r.removedPartUsedShot || (r as any).partAccumulatedShots || 0,
        'Regrind Cycle': r.removedPartRegrindCount || 0,
        'Technician': r.changedBy || (r as any).technicianName || 'N/A',
        'Reason': r.replacementReason || (r as any).reason || '-'
      }));
    const wsMaint = XLSX.utils.json_to_sheet(maintData);
    wsMaint['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
      { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 8 },
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 26 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsMaint, 'Tooling Maintenance');

    // Sheet 4: Regrinding & Resharpening
    const regrindData = (selectedLineFilter === 'ALL' ? regrindRecords : regrindRecords.filter(g => g.lineId === selectedLineFilter || (g as any).lineLastUsed === selectedLineFilter))
      .map((g, idx) => ({
        'No.': idx + 1,
        'Job Code': g.jobCode || g.id,
        'Date': g.regrindDate || (g as any).date || '',
        'Line': `Line ${g.lineId || (g as any).lineLastUsed || 'E1'}`,
        'Part Code': g.partCode,
        'Part Name': g.partName || '-',
        'Cycle': g.regrindCountAfter || 1,
        'Previous Length (mm)': g.previousLength ?? 0,
        'Current Length (mm)': g.currentLength ?? 0,
        'Removed (mm)': g.actualGrindingRemovedMm ? `-${g.actualGrindingRemovedMm}` : '0.00',
        'Inspection': g.inspectionResult || 'PASSED',
        'Workshop': g.supplierOrInternalProcess || 'INTERNAL_TOOL_ROOM'
      }));
    const wsRegrind = XLSX.utils.json_to_sheet(regrindData);
    wsRegrind['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
      { wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
      { wch: 14 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsRegrind, 'Regrinding Ledger');

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadWorkbook(workbook, `FinDie_Master_All_In_One_Report_${selectedLineFilter}_${dateStr}.xlsx`);
  };

  // Master Category Dispatcher
  const handleExportByCategory = (category: 'ALL' | 'PRODUCTION' | 'MAINTENANCE' | 'REGRIND') => {
    switch (category) {
      case 'ALL':
        handleExportAllInOneMasterExcel();
        break;
      case 'PRODUCTION':
        handleExportProductionExcel();
        break;
      case 'MAINTENANCE':
        handleExportMaintenanceExcel();
        break;
      case 'REGRIND':
        handleExportRegrindingExcel();
        break;
    }
  };

  // Filtered lists for UI preview
  const filteredShotLogs = shotLogs.filter(s => {
    const matchLine = selectedLineFilter === 'ALL' || s.lineId === selectedLineFilter;
    const matchDate = isDateInSelectedRange(s.productionDate || s.timestamp, startDate, endDate);
    const matchSearch = !searchTerm || 
      (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.operatorName && s.operatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.entryReason && s.entryReason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchLine && matchDate && matchSearch;
  });

  const filteredReplacements = replacements.filter(r => {
    const matchLine = selectedLineFilter === 'ALL' || r.lineId === selectedLineFilter;
    const matchDate = isDateInSelectedRange(r.timestamp || r.replacementDateTime, startDate, endDate);
    const matchSearch = !searchTerm ||
      (r.id && r.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.partCode && r.partCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.partName && r.partName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.changedBy && r.changedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.reason && r.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchLine && matchDate && matchSearch;
  });

  const filteredRegrinds = regrindRecords.filter(g => {
    const matchLine = selectedLineFilter === 'ALL' || g.lineId === selectedLineFilter || g.lineLastUsed === selectedLineFilter;
    const matchDate = isDateInSelectedRange(g.regrindDate || (g as any).date, startDate, endDate);
    const matchSearch = !searchTerm ||
      (g.jobCode && g.jobCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.partCode && g.partCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.partName && g.partName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchLine && matchDate && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Export Notification Toast */}
      {exportNotification && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-900/95 border border-emerald-400 text-white rounded-xl shadow-2xl flex items-center gap-3 font-mono text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* Main Top Header with Quick Export Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Production History & Maintenance Analytics Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-sm">
              EXCEL / CSV EXPORT READY
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ศูนย์รายงานและดาวน์โหลดข้อมูลประวัติการผลิตยอดช็อต (Shot Production History) และประวัติงานซ่อมบำรุงแม่พิมพ์ (Maintenance & Replacement Records)
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportAllInOneMasterExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-lg text-xs sm:text-sm transition-all shadow-lg font-mono border border-emerald-400/40"
            title="Download full comprehensive Excel/CSV master file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>EXPORT ALL MASTER (EXCEL)</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs shadow-md">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>KPIs & MTBF ANALYTICS</span>
          </button>

          <button
            onClick={() => setActiveTab('PRODUCTION')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'PRODUCTION'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>PRODUCTION HISTORY ({shotLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'MAINTENANCE'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>MAINTENANCE REPLACEMENTS ({replacements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('REGRIND')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'REGRIND'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>REGRINDING LOGS ({regrindRecords.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Calendar Date Range Selector */}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChangeRange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            maxDaysAllowed={31}
          />

          {/* Production Line Selector */}
          <LineFilterSelector
            selectedLine={selectedLineFilter}
            onSelectLine={(l) => setSelectedLineFilter(l)}
            allowAll={true}
            allLabel="ALL LINES (E1-E6)"
            label="LINE:"
          />

          {/* Search box for tables */}
          {activeTab !== 'ANALYTICS' && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหา ID, ชื่อ, ชิ้นส่วน..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: ANALYTICS & KPIS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono shadow-md hover:border-slate-700 transition-colors">
              <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
                <span>TOTAL TOOL CHANGEOVERS</span>
                <Wrench className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 mt-2">{replacements.length} Events</div>
              <div className="text-[11px] text-slate-500 mt-1">Across 8 Fin Press lines</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono shadow-md hover:border-slate-700 transition-colors">
              <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
                <span>AVG MTBF (MEAN SHOTS)</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">48.2M Shots</div>
              <div className="text-[11px] text-slate-500 mt-1">Avg run before sharpening</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono shadow-md hover:border-slate-700 transition-colors">
              <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
                <span>EST. SPARE CONSUMPTION</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">฿1,420,000</div>
              <div className="text-[11px] text-slate-500 mt-1">Rolling 90-day period</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono shadow-md hover:border-slate-700 transition-colors">
              <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
                <span>RE-GRIND SAVINGS</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-2">฿3,850,000</div>
              <div className="text-[11px] text-slate-500 mt-1">Saved vs new tool purchase</div>
            </div>
          </div>

          {/* Quick Export Hub Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-900/60 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Excel & CSV Export Center (ศูนย์ดาวน์โหลดรายงาน)
                </h3>
                <p className="text-xs text-slate-400 font-thai mt-0.5">
                  เลือกดาวน์โหลดข้อมูลเฉพาะชุดที่ต้องการ หรือดาวน์โหลดชุดสมบูรณ์ (รองรับการเปิดด้วยโปรแกรม Microsoft Excel ทุกเวอร์ชัน ภาษาไทยไม่เพี้ยน)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                    <History className="w-4 h-4" />
                    <span>Production History</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-thai">
                    ประวัติยอดช็อตรายกะ, การป้อนข้อมูล Manual และ PLC Sync ({shotLogs.length} รายการ)
                  </p>
                </div>
                <button
                  onClick={handleExportProductionExcel}
                  className="w-full py-2 px-3 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT SHOT EXCEL</span>
                </button>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                    <Wrench className="w-4 h-4" />
                    <span>Maintenance History</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-thai">
                    ประวัติการเปลี่ยนอะไหล่แม่พิมพ์, ยอดช็อตขณะเปลี่ยน และช่างผู้รับผิดชอบ ({replacements.length} รายการ)
                  </p>
                </div>
                <button
                  onClick={handleExportMaintenanceExcel}
                  className="w-full py-2 px-3 bg-amber-700/80 hover:bg-amber-600 text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT REPLACEMENT EXCEL</span>
                </button>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                    <RotateCcw className="w-4 h-4" />
                    <span>Regrinding History</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-thai">
                    บันทึกการเจียรลับคม, มิลลิเมตรที่เจียรออก และผลตรวจสอบ ({regrindRecords.length} รายการ)
                  </p>
                </div>
                <button
                  onClick={handleExportRegrindingExcel}
                  className="w-full py-2 px-3 bg-cyan-700/80 hover:bg-cyan-600 text-white rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT REGRIND EXCEL</span>
                </button>
              </div>

              <div className="bg-slate-950/80 border border-emerald-800/80 rounded-lg p-4 flex flex-col justify-between space-y-3 bg-emerald-950/20">
                <div>
                  <div className="flex items-center gap-2 text-white font-mono font-black text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>All-in-One Master Report</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-thai">
                    รวมทุกหมวดสถิติ การผลิต ซ่อมบำรุง และเจียรลับคมในไฟล์เดียวแบบแยกส่วน
                  </p>
                </div>
                <button
                  onClick={handleExportAllInOneMasterExcel}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-mono font-black flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT COMPLETE EXCEL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stage Breakdown & Material Wear Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="font-bold text-slate-100 text-sm font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Tooling Consumption & Life Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
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

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
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
      )}

      {/* TAB 2: PRODUCTION HISTORY TABLE */}
      {activeTab === 'PRODUCTION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                <History className="w-5 h-5 text-emerald-400" />
                Production Shot Entry Records (ประวัติการผลิตรายกะ)
              </h3>
              <p className="text-xs text-slate-400 font-thai mt-0.5">
                แสดง {filteredShotLogs.length} รายการ (Line: {selectedLineFilter})
              </p>
            </div>

            <button
              onClick={handleExportProductionExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs font-mono transition-colors shadow"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT PRODUCTION (EXCEL)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg custom-scrollbar">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-[#0B172E] text-cyan-300 uppercase text-xs font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">RECORD ID</th>
                  <th className="py-3 px-3">LINE</th>
                  <th className="py-3 px-3">DATE / SHIFT</th>
                  <th className="py-3 px-3">METHOD</th>
                  <th className="py-3 px-3 text-right">PREVIOUS</th>
                  <th className="py-3 px-3 text-right">INCREMENT</th>
                  <th className="py-3 px-3 text-right">NEW TOTAL</th>
                  <th className="py-3 px-3">OPERATOR</th>
                  <th className="py-3 px-3">REASON / NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-bold">
                {filteredShotLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-thai">
                      ไม่พบข้อมูลบันทึกประวัติการผลิตตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredShotLogs.map(s => (
                    <tr key={s.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 text-cyan-400 font-bold">{s.id}</td>
                      <td className="py-3 px-3">LINE {s.lineId}</td>
                      <td className="py-3 px-3 text-slate-300">{s.productionDate || s.timestamp.slice(0, 10)} ({s.shift})</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.inputMethod === 'AUTOMATIC_PLC' 
                            ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {s.inputMethod || 'MANUAL'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">{formatShots(s.previousTotal)}</td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-black">+{formatShots(s.shotsAdded)}</td>
                      <td className="py-3 px-3 text-right text-white font-black">{formatShots(s.newTotal)}</td>
                      <td className="py-3 px-3 text-slate-300">{s.operatorName || 'System'}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate">{s.entryReason || s.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MAINTENANCE REPLACEMENTS TABLE */}
      {activeTab === 'MAINTENANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                <Wrench className="w-5 h-5 text-amber-400" />
                Tooling Maintenance & Replacement History (ประวัติการเปลี่ยนอะไหล่แม่พิมพ์)
              </h3>
              <p className="text-xs text-slate-400 font-thai mt-0.5">
                แสดง {filteredReplacements.length} รายการ (Line: {selectedLineFilter})
              </p>
            </div>

            <button
              onClick={handleExportMaintenanceExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-xs font-mono transition-colors shadow"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT REPLACEMENTS (EXCEL)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg custom-scrollbar">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-[#0B172E] text-amber-300 uppercase text-xs font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">RECORD ID</th>
                  <th className="py-3 px-3">LINE / DIE</th>
                  <th className="py-3 px-3">PART NAME & CODE</th>
                  <th className="py-3 px-3">POSITION</th>
                  <th className="py-3 px-3">TYPE</th>
                  <th className="py-3 px-3 text-center">QTY</th>
                  <th className="py-3 px-3 text-right">SHOT AT CHANGE</th>
                  <th className="py-3 px-3 text-right">USED SHOT</th>
                  <th className="py-3 px-3">TECHNICIAN</th>
                  <th className="py-3 px-3">REASON / NOTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-bold">
                {filteredReplacements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-thai">
                      ไม่พบข้อมูลประวัติการเปลี่ยนอะไหล่ตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredReplacements.map(r => (
                    <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 text-amber-400 font-bold">{r.id}</td>
                      <td className="py-3 px-3">
                        <div className="text-white">LINE {r.lineId}</div>
                        <div className="text-[11px] text-slate-400">{r.dieCode || '-'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white font-sans">{r.partName}</div>
                        <div className="text-[11px] text-cyan-400">{r.partCode}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{r.position || 'ALL'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.replacementType === 'NEW_SPARE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {r.replacementType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-white font-bold">{r.changedQuantity || r.replacedQty || 1}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{formatShots(r.machineShotAtReplacement || r.shotAtReplacement || 0)}</td>
                      <td className="py-3 px-3 text-right text-cyan-300 font-black">{formatShots(r.removedPartUsedShot || r.partAccumulatedShots || 0)}</td>
                      <td className="py-3 px-3 text-slate-300">{r.changedBy || r.technicianName || r.operatorName || '-'}</td>
                      <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">{r.replacementReason || r.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGRINDING LOGS TABLE */}
      {activeTab === 'REGRIND' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-mono">
                <RotateCcw className="w-5 h-5 text-cyan-400" />
                Regrinding & Resharpening Workshop Logs (ประวัติการเจียรลับคม)
              </h3>
              <p className="text-xs text-slate-400 font-thai mt-0.5">
                แสดง {filteredRegrinds.length} รายการ (Line: {selectedLineFilter})
              </p>
            </div>

            <button
              onClick={handleExportRegrindingExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs font-mono transition-colors shadow"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT REGRIND (EXCEL)</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg custom-scrollbar">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-[#0B172E] text-cyan-300 uppercase text-xs font-black border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">JOB CODE</th>
                  <th className="py-3 px-3">DATE</th>
                  <th className="py-3 px-3">LINE / DIE</th>
                  <th className="py-3 px-3">PART NAME & CODE</th>
                  <th className="py-3 px-3 text-center">CYCLE</th>
                  <th className="py-3 px-3 text-right">PREV LENGTH</th>
                  <th className="py-3 px-3 text-right">CURR LENGTH</th>
                  <th className="py-3 px-3 text-right">REMOVED (mm)</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3">PROCESS / TECH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-bold">
                {filteredRegrinds.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-thai">
                      ไม่พบข้อมูลบันทึกประวัติการเจียรตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredRegrinds.map(g => (
                    <tr key={g.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 text-cyan-400 font-bold">{g.jobCode || g.id}</td>
                      <td className="py-3 px-3 text-slate-300">{g.regrindDate || '-'}</td>
                      <td className="py-3 px-3">LINE {g.lineId || g.lineLastUsed || 'E1'}</td>
                      <td className="py-3 px-3">
                        <div className="text-white font-sans">{g.partName}</div>
                        <div className="text-[11px] text-cyan-400">{g.partCode}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-amber-300 font-black">#{g.regrindCountAfter || 1}</td>
                      <td className="py-3 px-3 text-right text-slate-400">{g.previousLength || '-'} mm</td>
                      <td className="py-3 px-3 text-right text-white font-bold">{g.currentLength || '-'} mm</td>
                      <td className="py-3 px-3 text-right text-rose-400 font-black">-{g.actualGrindingRemovedMm || 0} mm</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {g.inspectionResult || 'PASSED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{g.supplierOrInternalProcess || g.vendorName || 'Tool Room'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
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

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <span>Role-Based Access Control & Approvals (10 Roles)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-thai">
          จัดการสิทธิ์ผู้ใช้งาน (10 ระดับ: Operator, Maintenance Tech, Die Specialist, Tooling Engineer, Quality Inspector, Supervisor, Production Manager, Warehouse Specialist, Purchasing Officer, System Admin)
        </p>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">System Users & Assigned RBAC Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => (
            <div key={u.id} className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{u.name}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                  {u.role}
                </span>
              </div>
              <div className="text-slate-300 font-thai">{u.nameTh}</div>
              <div className="text-slate-500 text-[10px] flex justify-between">
                <span>{u.department}</span>
                <span>ID: {u.employeeId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Correction Modal Form State
  const [correctionForm, setCorrectionForm] = useState<{
    module: AuditModuleType;
    originalRecordId: string;
    actionType: 'REPLACEMENT_CORRECTION' | 'SHOT_CORRECTION' | 'STOCK_CORRECTION' | 'REGRIND_CORRECTION';
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    reason: string;
    isProductionImpacting: boolean;
  }>({
    module: 'REPLACEMENT',
    originalRecordId: 'REP-2026-0891',
    actionType: 'REPLACEMENT_CORRECTION',
    fieldChanged: 'usedShotAtReplacement',
    oldValue: '48,200,000',
    newValue: '47,500,000',
    reason: '',
    isProductionImpacting: true
  });

  const reload = () => {
    setLogs(storageService.getAuditLogs());
    setCurrentUser(storageService.getCurrentUser());
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const permissions = getRolePermissions(currentUser.role);
  const canPerformSafeCorrection = permissions.canApproveReplacementCorrections || permissions.canSubmitShotCorrections || permissions.canAdministerSystem;

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (log.auditId || '').toLowerCase().includes(term) ||
      (log.recordId || '').toLowerCase().includes(term) ||
      (log.user || log.userName || '').toLowerCase().includes(term) ||
      (log.reason || log.details || '').toLowerCase().includes(term) ||
      (log.fieldChanged || '').toLowerCase().includes(term) ||
      (log.ipReference || '').toLowerCase().includes(term);

    const matchModule = filterModule === 'ALL' || log.module === filterModule || log.actionCategory === filterModule;
    const matchAction = filterAction === 'ALL' || log.action === filterAction;

    return matchSearch && matchModule && matchAction;
  });

  const handleOpenCorrection = (log?: AuditLogEntry) => {
    if (log) {
      setCorrectionForm({
        module: (log.module as AuditModuleType) || 'REPLACEMENT',
        originalRecordId: log.recordId || log.id,
        actionType: 'REPLACEMENT_CORRECTION',
        fieldChanged: log.fieldChanged || 'quantity',
        oldValue: String(log.newValue || log.oldValue || ''),
        newValue: '',
        reason: '',
        isProductionImpacting: true
      });
    }
    setShowCorrectionModal(true);
    setErrorMsg(null);
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim() || correctionForm.reason.trim().length < 5) {
      setErrorMsg('Mandatory Reason: A detailed explanation (minimum 5 characters) is required for safe corrections.');
      return;
    }

    const res = storageService.submitSafeCorrection({
      module: correctionForm.module,
      originalRecordId: correctionForm.originalRecordId,
      actionType: correctionForm.actionType,
      fieldChanged: correctionForm.fieldChanged,
      oldValue: correctionForm.oldValue,
      newValue: correctionForm.newValue,
      reason: correctionForm.reason,
      correctedData: {},
      isProductionImpacting: correctionForm.isProductionImpacting,
      approverName: currentUser.name
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setShowCorrectionModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.error || 'Failed to submit correction');
    }
  };

  const handleExportAuditCSV = () => {
    const headers = 'Audit ID,Date Time,Module,Record ID,Action,Field Changed,Old Value,New Value,Reason,User,Role,IP Ref\n';
    const rows = logs.map(l => 
      `"${l.auditId || l.id}","${l.dateTime || l.timestamp}","${l.module || l.actionCategory}","${l.recordId || ''}","${l.action}","${l.fieldChanged || ''}","${String(l.oldValue || '').replace(/"/g, '""')}","${String(l.newValue || '').replace(/"/g, '""')}","${(l.reason || l.details || '').replace(/"/g, '""')}","${l.user || l.userName}","${l.role || l.userRole}","${l.ipReference || ''}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinDie_Immutable_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            System-Wide Immutable Audit Trail & Safe Correction Log
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            บันทึกประวัติการเปลี่ยนแปลงทั้งหมดตามมาตรฐาน IATF 16949 / ISO 9001 (ห้ามแก้ไขทับข้อมูลเดิม, มีระบบ Reversal & Safe Correction, บันทึก IP และเหตุผลประกอบทุกรายการ)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canPerformSafeCorrection && (
            <button
              onClick={() => handleOpenCorrection()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors shadow font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>INITIATE SAFE CORRECTION</span>
            </button>
          )}

          <button
            onClick={handleExportAuditCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow font-mono"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT AUDIT TRAIL</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 rounded text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search Audit ID, Record ID, User, Reason, IP..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Module:</span>
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Modules</option>
              <option value="REPLACEMENT">REPLACEMENT</option>
              <option value="SHOT">SHOT</option>
              <option value="REGRIND">REGRIND</option>
              <option value="SPARE_STOCK">SPARE_STOCK</option>
              <option value="CONFIGURATION">CONFIGURATION</option>
              <option value="STANDARD">STANDARD</option>
              <option value="USER_AUTH">USER_AUTH</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Action:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="REVERSAL">REVERSAL</option>
              <option value="REPLACEMENT_CORRECTION">REPLACEMENT_CORRECTION</option>
              <option value="SHOT_CORRECTION">SHOT_CORRECTION</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="REJECTION">REJECTION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Append-Only Audit Log Records (Showing {filteredLogs.length} entries)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">IATF 16949 / ISO 9001 Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">AUDIT ID / TIME</th>
                <th className="py-2.5 px-2">MODULE</th>
                <th className="py-2.5 px-2">RECORD ID</th>
                <th className="py-2.5 px-2">ACTION</th>
                <th className="py-2.5 px-2">FIELD / VALUES (OLD &rarr; NEW)</th>
                <th className="py-2.5 px-3">REASON / DETAILS</th>
                <th className="py-2.5 px-2">USER & ROLE</th>
                <th className="py-2.5 px-2">IP / SESSION</th>
                <th className="py-2.5 px-2 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map(l => {
                const isReversal = l.action === 'REVERSAL' || (l.action && l.action.includes('CORRECTION'));
                return (
                  <tr key={l.id} className={`hover:bg-slate-800/50 ${isReversal ? 'bg-amber-950/20' : ''}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-cyan-300">{l.auditId || l.id.slice(0, 14)}</div>
                      <div className="text-[10px] text-slate-500">{l.dateTime || l.timestamp}</div>
                    </td>

                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {l.module || l.actionCategory || 'SYSTEM'}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 font-bold text-slate-200">
                      {l.recordId || '-'}
                    </td>

                    <td className="py-2.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        l.action === 'REVERSAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : l.action.includes('CORRECTION')
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : l.action === 'APPROVAL'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-cyan-300 border border-slate-700'
                      }`}>
                        {l.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 max-w-[200px]">
                      {l.fieldChanged && (
                        <div className="text-[10px] text-slate-400">Field: <span className="text-slate-200 font-semibold">{l.fieldChanged}</span></div>
                      )}
                      {(l.oldValue || l.newValue) && (
                        <div className="text-[10px] truncate text-slate-300">
                          <span className="text-rose-400 line-through">{String(l.oldValue || '')}</span> &rarr; <span className="text-emerald-400 font-bold">{String(l.newValue || '')}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 max-w-[240px]">
                      <div className="text-slate-200 truncate text-[11px] font-semibold">{l.reason || l.details}</div>
                      {l.detailsTh && <div className="text-[10px] text-slate-400 font-thai truncate">{l.detailsTh}</div>}
                    </td>

                    <td className="py-2.5 px-2">
                      <div className="text-slate-200 font-semibold">{l.userName || l.user}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{l.role || l.userRole}</div>
                    </td>

                    <td className="py-2.5 px-2 text-[10px] text-slate-400">
                      <div>{l.ipReference || '192.168.10.45'}</div>
                      <div className="text-slate-600">{l.sessionReference || 'SES-ACTIVE'}</div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {canPerformSafeCorrection && (
                        <button
                          onClick={() => handleOpenCorrection(l)}
                          title="Initiate safe correction against this record"
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-300 rounded text-[10px] transition-colors"
                        >
                          Correct
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-lg w-full space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Initiate Safe Correction Workflow
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-700/60 p-3 rounded text-[11px] text-amber-200">
              <strong>Strict IATF Audit Policy:</strong> Approved transactions are never silently overwritten. This operation will generate a linked reversal record and a replacement transaction.
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Module *</label>
                  <select
                    value={correctionForm.module}
                    onChange={e => setCorrectionForm({ ...correctionForm, module: e.target.value as AuditModuleType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="REPLACEMENT">REPLACEMENT</option>
                    <option value="SHOT">SHOT</option>
                    <option value="REGRIND">REGRIND</option>
                    <option value="SPARE_STOCK">SPARE_STOCK</option>
                    <option value="CONFIGURATION">CONFIGURATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Original Record ID *</label>
                  <input
                    type="text"
                    value={correctionForm.originalRecordId}
                    onChange={e => setCorrectionForm({ ...correctionForm, originalRecordId: e.target.value })}
                    placeholder="e.g. REP-2026-0891"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Field Name to Correct *</label>
                <input
                  type="text"
                  value={correctionForm.fieldChanged}
                  onChange={e => setCorrectionForm({ ...correctionForm, fieldChanged: e.target.value })}
                  placeholder="e.g. usedShotAtReplacement, quantity, position"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Old Value</label>
                  <input
                    type="text"
                    value={correctionForm.oldValue}
                    onChange={e => setCorrectionForm({ ...correctionForm, oldValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">New Corrected Value *</label>
                  <input
                    type="text"
                    value={correctionForm.newValue}
                    onChange={e => setCorrectionForm({ ...correctionForm, newValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Mandatory Reason (min 5 chars) *</label>
                <textarea
                  rows={3}
                  value={correctionForm.reason}
                  onChange={e => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="Explain why this correction is required (e.g. Incorrect meter reading transcribed during Shift 2)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shadow-lg"
                >
                  SUBMIT REVERSAL & SAFE CORRECTION
                </button>
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
