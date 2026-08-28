import {
  LineLiveMonitoringData,
  LineActiveConfiguration,
  PartLifeStandard,
  PartMaster,
  InstalledQuantityRule,
  SpareStockItem,
  ReplacementRecord,
  RegrindingRecord,
  ConditionInspectionRecord,
  ShotEntryRecord,
  AuditLogEntry,
  User,
  SystemSettings,
  ProductionLineId,
  UserRole
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
  REGRINDS: 'fin_press_regrinds',
  INSPECTIONS: 'fin_press_inspections',
  SHOT_LOGS: 'fin_press_shot_logs',
  AUDIT_LOGS: 'fin_press_audit_logs',
  SETTINGS: 'fin_press_settings',
  SEED_INITIALIZED: 'fin_press_seed_init_v4'
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
    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(INITIAL_REGRIND_RECORDS));
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

  public getLineConfigs(): LineActiveConfiguration[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LINE_CONFIGS) || '[]');
  }

  public getLifeStandards(): PartLifeStandard[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LIFE_STANDARDS) || '[]');
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

  public getRegrindRecords(): RegrindingRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REGRINDS) || '[]');
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

  // --- Mutators ---

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
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      actionCategory: category,
      details,
      detailsTh,
      lineId
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
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

  public recordReplacement(record: Omit<ReplacementRecord, 'id' | 'approvalStatus' | 'approverName' | 'approverId'>): ReplacementRecord {
    const user = this.getCurrentUser();
    const replacements = this.getReplacements();
    const newId = `REP-${new Date().getFullYear()}-${String(replacements.length + 1).padStart(4, '0')}`;

    const newRecord: ReplacementRecord = {
      ...record,
      id: newId,
      approvalStatus: user.role === 'OPERATOR' ? 'PENDING' : 'APPROVED',
      approverName: user.role !== 'OPERATOR' ? user.name : undefined,
      approverId: user.role !== 'OPERATOR' ? user.employeeId : undefined
    };

    replacements.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REPLACEMENTS, JSON.stringify(replacements));

    // Reset part shots in Line Monitoring
    const all = this.getLinesMonitoring();
    const line = all[record.lineId];
    if (line) {
      line.items = line.items.map(item => {
        if (item.partCode === record.partCode || item.stagePunchDie === record.stageName) {
          return {
            ...item,
            currentShot: 0,
            lastChangeShot: line.machineShotTotal,
            usagePercent: 0,
            remainingShot: item.lifeLimit,
            alertStatus: 'NORMAL',
            regrindCount: record.replacementType === 'RE_GROUND' ? item.regrindCount + 1 : 0
          };
        }
        return item;
      });
      all[record.lineId] = line;
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
    }

    // Deduct stock if replacement was from warehouse
    const stocks = this.getSpareStocks();
    const stockItem = stocks.find(s => s.partCode === record.partCode);
    if (stockItem) {
      stockItem.currentStockQty = Math.max(0, stockItem.currentStockQty - record.replacedQty);
      localStorage.setItem(STORAGE_KEYS.SPARE_STOCKS, JSON.stringify(stocks));
    }

    this.addAuditLog(
      'REPLACEMENT',
      `Performed ${record.replacementType} replacement for ${record.partName} (${record.replacedQty} EA) on Line ${record.lineId}`,
      `ดำเนินการเปลี่ยนอะไหล่ ${record.partName} (${record.replacedQty} ชิ้น) ประเภท ${record.replacementType} บนสาย ${record.lineId}`,
      record.lineId
    );

    this.notify();
    return newRecord;
  }

  public recordRegrind(record: Omit<RegrindingRecord, 'id'>) {
    const regrinds = this.getRegrindRecords();
    const newId = `RGD-${new Date().getFullYear()}-${String(regrinds.length + 1).padStart(4, '0')}`;
    const newRecord: RegrindingRecord = {
      ...record,
      id: newId
    };

    regrinds.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.REGRINDS, JSON.stringify(regrinds));

    this.addAuditLog(
      'REGRIND',
      `Logged re-grinding job ${record.jobCode} for ${record.partName} (-${record.mmRemovedThisCycle}mm, Cycle ${record.regrindCycleCount}/${record.maxAllowedCycles})`,
      `บันทึกประวัติการเจียระไนลับคม ${record.jobCode} สำหรับ ${record.partName}`,
      record.lineId
    );

    this.notify();
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
      configs[idx] = config;
    } else {
      configs.push(config);
    }
    localStorage.setItem(STORAGE_KEYS.LINE_CONFIGS, JSON.stringify(configs));

    // Update active config in live monitoring
    const all = this.getLinesMonitoring();
    if (all[config.lineId]) {
      all[config.lineId].activeConfig = config;
      localStorage.setItem(STORAGE_KEYS.LINE_MONITORING, JSON.stringify(all));
    }

    this.addAuditLog(
      'CONFIGURATION',
      `Updated tooling config for Line ${config.lineId}: Die ${config.dieCode}, Material ${config.material}, Tube ${config.tubeSize}, Thickness ${config.thicknessMm}mm`,
      `อัปเดตโครงสร้างแม่พิมพ์สำหรับสายการผลิต ${config.lineId}`,
      config.lineId
    );

    this.notify();
  }

  public savePartMaster(part: PartMaster) {
    const parts = this.getPartMasters();
    const idx = parts.findIndex(p => p.partCode === part.partCode);
    if (idx >= 0) {
      parts[idx] = part;
    } else {
      parts.push(part);
    }
    localStorage.setItem(STORAGE_KEYS.PART_MASTERS, JSON.stringify(parts));
    this.addAuditLog('SYSTEM', `Saved Part Master: ${part.partCode} (${part.partName})`);
    this.notify();
  }

  public saveSpareStock(stock: SpareStockItem) {
    const stocks = this.getSpareStocks();
    const idx = stocks.findIndex(s => s.id === stock.id || s.partCode === stock.partCode);
    if (idx >= 0) {
      stocks[idx] = stock;
    } else {
      stocks.push(stock);
    }
    localStorage.setItem(STORAGE_KEYS.SPARE_STOCKS, JSON.stringify(stocks));
    this.addAuditLog('SYSTEM', `Updated Spare Stock/Procurement for ${stock.partName}: Status ${stock.orderStatus}, Stock ${stock.currentStockQty}/${stock.backupTargetQty}`);
    this.notify();
  }
}

export const storageService = new StorageService();
