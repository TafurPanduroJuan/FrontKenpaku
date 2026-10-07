import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { StockBadge } from './StockBadge';
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
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#0284C7]/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden h-full">
      {/* Image Container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <Link to={`/producto/${product.id}`} className="block w-full h-full">
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <div className="absolute top-3 left-3">
          <StockBadge status={product.stock_estado} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category tag */}
        <div className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wider mb-1">
          {product.categoria}
        </div>

        {/* Title */}
        <Link to={`/producto/${product.id}`} className="block mb-1.5">
          <h3 className="text-sm font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors line-clamp-2 leading-snug">
            {product.nombre}
          </h3>
        </Link>

        {/* Specs */}
        <p className="text-xs text-slate-500 mb-4 font-medium line-clamp-1">
          {product.espesor ? `Espesor ${product.espesor}` : ''} {product.medida ? `· ${product.medida}` : ''}
        </p>

        {/* Price & Full-width Action Button */}
        <div className="mt-auto space-y-3 pt-2">
          <div>
            <span className="text-lg font-extrabold text-[#0A2540] block leading-none">
              {formatPEN(product.precio_unitario)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">IGV incluido</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`
              w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-xs
              ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#EA580C] hover:bg-[#D97706] text-white active:scale-98'
              }
            `}
            aria-label={isOutOfStock ? 'Producto agotado' : `Agregar ${product.nombre} al carrito`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isOutOfStock ? 'Agotado' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
