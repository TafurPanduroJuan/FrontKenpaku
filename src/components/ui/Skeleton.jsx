import React from 'react';

export function Skeleton({ className = '', variant = 'rectangular' }) {
  const baseClasses = 'animate-pulse bg-slate-200';
  
  const variants = {
    circular: 'rounded-full',
    text: 'h-4 rounded',
    rectangular: 'rounded-lg'
  };

  return <div className={`${baseClasses} ${variants[variant] || variants.rectangular} ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col h-full shadow-sm">
      <Skeleton className="w-full h-44 mb-4" />
      <Skeleton className="w-20 h-4 mb-2" variant="text" />
      <Skeleton className="w-full h-6 mb-2" variant="text" />
      <Skeleton className="w-3/4 h-4 mb-4" variant="text" />
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="w-24 h-6" variant="text" />
        <Skeleton className="w-24 h-10" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="py-4 px-4">
          <Skeleton className="w-full h-4" variant="text" />
        </td>
      ))}
    </tr>
  );
}
