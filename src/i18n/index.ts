import i18n from './config';
import en from './locales/en.json';
import th from './locales/th.json';
import ko from './locales/ko.json';

export { i18n };
export * from './config';
export * from './LanguageContext';

export type LanguageCode = 'EN' | 'TH' | 'KO' | 'DUAL';

export interface TvTranslations {
  stagePunchDie: string;
  replacementCount: string;
  shotCount: string;
  progress: string;
  lifeTime: string;
  installQty: string;
  stockQty: string;
  orderRequire: string;
  finDieShotCount?: string;
  mainFinDie?: string;
  total?: string;
  today?: string;
  signalStandard?: string;
  normal?: string;
  warning?: string;
  prepare?: string;
  overLife?: string;
  autoWidth?: string;
}

export interface TableTranslations {
  no: string;
  partName: string;
  limit: string;
  current: string;
  usage: string;
  remain: string;
  progress: string;
  lastChange: string;
  installed: string;
  spare: string;
  status: string;
}

export interface ControlsTranslations {
  line: string;
  sort: string;
  highContrast: string;
  autoCycle: string;
  plc: string;
  live: string;
  paused: string;
  off: string;
  fullscreen: string;
  exitFullscreen: string;
  lastUpdate: string;
  totalShot: string;
  shiftShot: string;
  dailyShot: string;
  monthlyShot: string;
  signal: string;
  alert: string;
  running: string;
  idle: string;
  maintenance: string;
  stopped: string;
  normal: string;
  warning: string;
  prepare: string;
  critical: string;
  overLife: string;
  missing: string;
  clickStatusHint: string;
}

export interface SidebarTranslations {
  operations: string;
  toolingSetup: string;
  settings: string;
  shotEntry: string;
  tvDashboard: string;
  partReplacement: string;
  regrindingHub: string;
  dieAndPartMaster: string;
  systemSettings: string;
}

export interface HeaderTranslations {
  subtitle: string;
  liveStatus: string;
  hmiStatus: string;
}

export interface Dictionary {
  table: TableTranslations;
  tv: TvTranslations;
  controls: ControlsTranslations;
  sidebar: SidebarTranslations;
  header: HeaderTranslations;
}

