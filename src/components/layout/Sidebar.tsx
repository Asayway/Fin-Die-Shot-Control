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
import { getI18n, LanguageCode } from '../../i18n';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeRoute: string;
  onNavigate: (routeId: string) => void;
  userRole: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: AppTheme;
  language?: LanguageCode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  onNavigate,
  userRole,
  collapsed = false,
  onToggleCollapse,
  theme = 'hmi',
  language = 'EN' as LanguageCode
}) => {
  const isHmi = theme === 'hmi' || theme === 'industrial-dark';
  const isLight = theme === 'light';
  const t = getI18n(language);

  const sections: NavSection[] = [
    {
      title: t.sidebar.operations,
      items: [
        {
          id: 'shot-entry',
          label: t.sidebar.shotEntry,
          icon: PlusCircle,
          badge: 'HMI',
          badgeColor: 'bg-green-950 text-green-300 border-green-500'
        },
        {
          id: 'tv-monitoring',
          label: t.sidebar.tvDashboard,
          icon: Tv,
          badge: 'LIVE',
          badgeColor: 'bg-green-950 text-green-300 border-green-500'
        },
        {
          id: 'replacement-entry',
          label: t.sidebar.partReplacement,
          icon: Wrench,
          badge: '2D Die',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        },
        {
          id: 'regrinding-management',
          label: t.sidebar.regrindingHub,
          icon: RotateCcw,
          badge: 'Grind',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500'
        },
      ]
    },
    {
      title: t.sidebar.toolingSetup,
      items: [
        {
          id: 'unified-tooling-setup',
          label: t.sidebar.dieAndPartMaster,
          icon: SlidersHorizontal,
          badge: 'HUB',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        }
      ]
    },

    {
      title: t.sidebar.settings,
      items: [
        {
          id: 'system-settings',
          label: t.sidebar.systemSettings,
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
            ? 'hidden md:flex md:w-14' 
            : 'fixed inset-y-0 left-0 w-56 md:relative md:inset-auto md:w-52 lg:w-56'
        }`}
      >
      {/* Top Toggle Button Inside Sidebar */}
      {onToggleCollapse && (
        <div className={`p-1.5 border-b flex items-center justify-between ${
          isHmi ? 'border-green-900/60 bg-zinc-950' : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-800/60 bg-slate-950/40'
        }`}>
          <button
            onClick={onToggleCollapse}
            className={`p-1 rounded transition-colors border ${
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
              <ChevronRight className={`w-3.5 h-3.5 ${isHmi ? 'text-green-400' : isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
            ) : (
              <ChevronLeft className={`w-3.5 h-3.5 ${isHmi ? 'text-green-400' : isLight ? 'text-slate-600' : 'text-slate-400'}`} />
            )}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className={`flex-1 overflow-y-auto py-1.5 px-1 space-y-1.5 custom-scrollbar ${
        isHmi ? 'bg-black' : isLight ? 'bg-slate-50' : 'bg-[#0B1120]'
      }`}>
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            {!collapsed && (
              <div className={`px-2 pb-0.5 border-b ${isHmi ? 'border-green-950' : 'border-slate-800/60'}`}>
                <div className={`text-[8.5px] font-bold font-mono tracking-widest uppercase ${
                  isHmi ? 'text-green-500' : 'text-slate-400'
                }`}>
                  {section.title}
                </div>
              </div>
            )}
            <div className="space-y-0.5 pt-0.5">
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
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-all group ${
                      isHmi
                        ? isActive
                          ? 'bg-green-500 text-black border border-green-400 font-extrabold shadow-sm'
                          : 'bg-zinc-950/80 text-green-400 border border-zinc-900 hover:border-green-500/50 hover:bg-green-950/60'
                        : isLight
                        ? isActive
                          ? 'bg-sky-50 text-sky-800 border-l-2 border-sky-600 font-semibold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent'
                        : isActive
                          ? 'bg-cyan-500/15 text-cyan-200 border-l-2 border-cyan-400 font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={item.label}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                        isHmi
                          ? isActive ? 'text-black font-bold' : 'text-green-400 group-hover:text-green-300'
                          : isLight
                          ? isActive ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-900'
                          : isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="truncate">
                          <div className={`text-[11.5px] tracking-tight truncate leading-tight ${
                            isHmi
                              ? isActive ? 'text-black font-extrabold' : 'text-green-300 group-hover:text-green-200'
                              : isLight
                              ? isActive ? 'text-sky-900 font-semibold' : 'text-slate-700 group-hover:text-slate-900'
                              : isActive ? 'text-white font-medium' : 'text-slate-200 group-hover:text-white'
                          }`}>
                            {item.label}
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`ml-1 text-[8px] font-mono px-1 py-0 rounded border font-bold ${
                              isHmi
                                ? isActive
                                ? 'bg-black text-green-400 border-black'
                                : item.badgeColor || 'bg-green-950 text-green-400 border-green-600'
                                : isLight
                                ? isActive
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
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
        <div className={`p-2 border-t text-[9px] space-y-0.5 ${
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
          <div className={`text-[8.5px] truncate font-mono ${isHmi ? 'text-green-600' : 'text-slate-500'}`}>
            HE FIN DIE SHOT CONTROL SYSTEM
          </div>
        </div>
      )}
    </aside>
    </>
  );
};

