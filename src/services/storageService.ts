import { getMoldTypeForLine, getStagesForMoldType } from "../utils/moldMatrixUtils";
import {
  LineLiveMonitoringData,
  LineActiveConfiguration,
  PartLiveTrackingItem,
  PartLifeStandard,
  PartMaster,
  InstalledQuantityRule,
  SpareStockItem,
  StockStatus,
  CombinedRiskLevel,
  ProcurementStatus,
  OrderStatus,
  ReplacementRecord,
  RegrindingRecord,
  RegrindMasterStandard,
  RegrindPartStatus,
  PositionReplacementDetail,
  ConditionInspectionRecord,
  ShotEntryRecord,
  AuditLogEntry,
  User,
  SystemSettings,
  ProductionLineId,
  UserRole,
  PositionLockRecord,
  PositionLockStatus,
  MachineStatus
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_PART_MASTERS,
  INITIAL_LINE_CONFIGS,
  INITIAL_PART_LIFE_STANDARDS,
  INITIAL_LIVE_DATA_E6,
  INITIAL_SPARE_STOCKS,
  INITIAL_REPLACEMENT_HISTORY,
  INITIAL_REGRIND_RECORDS,
  INITIAL_REGRIND_MASTER_STANDARDS,
  INITIAL_INSPECTIONS,
  INITIAL_SHOT_LOGS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_SYSTEM_SETTINGS,
  SEED_DATA_VERSION,
  SEED_SOURCE_LABEL
} from '../data/seedData';

import { calculatePartMetrics } from './calculationService';

const STORAGE_KEYS = {
  USERS: 'fin_press_users',
  CURRENT_USER: 'fin_press_current_user',
  PART_MASTERS: 'fin_press_part_masters',
  LINE_CONFIGS: 'fin_press_line_configs',
  LIFE_STANDARDS: 'fin_press_life_standards',
  LINE_MONITORING: 'fin_press_line_monitoring',
  SPARE_STOCKS: 'fin_press_spare_stocks',
  REPLACEMENTS: 'fin_press_replacements',
  REPLACEMENT_DRAFTS: 'fin_press_replacement_drafts',
  REGRINDS: 'fin_press_regrinds',
  REGRIND_STANDARDS: 'fin_press_regrind_standards',
  INSPECTIONS: 'fin_press_inspections',
  SHOT_LOGS: 'fin_press_shot_logs',
  SHOT_DRAFTS: 'fin_press_shot_drafts',
  AUDIT_LOGS: 'fin_press_audit_logs',
  SETTINGS: 'fin_press_settings',
  POSITION_LOCKS: 'fin_press_position_locks',
  SEED_INITIALIZED: 'fin_press_seed_init_v5'
};

type Listener = () => void;

