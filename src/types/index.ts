/**
 * Type definitions for Fin Press & Fin Die Spare Parts Shot Control System
 */

export type ProductionLineId = 'E1' | 'E2' | 'E3-1' | 'E3-2' | 'E3-3' | 'E4' | 'E5' | 'E6';

export interface LineInfoDetails {
  id: ProductionLineId;
  name: string;
  nameTh: string;
  shortTag: string;
  tubeSize: TubeSize;
  finType: string;
  description: string;
}

export const LINE_INFO_MAP: Record<ProductionLineId, LineInfoDetails> = {
  'E1': {
    id: 'E1',
    name: 'LINE E1',
    nameTh: 'ไลน์ E1 (Ø7 Slit)',
    shortTag: 'Ø7 Slit',
    tubeSize: 'Ø7',
    finType: 'Slit (half)',
    description: 'Condenser Ø7 PCM Slit'
  },
  'E2': {
    id: 'E2',
    name: 'LINE E2',
    nameTh: 'ไลน์ E2 (Ø5 Slit)',
    shortTag: 'Ø5 Slit',
    tubeSize: 'Ø5',
    finType: 'Slit (half)',
    description: 'Micro-groove Ø5 Gold Slit'
  },
  'E3-1': {
    id: 'E3-1',
    name: 'LINE E3',
    nameTh: 'ไลน์ E3 (Slit 3P)',
    shortTag: 'Slit 3P',
    tubeSize: 'Ø7',
    finType: 'Slit 3-Pass',
    description: 'Evaporator Ø7 PCM Slit 3P'
  },
  'E3-2': {
    id: 'E3-2',
    name: 'LINE E3',
    nameTh: 'ไลน์ E3 (WL+ 4P)',
    shortTag: 'WL+ 4P',
    tubeSize: 'Ø7',
    finType: 'Wavy Louver 4P',
    description: 'Evaporator Ø7 Wavy Louver 4P'
  },
  'E3-3': {
    id: 'E3-3',
    name: 'LINE E3',
    nameTh: 'ไลน์ E3 (Corr 4P)',
    shortTag: 'Corr 4P',
    tubeSize: 'Ø7',
    finType: 'Corrugate 4P',
    description: 'Evaporator Ø7 Corrugate 4P'
  },
  'E4': {
    id: 'E4',
    name: 'LINE E4',
    nameTh: 'ไลน์ E4 (Ø5 Slit)',
    shortTag: 'Ø5 Slit',
    tubeSize: 'Ø5',
    finType: 'Slit (half)',
    description: 'High Speed Ø5 Bare Slit'
  },
  'E5': {
    id: 'E5',
    name: 'LINE E5',
    nameTh: 'ไลน์ E5 (Ø5 Slit)',
    shortTag: 'Ø5 Slit',
    tubeSize: 'Ø5',
    finType: 'Slit (half)',
    description: 'High Speed Ø5 Gold Slit'
  },
  'E6': {
    id: 'E6',
    name: 'LINE E6',
    nameTh: 'ไลน์ E6 (Ø7 Louver)',
    shortTag: 'Ø7 Louver',
    tubeSize: 'Ø7',
    finType: 'Lover',
    description: 'Heavy Duty Ø7 PCM Louver'
  }
};

export type AluminumMaterial = 'PCM' | 'GOLD' | 'BARE' | string;
export type FinMaterial = 'PCM' | 'GOLD' | 'BARE' | string;

export type TubeSize = 'Ø5' | 'Ø7' | string;
export type TubeDiameter = TubeSize;

export type FinType = 
  | 'Slit Old' 
  | 'Slit (half)' 
  | 'New Slit' 
  | 'Slit (Full)' 
  | 'Louver' 
  | 'Wide Louver' 
  | 'New Corrugate' 
  | 'Corrugate' 
  | string;

export type PitchOption = '3P (Pitch)' | '4P (Pitch)' | string;

export type MachineStatus = 'RUNNING' | 'IDLE' | 'STOPPED' | 'MAINTENANCE' | 'CHANGEOVER';

export type ShotSignalQuality = 'NORMAL' | 'DEGRADED' | 'DISCONNECTED';

export type AlertSeverity = 'NORMAL' | 'WARNING' | 'PREPARE' | 'CRITICAL' | 'OVER_LIFE' | 'STANDARD_MISSING' | 'DATA_ERROR';
export type LifeStatus = AlertSeverity;

