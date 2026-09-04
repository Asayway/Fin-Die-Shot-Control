import { MoldDieMasterItem } from '../types';

/**
 * List spare parts Mold & Die Heat exchanger part TH, classified by Stage
 * Standard Engineering Master Revision: 31.01.2025
 * Total 157 Standard Tooling Items across 17 Operational Stages
 */
export const MOLD_DIE_MASTER_ITEMS_2025: MoldDieMasterItem[] = [
  // 1-5: PIERCE & BURRING
  {
    no: 1,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE PUNCH (Ø5)',
    drawingNo: 'DWG-PB-001',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 15, e3_1_pcm: 1.5, e3_2_gold: 15, e3_3_gold: 15, e4_bare: 15, e5_bare: 15, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.40', regrindCycles: '12-13 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 2,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE PUNCH (Ø7)',
    drawingNo: 'DWG-PB-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 15, e3_1_pcm: 1.5, e3_2_gold: 15, e3_3_gold: 15, e4_bare: 15, e5_bare: 15, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.40', regrindCycles: '12-13 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 3,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH (Ø5)',
    drawingNo: 'DWG-PB-003',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 15, e3_1_pcm: 1.5, e3_2_gold: 15, e3_3_gold: 15, e4_bare: 15, e5_bare: 15, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.50', regrindCycles: '7-9 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 4,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH (Ø7)',
    drawingNo: 'DWG-PB-004',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 15, e3_1_pcm: 1.5, e3_2_gold: 15, e3_3_gold: 15, e4_bare: 15, e5_bare: 15, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.50', regrindCycles: '7-9 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 5,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING (WIDE LOWER)',
    drawingNo: 'DWG-PB-005',
    installQty: { e3_3: 168, totalQty: 168 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 15, e3_1_pcm: 1.5, e3_2_gold: 15, e3_3_gold: 15, e4_bare: 15, e5_bare: 15, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.50', regrindCycles: '7-9 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },

  // 6-9: IRONING
  {
    no: 6,
    stage: 'IRONING',
    partName: 'IRONING PUNCH (Ø5)',
    drawingNo: 'DWG-IR-001',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 7,
    stage: 'IRONING',
    partName: 'IRONING DIE (Ø5)',
    drawingNo: 'DWG-IR-002',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 8,
    stage: 'IRONING',
    partName: 'IRONING PUNCH (Ø7)',
    drawingNo: 'DWG-IR-003',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 9,
    stage: 'IRONING',
    partName: 'IRONING DIE (Ø7)',
    drawingNo: 'DWG-IR-004',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },

  // 10-11: LOUVER
  {
    no: 10,
    stage: 'LOUVER',
    partName: 'LOUVER PUNCH (U)',
    drawingNo: 'DWG-LV-001',
    installQty: { e3_2: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 11,
    stage: 'LOUVER',
    partName: 'LOUVER PUNCH (L)',
    drawingNo: 'DWG-LV-002',
    installQty: { e3_2: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 100, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },

  // 12-14: REFLARE
  {
    no: 12,
    stage: 'REFLARE',
    partName: 'REFLARE PUNCH 5mm',
    drawingNo: 'DWG-RF-001',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 80, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 80, e5_bare: 80, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 13,
    stage: 'REFLARE',
    partName: 'REFLARE PUNCH 7mm',
    drawingNo: 'DWG-RF-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 80, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 80, e5_bare: 80, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 14,
    stage: 'REFLARE',
    partName: 'REFLARE DIE',
    drawingNo: 'DWG-RF-003',
    installQty: { e1: 180, e2: 204, e3_1: 180, e4: 198, e5: 198, e6: 138, totalQty: 1098 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 80, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 80, e5_bare: 80, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },

  // 15-25: SLIT
  {
    no: 15,
    stage: 'SLIT',
    partName: 'SLIT PUNCH (Ø5)',
    drawingNo: 'DWG-SL-001',
    installQty: { e2: 204, e4: 198, e5: 198, totalQty: 600 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 16,
    stage: 'SLIT',
    partName: 'SLIT DIE A (Ø5) 3Row',
    drawingNo: 'DWG-SL-002',
    installQty: { e2: 10, e4: 10, e5: 10, totalQty: 30 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 17,
    stage: 'SLIT',
    partName: 'SLIT DIE A (Ø5) 4Row',
    drawingNo: 'DWG-SL-003',
    installQty: { e2: 1, e4: 1, e5: 1, totalQty: 3 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 18,
    stage: 'SLIT',
    partName: 'SLIT DIE B (Ø5) 3Row',
    drawingNo: 'DWG-SL-004',
    installQty: { e2: 10, e4: 10, e5: 10, totalQty: 30 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 19,
    stage: 'SLIT',
    partName: 'SLIT DIE B (Ø5) 4Row',
    drawingNo: 'DWG-SL-005',
    installQty: { e2: 1, e4: 1, e5: 1, totalQty: 3 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 20,
    stage: 'SLIT',
    partName: 'SLIT PUNCH A (Ø7) (Old)',
    drawingNo: 'DWG-SL-006',
    installQty: { e3_1: 90, e6: 69, totalQty: 159 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 21,
    stage: 'SLIT',
    partName: 'SLIT PUNCH B (Ø7) (Old)',
    drawingNo: 'DWG-SL-007',
    installQty: { e3_1: 90, e6: 69, totalQty: 159 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 22,
    stage: 'SLIT',
    partName: 'SLIT DIE UPPER (Ø7) (Old)',
    drawingNo: 'DWG-SL-008',
    installQty: { e3_1: 15, e6: 12, totalQty: 27 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 23,
    stage: 'SLIT',
    partName: 'SLIT DIE DOWN (Ø7) (Old)',
    drawingNo: 'DWG-SL-009',
    installQty: { e3_1: 15, e6: 12, totalQty: 27 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 24,
    stage: 'SLIT',
    partName: 'SLIT PUNCH NEW SLIT (Ø7)',
    drawingNo: 'DWG-SL-010',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18, partsSpec: 25.75, lowerSpecScrapLimit: 24.75 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },
  {
    no: 25,
    stage: 'SLIT',
    partName: 'SLIT DIE NEW SLIT (Ø7)',
    drawingNo: 'DWG-SL-011',
    installQty: { e1: 15, e3_1: 15, e6: 12, totalQty: 42 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18, partsSpec: 10.00, lowerSpecScrapLimit: 9.00 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.00', regrindCycles: '3-4 time', note: '-' }
  },

  // 26-27: WIDE LOWER
  {
    no: 26,
    stage: 'WIDE LOWER',
    partName: 'LOUVER PUNCH (WIDE LOWER) UP',
    drawingNo: 'DWG-WL-001',
    installQty: { e3_3: 168, totalQty: 168 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 80, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 80, e5_bare: 80, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 27,
    stage: 'WIDE LOWER',
    partName: 'LOUVER PUNCH (WIDE LOWER) DOWN',
    drawingNo: 'DWG-WL-002',
    installQty: { e3_3: 168, totalQty: 168 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 80, e3_1_pcm: 50, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 80, e5_bare: 80, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },

  // 28-31: ROW SLIT
  {
    no: 28,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø7)',
    drawingNo: 'DWG-RS-001',
    installQty: { e1: 118, e3_1: 118, e6: 90, totalQty: 326 },
    shotLifeCycle: { e1_pcm: 1, e2_gold: 2, e3_1_pcm: 1, e3_2_gold: 2, e3_3_gold: 2, e4_bare: 2, e5_bare: 2, e6_pcm: 1 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 29,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø5) A',
    drawingNo: 'DWG-RS-002',
    installQty: { e2: 34, e4: 33, e5: 33, totalQty: 100 },
    shotLifeCycle: { e1_pcm: 1, e2_gold: 2, e3_1_pcm: 1, e3_2_gold: 2, e3_3_gold: 2, e4_bare: 2, e5_bare: 2, e6_pcm: 1 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 30,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø5) B',
    drawingNo: 'DWG-RS-003',
    installQty: { e2: 33, e4: 32, e5: 32, totalQty: 97 },
    shotLifeCycle: { e1_pcm: 1, e2_gold: 2, e3_1_pcm: 1, e3_2_gold: 2, e3_3_gold: 2, e4_bare: 2, e5_bare: 2, e6_pcm: 1 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 31,
    stage: 'ROW SLIT',
    partName: 'ROW SLID BLADE (WIDE LOWER) 4P',
    drawingNo: 'DWG-RS-004',
    installQty: { e3_3: 82, totalQty: 82 },
    shotLifeCycle: { e1_pcm: 1, e2_gold: 2, e3_1_pcm: 1, e3_2_gold: 2, e3_3_gold: 2, e4_bare: 2, e5_bare: 2, e6_pcm: 1 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },

  // 32-37: CUT OFF
  {
    no: 32,
    stage: 'CUT OFF',
    partName: 'CUT OFF PUNCH (WIDE LOWER)',
    drawingNo: 'DWG-CO-001',
    installQty: { e3_3: 4, totalQty: 4 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 33,
    stage: 'CUT OFF',
    partName: 'CUT OFF DIE (WIDE LOWER)',
    drawingNo: 'DWG-CO-002',
    installQty: { e3_3: 4, totalQty: 4 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 34,
    stage: 'CUT OFF',
    partName: 'CUT OFF PUNCH (Ø5)',
    drawingNo: 'DWG-CO-003',
    installQty: { e2: 4, e4: 4, e5: 4, totalQty: 12 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 35,
    stage: 'CUT OFF',
    partName: 'CUT OFF PUNCH (Ø7)',
    drawingNo: 'DWG-CO-004',
    installQty: { e1: 4, e3_1: 4, e6: 3, totalQty: 11 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 36,
    stage: 'CUT OFF',
    partName: 'CUT OFF DIE (Ø5)',
    drawingNo: 'DWG-CO-005',
    installQty: { e2: 4, e4: 4, e5: 4, totalQty: 12 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 37,
    stage: 'CUT OFF',
    partName: 'CUT OFF DIE (Ø7)',
    drawingNo: 'DWG-CO-006',
    installQty: { e1: 4, e3_1: 4, e6: 3, totalQty: 11 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },

  // 38-43: SIDE CUT
  {
    no: 38,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT PUNCH (3P) (Ø5)',
    drawingNo: 'DWG-SC-001',
    installQty: { e2: 2, e4: 2, e5: 2, totalQty: 6 },
    shotLifeCycle: { e1_pcm: 10, e2_gold: 23, e3_1_pcm: 10, e3_2_gold: 23, e3_3_gold: 23, e4_bare: 23, e5_bare: 23, e6_pcm: 10 },
    regrindStandard: { perGrindMm: '0.15-0.20', totalGrindMm: '1.40', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 39,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT PUNCH (3P) (Ø7)',
    drawingNo: 'DWG-SC-002',
    installQty: { e1: 2, e3_1: 2, e6: 2, totalQty: 6 },
    shotLifeCycle: { e1_pcm: 10, e2_gold: 23, e3_1_pcm: 10, e3_2_gold: 23, e3_3_gold: 23, e4_bare: 23, e5_bare: 23, e6_pcm: 10 },
    regrindStandard: { perGrindMm: '0.15-0.20', totalGrindMm: '1.40', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 40,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT DIE (3P) (Ø5)',
    drawingNo: 'DWG-SC-003',
    installQty: { e2: 2, e4: 2, e5: 2, totalQty: 6 },
    shotLifeCycle: { e1_pcm: 10, e2_gold: 23, e3_1_pcm: 10, e3_2_gold: 23, e3_3_gold: 23, e4_bare: 23, e5_bare: 23, e6_pcm: 10 },
    regrindStandard: { perGrindMm: '0.15-0.20', totalGrindMm: '1.50', regrindCycles: '8-10 time', note: '-' }
  },
  {
    no: 41,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT DIE (3P) (Ø7)',
    drawingNo: 'DWG-SC-004',
    installQty: { e1: 2, e3_1: 2, e6: 2, totalQty: 6 },
    shotLifeCycle: { e1_pcm: 10, e2_gold: 23, e3_1_pcm: 10, e3_2_gold: 23, e3_3_gold: 23, e4_bare: 23, e5_bare: 23, e6_pcm: 10 },
    regrindStandard: { perGrindMm: '0.15-0.20', totalGrindMm: '1.50', regrindCycles: '8-10 time', note: '-' }
  },
  {
    no: 42,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT PUNCH (WIDE LOWER) 4P',
    drawingNo: 'DWG-SC-005',
    installQty: { e3_3: 2, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },
  {
    no: 43,
    stage: 'SIDE CUT',
    partName: 'SIDE CUT DIE (WIDE LOWER) 4P',
    drawingNo: 'DWG-SC-006',
    installQty: { e3_3: 2, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 25, e2_gold: 25, e3_1_pcm: 25, e3_2_gold: 25, e3_3_gold: 25, e4_bare: 25, e5_bare: 25, e6_pcm: 25 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '14-15 time', note: '-' }
  },

  // 44-49: S5 CENTER NOTCH (Corner Cut Center Punches & Dies)
  {
    no: 44,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER PUNCH A (Ø7)',
    drawingNo: 'DWG-CN-001',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 45,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER PUNCH B (Ø7)',
    drawingNo: 'DWG-CN-002',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 46,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER PUNCH C (Ø7)',
    drawingNo: 'DWG-CN-003',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 47,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER DIE A (Ø7)',
    drawingNo: 'DWG-CN-004',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 48,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER DIE B (Ø7)',
    drawingNo: 'DWG-CN-005',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 49,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT CENTER DIE C (Ø7)',
    drawingNo: 'DWG-CN-006',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },

  // 50-61: CORNER CUT (A to F Punches & Dies)
  {
    no: 50,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH A (Ø7)',
    drawingNo: 'DWG-CC-001',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 51,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH B (Ø7)',
    drawingNo: 'DWG-CC-002',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 52,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH C (Ø7)',
    drawingNo: 'DWG-CC-003',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 53,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH D (Ø7)',
    drawingNo: 'DWG-CC-004',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 54,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH E (Ø7)',
    drawingNo: 'DWG-CC-005',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 55,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT PUNCH F (Ø7)',
    drawingNo: 'DWG-CC-006',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 56,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE A (Ø7)',
    drawingNo: 'DWG-CC-007',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 57,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE B (Ø7)',
    drawingNo: 'DWG-CC-008',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 58,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE C (Ø7)',
    drawingNo: 'DWG-CC-009',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 59,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE D (Ø7)',
    drawingNo: 'DWG-CC-010',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 60,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE E (Ø7)',
    drawingNo: 'DWG-CC-011',
    installQty: { e1: 29, e6: 22, totalQty: 51 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 61,
    stage: 'CORNER CUT',
    partName: 'CORNER CUT DIE F (Ø7)',
    drawingNo: 'DWG-CC-012',
    installQty: { e1: 1, e6: 1, totalQty: 2 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },

  // 62-69: S5 CENTER NOTCH (Corner Cut S1/S0 Punches & Dies)
  {
    no: 62,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 PUNCH A (Ø7)',
    drawingNo: 'DWG-CS-001',
    installQty: { e1: 1, totalQty: 1 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 63,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 PUNCH B (Ø7)',
    drawingNo: 'DWG-CS-002',
    installQty: { e1: 29, totalQty: 29 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 64,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 PUNCH C (Ø7)',
    drawingNo: 'DWG-CS-003',
    installQty: { e1: 29, totalQty: 29 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 65,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 PUNCH D (Ø7)',
    drawingNo: 'DWG-CS-004',
    installQty: { e1: 1, totalQty: 1 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 66,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 DIE A (Ø7)',
    drawingNo: 'DWG-CS-005',
    installQty: { e1: 1, totalQty: 1 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 67,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 DIE B (Ø7)',
    drawingNo: 'DWG-CS-006',
    installQty: { e1: 29, totalQty: 29 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 68,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 DIE C (Ø7)',
    drawingNo: 'DWG-CS-007',
    installQty: { e1: 29, totalQty: 29 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },
  {
    no: 69,
    stage: 'S5 CENTER NOTCH',
    partName: 'CORNER CUT S1/S0 DIE D (Ø7)',
    drawingNo: 'DWG-CS-008',
    installQty: { e1: 1, totalQty: 1 },
    shotLifeCycle: { e1_pcm: 27, e2_gold: 70, e3_1_pcm: 27, e3_2_gold: 70, e3_3_gold: 70, e4_bare: 70, e5_bare: 70, e6_pcm: 27 },
    regrindStandard: { perGrindMm: '0.25-0.35', totalGrindMm: '1.50', regrindCycles: '4-5 time', note: '-' }
  },

  // 70-71: HITCH FEED
  {
    no: 70,
    stage: 'HITCH FEED',
    partName: 'SIECH FEED PIN (Ø5)',
    drawingNo: 'DWG-HF-001',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 71,
    stage: 'HITCH FEED',
    partName: 'SIECH FEED PIN (Ø7)',
    drawingNo: 'DWG-HF-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 72-79: BACK STOP
  {
    no: 72,
    stage: 'BACK STOP',
    partName: 'BACK STOP PIN',
    drawingNo: 'DWG-BS-001',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 73,
    stage: 'BACK STOP',
    partName: 'BACK STOP BUSH',
    drawingNo: 'DWG-BS-002',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 74,
    stage: 'BACK STOP',
    partName: 'FELT',
    drawingNo: 'DWG-BS-003',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 75,
    stage: 'BACK STOP',
    partName: 'BACK STOP PLATE',
    drawingNo: 'DWG-BS-004',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 76,
    stage: 'BACK STOP',
    partName: 'POWER SPRING',
    drawingNo: 'DWG-BS-005',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 77,
    stage: 'BACK STOP',
    partName: 'LIFT PIN',
    drawingNo: 'DWG-BS-006',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 78,
    stage: 'BACK STOP',
    partName: 'MATERIAL GUIDE',
    drawingNo: 'DWG-BS-007',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 79,
    stage: 'BACK STOP',
    partName: 'LOWER DIE PLATE',
    drawingNo: 'DWG-BS-008',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 80-95: FORMING
  {
    no: 80,
    stage: 'FORMING',
    partName: '1-FORMING PUNCH',
    drawingNo: 'DWG-FM-001',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 81,
    stage: 'FORMING',
    partName: '2-FORMING PUNCH',
    drawingNo: 'DWG-FM-002',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 82,
    stage: 'FORMING',
    partName: '3-FORMING PUNCH',
    drawingNo: 'DWG-FM-003',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 83,
    stage: 'FORMING',
    partName: '1-FORMING DIE PLATE (HOLE)',
    drawingNo: 'DWG-FM-004',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 84,
    stage: 'FORMING',
    partName: '2-FORMING BUSH',
    drawingNo: 'DWG-FM-005',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 85,
    stage: 'FORMING',
    partName: '2-FORMING BUSH PLATE',
    drawingNo: 'DWG-FM-006',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 86,
    stage: 'FORMING',
    partName: '1-FORMING LIFTER PLATE',
    drawingNo: 'DWG-FM-007',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 87,
    stage: 'FORMING',
    partName: '2-FORMING LIFTER PLATE',
    drawingNo: 'DWG-FM-008',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 88,
    stage: 'FORMING',
    partName: 'FORMING PUNCH HOLDER (HOLE)',
    drawingNo: 'DWG-FM-009',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 89,
    stage: 'FORMING',
    partName: 'KEEPER URETHANE',
    drawingNo: 'DWG-FM-010',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 90,
    stage: 'FORMING',
    partName: 'GAUGE CHANGE',
    drawingNo: 'DWG-FM-011',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 91,
    stage: 'FORMING',
    partName: 'PILOT PIN',
    drawingNo: 'DWG-FM-012',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 92,
    stage: 'FORMING',
    partName: 'PILOT BUSH',
    drawingNo: 'DWG-FM-013',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 93,
    stage: 'FORMING',
    partName: 'MANUAL PILOT BUSH PIN',
    drawingNo: 'DWG-FM-014',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 94,
    stage: 'FORMING',
    partName: 'DIE INSERT (FORM)',
    drawingNo: 'DWG-FM-015',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 95,
    stage: 'FORMING',
    partName: 'PUNCH INSERT (FORM)',
    drawingNo: 'DWG-FM-016',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 96-102: PIERCE & BURRING (Plates & Sub-elements)
  {
    no: 96,
    stage: 'PIERCE & BURRING',
    partName: 'KILLER PIN',
    drawingNo: 'DWG-PB-096',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 97,
    stage: 'PIERCE & BURRING',
    partName: 'REVERSE KILLER PIN',
    drawingNo: 'DWG-PB-097',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 98,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING DIE PLATE',
    drawingNo: 'DWG-PB-098',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 99,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE PUNCH PLATE',
    drawingNo: 'DWG-PB-099',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 100,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH PLATE',
    drawingNo: 'DWG-PB-100',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 101,
    stage: 'PIERCE & BURRING',
    partName: 'STOPPER PLATE',
    drawingNo: 'DWG-PB-101',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 102,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING LIFTER PLATE',
    drawingNo: 'DWG-PB-102',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 103-109: IRONING (Plates & Sub-elements)
  {
    no: 103,
    stage: 'IRONING',
    partName: 'GUIDE PIN',
    drawingNo: 'DWG-IR-103',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 104,
    stage: 'IRONING',
    partName: 'GUIDE BUSH',
    drawingNo: 'DWG-IR-104',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 105,
    stage: 'IRONING',
    partName: 'IRONING KNOCK OUT PIN',
    drawingNo: 'DWG-IR-105',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 106,
    stage: 'IRONING',
    partName: 'EJECTOR PIN',
    drawingNo: 'DWG-IR-106',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 107,
    stage: 'IRONING',
    partName: 'IRONING PUNCH PLATE',
    drawingNo: 'DWG-IR-107',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 108,
    stage: 'IRONING',
    partName: 'PUNCH COVER PLATE',
    drawingNo: 'DWG-IR-108',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 109,
    stage: 'IRONING',
    partName: 'LIFTER PLATE',
    drawingNo: 'DWG-IR-109',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 110-113: REFLARE (Sub-elements)
  {
    no: 110,
    stage: 'REFLARE',
    partName: 'REFLARE BUSH',
    drawingNo: 'DWG-RF-110',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 111,
    stage: 'REFLARE',
    partName: 'ADJUSTER',
    drawingNo: 'DWG-RF-111',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 112,
    stage: 'REFLARE',
    partName: 'LEVEL PIN',
    drawingNo: 'DWG-RF-112',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 113,
    stage: 'REFLARE',
    partName: 'LEVEL PIN SPRING',
    drawingNo: 'DWG-RF-113',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 114-116: PILOT
  {
    no: 114,
    stage: 'PILOT',
    partName: 'PILOT PUNCH',
    drawingNo: 'DWG-PL-114',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 115,
    stage: 'PILOT',
    partName: 'PILOT BUSH PLATE',
    drawingNo: 'DWG-PL-115',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 116,
    stage: 'PILOT',
    partName: 'PILOT DIE PLATE',
    drawingNo: 'DWG-PL-116',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 117-120: EDGE TRIM
  {
    no: 117,
    stage: 'EDGE TRIM',
    partName: 'EDGE TRIM PUNCH',
    drawingNo: 'DWG-ET-117',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 118,
    stage: 'EDGE TRIM',
    partName: 'EDGE TRIM DIE',
    drawingNo: 'DWG-ET-118',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 119,
    stage: 'EDGE TRIM',
    partName: 'EDGE TRIM HOLDER',
    drawingNo: 'DWG-ET-119',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 120,
    stage: 'EDGE TRIM',
    partName: 'COIL SPRING',
    drawingNo: 'DWG-ET-120',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 121-128: HITCH FEED (Components)
  {
    no: 121,
    stage: 'HITCH FEED',
    partName: 'HITCH PIN',
    drawingNo: 'DWG-HF-121',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 122,
    stage: 'HITCH FEED',
    partName: 'HITCH PIN BUSH',
    drawingNo: 'DWG-HF-122',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 123,
    stage: 'HITCH FEED',
    partName: 'METAL BUSH',
    drawingNo: 'DWG-HF-123',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 124,
    stage: 'HITCH FEED',
    partName: 'HITCH SHAFT',
    drawingNo: 'DWG-HF-124',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 125,
    stage: 'HITCH FEED',
    partName: 'HITCH COVER',
    drawingNo: 'DWG-HF-125',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 126,
    stage: 'HITCH FEED',
    partName: 'HITCH LINK',
    drawingNo: 'DWG-HF-126',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 127,
    stage: 'HITCH FEED',
    partName: 'HITCH BAR',
    drawingNo: 'DWG-HF-127',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 128,
    stage: 'HITCH FEED',
    partName: 'OILLESS BUSH',
    drawingNo: 'DWG-HF-128',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 129-132: ROW SLIT (Components)
  {
    no: 129,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE BLOCK (UPPER)',
    drawingNo: 'DWG-RS-129',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 130,
    stage: 'ROW SLIT',
    partName: 'SPACER',
    drawingNo: 'DWG-RS-130',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 131,
    stage: 'ROW SLIT',
    partName: 'UPPER PLATE',
    drawingNo: 'DWG-RS-131',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 132,
    stage: 'ROW SLIT',
    partName: 'LOWER PLATE',
    drawingNo: 'DWG-RS-132',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 133-139: CUT OFF (Holders & Components)
  {
    no: 133,
    stage: 'CUT OFF',
    partName: 'UPPER HOLDER SUPPORTER A',
    drawingNo: 'DWG-CO-133',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 134,
    stage: 'CUT OFF',
    partName: 'UPPER HOLDER SUPPORTER B',
    drawingNo: 'DWG-CO-134',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 135,
    stage: 'CUT OFF',
    partName: 'UPPER HOLDER BLOCK',
    drawingNo: 'DWG-CO-135',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 136,
    stage: 'CUT OFF',
    partName: 'HIT BLOCK',
    drawingNo: 'DWG-CO-136',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 137,
    stage: 'CUT OFF',
    partName: 'CORRECTION PLATE',
    drawingNo: 'DWG-CO-137',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 138,
    stage: 'CUT OFF',
    partName: 'UPPER HOLDER',
    drawingNo: 'DWG-CO-138',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 139,
    stage: 'CUT OFF',
    partName: 'LOWER HOLDER',
    drawingNo: 'DWG-CO-139',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 140-145: MAIN STAGE
  {
    no: 140,
    stage: 'MAIN STAGE',
    partName: 'GUIDE POST',
    drawingNo: 'DWG-MS-140',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 141,
    stage: 'MAIN STAGE',
    partName: 'RETAINER',
    drawingNo: 'DWG-MS-141',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 142,
    stage: 'MAIN STAGE',
    partName: 'CAM STOPPER',
    drawingNo: 'DWG-MS-142',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 143,
    stage: 'MAIN STAGE',
    partName: 'SLIT STAGE (BOLT)',
    drawingNo: 'DWG-MS-143',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 144,
    stage: 'MAIN STAGE',
    partName: 'EACH STAGE SPRING (ALL)',
    drawingNo: 'DWG-MS-144',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 145,
    stage: 'MAIN STAGE',
    partName: 'LATERAL PROCESSING & PROCESSING OF PLATE TYPE',
    drawingNo: 'DWG-MS-145',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 146-150: SLIT (Holders & Components)
  {
    no: 146,
    stage: 'SLIT',
    partName: 'SLIT DIE',
    drawingNo: 'DWG-SL-146',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 147,
    stage: 'SLIT',
    partName: 'PUNCH HOLDER PIECE',
    drawingNo: 'DWG-SL-147',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 148,
    stage: 'SLIT',
    partName: 'STRIPPER PLATE',
    drawingNo: 'DWG-SL-148',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 149,
    stage: 'SLIT',
    partName: 'KEEPER',
    drawingNo: 'DWG-SL-149',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 150,
    stage: 'SLIT',
    partName: 'OILING BLOCK',
    drawingNo: 'DWG-SL-150',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },

  // 151-157: S5 CENTER NOTCH (Assemblies & Plates)
  {
    no: 151,
    stage: 'S5 CENTER NOTCH',
    partName: 'GUIDE BUSH & POST & RETAINER',
    drawingNo: 'DWG-SN-151',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 152,
    stage: 'S5 CENTER NOTCH',
    partName: 'DIE',
    drawingNo: 'DWG-SN-152',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 153,
    stage: 'S5 CENTER NOTCH',
    partName: 'PUNCH',
    drawingNo: 'DWG-SN-153',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 154,
    stage: 'S5 CENTER NOTCH',
    partName: 'STRIPPER RIB',
    drawingNo: 'DWG-SN-154',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 155,
    stage: 'S5 CENTER NOTCH',
    partName: 'STRIPPER SPACER',
    drawingNo: 'DWG-SN-155',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 156,
    stage: 'S5 CENTER NOTCH',
    partName: 'BACK PLATE',
    drawingNo: 'DWG-SN-156',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  },
  {
    no: 157,
    stage: 'S5 CENTER NOTCH',
    partName: 'PUNCH HOLDER',
    drawingNo: 'DWG-SN-157',
    installQty: { totalQty: 0 },
    shotLifeCycle: { e1_pcm: '-', e2_gold: '-', e3_1_pcm: '-', e3_2_gold: '-', e3_3_gold: '-', e4_bare: '-', e5_bare: '-', e6_pcm: '-' },
    regrindStandard: { perGrindMm: '-', totalGrindMm: '-', regrindCycles: '-', note: '-' }
  }
];
