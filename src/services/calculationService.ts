import {
  AlertSeverity,
  LifeStatus,
  StockStatus,
  LifeStandardConfigKey,
  PartLifeStandard,
  PartLiveTrackingItem,
  LineActiveConfiguration,
  ProductionLineId,
  SpareStockItem
} from '../types';

/**
 * Builds the mandatory composite configuration key:
 * Line + Configuration ID + Die Code + Fin Type + Material + Thickness + Tube Size + Part Code + Position + Effective Date
 */
export function generateCompositeKey(key: Partial<LifeStandardConfigKey>): string {
  const line = key.lineId || 'ALL';
  const configId = key.configurationId || 'DEFAULT';
  const dieCode = key.dieCode || 'N/A';
  const finType = key.finType || 'Standard';
  const material = key.material || 'PCM';
  const thickness = key.thicknessMm !== undefined ? `${Number(key.thicknessMm).toFixed(2)}mm` : '0.10mm';
  const tube = key.tubeSize || 'Ø7';
  const part = key.partCode || 'N/A';
  const pos = key.position || 'ALL';
  const date = key.effectiveDate || '2025-01-31';

  return `${line}|${configId}|${dieCode}|${finType}|${material}|${thickness}|${tube}|${part}|${pos}|${date}`;
}

/**
 * Finds matching Part Life Standard using hierarchical configuration key resolution:
 * 1. Exact match on all 10 composite keys
 * 2. Match with lineId = 'ALL' or position = 'ALL'
 * 3. Match with common material and tube size
 */
export function findMatchingLifeStandard(
  standards: PartLifeStandard[],
  activeConfig: LineActiveConfiguration | null,
  partCode: string,
  position: string = 'ALL'
): PartLifeStandard | null {
  if (!activeConfig || !standards || standards.length === 0) {
    return null;
  }

  // 1. Exact Match
  const exact = standards.find(
    s =>
      s.configKey.lineId === activeConfig.lineId &&
      s.configKey.dieCode === activeConfig.dieCode &&
      s.configKey.material.toUpperCase() === activeConfig.material.toUpperCase() &&
      s.configKey.tubeSize === activeConfig.tubeSize &&
      s.configKey.partCode === partCode &&
      (s.configKey.position === position || s.configKey.position === 'ALL')
  );
  if (exact) return exact;

  // 2. Generic line match
  const genericLine = standards.find(
    s =>
      (s.configKey.lineId === 'ALL' || s.configKey.lineId === activeConfig.lineId) &&
      s.configKey.material.toUpperCase() === activeConfig.material.toUpperCase() &&
      s.configKey.tubeSize === activeConfig.tubeSize &&
      s.configKey.partCode === partCode
  );
  if (genericLine) return genericLine;

  // 3. Fallback on partCode + material
  const partMaterialMatch = standards.find(
    s =>
      s.configKey.partCode === partCode &&
      s.configKey.material.toUpperCase() === activeConfig.material.toUpperCase()
  );
  if (partMaterialMatch) return partMaterialMatch;

  // 4. Any standard for this part
  return standards.find(s => s.configKey.partCode === partCode) || null;
}

/**
 * Categorize life status strictly per specified industrial thresholds:
 * - NORMAL: 0% - 69.9% (<70%)
 * - WARNING: 70% - 84.9% (70-84%)
 * - PREPARE: 85% - 94.9% (85-94%)
 * - CRITICAL: 95% - 99.9% (95-99%)
 * - OVER_LIFE: >= 100%
 * - STANDARD_MISSING: missing standard
 * - DATA_ERROR: invalid baseline
 */
export function determineLifeStatus(
  usagePercent: number | null | undefined,
  isStandardMissing: boolean = false,
  isDataError: boolean = false
): LifeStatus {
  if (isDataError) return 'DATA_ERROR';
  if (isStandardMissing || usagePercent === null || usagePercent === undefined || isNaN(usagePercent)) {
    return 'STANDARD_MISSING';
  }
  if (usagePercent >= 100) return 'OVER_LIFE';
  if (usagePercent >= 95) return 'CRITICAL';
  if (usagePercent >= 85) return 'PREPARE';
  if (usagePercent >= 70) return 'WARNING';
  return 'NORMAL';
}

