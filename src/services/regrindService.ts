import {
  RegrindWorkTicket,
  RegrindQueueStatus,
  DefectReasonCode,
  MonthlyCalendarMatrix,
  PurchasingRequisitionItem,
  ToolingPartMasterItem
} from '../types/regrind';
import {
  REGRIND_TOOLING_MASTERS,
  INITIAL_REGRIND_WORK_TICKETS,
  INITIAL_PURCHASING_REQUISITIONS,
  INITIAL_JANUARY_2026_MATRIX
} from '../data/regrindData';
import { storageService } from './storageService';
import { ProductionLineId } from '../types';

const STORAGE_KEYS = {
  QUEUE: 'fin_die_regrind_queue_v2',
  MATRICES: 'fin_die_regrind_matrices_v2',
  PURCHASING_REQS: 'fin_die_purchasing_requisitions_v2',
  TOOLING_MASTERS: 'fin_die_regrind_masters_v2'
};

type RegrindListener = () => void;

class RegrindService {
  private listeners: Set<RegrindListener> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: RegrindListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Regrind listener error:', err);
      }
    });
  }

  private ensureInitialized() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.QUEUE)) {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(INITIAL_REGRIND_WORK_TICKETS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PURCHASING_REQS)) {
        localStorage.setItem(STORAGE_KEYS.PURCHASING_REQS, JSON.stringify(INITIAL_PURCHASING_REQUISITIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TOOLING_MASTERS)) {
        localStorage.setItem(STORAGE_KEYS.TOOLING_MASTERS, JSON.stringify(REGRIND_TOOLING_MASTERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MATRICES)) {
        const matrixMap: Record<string, MonthlyCalendarMatrix> = {
          '2026-1': INITIAL_JANUARY_2026_MATRIX
        };
        localStorage.setItem(STORAGE_KEYS.MATRICES, JSON.stringify(matrixMap));
      }
    } catch (e) {
      console.warn('Storage initialization fallback:', e);
    }
  }

  // --- Tooling Masters ---
  public getToolingMasters(): ToolingPartMasterItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TOOLING_MASTERS);
      return raw ? JSON.parse(raw) : REGRIND_TOOLING_MASTERS;
    } catch {
      return REGRIND_TOOLING_MASTERS;
    }
  }

  public findMasterByPartName(partName: string): ToolingPartMasterItem | undefined {
    const masters = this.getToolingMasters();
    return masters.find(m => m.partName.toLowerCase() === partName.toLowerCase() || m.partCode.toLowerCase() === partName.toLowerCase());
  }

  // --- Queue Tickets ---
  public getQueueTickets(): RegrindWorkTicket[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      return raw ? JSON.parse(raw) : INITIAL_REGRIND_WORK_TICKETS;
    } catch {
      return INITIAL_REGRIND_WORK_TICKETS;
    }
  }

  public saveQueueTickets(tickets: RegrindWorkTicket[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(tickets));
      this.notify();
    } catch (e) {
      console.error('Failed to save queue tickets:', e);
    }
  }

  // --- Summary Metrics ---
  public getSummaryMetrics() {
    const tickets = this.getQueueTickets();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
    const inProcessCount = tickets.filter(t => t.status === 'IN_PROCESS').length;
    const readyCount = tickets.filter(t => t.status === 'READY').length;
    
    // Scraps this month + all time
    const scrapsAll = tickets.filter(t => t.status === 'SCRAP' || t.isScrapped);
    const scrapsThisMonth = scrapsAll.filter(t => {
      const d = new Date(t.completedDate || t.updatedAt || t.createdAt);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // From calendar matrix if higher (e.g. historical January 2026)
    const janMatrix = this.getMonthlyMatrix(2026, 1);

    return {
      pendingCount,
      inProcessCount,
      readyCount,
      scrapsThisMonth: Math.max(scrapsThisMonth, janMatrix.grandTotalDefect > 0 ? janMatrix.grandTotalDefect : 0),
      scrapsAllTime: scrapsAll.length,
      totalJobsHandled: tickets.length,
      readyStockAvailable: readyCount + janMatrix.grandTotalRepair
    };
  }

  // --- Workflow Actions ---

  // 1. Start Grinding (Pending -> In-Process)
  public startGrinding(ticketId: string, technicianName: string): { success: boolean; message: string } {
    const tickets = this.getQueueTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Ticket not found' };

    tickets[idx].status = 'IN_PROCESS';
    tickets[idx].assignedTechnician = technicianName;
    tickets[idx].inProcessDate = new Date().toISOString();
    tickets[idx].updatedAt = new Date().toISOString();

    this.saveQueueTickets(tickets);

    storageService.addAuditLog(
      'REGRIND',
      `Started Regrinding for ${tickets[idx].partName} (${tickets[idx].jobCode}) by technician ${technicianName}`,
      `เริ่มดำเนินการเจียรลับคมสำหรับ ${tickets[idx].partName} (${tickets[idx].jobCode}) โดยช่าง ${technicianName}`,
      tickets[idx].lineId
    );

    return { success: true, message: `เริ่มดำเนินการเจียรลับคม ${tickets[idx].partName} เรียบร้อยแล้ว` };
  }

  // 2. Complete Grinding (In-Process -> Ready to Use / Auto-Scrap on Dimension Fail)
  public completeGrinding(
    ticketId: string,
    payload: {
      remainingLengthMm: number;
      grindDepthMm: number;
      shimAddedMm: number;
      toolMaterial?: string;
      surfaceRoughnessRa?: number;
      hardnessHrc?: number;
      technicianName: string;
      verifiedBy?: string;
      remarks?: string;
    }
  ): { success: boolean; status: RegrindQueueStatus; message: string; prNumber?: string } {
    const tickets = this.getQueueTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return { success: false, status: 'PENDING', message: 'Ticket not found' };

    const ticket = tickets[idx];
    const minLimit = ticket.minAllowedLengthMm || 65.00;
    const maxCycles = ticket.maxRegrindAllowed || 4;
    const nextRegrindCount = (ticket.regrindCountBefore || 0) + 1;

    ticket.grindDepthMm = payload.grindDepthMm;
    ticket.lengthAfterGrindMm = payload.remainingLengthMm;
    ticket.shimAddedMm = payload.shimAddedMm;
    if (payload.toolMaterial) ticket.toolMaterial = payload.toolMaterial;
    if (payload.surfaceRoughnessRa !== undefined) ticket.surfaceRoughnessRa = payload.surfaceRoughnessRa;
    if (payload.hardnessHrc !== undefined) ticket.hardnessHrc = payload.hardnessHrc;
    ticket.assignedTechnician = payload.technicianName || ticket.assignedTechnician;
    ticket.verifiedBy = payload.verifiedBy || 'QC Inspector';
    ticket.completedDate = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();
    ticket.regrindCountAfter = nextRegrindCount;
    if (payload.remarks) ticket.remarks = payload.remarks;

    // Check Dimension & Max Limit (World-Class Standard)
    const isUnderDimensionLimit = payload.remainingLengthMm < minLimit;
    const isExceededMaxCycles = nextRegrindCount > maxCycles;

    if (isUnderDimensionLimit || isExceededMaxCycles) {
      // Force Auto-Scrap
      ticket.status = 'SCRAP';
      ticket.isScrapped = true;
      ticket.scrapReason = isUnderDimensionLimit
        ? `ความยาวหลังเจียร (${payload.remainingLengthMm.toFixed(2)} mm) ต่ำกว่าสเปคขั้นต่ำ (${minLimit.toFixed(2)} mm)`
        : `จำนวนรอบเจียร (${nextRegrindCount}) เกินขีดจำกัดสูงสุด (${maxCycles} ครั้ง)`;
      
      // Generate Purchasing Requisition
      const prItem = this.createPurchasingRequisition({
        partName: ticket.partName,
        partCode: ticket.partCode,
        quantity: 10,
        workTicketId: ticket.id,
        lineId: ticket.lineId,
        requestedBy: payload.technicianName,
        reason: 'SCRAPPED_TOOLING_REPLACEMENT'
      });

      ticket.purchasingAlertSent = true;
      ticket.purchasingPrNumber = prItem.prNumber;
      this.saveQueueTickets(tickets);

      // Increment Daily Defect in Matrix
      const now = new Date();
      this.incrementDailyMatrixCount(now.getFullYear(), now.getMonth() + 1, 'DEFECT_SCRAP', ticket.partName, now.getDate(), 1);

      storageService.addAuditLog(
        'REGRIND',
        `Tooling Scrapped: ${ticket.partName} (${ticket.jobCode}) under spec length (${payload.remainingLengthMm}mm < ${minLimit}mm). Auto-generated PR ${prItem.prNumber}`,
        `ชิ้นส่วนหมดสเปค/ทิ้ง: ${ticket.partName} (${ticket.jobCode}) ความยาวต่ำกว่าเกณฑ์ (${payload.remainingLengthMm}mm < ${minLimit}mm) สร้างใบสั่งซื้อ PR ${prItem.prNumber}`,
        ticket.lineId
      );

      return {
        success: true,
        status: 'SCRAP',
        message: `⚠️ ชิ้นส่วนต่ำกว่ามาตรฐาน (${payload.remainingLengthMm.toFixed(2)}mm < ${minLimit.toFixed(2)}mm) ระบบได้เปลี่ยนเป็น "ทิ้ง (Scrap)" และส่งใบแจ้งจัดซื้อ ${prItem.prNumber} อัตโนมัติ`,
        prNumber: prItem.prNumber
      };
    } else {
      // Normal Pass -> Ready to Use
      ticket.status = 'READY';
      ticket.isScrapped = false;
      ticket.addedToSpareStock = true;

      this.saveQueueTickets(tickets);

      // Auto-Adjust Spare Stock in storageService
      this.adjustSpareStockInWarehouse(ticket.partCode, 1);

      // Increment Daily Repair in Matrix
      const now = new Date();
      this.incrementDailyMatrixCount(now.getFullYear(), now.getMonth() + 1, 'REPAIR', ticket.partName, now.getDate(), 1);

      storageService.addAuditLog(
        'REGRIND',
        `Regrinding Completed: ${ticket.partName} (${ticket.jobCode}) Length: ${payload.remainingLengthMm}mm. Added +1 to Spare Stock`,
        `เจียรลับคมเสร็จสิ้น: ${ticket.partName} (${ticket.jobCode}) ความยาว ${payload.remainingLengthMm}mm เพิ่มเข้าสต๊อกพร้อมใช้ +1 ชิ้น`,
        ticket.lineId
      );

      return {
        success: true,
        status: 'READY',
        message: `✅ เจียรลับคม ${ticket.partName} สำเร็จ (ความยาว ${payload.remainingLengthMm.toFixed(2)} mm) เพิ่มเข้าสต๊อกพร้อมใช้เรียบร้อยแล้ว`
      };
    }
  }

  // 3. Direct Scrap Action
  public scrapItem(
    ticketId: string,
    reasonCode: DefectReasonCode,
    customReason: string,
    technicianName: string
  ): { success: boolean; message: string; prNumber: string } {
    const tickets = this.getQueueTickets();
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx === -1) return { success: false, message: 'Ticket not found', prNumber: '' };

    const ticket = tickets[idx];
    ticket.status = 'SCRAP';
    ticket.isScrapped = true;
    ticket.defectReason = reasonCode;
    ticket.scrapReason = customReason || 'Scrapped by technician decision';
    ticket.assignedTechnician = technicianName || ticket.assignedTechnician;
    ticket.completedDate = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    const prItem = this.createPurchasingRequisition({
      partName: ticket.partName,
      partCode: ticket.partCode,
      quantity: 10,
      workTicketId: ticket.id,
      lineId: ticket.lineId,
      requestedBy: technicianName,
      reason: 'SCRAPPED_TOOLING_REPLACEMENT'
    });

    ticket.purchasingAlertSent = true;
    ticket.purchasingPrNumber = prItem.prNumber;
    this.saveQueueTickets(tickets);

    const now = new Date();
    this.incrementDailyMatrixCount(now.getFullYear(), now.getMonth() + 1, 'DEFECT_SCRAP', ticket.partName, now.getDate(), 1);

    storageService.addAuditLog(
      'REGRIND',
      `Manual Scrap: ${ticket.partName} (${ticket.jobCode}) Reason: ${customReason}. PR ${prItem.prNumber} generated`,
      `บันทึกตัดทิ้ง/หมดสเปค: ${ticket.partName} (${ticket.jobCode}) สาเหตุ: ${customReason} สร้างใบขอสั่งซื้อ PR ${prItem.prNumber}`,
      ticket.lineId
    );

    return {
      success: true,
      message: `บันทึกตัดทิ้ง (Scrap) ${ticket.partName} เรียบร้อยแล้ว พร้อมส่งใบแจ้งจัดซื้อ ${prItem.prNumber}`,
      prNumber: prItem.prNumber
    };
  }

  // 4. Auto-Queue Receiver from 2D Die Layout / Part Replacement
  public receiveFromDieLayout(params: {
    lineId: ProductionLineId;
    partName: string;
    partCode: string;
    stageName?: string;
    positionId?: string;
    removedPartRegrindCount?: number;
    defectReason?: DefectReasonCode;
    notes?: string;
    technicianName?: string;
  }): RegrindWorkTicket {
    const tickets = this.getQueueTickets();
    const master = this.findMasterByPartName(params.partName) || this.findMasterByPartName(params.partCode);

    const newId = `RGD-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(4, '0')}`;
    const jobCode = `JOB-RGD-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    const qrCode = `QR-${params.lineId}-${params.positionId || 'P'}-${Date.now().toString().slice(-4)}`;

    const nominal = master?.nominalLengthMm || 70.00;
    const minLimit = master?.minAllowedLengthMm || 65.00;
    const grindEst = master?.grindingAmountPerTimeMm || 0.25;
    const regrindBefore = params.removedPartRegrindCount || 0;
    const prevLength = Math.max(minLimit, nominal - (regrindBefore * grindEst));

    const newTicket: RegrindWorkTicket = {
      id: newId,
      jobCode,
      qrCode,
      partName: master?.partName || params.partName,
      partCode: master?.partCode || params.partCode,
      lineId: params.lineId,
      stageName: params.stageName || 'Stage 1: Punching',
      positionId: params.positionId || 'P-01',
      picCategory: master?.picCategory || 'burring_7',
      status: 'PENDING',
      urgency: 'HIGH',
      source: 'AUTO_FROM_DIE_LAYOUT',
      receivedDate: new Date().toISOString(),
      receivedBy: params.technicianName || 'Die Line Operator',
      defectReason: params.defectReason || 'NORMAL_WEAR',
      defectNotes: params.notes || 'ส่งเข้าคิวเจียรลับคมอัตโนมัติจากหน้าจอ 2D Die Layout',
      nominalLengthMm: nominal,
      minAllowedLengthMm: minLimit,
      previousLengthMm: prevLength,
      grindDepthMm: grindEst,
      lengthAfterGrindMm: prevLength - grindEst,
      shimAddedMm: grindEst,
      surfaceRoughnessRa: 0.12,
      hardnessHrc: 63,
      regrindCountBefore: regrindBefore,
      regrindCountAfter: regrindBefore + 1,
      maxRegrindAllowed: master?.maxRegrindCount || 4,
      isScrapped: false,
      remarks: `รับอัตโนมัติจากหน้า 2D Layout (${params.lineId} - ${params.positionId})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tickets.unshift(newTicket);
    this.saveQueueTickets(tickets);

    storageService.addAuditLog(
      'REGRIND',
      `Auto-Queue Integration: Received ${newTicket.partName} (${newTicket.positionId}) from Line ${params.lineId} into Regrind Queue`,
      `ระบบรับเข้าอัตโนมัติ: รับชิ้นส่วน ${newTicket.partName} (${newTicket.positionId}) จากไลน์ ${params.lineId} เข้าสู่คิวรอเจียร`,
      params.lineId
    );

    return newTicket;
  }

  // 5. Manual Ticket Creation
  public createManualTicket(data: Partial<RegrindWorkTicket>): RegrindWorkTicket {
    const tickets = this.getQueueTickets();
    const master = this.findMasterByPartName(data.partName || '') || this.findMasterByPartName(data.partCode || '');

    const newId = `RGD-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(4, '0')}`;
    const jobCode = `JOB-RGD-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    const qrCode = data.qrCode || `QR-${data.lineId || 'E6'}-${Date.now().toString().slice(-4)}`;

    const nominal = master?.nominalLengthMm || data.nominalLengthMm || 70.00;
    const minLimit = master?.minAllowedLengthMm || data.minAllowedLengthMm || 65.00;
    const grindEst = master?.grindingAmountPerTimeMm || data.grindDepthMm || 0.25;

    const newTicket: RegrindWorkTicket = {
      id: newId,
      jobCode,
      qrCode,
      partName: master?.partName || data.partName || 'Tooling Part',
      partCode: master?.partCode || data.partCode || 'TOOL-CUSTOM',
      lineId: data.lineId || 'E6',
      stageName: data.stageName || 'Tooling Room',
      positionId: data.positionId || 'SHOP-01',
      picCategory: master?.picCategory || data.picCategory || 'burring_7',
      status: 'PENDING',
      urgency: data.urgency || 'NORMAL',
      source: 'MANUAL_ENTRY',
      receivedDate: new Date().toISOString(),
      receivedBy: data.receivedBy || 'Tooling Tech',
      defectReason: data.defectReason || 'NORMAL_WEAR',
      defectNotes: data.defectNotes || 'บันทึกเปิดงานเจียรลับคมด้วยตนเอง (Manual Walk-in)',
      nominalLengthMm: nominal,
      minAllowedLengthMm: minLimit,
      previousLengthMm: data.previousLengthMm || nominal,
      grindDepthMm: grindEst,
      lengthAfterGrindMm: (data.previousLengthMm || nominal) - grindEst,
      shimAddedMm: grindEst,
      surfaceRoughnessRa: 0.12,
      hardnessHrc: 63,
      regrindCountBefore: data.regrindCountBefore || 0,
      regrindCountAfter: (data.regrindCountBefore || 0) + 1,
      maxRegrindAllowed: master?.maxRegrindCount || 4,
      isScrapped: false,
      remarks: data.remarks || 'Manual ticket created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tickets.unshift(newTicket);
    this.saveQueueTickets(tickets);

    storageService.addAuditLog(
      'REGRIND',
      `Manual Work Order created: ${newTicket.partName} (${newTicket.jobCode}) on Line ${newTicket.lineId}`,
      `เปิดใบงานเจียรลับคมใหม่: ${newTicket.partName} (${newTicket.jobCode}) สำหรับไลน์ ${newTicket.lineId}`,
      newTicket.lineId
    );

    return newTicket;
  }

  // --- Spare Stock Auto Adjustment ---
  private adjustSpareStockInWarehouse(partCode: string, qtyDelta: number) {
    try {
      const stocks = storageService.getSpareStocks();
      const item = stocks.find(s => s.partCode === partCode || s.partCode.includes(partCode) || partCode.includes(s.partCode));
      if (item) {
        item.currentStockQty += qtyDelta;
        localStorage.setItem('fin_press_spare_stocks', JSON.stringify(stocks));
      }
    } catch (e) {
      console.warn('Could not auto-adjust warehouse stock:', e);
    }
  }

  // --- Purchasing Requisitions ---
  public getPurchasingRequisitions(): PurchasingRequisitionItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PURCHASING_REQS);
      return raw ? JSON.parse(raw) : INITIAL_PURCHASING_REQUISITIONS;
    } catch {
      return INITIAL_PURCHASING_REQUISITIONS;
    }
  }

  public createPurchasingRequisition(params: {
    partName: string;
    partCode: string;
    quantity: number;
    workTicketId: string;
    lineId: ProductionLineId;
    requestedBy: string;
    reason: 'SCRAPPED_TOOLING_REPLACEMENT' | 'SAFETY_STOCK_DEPLETED';
  }): PurchasingRequisitionItem {
    const list = this.getPurchasingRequisitions();
    const master = this.findMasterByPartName(params.partName) || this.findMasterByPartName(params.partCode);
    const unitPrice = master?.unitPriceThb || 3500;

    const prNumber = `PR-${new Date().getFullYear()}-${String(list.length + 195).padStart(4, '0')}`;
    const newItem: PurchasingRequisitionItem = {
      id: `PR-ITEM-${Date.now()}`,
      prNumber,
      partName: params.partName,
      partCode: params.partCode,
      quantityRequested: params.quantity || 10,
      reason: params.reason,
      workTicketId: params.workTicketId,
      lineId: params.lineId,
      estimatedCostThb: unitPrice * (params.quantity || 10),
      requestedBy: params.requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      urgency: 'HIGH'
    };

    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.PURCHASING_REQS, JSON.stringify(list));
    this.notify();
    return newItem;
  }

  // --- 31-Day Calendar Matrix Storage ---
  public getMonthlyMatrix(year: number = 2026, month: number = 1): MonthlyCalendarMatrix {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MATRICES);
      const matrixMap: Record<string, MonthlyCalendarMatrix> = raw ? JSON.parse(raw) : {};
      const key = `${year}-${month}`;

      if (matrixMap[key]) {
        return matrixMap[key];
      }

      if (year === 2026 && month === 1) {
        return INITIAL_JANUARY_2026_MATRIX;
      }

      // Generate empty template for other months with all 26 masters
      const masters = this.getToolingMasters();
      const repairRows = masters.map(m => ({
        partName: m.partName,
        partCode: m.partCode,
        picCategory: m.picCategory,
        category: 'REPAIR' as const,
        dailyCounts: {},
        total: 0
      }));

      const defectRows = masters.slice(0, 7).map(m => ({
        partName: m.partName,
        partCode: m.partCode,
        picCategory: m.picCategory,
        category: 'DEFECT_SCRAP' as const,
        dailyCounts: {},
        total: 0
      }));

      const monthNames = ['', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      const emptyMatrix: MonthlyCalendarMatrix = {
        year,
        month,
        monthLabelEn: `${monthNames[month] || 'MONTH'} ${year}`,
        repairRows,
        defectRows,
        grandTotalRepair: 0,
        grandTotalDefect: 0
      };

      matrixMap[key] = emptyMatrix;
      localStorage.setItem(STORAGE_KEYS.MATRICES, JSON.stringify(matrixMap));
      return emptyMatrix;
    } catch {
      return INITIAL_JANUARY_2026_MATRIX;
    }
  }

  public saveMonthlyMatrix(matrix: MonthlyCalendarMatrix): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MATRICES);
      const matrixMap: Record<string, MonthlyCalendarMatrix> = raw ? JSON.parse(raw) : {};
      const key = `${matrix.year}-${matrix.month}`;
      matrixMap[key] = matrix;
      localStorage.setItem(STORAGE_KEYS.MATRICES, JSON.stringify(matrixMap));
      this.notify();
    } catch (e) {
      console.error('Failed to save monthly matrix:', e);
    }
  }

  public updateMatrixCell(
    year: number,
    month: number,
    category: 'REPAIR' | 'DEFECT_SCRAP',
    partName: string,
    day: number,
    count: number
  ): void {
    const matrix = this.getMonthlyMatrix(year, month);
    const rows = category === 'REPAIR' ? matrix.repairRows : matrix.defectRows;
    const row = rows.find(r => r.partName.toLowerCase() === partName.toLowerCase());

    if (row) {
      if (count > 0) {
        row.dailyCounts[day] = count;
      } else {
        delete row.dailyCounts[day];
      }
      row.total = Object.values(row.dailyCounts).reduce((a, b) => a + b, 0);

      if (category === 'REPAIR') {
        matrix.grandTotalRepair = matrix.repairRows.reduce((sum, r) => sum + r.total, 0);
      } else {
        matrix.grandTotalDefect = matrix.defectRows.reduce((sum, r) => sum + r.total, 0);
      }

      this.saveMonthlyMatrix(matrix);
    }
  }

  public incrementDailyMatrixCount(
    year: number,
    month: number,
    category: 'REPAIR' | 'DEFECT_SCRAP',
    partName: string,
    day: number,
    incrementBy: number = 1
  ): void {
    const matrix = this.getMonthlyMatrix(year, month);
    const rows = category === 'REPAIR' ? matrix.repairRows : matrix.defectRows;
    const row = rows.find(r => r.partName.toLowerCase() === partName.toLowerCase());

    if (row) {
      const current = row.dailyCounts[day] || 0;
      this.updateMatrixCell(year, month, category, partName, day, current + incrementBy);
    }
  }
}

export const regrindService = new RegrindService();
