/**
 * Standard Stage Groups & Utilities for Mold Tooling Management
 * 12 Canonical Production Stages
 */

export const DEFAULT_STAGE_GROUPS: string[] = [
  'PIERCE & BURRING',
  'IRONING',
  'LOUVER',
  'REFLARE',
  'SLIT',
  'WIDE LOWER',
  'ROW SLIT',
  'CUT OFF',
  'SIDE CUT',
  'S5 CENTER NOTCH',
  'CORNER CUT',
  'HITCH FEED'
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
      if (def === s || def.includes(s) || s.includes(def)) return i;
      
      // Try splitting by common separators and matching words
      const defWords = def.split(/[&\s\/]+/).filter(w => w.length > 2);
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
 * Helper to strip 'Stage X:' prefix and extraneous non-ASCII from any custom user string
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
  cleaned = cleaned.trim();
  
  // Match to canonical 12 stages if close
  const upper = cleaned.toUpperCase();
  for (const def of DEFAULT_STAGE_GROUPS) {
    if (def.toUpperCase() === upper) return def;
  }
  return cleaned;
}

/**
 * Normalizes raw stage names into standard 12 Stage Groups
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

  // Exact uppercase match against groupsToUse
  const match = groupsToUse.find(g => g.toUpperCase() === stripped.toUpperCase());
  if (match) return match;

  // Combine stageStr and partStr for matching
  const combined = `${stageStr} ${partStr}`.toUpperCase();

  if (combined.includes('PIERCE') || combined.includes('BURRING') || combined.includes('PIERCING')) {
    return 'PIERCE & BURRING';
  }
  if (combined.includes('IRONING') || combined.includes('IRON')) {
    return 'IRONING';
  }
  if (combined.includes('LOUVER')) {
    return 'LOUVER';
  }
  if (combined.includes('REFLARE') || combined.includes('REFLAIRE') || combined.includes('REFL')) {
    return 'REFLARE';
  }
  if (combined.includes('ROW SLIT') || combined.includes('ROW SLID')) {
    return 'ROW SLIT';
  }
  if (combined.includes('SLIT')) {
    return 'SLIT';
  }
  if (combined.includes('WIDE LOWER') || combined.includes('FORMING')) {
    return 'WIDE LOWER';
  }
  if (combined.includes('CUT OFF') || combined.includes('CUTOFF')) {
    return 'CUT OFF';
  }
  if (combined.includes('SIDE CUT') || combined.includes('SIDECUT')) {
    return 'SIDE CUT';
  }
  if (combined.includes('S5') || combined.includes('CENTER NOTCH') || combined.includes('S1/S0')) {
    return 'S5 CENTER NOTCH';
  }
  if (combined.includes('CORNER CUT')) {
    return 'CORNER CUT';
  }
  if (combined.includes('HITCH') || combined.includes('SIECH') || combined.includes('FEED PIN') || combined.includes('PILOT')) {
    return 'HITCH FEED';
  }

  // If it's a custom stage name created by user that isn't raw part name
  if (stripped && stripped !== '-' && !stripped.toUpperCase().includes('DIE') && !stripped.toUpperCase().includes('PUNCH')) {
    return stripped;
  }

  return groupsToUse[0] || 'PIERCE & BURRING';
}
