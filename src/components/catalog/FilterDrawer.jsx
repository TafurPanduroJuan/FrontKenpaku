import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';
import { Button } from '../ui/Button';

export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  filters,
  onFilterChange,
  onResetFilters,
  totalResults
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col">
          <div className="p-4 bg-kenpaku-navy text-white flex items-center justify-between">
            <h3 className="text-base font-bold">Filtros de Búsqueda</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Cerrar filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onFilterChange={onFilterChange}
              onResetFilters={onResetFilters}
              totalResults={totalResults}
            />
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <Button variant="primary" fullWidth onClick={onClose}>
              Ver {totalResults} resultados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