class StorageService {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: Listener): () => void {
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
        console.error('Storage listener error:', err);
      }
    });
  }

  private ensureInitialized() {
    const initialized = localStorage.getItem(STORAGE_KEYS.SEED_INITIALIZED);
    if (!initialized) {
      this.resetToSeedData();
    }
  }

  public resetToSeedData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.PART_MASTERS, JSON.stringify(INITIAL_PART_MASTERS));
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(INITIAL_LINE_CONFIGS));
    localStorage.setItem(STORAGE_KEYS.LIFE_STANDARDS, JSON.stringify(INITIAL_PART_LIFE_STANDARDS));
    
    // Generate initial live monitoring dataset for all 8 production lines (E1, E2, E3-1, E3-2, E3-3, E4, E5, E6)
    const linesMonitoring: Record<ProductionLineId, LineLiveMonitoringData> = {
      'E1': this.generateLineMonitoring('E1', INITIAL_LINE_CONFIGS[0], 128450190),
      'E2': this.generateLineMonitoring('E2', INITIAL_LINE_CONFIGS[1], 142100800),
      'E3-1': this.generateLineMonitoring('E3-1', INITIAL_LINE_CONFIGS[2], 98450200),
      'E3-2': this.generateLineMonitoring('E3-2', INITIAL_LINE_CONFIGS[3], 115200300),
      'E3-3': this.generateLineMonitoring('E3-3', INITIAL_LINE_CONFIGS[4], 88120400),
      'E4': this.generateLineMonitoring('E4', INITIAL_LINE_CONFIGS[5], 134500100),
      'E5': this.generateLineMonitoring('E5', INITIAL_LINE_CONFIGS[6], 129800600),
      'E6': INITIAL_LIVE_DATA_E6
    };

    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(linesMonitoring));
    localStorage.setItem(STORAGE_KEYS.SPARE_STOCKS, JSON.stringify(INITIAL_SPARE_STOCKS));
    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(INITIAL_REPLACEMENT_HISTORY));
    localStorage.setItem(STORAGE_KEYS.REPLACEMENT_DRAFTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(INITIAL_REGRIND_RECORDS));
    localStorage.setItem(STORAGE_KEYS.REGRIND_STANDARDS, JSON.stringify(INITIAL_REGRIND_MASTER_STANDARDS));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STORAGE_KEYS.SHOT_LOGS, JSON.stringify(INITIAL_SHOT_LOGS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.SEED_INITIALIZED, SEED_DATA_VERSION);

    this.notify();
  }

  private generateLineMonitoring(
    lineId: ProductionLineId,
    config: LineActiveConfiguration,
    totalShots: number
  ): LineLiveMonitoringData {
    const standards = INITIAL_PART_LIFE_STANDARDS;
    const stocks = INITIAL_SPARE_STOCKS;

    const baseItems = INITIAL_LIVE_DATA_E6.items.map((item, idx) => {
      const currentShotRatio = [0.45, 0.62, 0.78, 0.88, 0.55, 0.12, 0.12, 0.70, 0.65, 0.08, 0.52, 0.07][idx % 12];
      const curShot = Math.round((item.lifeLimit || 100000000) * currentShotRatio);
      const lastChange = Math.max(0, totalShots - curShot);

      return calculatePartMetrics(
        {
          slotId: `SLOT-${lineId}-${idx + 1}`,
          partCode: item.partCode,
          partName: item.partName,
          stagePunchDie: item.stagePunchDie,
          position: item.position,
          installQty: item.installQty,
          backupQty: item.backupQty,
          usedShot: curShot,
          currentShot: curShot,
          shotAtLastChange: lastChange,
          lastChangeShot: lastChange,
          regrindCount: item.regrindCount,
          totalMmGround: item.totalMmGround
        },
        config,
        standards,
        stocks
      );
    });

    return {
      lineId,
      lineName: lineId,
      machineStatus: 'RUNNING',
      machineShotTotal: totalShots,
      shiftShot: Math.round(180000 + Math.random() * 80000),
      dailyShot: Math.round(3800000 + Math.random() * 1500000),
      monthlyShot: Math.round(totalShots * 0.35),
      shotSignal: 'NORMAL',
      lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      activeConfig: config,
      items: baseItems
    };
  }

  // --- Getters ---
  public getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  public getCurrentUser(): User {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || JSON.stringify(INITIAL_USERS[0]));
  }

  public setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.addAuditLog('SYSTEM', `Switched active user to ${user.name} (${user.role})`);
    this.notify();
  }

  public getPartMasters(): PartMaster[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PART_MASTERS) || '[]');
  }

  public savePartMaster(part: PartMaster): void {
    const list = this.getPartMasters();
    const idx = list.findIndex(p => p.partCode === part.partCode);
    if (idx >= 0) {
      list[idx] = part;
    } else {
      list.push(part);
    }
    localStorage.setItem(STORAGE_KEYS.PART_MASTERS, JSON.stringify(list));
    this.addAuditLog('SYSTEM', `Updated Part Master: ${part.partCode} (${part.partName})`, `อัปเดตข้อมูลชิ้นส่วนหลัก ${part.partName}`);
    this.notify();
  }

  public savePartMasters(parts: PartMaster[]): void {
    localStorage.setItem(STORAGE_KEYS.PART_MASTERS, JSON.stringify(parts));
    this.addAuditLog('SYSTEM', `Bulk updated ${parts.length} Part Master catalog records`);
    this.notify();
  }

  public getLineConfigs(): LineActiveConfiguration[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LINE_CONFIGS) || '[]');
  }

  public getLifeStandards(): PartLifeStandard[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LIFE_STANDARDS) || '[]');
  }

  public saveLifeStandards(standards: PartLifeStandard[]): void {
    localStorage.setItem(STORAGE_KEYS.LIFE_STANDARDS, JSON.stringify(standards));
    this.addAuditLog('STANDARD_CHANGE', `Bulk updated ${standards.length} Part Life Standards`);
    this.notify();
  }

  public getLinesMonitoring(): Record<ProductionLineId, LineLiveMonitoringData> {
    const raw = localStorage.getItem(STORAGE_KEYS.LINE_MONITORING);
    if (!raw) return {} as Record<ProductionLineId, LineLiveMonitoringData>;
    return JSON.parse(raw);
  }

  public getLineMonitoring(lineId: ProductionLineId): LineLiveMonitoringData | null {
    const all = this.getLinesMonitoring();
    return all[lineId] || null;
  }

  public getSpareStocks(): SpareStockItem[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SPARE_STOCKS) || '[]');
  }

  public getReplacements(): ReplacementRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPLACEMENTS) || '[]');
  }

  public getReplacementDrafts(): any[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPLACEMENT_DRAFTS) || '[]');
  }

  public saveReplacementDraft(draft: any): any {
    const drafts = this.getReplacementDrafts();
    const draftId = draft.id || `DRAFT-REP-${Date.now()}`;
    const draftRecord = {
      ...draft,
      id: draftId,
      updatedAt: new Date().toISOString()
    };
    const existingIdx = drafts.findIndex(d => d.id === draftId);
    if (existingIdx >= 0) {
      drafts[existingIdx] = draftRecord;
    } else {
      drafts.unshift(draftRecord);
    }
    localStorage.setItem(STORAGE_KEYS.REPLACEMENT_DRAFTS, JSON.stringify(drafts.slice(0, 50)));
    this.notify();
    return draftRecord;
  }

  public deleteReplacementDraft(draftId: string): void {
    const drafts = this.getReplacementDrafts().filter(d => d.id !== draftId);
    localStorage.setItem(STORAGE_KEYS.REPLACEMENT_DRAFTS, JSON.stringify(drafts));
    this.notify();
  }

  public getRegrindRecords(): RegrindingRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REGRINDS) || '[]');
  }

  public getRegrindMasterStandards(): RegrindMasterStandard[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGRIND_STANDARDS);
    if (!raw) return INITIAL_REGRIND_MASTER_STANDARDS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REGRIND_MASTER_STANDARDS;
    } catch {
      return INITIAL_REGRIND_MASTER_STANDARDS;
    }
  }

  public saveRegrindMasterStandard(standard: RegrindMasterStandard): void {
    const standards = this.getRegrindMasterStandards();
    const idx = standards.findIndex(s => s.partCode === standard.partCode);
    if (idx >= 0) {
      standards[idx] = standard;
    } else {
      standards.push(standard);
    }
    localStorage.setItem(STORAGE_KEYS.REGRIND_STANDARDS, JSON.stringify(standards));
    this.addAuditLog(
      'STANDARD_CHANGE',
      `Updated Regrind Standard for ${standard.partName} (${standard.partCode}): Grinding ${standard.grindingAmountPerTimeMm}mm/time, Max ${standard.maxRegrindCount} times`,
      `อัปเดตมาตรฐานการเจียระไนสำหรับ ${standard.partName}`
    );
    this.notify();
  }

  public getInspections(): ConditionInspectionRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INSPECTIONS) || '[]');
  }

  public getShotLogs(): ShotEntryRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOT_LOGS) || '[]');
  }

  public getAuditLogs(): AuditLogEntry[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  public getSettings(): SystemSettings {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
  }

  public updateSettings(settings: SystemSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.addAuditLog('SYSTEM', 'Updated system configuration and threshold settings');
    this.notify();
  }

  public addAuditLog(
    category: AuditLogEntry['actionCategory'],
    details: string,
    detailsTh?: string,
    lineId?: ProductionLineId
  ) {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const nowIso = new Date().toISOString();
    const auditId = `AUD-${nowIso.slice(0, 10).replace(/-/g, '')}-${String(logs.length + 1).padStart(3, '0')}`;
    
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      auditId,
      module: (category as any) || 'SYSTEM',
      recordId: lineId ? `LINE-${lineId}` : 'SYS-GLOBAL',
      action: category || 'UPDATE',
      fieldChanged: 'generalStatus',
      oldValue: '',
      newValue: '',
      reason: details,
      user: `${user.name} (${user.employeeId || user.role})`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      userRole: user.role,
      dateTime: nowIso,
      timestamp: nowIso.replace('T', ' ').substring(0, 19),
      ipReference: '192.168.10.' + (Math.floor(10 + Math.random() * 80)),
      sessionReference: 'SES-' + user.id.replace('USR-', '10'),
      actionCategory: category,
      details,
      detailsTh,
      lineId
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
  }

  public logStructuredAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'dateTime' | 'user' | 'role'> & {
    userOverride?: { name: string; id: string; role: UserRole; employeeId?: string };
  }) {
    const logs = this.getAuditLogs();
    const user = entry.userOverride || this.getCurrentUser();
    const nowIso = new Date().toISOString();
    const auditId = entry.auditId || `AUD-${nowIso.slice(0, 10).replace(/-/g, '')}-${String(logs.length + 1).padStart(3, '0')}`;

    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      auditId,
      module: entry.module,
      recordId: entry.recordId,
      action: entry.action,
      fieldChanged: entry.fieldChanged,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      reason: entry.reason,
      user: `${user.name} (${user.employeeId || user.role})`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      userRole: user.role,
      dateTime: nowIso,
      timestamp: nowIso.replace('T', ' ').substring(0, 19),
      approvalRequestId: entry.approvalRequestId,
      ipReference: entry.ipReference || '192.168.10.45',
      sessionReference: entry.sessionReference || `SES-${user.id.replace('USR-', '10')}`,
      details: entry.details || `${entry.action} on ${entry.recordId} (${entry.fieldChanged}: ${entry.oldValue} -> ${entry.newValue})`,
      detailsTh: entry.detailsTh,
      lineId: entry.lineId,
      actionCategory: entry.actionCategory || 'SYSTEM'
    };

    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
    this.notify();
    return newEntry;
  }

  /**
   * Safe Correction Workflow:
   * 1. Never silently overwrite an approved record.
   * 2. Create reversal record and new corrected record.
   * 3. Link correction to original record ID.
   * 4. Require mandatory reason.
   * 5. Preserve audit trail and attachments.
   */
  public submitSafeCorrection(params: {
    module: AuditLogEntry['module'];
    originalRecordId: string;
    actionType: 'REPLACEMENT_CORRECTION' | 'SHOT_CORRECTION' | 'STOCK_CORRECTION' | 'REGRIND_CORRECTION';
    fieldChanged: string;
    oldValue: any;
    newValue: any;
    reason: string;
    correctedData: any;
    isProductionImpacting?: boolean;
    approverName?: string;
  }): { success: boolean; message: string; reversalId?: string; correctionId?: string; error?: string } {
    if (!params.reason || params.reason.trim().length < 5) {
      return { 
        success: false, 
        message: 'A detailed reason (minimum 5 characters) is strictly mandatory for all safe corrections.', 
        error: 'A detailed reason (minimum 5 characters) is strictly mandatory for all safe corrections.' 
      };
    }

    const currentUser = this.getCurrentUser();
    const reversalId = `REV-${params.originalRecordId}-${Date.now().toString().slice(-4)}`;
    const correctionId = `CORR-${params.originalRecordId}-${Date.now().toString().slice(-4)}`;

    // Log the Reversal Audit Entry
    this.logStructuredAudit({
      module: params.module,
      recordId: params.originalRecordId,
      action: 'REVERSAL',
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: `REVERSED (Ref: ${reversalId})`,
      reason: `Correction Reversal: ${params.reason}`,
      details: `Reversed original transaction ${params.originalRecordId} due to safe correction: ${params.reason}`,
      detailsTh: `ย้อนกลับรายการเดิม ${params.originalRecordId} เพื่อทำการแก้ไขอย่างปลอดภัย: ${params.reason}`,
      actionCategory: 'REPLACEMENT'
    });

    // Log the New Corrected Record Entry
    this.logStructuredAudit({
      module: params.module,
      recordId: correctionId,
      action: params.actionType,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reason: params.reason,
      details: `Applied safe correction ${correctionId} linking to original ${params.originalRecordId}. Field: ${params.fieldChanged} (${params.oldValue} -> ${params.newValue})`,
      detailsTh: `บันทึกรายการแก้ไขใหม่ ${correctionId} เชื่อมโยงกับรายการเดิม ${params.originalRecordId}`,
      actionCategory: 'REPLACEMENT'
    });

    this.notify();
    return {
      success: true,
      message: `Safe correction applied successfully. Reversal ref: ${reversalId}, New record ref: ${correctionId}. Original data audit preserved.`,
      reversalId,
      correctionId
    };
  }

  public getShotDrafts(): ShotEntryRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOT_DRAFTS) || '[]');
  }

  public saveShotDraft(draft: Partial<ShotEntryRecord>): ShotEntryRecord {
    if (!draft.operatorName || !draft.operatorName.trim()) {
      throw new Error('กรุณาระบุชื่อพนักงานผู้บันทึกก่อนบันทึกแบบร่าง (Operator Name is mandatory)');
    }
    const drafts = this.getShotDrafts();
    const user = this.getCurrentUser();
    const existingIdx = draft.id ? drafts.findIndex(d => d.id === draft.id) : -1;
    
    const draftRecord: ShotEntryRecord = {
      id: draft.id || `DRAFT-SHOT-${Date.now()}`,
      lineId: draft.lineId || 'E6',
      configurationId: draft.configurationId,
      configurationSlot: draft.configurationSlot,
      dieCode: draft.dieCode,
      productionDate: draft.productionDate || new Date().toISOString().substring(0, 10),
      shift: draft.shift || 'Shift 1 (Day)',
      inputMethod: draft.inputMethod || 'METER_READING',
      entryType: 'MANUAL_SHIFT',
      shotsAdded: Number(draft.shotsAdded) || 0,
      previousTotal: Number(draft.previousTotal) || 0,
      newTotal: Number(draft.newTotal) || 0,
      entryReason: draft.entryReason || 'Daily Shift Production',
      notes: draft.notes || '',
      operatorName: draft.operatorName.trim(),
      operatorId: user.employeeId,
      timestamp: new Date().toISOString(),
      status: 'DRAFT',
      splitPeriods: draft.splitPeriods,
      allowMultiEntry: draft.allowMultiEntry || false
    };

    if (existingIdx >= 0) {
      drafts[existingIdx] = draftRecord;
    } else {
      drafts.unshift(draftRecord);
    }

    localStorage.setItem(STORAGE_KEYS.SHOT_DRAFTS, JSON.stringify(drafts.slice(0, 50)));
    this.addAuditLog('SHOT_ADJUSTMENT', `Saved Shot Entry draft (${draftRecord.id}) for Line ${draftRecord.lineId}`);
    this.notify();
    return draftRecord;
  }

  public deleteShotDraft(draftId: string): void {
    const drafts = this.getShotDrafts().filter(d => d.id !== draftId);
    localStorage.setItem(STORAGE_KEYS.SHOT_DRAFTS, JSON.stringify(drafts));
    this.notify();
  }

  public checkDuplicateShotEntry(
    lineId: ProductionLineId,
    productionDate: string,
    shift: string,
    excludeId?: string
  ): boolean {
    const logs = this.getShotLogs();
    return logs.some(log => 
      log.id !== excludeId &&
      log.lineId === lineId &&
      log.status !== 'REVERSED' &&
      log.shift === shift &&
      (log.productionDate === productionDate || log.timestamp.startsWith(productionDate))
    );
  }

  public previewShotSubmission(params: {
    lineId: ProductionLineId;
    shotsAdded: number;
    splitPeriods?: { configId: string; dieCode: string; shotsAdded: number }[];
  }) {
    const all = this.getLinesMonitoring();
    const line = all[params.lineId];
    const settings = this.getSettings();
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();

    if (!line) {
      return {
        line: null,
        affectedParts: [],
        excludedParts: [],
        hasMissingStandard: true,
        hasDataError: true,
        resultingMachineShot: 0,
        abnormalIncreaseWarning: false,
        error: `Production Line ${params.lineId} not found`
      };
    }

    const previousTotal = line.machineShotTotal;
    const resultingMachineShot = previousTotal + params.shotsAdded;
    const abnormalIncreaseWarning = params.shotsAdded > (settings.maxShotsPerShift || 150000);

    let hasMissingStandard = false;
    let hasDataError = false;

    const affectedParts: any[] = [];
    const excludedParts: any[] = [];

    line.items.forEach(item => {
      // Check exclusion conditions
      const isNotControlled = item.controlType === 'NOT_CONTROLLED_BY_SHOT' || (item as any).isNotControlledByShot;
      const isPaused = item.isPaused === true || item.installationStatus === 'PAUSED';
      const isRemoved = item.isRemoved === true || item.installationStatus === 'REMOVED';
      const isInactive = item.isActive === false;
      const isZeroInstall = (item.installQty || 0) <= 0;

      if (isNotControlled) {
        excludedParts.push({ ...item, reason: 'NOT_CONTROLLED_BY_SHOT (ชิ้นส่วนไม่ได้ควบคุมด้วยยอดช็อต)' });
        return;
      }
      if (isPaused) {
        excludedParts.push({ ...item, reason: 'PAUSED (หยุดใช้งานชั่วคราว)' });
        return;
      }
      if (isRemoved) {
        excludedParts.push({ ...item, reason: 'REMOVED (ถอดออกจากแม่พิมพ์)' });
        return;
      }
      if (isInactive || isZeroInstall) {
        excludedParts.push({ ...item, reason: 'INACTIVE (ไม่ได้ติดตั้งบนสายการผลิต)' });
        return;
      }

      // Calculate part shot addition
      let addedToPart = params.shotsAdded;
      if (params.splitPeriods && params.splitPeriods.length > 0) {
        // If split period configured, check if part belongs to matching config
        const matchedPeriod = params.splitPeriods.find(p => p.dieCode === line.activeConfig?.dieCode || p.configId === line.activeConfig?.id);
        addedToPart = matchedPeriod ? matchedPeriod.shotsAdded : params.shotsAdded;
      }

      const curUsed = item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0);
      const postUsed = curUsed + addedToPart;

      const calculated = calculatePartMetrics(
        {
          ...item,
          currentShot: postUsed,
          usedShot: postUsed
        },
        line.activeConfig,
        standards,
        stocks
      );

      if (calculated.isStandardMissing) hasMissingStandard = true;
      if (calculated.isDataError) hasDataError = true;

      const statusChanged = (calculated.lifeStatus || 'NORMAL') !== (item.lifeStatus || 'NORMAL');

      affectedParts.push({
        ...calculated,
        oldShot: curUsed,
        addedShot: addedToPart,
        newShot: postUsed,
        oldUsage: item.usagePercent || 0,
        newUsage: calculated.usagePercent || 0,
        oldStatus: item.lifeStatus || 'NORMAL',
        newStatus: calculated.lifeStatus || 'NORMAL',
        statusChanged
      });
    });

    return {
      line,
      affectedParts,
      excludedParts,
      hasMissingStandard,
      hasDataError,
      resultingMachineShot,
      abnormalIncreaseWarning,
      error: null
    };
  }

  public submitShotEntry(params: {
    lineId: ProductionLineId;
    productionDate: string;
    shift: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)';
    inputMethod: 'METER_READING' | 'DIRECT_INCREMENT';
    previousTotal: number;
    newTotal: number;
    shotsAdded: number;
    entryReason?: string;
    notes?: string;
    operatorName?: string;
    draftId?: string;
    allowMultiEntry?: boolean;
    splitPeriods?: { configId: string; dieCode: string; configurationSlot?: string; shotsAdded: number; timeInterval?: string; reason?: string }[];
  }): { success: boolean; record?: ShotEntryRecord; error?: string } {
    // 1. Validation: Whole numbers & Mandatory Operator
    if (!params.operatorName || !params.operatorName.trim()) {
      return { success: false, error: 'กรุณาระบุชื่อพนักงานผู้บันทึก (Operator Name is strictly required - บังคับลงชื่อพนักงานทุกครั้ง)' };
    }
    if (!Number.isInteger(params.shotsAdded) || !Number.isInteger(params.previousTotal) || !Number.isInteger(params.newTotal)) {
      return { success: false, error: 'Shot counts must be strictly whole numbers (จำนวนช็อตต้องเป็นเลขจำนวนเต็มเท่านั้น)' };
    }
    if (params.shotsAdded <= 0) {
      return { success: false, error: 'Shot Increment must be greater than zero (ยอดช็อตที่เพิ่มต้องมากกว่า 0)' };
    }
    if (params.newTotal < params.previousTotal) {
      return { success: false, error: 'New Machine Reading cannot be lower than Previous Reading (ยอดอ่านใหม่ต้องไม่ต่ำกว่ายอดอ่านเดิม กรุณาใช้ฟังก์ชัน Counter Reset หากมีการรีเซ็ตมิเตอร์)' };
    }

    // 2. Duplicate validation
    if (!params.allowMultiEntry) {
      const isDup = this.checkDuplicateShotEntry(params.lineId, params.productionDate, params.shift);
      if (isDup) {
        return {
          success: false,
          error: `Duplicate Entry Detected: An active shot entry for Line ${params.lineId} on ${params.productionDate} (${params.shift}) already exists. Enable "Allow Multi-Entry" or use "Correct Entry" to adjust.`
        };
      }
    }

    const all = this.getLinesMonitoring();
    const line = all[params.lineId];
    if (!line) {
      return { success: false, error: `Production Line ${params.lineId} not found` };
    }

    // 3. Update Line Telemetry
    const previousMachineShot = line.machineShotTotal;
    line.machineShotTotal = params.newTotal;
    line.shiftShot = (line.shiftShot || 0) + params.shotsAdded;
    line.dailyShot = (line.dailyShot || 0) + params.shotsAdded;
    line.monthlyShot = (line.monthlyShot || 0) + params.shotsAdded;
    line.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 4. Update Part Wear for Active Shot-Controlled Parts
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();
    let affectedCount = 0;
    let excludedCount = 0;

    line.items = line.items.map(item => {
      const isNotControlled = item.controlType === 'NOT_CONTROLLED_BY_SHOT' || (item as any).isNotControlledByShot;
      const isPaused = item.isPaused === true || item.installationStatus === 'PAUSED';
      const isRemoved = item.isRemoved === true || item.installationStatus === 'REMOVED';
      const isInactive = item.isActive === false;
      const isZeroInstall = (item.installQty || 0) <= 0;

      if (isNotControlled || isPaused || isRemoved || isInactive || isZeroInstall) {
        excludedCount++;
        return item;
      }

      affectedCount++;
      let partIncrement = params.shotsAdded;
      if (params.splitPeriods && params.splitPeriods.length > 0) {
        const matchedPeriod = params.splitPeriods.find(p => p.dieCode === line.activeConfig?.dieCode || p.configId === line.activeConfig?.id);
        partIncrement = matchedPeriod ? matchedPeriod.shotsAdded : params.shotsAdded;
      }

      const curShot = (item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0)) + partIncrement;
      return calculatePartMetrics(
        {
          ...item,
          currentShot: curShot,
          usedShot: curShot
        },
        line.activeConfig,
        standards,
        stocks
      );
    });

    all[params.lineId] = line;
    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));

    // 5. Create Shot Log Record
    const user = this.getCurrentUser();
    const logs = this.getShotLogs();
    const recordId = `SHOT-${Date.now()}`;
    const newRecord: ShotEntryRecord = {
      id: recordId,
      lineId: params.lineId,
      configurationId: line.activeConfig?.id,
      configurationSlot: line.activeConfig?.configurationSlot || 'SLOT-01',
      dieCode: line.activeConfig?.dieCode || 'UNKNOWN',
      productionDate: params.productionDate,
      shift: params.shift,
      inputMethod: params.inputMethod,
      entryType: 'MANUAL_SHIFT',
      shotsAdded: params.shotsAdded,
      previousTotal: params.previousTotal,
      newTotal: params.newTotal,
      entryReason: params.entryReason || 'Daily Shift Production',
      notes: params.notes,
      operatorName: params.operatorName || user.name,
      operatorId: user.employeeId,
      timestamp: new Date().toISOString(),
      status: 'SUBMITTED',
      splitPeriods: params.splitPeriods,
      affectedPartsCount: affectedCount,
      excludedPartsCount: excludedCount,
      allowMultiEntry: params.allowMultiEntry || false
    };

    logs.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.SHOT_LOGS, JSON.stringify(logs.slice(0, 500)));

    // 6. Delete Draft if applicable
    if (params.draftId) {
      this.deleteShotDraft(params.draftId);
    }

    // 7. Audit Log
    this.addAuditLog(
      'SHOT_ADJUSTMENT',
      `Submitted ${params.shotsAdded.toLocaleString()} shots on Line ${params.lineId} (${params.shift}, ${params.productionDate}) [Total: ${params.newTotal.toLocaleString()}]`,
      `บันทึกยอดช็อตประจำกะ ${params.shotsAdded.toLocaleString()} ครั้ง ในสาย ${params.lineId} (${params.shift})`,
      params.lineId
    );

    this.notify();
    return { success: true, record: newRecord };
  }

  public recordShotIncrement(lineId: ProductionLineId, inc: number, reason: string = 'PLC Driver', operator: string = 'SYSTEM'): void {
    const all = this.getLinesMonitoring();
    const line = all[lineId];
    if (!line) return;

    const previousTotal = line.machineShotTotal || 0;
    const newTotal = previousTotal + inc;
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();

    const updatedItems = line.items.map(item => {
      const isNotControlled = item.controlType === 'NOT_CONTROLLED_BY_SHOT' || (item as any).isNotControlledByShot;
      const isPaused = item.isPaused === true || item.installationStatus === 'PAUSED';
      const isRemoved = item.isRemoved === true || item.installationStatus === 'REMOVED';
      const isInactive = item.isActive === false;
      const isZeroInstall = (item.installQty || 0) <= 0;

      if (isNotControlled || isPaused || isRemoved || isInactive || isZeroInstall) {
        return item;
      }

      const curUsed = item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0);
      const newUsed = curUsed + inc;

      return calculatePartMetrics(
        {
          ...item,
          currentShot: newUsed,
          usedShot: newUsed
        },
        line.activeConfig,
        standards,
        stocks
      );
    });

    all[lineId] = {
      ...line,
      machineShotTotal: newTotal,
      lastUpdate: new Date().toISOString(),
      items: updatedItems
    };

    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
    this.notify();
  }

  public executeCounterReset(params: {
    lineId?: ProductionLineId;
    targetLine?: 'ALL' | ProductionLineId;
    previousTotal?: number;
    newResetTotal: number;
    approvalId: string;
    approvedBy: string;
    resetReason: string;
    shift?: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)';
    productionDate?: string;
    resetPartWear?: boolean;
    resetShiftCounters?: boolean;
    notes?: string;
  }): { success: boolean; records?: ShotEntryRecord[]; record?: ShotEntryRecord; affectedLines?: ProductionLineId[]; error?: string } {
    if (!params.approvalId || !params.approvedBy || !params.resetReason) {
      return { success: false, error: 'Approval ID, Approver Name, and Reset Reason are required for Counter Reset (ต้องระบุรหัสอนุมัติ, ผู้อนุมัติ และเหตุผล)' };
    }
    if (!Number.isInteger(params.newResetTotal) || params.newResetTotal < 0) {
      return { success: false, error: 'Reset counter base reading must be a non-negative whole number (เลขมิเตอร์ต้องเป็นจำนวนเต็มบวกหรือศูนย์)' };
    }

    const all = this.getLinesMonitoring();
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();
    const user = this.getCurrentUser();
    const logs = this.getShotLogs();
    const isAllLines = params.targetLine === 'ALL' || (!params.lineId && !params.targetLine);
    const targetLineIds: ProductionLineId[] = isAllLines
      ? (['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'] as ProductionLineId[])
      : [params.lineId || (params.targetLine as ProductionLineId)];

    const createdRecords: ShotEntryRecord[] = [];
    const resetDate = params.productionDate || new Date().toISOString().substring(0, 10);
    const resetShift = params.shift || 'Shift 1 (Day)';
    const resetParts = params.resetPartWear !== false; // default true
    const resetTallies = params.resetShiftCounters !== false; // default true

    targetLineIds.forEach(lId => {
      const line = all[lId];
      if (!line) return;

      const oldTotal = line.machineShotTotal || 0;
      line.machineShotTotal = params.newResetTotal;
      if (resetTallies) {
        line.shiftShot = 0;
        line.dailyShot = 0;
        line.monthlyShot = 0;
      } else {
        line.shiftShot = 0;
      }
      line.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (resetParts && line.items) {
        line.items = line.items.map(item => {
          return calculatePartMetrics(
            {
              ...item,
              usedShot: 0,
              currentShot: 0,
              shotAtLastChange: params.newResetTotal,
              lastChangeShot: params.newResetTotal
            },
            line.activeConfig,
            standards,
            stocks
          );
        });
      }

      all[lId] = line;

      const recordId = `SHOT-RST-${lId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const resetRecord: ShotEntryRecord = {
        id: recordId,
        lineId: lId,
        configurationId: line.activeConfig?.id,
        configurationSlot: line.activeConfig?.configurationSlot || 'SLOT-01',
        dieCode: line.activeConfig?.dieCode || `FD-${lId}-07`,
        productionDate: resetDate,
        shift: resetShift,
        inputMethod: 'METER_READING',
        entryType: 'COUNTER_RESET',
        shotsAdded: 0,
        previousTotal: oldTotal,
        newTotal: params.newResetTotal,
        entryReason: `Machine Counter Reset: ${params.resetReason}`,
        notes: params.notes || `Counter & Part wear reset from ${oldTotal.toLocaleString()} -> ${params.newResetTotal.toLocaleString()} shots`,
        operatorName: user.name,
        operatorId: user.employeeId,
        timestamp: new Date().toISOString(),
        status: 'COUNTER_RESET',
        isCounterReset: true,
        resetApprovalId: params.approvalId,
        resetApprovedBy: params.approvedBy,
        resetReason: params.resetReason
      };

      createdRecords.push(resetRecord);
      logs.unshift(resetRecord);
    });

    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
    localStorage.setItem(STORAGE_KEYS.SHOT_LOGS, JSON.stringify(logs.slice(0, 500)));

    const linesDesc = isAllLines ? 'ALL LINES (E1-E6)' : `Line ${targetLineIds.join(', ')}`;
    this.addAuditLog(
      'SHOT_ADJUSTMENT',
      `EXECUTED SHOT RESET on ${linesDesc}: Base meter -> ${params.newResetTotal.toLocaleString()} shots (Parts reset: ${resetParts ? 'YES' : 'NO'}, Shift tallies reset: ${resetTallies ? 'YES' : 'NO'}) [Approval: ${params.approvalId} by ${params.approvedBy}]`,
      `รีเซ็ตยอดช็อตและมิเตอร์ ${linesDesc}: ค่าฐานใหม่ ${params.newResetTotal.toLocaleString()} ช็อต (รีเซ็ตชิ้นส่วน: ${resetParts ? 'ใช่' : 'ไม่'}, รีเซ็ตกะ: ${resetTallies ? 'ใช่' : 'ไม่'}) [รหัสอนุมัติ: ${params.approvalId}]`,
      isAllLines ? undefined : targetLineIds[0]
    );

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('findie-shot-reset', {
          detail: {
            affectedLines: targetLineIds,
            isAllLines,
            newResetTotal: params.newResetTotal,
            resetParts,
            resetTallies,
            timestamp: new Date().toISOString()
          }
        }));
      }
    } catch (_) {}

    this.notify();
    return {
      success: true,
      records: createdRecords,
      record: createdRecords[0],
      affectedLines: targetLineIds
    };
  }

  public resetAllLinesShots(options?: {
    newResetTotal?: number;
    resetPartWear?: boolean;
    resetShiftCounters?: boolean;
    approvalId?: string;
    approvedBy?: string;
    resetReason?: string;
    notes?: string;
  }) {
    const user = this.getCurrentUser();
    return this.executeCounterReset({
      targetLine: 'ALL',
      newResetTotal: options?.newResetTotal ?? 0,
      resetPartWear: options?.resetPartWear ?? true,
      resetShiftCounters: options?.resetShiftCounters ?? true,
      approvalId: options?.approvalId || `RST-ALL-${Date.now().toString().slice(-6)}`,
      approvedBy: options?.approvedBy || user.name || 'System Admin',
      resetReason: options?.resetReason || 'Factory-wide Tooling & Meter Full Calibration (รีเซ็ตยอดช็อตและมิเตอร์ทุกสาย)',
      notes: options?.notes || 'Full synchronized reset across all 8 lines and TV monitors'
    });
  }

  public correctShotEntry(
    originalLogId: string,
    params: {
      correctedShotsAdded: number;
      newTotal: number;
      correctionReason: string;
      shift?: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)';
      productionDate?: string;
      notes?: string;
    }
  ): { success: boolean; reversalRecord?: ShotEntryRecord; correctedRecord?: ShotEntryRecord; error?: string } {
    if (!params.correctionReason || params.correctionReason.trim().length === 0) {
      return { success: false, error: 'A mandatory reason is required for manual shot correction' };
    }
    if (!Number.isInteger(params.correctedShotsAdded) || params.correctedShotsAdded <= 0) {
      return { success: false, error: 'Corrected Shot Increment must be a positive whole number' };
    }

    const logs = this.getShotLogs();
    const origIndex = logs.findIndex(l => l.id === originalLogId);
    if (origIndex === -1) {
      return { success: false, error: `Original entry ${originalLogId} not found` };
    }

    const originalRecord = logs[origIndex];
    if (originalRecord.status === 'REVERSED') {
      return { success: false, error: `Entry ${originalLogId} has already been reversed/corrected` };
    }

    const all = this.getLinesMonitoring();
    const line = all[originalRecord.lineId];
    if (!line) {
      return { success: false, error: `Production Line ${originalRecord.lineId} not found` };
    }

    const user = this.getCurrentUser();
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();

    // 1. Create Reversal Record
    const reversalId = `REV-${originalRecord.id}`;
    const reversalRecord: ShotEntryRecord = {
      id: reversalId,
      lineId: originalRecord.lineId,
      configurationId: originalRecord.configurationId,
      dieCode: originalRecord.dieCode,
      productionDate: originalRecord.productionDate || originalRecord.timestamp.substring(0, 10),
      shift: originalRecord.shift,
      entryType: 'CORRECTION',
      shotsAdded: -originalRecord.shotsAdded,
      previousTotal: line.machineShotTotal,
      newTotal: line.machineShotTotal - originalRecord.shotsAdded,
      entryReason: `REVERSAL of ${originalRecord.id}: ${params.correctionReason}`,
      notes: `Reversal of original ${originalRecord.shotsAdded.toLocaleString()} shots`,
      operatorName: user.name,
      operatorId: user.employeeId,
      timestamp: new Date().toISOString(),
      status: 'REVERSED',
      reversalOfId: originalRecord.id,
      correctionReason: params.correctionReason
    };

    // 2. Create Corrected Record
    const correctedId = `CORR-${Date.now()}`;
    const postReversalTotal = line.machineShotTotal - originalRecord.shotsAdded;
    const finalNewTotal = postReversalTotal + params.correctedShotsAdded;

    const correctedRecord: ShotEntryRecord = {
      id: correctedId,
      lineId: originalRecord.lineId,
      configurationId: originalRecord.configurationId,
      dieCode: originalRecord.dieCode,
      productionDate: params.productionDate || originalRecord.productionDate || new Date().toISOString().substring(0, 10),
      shift: params.shift || originalRecord.shift,
      entryType: 'CORRECTION',
      shotsAdded: params.correctedShotsAdded,
      previousTotal: postReversalTotal,
      newTotal: finalNewTotal,
      entryReason: `CORRECTED ENTRY for ${originalRecord.id}: ${params.correctionReason}`,
      notes: params.notes || originalRecord.notes,
      operatorName: user.name,
      operatorId: user.employeeId,
      timestamp: new Date().toISOString(),
      status: 'CORRECTION',
      isCorrection: true,
      correctedFromId: originalRecord.id,
      correctionReason: params.correctionReason
    };

    // 3. Apply Net Delta to Machine & Parts
    const netDelta = params.correctedShotsAdded - originalRecord.shotsAdded;
    line.machineShotTotal += netDelta;
    line.shiftShot = Math.max(0, (line.shiftShot || 0) + netDelta);
    line.dailyShot = Math.max(0, (line.dailyShot || 0) + netDelta);
    line.monthlyShot = Math.max(0, (line.monthlyShot || 0) + netDelta);
    line.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    line.items = line.items.map(item => {
      const isNotControlled = item.controlType === 'NOT_CONTROLLED_BY_SHOT' || (item as any).isNotControlledByShot;
      const isPaused = item.isPaused === true || item.installationStatus === 'PAUSED';
      const isRemoved = item.isRemoved === true || item.installationStatus === 'REMOVED';
      const isInactive = item.isActive === false;

      if (isNotControlled || isPaused || isRemoved || isInactive) {
        return item;
      }

      const curShot = Math.max(0, (item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0)) + netDelta);
      return calculatePartMetrics(
        {
          ...item,
          currentShot: curShot,
          usedShot: curShot
        },
        line.activeConfig,
        standards,
        stocks
      );
    });

    all[originalRecord.lineId] = line;
    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));

    // 4. Update Original Record Status & Insert Reversal + Corrected Records
    logs[origIndex] = {
      ...originalRecord,
      status: 'REVERSED',
      notes: `${originalRecord.notes || ''} [REVERSED by ${reversalId}: ${params.correctionReason}]`
    };

    logs.unshift(reversalRecord);
    logs.unshift(correctedRecord);
    localStorage.setItem(STORAGE_KEYS.SHOT_LOGS, JSON.stringify(logs.slice(0, 500)));

    // 5. Comprehensive Audit Trail
    this.addAuditLog(
      'SHOT_ADJUSTMENT',
      `CORRECTED SHOT ENTRY ${originalRecord.id} on Line ${originalRecord.lineId}: Changed ${originalRecord.shotsAdded.toLocaleString()} -> ${params.correctedShotsAdded.toLocaleString()} shots. Reason: ${params.correctionReason}`,
      `แก้ไขรายการช็อต ${originalRecord.id} สาย ${originalRecord.lineId}: เปลี่ยนจาก ${originalRecord.shotsAdded.toLocaleString()} -> ${params.correctedShotsAdded.toLocaleString()} ช็อต (เหตุผล: ${params.correctionReason})`,
      originalRecord.lineId
    );

    this.notify();
    return { success: true, reversalRecord, correctedRecord };
  }

  public addShotEntry(
    lineId: ProductionLineId,
    shotsAdded: number,
    entryType: 'AUTOMATIC_PLC' | 'MANUAL_SHIFT',
    shift: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)',
    notes?: string
  ) {
    const all = this.getLinesMonitoring();
    const line = all[lineId];
    if (!line) return;

    const previousTotal = line.machineShotTotal;
    const newTotal = previousTotal + shotsAdded;

    line.machineShotTotal = newTotal;
    line.shiftShot += shotsAdded;
    line.dailyShot += shotsAdded;
    line.monthlyShot += shotsAdded;
    line.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Increment usedShot for all active tooling items on this line
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();

    line.items = line.items.map(item => {
      const isNotControlled = item.controlType === 'NOT_CONTROLLED_BY_SHOT' || (item as any).isNotControlledByShot;
      const isPaused = item.isPaused === true || item.installationStatus === 'PAUSED';
      const isRemoved = item.isRemoved === true || item.installationStatus === 'REMOVED';
      const isInactive = item.isActive === false;

      if (isNotControlled || isPaused || isRemoved || isInactive) {
        return item;
      }

      const curShot = (item.usedShot !== undefined ? item.usedShot : item.currentShot) + shotsAdded;
      return calculatePartMetrics(
        {
          ...item,
          currentShot: curShot,
          usedShot: curShot
        },
        line.activeConfig,
        standards,
        stocks
      );
    });

    all[lineId] = line;
    localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));

    // Add Shot log
    const user = this.getCurrentUser();
    const logs = this.getShotLogs();
    const newShotLog: ShotEntryRecord = {
      id: `SHOT-${Date.now()}`,
      lineId,
      entryType,
      shotsAdded,
      previousTotal,
      newTotal,
      shift,
      status: 'SUBMITTED',
      operatorName: user.name,
      operatorId: user.employeeId,
      notes,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newShotLog);
    localStorage.setItem(STORAGE_KEYS.SHOT_LOGS, JSON.stringify(logs.slice(0, 300)));

    this.addAuditLog(
      'SHOT_ADJUSTMENT',
      `Recorded ${shotsAdded.toLocaleString()} shots on Line ${lineId} (${entryType})`,
      `บันทึกยอดช็อต ${shotsAdded.toLocaleString()} ครั้ง ในสายการผลิต ${lineId}`,
      lineId
    );

    this.notify();
  }

  public previewReplacement(record: Partial<ReplacementRecord>) {
    const all = this.getLinesMonitoring();
    const lineId = record.lineId || 'E6';
    const line = all[lineId];
    const stocks = this.getSpareStocks();
    const standards = this.getLifeStandards();
    const regrindStandards = this.getRegrindMasterStandards();

    if (!line) {
      return {
        valid: false,
        error: `Production line ${lineId} not found`
      };
    }

    const item = line.items.find(i => i.partCode === record.partCode || (record.stageName && i.stagePunchDie === record.stageName));
    const stockItem = stocks.find(s => s.partCode === record.partCode);
    const regrindStd = regrindStandards.find(r => r.partCode === record.partCode);
    const machineShot = record.machineShotAtReplacement !== undefined ? Number(record.machineShotAtReplacement) : line.machineShotTotal;
    const installedQty = record.installedQuantity !== undefined ? Number(record.installedQuantity) : (item ? item.installQty : 1);
    const changedQty = record.changedQuantity !== undefined ? Number(record.changedQuantity) : installedQty;
    const isFullSet = record.fullSetOrPartial === 'FULL_SET' || record.replacementType === 'FULL SET REPLACEMENT';
    const isPartial = record.fullSetOrPartial === 'PARTIAL' || record.replacementType === 'PARTIAL REPLACEMENT';

    const warnings: string[] = [];
    const errors: string[] = [];

    // Validation Rule 5: Partial replacements require position numbers
    if (isPartial && (!record.position || record.position.trim() === '' || record.position.toUpperCase() === 'ALL')) {
      errors.push('Rule 5 Violation: Partial replacements require specific position numbers / station IDs.');
    }

    // Validation Rule 8 & 9: Full set quantity verification
    if (isFullSet && changedQty !== installedQty && (!record.quantityMismatchReason || record.quantityMismatchReason.trim() === '')) {
      errors.push(`Rule 8/9 Violation: Full set replacement changed quantity (${changedQty}) does not match installed quantity (${installedQty}). A mismatch reason & supervisor override is required.`);
    }

    // Validation Rule 10: Block scrapped parts
    if (record.newPartLotNumber && (record.newPartLotNumber.toUpperCase().includes('SCRAP') || record.newPartLotNumber.toUpperCase().includes('REJECT'))) {
      errors.push('Rule 10 Violation: Blocked attempt to install a part marked as SCRAP / REJECT.');
    }

    // Validation Rule 11: Prevent installation of parts exceeding max regrind count
    if (record.replacementType === 'RE-GROUND PART' && regrindStd) {
      const removedRegrind = record.removedPartRegrindCount || (item ? item.regrindCount : 0);
      if (removedRegrind >= regrindStd.maxRegrindCount) {
        warnings.push(`Rule 11 Notice: Part regrind count (${removedRegrind + 1}) will reach or exceed max allowed cycles (${regrindStd.maxRegrindCount}).`);
      }
    }

    // Stock check
    if (stockItem && stockItem.currentStockQty < changedQty) {
      warnings.push(`Inventory Warning: Requested change quantity (${changedQty}) exceeds available warehouse backup stock (${stockItem.currentStockQty} EA).`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      before: {
        machineShotTotal: line.machineShotTotal,
        partUsedShot: item ? (item.usedShot !== undefined ? item.usedShot : item.currentShot) : (record.removedPartUsedShot || 0),
        partRegrindCount: item ? item.regrindCount : (record.removedPartRegrindCount || 0),
        partUsagePercent: item ? item.usagePercent : 0,
        partAlertStatus: item ? item.alertStatus : 'NORMAL',
        warehouseStockQty: stockItem ? stockItem.currentStockQty : 0,
        lastChangeShot: item ? item.lastChangeShot : 0
      },
      after: {
        machineShotTotal: line.machineShotTotal,
        partUsedShot: 0, // Reset to 0 only through approved replacement
        partRegrindCount: record.replacementType === 'RE-GROUND PART' 
          ? ((item ? item.regrindCount : (record.removedPartRegrindCount || 0)) + 1)
          : 0,
        partUsagePercent: 0,
        partAlertStatus: 'NORMAL',
        warehouseStockQty: stockItem ? Math.max(0, stockItem.currentStockQty - changedQty) : 0,
        lastChangeShot: machineShot,
        preservedRemovedShot: item ? (item.usedShot !== undefined ? item.usedShot : item.currentShot) : (record.removedPartUsedShot || 0)
      }
    };
  }

  public recordReplacement(record: Partial<ReplacementRecord> & { draftId?: string }): { success: boolean; record?: ReplacementRecord; error?: string } {
    const user = this.getCurrentUser();
    const replacements = this.getReplacements();
    const all = this.getLinesMonitoring();
    const lineId = record.lineId || 'E6';
    const line = all[lineId];

    if (!line) {
      return { success: false, error: `Production line ${lineId} not found` };
    }

    const item = line.items.find(i => i.partCode === record.partCode || (record.stageName && i.stagePunchDie === record.stageName));
    const installedQty = record.installedQuantity !== undefined ? Number(record.installedQuantity) : (item ? item.installQty : 1);
    const changedQty = record.changedQuantity !== undefined ? Number(record.changedQuantity) : installedQty;
    const isFullSet = record.fullSetOrPartial === 'FULL_SET' || record.replacementType === 'FULL SET REPLACEMENT';
    const isPartial = record.fullSetOrPartial === 'PARTIAL' || record.replacementType === 'PARTIAL REPLACEMENT';

    // Rule 1 & 2: Life is started/reset ONLY through approved replacement transaction
    // Rule 5: Partial replacements require position numbers
    if (isPartial && (!record.position || record.position.trim() === '' || record.position.toUpperCase() === 'ALL')) {
      return { success: false, error: 'Rule 5 Error: Partial replacements require specific position numbers / station IDs.' };
    }

    // Rule 8 & 9: Full set quantity mismatch verification
    if (isFullSet && changedQty !== installedQty && (!record.quantityMismatchReason || record.quantityMismatchReason.trim() === '')) {
      return { success: false, error: `Rule 8/9 Error: Full set replacement changed quantity (${changedQty}) does not match installed quantity (${installedQty}). Reason and approval override required.` };
    }

    // Rule 10: Block scrapped parts
    if (record.newPartLotNumber && (record.newPartLotNumber.toUpperCase().includes('SCRAP') || record.newPartLotNumber.toUpperCase().includes('REJECT'))) {
      return { success: false, error: 'Rule 10 Error: Cannot install a part lot marked as SCRAP / REJECT.' };
    }

    const newId = `REP-${new Date().getFullYear()}-${String(replacements.length + 1).padStart(4, '0')}`;
    const machineShot = record.machineShotAtReplacement !== undefined ? Number(record.machineShotAtReplacement) : line.machineShotTotal;
    const removedShot = record.removedPartUsedShot !== undefined ? Number(record.removedPartUsedShot) : (item ? (item.usedShot !== undefined ? item.usedShot : item.currentShot) : 0);
    const removedRegrind = record.removedPartRegrindCount !== undefined ? Number(record.removedPartRegrindCount) : (item ? item.regrindCount : 0);

    const initialStatus = (record.approvalStatus as any) || (user.role === 'OPERATOR' ? 'SUBMITTED' : 'APPROVED');
    const isApprovedOrCompleted = initialStatus === 'APPROVED' || initialStatus === 'COMPLETED';

    const newRecord: ReplacementRecord = {
      id: newId,
      lineId: lineId,
      configurationId: record.configurationId || line.activeConfig?.id,
      configurationSlot: record.configurationSlot || line.activeConfig?.configurationSlot || 'Slot 1',
      dieCode: record.dieCode || line.activeConfig?.dieCode || 'UNKNOWN',
      partCode: record.partCode || (item ? item.partCode : 'UNKNOWN'),
      partName: record.partName || (item ? item.partName : 'Tooling Part'),
      stageName: record.stageName || (item ? item.stagePunchDie : record.partName || 'Tooling Stage'),
      position: record.position || 'ALL',
      replacementType: record.replacementType || 'NEW PART',
      fullSetOrPartial: isPartial ? 'PARTIAL' : 'FULL_SET',
      installedQuantity: installedQty,
      changedQuantity: changedQty,
      machineShotAtReplacement: machineShot,
      removedPartUsedShot: removedShot, // Rule 3: Preserve removed part's final actual shot
      removedPartRegrindCount: removedRegrind,
      newPartLotNumber: record.newPartLotNumber || `LOT-${new Date().getFullYear()}-NP01`,
      newPartSerialNumber: record.newPartSerialNumber || '',
      replacementDateTime: record.replacementDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      replacementReason: record.replacementReason || record.reason || 'Normal Preventive Life Limit Reached',
      workOrderNumber: record.workOrderNumber || `WO-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      changedBy: record.changedBy || user.name,
      changedById: record.changedById || user.employeeId,
      verifiedBy: record.verifiedBy || (user.role !== 'OPERATOR' ? user.name : 'Supervisor'),
      verifiedById: record.verifiedById || (user.role !== 'OPERATOR' ? user.employeeId : 'EMP-SUP'),
      evidenceAttachment: record.evidenceAttachment,
      note: record.note || record.remarks,
      approvalStatus: initialStatus,
      quantityMismatchReason: record.quantityMismatchReason,
      quantityMismatchApprovedBy: record.quantityMismatchApprovedBy,
      positionDetails: record.positionDetails,
      stockUpdated: isApprovedOrCompleted,
      timestamp: new Date().toISOString(),

      // Aliases for compatibility
      replacedQty: changedQty,
      installQtyTotal: installedQty,
      shotAtChange: machineShot,
      shotAtReplacement: machineShot,
      partAccumulatedShots: removedShot,
      lifeLimitShots: item ? item.lifeLimit : 100000000,
      reason: record.replacementReason || record.reason || 'Normal Preventive Life Limit Reached',
      technicianName: record.changedBy || user.name,
      technicianId: record.changedById || user.employeeId,
      approverName: isApprovedOrCompleted ? (record.verifiedBy || user.name) : undefined,
      approverId: isApprovedOrCompleted ? (record.verifiedById || user.employeeId) : undefined,
      replacementDate: record.replacementDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    replacements.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(replacements));

    // Delete draft if one was used
    if (record.draftId) {
      this.deleteReplacementDraft(record.draftId);
    }

    // Apply Live tooling & Stock updates if Approved/Completed
    if (isApprovedOrCompleted) {
      this.applyReplacementToMonitoringAndStock(newRecord);
    }

    // Rule 13: Create an AuditLog entry
    this.addAuditLog(
      'REPLACEMENT',
      `Registered ${newRecord.replacementType} for ${newRecord.partName} (${newRecord.changedQuantity}/${newRecord.installedQuantity} EA, Position: ${newRecord.position}) on Line ${newRecord.lineId}. Status: ${newRecord.approvalStatus}. Machine Shot: ${machineShot.toLocaleString()}, Removed Part Shot: ${removedShot.toLocaleString()}`,
      `บันทึกรายการเปลี่ยนอะไหล่ ${newRecord.partName} (${newRecord.changedQuantity} ชิ้น) สาย ${newRecord.lineId} สถานะ ${newRecord.approvalStatus}`,
      newRecord.lineId
    );

    this.notify();
    return { success: true, record: newRecord };
  }

  public approveReplacement(recordId: string, approverName: string, approverId: string): { success: boolean; error?: string } {
    const replacements = this.getReplacements();
    const idx = replacements.findIndex(r => r.id === recordId);
    if (idx === -1) return { success: false, error: `Replacement record ${recordId} not found` };

    const record = replacements[idx];
    if (record.approvalStatus === 'APPROVED' || record.approvalStatus === 'COMPLETED') {
      return { success: false, error: `Replacement record ${recordId} is already approved/completed` };
    }

    record.approvalStatus = 'COMPLETED';
    record.verifiedBy = approverName;
    record.verifiedById = approverId;
    record.approverName = approverName;
    record.approverId = approverId;
    record.completedAt = new Date().toISOString();
    record.stockUpdated = true;

    replacements[idx] = record;
    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(replacements));

    // Apply tooling reset and stock deduction upon approval
    this.applyReplacementToMonitoringAndStock(record);

    this.addAuditLog(
      'REPLACEMENT',
      `APPROVED Replacement ${record.id} for ${record.partName} on Line ${record.lineId} by ${approverName} (${approverId})`,
      `อนุมัติการเปลี่ยนอะไหล่ ${record.id} สำหรับ ${record.partName} สาย ${record.lineId} โดย ${approverName}`,
      record.lineId
    );

    this.notify();
    return { success: true };
  }

  public rejectReplacement(recordId: string, reason: string): { success: boolean; error?: string } {
    const replacements = this.getReplacements();
    const idx = replacements.findIndex(r => r.id === recordId);
    if (idx === -1) return { success: false, error: `Replacement record ${recordId} not found` };

    replacements[idx].approvalStatus = 'REJECTED';
    replacements[idx].note = `${replacements[idx].note || ''} [REJECTED: ${reason}]`;

    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(replacements));
    this.addAuditLog(
      'REPLACEMENT',
      `REJECTED Replacement ${recordId}: ${reason}`,
      `ปฏิเสธรายการเปลี่ยนอะไหล่ ${recordId}: ${reason}`,
      replacements[idx].lineId
    );

    this.notify();
    return { success: true };
  }

  public cancelReplacement(recordId: string, reason: string): { success: boolean; error?: string } {
    const replacements = this.getReplacements();
    const idx = replacements.findIndex(r => r.id === recordId);
    if (idx === -1) return { success: false, error: `Replacement record ${recordId} not found` };

    replacements[idx].approvalStatus = 'CANCELLED';
    replacements[idx].note = `${replacements[idx].note || ''} [CANCELLED: ${reason}]`;

    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(replacements));
    this.addAuditLog(
      'REPLACEMENT',
      `CANCELLED Replacement ${recordId}: ${reason}`,
      `ยกเลิกรายการเปลี่ยนอะไหล่ ${recordId}: ${reason}`,
      replacements[idx].lineId
    );

    this.notify();
    return { success: true };
  }

  private applyReplacementToMonitoringAndStock(record: ReplacementRecord) {
    const all = this.getLinesMonitoring();
    const line = all[record.lineId];
    const standards = this.getLifeStandards();
    const stocks = this.getSpareStocks();

    if (line) {
      line.items = line.items.map(item => {
        if (item.partCode === record.partCode || (record.stageName && item.stagePunchDie === record.stageName)) {
          // Rule 2 & 6 & 7: Start life from 0 on replacement, update last change shot to machine shot at replacement
          const nextRegrindCount = record.replacementType === 'RE-GROUND PART' ? (item.regrindCount + 1) : 0;
          return calculatePartMetrics(
            {
              slotId: item.slotId,
              partCode: item.partCode,
              partName: item.partName,
              stagePunchDie: item.stagePunchDie,
              position: item.position,
              installQty: item.installQty,
              backupQty: item.backupQty,
              currentShot: 0,
              usedShot: 0,
              lastChangeShot: record.machineShotAtReplacement || line.machineShotTotal,
              shotAtLastChange: record.machineShotAtReplacement || line.machineShotTotal,
              regrindCount: nextRegrindCount,
              totalMmGround: item.totalMmGround || 0
            },
            line.activeConfig,
            standards,
            stocks
          );
        }
        return item;
      });
      all[record.lineId] = line;
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
    }

    // Rule 12: Update warehouse spare stock only after approval / completion
    const stockItem = stocks.find(s => s.partCode === record.partCode);
    if (stockItem) {
      stockItem.currentStockQty = Math.max(0, stockItem.currentStockQty - (record.changedQuantity || record.replacedQty || 1));
      localStorage.setItem(STORAGE_KEYS.SPARE_STOCKS, JSON.stringify(stocks));
    }
  }

  public previewRegrind(record: Partial<RegrindingRecord>) {
    const regrindStandards = this.getRegrindMasterStandards();
    const std = regrindStandards.find(r => r.partCode === record.partCode);

    const prevLength = record.previousLength !== undefined ? Number(record.previousLength) : (std ? std.nominalLengthMm : 50.0);
    const mmRemoved = record.actualGrindingRemovedMm !== undefined ? Number(record.actualGrindingRemovedMm) : (std ? std.grindingAmountPerTimeMm : 0.25);
    const curLength = record.currentLength !== undefined ? Number(record.currentLength) : Math.max(0, prevLength - mmRemoved);
    const regrindBefore = record.regrindCountBefore !== undefined ? Number(record.regrindCountBefore) : 0;
    const regrindAfter = regrindBefore + 1;
    const maxCycles = std ? std.maxRegrindCount : 4;
    const minLength = std ? std.minAllowedLengthMm : 48.0;
    const remainingCount = Math.max(0, maxCycles - regrindAfter);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1 & 2: Block regrinding if not allowed or if dispose after one use
    if (std && !std.regrindAllowed) {
      errors.push(`Rule 1 Error: Part ${std.partName} (${std.partCode}) is NOT allowed to be re-ground.`);
    }
    if (std && std.disposeAfterOneUse) {
      errors.push(`Rule 2 Error: Part ${std.partName} is single-use only (DISPOSE AFTER 1 USE). Regrinding is blocked.`);
    }

    // Rule 3: Max regrind check
    if (regrindAfter > maxCycles) {
      warnings.push(`Rule 3 Warning: Maximum regrind cycles (${maxCycles}) exceeded. Part will transition to MAXIMUM REGRIND / SCRAP.`);
    }

    // Rule 4: Dimensional minimum check
    if (curLength < minLength) {
      warnings.push(`Rule 4 Warning: Current length (${curLength.toFixed(2)} mm) is below minimum allowable limit (${minLength.toFixed(2)} mm). Part is out-of-spec.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      standard: std,
      calculated: {
        previousLength: prevLength,
        currentLength: curLength,
        actualGrindingRemovedMm: mmRemoved,
        regrindCountBefore: regrindBefore,
        regrindCountAfter: regrindAfter,
        remainingRegrindCount: remainingCount,
        minAllowedLengthMm: minLength,
        maxAllowedCycles: maxCycles
      }
    };
  }

  public recordRegrind(record: Partial<RegrindingRecord>): { success: boolean; record?: RegrindingRecord; error?: string } {
    const regrindStandards = this.getRegrindMasterStandards();
    const std = regrindStandards.find(r => r.partCode === record.partCode);
    const user = this.getCurrentUser();

    // Rule 1 & 2: Block if not allowed or single use
    if (std && !std.regrindAllowed) {
      return { success: false, error: `Rule 1 Error: Regrinding is not permitted for ${std.partName} (${std.partCode}).` };
    }
    if (std && std.disposeAfterOneUse) {
      return { success: false, error: `Rule 2 Error: ${std.partName} must be disposed after one use. Regrinding blocked.` };
    }

    const regrinds = this.getRegrindRecords();
    const newId = `RGD-${new Date().getFullYear()}-${String(regrinds.length + 1).padStart(4, '0')}`;
    const prevLength = record.previousLength !== undefined ? Number(record.previousLength) : (std ? std.nominalLengthMm : 50.0);
    const mmRemoved = record.actualGrindingRemovedMm !== undefined ? Number(record.actualGrindingRemovedMm) : (std ? std.grindingAmountPerTimeMm : 0.25);
    const curLength = record.currentLength !== undefined ? Number(record.currentLength) : Math.max(0, prevLength - mmRemoved);
    const regrindBefore = record.regrindCountBefore !== undefined ? Number(record.regrindCountBefore) : 0;
    const regrindAfter = regrindBefore + 1;
    const maxCycles = std ? std.maxRegrindCount : (record.maxAllowedCycles || 4);
    const minLength = std ? std.minAllowedLengthMm : (prevLength - (std ? std.totalGrindingAllowanceMm : 1.0));
    const remainingCount = Math.max(0, maxCycles - regrindAfter);

    const isInspectionPassed = record.inspectionResult === 'PASSED' || record.isInspectionApproved;
    let computedStatus: RegrindPartStatus = record.status || 'WAITING REGRIND';

    if (curLength < minLength) {
      computedStatus = 'SCRAP';
    } else if (regrindAfter >= maxCycles) {
      computedStatus = 'MAXIMUM REGRIND';
    } else if (isInspectionPassed) {
      computedStatus = 'READY TO USE';
    } else {
      computedStatus = 'HOLD';
    }

    const newRecord: RegrindingRecord = {
      id: newId,
      jobCode: record.jobCode || `JOB-RGD-${new Date().getFullYear()}-${String(regrinds.length + 1).padStart(3, '0')}`,
      partInstanceOrLot: record.partInstanceOrLot || record.serialNumber || `SN-${record.partCode || 'TOOL'}-${Date.now().toString().slice(-4)}`,
      partCode: record.partCode || (std ? std.partCode : 'P-TOOL-001'),
      partName: record.partName || (std ? std.partName : 'Tooling Element'),
      serialNumber: record.partInstanceOrLot || record.serialNumber,
      lineId: record.lineId || record.lineLastUsed || 'E6',
      lineLastUsed: record.lineLastUsed || record.lineId || 'E6',
      dieCode: record.dieCode || record.finDie || 'FD-E6-07',
      finDie: record.finDie || record.dieCode || 'FD-E6-07',
      previousLength: prevLength,
      currentLength: curLength,
      actualGrindingRemovedMm: mmRemoved,
      regrindCountBefore: regrindBefore,
      regrindCountAfter: regrindAfter,
      remainingRegrindCount: remainingCount,
      inspectionResult: record.inspectionResult || 'PENDING',
      regrindDate: record.regrindDate || new Date().toISOString().substring(0, 10),
      supplierOrInternalProcess: record.supplierOrInternalProcess || 'INTERNAL_TOOL_ROOM',
      vendorName: record.vendorName || (record.supplierOrInternalProcess === 'EXTERNAL_VENDOR' ? 'External Tooling Specialist' : 'Internal Die Tool Room'),
      workOrder: record.workOrder || `WO-RGD-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
      cost: record.cost !== undefined ? Number(record.cost) : 3500,
      performedBy: record.performedBy || user.name,
      verifiedBy: record.verifiedBy || (isInspectionPassed ? user.name : 'Pending Inspector'),
      evidence: record.evidence,
      note: record.note || record.remarks,
      status: computedStatus,
      isInspectionApproved: isInspectionPassed,
      inspectionApprovedBy: isInspectionPassed ? (record.verifiedBy || user.name) : undefined,
      inspectionApprovedAt: isInspectionPassed ? new Date().toISOString() : undefined,

      // Measurement aliases
      sentDate: record.sentDate || record.regrindDate || new Date().toISOString().substring(0, 10),
      returnedDate: record.returnedDate || record.regrindDate || new Date().toISOString().substring(0, 10),
      grinderVendor: record.vendorName || (record.supplierOrInternalProcess === 'EXTERNAL_VENDOR' ? 'External Tooling Specialist' : 'INTERNAL DIE SHOP'),
      mmRemovedThisCycle: mmRemoved,
      totalAccumulatedMmRemoved: ((std ? std.nominalLengthMm : 50.0) - curLength),
      regrindCycleCount: regrindAfter,
      maxAllowedMm: std ? std.totalGrindingAllowanceMm : 1.0,
      maxAllowedCycles: maxCycles,
      inspectionStatus: record.inspectionResult === 'PASSED' ? 'PASSED' : (record.inspectionResult === 'FAILED' ? 'FAILED_SCRAPPED' : 'PENDING'),
      surfaceRoughnessRa: record.measuredRa || (std ? 0.12 : 0.15),
      hardnessHrc: 63,
      inspectorName: isInspectionPassed ? (record.verifiedBy || user.name) : 'Pending Inspector',
      technicianName: record.performedBy || user.name,
      completionDate: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    // Rule 6 & 7: Preserve every regrind transaction in historical record (never overwrite)
    regrinds.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(regrinds));

    this.addAuditLog(
      'REGRIND',
      `Logged re-grinding job ${newRecord.jobCode} for ${newRecord.partName} (${newRecord.partInstanceOrLot}): Length ${prevLength.toFixed(2)} -> ${curLength.toFixed(2)} mm (-${mmRemoved.toFixed(2)} mm). Cycle ${regrindAfter}/${maxCycles}. Status: ${newRecord.status}`,
      `บันทึกงานเจียระไน ${newRecord.jobCode} สำหรับ ${newRecord.partName} (${newRecord.partInstanceOrLot}) สถานะ ${newRecord.status}`,
      newRecord.lineId
    );

    this.notify();
    return { success: true, record: newRecord };
  }

  public approveRegrindInspection(
    regrindId: string, 
    inspectorName: string, 
    result: 'PASSED' | 'FAILED' | 'CONDITIONAL',
    notes?: string
  ): { success: boolean; error?: string } {
    const regrinds = this.getRegrindRecords();
    const idx = regrinds.findIndex(r => r.id === regrindId);
    if (idx === -1) return { success: false, error: `Regrinding record ${regrindId} not found` };

    const regrind = regrinds[idx];
    regrind.inspectionResult = result;
    regrind.inspectionStatus = result === 'PASSED' ? 'PASSED' : (result === 'FAILED' ? 'FAILED_SCRAPPED' : 'PENDING');
    regrind.isInspectionApproved = result === 'PASSED';
    regrind.inspectionApprovedBy = inspectorName;
    regrind.inspectionApprovedAt = new Date().toISOString();
    regrind.verifiedBy = inspectorName;
    regrind.inspectorName = inspectorName;
    if (notes) regrind.note = `${regrind.note || ''} [INSPECTION: ${notes}]`;

    // Status transition: Rule 5
    if (result === 'PASSED') {
      if ((regrind.currentLength || 0) < 45.0 && regrind.partCode === 'P-BUCK-001') {
        regrind.status = 'SCRAP';
      } else if ((regrind.regrindCountAfter || regrind.regrindCycleCount) >= (regrind.maxAllowedCycles || 4)) {
        regrind.status = 'MAXIMUM REGRIND';
      } else {
        regrind.status = 'READY TO USE';
      }
    } else if (result === 'FAILED') {
      regrind.status = 'SCRAP';
    } else {
      regrind.status = 'HOLD';
    }

    regrinds[idx] = regrind;
    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(regrinds));

    this.addAuditLog(
      'REGRIND',
      `Inspection ${result} for Regrind Job ${regrind.jobCode} (${regrind.partName}) by ${inspectorName}. New status: ${regrind.status}`,
      `ผลตรวจการเจียระไน ${result} สำหรับงาน ${regrind.jobCode} (${regrind.partName}) โดย ${inspectorName}`,
      regrind.lineId
    );

    this.notify();
    return { success: true };
  }

  public updateRegrindStatus(regrindId: string, status: RegrindPartStatus, reason?: string): { success: boolean; error?: string } {
    const regrinds = this.getRegrindRecords();
    const idx = regrinds.findIndex(r => r.id === regrindId);
    if (idx === -1) return { success: false, error: `Regrind record ${regrindId} not found` };

    const oldStatus = regrinds[idx].status;
    regrinds[idx].status = status;
    if (reason) regrinds[idx].note = `${regrinds[idx].note || ''} [STATUS CHANGE ${oldStatus} -> ${status}: ${reason}]`;

    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(regrinds));

    this.addAuditLog(
      'REGRIND',
      `Updated Regrind Job ${regrinds[idx].jobCode} status from ${oldStatus} to ${status}${reason ? ` (Reason: ${reason})` : ''}`,
      `เปลี่ยนสถานะงานเจียระไน ${regrinds[idx].jobCode} จาก ${oldStatus} เป็น ${status}`,
      regrinds[idx].lineId
    );

    this.notify();
    return { success: true };
  }

  public addInspection(record: Omit<ConditionInspectionRecord, 'id'>) {
    const inspections = this.getInspections();
    const newId = `INSP-${Date.now()}`;
    const newRecord: ConditionInspectionRecord = {
      ...record,
      id: newId
    };
    inspections.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));

    this.addAuditLog(
      'SYSTEM',
      `Logged condition inspection on Line ${record.lineId}: Burr ${record.burrHeightMm}mm, Wear Rating ${record.visualWearRating}/5`,
      `บันทึกผลการตรวจสอบสภาพแม่พิมพ์ สาย ${record.lineId}`,
      record.lineId
    );

    this.notify();
  }

  public saveLifeStandard(standard: PartLifeStandard) {
    const standards = this.getLifeStandards();
    const idx = standards.findIndex(s => s.id === standard.id || s.compositeKeyString === standard.compositeKeyString);
    if (idx >= 0) {
      standards[idx] = { ...standard, updatedAt: new Date().toISOString() };
    } else {
      standards.push({
        ...standard,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(STORAGE_KEYS.LIFE_STANDARDS, JSON.stringify(standards));

    this.addAuditLog(
      'STANDARD_CHANGE',
      `Updated Life Standard for ${standard.partName} (${standard.lifeLimitShots.toLocaleString()} shots). Key: ${standard.compositeKeyString}`,
      `อัปเดตเกณฑ์อายุการใช้งานสำหรับ ${standard.partName}`,
      standard.configKey.lineId === 'ALL' ? undefined : (standard.configKey.lineId as ProductionLineId)
    );

    this.notify();
  }

  public saveLineConfig(config: LineActiveConfiguration) {
    const configs = this.getLineConfigs();
    const idx = configs.findIndex(c => c.id === config.id);
    if (idx >= 0) {
      configs[idx] = {
        ...config,
        status: config.status || (config.isActive ? 'ACTIVE' : 'DRAFT')
      };
    } else {
      configs.push({
        ...config,
        status: config.status || (config.isActive ? 'ACTIVE' : 'DRAFT')
      });
    }
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    // If active, update active config in live monitoring
    if (config.isActive) {
      const all = this.getLinesMonitoring();
      if (all[config.lineId]) {
        all[config.lineId].activeConfig = config;
        localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
      }
    }

    this.addAuditLog(
      'CONFIGURATION',
      `Saved tooling configuration ${config.id} (${config.revision || 'Rev 1.0'}) for Line ${config.lineId}: Status ${config.status || 'DRAFT'}, Die ${config.dieCode}, Material ${config.material}`,
      `บันทึกข้อมูลโครงสร้างแม่พิมพ์ ${config.id} สำหรับสายการผลิต ${config.lineId}`,
      config.lineId
    );

    this.notify();
  }

  public updateLineMachineStatus(lineId: ProductionLineId, machineStatus: MachineStatus, isActive?: boolean): void {
    const monitoring = this.getLinesMonitoring();
    if (monitoring[lineId]) {
      monitoring[lineId].machineStatus = machineStatus;
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(monitoring));
    }

    const configs = this.getLineConfigs();
    const configIdx = configs.findIndex(c => c.lineId === lineId);
    if (configIdx >= 0) {
      configs[configIdx].isActive = true;
      configs[configIdx].status = machineStatus === 'RUNNING' ? 'ACTIVE' : 'INACTIVE';
      localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));
    }

    this.addAuditLog(
      'CONFIGURATION',
      `Updated Line ${lineId} operational status to ${machineStatus}`,
      `อัปเดตสถานะการผลิตของสาย ${lineId} เป็น ${machineStatus}`,
      lineId
    );

    this.notify();
  }

  /**
   * Activates a configuration following strict production workflow:
   * 1. Closes previous active configuration installation period at current machine shot.
   * 2. Preserves accumulated part shots for parts physically remaining installed.
   * 3. Pauses accumulation for removed parts.
   * 4. Does NOT reset part shots unless a replacement record is created.
   * 5. Requires reason and approver credentials.
   */
  
  public updateInstallQuantities(updates: Array<{ lineId: string, partCode: string, installQty: number }>): void {
    const configs = this.getLineConfigs();
    let configsChanged = false;

    configs.forEach(config => {
      updates.forEach(u => {
        if (config.lineId === u.lineId) {
          if (!config.installedPartQuantities) {
            config.installedPartQuantities = {};
          }
          config.installedPartQuantities[u.partCode] = u.installQty;
          configsChanged = true;
        }
      });
    });

    if (configsChanged) {
      localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));
    }

    const allMonitoring = this.getLinesMonitoring();
    let monitoringChanged = false;

    Object.keys(allMonitoring).forEach(lId => {
      const lineData = allMonitoring[lId as import('../types').ProductionLineId];
      if (lineData && lineData.activeConfig) {
        updates.forEach(u => {
          if (lineData.lineId === u.lineId) {
            if (!lineData.activeConfig!.installedPartQuantities) {
              lineData.activeConfig!.installedPartQuantities = {};
            }
            lineData.activeConfig!.installedPartQuantities[u.partCode] = u.installQty;
            monitoringChanged = true;
            
            if (lineData.items) {
               lineData.items.forEach(p => {
                 if (p.partCode === u.partCode) {
                    p.installQty = u.installQty;
                 }
               });
            }
          }
        });
      }
    });

    if (monitoringChanged) {
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(allMonitoring));
    }

    this.notify();
  }

  public activateLineConfig(
    configId: string, 
    reason: string, 
    approverName: string,
    effectiveDateTime?: string
  ): { success: boolean; message: string } {
    const configs = this.getLineConfigs();
    const targetConfigIdx = configs.findIndex(c => c.id === configId);
    if (targetConfigIdx === -1) {
      return { success: false, message: `Configuration ${configId} not found.` };
    }

    const targetConfig = configs[targetConfigIdx];
    const lineId = targetConfig.lineId;
    const nowIso = effectiveDateTime || new Date().toISOString();

    const allMonitoring = this.getLinesMonitoring();
    const lineData = allMonitoring[lineId];
    const currentMachineShot = lineData ? lineData.machineShotTotal : 0;

    // 1. Deactivate any previously active configs for this line without deleting them
    configs.forEach((cfg, idx) => {
      if (cfg.lineId === lineId && cfg.id !== configId && cfg.isActive) {
        configs[idx] = {
          ...cfg,
          isActive: false,
          status: 'INACTIVE',
          effectiveTo: nowIso,
          notes: cfg.notes ? `${cfg.notes} (Superseded at shot ${currentMachineShot.toLocaleString()})` : `Superseded by ${configId}`
        };
      }
    });

    // 2. Mark the target configuration as ACTIVE
    const activatedConfig: LineActiveConfiguration = {
      ...targetConfig,
      isActive: true,
      status: 'ACTIVE',
      effectiveFrom: nowIso,
      effectiveTo: undefined,
      reasonForChange: reason,
      approvedBy: approverName,
      approvedAt: nowIso
    };
    configs[targetConfigIdx] = activatedConfig;
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    // 3. Update line live monitoring items:
    // Continue accumulated shots for parts physically remaining installed
    if (lineData) {
      const standards = this.getLifeStandards();
      const stocks = this.getSpareStocks();
      const partMasters = this.getPartMasters();
      const existingItemsMap = new Map(lineData.items.map(item => [item.partCode, item]));

      const newTrackingItems: PartLiveTrackingItem[] = [];
      let slotIndex = 1;

      // For every part configured with install quantity > 0
      const configuredPartCodes = Object.keys(activatedConfig.installedPartQuantities || {});
      
      // If configuredPartCodes is empty, fallback to existing items or standards
      const partCodesToTrack = configuredPartCodes.length > 0
        ? configuredPartCodes.filter(code => (activatedConfig.installedPartQuantities[code] || 0) > 0)
        : lineData.items.map(i => i.partCode);

      partCodesToTrack.forEach(partCode => {
        const qty = activatedConfig.installedPartQuantities?.[partCode] || 1;
        const master = partMasters.find(p => p.partCode === partCode);
        const existing = existingItemsMap.get(partCode);

        // Retain existing accumulated shots if physically remained installed!
        const currentShot = existing ? (existing.usedShot ?? existing.currentShot ?? 0) : 0;
        const lastChangeShot = existing ? (existing.shotAtLastChange ?? existing.lastChangeShot ?? currentMachineShot) : currentMachineShot;
        const regrindCount = existing ? existing.regrindCount : 0;
        const totalMmGround = existing ? existing.totalMmGround : 0;
        const position = existing ? existing.position : 'ALL';

        const updatedItem = calculatePartMetrics(
          {
            slotId: existing ? existing.slotId : `SLOT-${lineId}-${slotIndex++}`,
            partCode,
            partName: master ? master.partName : (existing ? existing.partName : partCode),
            stagePunchDie: master ? master.stageName : (existing ? existing.stagePunchDie : 'Main Tooling'),
            position,
            installQty: qty,
            backupQty: existing ? existing.backupQty : (stocks.find(s => s.partCode === partCode)?.currentStockQty || 0),
            usedShot: currentShot,
            currentShot: currentShot,
            shotAtLastChange: lastChangeShot,
            lastChangeShot: lastChangeShot,
            regrindCount,
            totalMmGround
          },
          activatedConfig,
          standards,
          stocks
        );

        newTrackingItems.push(updatedItem);
      });

      lineData.activeConfig = activatedConfig;
      lineData.items = newTrackingItems;
      lineData.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);
      allMonitoring[lineId] = lineData;
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(allMonitoring));
    }

    this.addAuditLog(
      'CONFIGURATION',
      `Activated configuration ${activatedConfig.id} (${activatedConfig.revision || 'Rev 1.0'}) on Line ${lineId}. Reason: ${reason}. Approved by: ${approverName}. Machine shot: ${currentMachineShot.toLocaleString()}`,
      `เปิดใช้งานคอนฟิกกูเรชัน ${activatedConfig.id} สำหรับสายการผลิต ${lineId} เหตุผล: ${reason}`,
      lineId
    );

    this.notify();
    return { success: true, message: `Configuration ${activatedConfig.id} activated successfully on Line ${lineId}.` };
  }

  public deactivateLineConfig(configId: string, reason: string): { success: boolean; message: string } {
    const configs = this.getLineConfigs();
    const idx = configs.findIndex(c => c.id === configId);
    if (idx === -1) return { success: false, message: 'Configuration not found.' };

    const cfg = configs[idx];
    configs[idx] = {
      ...cfg,
      isActive: false,
      status: 'INACTIVE',
      effectiveTo: new Date().toISOString(),
      notes: reason ? `${cfg.notes || ''} [Deactivated: ${reason}]` : cfg.notes
    };
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    this.addAuditLog(
      'CONFIGURATION',
      `Deactivated configuration ${cfg.id} on Line ${cfg.lineId}. Reason: ${reason || 'Manual deactivation'}`,
      `ปิดการใช้งานคอนฟิก ${cfg.id} สาย ${cfg.lineId}`,
      cfg.lineId
    );

    this.notify();
    return { success: true, message: `Configuration ${cfg.id} deactivated.` };
  }

  public cloneLineConfig(configId: string, customSlotName?: string): LineActiveConfiguration | null {
    const configs = this.getLineConfigs();
    const source = configs.find(c => c.id === configId);
    if (!source) return null;

    const user = this.getCurrentUser();
    const newId = `CFG-${source.lineId}-${Date.now().toString().slice(-4)}-CLONE`;
    const newConfig: LineActiveConfiguration = {
      ...source,
      id: newId,
      configurationSlot: customSlotName || `CLONE of ${source.configurationSlot || source.id}`,
      status: 'DRAFT',
      isActive: false,
      revision: `${source.revision || 'Rev 1.0'}-CLONE`,
      versionNumber: (source.versionNumber || 1) + 1,
      reasonForChange: `Cloned from ${source.id} (${source.revision || 'Rev 1.0'})`,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      effectiveFrom: new Date().toISOString().substring(0, 16),
      effectiveTo: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      installedPartQuantities: { ...source.installedPartQuantities }
    };

    configs.push(newConfig);
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    this.addAuditLog(
      'CONFIGURATION',
      `Cloned configuration ${source.id} into new DRAFT ${newId} on Line ${source.lineId}`,
      `คัดลอกคอนฟิก ${source.id} เป็นฉบับร่างใหม่ ${newId}`,
      source.lineId
    );

    this.notify();
    return newConfig;
  }

  public createLineConfigRevision(configId: string, reason?: string): LineActiveConfiguration | null {
    const configs = this.getLineConfigs();
    const source = configs.find(c => c.id === configId);
    if (!source) return null;

    const user = this.getCurrentUser();
    const nextVer = (source.versionNumber || 1) + 1;
    const newId = `CFG-${source.lineId}-REV${nextVer}-${Date.now().toString().slice(-3)}`;
    const newConfig: LineActiveConfiguration = {
      ...source,
      id: newId,
      configurationSlot: `${source.configurationSlot || 'Production Slot'} (Rev ${nextVer}.0)`,
      status: 'DRAFT',
      isActive: false,
      revision: `Rev ${nextVer}.0`,
      versionNumber: nextVer,
      reasonForChange: reason || `Engineering revision upgraded from ${source.revision || 'Rev 1.0'}`,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      effectiveFrom: new Date().toISOString().substring(0, 16),
      effectiveTo: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      installedPartQuantities: { ...source.installedPartQuantities }
    };

    configs.push(newConfig);
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    this.addAuditLog(
      'CONFIGURATION',
      `Created new Revision ${newConfig.revision} (${newId}) from ${source.id} for Line ${source.lineId}`,
      `สร้าง Revision ใหม่ ${newConfig.revision} สำหรับสาย ${source.lineId}`,
      source.lineId
    );

    this.notify();
    return newConfig;
  }

  public submitConfigForApproval(configId: string): boolean {
    const configs = this.getLineConfigs();
    const idx = configs.findIndex(c => c.id === configId);
    if (idx === -1) return false;

    configs[idx].status = 'PENDING APPROVAL';
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    this.addAuditLog(
      'CONFIGURATION',
      `Submitted configuration ${configId} for approval`,
      `ส่งคอนฟิก ${configId} เพื่อรออนุมัติ`,
      configs[idx].lineId
    );

    this.notify();
    return true;
  }

  public deleteLineConfig(configId: string): { success: boolean; message: string } {
    const configs = this.getLineConfigs();
    const target = configs.find(c => c.id === configId);
    if (!target) return { success: false, message: 'Configuration not found.' };

    if (target.isActive) {
      return { success: false, message: 'Cannot delete an active configuration. Deactivate or switch active configuration first.' };
    }

    const filtered = configs.filter(c => c.id !== configId);
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(filtered));

    this.addAuditLog(
      'CONFIGURATION',
      `Deleted configuration ${configId} from Line ${target.lineId}`,
      `ลบคอนฟิก ${configId} สาย ${target.lineId}`,
      target.lineId
    );

    this.notify();
    return { success: true, message: `Configuration ${configId} removed.` };
  }

  public saveSpareStock(stock: Partial<SpareStockItem> & { id?: string; partCode: string; partName: string }): SpareStockItem {
    const stocks = this.getSpareStocks();
    const existingIdx = stocks.findIndex(s => (stock.id && s.id === stock.id) || s.partCode === stock.partCode);
    const existing = existingIdx >= 0 ? stocks[existingIdx] : null;

    const onHand = stock.onHandQuantity !== undefined ? Number(stock.onHandQuantity) : (existing?.onHandQuantity ?? (stock.currentStockQty ?? 0));
    const reserved = stock.reservedQuantity !== undefined ? Number(stock.reservedQuantity) : (existing?.reservedQuantity ?? 0);
    const quarantine = stock.quarantineQuantity !== undefined ? Number(stock.quarantineQuantity) : (existing?.quarantineQuantity ?? 0);
    const available = Math.max(0, onHand - reserved - quarantine);
    
    const requiredPerFull = stock.requiredQuantityPerFullReplacement !== undefined 
      ? Number(stock.requiredQuantityPerFullReplacement) 
      : (existing?.requiredQuantityPerFullReplacement ?? 1);
    
    const coverage = requiredPerFull > 0 ? Number((available / requiredPerFull).toFixed(2)) : 0;
    
    const minStock = stock.minimumStock !== undefined ? Number(stock.minimumStock) : (existing?.minimumStock ?? (stock.safetyStockMin ?? 10));
    const maxStock = stock.maximumStock !== undefined ? Number(stock.maximumStock) : (existing?.maximumStock ?? (stock.backupTargetQty ?? 50));

    let stockStatus: StockStatus = 'AVAILABLE';
    if (available === 0) stockStatus = 'NO_STOCK';
    else if (available < requiredPerFull) stockStatus = 'LOW_STOCK';
    else if (available <= minStock) stockStatus = 'MINIMUM';
    else stockStatus = 'AVAILABLE';

    // Delivery risk calculation
    const forecastDate = stock.forecastReplacementDate || existing?.forecastReplacementDate;
    const expectedDate = stock.expectedDeliveryDate || existing?.expectedDeliveryDate || stock.poEtaDate;
    let deliveryRiskDays = 0;
    let hasDeliveryRisk = false;

    if (forecastDate && expectedDate) {
      const fTime = new Date(forecastDate).getTime();
      const eTime = new Date(expectedDate).getTime();
      if (!isNaN(fTime) && !isNaN(eTime)) {
        const days = Math.ceil((eTime - fTime) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          deliveryRiskDays = days;
          hasDeliveryRisk = true;
        }
      }
    }

    // Combined risk calculation
    let combinedRisk: CombinedRiskLevel = 'NORMAL';
    if (hasDeliveryRisk) {
      combinedRisk = 'DELIVERY RISK';
    } else if (available === 0) {
      combinedRisk = 'STOP RISK';
    } else if (available < requiredPerFull) {
      combinedRisk = 'CRITICAL SUPPLY';
    } else if (available <= minStock) {
      combinedRisk = 'WARNING';
    } else {
      combinedRisk = 'NORMAL';
    }

    const item: SpareStockItem = {
      id: stock.id || existing?.id || `STK-${Date.now()}`,
      partCode: stock.partCode,
      partName: stock.partName,
      specification: stock.specification || existing?.specification || `${stock.partName} specification standard`,
      warehouseLocation: stock.warehouseLocation || existing?.warehouseLocation || (stock.storageLocation || 'RACK-A-01'),
      onHandQuantity: onHand,
      reservedQuantity: reserved,
      quarantineQuantity: quarantine,
      availableQuantity: available,
      minimumStock: minStock,
      maximumStock: maxStock,
      requiredQuantityPerFullReplacement: requiredPerFull,
      replacementCoverage: coverage,
      stockStatus: stock.stockStatus || stockStatus,
      purchaseRequirementStatus: stock.purchaseRequirementStatus || existing?.purchaseRequirementStatus || (stock.procurementStatus ? `STATUS: ${stock.procurementStatus}` : 'NOT REQUIRED'),
      prNumber: stock.prNumber !== undefined ? stock.prNumber : existing?.prNumber,
      prDate: stock.prDate !== undefined ? stock.prDate : existing?.prDate,
      prApprovalStatus: stock.prApprovalStatus !== undefined ? stock.prApprovalStatus : (existing?.prApprovalStatus || 'N/A'),
      poNumber: stock.poNumber !== undefined ? stock.poNumber : existing?.poNumber,
      poDate: stock.poDate !== undefined ? stock.poDate : existing?.poDate,
      supplier: stock.supplier || existing?.supplier || stock.supplierName || 'MISUMI THAILAND',
      orderedQuantity: stock.orderedQuantity !== undefined ? Number(stock.orderedQuantity) : (existing?.orderedQuantity ?? (stock.onOrderQty ?? 0)),
      confirmedQuantity: stock.confirmedQuantity !== undefined ? Number(stock.confirmedQuantity) : (existing?.confirmedQuantity ?? 0),
      expectedDeliveryDate: expectedDate,
      actualDeliveryDate: stock.actualDeliveryDate !== undefined ? stock.actualDeliveryDate : existing?.actualDeliveryDate,
      procurementStatus: (stock.procurementStatus as ProcurementStatus) || existing?.procurementStatus || 'NOT REQUIRED',
      buyer: stock.buyer || existing?.buyer || 'Thanaporn Srisuk (PUR-01)',
      note: stock.note || existing?.note,
      forecastReplacementDate: forecastDate,
      deliveryRiskDays,
      hasDeliveryRisk,
      combinedRisk,
      stageName: stock.stageName || existing?.stageName,
      tubeSize: stock.tubeSize || existing?.tubeSize || 'Ø7',
      unitCostThb: stock.unitCostThb || existing?.unitCostThb || stock.unitPriceThb || 12000,
      unitPriceThb: stock.unitPriceThb || existing?.unitPriceThb || 12000,
      currentStockQty: available,
      backupTargetQty: maxStock,
      safetyStockMin: minStock,
      safetyStockQty: minStock,
      onOrderQty: stock.orderedQuantity !== undefined ? Number(stock.orderedQuantity) : (existing?.orderedQuantity ?? 0),
      orderStatus: (stock.orderStatus as OrderStatus) || (stock.procurementStatus as any) || 'NOT REQUIRED',
      supplierName: stock.supplier || existing?.supplier || stock.supplierName,
      leadTimeDays: stock.leadTimeDays || existing?.leadTimeDays || 30,
      poEtaDate: expectedDate,
      storageLocation: stock.warehouseLocation || existing?.warehouseLocation || stock.storageLocation || 'RACK-A-01',
      isImportedSeed: existing?.isImportedSeed
    };

    if (existingIdx >= 0) {
      stocks[existingIdx] = item;
    } else {
      stocks.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.SPARE_STOCKS, JSON.stringify(stocks));

    this.logStructuredAudit({
      module: 'SPARE_STOCK',
      recordId: item.id,
      action: existingIdx >= 0 ? 'STOCK_ADJUSTMENT' : 'CREATE',
      fieldChanged: 'onHandQuantity/procurementStatus',
      oldValue: existing ? `${existing.onHandQuantity} EA (Avail: ${existing.availableQuantity}, Status: ${existing.procurementStatus})` : 'NEW',
      newValue: `${item.onHandQuantity} EA (Avail: ${item.availableQuantity}, Coverage: ${item.replacementCoverage}x, Status: ${item.procurementStatus})`,
      reason: stock.note || `Spare Stock & Procurement record update for ${item.partCode}`,
      details: `Saved stock and procurement details for ${item.partCode} (${item.partName}): OnHand=${item.onHandQuantity}, Avail=${item.availableQuantity}, Coverage=${item.replacementCoverage}x, Status=${item.procurementStatus}`,
      detailsTh: `บันทึกข้อมูลสต็อกและการจัดซื้อสำหรับ ${item.partCode} (${item.partName})`,
      actionCategory: 'STOCK'
    });

    this.notify();
    return item;
  }

  // ==========================================
  // POSITION LOCK (ล็อคตำแหน่ง) MANAGEMENT
  // ==========================================

  public getPositionLocks(lineId?: ProductionLineId): PositionLockRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.POSITION_LOCKS);
    let locks: PositionLockRecord[] = raw ? JSON.parse(raw) : [];
    
    if (locks.length === 0) {
      locks = this.initializeDefaultPositionLocks();
      localStorage.setItem(STORAGE_KEYS.POSITION_LOCKS, JSON.stringify(locks));
    }

    if (lineId) {
      return locks.filter(l => l.lineId === lineId);
    }
    return locks;
  }


  private initializeDefaultPositionLocks(): PositionLockRecord[] {
    const lines: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];
    const result: PositionLockRecord[] = [];

    lines.forEach(lineId => {
      let dieCode = `FD-${lineId}-07`;
      if (lineId === 'E2' || lineId === 'E4' || lineId === 'E5') {
        dieCode = `FD-${lineId}-05`;
      }
      const moldType = getMoldTypeForLine(lineId);
      const stages = getStagesForMoldType(moldType);

      stages.forEach(stg => {
        for (let i = 1; i <= stg.positions; i++) {
          const posStr = i < 10 ? `0${i}` : `${i}`;
          
          let lockType: PositionLockStatus = 'UNLOCKED';
          let lockReason = '';
          let lockedBy = '';
          let lockedAt = '';
          let notes = '';
          let isSampleLocked = false;

          // Keep some dummy locked data for testing as before
          if (lineId === 'E6' && stg.stageCode.includes('PRC') && (i === 4 || i === 12)) {
            isSampleLocked = true;
            if (i === 4) {
              lockType = 'LOCKED_MAINTENANCE';
              lockReason = 'Punch tip chipped - Bypassed for regrinding shift 2';
              lockedBy = 'Somchai M. (Tooling Lead)';
              lockedAt = '2026-08-28T14:30:00.000Z';
              notes = 'Slot isolated with dummy blanking pin.';
            } else if (i === 12) {
              lockType = 'LOCKED_TRIAL';
              lockReason = 'Trial PCM 0.10mm coating test position';
              lockedBy = 'Anan K. (Die Specialist)';
              lockedAt = '2026-08-29T08:00:00.000Z';
              notes = 'Counter frozen during sample coil run.';
            }
          } else if (lineId === 'E6' && stg.stageCode.includes('LOUV') && i === 18) {
            isSampleLocked = true;
            lockType = 'LOCKED_BYPASS';
            lockReason = 'Louver blade wear inspection hold';
            lockedBy = 'Kitti S. (Maintenance Tech)';
            lockedAt = '2026-08-29T09:15:00.000Z';
            notes = 'Clearance measured 0.012mm - Needs micro-grind.';
          }

          result.push({
            id: `POS-${lineId}-${stg.stageCode}-${posStr}`,
            lineId,
            dieCode,
            stageCode: stg.stageCode,
            stageName: stg.stageName,
            partCode: stg.partCode,
            partName: stg.partName,
            positionId: `P-${posStr}`,
            positionIndex: i,
            isLocked: isSampleLocked,
            lockType,
            lockReason,
            freezeShotCount: isSampleLocked,
            frozenAtShot: isSampleLocked ? 14200500 + i * 1000 : undefined,
            lockedBy: lockedBy || undefined,
            lockedAt: lockedAt || undefined,
            notes: notes || undefined
          });
        }
      });
    });

    return result;
  }

  public savePositionLock(
    id: string,
    isLocked: boolean,
    lockType: PositionLockStatus,
    lockReason: string,
    notes?: string,
    freezeShotCount: boolean = true
  ): PositionLockRecord {
    const raw = localStorage.getItem(STORAGE_KEYS.POSITION_LOCKS);
    let locks: PositionLockRecord[] = raw ? JSON.parse(raw) : this.initializeDefaultPositionLocks();
    const idx = locks.findIndex(l => l.id === id);
    const currentUser = this.getCurrentUser();

    if (idx < 0) {
      throw new Error(`Position record ${id} not found.`);
    }

    const previous = locks[idx];
    const updated: PositionLockRecord = {
      ...previous,
      isLocked,
      lockType: isLocked ? lockType : 'UNLOCKED',
      lockReason: isLocked ? lockReason : '',
      freezeShotCount: isLocked ? freezeShotCount : false,
      frozenAtShot: isLocked ? (previous.frozenAtShot || 14200500) : undefined,
      lockedBy: isLocked ? currentUser.name : undefined,
      lockedAt: isLocked ? new Date().toISOString() : undefined,
      notes: notes || ''
    };

    locks[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.POSITION_LOCKS, JSON.stringify(locks));

    this.logStructuredAudit({
      module: 'SECURITY',
      recordId: id,
      action: isLocked ? 'LOCK_POSITION' : 'UNLOCK_POSITION',
      fieldChanged: 'isLocked / lockType',
      oldValue: previous.isLocked ? `${previous.lockType} (${previous.lockReason})` : 'UNLOCKED',
      newValue: isLocked ? `${lockType} (${lockReason})` : 'UNLOCKED',
      reason: lockReason || (isLocked ? 'Position locked by technician' : 'Position unlocked & returned to production'),
      details: `${isLocked ? 'Locked' : 'Unlocked'} position ${updated.positionId} (${updated.stageName}, Die: ${updated.dieCode}, Line: ${updated.lineId}). Type: ${lockType}. Notes: ${notes || 'None'}`,
      detailsTh: `${isLocked ? 'ล็อคตำแหน่ง' : 'ปลดล็อคตำแหน่ง'} ${updated.positionId} ในสถานี ${updated.stageName} (Line ${updated.lineId})`,
      actionCategory: 'CONFIGURATION'
    });

    this.notify();
    return updated;
  }

  public batchUpdatePositionLocks(
    ids: string[],
    isLocked: boolean,
    lockType: PositionLockStatus,
    lockReason: string,
    notes?: string
  ): void {
    const raw = localStorage.getItem(STORAGE_KEYS.POSITION_LOCKS);
    let locks: PositionLockRecord[] = raw ? JSON.parse(raw) : this.initializeDefaultPositionLocks();
    const currentUser = this.getCurrentUser();

    locks = locks.map(item => {
      if (ids.includes(item.id)) {
        return {
          ...item,
          isLocked,
          lockType: isLocked ? lockType : 'UNLOCKED',
          lockReason: isLocked ? lockReason : '',
          freezeShotCount: isLocked,
          frozenAtShot: isLocked ? (item.frozenAtShot || 14200500) : undefined,
          lockedBy: isLocked ? currentUser.name : undefined,
          lockedAt: isLocked ? new Date().toISOString() : undefined,
          notes: notes || ''
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEYS.POSITION_LOCKS, JSON.stringify(locks));

    this.logStructuredAudit({
      module: 'SECURITY',
      recordId: `BATCH-${ids.length}-POSITIONS`,
      action: isLocked ? 'BATCH_LOCK_POSITION' : 'BATCH_UNLOCK_POSITION',
      fieldChanged: 'isLocked / lockType',
      oldValue: 'MULTI',
      newValue: isLocked ? `${lockType} (${ids.length} positions)` : `UNLOCKED (${ids.length} positions)`,
      reason: lockReason || `Batch ${isLocked ? 'lock' : 'unlock'} of ${ids.length} die positions`,
      details: `Batch ${isLocked ? 'locked' : 'unlocked'} ${ids.length} positions with type: ${lockType}. Reason: ${lockReason}`,
      detailsTh: `ดำเนินการ${isLocked ? 'ล็อค' : 'ปลดล็อค'}กลุ่มตำแหน่งแม่พิมพ์จำนวน ${ids.length} จุดพร้อมกัน`,
      actionCategory: 'CONFIGURATION'
    });

    this.notify();
  }
}

export const storageService = new StorageService();