export type StockStatus = 'AVAILABLE' | 'MINIMUM' | 'LOW_STOCK' | 'NO_STOCK' | 'STOCK_DATA_MISSING';

export type OrderStatus = 'NOT REQUIRED' | 'PR PREPARING' | 'PO OPEN' | 'ORDERED' | 'ARRIVED';

export type ReplacementType = 
  | 'NEW PART'
  | 'RE-GROUND PART'
  | 'PARTIAL REPLACEMENT'
  | 'FULL SET REPLACEMENT'
  | 'EMERGENCY REPLACEMENT'
  | 'SCRAP'
  | 'INSPECTION REPLACEMENT'
  | 'FULL_SET'
  | 'PARTIAL'
  | 'RE_GROUND'
  | 'EMERGENCY'
  | 'PREVENTIVE';

export type ReplacementScope = 'FULL_SET' | 'PARTIAL';

export type ReplacementApprovalStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'COMPLETED' 
  | 'CANCELLED'
  | 'PENDING'; // Backward compatibility

export interface PositionReplacementDetail {
  positionName: string;
  isReplaced: boolean;
  previousUsedShot: number;
  newStartingShot: number;
  partSerialOrLot?: string;
  notes?: string;
}

export type RegrindPartStatus = 
  | 'NEW'
  | 'IN USE'
  | 'WAITING REGRIND'
  | 'REGRINDING'
  | 'READY TO USE'
  | 'HOLD'
  | 'MAXIMUM REGRIND'
  | 'SCRAP';

export interface RegrindMasterStandard {
  id?: string;
  partCode: string;
  partName: string;
  stagePunchDie?: string;
  nominalLengthMm: number; // e.g. 45.00 mm
  grindingAmountPerTimeMm: number; // e.g. 0.10 or 0.25 mm
  grindMinMm?: number;
  grindMaxMm?: number;
  totalGrindingAllowanceMm: number; // e.g. 1.00 or 1.50 mm
  minAllowedLengthMm: number; // nominalLengthMm - totalGrindingAllowanceMm
  maxRegrindCount: number; // e.g. 4, 8, 15
  regrindMinCount?: number;
  regrindMaxCount?: number;
  regrindAllowed: boolean; // true/false
  disposeAfterOneUse: boolean; // true/false
  maintenancePolicy?: string;
  changeIntervalMinDays?: number;
  changeIntervalMaxDays?: number;
  maxUseCount?: number;
  inspectionRequirements: string;
  notes?: string;
}

export type UserRole = 
  | 'VIEWER'
  | 'OPERATOR'
  | 'LINE_LEADER'
  | 'MAINTENANCE'
  | 'TOOLING_ADMIN'
  | 'WAREHOUSE'
  | 'PURCHASING'
  | 'ENGINEERING'
  | 'APPROVER'
  | 'SYSTEM_ADMIN'
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'DIE_SPECIALIST'
  | 'MAINTENANCE_TECH';

export interface RolePermissions {
  canViewTvAndReports: boolean;
  canAddShotEntries: boolean;
  canSubmitConditionChecks: boolean;
  canReviewShotEntries: boolean;
  canSubmitShotCorrections: boolean;
  canConfirmLineConfig: boolean;
  canCreateReplacements: boolean;
  canCreateInspections: boolean;
  canViewLifeStandards: boolean;
  canMaintainPartMaster: boolean;
  canMaintainRegrindStandards: boolean;
  canManagePartPositionAndDieConfig: boolean;
  canManageStockAndMovements: boolean;
  canManageProcurement: boolean;
  canCreateLifeStandardRevisions: boolean;
  canAnalyzeLifeTrends: boolean;
  canApproveStandardChanges: boolean;
  canApproveCounterResets: boolean;
  canApproveOverLifeUsage: boolean;
  canApproveReplacementCorrections: boolean;
  canManageUsersAndRoles: boolean;
  canAdministerSystem: boolean;
}

