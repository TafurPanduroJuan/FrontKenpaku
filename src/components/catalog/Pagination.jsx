import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage = 1, totalItems = 0, pageSize = 12, onPageChange }) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center space-x-1.5 py-8" aria-label="Paginación">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-btn border border-steel-200 bg-white text-steel-600 hover:border-navy-900 hover:bg-steel-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`num w-10 h-10 text-xs font-bold rounded-btn transition-all ${
              isActive
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-white text-navy-900 hover:bg-steel-50 border border-steel-200 hover:border-steel-300'
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-btn border border-steel-200 bg-white text-steel-600 hover:border-navy-900 hover:bg-steel-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
