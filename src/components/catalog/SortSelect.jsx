import React from 'react';
import { SORT_OPTIONS } from '../../utils/constants';

export function SortSelect({ value = 'relevancia', onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="sort-select" className="text-micro font-bold uppercase tracking-wider text-steel-500 whitespace-nowrap hidden sm:inline">
        Ordenar por:
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white border border-steel-200 text-xs font-semibold text-navy-900 py-2 pl-3 pr-8 rounded-btn shadow-inset appearance-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-steel-500">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