export interface User {
  id: string;
  name: string;
  nameTh?: string;
  email?: string;
  role: UserRole;
  department: string;
  employeeId: string;
  password?: string;
  lastLogin?: string;
  isActive?: boolean;
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
  grindMinMm?: number;
  grindMaxMm?: number;
  totalRegrindMm: number; // e.g. 1.00, 1.50, 1.40
  maxRegrindCount: number; // e.g. 4, 15, 8, 0 (0 = Dispose after 1 use)
  regrindMinCount?: number;
  regrindMaxCount?: number;
  maxTotalGrindingLimit?: number; // unit: mm (Max depth allowable e.g. 3.00, 1.50)
  regrindDepthPerTime?: number; // unit: mm (Grind depth per cycle e.g. 0.20)
  standardShimThickness?: number; // unit: mm (Standard shim compensation e.g. 0.20)
  regrindIntervalNote?: string; // e.g. "Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)"
  disposeAfterUse?: boolean;
  maintenancePolicy?: string; // "DISPOSE_AFTER_ONE_USE" | "PERIODIC_REPLACEMENT" | "SHOT_AND_REGRINDING_CONTROL"
  changeIntervalMinDays?: number;
  changeIntervalMaxDays?: number;
  maxUseCount?: number;
}

export interface PartLifeStandard {
  id: string;
  configKey: LifeStandardConfigKey;
  compositeKeyString: string;
  partName: string;
  stagePunchDie: string;
  lifeLimitShots: number; // e.g. 18,000,000, 40,000,000, 100,000,000
  regrindStandard: RegrindStandard;
  maxTotalGrindingLimit?: number; // unit: mm (Direct parameter on part standard)
  regrindDepthPerTime?: number; // unit: mm (Direct parameter on part standard)
  standardShimThickness?: number; // unit: mm (Direct parameter on part standard)
  estimatedCostThb?: number;
  changeIntervalNotes?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isImportedSeed?: boolean;
}

export type TubeSizeCompat = 'Ø5' | 'Ø7' | 'BOTH';

export interface PartMaster {
  partCode: string;
  partName: string;
  partNameTh: string;
  category: 'PUNCH' | 'DIE' | 'BLADE' | 'PIN' | 'CORNER_CUT' | 'CENTER_PUNCH' | 'OTHER';
  stageName: string; // e.g. Bucking, Ironing, Louver, Reflaire, Row Slit, Cut Off, Side Cut, Corner Cut, Feed Pin
  tubeSizeCompat: TubeSizeCompat;
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

export type ConfigurationStatus = 
  | 'DRAFT' 
  | 'PENDING APPROVAL' 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'EXPIRED' 
  | 'CONFIGURATION ERROR';

export interface LineActiveConfiguration {
  id: string;
  lineId: ProductionLineId;
  lineName: string;
  configurationSlot?: string; // e.g. "SLOT-01", "Slot 1 - Primary Production"
  machineId?: string; // Machine identifier e.g. "PRESS-E6 (OAK FP-100)"
  mainFinDie?: string; // Main Fin Die name
  dieCode: string;
  dieName: string;
  tubeSize: TubeSize;
  rowsCount?: number; // Number of Rows
  columnsCount?: number; // Columns
  pathsCount?: number | string; // Number of Paths e.g. 4 or "4P"
  finType: FinType;
  material: AluminumMaterial;
  thicknessMm: number; // default 0.10
  effectiveFrom: string; // Effective Date and Time
  effectiveTo?: string;
  status?: ConfigurationStatus;
  isActive: boolean;
  defaultSpm?: number;
  reasonForChange?: string;
  revision?: string; // e.g. "Rev 1.0", "Rev 1.1", "Rev 2.0"
  versionNumber?: number;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt?: string;
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
  controlType?: 'CONTROLLED_BY_SHOT' | 'NOT_CONTROLLED_BY_SHOT' | 'TIME_BASED';
  isPaused?: boolean;
  isRemoved?: boolean;
  isActive?: boolean;
  installationStatus?: 'ACTIVE' | 'PAUSED' | 'REMOVED' | 'STANDBY';
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

export type ShotInputMethod = 'METER_READING' | 'DIRECT_INCREMENT';
export type ShotEntryStatus = 'SUBMITTED' | 'DRAFT' | 'REVERSED' | 'CORRECTION' | 'COUNTER_RESET';

export interface ShotSplitPeriod {
  configId: string;
  dieCode: string;
  configurationSlot?: string;
  shotsAdded: number;
  timeInterval?: string;
  reason?: string;
}

export interface ShotEntryRecord {
  id: string;
  lineId: ProductionLineId;
  configurationId?: string;
  configurationSlot?: string;
  dieCode?: string;
  productionDate?: string; // YYYY-MM-DD
  shift: 'Shift 1 (Day)' | 'Shift 2 (Night)' | 'Shift 3 (Overtime)';
  inputMethod?: ShotInputMethod;
  entryType: 'AUTOMATIC_PLC' | 'MANUAL_SHIFT' | 'COUNTER_RESET' | 'CORRECTION';
  shotsAdded: number;
  previousTotal: number;
  newTotal: number;
  entryReason?: string;
  notes?: string;
  operatorName: string;
  operatorId: string;
  timestamp: string;
  status?: ShotEntryStatus;
  isCounterReset?: boolean;
  resetApprovalId?: string;
  resetApprovedBy?: string;
  resetReason?: string;
  isCorrection?: boolean;
  correctedFromId?: string;
  correctionReason?: string;
  reversalOfId?: string;
  splitPeriods?: ShotSplitPeriod[];
  affectedPartsCount?: number;
  excludedPartsCount?: number;
  allowMultiEntry?: boolean;
  isImportedSeed?: boolean;
}

export interface ReplacementRecord {
  id: string;
  lineId: ProductionLineId;
  configurationId?: string;
  configurationSlot?: string;
  dieCode?: string;
  partCode: string;
  partName: string;
  stageName?: string;
  position: string; // Position numbers / description e.g. "Row 1-4, Pos #1-24" or "ALL"
  replacementType: ReplacementType;
  fullSetOrPartial?: ReplacementScope;
  installedQuantity: number;
  changedQuantity: number;
  machineShotAtReplacement: number;
  removedPartUsedShot: number;
  removedPartRegrindCount: number;
  newPartLotNumber: string;
  newPartSerialNumber?: string;
  replacementDateTime: string;
  replacementReason: string;
  workOrderNumber: string;
  changedBy: string;
  changedById?: string;
  verifiedBy: string;
  verifiedById?: string;
  evidenceAttachment?: string;
  note?: string;
  approvalStatus: ReplacementApprovalStatus;
  quantityMismatchReason?: string;
  quantityMismatchApprovedBy?: string;
  positionDetails?: PositionReplacementDetail[];
  recalculatedLifeLimit?: number;
  stockUpdated?: boolean;
  completedAt?: string;
  timestamp: string;

