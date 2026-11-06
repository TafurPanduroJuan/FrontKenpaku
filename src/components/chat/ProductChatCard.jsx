import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { StockBadge } from '../catalog/StockBadge';
import { formatPEN } from '../../utils/formatPEN';
import { useCart } from '../../hooks/useCart';

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
    <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-white sm:flex-row sm:items-center">
      <img
        src={product.imagen_url}
        alt={product.nombre}
        className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-cover"
      />
      <div className="flex-1 min-w-0">
        <StockBadge status={product.stock_estado} className="mb-1 text-[10px] py-0 px-2" />
        <h4 className="text-xs font-bold text-kenpaku-navy line-clamp-1 leading-snug">
          {product.nombre}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs font-extrabold text-kenpaku-blue">
            {formatPEN(product.precio_unitario)}
          </span>
          <span className="text-[10px] text-slate-400">IGV incl.</span>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenpaku-blue sm:w-auto ${
          added
            ? 'border-slate-300 bg-slate-100 text-slate-700'
            : isOutOfStock
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
        }`}
      >
        {added ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>¡Listo!</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Agotado' : 'Agregar'}</span>
          </>
        )}
      </button>
    </div>
  );
}
