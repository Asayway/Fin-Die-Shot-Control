import React from 'react';
import { ProductionLineId, LINE_INFO_MAP, LineInfoDetails } from '../../types';
import { storageService } from '../../services/storageService';
import { Layers } from 'lucide-react';

export interface LineFilterSelectorProps {
  selectedLine: ProductionLineId | 'ALL' | string;
  onSelectLine: (lineId: any) => void;
  allowAll?: boolean;
  allLabel?: string;
  isHmi?: boolean;
  label?: string;
  className?: string;
  showStatusDot?: boolean;
  showShortTag?: boolean;
}

const LINES_LIST: ProductionLineId[] = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

export const LineFilterSelector: React.FC<LineFilterSelectorProps> = ({
  selectedLine,
  onSelectLine,
  allowAll = false,
  allLabel = 'ALL LINES (E1-E6)',
  isHmi = false,
  label = 'LINE:',
  className = '',
  showStatusDot = true,
  showShortTag = true
}) => {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 flex-wrap ${className}`}>
      {label && (
        <span className={`text-xs sm:text-sm font-mono font-black tracking-wider uppercase mr-0.5 sm:mr-1 flex items-center gap-1 ${
          isHmi ? 'text-green-400' : 'text-cyan-400'
        }`}>
          {label}
        </span>
      )}

      {allowAll && (
        <button
          type="button"
          onClick={() => onSelectLine('ALL')}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all flex items-center gap-1.5 border whitespace-nowrap active:scale-95 ${
            selectedLine === 'ALL'
              ? isHmi
                ? 'bg-green-500 text-black border-green-300 shadow-md ring-2 ring-green-300 scale-105 font-black'
                : 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-md shadow-cyan-400/30 ring-2 ring-cyan-300 scale-105 font-black'
              : isHmi
              ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border-zinc-800'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 opacity-80" />
          <span>{allLabel}</span>
        </button>
      )}

      {LINES_LIST.map(line => {
        const info: LineInfoDetails = LINE_INFO_MAP[line] || {
          id: line,
          name: `LINE ${line}`,
          nameTh: line,
          shortTag: line,
          tubeSize: 'Ø7',
          finType: 'Slit',
          description: line
        };
        const isSelected = selectedLine === line;
        const lineMon = storageService.getLineMonitoring(line);
        const lineStatus = lineMon?.machineStatus || 'RUNNING';
        const displayLine = line.startsWith('E3-') ? 'E3' : line;

        return (
          <button
            key={line}
            type="button"
            onClick={() => onSelectLine(line)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono font-black transition-all flex items-center gap-1.5 border whitespace-nowrap active:scale-95 ${
              isSelected
                ? isHmi
                  ? 'bg-green-500 text-black border-green-300 shadow-lg shadow-green-500/40 ring-2 ring-green-300 scale-105 font-black'
                  : 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-lg shadow-cyan-400/40 ring-2 ring-cyan-300 scale-105 font-black'
                : isHmi
                ? 'bg-zinc-950 hover:bg-zinc-900 text-green-400 border-zinc-800'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/90'
            }`}
          >
            {showStatusDot && (
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  lineStatus === 'RUNNING'
                    ? 'bg-emerald-400 animate-pulse'
                    : lineStatus === 'IDLE'
                    ? 'bg-amber-400'
                    : lineStatus === 'MAINTENANCE'
                    ? 'bg-cyan-400'
                    : 'bg-rose-500'
                }`}
                title={`Status: ${lineStatus}`}
              />
            )}

            <span>{displayLine}</span>

            {showShortTag && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSelected
                    ? isHmi
                      ? 'bg-black text-green-300 font-bold'
                      : 'bg-slate-950 text-cyan-300 font-bold'
                    : isHmi
                    ? 'bg-zinc-900 text-zinc-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {info.shortTag || line}
              </span>
            )}

            {lineStatus === 'STOPPED' && (
              <span className="text-[9px] font-black px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700/60 hidden xl:inline">
                OFF
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
