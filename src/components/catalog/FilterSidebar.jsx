import React from 'react';
import { Filter, RotateCcw, Check } from 'lucide-react';
import { FINISH_TYPES } from '../../utils/constants';

export function FilterSidebar({
  categories = [],
  filters = {},
  onFilterChange,
  onResetFilters,
  totalResults = 0
}) {
  const handleCategoryClick = (slug) => {
    onFilterChange('categoria', filters.categoria === slug ? '' : slug);
  };

  const handleFinishClick = (slug) => {
    onFilterChange('acabado', filters.acabado === slug ? '' : slug);
  };

  const activeCount = [
    filters.categoria,
    filters.acabado,
    filters.min,
    filters.max,
    filters.stock === 'true'
  ].filter(Boolean).length;

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-kenpaku-blue" />
          <h3 className="text-base font-bold text-kenpaku-navy">Filtros</h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-kenpaku-orange text-white rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-kenpaku-blue font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 1. Categorías */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Categorías</h4>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange('categoria', '')}
            className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
              !filters.categoria ? 'bg-kenpaku-blue/10 text-kenpaku-blue font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Todas las categorías</span>
          </button>

          {categories.map((cat) => {
            const isActive = filters.categoria === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-kenpaku-blue/10 text-kenpaku-blue font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.nombre}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal">
                  {cat.total || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Acabado de Acero */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tipo de Acabado</h4>
        <div className="space-y-1">
          {FINISH_TYPES.map((finish) => {
            const isActive = filters.acabado === finish.slug;
            return (
              <button
                key={finish.slug}
                onClick={() => handleFinishClick(finish.slug)}
                className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-kenpaku-navy text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{finish.nombre}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-kenpaku-orange" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Rango de Precio (Soles) */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Precio (S/ IGV incl.)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Mínimo</label>
            <input
              type="number"
              value={filters.min || ''}
              onChange={(e) => onFilterChange('min', e.target.value)}
              placeholder="S/ 0"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-kenpaku-blue"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Máximo</label>
            <input
              type="number"
              value={filters.max || ''}
              onChange={(e) => onFilterChange('max', e.target.value)}
              placeholder="S/ 1000"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-kenpaku-blue"
            />
          </div>
        </div>
      </div>

      {/* 4. Solo con Stock Disponible */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filters.stock === 'true'}
            onChange={(e) => onFilterChange('stock', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded text-kenpaku-blue border-slate-300 focus:ring-kenpaku-blue"
          />
          <span>Solo productos con stock disponible</span>
        </label>
      </div>
    </aside>
  );
}
