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
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-3 w-full hover:border-kenpaku-blue/40 transition-all">
      <img
        src={product.imagen_url}
        alt={product.nombre}
        className="w-14 h-14 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
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
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 min-h-[36px] ${
          added
            ? 'bg-emerald-600 text-white'
            : isOutOfStock
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-kenpaku-orange hover:bg-kenpaku-orangeHover text-white shadow-xs'
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
