import React from 'react';
import { STOCK_STATUS } from '../../utils/constants';

export function StockBadge({ status = 'disponible', className = '' }) {
  const statusKey = (status || '').toUpperCase();
  const config = STOCK_STATUS[statusKey] || STOCK_STATUS.DISPONIBLE;

  // Variantes temáticas alineadas a figma-referencia
  const isAgotado = statusKey === 'AGOTADO';
  const isPocas = statusKey === 'POCAS_UNIDADES';

  const toneClass = isAgotado
    ? 'bg-steel-100 text-steel-600 border-steel-200'
    : isPocas
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <span
      className={`cut inline-flex items-center gap-1.5 px-2.5 py-1 text-micro font-bold border ${toneClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAgotado ? 'bg-steel-500' : isPocas ? 'bg-amber-600' : 'bg-emerald-600'}`} />
      <span>{config.label}</span>
    </span>
  );
}
