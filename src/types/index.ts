/**
 * Type definitions for Fin Press & Fin Die Spare Parts Shot Control System
 */

export type ProductionLineId = 'E1' | 'E2' | 'E3-1' | 'E3-2' | 'E3-3' | 'E4' | 'E5' | 'E6';

export type AluminumMaterial = 'PCM' | 'GOLD' | 'BARE' | string;
export type FinMaterial = AluminumMaterial;

export type TubeSize = 'Ø5' | 'Ø7' | string;
export type TubeDiameter = TubeSize;

export type FinType = 'Slit (half)' | 'Slit (full)' | 'Lover' | 'Wide +' | 'Standard' | string;

export type MachineStatus = 'RUNNING' | 'IDLE' | 'STOPPED' | 'MAINTENANCE' | 'CHANGEOVER';

export type ShotSignalQuality = 'NORMAL' | 'DEGRADED' | 'DISCONNECTED';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'PREPARE' | 'CRITICAL' | 'OVER_LIFE' | 'STANDARD_MISSING' | 'DATA_ERROR';
export type LifeStatus = AlertSeverity;

export type StockStatus = 'AVAILABLE' | 'MINIMUM' | 'LOW_STOCK' | 'NO_STOCK' | 'STOCK_DATA_MISSING';

export type OrderStatus = 'NOT REQUIRED' | 'PR PREPARING' | 'PO OPEN' | 'ORDERED' | 'ARRIVED';

export type ReplacementType = 
  | 'FULL_SET'
  | 'PARTIAL'
  | 'RE_GROUND'
  | 'EMERGENCY'
  | 'SCRAP'
  | 'PREVENTIVE';

export type UserRole = 
  | 'OPERATOR'
  | 'MAINTENANCE_TECH'
  | 'DIE_SPECIALIST'
  | 'SUPERVISOR'
  | 'ADMIN';

export interface User {
  id: string;
  name: string;
  nameTh?: string;
  email?: string;
  role: UserRole;
  department: string;
  employeeId: string;
}

/**
 * Configuration key parameters for Life Standard:
 * Line + Configuration ID + Die Code + Fin Type + Material + Thickness + Tube Size + Part Code + Position + Effective Date
 */
export interface LifeStandardConfigKey {
  lineId: ProductionLineId | 'ALL';
  configurationId: string;
  dieCode: string;
  finType: FinType;
  material: AluminumMaterial;
  thicknessMm: number; // e.g. 0.10
  tubeSize: TubeSize;
  partCode: string;
  position: string; // e.g. "ALL", "Row 1-4", "Left", "Right", "Slot A"
  effectiveDate: string; // ISO date YYYY-MM-DD
}

export interface RegrindStandard {
  oneTimeRegrindMm: string; // e.g. "0.25-0.35", "0.10", "0.15-0.20"
  totalRegrindMm: number; // e.g. 1.00, 1.50, 1.40
  maxRegrindCount: number; // e.g. 4, 15, 8, 0 (0 = Dispose after 1 use)
  regrindIntervalNote?: string; // e.g. "Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)"
  disposeAfterUse?: boolean;
}

export interface PartLifeStandard {
  id: string;
  configKey: LifeStandardConfigKey;
  compositeKeyString: string;
  partName: string;
  stagePunchDie: string;
  lifeLimitShots: number; // e.g. 18,000,000, 40,000,000, 100,000,000
  regrindStandard: RegrindStandard;
  estimatedCostThb?: number;
  changeIntervalNotes?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isImportedSeed?: boolean;
}

export interface PartMaster {
  partCode: string;
  partName: string;
  partNameTh: string;
  category: 'PUNCH' | 'DIE' | 'BLADE' | 'PIN' | 'CORNER_CUT' | 'CENTER_PUNCH' | 'OTHER';
  stageName: string; // e.g. Bucking, Ironing, Louver, Reflaire, Row Slit, Cut Off, Side Cut, Corner Cut, Feed Pin
  tubeSizeCompat: 'Ø5' | 'Ø7' | 'BOTH';
  drawingNumber: string;
  unit: string;
  unitCostThb: number;
  description?: string;
  isImportedSeed?: boolean;
}

export interface InstalledQuantityRule {
  id: string;
  lineId: ProductionLineId;
  dieCode: string;
  finType: FinType;
  tubeSize: TubeSize;
  partCode: string;
  installedQty: number; // e.g. 204, 180, 118, 90, 82, 34, 33, 29, 4, 2, 1
  isImportedSeed?: boolean;
}

export interface LineActiveConfiguration {
  id: string;
  lineId: ProductionLineId;
  lineName: string;
  dieCode: string;
  dieName: string;
  tubeSize: TubeSize;
  finType: FinType;
  material: AluminumMaterial;
  thicknessMm: number; // default 0.10
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  notes?: string;
  installedPartQuantities: Record<string, number>; // partCode -> qty
}

export interface PartLiveTrackingItem {
  slotId: string;
  partCode: string;
  partName: string;
  stagePunchDie: string;
  position: string;
  installQty: number;
  backupQty: number;
  availableSpare?: number; // Standardized alias for backupQty
  lifeLimit: number; // Total life standard limit shots
  currentShot: number; // Accumulated shots since last change
  usedShot?: number; // Standardized alias for currentShot
  lastChangeShot: number; // Machine shot count at last change
  shotAtLastChange?: number; // Standardized alias for lastChangeShot
  usagePercent: number; // (usedShot / lifeLimit) * 100
  remainingShot: number; // lifeLimit - usedShot
  regrindCount: number;
  totalMmGround: number;
  maxRegrindCount: number;
  regrindSpec: string;
  lifeStatus?: LifeStatus;
  stockStatus?: StockStatus;
  orderStatus: OrderStatus;
  alertStatus: AlertSeverity;
  etaDeliveryDate?: string;
  deliveryRiskDays?: number;
  daysRemainingForecast?: number;
  configKeyString: string;
  isConfigMissing?: boolean;
  isStandardMissing?: boolean;
  isDataError?: boolean;
}

