import React from 'react';
import {
  Tv,
  Wrench,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserRole, AppTheme } from '../../types';
import { useTranslation, LanguageCode } from '../../i18n';

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
  collapsed = false,
  onToggleCollapse
}) => {
  const { t } = useTranslation();

  const sections: NavSection[] = [
    {
      title: t('sidebar.operations', { defaultValue: 'OPERATIONS' }),
      items: [
        {
          id: 'tv-monitoring',
          label: t('sidebar.tvDashboard', { defaultValue: 'TV Dashboard' }),
          icon: Tv,
          badge: 'LIVE',
          badgeColor: 'bg-green-950 text-green-300 border-green-500'
        },
        {
          id: 'replacement-entry',
          label: t('sidebar.partReplacement', { defaultValue: 'Part Replacement' }),
          icon: Wrench,
          badge: '2D Die',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        }
      ]
    },
    {
      title: t('sidebar.toolingSetup', { defaultValue: 'TOOLING SETUP' }),
      items: [
        {
          id: 'unified-tooling-setup',
          label: t('sidebar.dieAndPartMaster', { defaultValue: 'Die & Part Master' }),
          icon: Database,
          badge: 'HUB',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500'
        }
      ]
    },
    {
      title: t('sidebar.settings', { defaultValue: 'SETTINGS' }),
      items: [
        {
          id: 'system-settings',
          label: t('sidebar.systemSettings', { defaultValue: 'System Settings' }),
          icon: Settings
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
        className={`flex flex-col flex-shrink-0 transition-all duration-300 select-none h-full min-h-0 z-40 bg-[#111111] border-r border-[#666666] text-white font-sans ${
          collapsed 
            ? 'hidden md:flex md:w-14' 
            : 'fixed inset-y-0 left-0 w-56 md:relative md:inset-auto md:w-52 lg:w-56'
        }`}
      >
        {/* Top Toggle Button Inside Sidebar */}
        {onToggleCollapse && (
          <div className="p-1.5 border-b flex items-center justify-between border-[#666666] bg-[#111111]">
            <button
              onClick={onToggleCollapse}
              className={`p-1 transition-colors border hover:bg-[#222222] text-white hover:text-[#00ff00] border-[#666666] cursor-pointer ${collapsed ? 'w-full flex justify-center' : 'ml-auto'}`}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle Sidebar Collapse"
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#00ff00]" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-1.5 px-1 space-y-1.5 custom-scrollbar bg-[#111111]">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2 pb-0.5 border-b border-[#666666]">
                  <div className="text-[8.5px] font-bold font-mono tracking-widest uppercase text-[#888888]">
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
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-[#2a2a2a] text-[#00ff00] border-l-3 border-[#00ff00] font-bold'
                          : 'text-slate-300 hover:bg-[#222222] hover:text-white border border-transparent'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                      title={item.label}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-[#00ff00]' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      {!collapsed && (
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div className="truncate">
                            <div className={`text-[11.5px] tracking-tight truncate leading-tight ${
                              isActive ? 'text-[#00ff00] font-bold' : 'text-white group-hover:text-white'
                            }`}>
                              {item.label}
                            </div>
                          </div>
                          {item.badge && (
                            <span
                              className={`ml-1 text-[8px] font-mono px-1 py-0 border font-bold ${
                                isActive
                                  ? 'bg-[#111111] text-[#00ff00] border-[#00ff00]'
                                  : 'bg-[#222222] text-[#cccccc] border-[#666666]'
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
      </aside>
    </>
  );
};
