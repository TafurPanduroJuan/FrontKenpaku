import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../ui/Button';
import { ProductImage } from '../catalog/ProductImage';

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
      {/* Backdrop con blur estilo figma */}
      <div
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="slide-in-right w-screen max-w-md bg-white shadow-lift flex flex-col border-l border-steel-200">
          {/* Header con steel-texture sobre navy-900 */}
          <div className="steel-texture p-4 sm:p-5 bg-navy-900 text-white flex items-center justify-between border-b border-navy-800">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-accent-400" />
              <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                Tu Carrito de Compra
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-steel-400 hover:text-white rounded-btn hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-steel-100 bg-white">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-steel-100 text-steel-500 flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-display text-base font-bold text-navy-900">Tu carrito está vacío</h3>
                <p className="text-xs text-steel-500 max-w-xs mx-auto leading-relaxed">
                  Explora nuestro catálogo y agrega tubos, perfiles, planchas o fierros.
                </p>
                <div className="pt-3">
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
              </div>
            ) : (
              items.map(({ product, cantidad }) => (
                <div key={product.id} className="py-4 flex gap-3.5 items-start">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-steel-200 shrink-0 shadow-xs">
                    <ProductImage
                      src={product.imagen_url}
                      alt={product.nombre}
                      categoria={product.categoria}
                      finish={product.acabado || 'Negro'}
                      padding="p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-xs font-bold text-navy-900 line-clamp-2 leading-snug mb-1">
                      {product.nombre}
                    </h4>
                    {product.medida && (
                      <p className="text-micro text-brand-600 font-semibold mb-2">
                        {product.medida}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      {/* Qty Selector con bordes steel */}
                      <div className="flex items-center border border-steel-200 rounded-btn overflow-hidden bg-white shadow-inset">
                        <button
                          onClick={() => updateQuantity(product.id, cantidad - 1)}
                          className="px-2.5 py-1 text-xs font-bold text-navy-900 hover:bg-steel-100 min-h-[32px] transition-colors"
                          aria-label="Disminuir cantidad"
                        >
                          -
                        </button>
                        <span className="num px-3 text-xs font-bold text-navy-900">{cantidad}</span>
                        <button
                          onClick={() => updateQuantity(product.id, cantidad + 1)}
                          className="px-2.5 py-1 text-xs font-bold text-navy-900 hover:bg-steel-100 min-h-[32px] disabled:opacity-40 transition-colors"
                          disabled={cantidad >= product.stock_disponible}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="num text-xs font-extrabold text-navy-900 block leading-tight">
                          {formatPEN(product.precio_unitario * cantidad)}
                        </span>
                        <span className="text-micro text-steel-500 font-medium">IGV incl.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 text-steel-400 hover:text-red-600 hover:bg-red-50 rounded-btn transition-colors cursor-pointer"
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
            <div className="p-4 sm:p-5 bg-steel-50 border-t border-steel-200 space-y-3.5">
              <div className="space-y-1.5 text-xs text-steel-600">
                <div className="flex justify-between">
                  <span>Subtotal (sin IGV):</span>
                  <span className="num font-semibold text-navy-900">{formatPEN(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV (18 %):</span>
                  <span className="num font-semibold text-navy-900">{formatPEN(igv)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-navy-900 pt-2 border-t border-steel-200">
                  <span>Total Referencial:</span>
                  <span className="num text-base font-extrabold text-accent-600">{formatPEN(total)}</span>
                </div>
              </div>

              {/* Aviso flete post-orden acorde a Figma */}
              <div className="p-2.5 rounded-xl bg-orange-50 border border-accent-500/30 text-accent-700 text-micro font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-accent-600" />
                <span>El costo de flete se cotiza después según la dirección de entrega.</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                iconRight={ArrowRight}
                onClick={handleCheckoutClick}
              >
                Continuar con el pedido
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-micro text-steel-500 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tus datos están protegidos · Sin pago online requerido</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
