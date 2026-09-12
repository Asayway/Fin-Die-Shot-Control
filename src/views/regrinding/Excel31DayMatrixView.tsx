import React, { useState, useMemo } from 'react';
import { MonthlyCalendarMatrix, RegrindWorkTicket } from '../../types/regrind';
import { regrindService } from '../../services/regrindService';
import { ToolingPicThumbnail } from '../../components/regrind/ToolingPicThumbnail';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  Calendar,
  Wrench,
  AlertOctagon,
  Factory,
  RotateCcw,
  Sparkles,
  Plus,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';

interface LineQuickFilter {
  id: string;
  label: string;
  subLabel: string;
}

const LINE_QUICK_FILTERS: LineQuickFilter[] = [
  { id: 'ALL', label: 'ALL LINES', subLabel: 'ทุกสายการผลิต (7 Lines: E1-E5)' },
  { id: 'E1', label: 'E1', subLabel: 'Ø7 Slit, PCM' },
  { id: 'E2', label: 'E2', subLabel: 'Ø5 Slit, GOLD' },
  { id: 'E3-1', label: 'E3-1', subLabel: 'Slit 3P, PCM' },
  { id: 'E3-2', label: 'E3-2', subLabel: 'WL+ 4P, GOLD' },
  { id: 'E3-3', label: 'E3-3', subLabel: 'Corr 4P, GOLD' },
  { id: 'E4', label: 'E4', subLabel: 'Ø5 Slit, BARE' },
  { id: 'E5', label: 'E5', subLabel: 'Ø5 Slit, BARE' },
];

const MONTH_DEFINITIONS = [
  { month: 1, nameTh: 'มกราคม', shortTh: 'ม.ค.', nameEn: 'January', shortEn: 'JAN' },
  { month: 2, nameTh: 'กุมภาพันธ์', shortTh: 'ก.พ.', nameEn: 'February', shortEn: 'FEB' },
  { month: 3, nameTh: 'มีนาคม', shortTh: 'มี.ค.', nameEn: 'March', shortEn: 'MAR' },
  { month: 4, nameTh: 'เมษายน', shortTh: 'เม.ย.', nameEn: 'April', shortEn: 'APR' },
  { month: 5, nameTh: 'พฤษภาคม', shortTh: 'พ.ค.', nameEn: 'May', shortEn: 'MAY' },
  { month: 6, nameTh: 'มิถุนายน', shortTh: 'มิ.ย.', nameEn: 'June', shortEn: 'JUN' },
  { month: 7, nameTh: 'กรกฎาคม', shortTh: 'ก.ค.', nameEn: 'July', shortEn: 'JUL' },
  { month: 8, nameTh: 'สิงหาคม', shortTh: 'ส.ค.', nameEn: 'August', shortEn: 'AUG' },
  { month: 9, nameTh: 'กันยายน', shortTh: 'ก.ย.', nameEn: 'September', shortEn: 'SEP' },
  { month: 10, nameTh: 'ตุลาคม', shortTh: 'ต.ค.', nameEn: 'October', shortEn: 'OCT' },
  { month: 11, nameTh: 'พฤศจิกายน', shortTh: 'พ.ย.', nameEn: 'November', shortEn: 'NOV' },
  { month: 12, nameTh: 'ธันวาคม', shortTh: 'ธ.ค.', nameEn: 'December', shortEn: 'DEC' },
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];

interface Excel31DayMatrixViewProps {
  matrix: MonthlyCalendarMatrix;
  onUpdateCell: (category: 'REPAIR' | 'DEFECT_SCRAP', partName: string, day: number, count: number) => void;
  onMonthChange: (year: number, month: number) => void;
  mode?: 'REPAIR' | 'DEFECT_SCRAP';
  selectedGlobalPart?: string;
  onRefreshData?: () => void;
}

