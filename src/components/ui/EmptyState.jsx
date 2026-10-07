import React from 'react';
import { PackageSearch } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'No encontramos resultados',
  description = 'Intenta ajustar los filtros de búsqueda o consulta directamente con nuestro Asesor Virtual de IA.',
  actionLabel,
  onAction,
  actionVariant = 'primary',
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-kenpaku-blue mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-kenpaku-navy mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
