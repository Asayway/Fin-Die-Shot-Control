export type LanguageCode = 'EN' | 'TH' | 'KO' | 'DUAL';

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
  controls: ControlsTranslations;
  sidebar: SidebarTranslations;
  header: HeaderTranslations;
}

export const TRANSLATIONS: Record<'EN' | 'TH' | 'KO', Dictionary> = {
  EN: {
    table: {
      no: 'NO.',
      partName: 'PART NAME',
      limit: 'LIMIT',
      current: 'CURRENT',
      usage: 'USAGE',
      remain: 'REMAIN',
      progress: 'PROGRESS',
      lastChange: 'LAST CHANGE',
      installed: 'INSTALLED',
      spare: 'SPARE',
      status: 'STATUS'
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
      operations: 'OPERATIONS',
      toolingSetup: 'TOOLING SETUP',
      settings: 'SETTINGS',
      shotEntry: 'Shot Entry',
      tvDashboard: 'TV Dashboard',
      partReplacement: 'Part Replacement',
      dieAndPartMaster: 'Die & Part Master',
      systemSettings: 'System Settings'
    },
    header: {
      subtitle: 'FIN DIE SHOT & LIFETIME MONITOR',
      liveStatus: 'LIVE ONLINE',
      hmiStatus: 'HMI ACTIVE'
    }
  },
  TH: {
    table: {
      no: 'ลำดับ',
      partName: 'ชื่อชิ้นส่วน',
      limit: 'ลิมิตช็อต',
      current: 'ช็อตปัจจุบัน',
      usage: 'สัดส่วน %',
      remain: 'คงเหลือ',
      progress: 'ความคืบหน้า',
      lastChange: 'เปลี่ยนล่าสุด',
      installed: 'ติดตั้ง',
      spare: 'สำรอง',
      status: 'สถานะ'
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
      operations: 'การทำงาน',
      toolingSetup: 'ตั้งค่าแม่พิมพ์',
      settings: 'ตั้งค่าระบบ',
      shotEntry: 'บันทึกช็อต',
      tvDashboard: 'มอนิเตอร์ช็อต',
      partReplacement: 'เปลี่ยนอะไหล่ & ผัง 2D',
      dieAndPartMaster: 'จัดการแม่พิมพ์/อะไหล่',
      systemSettings: 'ตั้งค่าระบบ'
    },
    header: {
      subtitle: 'ระบบควบคุมช็อตแม่พิมพ์และอายุการใช้งาน',
      liveStatus: 'ออนไลน์สด',
      hmiStatus: 'HMI ทำงานอยู่'
    }
  },
  KO: {
    table: {
      no: '번호',
      partName: '부품명',
      limit: '한계 타수',
      current: '현재 타수',
      usage: '사용률',
      remain: '잔여 타수',
      progress: '진행률',
      lastChange: '최종 교체',
      installed: '장착 수량',
      spare: '재고 수량',
      status: '상태'
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
      operations: '운영',
      toolingSetup: '금형 설정',
      settings: '시스템 설정',
      shotEntry: '타수 입력',
      tvDashboard: 'TV 대시보드',
      partReplacement: '부품 교체 및 2D 도면',
      dieAndPartMaster: '금형 및 부품 마스터',
      systemSettings: '시스템 설정'
    },
    header: {
      subtitle: '핀 다이 타수 및 수명 모니터링 시스템',
      liveStatus: '실시간 온라인',
      hmiStatus: 'HMI 활성'
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
