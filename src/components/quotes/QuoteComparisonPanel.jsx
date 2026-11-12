import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { formatPEN } from '../../utils/formatPEN';
import { StatusBadge } from '../ui/StatusBadge';

function comparisonStatus(line) {
  if (line.estado === 'ya_no_disponible' || line.precio_nuevo == null) return 'ya_no_disponible';
  const difference = Number(line.diferencia ?? Number(line.precio_nuevo) - Number(line.precio_anterior));
  if (difference > 0) return 'subio';
  if (difference < 0) return 'bajo';
  return 'igual';
}

export function QuoteComparisonPanel({ comparison }) {
  if (!comparison) return null;
  const difference = Number(comparison.diferencia);
  const differenceStatus = difference > 0 ? 'subio' : difference < 0 ? 'bajo' : 'igual';
  const DifferenceIcon = difference > 0 ? ArrowUp : difference < 0 ? ArrowDown : Minus;
  const unchanged = comparison.comparacion.every((line) => comparisonStatus(line) === 'igual');

  return (
    <section className="space-y-4 rounded-card border border-steel-200 bg-white p-5 shadow-card sm:p-6" aria-label="Comparación de precios">
      <header>
        <h2 className="font-display text-lg font-bold text-navy-900">
          Comparación con proforma {comparison.proforma.parent_codigo}
        </h2>
        {unchanged && (
          <p className="mt-1 text-xs text-steel-500 font-medium">
            Los precios no han variado desde el {new Date(comparison.proforma.fecha_emision).toLocaleDateString('es-PE')}.
          </p>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Monto Anterior" value={formatPEN(comparison.total_anterior)} />
        <SummaryCard label="Monto Actualizado" value={formatPEN(comparison.total_nuevo)} />
        <div className={`rounded-btn border p-4 shadow-xs ${
          differenceStatus === 'igual'
            ? 'border-steel-200 bg-steel-50'
            : differenceStatus === 'bajo'
            ? 'border-emerald-200 bg-emerald-50/70'
            : 'border-red-200 bg-red-50/70'
        }`}>
          <p className="text-micro font-bold text-steel-500 uppercase tracking-wide">Diferencia</p>
          <p className="mt-1 flex items-center gap-1.5 num text-lg font-black text-navy-900">
            <DifferenceIcon className="h-4 w-4" />
            <span>{formatPEN(Math.abs(difference))}</span>
          </p>
          <p className="num text-micro text-steel-600 font-semibold mt-0.5">
            {comparison.diferencia_pct == null ? '—' : `${Number(comparison.diferencia_pct).toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div className="divide-y divide-steel-100 rounded-btn border border-steel-200 overflow-hidden bg-white">
        {comparison.comparacion.map((line, index) => {
          const status = comparisonStatus(line);
          return (
            <div key={`${line.texto_original}-${index}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between hover:bg-steel-50/50 transition-colors">
              <span className="text-xs font-semibold text-navy-900">{line.nombre_snapshot}</span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-steel-600">
                <span className="num">{line.precio_anterior == null ? '—' : formatPEN(line.precio_anterior)}</span>
                <span aria-hidden="true" className="text-steel-400">→</span>
                <span className="num font-bold text-navy-900">{line.precio_nuevo == null ? 'Ya no disponible' : formatPEN(line.precio_nuevo)}</span>
                <StatusBadge status={status} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-btn border border-steel-200 bg-white p-4 shadow-xs">
      <p className="text-micro font-bold text-steel-500 uppercase tracking-wide">{label}</p>
      <p className="num mt-1 text-lg font-extrabold text-navy-900">{value}</p>
    </div>
  );
}
