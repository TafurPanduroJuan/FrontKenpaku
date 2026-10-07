import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../ui/Button';

export function CartDrawer() {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, subtotal, igv, total } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) closeCart();
    };
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-kenpaku-navy text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-kenpaku-orange" />
              <h2 className="text-lg font-bold">Tu Carrito de Compra</h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-500 mb-6">Explora nuestro catálogo y agrega tubos, perfiles, planchas o fierros.</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    closeCart();
                    navigate('/catalogo');
                  }}
                >
                  Ver catálogo
                </Button>
              </div>
            ) : (
              items.map(({ product, cantidad }) => (
                <div key={product.id} className="py-4 flex gap-3.5 items-start">
                  <img
                    src={product.imagen_url}
                    alt={product.nombre}
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-1">
                      {product.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">Medida: {product.medida}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateQuantity(product.id, cantidad - 1)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[36px]"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold text-slate-800">{cantidad}</span>
                        <button
                          onClick={() => updateQuantity(product.id, cantidad + 1)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[36px]"
                          disabled={cantidad >= product.stock_disponible}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-kenpaku-navy block">
                          {formatPEN(product.precio_unitario * cantidad)}
                        </span>
                        <span className="text-[10px] text-slate-400">IGV incl.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal (sin IGV):</span>
                  <span>{formatPEN(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18 %):</span>
                  <span>{formatPEN(igv)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-kenpaku-navy pt-2 border-t border-slate-200">
                  <span>Total Referencial:</span>
                  <span className="text-kenpaku-orange">{formatPEN(total)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-snug">
                ⚠️ Flete a coordinar con administración post-orden.
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                icon={ArrowRight}
                onClick={handleCheckoutClick}
              >
                Continuar con el pedido
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tus datos están protegidos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
