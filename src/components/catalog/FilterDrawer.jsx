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
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-lift flex flex-col">
          <div className="steel-texture p-4 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
            <h3 className="font-display text-base font-bold text-white">Filtros de Búsqueda</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-steel-400 hover:text-white rounded-btn hover:bg-white/10 transition-colors"
              aria-label="Cerrar filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-steel-50">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onFilterChange={onFilterChange}
              onResetFilters={onResetFilters}
              totalResults={totalResults}
            />
          </div>

          <div className="p-4 bg-white border-t border-steel-200">
            <Button variant="primary" fullWidth onClick={onClose}>
              Ver {totalResults} resultados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
