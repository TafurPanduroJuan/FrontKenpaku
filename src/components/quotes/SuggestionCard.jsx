import React from 'react';
import { Plus } from 'lucide-react';
import { formatPEN } from '../../utils/formatPEN';
import { StatusBadge } from '../ui/StatusBadge';

export function SuggestionCard({ product, onAccept, disabled = false }) {
  return (
    <article className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1"><StatusBadge status="sugerido" /></div>
          <h3 className="text-sm font-bold text-kenpaku-navy">{product.nombre}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {[product.medida, product.acabado, product.espesor].filter(Boolean).join(' · ') || 'Especificaciones disponibles en catálogo'}
          </p>
          <p className="mt-2 text-sm font-extrabold text-kenpaku-navy">{formatPEN(product.precio_unitario)}</p>
        </div>
        <button type="button" disabled={disabled} onClick={onAccept} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-kenpaku-orange px-3 py-2 text-xs font-bold text-white hover:bg-kenpaku-orangeHover disabled:opacity-50">
          <Plus className="h-4 w-4" /> Agregar a la cotización
        </button>
      </div>
    </article>
  );
}
