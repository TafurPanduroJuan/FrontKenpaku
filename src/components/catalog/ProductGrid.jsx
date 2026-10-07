import React from 'react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

export function ProductGrid({ products = [], isLoading = false, onAskAdvisor }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="No encontramos resultados"
          description="Prueba ajustando los filtros de precio, categoría o acabado. También puedes consultar directamente con nuestro Asesor IA."
          actionLabel="Pregúntale al Asesor IA"
          onAction={onAskAdvisor}
          actionVariant="primary"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
