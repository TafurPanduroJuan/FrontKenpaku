import React from 'react';
import { SORT_OPTIONS } from '../../utils/constants';

export function SortSelect({ value = 'relevancia', onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-xs font-medium text-slate-500 whitespace-nowrap hidden sm:inline">
        Ordenar por:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 py-2 px-3 rounded-lg focus:outline-none focus:border-kenpaku-blue shadow-xs"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
