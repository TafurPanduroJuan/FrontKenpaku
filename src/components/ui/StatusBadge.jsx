import React from 'react';

const STATUS_STYLES = {
  con_precio: 'bg-emerald-100 text-emerald-800',
  sin_stock: 'bg-amber-100 text-amber-800',
  no_se_vende: 'bg-slate-100 text-slate-700',
  sugerido: 'bg-blue-100 text-blue-800',
  vigente: 'bg-emerald-100 text-emerald-800',
  vencida: 'bg-red-100 text-red-800',
  subio: 'bg-red-100 text-red-800',
  bajo: 'bg-emerald-100 text-emerald-800',
  igual: 'bg-slate-100 text-slate-700',
  ya_no_disponible: 'bg-slate-100 text-slate-600',
  faltan_datos: 'bg-amber-100 text-amber-800',
};

const STATUS_LABELS = {
  con_precio: 'Con precio',
  sin_stock: 'Sin stock',
  no_se_vende: 'Sin stock',
  sugerido: 'Sugerido',
  vigente: 'Vigente',
  vencida: 'Vencida',
  subio: 'Subió',
  bajo: 'Bajó',
  igual: 'Igual',
  ya_no_disponible: 'Ya no disponible',
  faltan_datos: 'Faltan datos',
};

export function StatusBadge({ status, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[status] || STATUS_STYLES.igual}`}>
      {children || STATUS_LABELS[status] || status}
    </span>
  );
}
