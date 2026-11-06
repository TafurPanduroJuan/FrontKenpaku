import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatPEN } from '../../utils/formatPEN';
import { StatusBadge } from '../ui/StatusBadge';

function description(product) {
  return [product.nombre, product.medida, product.acabado].filter(Boolean).join(' · ');
}

export function SuggestionCard({ product, products, onAccept, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  const options = products?.length ? products : product ? [product] : [];
  const visibleOptions = expanded ? options : options.slice(0, 1);
  if (!options.length) return null;

  return (
    <div className="mt-2 space-y-1.5" aria-label="Alternativas disponibles">
      {visibleOptions.map((option, index) => (
        <article key={option.product_id || `${option.nombre}-${index}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-xs text-slate-700">
            {index === 0 && <div className="mb-1"><StatusBadge status="sugerido" /></div>}
            <p className="font-medium">Alternativa disponible: {description(option)} — {formatPEN(option.precio_unitario)}</p>
          </div>
          {onAccept && (
            <button type="button" disabled={disabled} onClick={() => onAccept(option)}
              className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenpaku-blue disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          )}
        </article>
      ))}
      {options.length > 1 && (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}
          className="min-h-10 px-1 text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenpaku-blue">
          {expanded ? 'Ver menos opciones' : 'Ver más opciones'}
        </button>
      )}
    </div>
  );
}
