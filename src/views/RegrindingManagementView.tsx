import React, { useState, useEffect } from 'react';
import { regrindService } from '../services/regrindService';
import {
  RegrindWorkTicket,
  MonthlyCalendarMatrix,
  ToolingPartMasterItem,
  PurchasingRequisitionItem,
  DefectReasonCode
} from '../types/regrind';
import { ProductionLineId } from '../types';
import { RegrindKpiCards } from './regrinding/RegrindKpiCards';
import { RegrindQueueTable } from './regrinding/RegrindQueueTable';
import { Excel31DayMatrixView } from './regrinding/Excel31DayMatrixView';
import { ToolingMasterSpecsView } from './regrinding/ToolingMasterSpecsView';
import { PurchasingRequisitionsView } from './regrinding/PurchasingRequisitionsView';
import { ToolLengthValidationForm } from './regrinding/ToolLengthValidationForm';
import { RegrindingAnalyticsView } from './regrinding/RegrindingAnalyticsView';
import { HistoryCalendarView } from './regrinding/HistoryCalendarView';
import { RegrindCompleteModal } from './regrinding/RegrindCompleteModal';
import { RegrindScrapModal } from './regrinding/RegrindScrapModal';
import { NewRegrindOrderModal } from './regrinding/NewRegrindOrderModal';
import { QrScannerModal } from './regrinding/QrScannerModal';
import {
  Wrench,
  FileSpreadsheet,
  Sliders,
  ShoppingCart,
  Layers,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Ruler,
  BarChart3,
  Calendar
} from 'lucide-react';

interface RegrindingManagementViewProps {
  selectedLine?: ProductionLineId;
  onNavigateToDieLayout?: () => void;
  currentUserName?: string;
}