export const TRANSLATIONS: Record<'EN' | 'TH' | 'KO', Dictionary> = {
  EN: {
    table: {
      no: en.table.no,
      partName: en.table.partName,
      limit: en.table.limit,
      current: en.table.current,
      usage: en.table.usage,
      remain: en.table.remain,
      progress: en.table.progress,
      lastChange: en.table.lastChange,
      installed: en.table.installed,
      spare: en.table.spare,
      status: en.table.status
    },
    tv: {
      stagePunchDie: en.tv.stagePunchDie,
      replacementCount: en.tv.replacementCount,
      shotCount: en.tv.shotCount,
      progress: en.tv.progress,
      lifeTime: en.tv.lifeTime,
      installQty: en.tv.installQty,
      stockQty: en.tv.stockQty,
      orderRequire: en.tv.orderRequire,
      finDieShotCount: en.tv.finDieShotCount,
      mainFinDie: en.tv.mainFinDie,
      total: en.tv.total,
      today: en.tv.today,
      signalStandard: en.tv.signalStandard,
      normal: en.tv.normal,
      warning: en.tv.warning,
      prepare: en.tv.prepare,
      overLife: en.tv.overLife,
      autoWidth: en.tv.autoWidth
    },
    controls: {
      line: 'LINE',
      sort: 'SORT',
      highContrast: 'HIGH CONTRAST',
      autoCycle: 'AUTO-CYCLE',
      plc: 'PLC',
      live: 'LIVE',
      paused: 'PAUSED',
      off: 'OFF',
      fullscreen: 'FULLSCREEN',
      exitFullscreen: 'EXIT FULLSCREEN',
      lastUpdate: 'LAST UPDATE',
      totalShot: 'TOTAL SHOT',
      shiftShot: 'SHIFT SHOT',
      dailyShot: 'DAILY SHOT',
      monthlyShot: 'MONTHLY SHOT',
      signal: 'SIGNAL',
      alert: 'ALERT',
      running: 'RUNNING',
      idle: 'IDLE',
      maintenance: 'MAINTENANCE',
      stopped: 'STOPPED',
      normal: 'NORMAL',
      warning: 'WARNING',
      prepare: 'PREPARE',
      critical: 'CRITICAL',
      overLife: 'OVER LIFE',
      missing: 'MISSING',
      clickStatusHint: 'Click STATUS button for detailed part breakdown and maintenance advice'
    },
    sidebar: {
      operations: en.sidebar.operations,
      toolingSetup: en.sidebar.toolingSetup,
      settings: en.sidebar.settings,
      shotEntry: en.sidebar.shotEntry,
      tvDashboard: en.sidebar.tvDashboard,
      partReplacement: en.sidebar.partReplacement,
      regrindingHub: en.sidebar.regrindingHub,
      dieAndPartMaster: en.sidebar.dieAndPartMaster,
      systemSettings: en.sidebar.systemSettings
    },
    header: {
      subtitle: en.header.subtitle,
      liveStatus: en.header.liveStatus,
      hmiStatus: en.header.hmiStatus
    }
  },
  TH: {
    table: {
      no: th.table.no,
      partName: th.table.partName,
      limit: th.table.limit,
      current: th.table.current,
      usage: th.table.usage,
      remain: th.table.remain,
      progress: th.table.progress,
      lastChange: th.table.lastChange,
      installed: th.table.installed,
      spare: th.table.spare,
      status: th.table.status
    },
    tv: {
      stagePunchDie: th.tv.stagePunchDie,
      replacementCount: th.tv.replacementCount,
      shotCount: th.tv.shotCount,
      progress: th.tv.progress,
      lifeTime: th.tv.lifeTime,
      installQty: th.tv.installQty,
      stockQty: th.tv.stockQty,
      orderRequire: th.tv.orderRequire,
      finDieShotCount: th.tv.finDieShotCount,
      mainFinDie: th.tv.mainFinDie,
      total: th.tv.total,
      today: th.tv.today,
      signalStandard: th.tv.signalStandard,
      normal: th.tv.normal,
      warning: th.tv.warning,
      prepare: th.tv.prepare,
      overLife: th.tv.overLife,
      autoWidth: th.tv.autoWidth
    },
    controls: {
      line: 'สายผลิต',
      sort: 'เรียงลำดับ',
      highContrast: 'คอนทราสต์สูง',
      autoCycle: 'หมุนเวียนกะ',
      plc: 'PLC',
      live: 'ทำงาน',
      paused: 'หยุดพัก',
      off: 'ปิด',
      fullscreen: 'เต็มหน้าจอ',
      exitFullscreen: 'ย่อหน้าจอ',
      lastUpdate: 'อัปเดตล่าสุด',
      totalShot: 'ช็อตรวม',
      shiftShot: 'ช็อตกะ',
      dailyShot: 'ช็อตรายวัน',
      monthlyShot: 'ช็อตรายเดือน',
      signal: 'สัญญาณ',
      alert: 'เตือนภัย',
      running: 'กำลังทำงาน',
      idle: 'พักไลน์ / ไม่มีแผน',
      maintenance: 'ซ่อมบำรุง',
      stopped: 'หยุดทำงาน',
      normal: 'ปกติ',
      warning: 'เฝ้าระวัง',
      prepare: 'เตรียมอะไหล่',
      critical: 'วิกฤต',
      overLife: 'เกินอายุ',
      missing: 'ไม่มีมาตรฐาน',
      clickStatusHint: 'กดที่ปุ่ม STATUS เพื่อดูรายละเอียดสถานะและแจ้งเตือนของแต่ละชิ้นส่วน'
    },
    sidebar: {
      operations: th.sidebar.operations,
      toolingSetup: th.sidebar.toolingSetup,
      settings: th.sidebar.settings,
      shotEntry: th.sidebar.shotEntry,
      tvDashboard: th.sidebar.tvDashboard,
      partReplacement: th.sidebar.partReplacement,
      regrindingHub: th.sidebar.regrindingHub,
      dieAndPartMaster: th.sidebar.dieAndPartMaster,
      systemSettings: th.sidebar.systemSettings
    },
    header: {
      subtitle: th.header.subtitle,
      liveStatus: th.header.liveStatus,
      hmiStatus: th.header.hmiStatus
    }
  },
  KO: {
    table: {
      no: ko.table.no,
      partName: ko.table.partName,
      limit: ko.table.limit,
      current: ko.table.current,
      usage: ko.table.usage,
      remain: ko.table.remain,
      progress: ko.table.progress,
      lastChange: ko.table.lastChange,
      installed: ko.table.installed,
      spare: ko.table.spare,
      status: ko.table.status
    },
    tv: {
      stagePunchDie: ko.tv.stagePunchDie,
      replacementCount: ko.tv.replacementCount,
      shotCount: ko.tv.shotCount,
      progress: ko.tv.progress,
      lifeTime: ko.tv.lifeTime,
      installQty: ko.tv.installQty,
      stockQty: ko.tv.stockQty,
      orderRequire: ko.tv.orderRequire,
      finDieShotCount: ko.tv.finDieShotCount,
      mainFinDie: ko.tv.mainFinDie,
      total: ko.tv.total,
      today: ko.tv.today,
      signalStandard: ko.tv.signalStandard,
      normal: ko.tv.normal,
      warning: ko.tv.warning,
      prepare: ko.tv.prepare,
      overLife: ko.tv.overLife,
      autoWidth: ko.tv.autoWidth
    },
    controls: {
      line: '라인',
      sort: '정렬',
      highContrast: '고대비',
      autoCycle: '자동 순환',
      plc: 'PLC',
      live: '동작 중',
      paused: '일시 정지',
      off: '꺼짐',
      fullscreen: '전체 화면',
      exitFullscreen: '전체 화면 종료',
      lastUpdate: '최종 갱신',
      totalShot: '총 타수',
      shiftShot: '교대 타수',
      dailyShot: '일일 타수',
      monthlyShot: '월간 타수',
      signal: '신호',
      alert: '경고',
      running: '가동 중',
      idle: '대기 중',
      maintenance: '보전 작업',
      stopped: '정지됨',
      normal: '정상',
      warning: '주의',
      prepare: '준비',
      critical: '위험',
      overLife: '수명 초과',
      missing: '기준 없음',
      clickStatusHint: '상태 버튼을 클릭하여 세부 정보 및 유지보수 권장사항을 확인하세요'
    },
    sidebar: {
      operations: ko.sidebar.operations,
      toolingSetup: ko.sidebar.toolingSetup,
      settings: ko.sidebar.settings,
      shotEntry: ko.sidebar.shotEntry,
      tvDashboard: ko.sidebar.tvDashboard,
      partReplacement: ko.sidebar.partReplacement,
      regrindingHub: ko.sidebar.regrindingHub,
      dieAndPartMaster: ko.sidebar.dieAndPartMaster,
      systemSettings: ko.sidebar.systemSettings
    },
    header: {
      subtitle: ko.header.subtitle,
      liveStatus: ko.header.liveStatus,
      hmiStatus: ko.header.hmiStatus
    }
  }
};

export const getI18n = (lang: LanguageCode = 'EN'): Dictionary => {
  if (lang === 'TH') return TRANSLATIONS.TH;
  if (lang === 'KO') return TRANSLATIONS.KO;
  return TRANSLATIONS.EN;
};

export function formatLineName(lineId: string, lang: LanguageCode): string {
  const lineNum = lineId.startsWith('E3') ? 'E3' : lineId;
  if (lang === 'KO') {
    return `라인 ${lineNum}`;
  }
  if (lang === 'TH') {
    return `ไลน์ ${lineNum}`;
  }
  return `Line ${lineNum}`;
}
