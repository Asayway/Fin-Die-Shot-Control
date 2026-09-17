import React, { useState } from 'react';
import { 
  Box, 
  Factory,
  Grid3X3,
  Tv
} from 'lucide-react';
import { LineDieSpecificationView } from './LineDieSpecificationView';
import { PartMasterView } from './PartMasterView';
import { InstallQuantityMatrixView } from './InstallQuantityMatrixView';
import { StockQuantityMatrixView } from './StockQuantityMatrixView';
import { TvDisplayConfigView } from './TvDisplayConfigView';
import { useLanguage } from '../i18n';

interface UnifiedToolingMasterViewProps {
  initialTab?: 'specs' | 'master' | 'matrix' | 'install' | 'stock' | 'tv_display_config';
}

export const UnifiedToolingMasterView: React.FC<UnifiedToolingMasterViewProps> = ({
  initialTab = 'specs'
}) => {
  const { language } = useLanguage();
  const getInitialTab = (): 'specs' | 'master' | 'matrix' | 'stock' | 'tv_display_config' => {
    if (initialTab === 'install' || initialTab === 'matrix') return 'matrix';
    if (initialTab === 'stock') return 'stock';
    if (initialTab === 'master') return 'master';
    if (initialTab === 'tv_display_config') return 'tv_display_config';
    return 'specs';
  };

  const [activeTab, setActiveTab] = useState<'specs' | 'master' | 'matrix' | 'stock' | 'tv_display_config'>(getInitialTab());

  return (
    <div className="space-y-2.5 animate-fadeIn font-sans text-white pb-4">
      
      {/* Sub-Tabs Navigation Bar (Sticky Locked at Top) */}
      <div className="sticky top-0 z-30 bg-[#0d1117] border-b border-[#30363d] p-1.5 shadow-md flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap font-mono min-w-max">
          <button
            id="tab-specs"
            onClick={() => setActiveTab('specs')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 rounded-lg border cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#161b22] text-slate-300 hover:text-white border-[#30363d]'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>
              {language === 'TH' ? '1. สเปคแม่พิมพ์ไลน์' : language === 'KO' ? '1. 라인 금형 사양' : '1. LINE SPEC'}
            </span>
          </button>

          <button
            id="tab-master"
            onClick={() => setActiveTab('master')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 rounded-lg border cursor-pointer ${
              activeTab === 'master'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#161b22] text-slate-300 hover:text-white border-[#30363d]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>
              {language === 'TH' ? '2. มาสเตอร์ชิ้นส่วน' : language === 'KO' ? '2. 부품 마스터' : '2. PART MASTER'}
            </span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 rounded-lg border cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#161b22] text-slate-300 hover:text-white border-[#30363d]'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>
              {language === 'TH' ? '3. จำนวนติดตั้งชิ้นส่วน' : language === 'KO' ? '3. 부품 장착 수량' : '3. PAST INSTALL'}
            </span>
          </button>

          <button
            id="tab-stock"
            onClick={() => setActiveTab('stock')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 rounded-lg border cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-[#161b22] text-slate-300 hover:text-white border-[#30363d]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>
              {language === 'TH' ? '4. จำนวนสต็อกอะไหล่' : language === 'KO' ? '4. 예ับ 부품 재고' : '4. STOCK MATRIX'}
            </span>
          </button>

          <button
            id="tab-tv-display"
            onClick={() => setActiveTab('tv_display_config')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 rounded-lg border cursor-pointer ${
              activeTab === 'tv_display_config'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-[#161b22] text-slate-300 hover:text-white border-[#30363d]'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>
              {language === 'TH' ? '5. ตั้งค่าแสดงผล TV' : language === 'KO' ? '5. TV 표시 설정' : '5. TV DISPLAY CONFIG'}
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'specs' && (
        <div className="pt-0.5">
          <LineDieSpecificationView onAddNewPartClick={() => setActiveTab('master')} />
        </div>
      )}

      {activeTab === 'master' && (
        <div className="pt-0.5">
          <PartMasterView />
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="pt-0.5">
          <InstallQuantityMatrixView onNavigateToMaster={() => setActiveTab('master')} />
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="pt-0.5">
          <StockQuantityMatrixView onNavigateToMaster={() => setActiveTab('master')} />
        </div>
      )}

      {activeTab === 'tv_display_config' && (
        <div className="pt-0.5">
          <TvDisplayConfigView />
        </div>
      )}
    </div>
  );
};

