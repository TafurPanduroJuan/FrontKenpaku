import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
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

  // Rango de precio para el slider dual (0 a 1000 Soles)
  const minVal = Number(filters.min) || 0;
  const maxVal = Number(filters.max) || 1000;
  const minPercent = Math.min(100, Math.max(0, (minVal / 1000) * 100));
  const maxPercent = Math.min(100, Math.max(0, (maxVal / 1000) * 100));

  return (
    <aside className="w-full bg-white rounded-card border border-steel-200 p-5 shadow-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-steel-200 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-600" />
          <h3 className="font-display text-base font-bold text-navy-900">Filtros</h3>
          {activeCount > 0 && (
            <span className="num px-2 py-0.5 text-micro font-bold bg-accent-600 text-white rounded-full">
              {activeCount}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-steel-500 hover:text-accent-600 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 1. Categorías */}
      <div className="space-y-2">
        <h4 className="text-micro font-bold text-steel-600 uppercase tracking-wide">Categorías</h4>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange('categoria', '')}
            className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 rounded-btn font-semibold transition-all ${
              !filters.categoria
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-steel-600 hover:bg-steel-100 hover:text-navy-900'
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
                className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 rounded-btn transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white font-bold shadow-sm'
                    : 'text-steel-600 hover:bg-steel-100 hover:text-navy-900 font-medium'
                }`}
              >
                <span>{cat.nombre}</span>
                <span
                  className={`num text-micro px-2 py-0.5 rounded-full transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-steel-100 text-steel-600'
                  }`}
                >
                  {cat.total || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Acabado de Acero (Pills estilo Figma) */}
      <div className="space-y-2.5 pt-4 border-t border-steel-200">
        <h4 className="text-micro font-bold text-steel-600 uppercase tracking-wide">Tipo de Acabado</h4>
        <div className="flex flex-wrap gap-1.5">
          {FINISH_TYPES.map((finish) => {
            const isActive = filters.acabado === finish.slug;
            return (
              <button
                key={finish.slug}
                onClick={() => handleFinishClick(finish.slug)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all select-none ${
                  isActive
                    ? 'border-accent-600 bg-orange-50 text-accent-700 font-bold shadow-xs'
                    : 'border-steel-200 bg-white text-steel-600 hover:border-navy-900 hover:text-navy-900 font-medium'
                }`}
              >
                {finish.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Rango de Precio con dual slider CSS puro y inputs */}
      <div className="space-y-3 pt-4 border-t border-steel-200">
        <h4 className="text-micro font-bold text-steel-600 uppercase tracking-wide">Precio (S/ IGV incl.)</h4>
        
        {/* Visual Dual Track Bar */}
        <div className="relative h-2 w-full bg-steel-200 rounded-full my-3">
          <div
            className="absolute h-full bg-accent-500 rounded-full"
            style={{
              left: `${Math.min(minPercent, maxPercent)}%`,
              right: `${100 - Math.max(minPercent, maxPercent)}%`
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-micro text-steel-500 font-medium block mb-1">Mínimo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-steel-400">S/</span>
              <input
                type="number"
                min="0"
                max="1000"
                value={filters.min || ''}
                onChange={(e) => onFilterChange('min', e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-2.5 py-2 rounded-btn border border-steel-200 text-xs font-semibold text-navy-900 shadow-inset focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
          </div>
          <div>
            <label className="text-micro text-steel-500 font-medium block mb-1">Máximo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-steel-400">S/</span>
              <input
                type="number"
                min="0"
                max="1000"
                value={filters.max || ''}
                onChange={(e) => onFilterChange('max', e.target.value)}
                placeholder="1000"
                className="w-full pl-8 pr-2.5 py-2 rounded-btn border border-steel-200 text-xs font-semibold text-navy-900 shadow-inset focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Switch Stock Disponible */}
      <div className="pt-4 border-t border-steel-200">
        <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-navy-900 select-none group">
          <span>Solo con stock disponible</span>
          <div
            onClick={() => onFilterChange('stock', filters.stock === 'true' ? '' : 'true')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
              filters.stock === 'true' ? 'bg-emerald-600' : 'bg-steel-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                filters.stock === 'true' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>
    </aside>
  );
}
