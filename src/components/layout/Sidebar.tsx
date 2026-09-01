import React from 'react';
import {
  Tv,
  Map,
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
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react';
import { UserRole, AppTheme } from '../../types';

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
  theme?: AppTheme;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onNavigate,
  userRole,
  collapsed = false,
  onToggleCollapse,
  theme = 'hmi'
}) => {
  const isHmi = theme === 'hmi' || theme === 'industrial-dark';
  const isLight = theme === 'light';

  const sections: NavSection[] = [
    {
      title: 'OPERATIONAL & MONITORING',
      titleTh: 'การทำงานและมอนิเตอร์สด',
      items: [
        {
          id: 'shot-entry',
          label: 'Shot Entry (Manual/PLC)',
          labelTh: 'บันทึกยอดช็อตหน้าไลน์',
          icon: PlusCircle,
          badge: 'HMI',
          badgeColor: 'bg-green-950 text-green-300 border-green-500'
        },
        {
          id: 'tv-monitoring',
          label: 'TV Monitoring Wall',
          labelTh: 'จอ TV มอนิเตอร์ช็อต',
          icon: Tv,
          badge: 'LIVE',
          badgeColor: 'bg-green-950 text-green-300 border-green-500'
        },
        {
          id: 'replacement-entry',
          label: 'Replacement Entry',
          labelTh: 'บันทึกเปลี่ยนอะไหล่ & ผังแม่พิมพ์ 2D',
          icon: Wrench,
          badge: 'Hub',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        },
        {
          id: 'regrinding-entry',
          label: 'Re-grinding Entry',
          labelTh: 'ส่งเจียระไนลับคม',
          icon: RotateCcw
        },
      ]
    },
    {
      title: 'ENGINEERING & SETUP',
      titleTh: 'วิศวกรรมแม่พิมพ์และการตั้งค่า',
      items: [
        {
          id: 'unified-tooling-setup',
          label: 'Fin Die & Spare Master Hub',
          labelTh: 'ศูนย์จัดการแม่พิมพ์และอะไหล่',
          icon: SlidersHorizontal,
          badge: 'HUB',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        }
      ]
    },
    {
      title: 'STOCK & SPARE PARTS',
      titleTh: 'คลังอะไหล่และรายงาน',
      items: [
        {
          id: 'reports',
          label: 'Reports & Analytics',
          labelTh: 'รายงานและการวิเคราะห์',
          icon: BarChart3
        }
      ]
    },
    {
      title: 'SYSTEM CONFIGURATION',
      titleTh: 'การตั้งค่าและระบบ',
      items: [
        {
          id: 'system-settings',
          label: 'System Settings & Apps Script',
          labelTh: 'ตั้งค่าระบบ & ซิงค์ข้อมูล',
          icon: SlidersHorizontal
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop (Mobile only) */}
      {!collapsed && (
        <div 
          onClick={onToggleCollapse}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 select-none shadow-2xl h-full min-h-0 z-40 ${
          isHmi 
            ? 'bg-black border-r-2 border-green-500/80 text-green-400 font-mono' 
            : isLight
            ? 'bg-slate-50 border-r border-slate-300 text-slate-800 font-sans'
            : 'bg-[#0B1120] border-r border-slate-800/80 text-slate-200 font-sans'
        } ${
          // Mobile vs Desktop responsive positioning
          collapsed 
            ? 'hidden md:flex md:w-16' 
            : 'fixed inset-y-0 left-0 w-72 md:relative md:inset-auto md:w-64 lg:w-72'
        }`}
      >
      {/* Top Toggle Button Inside Sidebar */}
      {onToggleCollapse && (
        <div className={`p-2 border-b flex items-center justify-between ${
          isHmi ? 'border-green-900/60 bg-zinc-950' : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800/60 bg-slate-950/40'
        }`}>
          {!collapsed && (
            <span className={`text-[11px] font-bold px-2 tracking-wider uppercase ${
              isHmi ? 'font-mono text-green-400' : isLight ? 'font-mono text-slate-700' : 'font-mono text-slate-400'
            }`}>
              {isHmi ? 'HMI MENU' : 'NAVIGATION'}
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded transition-colors border ${
              isHmi
                ? 'hover:bg-green-950 text-green-400 hover:text-green-200 border-green-900/50'
                : isLight
                ? 'hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800'
            } ${collapsed ? 'w-full flex justify-center' : 'ml-auto'}`}
            title={collapsed ? "ขยายเมนู (Expand Sidebar)" : "ย่อเมนู (Collapse Sidebar)"}
            aria-label="Toggle Sidebar Collapse"
          >
            {collapsed ? (
              <ChevronRight className={`w-4 h-4 ${isHmi ? 'text-green-400' : isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
            ) : (
              <ChevronLeft className={`w-4 h-4 ${isHmi ? 'text-green-400' : isLight ? 'text-slate-600' : 'text-slate-400'}`} />
            )}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className={`flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar ${
        isHmi ? 'bg-black' : isLight ? 'bg-slate-50' : 'bg-[#0B1120]'
      }`}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <div className={`px-3 pb-1 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/60'}`}>
                <div className={`text-[10px] font-bold font-mono tracking-widest uppercase ${
                  isHmi ? 'text-green-500' : 'text-slate-400'
                }`}>
                  {section.title}
                </div>
                <div className={`text-[9px] font-thai ${isHmi ? 'text-green-600/90' : 'text-slate-500'}`}>
                  {section.titleTh}
                </div>
              </div>
            )}
            <div className="space-y-1 pt-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggleCollapse) {
                        onToggleCollapse();
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-all group ${
                      isHmi
                        ? isActive
                          ? 'bg-green-500 text-black border border-green-400 font-extrabold shadow-md shadow-green-500/20'
                          : 'bg-zinc-950/80 text-green-400 border border-zinc-900 hover:border-green-500/50 hover:bg-green-950/60'
                        : isActive
                          ? 'bg-cyan-500/15 text-cyan-200 border-l-4 border-cyan-400 font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={`${item.label} (${item.labelTh})`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isHmi
                          ? isActive ? 'text-black font-bold' : 'text-green-400 group-hover:text-green-300'
                          : isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="truncate">
                          <div className={`text-xs tracking-tight truncate leading-tight ${
                            isHmi
                              ? isActive ? 'text-black font-extrabold' : 'text-green-300 group-hover:text-green-200'
                              : isActive ? 'text-white font-medium' : 'text-slate-200 group-hover:text-white'
                          }`}>
                            {item.label}
                          </div>
                          <div className={`text-[10px] truncate leading-tight font-thai mt-0.5 ${
                            isHmi
                              ? isActive ? 'text-zinc-900 font-semibold' : 'text-green-500/80'
                              : isActive ? 'text-cyan-300/80' : 'text-slate-400'
                          }`}>
                            {item.labelTh}
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                              isHmi
                                ? isActive
                                  ? 'bg-black text-green-400 border-black'
                                  : item.badgeColor || 'bg-green-950 text-green-400 border-green-600'
                                : isActive
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                                  : item.badgeColor || 'bg-slate-800/90 text-slate-400 border-slate-700/80'
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
        <div className={`p-2.5 border-t text-[10px] space-y-1 ${
          isHmi 
            ? 'border-green-900/80 bg-zinc-950 text-green-500/80' 
            : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
        }`}>
          <div className="flex items-center justify-between font-mono">
            <span>DATA SOURCE</span>
            <span className={isHmi ? 'text-green-400 font-bold' : 'text-emerald-400 font-semibold'}>
              EXCEL 31.01.2025
            </span>
          </div>
          <div className={`text-[9px] truncate font-mono ${isHmi ? 'text-green-600' : 'text-slate-500'}`}>
            HE FIN DIE SHOT CONTROL SYSTEM
          </div>
        </div>
      )}
    </aside>
    </>
  );
};

