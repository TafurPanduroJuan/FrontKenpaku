import React from 'react';

const STATUS_STYLES = {
  con_precio: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  sin_stock: 'bg-steel-100 text-steel-600 border-steel-200',
  no_se_vende: 'bg-steel-100 text-steel-600 border-steel-200',
  sugerido: 'bg-steel-100 text-steel-600 border-steel-200',
  vigente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  vencida: 'bg-red-100 text-red-800 border-red-200',
  subio: 'bg-red-100 text-red-800 border-red-200',
  bajo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  igual: 'bg-steel-100 text-steel-600 border-steel-200',
  ya_no_disponible: 'bg-steel-100 text-steel-600 border-steel-200',
  faltan_datos: 'bg-orange-100 text-accent-700 border-orange-200',
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
    <span className={`cut inline-flex items-center px-2.5 py-1 text-micro font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.igual}`}>
      {children || STATUS_LABELS[status] || status}
    </span>
  );
}