export function determineAlertSeverity(
  usagePercent: number,
  warningTh: number = 70,
  prepareTh: number = 85,
  criticalTh: number = 95
): AlertSeverity {
  return determineLifeStatus(usagePercent);
}

/**
 * Calculate Available Quantity:
 * availableQuantity = onHandQuantity - reservedQuantity - quarantineQuantity
 */
export function calculateAvailableQuantity(
  onHandQuantity: number,
  reservedQuantity: number = 0,
  quarantineQuantity: number = 0
): number {
  return Math.max(0, (onHandQuantity || 0) - (reservedQuantity || 0) - (quarantineQuantity || 0));
}

/**
 * Calculate Replacement Coverage:
 * replacementCoverage = availableQuantity / requiredQuantityPerFullReplacement
 */
export function calculateReplacementCoverage(
  availableQuantity: number,
  requiredQuantityPerFullReplacement: number
): number {
  if (!requiredQuantityPerFullReplacement || requiredQuantityPerFullReplacement <= 0) return 0;
  return Number((availableQuantity / requiredQuantityPerFullReplacement).toFixed(2));
}

/**
 * Calculate Delivery Risk:
 * forecastReplacementDate compared with expectedDeliveryDate.
 * If expected delivery is later than forecast replacement:
 * show DELIVERY RISK and the number of days late.
 */
export function calculateDeliveryRisk(
  forecastReplacementDate?: string,
  expectedDeliveryDate?: string
): { hasDeliveryRisk: boolean; daysLate: number } {
  if (!forecastReplacementDate || !expectedDeliveryDate) {
    return { hasDeliveryRisk: false, daysLate: 0 };
  }

  const forecast = new Date(forecastReplacementDate);
  const delivery = new Date(expectedDeliveryDate);

  if (isNaN(forecast.getTime()) || isNaN(delivery.getTime())) {
    return { hasDeliveryRisk: false, daysLate: 0 };
  }

  const msDiff = delivery.getTime() - forecast.getTime();
  const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

  if (daysDiff > 0) {
    return { hasDeliveryRisk: true, daysLate: daysDiff };
  }

  return { hasDeliveryRisk: false, daysLate: 0 };
}

/**
 * Combine Life and Stock Risk Matrix:
 * - Life normal + Stock normal = NORMAL
 * - Life warning + Stock sufficient = WARNING
 * - Life prepare + Stock insufficient = CRITICAL SUPPLY
 * - Life critical + Stock zero = STOP RISK
 * - PO ETA later than forecast = DELIVERY RISK
 * 
 * Note: Keeps technical part-life calculation and procurement status separate.
 */
export function calculateCombinedRisk(
  lifeStatus: LifeStatus,
  stockStatus: StockStatus,
  hasDeliveryRisk: boolean,
  availableQty: number = 0,
  requiredPerChange: number = 1
): 'NORMAL' | 'WARNING' | 'CRITICAL SUPPLY' | 'STOP RISK' | 'DELIVERY RISK' {
  if (hasDeliveryRisk) {
    return 'DELIVERY RISK';
  }

  const isStockZero = stockStatus === 'NO_STOCK' || availableQty <= 0;
  const isStockInsufficient = isStockZero || stockStatus === 'LOW_STOCK' || availableQty < requiredPerChange;
  const isStockSufficient = !isStockInsufficient;

  if ((lifeStatus === 'CRITICAL' || lifeStatus === 'OVER_LIFE') && isStockZero) {
    return 'STOP RISK';
  }

  if (lifeStatus === 'PREPARE' && isStockInsufficient) {
    return 'CRITICAL SUPPLY';
  }

  if (lifeStatus === 'CRITICAL' || lifeStatus === 'OVER_LIFE') {
    return isStockZero ? 'STOP RISK' : 'CRITICAL SUPPLY';
  }

  if (lifeStatus === 'WARNING') {
    return isStockSufficient ? 'WARNING' : 'CRITICAL SUPPLY';
  }

  if (lifeStatus === 'NORMAL') {
    return isStockSufficient ? 'NORMAL' : 'WARNING';
  }

  return 'NORMAL';
}

/**
 * Determine Spare Stock readiness status:
 * - NO STOCK: availableQty === 0
 * - LOW STOCK: availableQty > 0 && availableQty < requiredQtyPerReplacement (or installQty)
 * - MINIMUM: availableQty >= requiredQtyPerReplacement && availableQty <= minimumStock
 * - AVAILABLE: availableQty > minimumStock
 * - STOCK DATA MISSING: when stockItem is undefined
 */
