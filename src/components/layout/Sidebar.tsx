import React from 'react';
import {
  LayoutDashboard,
  Tv,
  PlusCircle,
  Wrench,
  RotateCcw,
  ClipboardCheck,
  Settings2,
  Box,
  Sliders,
  Layers,
  Package,
  History,
  BarChart3,
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  labelTh: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: UserRole[];
}

interface NavSection {
  title: string;
  titleTh: string;
  items: NavItem[];
}

interface SidebarProps {
  activeRoute: string;
  onNavigate: (routeId: string) => void;
  userRole: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onNavigate,
  userRole,
  collapsed = false,
  onToggleCollapse
}) => {
  const sections: NavSection[] = [
    {
      title: 'OPERATIONAL & MONITORING',
      titleTh: 'การทำงานและมอนิเตอร์สด',
      items: [
        {
          id: 'line-overview',
          label: 'Line Overview',
          labelTh: 'ภาพรวมสาย E1-E6',
          icon: LayoutDashboard,
          badge: '8 Lines'
        },
        {
          id: 'tv-monitoring',
          label: 'TV Monitoring',
          labelTh: 'จอ TV มอนิเตอร์ช็อต',
          icon: Tv,
          badge: 'LIVE',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'shot-entry',
          label: 'Shot Entry',
          labelTh: 'บันทึกยอดช็อต',
          icon: PlusCircle
        },
        {
          id: 'replacement-entry',
          label: 'Replacement Entry',
          labelTh: 'บันทึกเปลี่ยนอะไหล่',
          icon: Wrench,
          badge: 'Actions'
        },
        {
          id: 'regrinding-entry',
          label: 'Re-grinding Entry',
          labelTh: 'ส่งเจียระไนลับคม',
          icon: RotateCcw
        },
        {
          id: 'condition-inspection',
          label: 'Condition Inspection',
          labelTh: 'ตรวจสอบสภาพ/ครีบฟิน',
          icon: ClipboardCheck
        }
      ]
    },
    {
      title: 'ENGINEERING & SETUP',
      titleTh: 'วิศวกรรมแม่พิมพ์และการตั้งค่า',
      items: [
        {
          id: 'line-configuration',
          label: 'Line Configuration',
          labelTh: 'กำหนดสเปกแม่พิมพ์/วัสดุ',
          icon: Settings2
        },
        {
          id: 'part-master',
          label: 'Part Master',
          labelTh: 'ฐานข้อมูลชิ้นส่วนแม่พิมพ์',
          icon: Box
        },
        {
          id: 'life-standard-setup',
          label: 'Life Standard Setup',
          labelTh: 'เกณฑ์อายุช็อต (10 Keys)',
          icon: Sliders,
          badge: 'Excel 31.01',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        {
          id: 'install-quantity-setup',
          label: 'Install Quantity Setup',
          labelTh: 'จำนวนติดตั้งในแม่พิมพ์',
          icon: Layers,
          badge: '11,281 EA'
        }
      ]
    },
    {
      title: 'STOCK & AUDIT TRAIL',
      titleTh: 'คลังอะไหล่และประวัติการทำงาน',
      items: [
        {
          id: 'spare-stock',
          label: 'Spare Stock & PR/PO',
          labelTh: 'สต็อกอะไหล่และการสั่งซื้อ',
          icon: Package,
          badge: 'PO Risk'
        },
        {
          id: 'replacement-history',
          label: 'Replacement History',
          labelTh: 'ประวัติการเปลี่ยนชิ้นส่วน',
          icon: History
        },
        {
          id: 'reports',
          label: 'Reports & MTBF',
          labelTh: 'รายงานและการวิเคราะห์',
          icon: BarChart3
        }
      ]
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      titleTh: 'การกำกับดูแลและระบบ',
      items: [
        {
          id: 'user-approval',
          label: 'User & Approvals',
          labelTh: 'ผู้ใช้งานและการอนุมัติ',
          icon: ShieldCheck
        },
        {
          id: 'audit-log',
          label: 'Audit Log',
          labelTh: 'บันทึกประวัติการเปลี่ยนแปลง',
          icon: FileText
        },
        {
          id: 'system-settings',
          label: 'System Settings',
          labelTh: 'ตั้งค่าระบบ & Seed Data',
          icon: SlidersHorizontal
        }
      ]
    }
  ];

  return (
    <aside
      className={`bg-[#0B1120] border-r border-slate-800/80 text-slate-200 flex flex-col flex-shrink-0 transition-all duration-300 relative select-none shadow-lg ${
        collapsed ? 'w-16' : 'w-64 lg:w-72'
      }`}
    >
      {/* Top Toggle Button Inside Sidebar */}
      {onToggleCollapse && (
        <div className="p-2 border-b border-slate-800/60 flex items-center justify-between">
          {!collapsed && (
            <span className="text-[11px] font-mono font-medium text-slate-400 px-2 tracking-wide">
              NAVIGATION MENU
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors ${
              collapsed ? 'w-full flex justify-center' : 'ml-auto'
            }`}
            title={collapsed ? "ขยายเมนูด้านข้าง (Expand Sidebar)" : "ย่อเมนูด้านข้าง (Collapse Sidebar)"}
            aria-label="Toggle Sidebar Collapse"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1">
                <div className="text-[10px] font-bold font-mono tracking-wider text-slate-400/90 uppercase">
                  {section.title}
                </div>
                <div className="text-[9px] text-slate-500 font-thai">
                  {section.titleTh}
                </div>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all group ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-200 border-l-4 border-cyan-400 font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={`${item.label} (${item.labelTh})`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="truncate">
                          <div className="text-xs font-normal tracking-normal truncate leading-tight text-slate-200 group-hover:text-white">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate leading-tight font-thai mt-0.5">
                            {item.labelTh}
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                              item.badgeColor || 'bg-slate-800/90 text-slate-400 border-slate-700/80'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>DATA SOURCE</span>
            <span className="text-emerald-400 font-semibold">EXCEL REV 31.01.2025</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            0. Control shot Spare Parts FIN DIES
          </div>
        </div>
      )}
    </aside>
  );
};

