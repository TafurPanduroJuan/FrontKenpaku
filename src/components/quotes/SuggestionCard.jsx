import React from 'react';
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
    <div className="mt-2 space-y-2" aria-label="Alternativas disponibles">
      {visibleOptions.map((option, index) => (
        <article
          key={option.product_id || `${option.nombre}-${index}`}
          className="flex flex-col gap-2 rounded-btn border border-steel-200 bg-steel-50/70 p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs"
        >
          <div className="min-w-0 text-xs text-navy-900">
            {index === 0 && <div className="mb-1"><StatusBadge status="sugerido" /></div>}
            <p className="font-medium">
              <span className="text-steel-600">Alternativa disponible: </span>
              <strong className="text-navy-900">{description(option)}</strong> —{' '}
              <span className="num font-extrabold text-navy-900">{formatPEN(option.precio_unitario)}</span>
            </p>
          </div>
          {onAccept && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAccept(option)}
              className="inline-flex min-h-[36px] w-full shrink-0 items-center justify-center gap-1.5 rounded-btn border border-steel-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:border-navy-900 hover:bg-steel-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all sm:w-auto shadow-xs active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-accent-600 stroke-[2.5]" />
              <span>Agregar</span>
            </button>
          )}
        </article>
      ))}
      {options.length > 1 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-[36px] px-1 text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors cursor-pointer"
        >
          {expanded ? 'Ver menos opciones' : `Ver ${options.length - 1} alternativas más`}
        </button>
      )}
    </div>
  );
}
