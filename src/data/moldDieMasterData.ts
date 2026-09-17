import { MoldDieMasterItem } from '../types';

/**
 * List Spare Parts Mold & Die Heat Exchanger
 * Standard Engineering Master Revision: 2025 (Consolidated 12 Stages, 71 Canonical Items)
 */
export const MOLD_DIE_MASTER_ITEMS_2025: MoldDieMasterItem[] = [
  // 1-10: PIERCE & BURRING (Stage 1)
  {
    no: 1,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE PUNCH (Ø5)',
    drawingNo: 'DWG-PB-001',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 1.5, e3_1_pcm: 1.5, e3_2_gold: 1.5, e3_3_gold: 1.5, e4_bare: 1.5, e5_bare: 1.5, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 2,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE PUNCH (Ø7)',
    drawingNo: 'DWG-PB-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 1.5, e2_gold: 1.5, e3_1_pcm: 1.5, e3_2_gold: 1.5, e3_3_gold: 1.5, e4_bare: 1.5, e5_bare: 1.5, e6_pcm: 1.5 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 3,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH (Ø5)',
    drawingNo: 'DWG-PB-003',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 15, e2_gold: 50, e3_1_pcm: 15, e3_2_gold: 50, e3_3_gold: 50, e4_bare: 50, e5_bare: 50, e6_pcm: 15 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 4,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH (Ø7)',
    drawingNo: 'DWG-PB-004',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 15, e2_gold: 50, e3_1_pcm: 15, e3_2_gold: 50, e3_3_gold: 50, e4_bare: 50, e5_bare: 50, e6_pcm: 15 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 5,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING PUNCH (WIDE LOWER) 4P',
    drawingNo: 'DWG-PB-005',
    installQty: { e3_3: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 15, e2_gold: 50, e3_1_pcm: 15, e3_2_gold: 50, e3_3_gold: 50, e4_bare: 50, e5_bare: 50, e6_pcm: 15 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 6,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE DIE (Ø5)',
    drawingNo: 'DWG-PB-006',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 7,
    stage: 'PIERCE & BURRING',
    partName: 'PIERCE DIE (Ø7)',
    drawingNo: 'DWG-PB-007',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 8,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING DIE (Ø5)',
    drawingNo: 'DWG-PB-008',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 9,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING DIE (Ø7)',
    drawingNo: 'DWG-PB-009',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 10,
    stage: 'PIERCE & BURRING',
    partName: 'BURRING DIE (WIDE LOWER) 4P',
    drawingNo: 'DWG-PB-010',
    installQty: { e3_3: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },

  // 11-13: IRONING (Stage 2)
  {
    no: 11,
    stage: 'IRONING',
    partName: '1ST IRONING PUNCH (Ø7)',
    drawingNo: 'DWG-IR-001',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 12,
    stage: 'IRONING',
    partName: '2ND IRONING PUNCH (Ø7)',
    drawingNo: 'DWG-IR-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 13,
    stage: 'IRONING',
    partName: '1ST & 2ND IRONING DIE (Ø7)',
    drawingNo: 'DWG-IR-003',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },

  // 14-17: LOUVER (Stage 3)
  {
    no: 14,
    stage: 'LOUVER',
    partName: 'LOUVER BLADE (Ø5) A',
    drawingNo: 'DWG-LV-001',
    installQty: { e2: 34, e4: 33, e5: 33, totalQty: 100 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 15,
    stage: 'LOUVER',
    partName: 'LOUVER BLADE (Ø5) B',
    drawingNo: 'DWG-LV-002',
    installQty: { e2: 33, e4: 32, e5: 32, totalQty: 97 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 16,
    stage: 'LOUVER',
    partName: 'LOUVER BLADE (Ø7) A',
    drawingNo: 'DWG-LV-003',
    installQty: { e1: 29, e3_1: 29, e3_2: 29, e6: 22, totalQty: 109 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 17,
    stage: 'LOUVER',
    partName: 'LOUVER BLADE (Ø7) B',
    drawingNo: 'DWG-LV-004',
    installQty: { e1: 29, e3_1: 29, e3_2: 29, e6: 22, totalQty: 109 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },

  // 18-20: REFLARE (Stage 4)
  {
    no: 18,
    stage: 'REFLARE',
    partName: 'REFLARE PUNCH (Ø5)',
    drawingNo: 'DWG-RF-001',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 19,
    stage: 'REFLARE',
    partName: 'REFLARE PUNCH (Ø7)',
    drawingNo: 'DWG-RF-002',
    installQty: { e1: 180, e3_1: 180, e3_2: 180, e6: 138, totalQty: 678 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 20,
    stage: 'REFLARE',
    partName: 'REFLARE PUNCH (WIDE LOWER) 4P',
    drawingNo: 'DWG-RF-003',
    installQty: { e3_3: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },

  // 21-24: SLIT (Stage 5)
  {
    no: 21,
    stage: 'SLIT',
    partName: 'SLIT BLADE (Ø5) A',
    drawingNo: 'DWG-SL-001',
    installQty: { e2: 34, e4: 33, e5: 33, totalQty: 100 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 22,
    stage: 'SLIT',
    partName: 'SLIT BLADE (Ø5) B',
    drawingNo: 'DWG-SL-002',
    installQty: { e2: 33, e4: 32, e5: 32, totalQty: 97 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 23,
    stage: 'SLIT',
    partName: 'SLIT BLADE (Ø7) A',
    drawingNo: 'DWG-SL-003',
    installQty: { e1: 29, e3_1: 29, e6: 22, totalQty: 80 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 24,
    stage: 'SLIT',
    partName: 'SLIT BLADE (Ø7) B',
    drawingNo: 'DWG-SL-004',
    installQty: { e1: 29, e3_1: 29, e6: 22, totalQty: 80 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },

  // 25-27: WIDE LOWER (Stage 6)
  {
    no: 25,
    stage: 'WIDE LOWER',
    partName: 'FORMING PUNCH (WIDE LOWER) 4P',
    drawingNo: 'DWG-WL-001',
    installQty: { e3_3: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 18, e2_gold: 40, e3_1_pcm: 18, e3_2_gold: 40, e3_3_gold: 40, e4_bare: 40, e5_bare: 40, e6_pcm: 18 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Dispose of after 1 use' }
  },
  {
    no: 26,
    stage: 'WIDE LOWER',
    partName: 'FORMING DIE (WIDE LOWER) 4P',
    drawingNo: 'DWG-WL-002',
    installQty: { e3_3: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },
  {
    no: 27,
    stage: 'WIDE LOWER',
    partName: 'FORMING DIE WL+ (WIDE LOWER) 4P',
    drawingNo: 'DWG-WL-003',
    installQty: { e3_2: 180, totalQty: 180 },
    shotLifeCycle: { e1_pcm: 80, e2_gold: 100, e3_1_pcm: 80, e3_2_gold: 100, e3_3_gold: 100, e4_bare: 100, e5_bare: 100, e6_pcm: 80 },
    regrindStandard: { perGrindMm: '0.10-0.15', totalGrindMm: '1.00', regrindCycles: '7-9 time', note: '-' }
  },

  // 28-31: ROW SLIT (Stage 7)
  {
    no: 28,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø7)',
    drawingNo: 'DWG-RS-001',
    installQty: { e1: 118, e3_1: 118, e6: 90, totalQty: 326 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 29,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø5) A',
    drawingNo: 'DWG-RS-002',
    installQty: { e2: 34, e4: 33, e5: 33, totalQty: 100 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 30,
    stage: 'ROW SLIT',
    partName: 'ROW SLIT BLADE (Ø5) B',
    drawingNo: 'DWG-RS-003',
    installQty: { e2: 33, e4: 32, e5: 32, totalQty: 97 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },
  {
    no: 31,
    stage: 'ROW SLIT',
    partName: 'ROW SLID BLADE (WIDE LOWER) 4P',
    drawingNo: 'DWG-RS-004',
    installQty: { e3_3: 82, totalQty: 82 },
    shotLifeCycle: { e1_pcm: 1.0, e2_gold: 2.0, e3_1_pcm: 1.0, e3_2_gold: 2.0, e3_3_gold: 2.0, e4_bare: 2.0, e5_bare: 2.0, e6_pcm: 1.0 },
    regrindStandard: { perGrindMm: '0.10', totalGrindMm: '1.50', regrindCycles: '15 time', note: 'Change every 10-15 Day (เปลี่ยนทุกๆ 10-15 วัน)' }
  },

  // 32-37: CUT OFF (Stage 8)
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

  // 38-43: SIDE CUT (Stage 9)
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

  // 44-49: S5 CENTER NOTCH (Stage 10 - Group 1)
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

  // 50-61: CORNER CUT (Stage 11)
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

  // 62-69: S5 CENTER NOTCH (Stage 10 - Group 2: S1/S0)
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

  // 70-71: HITCH FEED (Stage 12)
  {
    no: 70,
    stage: 'HITCH FEED',
    partName: 'SIECH FEED PIN (Ø5)',
    drawingNo: 'DWG-HF-001',
    installQty: { e2: 204, e4: 204, e5: 204, totalQty: 612 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 50, e3_1_pcm: 50, e3_2_gold: 50, e3_3_gold: 50, e4_bare: 50, e5_bare: 50, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Periodic Replacement' }
  },
  {
    no: 71,
    stage: 'HITCH FEED',
    partName: 'SIECH FEED PIN (Ø7)',
    drawingNo: 'DWG-HF-002',
    installQty: { e1: 180, e3_1: 180, e6: 138, totalQty: 498 },
    shotLifeCycle: { e1_pcm: 50, e2_gold: 50, e3_1_pcm: 50, e3_2_gold: 50, e3_3_gold: 50, e4_bare: 50, e5_bare: 50, e6_pcm: 50 },
    regrindStandard: { perGrindMm: 'Dispose of after 1 use', totalGrindMm: '-', regrindCycles: '-', note: 'Periodic Replacement' }
  }
];
