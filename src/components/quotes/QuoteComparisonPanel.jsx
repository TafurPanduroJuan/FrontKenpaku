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
    <section className="space-y-4 rounded-2xl border border-kenpaku-border bg-kenpaku-card p-4 shadow-soft sm:p-6" aria-label="Comparación de precios">
      <header>
        <h2 className="text-lg font-extrabold text-kenpaku-navy">Comparación con {comparison.proforma.parent_codigo}</h2>
        {unchanged && <p className="mt-1 text-sm text-kenpaku-muted">Los precios no han cambiado desde {new Date(comparison.proforma.fecha_emision).toLocaleDateString('es-PE')}.</p>}
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Anterior" value={formatPEN(comparison.total_anterior)} />
        <SummaryCard label="Nuevo" value={formatPEN(comparison.total_nuevo)} />
        <div className={`rounded-xl border p-4 ${differenceStatus === 'igual' ? 'border-slate-200 bg-slate-50' : differenceStatus === 'bajo' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-xs font-semibold text-slate-600">Diferencia</p>
          <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-kenpaku-navy"><DifferenceIcon className="h-4 w-4" />{formatPEN(Math.abs(difference))}</p>
          <p className="text-xs text-slate-600">{comparison.diferencia_pct == null ? '—' : `${Number(comparison.diferencia_pct).toFixed(2)}%`}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {comparison.comparacion.map((line, index) => {
          const status = comparisonStatus(line);
          return (
            <div key={`${line.texto_original}-${index}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold text-slate-800">{line.nombre_snapshot}</span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>{line.precio_anterior == null ? '—' : formatPEN(line.precio_anterior)}</span>
                <span aria-hidden="true">→</span>
                <span>{line.precio_nuevo == null ? 'Ya no disponible' : formatPEN(line.precio_nuevo)}</span>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-kenpaku-navy">{value}</p>
    </div>
  );
}
