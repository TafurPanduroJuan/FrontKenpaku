import React from 'react';
import { STOCK_STATUS } from '../../utils/constants';

export function StockBadge({ status = 'disponible', className = '' }) {
  const statusKey = (status || '').toUpperCase();
  const config = STOCK_STATUS[statusKey] || STOCK_STATUS.DISPONIBLE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
}