export interface LineLiveMonitoringData {
  lineId: ProductionLineId;
  lineName: string;
  machineStatus: MachineStatus;
  machineShotTotal: number;
  shiftShot: number;
  dailyShot: number;
  monthlyShot: number;
  shotSignal: ShotSignalQuality;
  lastUpdate: string;
  activeConfig: LineActiveConfiguration | null;
  items: PartLiveTrackingItem[];
  alertBanner?: string;
}

export interface ShotEntryRecord {
  id: string;
  lineId: ProductionLineId;
  entryType: 'AUTOMATIC_PLC' | 'MANUAL_SHIFT';
  shotsAdded: number;
  previousTotal: number;
  newTotal: number;
  shift: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)';
  operatorName: string;
  operatorId: string;
  notes?: string;
  timestamp: string;
  isImportedSeed?: boolean;
}

export interface ReplacementRecord {
  id: string;
  lineId: ProductionLineId;
  dieCode?: string;
  partCode: string;
  partName: string;
  stageName: string;
  position?: string;
  replacementType: ReplacementType;
  replacedQty: number;
  installQtyTotal?: number;
  shotAtChange?: number;
  shotAtReplacement?: number;
  partAccumulatedShots?: number;
  lifeLimitShots?: number;
  lifeLimitAtReplacement?: number;
  reason: string;
  reasonTh?: string;
  oldPartAction?: 'SEND_TO_REGRIND' | 'SCRAP' | 'INSPECT' | 'STANDBY';
  technicianName?: string;
  technicianId?: string;
  operatorName?: string;
  operatorId?: string;
  approverName?: string;
  approverId?: string;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  replacementDate?: string;
  timestamp?: string;
  burrHeightAtChange?: number;
  positionNotes?: string;
  regrindCycleCount?: number;
  remarks?: string;
  isImportedSeed?: boolean;
}

export interface RegrindingRecord {
  id: string;
  jobCode: string;
  partCode: string;
  partName: string;
  serialNumber?: string;
  lineId: ProductionLineId;
  dieCode?: string;
  sentDate?: string;
  returnedDate?: string;
  grinderVendor?: string;
  grindingVendor?: string;
  mmRemovedThisCycle: number; // e.g. 0.25
  totalAccumulatedMmRemoved?: number; // e.g. 0.75
  totalMmRemovedAccumulated?: number;
  regrindCycleCount: number; // e.g. 2 of 4
  maxAllowedMm?: number; // e.g. 1.00
  maxAllowedCycles: number; // e.g. 4
  inspectionStatus?: 'PENDING' | 'PASSED' | 'FAILED_SCRAPPED';
  surfaceRoughnessRa?: number;
  hardnessHrc?: number;
  measuredHardness?: string;
  measuredRa?: number;
  inspectorName?: string;
  technicianName?: string;
  completionDate?: string;
  isScrappedAfterRegrind?: boolean;
  notes?: string;
  remarks?: string;
}

export interface ConditionInspectionRecord {
  id: string;
  lineId: ProductionLineId;
  dieCode?: string;
  stageName?: string;
  inspectionDate?: string;
  timestamp?: string;
  shift?: string;
  inspectorName: string;
  inspectorId?: string;
  visualWearRating: number; // 1=New, 5=Severe Wear
  burrHeightMm: number; // e.g. 0.03 mm
  clearanceStatus?: 'NORMAL' | 'SLIGHT_GAP' | 'MISALIGNED';
  lubricationStatus?: 'GOOD' | 'INSUFFICIENT' | 'EXCESSIVE';
  aluminumStickingGalling?: boolean;
  chippingObserved?: boolean;
  inspectionVerdict?: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL_REPAIR_REQUIRED';
  recommendedAction?: string;
  overallCondition?: 'NORMAL' | 'NEEDS_CLEANING' | 'NEEDS_REGRIND' | 'EMERGENCY_CHANGE';
  actionTaken?: string;
  notes?: string;
}

export interface SpareStockItem {
  id: string;
  partCode: string;
  partName: string;
  stageName?: string;
  tubeSize?: TubeSize;
  currentStockQty: number; // e.g. 50
  backupTargetQty: number; // e.g. 168
  safetyStockMin?: number; // e.g. 30
  safetyStockQty?: number;
  onOrderQty?: number; // e.g. 118
  prNumber?: string;
  poNumber?: string;
  orderStatus: OrderStatus;
  supplier?: string;
  supplierName?: string;
  leadTimeDays?: number;
  poEtaDate?: string;
  unitPriceThb?: number;
  storageLocation?: string;
  isImportedSeed?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionCategory: 'CONFIGURATION' | 'STANDARD_CHANGE' | 'SHOT_ADJUSTMENT' | 'REPLACEMENT' | 'REGRIND' | 'APPROVAL' | 'SYSTEM';
  details: string;
  detailsTh?: string;
  lineId?: ProductionLineId;
  oldValue?: string;
  newValue?: string;
}

export interface SystemSettings {
  language: 'EN' | 'TH' | 'DUAL';
  warningThresholdPercent: number; // 70
  prepareThresholdPercent: number; // 85
  criticalThresholdPercent: number; // 95
  autoShotPulseIntervalSec: number; // 3
  autoPulseIncrement: number; // 25
  shift1Start: string; // "08:00"
  shift2Start: string; // "20:00"
  theme: 'dark' | 'industrial-dark';
  enableSoundAlerts: boolean;
  tvAutoCycleIntervalSec: number; // 15
}
