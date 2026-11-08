import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { StockBadge } from '../catalog/StockBadge';
import { formatPEN } from '../../utils/formatPEN';
import { useCart } from '../../hooks/useCart';
import { ProductImage } from '../catalog/ProductImage';

export function ProductChatCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock_estado === 'agotado' || (product.stock_disponible !== undefined && product.stock_disponible <= 0);

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-steel-200 bg-white p-3 shadow-card transition-colors hover:border-steel-300">
      <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-steel-200 bg-steel-100">
        <ProductImage src={product.imagen_url} alt={product.nombre} padding="p-1" />
      </div>
      <div className="flex-1 min-w-0">
        <StockBadge status={product.stock_estado} className="mb-1 text-micro py-0.5 px-2" />
        <h4 className="text-xs font-bold text-navy-900 line-clamp-1 leading-snug">
          {product.nombre}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="num text-xs sm:text-sm font-extrabold text-brand-600">
            {formatPEN(product.precio_unitario)}
          </span>
          <span className="text-micro text-steel-400 font-medium">IGV incl.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-btn px-3.5 py-2 text-xs font-bold transition-all active:scale-95 sm:w-auto ${
          added
            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
            : isOutOfStock
            ? 'cursor-not-allowed border border-steel-200 bg-steel-100 text-steel-400 opacity-60'
            : 'bg-accent-600 hover:bg-accent-700 text-white shadow-cta'
        }`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>¡Listo!</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'Agotado' : 'Agregar'}</span>
          </>
        )}
      </button>
    </div>
  );
}