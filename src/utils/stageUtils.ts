/**
 * Standard Stage Groups & Utilities for Mold Tooling Management
 */

export const DEFAULT_STAGE_GROUPS: string[] = [
  'Piercing & Burring',
  'Notching & Punching',
  'Forming & Bending',
  'Louver & Slitting',
  'Cut Off & Separating',
  'Side Cut & Guide',
  'Ironing & Calibrating',
  'Reflare',
  'Pilot & Feed Pin',
  'General Tooling'
];

/**
 * Sorts stage names according to standard production process sequence
 */
export function sortStagesInOrder(stages: string[]): string[] {
  const normalizedDefaults = DEFAULT_STAGE_GROUPS.map(g => g.toUpperCase());
  
  const getIndex = (stg: string) => {
    if (!stg) return 999;
    const s = stg.toUpperCase();
    
    // 1. Exact match
    const exactIdx = normalizedDefaults.indexOf(s);
    if (exactIdx !== -1) return exactIdx;
    
    // 2. Fuzzy match against default groups
    for (let i = 0; i < normalizedDefaults.length; i++) {
      const def = normalizedDefaults[i];
      // If default group contains the input or input contains the default
      if (def.includes(s) || s.includes(def)) return i;
      
      // Try splitting by common separators and matching words
      const defWords = def.split(/[&\s\/]+/).filter(w => w.length > 3);
      if (defWords.some(w => s.includes(w))) return i;
    }
    
    return -1;
  };

  return [...stages].sort((a, b) => {
    const idxA = getIndex(a);
    const idxB = getIndex(b);

    if (idxA !== -1 && idxB !== -1) {
      if (idxA === idxB) return a.localeCompare(b);
      return idxA - idxB;
    }
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
  // 1. Remove "Stage X:" prefix
  let cleaned = stageStr.replace(/^Stage\s+\d+:\s*/i, '');
  // 2. Remove Thai characters inside parentheses, e.g. "(เจาะรู / ลบคม)"
  cleaned = cleaned.replace(/\s*\([^)]*[\u0E00-\u0E7F][^)]*\)\s*/g, ' ');
  // 3. Remove any other Thai characters directly
  cleaned = cleaned.replace(/[\u0E00-\u0E7F]+/g, '');
  // 4. Remove any trailing slashes or random punctuation left behind
  cleaned = cleaned.replace(/\s*\/\s*$/g, '');
  return cleaned.trim();
}

/**
 * Normalizes raw stage names into standard Stage Groups without 'Stage X:' prefixes
 */
export function deriveLogicalStage(partName: string, currentStageName?: string, customStageGroups?: string[]): string {
  let stageStr = (currentStageName || '').trim();
  const partStr = (partName || '').trim().toUpperCase();
  const groupsToUse = customStageGroups || DEFAULT_STAGE_GROUPS;

  // Strip prefix if exists
  const stripped = cleanStageName(stageStr);

  // If already one of standard groups, return it
  if (groupsToUse.includes(stripped)) {
    return stripped;
  }

  // Combine stageStr and partStr for matching
  const combined = `${stageStr} ${partStr}`.toUpperCase();

  // ONLY fallback to hardcoded logic if we are using defaults OR if the stripped name is empty/generic
  const isGeneric = !stripped || stripped === '-' || stripped.toUpperCase().includes('DIE') || stripped.toUpperCase().includes('PUNCH');

  if (isGeneric) {
    if (combined.includes('PIERCING') || combined.includes('BURRING') || combined.includes('PIERCE') || combined.includes('BURR')) {
      return groupsToUse.find(g => g.toUpperCase().includes('PIERCE')) || groupsToUse[0] || 'Piercing & Burring';
    }
    if (combined.includes('NOTCH') || combined.includes('CENTER NOTCH') || combined.includes('CORNER CUT')) {
      return groupsToUse.find(g => g.toUpperCase().includes('NOTCH')) || groupsToUse[1] || 'Notching & Punching';
    }
    if (combined.includes('FORMING') || combined.includes('BUCKING') || combined.includes('BEND')) {
      return groupsToUse.find(g => g.toUpperCase().includes('FORM')) || groupsToUse[2] || 'Forming & Bending';
    }
    if (combined.includes('LOUVER') || combined.includes('SLIT')) {
      return groupsToUse.find(g => g.toUpperCase().includes('LOUVER') || g.toUpperCase().includes('SLIT')) || groupsToUse[3] || 'Louver & Slitting';
    }
    if (combined.includes('CUT OFF') || combined.includes('CUTOFF') || combined.includes('CUT')) {
      return groupsToUse.find(g => g.toUpperCase().includes('CUT OFF')) || groupsToUse[4] || 'Cut Off & Separating';
    }
    if (combined.includes('SIDE') || combined.includes('GUIDE')) {
      return groupsToUse.find(g => g.toUpperCase().includes('SIDE')) || groupsToUse[5] || 'Side Cut & Guide';
    }
    if (combined.includes('IRONING') || combined.includes('IRON')) {
      return groupsToUse.find(g => g.toUpperCase().includes('IRONING')) || groupsToUse[6] || 'Ironing & Calibrating';
    }
    if (combined.includes('REFLARE') || combined.includes('REFL') || combined.includes('REFLAIRE')) {
      return groupsToUse.find(g => g.toUpperCase().includes('REFLARE')) || groupsToUse[7] || 'Reflare';
    }
    if (combined.includes('PILOT') || combined.includes('FEED')) {
      return groupsToUse.find(g => g.toUpperCase().includes('PILOT')) || groupsToUse[8] || 'Pilot & Feed Pin';
    }
  }

  // If it's a custom stage name created by user that isn't raw part name
  if (stripped && stripped !== '-' && !stripped.toUpperCase().includes('DIE') && !stripped.toUpperCase().includes('PUNCH')) {
    return stripped;
  }

  return groupsToUse[groupsToUse.length - 1] || 'General Tooling';
}