export const RegrindingManagementView: React.FC<RegrindingManagementViewProps> = ({
  selectedLine = 'E6',
  onNavigateToDieLayout,
  currentUserName = 'Kittisak Wongsuwan'
}) => {
  const [activeTab, setActiveTab] = useState<
    'QUEUE' | 'VALIDATE_LENGTH' | 'ANALYTICS' | 'CALENDAR' | 'EXCEL_31_DAYS' | 'MASTER_SPECS' | 'PURCHASING'
  >('QUEUE');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tickets, setTickets] = useState<RegrindWorkTicket[]>([]);
  const [metrics, setMetrics] = useState(regrindService.getSummaryMetrics());
  const [matrix, setMatrix] = useState<MonthlyCalendarMatrix>(regrindService.getMonthlyMatrix(2026, 1));
  const [toolingMasters, setToolingMasters] = useState<ToolingPartMasterItem[]>([]);
  const [purchasingReqs, setPurchasingReqs] = useState<PurchasingRequisitionItem[]>([]);
  const [validationTicket, setValidationTicket] = useState<RegrindWorkTicket | null>(null);

  // Modals state
  const [completeModalTicket, setCompleteModalTicket] = useState<RegrindWorkTicket | null>(null);
  const [scrapModalTicket, setScrapModalTicket] = useState<RegrindWorkTicket | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'info', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const reloadData = () => {
    setTickets(regrindService.getQueueTickets());
    setMetrics(regrindService.getSummaryMetrics());
    setMatrix(regrindService.getMonthlyMatrix(matrix.year || 2026, matrix.month || 1));
    setToolingMasters(regrindService.getToolingMasters());
    setPurchasingReqs(regrindService.getPurchasingRequisitions());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = regrindService.subscribe(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleStartGrind = (ticket: RegrindWorkTicket) => {
    const res = regrindService.startGrinding(ticket.id, currentUserName);
    if (res.success) {
      showToast('info', res.message);
      reloadData();
    }
  };

  const handleConfirmCompleteGrind = (payload: {
    remainingLengthMm: number;
    grindDepthMm: number;
    shimAddedMm: number;
    toolMaterial?: string;
    technicianName: string;
    verifiedBy: string;
    remarks: string;
  }) => {
    if (!completeModalTicket) return;
    const res = regrindService.completeGrinding(completeModalTicket.id, payload);
    setCompleteModalTicket(null);
    if (res.success) {
      if (res.status === 'SCRAP') {
        showToast('warning', res.message);
      } else {
        showToast('success', res.message);
      }
      reloadData();
    }
  };

  const handleConfirmScrap = (payload: {
    reasonCode: DefectReasonCode;
    customReason: string;
    technicianName: string;
    reorderQuantity: number;
  }) => {
    if (!scrapModalTicket) return;
    const res = regrindService.scrapItem(
      scrapModalTicket.id,
      payload.reasonCode,
      payload.customReason,
      payload.technicianName
    );
    setScrapModalTicket(null);
    if (res.success) {
      showToast('warning', res.message);
      reloadData();
    }
  };

  const handleCreateManualOrder = (data: {
    partName: string;
    partCode: string;
    lineId: ProductionLineId;
    stageName: string;
    positionId: string;
    defectReason: DefectReasonCode;
    defectNotes: string;
    previousLengthMm: number;
    regrindCountBefore: number;
    urgency: 'HIGH' | 'NORMAL' | 'LOW';
    receivedBy: string;
  }) => {
    const newTicket = regrindService.createManualTicket(data);
    setIsNewOrderModalOpen(false);
    showToast('success', `เปิดใบงาน ${newTicket.jobCode} (${newTicket.partName}) เรียบร้อยแล้ว`);
    reloadData();
  };

  const handleUpdateMatrixCell = (
    category: 'REPAIR' | 'DEFECT_SCRAP',
    partName: string,
    day: number,
    count: number
  ) => {
    regrindService.updateMatrixCell(matrix.year, matrix.month, category, partName, day, count);
    reloadData();
  };

  const handleMonthChange = (year: number, month: number) => {
    const newMat = regrindService.getMonthlyMatrix(year, month);
    setMatrix(newMat);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMsg.type === 'warning'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-sky-900 text-sky-100 border-sky-700'
          }`}
        >
          {toastMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          {toastMsg.type === 'warning' && <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          {toastMsg.type === 'info' && <Wrench className="w-5 h-5 text-sky-400 flex-shrink-0" />}
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-600 text-white shadow-md shadow-cyan-500/20">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  ระบบจัดการงานเจียรลับคมทูลลิ่ง & แม่พิมพ์ (Tooling Regrinding Hub)
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ยกระดับจากระบบ Excel สู่ Web Application จัดการคิวงาน, มิติความยาว, ปฏิทิน 31 วัน, และแจ้งฝ่ายจัดซื้ออัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToDieLayout && (
              <button
                type="button"
                onClick={onNavigateToDieLayout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                title="กลับไปยังหน้าผังแม่พิมพ์ 2D Die Layout"
              >
                <span>ไปยัง 2D Die Layout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={reloadData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          {[
            {
              id: 'QUEUE',
              label: 'คิวงานเจียร (Regrind Queue)',
              icon: Wrench,
              badge: metrics.pendingCount + metrics.inProcessCount
            },
            {
              id: 'VALIDATE_LENGTH',
              label: 'ตรวจสอบมิติ & มาตรฐาน Part Life (Validation Form)',
              icon: Ruler,
              badge: 'Real-time Matrix'
            },
            {
              id: 'ANALYTICS',
              label: 'กราฟวิเคราะห์งานเจียร & Defect (Analytics)',
              icon: BarChart3,
              badge: 'Recharts'
            },
            {
              id: 'CALENDAR',
              label: 'ปฏิทินประวัติ 31 วัน (History Calendar)',
              icon: Calendar,
              badge: 'รายวัน'
            },
            {
              id: 'EXCEL_31_DAYS',
              label: 'ตารางบันทึก Excel Matrix',
              icon: FileSpreadsheet,
              badge: `${matrix.grandTotalRepair} ชิ้น`
            },
            {
              id: 'MASTER_SPECS',
              label: 'มาตรฐานขนาด & ลิมิต (Master Specs)',
              icon: Sliders,
              badge: '26 รายการ'
            },
            {
              id: 'PURCHASING',
              label: 'ใบขอสั่งซื้อทดแทน (PR Orders)',
              icon: ShoppingCart,
              badge: purchasingReqs.length
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-cyan-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top KPI Cards (Only on relevant tabs) */}
      {(activeTab === 'QUEUE' || activeTab === 'VALIDATE_LENGTH' || activeTab === 'EXCEL_31_DAYS') && (
        <RegrindKpiCards
          metrics={metrics}
          onFilterStatus={status => {
            setStatusFilter(status);
            setActiveTab('QUEUE');
          }}
          activeStatusFilter={statusFilter}
        />
      )}

      {/* Tab Content Display */}
      {activeTab === 'QUEUE' && (
        <RegrindQueueTable
          tickets={tickets}
          activeStatusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onStartGrind={handleStartGrind}
          onCompleteGrind={ticket => setCompleteModalTicket(ticket)}
          onScrap={ticket => setScrapModalTicket(ticket)}
          onValidateLength={ticket => {
            setValidationTicket(ticket);
            setActiveTab('VALIDATE_LENGTH');
          }}
          onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          onViewPrDetails={() => setActiveTab('PURCHASING')}
        />
      )}

      {activeTab === 'VALIDATE_LENGTH' && (
        <ToolLengthValidationForm
          initialTicket={validationTicket}
          currentUserName={currentUserName}
          onValidationComplete={result => {
            if (result.status === 'SCRAP') {
              showToast('warning', `⚠️ ตรวจพบขนาดต่ำกว่ามาตรฐาน: บันทึกตัดทิ้งและออกใบขอสั่งซื้อ (PR) ${result.prNumber || ''} เรียบร้อยแล้ว`);
            } else {
              showToast('success', `✅ ตรวจสอบมิติผ่านเกณฑ์: เพิ่ม ${result.partName} เข้าสต๊อกพร้อมใช้เรียบร้อยแล้ว`);
            }
            reloadData();
          }}
        />
      )}

      {activeTab === 'ANALYTICS' && (
        <RegrindingAnalyticsView />
      )}

      {activeTab === 'CALENDAR' && (
        <HistoryCalendarView
          onSelectTicket={ticket => {
            setCompleteModalTicket(ticket);
          }}
        />
      )}

      {activeTab === 'EXCEL_31_DAYS' && (
        <Excel31DayMatrixView
          matrix={matrix}
          onUpdateCell={handleUpdateMatrixCell}
          onMonthChange={handleMonthChange}
        />
      )}

      {activeTab === 'MASTER_SPECS' && (
        <ToolingMasterSpecsView masters={toolingMasters} />
      )}

      {activeTab === 'PURCHASING' && (
        <PurchasingRequisitionsView
          requisitions={purchasingReqs}
        />
      )}

      {/* Modals */}
      {completeModalTicket && (
        <RegrindCompleteModal
          ticket={completeModalTicket}
          isOpen={!!completeModalTicket}
          onClose={() => setCompleteModalTicket(null)}
          onConfirm={handleConfirmCompleteGrind}
          currentUserName={currentUserName}
        />
      )}

      {scrapModalTicket && (
        <RegrindScrapModal
          ticket={scrapModalTicket}
          isOpen={!!scrapModalTicket}
          onClose={() => setScrapModalTicket(null)}
          onConfirm={handleConfirmScrap}
          currentUserName={currentUserName}
        />
      )}

      {isNewOrderModalOpen && (
        <NewRegrindOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          toolingMasters={toolingMasters}
          onSubmit={handleCreateManualOrder}
          currentUserName={currentUserName}
        />
      )}

      {isQrScannerOpen && (
        <QrScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          tickets={tickets}
          onSelectTicket={t => {
            if (t.status === 'IN_PROCESS') {
              setCompleteModalTicket(t);
            } else if (t.status === 'PENDING') {
              handleStartGrind(t);
            }
          }}
        />
      )}
    </div>
  );
};
