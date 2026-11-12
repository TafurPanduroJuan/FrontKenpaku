import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { ProductImage } from './ProductImage';
import { formatPEN } from '../../utils/formatPEN';
import { useCart } from '../../hooks/useCart';

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock_estado === 'agotado' || product.stock_disponible <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <article className="group relative flex flex-col rounded-card border border-steel-200 bg-white p-3.5 shadow-card hover:-translate-y-1.5 hover:border-accent-500/50 hover:shadow-lift transition-all duration-300 h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full rounded-2xl bg-white border border-steel-100 overflow-hidden shrink-0">
        <Link to={`/producto/${product.id}`} className="block w-full h-full">
          <ProductImage
            src={product.imagen_url}
            alt={product.nombre}
            categoria={product.categoria}
            finish={product.acabado || 'Negro'}
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <StockBadge status={product.stock_estado} />
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 flex-1 flex flex-col">
        {/* Category kicker */}
        <p className="text-micro font-bold tracking-kicker text-brand-600 uppercase mb-1">
          {product.categoria}
        </p>

        {/* Title */}
        <Link to={`/producto/${product.id}`} className="block mb-1.5">
          <h3 className="font-display text-title leading-snug font-bold text-navy-900 group-hover:text-brand-600 transition-colors line-clamp-2 min-h-[42px]">
            {product.nombre}
          </h3>
        </Link>

        {/* Specs / Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.espesor && (
            <span className="rounded-lg border border-steel-200 bg-steel-50 px-2 py-0.5 text-micro font-medium text-steel-600">
              Espesor {product.espesor}
            </span>
          )}
          {product.medida && (
            <span className="rounded-lg border border-steel-200 bg-steel-50 px-2 py-0.5 text-micro font-medium text-steel-600">
              {product.medida}
            </span>
          )}
          {product.acabado && (
            <span className="rounded-lg border border-steel-200 bg-steel-50 px-2 py-0.5 text-micro font-medium text-steel-600">
              {product.acabado}
            </span>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="mt-auto pt-3 border-t border-dashed border-steel-200 space-y-3">
          <div>
            <span className="num text-price font-extrabold text-navy-900 block leading-none tracking-tight">
              {formatPEN(product.precio_unitario)}
            </span>
            <span className="text-micro text-steel-500 font-medium mt-1 block">IGV incluido</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`
              w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-btn font-semibold text-xs transition-all duration-200 min-h-[42px] select-none active:scale-[0.98]
              ${
                isOutOfStock
                  ? 'bg-steel-100 text-steel-500 border border-steel-200 cursor-not-allowed opacity-60'
                  : 'bg-accent-600 hover:bg-accent-700 text-white shadow-cta hover:shadow-cta-hover hover:-translate-y-px'
              }
            `}
            aria-label={isOutOfStock ? 'Producto agotado' : `Agregar ${product.nombre} al carrito`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isOutOfStock ? 'Agotado' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
