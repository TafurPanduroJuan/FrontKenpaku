import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
      <Link to="/" className="inline-flex items-center hover:text-kenpaku-blue transition-colors">
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Inicio</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast || !item.url ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{item.label}</span>
            ) : (
              <Link to={item.url} className="hover:text-kenpaku-blue transition-colors">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