export function determineStockStatus(
  stockItem: SpareStockItem | undefined,
  installQty: number
): StockStatus {
  if (!stockItem) return 'STOCK_DATA_MISSING';
  const available = stockItem.availableQuantity !== undefined 
    ? stockItem.availableQuantity 
    : (stockItem.currentStockQty ?? 0);
  const minStock = stockItem.minimumStock ?? stockItem.safetyStockMin ?? installQty;
  const requiredQty = stockItem.requiredQuantityPerFullReplacement ?? installQty;

  if (available === 0) return 'NO_STOCK';
  if (available > 0 && available < requiredQty) return 'LOW_STOCK';
  if (available >= requiredQty && available <= minStock) return 'MINIMUM';
  return 'AVAILABLE';
}

/**
 * Calculate full part live tracking metrics with complete data integrity
 */
export function calculatePartMetrics(
  part: {
    slotId: string;
    partCode: string;
    partName: string;
    stagePunchDie: string;
    position: string;
    installQty: number;
    backupQty?: number;
    currentShot?: number;
    usedShot?: number;
    lastChangeShot?: number;
    shotAtLastChange?: number;
    regrindCount?: number;
    totalMmGround?: number;
  },
  activeConfig: LineActiveConfiguration | null,
  standards: PartLifeStandard[],
  stockItems: SpareStockItem[],
  dailyShotRate: number = 500000
): PartLiveTrackingItem {
  const usedShotVal = part.usedShot !== undefined ? part.usedShot : (part.currentShot || 0);
  const shotAtLastChangeVal = part.shotAtLastChange !== undefined ? part.shotAtLastChange : (part.lastChangeShot || 0);

  // Baseline data validation (negative shots or corrupted integers)
  const isDataError = isNaN(usedShotVal) || usedShotVal < 0 || isNaN(shotAtLastChangeVal);

  if (!activeConfig) {
    return {
      slotId: part.slotId,
      partCode: part.partCode,
      partName: part.partName,
      stagePunchDie: part.stagePunchDie,
      position: part.position,
      installQty: part.installQty,
      backupQty: part.backupQty || 0,
      availableSpare: part.backupQty || 0,
      lifeLimit: 0,
      currentShot: usedShotVal,
      usedShot: usedShotVal,
      lastChangeShot: shotAtLastChangeVal,
      shotAtLastChange: shotAtLastChangeVal,
      usagePercent: 0,
      remainingShot: 0,
      regrindCount: part.regrindCount || 0,
      totalMmGround: part.totalMmGround || 0,
      maxRegrindCount: 0,
      regrindSpec: 'CONFIGURATION MISSING',
      lifeStatus: 'STANDARD_MISSING',
      stockStatus: 'STOCK_DATA_MISSING',
      orderStatus: 'NOT REQUIRED',
      alertStatus: 'STANDARD_MISSING',
      configKeyString: 'CONFIGURATION MISSING',
      isConfigMissing: true,
      isDataError
    };
  }

  const standard = findMatchingLifeStandard(standards, activeConfig, part.partCode, part.position);
  const stock = stockItems.find(s => s.partCode === part.partCode);
  const availableSpare = stock ? stock.currentStockQty : (part.backupQty || 0);
  const stockStatus = determineStockStatus(stock, part.installQty);
  const orderStatus = stock ? stock.orderStatus : 'NOT REQUIRED';
  const etaDeliveryDate = stock?.poEtaDate;

  if (!standard || standard.lifeLimitShots <= 0) {
    return {
      slotId: part.slotId,
      partCode: part.partCode,
      partName: part.partName,
      stagePunchDie: part.stagePunchDie,
      position: part.position,
      installQty: part.installQty,
      backupQty: availableSpare,
      availableSpare,
      lifeLimit: 0,
      currentShot: usedShotVal,
      usedShot: usedShotVal,
      lastChangeShot: shotAtLastChangeVal,
      shotAtLastChange: shotAtLastChangeVal,
      usagePercent: 0,
      remainingShot: 0,
      regrindCount: part.regrindCount || 0,
      totalMmGround: part.totalMmGround || 0,
      maxRegrindCount: 0,
      regrindSpec: 'STANDARD MISSING',
      lifeStatus: isDataError ? 'DATA_ERROR' : 'STANDARD_MISSING',
      stockStatus,
      orderStatus,
      alertStatus: isDataError ? 'DATA_ERROR' : 'STANDARD_MISSING',
      configKeyString: generateCompositeKey({
        lineId: activeConfig.lineId,
        configurationId: activeConfig.id,
        dieCode: activeConfig.dieCode,
        finType: activeConfig.finType,
        material: activeConfig.material,
        thicknessMm: activeConfig.thicknessMm,
        tubeSize: activeConfig.tubeSize,
        partCode: part.partCode,
        position: part.position,
        effectiveDate: activeConfig.effectiveFrom
      }),
      isStandardMissing: true,
      isDataError
    };
  }

  const lifeLimit = standard.lifeLimitShots;
  // Central Part Life Calculations:
  // usedShot = accumulated shot during active installation
  // remainingShot = lifeLimit - usedShot
  // usagePercent = (usedShot / lifeLimit) * 100
  const remainingShot = lifeLimit - usedShotVal;
  const usagePercent = Math.round((usedShotVal / lifeLimit) * 100);
  const lifeStatus = determineLifeStatus(usagePercent, false, isDataError);
  const alertStatus = lifeStatus;

  let daysRemainingForecast = 0;
  if (dailyShotRate > 0 && remainingShot > 0) {
    daysRemainingForecast = Math.ceil(remainingShot / dailyShotRate);
  }

  let deliveryRiskDays: number | undefined;
  if (stock && stock.poEtaDate && daysRemainingForecast > 0) {
    const today = new Date();
    const eta = new Date(stock.poEtaDate);
    const msDiff = eta.getTime() - today.getTime();
    const etaDaysFromNow = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (etaDaysFromNow > daysRemainingForecast) {
      deliveryRiskDays = etaDaysFromNow - daysRemainingForecast;
    }
  }

  const regrindSpec = standard.regrindStandard?.disposeAfterUse
    ? 'Dispose after 1 use'
    : `${standard.regrindStandard?.oneTimeRegrindMm || '0.10'} mm (Max ${(Number(standard.regrindStandard?.totalRegrindMm) || 1.5).toFixed(2)} mm)`;

  return {
    slotId: part.slotId,
    partCode: part.partCode,
    partName: standard.partName || part.partName,
    stagePunchDie: standard.stagePunchDie || part.stagePunchDie,
    position: part.position,
    installQty: part.installQty,
    backupQty: availableSpare,
    availableSpare,
    lifeLimit,
    currentShot: usedShotVal,
    usedShot: usedShotVal,
    lastChangeShot: shotAtLastChangeVal,
    shotAtLastChange: shotAtLastChangeVal,
    usagePercent,
    remainingShot,
    regrindCount: part.regrindCount || 0,
    totalMmGround: part.totalMmGround || 0,
    maxRegrindCount: standard.regrindStandard?.maxRegrindCount || 0,
    regrindSpec,
    lifeStatus,
    stockStatus,
    orderStatus,
    alertStatus,
    etaDeliveryDate,
    deliveryRiskDays,
    daysRemainingForecast,
    configKeyString: standard.compositeKeyString,
    isDataError
  };
}