export const Excel31DayMatrixView: React.FC<Excel31DayMatrixViewProps> = ({
  matrix,
  onUpdateCell,
  onMonthChange,
  mode,
  selectedGlobalPart = 'ALL',
  onRefreshData
}) => {
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Inline cell edit state
  const [editingCell, setEditingCell] = useState<{
    category: 'REPAIR' | 'DEFECT_SCRAP';
    partName: string;
    day: number;
    value: number;
  } | null>(null);

  // Matrix Cell New Repair Job Creation Pop-up Modal State (Module 1 Requirement)
  const [cellJobModal, setCellJobModal] = useState<{
    partName: string;
    day: number;
    month: number;
    year: number;
    currentCount: number;
  } | null>(null);

  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalTargetDate, setModalTargetDate] = useState<string>('');
  const [modalNote, setModalNote] = useState<string>('');
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);

  // Get current tickets to map status & tooltips onto matrix cells
  const tickets = useMemo(() => regrindService.getQueueTickets(), [matrix, cellJobModal]);

  // Exact days calculation based on standard calendar rules
  const daysInMonth = useMemo(() => {
    return new Date(matrix.year, matrix.month, 0).getDate();
  }, [matrix.year, matrix.month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const currentMonthInfo = useMemo(() => {
    return MONTH_DEFINITIONS.find(m => m.month === matrix.month) || MONTH_DEFINITIONS[0];
  }, [matrix.month]);

  // Month navigation
  const handlePrevMonth = () => {
    if (matrix.month === 1) {
      onMonthChange(matrix.year - 1, 12);
    } else {
      onMonthChange(matrix.year, matrix.month - 1);
    }
  };

  const handleNextMonth = () => {
    if (matrix.month === 12) {
      onMonthChange(matrix.year + 1, 1);
    } else {
      onMonthChange(matrix.year, matrix.month + 1);
    }
  };

  const handleYearChange = (newYear: number) => {
    onMonthChange(newYear, matrix.month);
  };

  const handleMonthSelect = (newMonth: number) => {
    onMonthChange(matrix.year, newMonth);
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  // Filter rows
  const filteredRepairRows = useMemo(() => {
    return matrix.repairRows.filter(row => {
      if (selectedGlobalPart !== 'ALL' && row.partName.toLowerCase() !== selectedGlobalPart.toLowerCase()) {
        return false;
      }

      const matchSearch =
        row.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.partCode.toLowerCase().includes(searchTerm.toLowerCase());

      let matchLine = true;
      if (selectedLine !== 'ALL') {
        const is7 =
          selectedLine === 'E1' ||
          selectedLine === 'E3-1' ||
          selectedLine === 'E3-2' ||
          selectedLine === 'E3-3';
        const is5 = selectedLine === 'E2' || selectedLine === 'E4' || selectedLine === 'E5';
        const lower = row.partName.toLowerCase();
        if (is7 && (lower.includes('7') || lower.includes('louver') || lower.includes('slit'))) {
          matchLine = true;
        } else if (is5 && lower.includes('5')) {
          matchLine = true;
        } else {
          matchLine = !lower.includes('7') && !lower.includes('5');
        }
      }
      return matchSearch && matchLine;
    });
  }, [matrix.repairRows, searchTerm, selectedLine, selectedGlobalPart]);

  const filteredDefectRows = useMemo(() => {
    return matrix.defectRows.filter(row => {
      if (selectedGlobalPart !== 'ALL' && row.partName.toLowerCase() !== selectedGlobalPart.toLowerCase()) {
        return false;
      }

      const matchSearch =
        row.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.partCode.toLowerCase().includes(searchTerm.toLowerCase());

      let matchLine = true;
      if (selectedLine !== 'ALL') {
        const is7 =
          selectedLine === 'E1' ||
          selectedLine === 'E3-1' ||
          selectedLine === 'E3-2' ||
          selectedLine === 'E3-3';
        const is5 = selectedLine === 'E2' || selectedLine === 'E4' || selectedLine === 'E5';
        const lower = row.partName.toLowerCase();
        if (is7 && (lower.includes('7') || lower.includes('louver') || lower.includes('slit'))) {
          matchLine = true;
        } else if (is5 && lower.includes('5')) {
          matchLine = true;
        } else {
          matchLine = !lower.includes('7') && !lower.includes('5');
        }
      }
      return matchSearch && matchLine;
    });
  }, [matrix.defectRows, searchTerm, selectedLine, selectedGlobalPart]);

  // Export CSV (Adjusted to exact days in current month)
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `FIN DIE REGRINDING MATRIX REPORT - ${currentMonthInfo.nameEn.toUpperCase()} ${matrix.year} (${daysInMonth} DAYS)\n\n`;

    // 1. Repair section
    csvContent += `HE Grinding Repair ปี ${matrix.year} (งานเจียรสำเร็จ ${currentMonthInfo.nameTh})\n`;
    csvContent += `No,Part Code,Item Name,${daysArray.join(',')},Total\n`;
    filteredRepairRows.forEach((row, idx) => {
      const dailyVals = daysArray.map(d => row.dailyCounts[d] || 0);
      csvContent += `${idx + 1},"${row.partCode}","${row.partName}",${dailyVals.join(',')},${row.total}\n`;
    });
    const repairDailySums = daysArray.map(d =>
      filteredRepairRows.reduce((sum, r) => sum + (r.dailyCounts[d] || 0), 0)
    );
    csvContent += `Total,,,${repairDailySums.join(',')},${filteredRepairRows.reduce((s, r) => s + r.total, 0)}\n\n`;

    // 2. Defect section
    csvContent += `ซ่อมไม่ได้ (ทิ้ง) / HE Grinding Defect ปี ${matrix.year} (${currentMonthInfo.nameTh})\n`;
    csvContent += `No,Part Code,Item Name,${daysArray.join(',')},Total\n`;
    filteredDefectRows.forEach((row, idx) => {
      const dailyVals = daysArray.map(d => row.dailyCounts[d] || 0);
      csvContent += `${idx + 1},"${row.partCode}","${row.partName}",${dailyVals.join(',')},${row.total}\n`;
    });
    const defectDailySums = daysArray.map(d =>
      filteredDefectRows.reduce((sum, r) => sum + (r.dailyCounts[d] || 0), 0)
    );
    csvContent += `Total Defect,,,${defectDailySums.join(',')},${filteredDefectRows.reduce((s, r) => s + r.total, 0)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinDie_Regrinding_Matrix_${matrix.year}_M${matrix.month}_${daysInMonth}Days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    onUpdateCell(editingCell.category, editingCell.partName, editingCell.day, editingCell.value);
    setEditingCell(null);
  };

  // Daily Column Totals
  const getDailyRepairTotal = (day: number) => {
    return filteredRepairRows.reduce((acc, row) => acc + (row.dailyCounts[day] || 0), 0);
  };

  const getDailyDefectTotal = (day: number) => {
    return filteredDefectRows.reduce((acc, row) => acc + (row.dailyCounts[day] || 0), 0);
  };

  const filteredRepairTotal = filteredRepairRows.reduce((sum, r) => sum + r.total, 0);
  const filteredDefectTotal = filteredDefectRows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Filter & Action Bar Header */}
      <div className="bg-[#0D1527] border border-slate-700/90 rounded-xl p-3 sm:p-4 shadow-lg space-y-3">
        {/* Row 1: Header Info & Month/Year Long-Term Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Monthly Regrinding & Defect Matrix</span>
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {currentMonthInfo.nameEn.toUpperCase()} {matrix.year} ({daysInMonth} วัน)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-sans font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {currentMonthInfo.nameTh}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ตารางบันทึกงานเจียรรายวันตามปฏิทินจริง ({daysInMonth} วัน) และประวัติการตัดทิ้ง รองรับปี {matrix.year} และอนาคต
              </p>
            </div>
          </div>

          {/* Long-Term Calendar Controls (Year + Month Picker) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Dropdown */}
            <div className="flex items-center bg-[#070D19] border border-slate-700 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
              <select
                value={matrix.year}
                onChange={e => handleYearChange(parseInt(e.target.value) || 2026)}
                className="bg-transparent text-cyan-300 font-bold font-mono text-xs focus:outline-none cursor-pointer"
                title="เลือกปี ค.ศ."
              >
                {AVAILABLE_YEARS.map(yr => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    ปี {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown & Steppers */}
            <div className="flex items-center bg-[#070D19] rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={matrix.month}
                onChange={e => handleMonthSelect(parseInt(e.target.value) || 1)}
                className="bg-transparent text-emerald-300 font-bold font-mono text-xs px-1.5 py-1 focus:outline-none cursor-pointer"
                title="เลือกเดือน"
              >
                {MONTH_DEFINITIONS.map(m => {
                  const mDays = new Date(matrix.year, m.month, 0).getDate();
                  return (
                    <option key={m.month} value={m.month} className="bg-slate-900 text-white">
                      {m.shortEn} - {m.nameTh} ({mDays} วัน)
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Month Quick Button */}
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
              title="กระโดดไปยังเดือนและปีปัจจุบัน"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>ปัจจุบัน</span>
            </button>

            {/* Export & Print */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition-all shadow-sm"
              title={`ส่งออกรายงาน Excel CSV ${daysInMonth} วัน`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({daysInMonth}d)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Summary counters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#070D19] border border-slate-700 rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชิ้นส่วน / รหัสแม่พิมพ์ในตาราง..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none w-52 sm:w-72"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              REPAIR: {filteredRepairTotal} ชิ้น
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              DEFECT: {filteredDefectTotal} ชิ้น
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-bold">
              เดือนนี้มี {daysInMonth} วัน
            </span>
          </div>
        </div>

        {/* Row 3: Line Quick Selection Buttons */}
        <div className="bg-[#070D19] border border-slate-800 rounded-lg p-1.5 flex flex-wrap items-center gap-1.5 shadow-inner">
          <span className="text-[11px] font-mono font-bold text-slate-400 px-2 flex items-center gap-1">
            <Factory className="w-3.5 h-3.5 text-cyan-400" />
            <span>LINE:</span>
          </span>

          {LINE_QUICK_FILTERS.map(lf => {
            const isSelected = selectedLine === lf.id;
            return (
              <button
                key={lf.id}
                type="button"
                onClick={() => setSelectedLine(lf.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-extrabold scale-105 z-10'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                <span>{lf.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  ({lf.subLabel})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Mini-Cards */}
      {(!mode || mode === 'REPAIR') && (
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 rounded-xl bg-[#131E35] border border-emerald-500/40 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Wrench className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  HE Grinding Repair (งานเจียรสำเร็จจากคิวงาน)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {filteredRepairRows.length} รายการ | {currentMonthInfo.nameTh} {matrix.year} ({daysInMonth} วัน)
                </span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {filteredRepairTotal.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {(!mode || mode === 'DEFECT_SCRAP') && (
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 rounded-xl bg-[#131E35] border border-rose-500/40 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertOctagon className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  HE Grinding Defect / Scrap (งานซ่อมไม่ได้ / ทิ้ง)
                </span>
                <span className="text-[11px] text-rose-400 font-mono">
                  {filteredDefectRows.length} รายการ | ชิ้นส่วนที่หมดอายุหรือแตกหัก
                </span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-400">
              {filteredDefectTotal.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">ชิ้น</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HE Grinding Repair Matrix (งานเจียรสำเร็จ) */}
      {/* ========================================================================= */}
      {(!mode || mode === 'REPAIR') && (
      <div className="bg-[#131E35] rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-700/60 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wide text-emerald-200">
              HE Grinding Repair ปี {matrix.year} • {currentMonthInfo.nameTh} (ตารางบันทึกงานเจียรสำเร็จ {daysInMonth} วัน)
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-600">
            รวม: {filteredRepairTotal} ชิ้น
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-[#0B1220] text-slate-300 sticky top-0 z-20 border-b border-slate-700 shadow">
              <tr>
                <th className="p-2 w-8 text-center border-r border-slate-700 font-bold font-mono">
                  No.
                </th>
                <th className="p-2 min-w-[210px] border-r border-slate-700 font-bold">
                  Date / Item Name
                </th>
                <th className="p-1 w-12 text-center border-r border-slate-700 font-bold">
                  Pic
                </th>
                {daysArray.map(day => (
                  <th
                    key={`repair-head-day-${day}`}
                    className="p-1 min-w-[28px] text-center border-r border-slate-800 font-mono font-bold hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    {day}
                  </th>
                ))}
                <th className="p-2 w-16 text-center bg-emerald-950 text-emerald-300 font-bold font-mono border-l border-slate-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRepairRows.map((row, idx) => (
                <tr
                  key={`repair-row-${row.partName}`}
                  className="hover:bg-slate-800/60 transition-colors group"
                >
                  <td className="p-2 text-center font-mono text-cyan-400/70 border-r border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-800 font-medium text-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{row.partName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({row.partCode})</span>
                      {row.total > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-1 text-center border-r border-slate-800">
                    <ToolingPicThumbnail
                      picCategory={row.picCategory}
                      partName={row.partName}
                      size="xs"
                    />
                  </td>
                  {daysArray.map(day => {
                    const count = row.dailyCounts[day] || 0;
                    
                    // Find ticket for this part and day
                    const matchingTicket = tickets.find(t => {
                      const matchName = t.partName.toLowerCase() === row.partName.toLowerCase();
                      const ticketDate = t.targetCompletionDate ? new Date(t.targetCompletionDate) : new Date(t.createdAt);
                      return matchName && ticketDate.getDate() === day && (ticketDate.getMonth() + 1) === matrix.month;
                    });

                    const now = new Date();
                    const targetDateObj = matchingTicket?.targetCompletionDate ? new Date(matchingTicket.targetCompletionDate) : null;
                    const isOverdue = matchingTicket && matchingTicket.status !== 'READY' && matchingTicket.status !== 'SCRAP' && ((targetDateObj && targetDateObj < now) || matchingTicket.isDelayed);

                    // Color status calculation (Module 1 Requirement)
                    let statusBgClass = 'text-slate-600 hover:bg-slate-800/80';
                    let statusBadgeLabel = '';

                    if (matchingTicket) {
                      switch (matchingTicket.status) {
                        case 'PENDING':
                          statusBgClass = 'bg-yellow-400 text-slate-950 font-black shadow-xs';
                          statusBadgeLabel = '🟡 PENDING';
                          break;
                        case 'IN_PROCESS':
                          statusBgClass = 'bg-blue-600 text-white font-black shadow-xs';
                          statusBadgeLabel = '🔵 IN-PROCESS';
                          break;
                        case 'READY':
                          statusBgClass = 'bg-emerald-600 text-white font-black shadow-xs';
                          statusBadgeLabel = '🟢 READY';
                          break;
                        case 'SCRAP':
                          statusBgClass = 'bg-rose-600 text-white font-black shadow-xs';
                          statusBadgeLabel = '🔴 SCRAP';
                          break;
                      }
                    } else if (count > 0) {
                      statusBgClass = 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-700/60';
                    }

                    const overdueBorderClass = isOverdue ? 'border-2 border-orange-500 animate-pulse ring-2 ring-orange-400' : 'border-r border-slate-800/60';

                    const cellKey = `${row.partName}-${day}`;

                    return (
                      <td
                        key={`repair-cell-${row.partName}-${day}`}
                        onMouseEnter={() => setHoveredCellKey(cellKey)}
                        onMouseLeave={() => setHoveredCellKey(null)}
                        onClick={() => {
                          const targetIso = `${matrix.year}-${String(matrix.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T17:00`;
                          setModalQuantity(count > 0 ? count : 1);
                          setModalTargetDate(targetIso);
                          setModalNote('');
                          setCellJobModal({
                            partName: row.partName,
                            day,
                            month: matrix.month,
                            year: matrix.year,
                            currentCount: count
                          });
                        }}
                        className={`p-1 text-center font-mono cursor-pointer transition-all relative ${statusBgClass} ${overdueBorderClass}`}
                        title={`คลิกเปิดใบงาน / วางแผนเจียร: ${row.partName} วันที่ ${day} ${currentMonthInfo.nameTh}`}
                      >
                        {count > 0 ? (
                          <span className="font-extrabold text-[11px] block">
                            {count}
                          </span>
                        ) : matchingTicket ? (
                          <span className="text-[10px] font-bold">1</span>
                        ) : (
                          '-'
                        )}

                        {/* Hover Tooltip (Module 1 Requirement) */}
                        {hoveredCellKey === cellKey && (matchingTicket || count > 0) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-slate-950 text-white border border-slate-700 shadow-2xl z-50 text-left pointer-events-none text-[11px]">
                            <div className="font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1 flex justify-between items-center">
                              <span>{row.partName}</span>
                              <span className="text-[10px] font-mono text-slate-400">Day {day} {currentMonthInfo.shortEn}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-300">
                                <strong className="text-slate-400">จำนวน:</strong> {count || matchingTicket?.quantity || 1} ชิ้น
                              </p>
                              {matchingTicket && (
                                <>
                                  <p className="flex items-center gap-1 font-mono text-[10px] text-cyan-400">
                                    <strong>Ticket:</strong> {matchingTicket.jobCode}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <strong>สถานะ:</strong> <span className="font-bold">{statusBadgeLabel || matchingTicket.status}</span>
                                  </p>
                                  <p className="text-slate-400 text-[10px]">
                                    <strong>เป้าหมาย:</strong> {matchingTicket.targetCompletionDate ? new Date(matchingTicket.targetCompletionDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '17:00'}
                                  </p>
                                  {isOverdue && (
                                    <p className="text-orange-400 font-bold flex items-center gap-1 animate-pulse">
                                      <AlertTriangle className="w-3 h-3" />
                                      Overdue / Delayed [ย้ายวันอัตโนมัติ]
                                    </p>
                                  )}
                                </>
                              )}
                              {!matchingTicket && (
                                <p className="text-emerald-400 font-semibold">
                                  บันทึกงานสำเร็จในตาราง {count} ชิ้น
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-mono font-black text-emerald-400 bg-emerald-950/30 border-l border-slate-800">
                    {row.total > 0 ? row.total : 0}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Daily Total Summary Row */}
            <tfoot className="bg-[#0B1220] font-bold border-t-2 border-slate-700 sticky bottom-0 z-10 shadow">
              <tr>
                <td colSpan={3} className="p-2 text-right border-r border-slate-700 text-slate-300">
                  Total (ชิ้น / วัน):
                </td>
                {daysArray.map(day => {
                  const dailyTotal = getDailyRepairTotal(day);
                  return (
                    <td
                      key={`repair-sum-day-${day}`}
                      className={`p-1 text-center font-mono border-r border-slate-800 text-[10px] ${
                        dailyTotal > 0
                          ? 'bg-emerald-950/80 text-emerald-300 font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      {dailyTotal > 0 ? dailyTotal : 0}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-mono font-black text-emerald-200 bg-emerald-900 border-l border-slate-700">
                  {filteredRepairTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ซ่อมไม่ได้ (ทิ้ง) / HE Grinding Defect Matrix */}
      {/* ========================================================================= */}
      {(!mode || mode === 'DEFECT_SCRAP') && (
      <div className="bg-[#131E35] rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-rose-950/90 border-b border-rose-700/60 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wide text-rose-200">
              ซ่อมไม่ได้ (ทิ้ง) / HE Grinding Defect ปี {matrix.year} • {currentMonthInfo.nameTh} ({daysInMonth} วัน)
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold bg-rose-950 text-rose-300 px-2.5 py-0.5 rounded border border-rose-600">
            รวม: {filteredDefectTotal} ชิ้น
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-[#0B1220] text-slate-300 sticky top-0 z-20 border-b border-slate-700 shadow">
              <tr>
                <th className="p-2 w-8 text-center border-r border-slate-700 font-bold font-mono">
                  No.
                </th>
                <th className="p-2 min-w-[210px] border-r border-slate-700 font-bold">
                  Date / Item Name
                </th>
                <th className="p-1 w-12 text-center border-r border-slate-700 font-bold">
                  Pic
                </th>
                {daysArray.map(day => (
                  <th
                    key={`defect-head-day-${day}`}
                    className="p-1 min-w-[28px] text-center border-r border-slate-800 font-mono font-bold hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    {day}
                  </th>
                ))}
                <th className="p-2 w-16 text-center bg-rose-950 text-rose-300 font-bold font-mono border-l border-slate-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDefectRows.map((row, idx) => (
                <tr
                  key={`defect-row-${row.partName}`}
                  className="hover:bg-slate-800/60 transition-colors group"
                >
                  <td className="p-2 text-center font-mono text-rose-400/70 border-r border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="p-2 border-r border-slate-800 font-medium text-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{row.partName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({row.partCode})</span>
                      {row.total > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-1 text-center border-r border-slate-800">
                    <ToolingPicThumbnail
                      picCategory={row.picCategory}
                      partName={row.partName}
                      size="xs"
                    />
                  </td>
                  {daysArray.map(day => {
                    const count = row.dailyCounts[day];
                    return (
                      <td
                        key={`defect-cell-${row.partName}-${day}`}
                        onClick={() =>
                          setEditingCell({
                            category: 'DEFECT_SCRAP',
                            partName: row.partName,
                            day,
                            value: count || 0
                          })
                        }
                        className={`p-1 text-center font-mono border-r border-slate-800/60 cursor-pointer transition-all hover:bg-rose-950/70 ${
                          count
                            ? 'bg-rose-950/40 text-rose-300 font-bold'
                            : 'text-slate-600'
                        }`}
                        title={`คลิกเพื่อแก้ไขจำนวนชิ้นที่ทิ้ง: ${row.partName} วันที่ ${day} ${currentMonthInfo.nameTh}`}
                      >
                        {count !== undefined && count > 0 ? (
                          <span className="inline-block px-1 rounded bg-rose-900/60 text-rose-300 text-[10px] border border-rose-700/50">
                            {count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-mono font-black text-rose-400 bg-rose-950/30 border-l border-slate-800">
                    {row.total > 0 ? row.total : 0}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Defect Daily Total Summary Row */}
            <tfoot className="bg-[#0B1220] font-bold border-t-2 border-slate-700 sticky bottom-0 z-10 shadow">
              <tr>
                <td colSpan={3} className="p-2 text-right border-r border-slate-700 text-slate-300">
                  Total Defect (ทิ้ง):
                </td>
                {daysArray.map(day => {
                  const dailyTotal = getDailyDefectTotal(day);
                  return (
                    <td
                      key={`defect-sum-day-${day}`}
                      className={`p-1 text-center font-mono border-r border-slate-800 text-[10px] ${
                        dailyTotal > 0
                          ? 'bg-rose-950/80 text-rose-300 font-black'
                          : 'text-slate-600'
                      }`}
                    >
                      {dailyTotal > 0 ? dailyTotal : 0}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-mono font-black text-rose-200 bg-rose-900 border-l border-slate-700">
                  {filteredDefectTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      )}

      {/* Pop-up Modal to Create Repair Job from Cell (Module 1 Requirement) */}
      {cellJobModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setCellJobModal(null)}
        >
          <div
            className="bg-[#0D1527] border border-cyan-500/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Plus className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-white tracking-tight">
                  เปิดใบงานเจียรลับคม (Planning Board)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                Day {cellJobModal.day} {currentMonthInfo.shortEn} {cellJobModal.year}
              </span>
            </div>

            <div className="space-y-3">
              {/* Part Name (Auto-filled) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ชื่อชิ้นส่วนทูลลิ่ง (Part Name - Auto Filled):
                </label>
                <div className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-bold text-cyan-300 text-xs">
                  {cellJobModal.partName}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  จำนวน (Qty - ชิ้น):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={modalQuantity}
                  onChange={e => setModalQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D19] border border-slate-700 font-mono text-cyan-300 text-sm font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Target Completion Date / Time */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  กำหนดเสร็จ (Target Completion Date & Time):
                </label>
                <input
                  type="datetime-local"
                  value={modalTargetDate}
                  onChange={e => setModalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070D19] border border-slate-700 font-mono text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  หมายเหตุ / อาการชำรุด (Note):
                </label>
                <textarea
                  rows={2}
                  value={modalNote}
                  onChange={e => setModalNote(e.target.value)}
                  placeholder="ระบุหมายเหตุการเจียร เช่น คมบิ่นเล็กน้อย, ลับคมประจำวัน..."
                  className="w-full px-3 py-2 rounded-xl bg-[#070D19] border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCellJobModal(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  regrindService.createTicketFromMatrix({
                    partName: cellJobModal.partName,
                    day: cellJobModal.day,
                    month: cellJobModal.month,
                    year: cellJobModal.year,
                    quantity: modalQuantity,
                    targetCompletionDate: modalTargetDate || `${cellJobModal.year}-${String(cellJobModal.month).padStart(2, '0')}-${String(cellJobModal.day).padStart(2, '0')}T17:00:00`,
                    note: modalNote || 'เปิดใบงานผ่านตาราง Matrix'
                  });
                  onUpdateCell('REPAIR', cellJobModal.partName, cellJobModal.day, (cellJobModal.currentCount || 0) + modalQuantity);
                  setCellJobModal(null);
                  if (onRefreshData) onRefreshData();
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow transition-colors flex items-center justify-center gap-1 font-bold"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันสร้างใบงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Cell Edit Modal */}
      {editingCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="bg-[#0D1527] border border-slate-700 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white">
                แก้ไขจำนวนชิ้นรายวัน
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                วันที่ {editingCell.day} {currentMonthInfo.shortTh} {matrix.year}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {editingCell.partName} ({editingCell.category === 'REPAIR' ? 'งานเจียรสำเร็จ' : 'ทิ้ง/หมดสเปค'})
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                จำนวน (ชิ้น):
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={editingCell.value}
                onChange={e =>
                  setEditingCell({ ...editingCell, value: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#070D19] border border-slate-700 font-mono text-center text-lg font-bold text-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow transition-colors flex items-center justify-center gap-1 font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
