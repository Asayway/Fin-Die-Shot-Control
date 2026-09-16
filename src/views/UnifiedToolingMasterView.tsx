import React, { useState } from 'react';
import { 
  Box, 
  Factory,
  Grid3X3
} from 'lucide-react';
import { LineDieSpecificationView } from './LineDieSpecificationView';
import { PartMasterView } from './PartMasterView';
import { InstallQuantityMatrixView } from './InstallQuantityMatrixView';

interface UnifiedToolingMasterViewProps {
  initialTab?: 'specs' | 'master' | 'matrix' | 'install';
}

export const UnifiedToolingMasterView: React.FC<UnifiedToolingMasterViewProps> = ({
  initialTab = 'specs'
}) => {
  const getInitialTab = (): 'specs' | 'master' | 'matrix' => {
    if (initialTab === 'install' || initialTab === 'matrix') return 'matrix';
    if (initialTab === 'master') return 'master';
    return 'specs';
  };

  const [activeTab, setActiveTab] = useState<'specs' | 'master' | 'matrix'>(getInitialTab());

  return (
    <div className="space-y-2.5 animate-fadeIn font-sans text-white pb-4">
      
      {/* Sub-Tabs Navigation Bar (Sticky Locked at Top) */}
      <div className="sticky top-0 z-30 bg-[#0d1117] border-b border-[#30363d] p-1.5 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap font-mono">
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
            <span>1. LINE SPEC</span>
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
            <span>2. PART MASTER</span>
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
            <span>3. PAST INSTALL</span>
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
    </div>
  );
};