/**
 * Priority sorting for table records:
 * 1. OVER LIFE
 * 2. CRITICAL
 * 3. PREPARE
 * 4. WARNING
 * 5. NORMAL
 * 6. STANDARD MISSING
 * 7. DATA ERROR
 * Secondary sort: usagePercent descending
 */
export function sortTrackingItems(items: PartLiveTrackingItem[]): PartLiveTrackingItem[] {
  const statusRank: Record<LifeStatus, number> = {
    'OVER_LIFE': 1,
    'CRITICAL': 2,
    'PREPARE': 3,
    'WARNING': 4,
    'NORMAL': 5,
    'STANDARD_MISSING': 6,
    'DATA_ERROR': 7
  };

  return [...items].sort((a, b) => {
    const statusA = a.lifeStatus || a.alertStatus || 'NORMAL';
    const statusB = b.lifeStatus || b.alertStatus || 'NORMAL';
    const rankA = statusRank[statusA] ?? 99;
    const rankB = statusRank[statusB] ?? 99;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return (b.usagePercent || 0) - (a.usagePercent || 0);
  });
}

/**
 * Summary card statistics derived dynamically from displayed items
 */
export function calculateSummaryStats(items: PartLiveTrackingItem[]) {
  const totalItems = items.length;
  let normalCount = 0;
  let warningCount = 0;
  let prepareCount = 0;
  let criticalCount = 0;
  let overLifeCount = 0;
  let lowStockCount = 0;
  let deliveryRiskCount = 0;

  for (const item of items) {
    const status = item.lifeStatus || item.alertStatus;
    if (status === 'NORMAL') normalCount++;
    else if (status === 'WARNING') warningCount++;
    else if (status === 'PREPARE') prepareCount++;
    else if (status === 'CRITICAL') criticalCount++;
    else if (status === 'OVER_LIFE') overLifeCount++;

    const stock = item.stockStatus;
    const spare = item.availableSpare ?? item.backupQty;
    if (stock === 'NO_STOCK' || stock === 'LOW_STOCK' || spare < item.installQty) {
      lowStockCount++;
    }

    if ((item.deliveryRiskDays || 0) > 0) {
      deliveryRiskCount++;
    }
  }

  return {
    totalItems,
    normalCount,
    warningCount,
    prepareCount,
    criticalCount,
    overLifeCount,
    lowStockCount,
    deliveryRiskCount
  };
}

