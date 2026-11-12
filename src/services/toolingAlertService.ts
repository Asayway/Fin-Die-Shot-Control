import { ProductionLineId, PartLiveTrackingItem } from '../types';
import { storageService } from './storageService';
import { formatShots } from './calculationService';

export interface ToolingLifeAlert {
  id: string; // unique key e.g. "ALERT-E1-E1-DP01"
  lineId: ProductionLineId;
  lineLabel: string;
  partCode: string;
  partName: string;
  stageName: string;
  currentShots: number;
  lifeLimit: number;
  usagePercent: number; // e.g. 91.5
  remainingShots: number;
  spareStockQty: number;
  stockStatus: string;
  severity: 'WARNING_90' | 'CRITICAL_95' | 'OVER_LIFE_100';
  detectedAt: number;
  isCurrentLine: boolean;
}

const STORAGE_KEY_DISMISSED = 'findie_tv_dismissed_alerts_v1';
const STORAGE_KEY_SNOOZED = 'findie_tv_snoozed_alerts_v1';

class ToolingAlertService {
  private listeners: Array<(alerts: ToolingLifeAlert[]) => void> = [];
  private lastAlertTimestamp: number = 0;
  private soundEnabled: boolean = true;

  constructor() {
    try {
      const settings = storageService.getSettings();
      this.soundEnabled = settings?.enableSoundAlerts ?? true;
    } catch {
      this.soundEnabled = true;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public getDismissedAlertIds(): Record<string, number> {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_DISMISSED);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public dismissAlert(alertId: string): void {
    const map = this.getDismissedAlertIds();
    map[alertId] = Date.now();
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(map));
    } catch {
      // ignore
    }
    this.notify();
  }

  public snoozeAlert(alertId: string, minutes: number = 10): void {
    const map = this.getDismissedAlertIds();
    // Record expiry timestamp
    map[alertId] = Date.now() + minutes * 60 * 1000;
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(map));
    } catch {
      // ignore
    }
    this.notify();
  }

  public clearDismissed(): void {
    sessionStorage.removeItem(STORAGE_KEY_DISMISSED);
    this.notify();
  }

  /**
   * Evaluates all tooling across either the currently active line or all configured lines.
   * A tool triggers an alert when current shots reach 90% or more of its designated life limit.
   */
  public checkToolingAlerts(
    currentLineId?: ProductionLineId,
    currentLineItems?: PartLiveTrackingItem[]
  ): ToolingLifeAlert[] {
    const dismissed = this.getDismissedAlertIds();
    const now = Date.now();
    const alerts: ToolingLifeAlert[] = [];
    const seenKeys = new Set<string>();

    const evaluateItem = (
      item: PartLiveTrackingItem,
      lineId: ProductionLineId,
      isCurrent: boolean
    ) => {
      if (!item || !item.lifeLimit || item.lifeLimit <= 0) return;

      const usedShot = item.usedShot !== undefined ? item.usedShot : (item.currentShot || 0);
      const lifeLimit = item.lifeLimit;
      const rawPercent = (usedShot / lifeLimit) * 100;
      const usagePercent = parseFloat(rawPercent.toFixed(1));

      // Threshold check: 90% or higher of designated life limit
      if (usagePercent < 90.0) return;

      const partKey = (item.partCode || item.slotId || item.stagePunchDie || 'tool').trim();
      const alertId = `ALERT-${lineId}-${partKey}`;

      if (seenKeys.has(alertId)) return;
      seenKeys.add(alertId);

      // Check if snoozed / dismissed
      const dismissedUntil = dismissed[alertId];
      if (dismissedUntil) {
        // If dismissed within the last 15 minutes or until snooze expiry
        if (now < dismissedUntil) {
          return;
        }
      }

      let severity: 'WARNING_90' | 'CRITICAL_95' | 'OVER_LIFE_100' = 'WARNING_90';
      if (usagePercent >= 100.0) {
        severity = 'OVER_LIFE_100';
      } else if (usagePercent >= 95.0) {
        severity = 'CRITICAL_95';
      }

      const lineLabel = this.formatLineLabel(lineId);
      const remainingShots = lifeLimit - usedShot;
      const spareQty = item.availableSpare !== undefined ? item.availableSpare : (item.backupQty || 0);

      alerts.push({
        id: alertId,
        lineId,
        lineLabel,
        partCode: item.partCode || partKey,
        partName: item.partName || item.stagePunchDie || 'Die Component',
        stageName: item.stagePunchDie || item.partName || 'Die Stage',
        currentShots: usedShot,
        lifeLimit,
        usagePercent,
        remainingShots,
        spareStockQty: spareQty,
        stockStatus: item.stockStatus || (spareQty > 0 ? 'AVAILABLE' : 'NO_STOCK'),
        severity,
        detectedAt: now,
        isCurrentLine: isCurrent
      });
    };

    // 1. First evaluate currently displayed line items if provided
    if (currentLineId && currentLineItems && currentLineItems.length > 0) {
      currentLineItems.forEach(item => evaluateItem(item, currentLineId, true));
    }

    // 2. Also inspect all lines monitoring data from storage to catch plant-wide 90% alerts
    try {
      const allMonitoring = storageService.getLinesMonitoring();
      if (allMonitoring && typeof allMonitoring === 'object') {
        const lineKeys: ProductionLineId[] = ['E1', 'E2', 'E3 SLIT', 'E3 WL+', 'E3 New Cor', 'E4', 'E5'];
        lineKeys.forEach(lId => {
          if (lId === currentLineId && currentLineItems && currentLineItems.length > 0) {
            // Already checked with live recalculated items
            return;
          }
          const m = allMonitoring[lId];
          if (m && Array.isArray(m.items)) {
            m.items.forEach(item => evaluateItem(item, lId, false));
          }
        });
      }
    } catch (e) {
      console.warn('Error reading plant-wide monitoring for tooling alerts:', e);
    }

    // Sort alerts: Over life first, then critical (>=95%), then warning (>=90%), highest percent first
    alerts.sort((a, b) => b.usagePercent - a.usagePercent);

    return alerts;
  }

  public formatLineLabel(lineId: ProductionLineId): string {
    if (lineId === 'E1') return 'LINE E1 (HE1 Ø7)';
    if (lineId === 'E2') return 'LINE E2 (HE2 Ø5)';
    if (lineId === 'E3 SLIT') return 'LINE E3 SLIT (3P)';
    if (lineId === 'E3 WL+') return 'LINE E3 WL+ (4P)';
    if (lineId === 'E3 New Cor') return 'LINE E3 New Cor (4P)';
    if (lineId === 'E4') return 'LINE E4 (HE4 Ø5)';
    if (lineId === 'E5') return 'LINE E5 (HE5 Ø5)';
    return `LINE ${lineId}`;
  }

  /**
   * Subtle industrial two-tone warning chime using Web Audio API
   */
  public playAlertSound(): void {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Tone 1: High crisp alert chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Harmonic reinforcement
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1479.98, now + 0.3); // F#6
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch {
      // Audio playback might be deferred by browser policy before first user interaction
    }
  }

  public subscribe(listener: (alerts: ToolingLifeAlert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const alerts = this.checkToolingAlerts();
    this.listeners.forEach(l => l(alerts));
  }
}

export const toolingAlertService = new ToolingAlertService();
