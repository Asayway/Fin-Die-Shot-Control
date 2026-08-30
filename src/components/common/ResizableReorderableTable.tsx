import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  RotateCcw,
  GripVertical
} from 'lucide-react';

export interface ColumnDef<T> {
  id: string;
  label: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => React.ReactNode;
}

interface ResizableReorderableTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  className?: string;
  emptyMessage?: string;
}

export function ResizableReorderableTable<T>({
  columns: initialColumns,
  data,
  keyExtractor,
  className = '',
  emptyMessage = 'ไม่พบข้อมูล'
}: ResizableReorderableTableProps<T>) {
  // State for column order (array of column IDs)
  const [colOrder, setColOrder] = useState<string[]>(initialColumns.map(c => c.id));
  
  // State for column widths
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    initialColumns.forEach(c => {
      widths[c.id] = c.width || 140;
    });
    return widths;
  });

  // State for column visibility
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    initialColumns.forEach(c => {
      vis[c.id] = true;
    });
    return vis;
  });

  // Controls drawer/popover toggle
  const [showColSettings, setShowColSettings] = useState(false);

  // Column Drag & Resize logic
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = colWidths[colId] || 120;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const colDef = initialColumns.find(c => c.id === colId);
      const minW = colDef?.minWidth || 50;
      const newWidth = Math.max(minW, startWidth + (moveEvent.pageX - startX));
      setColWidths(prev => ({ ...prev, [colId]: newWidth }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Reorder column helper
  const moveColumn = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...colOrder];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setColOrder(newOrder);
  };

  // Reset to default
  const resetLayout = () => {
    setColOrder(initialColumns.map(c => c.id));
    const widths: Record<string, number> = {};
    const vis: Record<string, boolean> = {};
    initialColumns.forEach(c => {
      widths[c.id] = c.width || 140;
      vis[c.id] = true;
    });
    setColWidths(widths);
    setColVisibility(vis);
  };

  // Map active columns in order
  const orderedColumns = colOrder
    .map(id => initialColumns.find(c => c.id === id))
    .filter((c): c is ColumnDef<T> => c !== undefined && colVisibility[c.id] !== false);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Column Customizer Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
        <div className="text-slate-400 font-mono flex items-center gap-2">
          <span>ความกว้างและลำดับคอลัมน์ปรับแต่งได้ (Resizable & Reorderable Table)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColSettings(!showColSettings)}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-cyan-300 font-mono flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>ปรับแต่งคอลัมน์ ({orderedColumns.length}/{initialColumns.length})</span>
          </button>
          
          <button
            type="button"
            onClick={resetLayout}
            title="รีเซ็ตตำแหน่งและความกว้างเดิม"
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column Customizer Drawer */}
      {showColSettings && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs space-y-2 animate-fadeIn">
          <div className="font-bold text-cyan-300 font-mono border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>การแสดงผลและการจัดลำดับคอลัมน์ (Column Controls)</span>
            <span className="text-[11px] text-slate-400 font-normal">กดลูกศรเพื่อเลื่อนตำแหน่ง หรือสวิตช์เปิด/ปิด</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {colOrder.map((colId, idx) => {
              const col = initialColumns.find(c => c.id === colId);
              if (!col) return null;
              const isVisible = colVisibility[colId] !== false;

              return (
                <div key={colId} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      type="button"
                      onClick={() => setColVisibility(prev => ({ ...prev, [colId]: !isVisible }))}
                      className={`p-1 rounded border ${isVisible ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                      title={isVisible ? 'ซ่อนคอลัมน์นี้' : 'แสดงคอลัมน์นี้'}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <span className={`truncate ${isVisible ? 'text-white font-bold' : 'text-slate-500 line-through'}`}>
                      {col.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveColumn(idx, 'left')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === colOrder.length - 1}
                      onClick={() => moveColumn(idx, 'right')}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-30"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Resizable & Scrollable Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#070F1E] shadow-inner custom-scrollbar">
        <table className="w-full text-left border-collapse font-sans text-sm sm:text-base md:text-lg">
          {/* Table Header */}
          <thead>
            <tr className="bg-[#0B172E] border-b border-slate-800 text-cyan-300 font-mono font-black uppercase select-none text-sm sm:text-base">
              {orderedColumns.map((col, idx) => {
                const width = colWidths[col.id] || col.width || 140;
                const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';

                return (
                  <th
                    key={col.id}
                    style={{ width: `${width}px`, minWidth: `${col.minWidth || 50}px` }}
                    className={`relative px-3 py-3.5 font-extrabold tracking-wider border-r border-slate-800/80 ${alignClass} group`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{col.label}</span>
                      
                      {/* Reorder arrows in header on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => moveColumn(idx, 'left')}
                            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {idx < orderedColumns.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveColumn(idx, 'right')}
                            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Resizer Handle */}
                    <div
                      onMouseDown={e => handleResizeStart(e, col.id)}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-400 z-10"
                      title="ลากเพื่อปรับขนาดคอลัมน์"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80 font-mono font-bold text-sm sm:text-base">
            {data.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length} className="px-4 py-8 text-center text-slate-500 font-thai">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={keyExtractor(row, rowIndex)} className="hover:bg-slate-900/60 transition-colors">
                  {orderedColumns.map(col => {
                    const width = colWidths[col.id] || col.width || 140;
                    const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';

                    return (
                      <td
                        key={col.id}
                        style={{ width: `${width}px` }}
                        className={`px-3 py-3 border-r border-slate-800/60 ${alignClass}`}
                      >
                        {col.render(row, rowIndex)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