  // Backward compatibility aliases
  replacedQty?: number;
  installQtyTotal?: number;
  shotAtChange?: number;
  shotAtReplacement?: number;
  partAccumulatedShots?: number;
  lifeLimitShots?: number;
  lifeLimitAtReplacement?: number;
  reason?: string;
  reasonTh?: string;
  oldPartAction?: 'SEND_TO_REGRIND' | 'SCRAP' | 'INSPECT' | 'STANDBY';
  technicianName?: string;
  technicianId?: string;
  operatorName?: string;
  operatorId?: string;
  approverName?: string;
  approverId?: string;
  replacementDate?: string;
  burrHeightAtChange?: number;
  positionNotes?: string;
  regrindCycleCount?: number;
  remarks?: string;
  isImportedSeed?: boolean;
}

export interface RegrindingRecord {
  id: string;
  jobCode: string;
  partInstanceOrLot?: string;
  partCode: string;
  partName: string;
  serialNumber?: string;
  lineId: ProductionLineId;
  lineLastUsed?: ProductionLineId;
  dieCode?: string;
  finDie?: string;
  previousLength?: number; // in mm
  currentLength?: number; // in mm
  actualGrindingRemovedMm?: number;
  regrindCountBefore?: number;
  regrindCountAfter?: number;
  remainingRegrindCount?: number;
  inspectionResult?: 'PENDING' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  regrindDate?: string;
  supplierOrInternalProcess?: 'INTERNAL_TOOL_ROOM' | 'EXTERNAL_VENDOR' | string;
  vendorName?: string;
  workOrder?: string;
  cost?: number; // THB
  performedBy?: string;
  verifiedBy?: string;
  evidence?: string;
  note?: string;
  status?: RegrindPartStatus;
  isInspectionApproved?: boolean;
  inspectionApprovedBy?: string;
  inspectionApprovedAt?: string;

