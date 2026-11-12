import React from 'react';

export function Skeleton({ className = '', variant = 'rectangular' }) {
  const baseClasses = 'skeleton';
  
  const variants = {
    circular: 'rounded-full',
    text: 'h-4 rounded-md',
    rectangular: 'rounded-btn'
  };

  return <div className={`${baseClasses} ${variants[variant] || variants.rectangular} ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-card border border-steel-200 p-4 flex flex-col h-full shadow-card">
      <Skeleton className="w-full h-44 mb-4 rounded-2xl" />
      <Skeleton className="w-20 h-3.5 mb-2.5" variant="text" />
      <Skeleton className="w-full h-5 mb-2.5" variant="text" />
      <Skeleton className="w-3/4 h-3.5 mb-4" variant="text" />
      <div className="mt-auto pt-3 border-t border-dashed border-steel-200 flex items-center justify-between">
        <Skeleton className="w-24 h-6" variant="text" />
        <Skeleton className="w-24 h-10 rounded-btn" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-steel-100">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="py-4 px-4">
          <Skeleton className="w-full h-4" variant="text" />
        </td>
      ))}
    </tr>
  );
}