/**
 * Generates dynamic Alert Ticker message matching calculated data source
 */
export function generateDynamicAlertTicker(
  items: PartLiveTrackingItem[],
  lineId: ProductionLineId
): string {
  if (!items || items.length === 0) {
    return `LINE ${lineId} - NO ACTIVE TOOLING RECORDS MONITORED`;
  }

  const overLife = items.filter(i => (i.lifeStatus || i.alertStatus) === 'OVER_LIFE');
  if (overLife.length > 0) {
    const top = overLife[0];
    const exceeded = Math.abs(top.remainingShot);
    return `[OVER LIFE] ${top.stagePunchDie || top.partName}: ${top.usagePercent}% | Exceeded by ${formatShots(exceeded)} Shot | URGENT TOOLING REPLACEMENT REQUIRED`;
  }

  const critical = items.filter(i => (i.lifeStatus || i.alertStatus) === 'CRITICAL');
  if (critical.length > 0) {
    const top = critical[0];
    const spare = top.availableSpare ?? top.backupQty;
    if ((top.deliveryRiskDays || 0) > 0) {
      return `[CRITICAL] ${top.stagePunchDie || top.partName}: ${top.usagePercent}% (Remaining ${formatShots(top.remainingShot)} Shot) | Spare Stock ${spare}/${top.installQty} EA | PO ETA ${top.etaDeliveryDate || 'TBD'} (DELIVERY RISK: ${top.deliveryRiskDays} DAYS LATE)`;
    }
    return `[CRITICAL] ${top.stagePunchDie || top.partName}: ${top.usagePercent}% (Remaining ${formatShots(top.remainingShot)} Shot) | Spare Stock ${spare}/${top.installQty} EA | PREPARE TOOLING CHANGEOVER`;
  }

  const prepare = items.filter(i => (i.lifeStatus || i.alertStatus) === 'PREPARE');
  if (prepare.length > 0) {
    const top = prepare[0];
    const spare = top.availableSpare ?? top.backupQty;
    return `[PREPARE] ${top.stagePunchDie || top.partName}: ${top.usagePercent}% (Remaining ${formatShots(top.remainingShot)} Shot) | Spare Stock ${spare}/${top.installQty} EA | SCHEDULE SHIFT CHANGEOVER`;
  }

  const warning = items.filter(i => (i.lifeStatus || i.alertStatus) === 'WARNING');
  if (warning.length > 0) {
    const top = warning[0];
    return `[WARNING] ${top.stagePunchDie || top.partName}: ${top.usagePercent}% (Remaining ${formatShots(top.remainingShot)} Shot) | Routine Inspection Due`;
  }

  return `ALL TOOLING OPERATING WITHIN NOMINAL SHOT SPECIFICATIONS | LINE ${lineId} STATUS: NORMAL`;
}

/**
 * Format numbers with comma separators for clean industrial displays
 */
export function formatShots(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format currency in THB
 */
export function formatThb(num: number): string {
  return `฿${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