  // Measurement fields
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
  timestamp?: string;
  isImportedSeed?: boolean;
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

export type ProcurementStatus = 
  | 'NOT REQUIRED'
  | 'REQUIREMENT IDENTIFIED'
  | 'PR PREPARING'
  | 'PR SUBMITTED'
  | 'PR APPROVED'
  | 'PO PROCESS'
  | 'PO ISSUED'
  | 'SUPPLIER CONFIRMED'
  | 'IN PRODUCTION'
  | 'IN TRANSIT'
  | 'PARTIAL DELIVERY'
  | 'DELIVERED'
  | 'OVERDUE'
  | 'CANCELLED';

export type CombinedRiskLevel = 
  | 'NORMAL'
  | 'WARNING'
  | 'CRITICAL SUPPLY'
  | 'STOP RISK'
  | 'DELIVERY RISK';

export interface SpareStockItem {
  id: string;
  partCode: string;
  partName: string;
  specification: string;
  warehouseLocation: string; // e.g. "RACK-B-04"
  onHandQuantity: number;
  reservedQuantity: number;
  quarantineQuantity: number;
  availableQuantity: number; // onHand - reserved - quarantine
  minimumStock: number;
  maximumStock: number;
  requiredQuantityPerFullReplacement: number; // requiredQtyPerFullReplacement
  replacementCoverage: number; // availableQuantity / requiredQuantityPerFullReplacement
  stockStatus: StockStatus;

  // Required Procurement fields
  purchaseRequirementStatus: string;
  prNumber?: string;
  prDate?: string;
  prApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'N/A' | string;
  poNumber?: string;
  poDate?: string;
  supplier: string;
  orderedQuantity: number;
  confirmedQuantity: number;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  procurementStatus: ProcurementStatus;
  buyer: string;
  note?: string;

  // Calculations and Risk Analysis
  forecastReplacementDate?: string;
  deliveryRiskDays?: number; // Days late if expectedDeliveryDate > forecastReplacementDate
  hasDeliveryRisk?: boolean;
  combinedRisk?: CombinedRiskLevel;

