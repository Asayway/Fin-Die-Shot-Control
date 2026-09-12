/**
 * Standard Stage Groups & Utilities for Mold Tooling Management
 */

export const DEFAULT_STAGE_GROUPS: string[] = [
  'Piercing & Burring (เจาะรู / ลบคม)',
  'Notching & Punching (ตัดขอบ / บาก)',
  'Forming & Bending (ขึ้นรูป / พับ)',
  'Louver & Slitting (สลิต / เกล็ด)',
  'Cut Off & Separating (ตัดขาด / แยกชิ้น)',
  'Side Cut & Guide (ตัดข้าง / ไกด์)',
  'Ironing & Calibrating (รีด / ปรับขนาด)',
  'Reflare (รีแฟลร์)',
  'Pilot & Feed Pin (สลักนำศูนย์)',
  'General Tooling (ทูลลิ่งทั่วไป)'
];

/**
 * Sorts stage names according to standard production process sequence
 */
export function sortStagesInOrder(stages: string[]): string[] {
  return [...stages].sort((a, b) => {
    const idxA = DEFAULT_STAGE_GROUPS.indexOf(a);
    const idxB = DEFAULT_STAGE_GROUPS.indexOf(b);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Helper to strip 'Stage X:' prefix from any custom user string
 */
export function cleanStageName(stageStr: string): string {
  if (!stageStr) return '';
  return stageStr.replace(/^Stage\s+\d+:\s*/i, '').trim();
}

/**
 * Normalizes raw stage names into standard Stage Groups without 'Stage X:' prefixes
 */
export function deriveLogicalStage(partName: string, currentStageName?: string): string {
  let stageStr = (currentStageName || '').trim();
  const partStr = (partName || '').trim().toUpperCase();

  // Strip prefix if exists
  const stripped = cleanStageName(stageStr);

  // If already one of standard groups, return it
  if (DEFAULT_STAGE_GROUPS.includes(stripped)) {
    return stripped;
  }

  // Combine stageStr and partStr for matching
  const combined = `${stageStr} ${partStr}`.toUpperCase();

  if (combined.includes('PIERCING') || combined.includes('BURRING') || combined.includes('PIERCE') || combined.includes('BURR')) {
    return 'Piercing & Burring (เจาะรู / ลบคม)';
  }
  if (combined.includes('NOTCH') || combined.includes('CENTER NOTCH') || combined.includes('CORNER CUT')) {
    return 'Notching & Punching (ตัดขอบ / บาก)';
  }
  if (combined.includes('FORMING') || combined.includes('BUCKING') || combined.includes('BEND')) {
    return 'Forming & Bending (ขึ้นรูป / พับ)';
  }
  if (combined.includes('LOUVER') || combined.includes('SLIT')) {
    return 'Louver & Slitting (สลิต / เกล็ด)';
  }
  if (combined.includes('CUT OFF') || combined.includes('CUTOFF') || combined.includes('CUT')) {
    return 'Cut Off & Separating (ตัดขาด / แยกชิ้น)';
  }
  if (combined.includes('SIDE') || combined.includes('GUIDE')) {
    return 'Side Cut & Guide (ตัดข้าง / ไกด์)';
  }
  if (combined.includes('IRONING') || combined.includes('IRON')) {
    return 'Ironing & Calibrating (รีด / ปรับขนาด)';
  }
  if (combined.includes('REFLARE') || combined.includes('REFL') || combined.includes('REFLAIRE')) {
    return 'Reflare (รีแฟลร์)';
  }
  if (combined.includes('PILOT') || combined.includes('FEED')) {
    return 'Pilot & Feed Pin (สลักนำศูนย์)';
  }

  // If it's a custom stage name created by user that isn't raw part name
  if (stripped && stripped !== '-' && !stripped.toUpperCase().includes('DIE') && !stripped.toUpperCase().includes('PUNCH')) {
    return stripped;
  }

  return 'General Tooling (ทูลลิ่งทั่วไป)';
}
