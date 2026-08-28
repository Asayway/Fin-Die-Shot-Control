import React from 'react';
import { AlertSeverity, OrderStatus } from '../../types';

interface BadgeProps {
  severity?: AlertSeverity;
  orderStatus?: OrderStatus;
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ severity, orderStatus, label, className = '' }) => {
  if (orderStatus) {
    let colorClass = 'bg-slate-800 text-slate-400 border-slate-700';
    if (orderStatus === 'NOT REQUIRED') colorClass = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    if (orderStatus === 'PR PREPARING') colorClass = 'bg-amber-950/60 text-amber-300 border-amber-800/60 animate-pulse';
    if (orderStatus === 'PO OPEN') colorClass = 'bg-rose-950/60 text-rose-400 border-rose-800/60 font-bold';
    if (orderStatus === 'ORDERED') colorClass = 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
    if (orderStatus === 'ARRIVED') colorClass = 'bg-blue-950/60 text-blue-300 border-blue-800/60';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${colorClass} ${className}`}>
        {orderStatus}
      </span>
    );
  }

  if (severity) {
    let colorClass = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
    let text = label || severity;

    if (severity === 'NORMAL') {
      colorClass = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      text = label || 'NORMAL (0-69%)';
    } else if (severity === 'WARNING') {
      colorClass = 'bg-amber-950/80 text-amber-300 border-amber-700';
      text = label || 'WARNING (70-84%)';
    } else if (severity === 'PREPARE') {
      colorClass = 'bg-orange-950/80 text-orange-400 border-orange-700';
      text = label || 'PREPARE (85-94%)';
    } else if (severity === 'CRITICAL') {
      colorClass = 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse font-bold';
      text = label || 'CRITICAL (95-99%)';
    } else if (severity === 'OVER_LIFE') {
      colorClass = 'bg-red-900 text-white border-red-500 font-extrabold animate-bounce';
      text = label || 'OVER LIFE (≥100%)';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wider border ${colorClass} ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
      {label}
    </span>
  );
};