  // Technical Compatibility & Legacy Aliases
  stageName?: string;
  tubeSize?: TubeSize;
  unitCostThb?: number;
  unitPriceThb?: number;
  currentStockQty?: number; // legacy alias for onHandQuantity/availableQuantity
  backupTargetQty?: number; // legacy alias for maximumStock
  safetyStockMin?: number; // legacy alias for minimumStock
  safetyStockQty?: number; // legacy alias
  onOrderQty?: number; // legacy alias for orderedQuantity
  orderStatus?: OrderStatus; // legacy alias
  supplierName?: string; // legacy alias for supplier
  leadTimeDays?: number;
  poEtaDate?: string; // legacy alias for expectedDeliveryDate
  storageLocation?: string; // legacy alias for warehouseLocation
  isImportedSeed?: boolean;
}

export type AuditActionType =
  | 'SHOT_CORRECTION'
  | 'COUNTER_RESET'
  | 'STANDARD_LIFE_CHANGE'
  | 'INSTALL_QUANTITY_CHANGE'
  | 'MATERIAL_CHANGE'
  | 'FIN_DIE_CHANGE'
  | 'CONFIGURATION_ACTIVATION'
  | 'REPLACEMENT_CANCELLATION'
  | 'REGRIND_MODIFICATION'
  | 'STOCK_ADJUSTMENT'
  | 'PR_PO_STATUS_CHANGE'
  | 'USER_ROLE_CHANGE'
  | 'CREATE'
  | 'UPDATE'
  | 'APPROVE'
  | 'REJECT'
  | 'REVERSAL'
  | 'ACCESS_DENIED';

export type AuditModuleType =
  | 'SHOT_ENTRY'
  | 'REPLACEMENT'
  | 'REGRINDING'
  | 'SPARE_STOCK'
  | 'PROCUREMENT'
  | 'LIFE_STANDARD'
  | 'LINE_CONFIG'
  | 'PART_MASTER'
  | 'USER_MANAGEMENT'
  | 'SECURITY'
  | 'SYSTEM';

export interface AuditLogEntry {
  id: string;
  auditId?: string; // e.g. "AUD-2026-001"
  module: AuditModuleType;
  recordId: string;
  action: AuditActionType | string;
  fieldChanged: string; // e.g. "onHandQuantity", "lifeLimitShots", "procurementStatus", "role"
  oldValue: string | number | boolean | null | undefined;
  newValue: string | number | boolean | null | undefined;
  reason: string; // Mandatory for all sensitive changes
  user: string; // User Name e.g. "Somchai Prasert (EMP-1001)"
  userId?: string;
  userName?: string;
  role: UserRole;
  userRole?: UserRole;
  dateTime: string; // ISO 8601 String
  timestamp: string; // ISO 8601 String
  approvalRequestId?: string;
  ipReference?: string; // IP or session reference e.g. "192.168.1.104"
  sessionReference?: string; // e.g. "SES-49102"
  details?: string;
  detailsTh?: string;
  lineId?: ProductionLineId;
  actionCategory?: 'CONFIGURATION' | 'STANDARD_CHANGE' | 'SHOT_ADJUSTMENT' | 'REPLACEMENT' | 'REGRIND' | 'APPROVAL' | 'SYSTEM' | 'STOCK' | 'PROCUREMENT';
}

export type AppTheme = 'dark' | 'light' | 'hmi' | 'industrial-dark';

export type PLCConnectionMode = 'SIMULATION' | 'WEBSOCKET_MQTT' | 'REST_POLLING' | 'MODBUS_TCP';

export type PLCProtocol = 
  | 'MODBUS_TCP' 
  | 'SIEMENS_S7' 
  | 'OPC_UA' 
  | 'OMRON_ETHERNET' 
  | 'FIN_PLC_NATIVE' 
  | 'WEBSOCKET_MQTT' 
  | 'REST_API';

export type PLCConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR';

export interface PLCLineRegisterMap {
  lineId: string;
  lineName?: string;
  address: string;
  active: boolean;
  currentVal: number;
  lastPulse: string;
}

export interface PLCConfig {
  connectionMode: PLCConnectionMode;
  protocol: PLCProtocol;
  ip: string;
  port: number;
  slaveId: number;
  pollingIntervalMs: number;
  wsUrl: string;
  restApiUrl: string;
  uiThrottleMs: number;
  isAutoPolling: boolean;
  lineRegisters: Record<string, PLCLineRegisterMap>;
}

export interface SystemSettings {
  language: 'EN' | 'TH' | 'KO' | 'DUAL';
  warningThresholdPercent: number; // 70
  prepareThresholdPercent: number; // 85
  criticalThresholdPercent: number; // 95
  autoShotPulseIntervalSec: number; // 3
  autoPulseIncrement: number; // 25
  maxShotsPerShift: number; // 150000 (Abnormal detection threshold)
  allowMultiEntryPerShift: boolean; // default false
  shift1Start: string; // "08:00"
  shift2Start: string; // "20:00"
  theme: AppTheme;
  enableSoundAlerts: boolean;
  tvAutoCycleIntervalSec: number; // 15
}

export type PositionLockStatus = 
  | 'UNLOCKED' 
  | 'LOCKED_MAINTENANCE' 
  | 'LOCKED_BYPASS' 
  | 'LOCKED_TRIAL' 
  | 'LOCKED_CALIBRATION' 
  | 'LOCKED_HOLD';

export interface PositionLockRecord {
  id: string;
  lineId: ProductionLineId;
  dieCode: string;
  stageCode: string;
  stageName: string;
  partCode: string;
  partName: string;
  positionId: string; // e.g. "P-01", "ROW-1", "LEFT-04", etc.
  positionIndex: number;
  isLocked: boolean;
  lockType: PositionLockStatus;
  lockReason: string;
  freezeShotCount: boolean; // whether counter is frozen for this position
  frozenAtShot?: number;
  lockedBy?: string;
  lockedAt?: string;
  notes?: string;
}

export type DowntimeCategory = 
  | 'UNPLANNED_DOWN' 
  | 'SCHEDULED_MAINTENANCE' 
  | 'DIE_CHANGEOVER' 
  | 'TOOLING_REPAIR' 
  | 'QUALITY_HOLD' 
  | 'OTHER';

export interface DowntimeLogEntry {
  id: string;
  lineId: ProductionLineId;
  startTime: string; // ISO string
  endTime?: string; // ISO string or undefined if ongoing
  durationMinutes: number; // calculated duration in minutes
  category: DowntimeCategory;
  reason: string;
  reasonTh?: string;
  operatorOrTech?: string;
  isResolved: boolean;
  notes?: string;
}

export interface DowntimeSummaryByLine {
  lineId: ProductionLineId;
  lineName: string;
  totalDowntimeMinutes: number;
  totalDowntimeHours: number;
  eventCount: number;
  uptimePercent: number;
  unplannedHours: number;
  maintenanceHours: number;
  changeoverHours: number;
  lastIncident?: DowntimeLogEntry;
}

export interface Downtime30DayReport {
  startDate: string;
  endDate: string;
  totalFactoryDowntimeHours: number;
  averageLineDowntimeHours: number;
  factoryUptimePercent: number;
  bottleneckLineId: ProductionLineId;
  lineSummaries: Record<ProductionLineId, DowntimeSummaryByLine>;
}


