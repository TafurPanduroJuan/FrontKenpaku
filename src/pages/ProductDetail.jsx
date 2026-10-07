import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Bot, ShieldCheck, FileText, HelpCircle, Check, ArrowLeft } from 'lucide-react';
import { getProductById, getProducts } from '../api/products';
import { StockBadge } from '../components/catalog/StockBadge';
import { ProductCard } from '../components/catalog/ProductCard';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { formatPEN } from '../utils/formatPEN';
import { useCart } from '../hooks/useCart';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('tech'); // 'tech' | 'faq'
  const [showToast, setShowToast] = useState(false);

  // Fetch product detail
  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id
  });

  // Fetch related products in same category
  const { data: relatedData } = useQuery({
    queryKey: ['related-products', product?.categoria],
    queryFn: () => getProducts({ categoria: product.categoria, page_size: 4 }),
    enabled: !!product?.categoria
  });

  const relatedProducts = (relatedData?.items || []).filter((p) => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="py-6 space-y-8">
        <Skeleton className="w-64 h-6" variant="text" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-80" />
          <div className="space-y-4">
            <Skeleton className="w-3/4 h-8" variant="text" />
            <Skeleton className="w-1/2 h-6" variant="text" />
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-12" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-kenpaku-navy">Producto no encontrado</h2>
        <p className="text-sm text-slate-500">El producto solicitado no existe o fue descontinuado.</p>
        <Link to="/catalogo">
          <Button variant="primary" icon={ArrowLeft}>Volver al Catálogo</Button>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_estado === 'agotado' || product.stock_disponible <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
      setShowToast(true);
    }
  };

  const handleConsultAdvisor = () => {
    // Save product_id in sessionStorage for chat context
    sessionStorage.setItem('kenpaku_chat_product_id', product.id);
    const chatBtn = document.querySelector('button[aria-label="Abrir Asesor Virtual de IA"]');
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="space-y-12 py-4">
      {/* Toast feedback */}
      <Toast
        message={`Agregado ${quantity} unidad(es) de "${product.nombre}" al carrito.`}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Catálogo', url: '/catalogo' },
          { label: product.categoria.toUpperCase(), url: `/catalogo?categoria=${product.categoria}` },
          { label: product.nombre }
        ]}
      />

      {/* Main Detail Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Image */}
        <div className="lg:col-span-6 relative aspect-4/3 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          <img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute top-4 left-4">
            <StockBadge status={product.stock_estado} />
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Categoría: {product.categoria}</span>
              {product.acabado && (
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                  Acabado {product.acabado}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy leading-tight">
              {product.nombre}
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Medida: <span className="text-slate-800 font-bold">{product.medida}</span>
              {product.espesor && (
                <> • Espesor: <span className="text-slate-800 font-bold">{product.espesor}</span></>
              )}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.descripcion_corta}
          </p>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Precio Unitario</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">
                {formatPEN(product.precio_unitario)}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-2">IGV incluido</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Disponibilidad</span>
              <span className="text-xs font-bold text-slate-800">
                {product.stock_disponible} unidades
              </span>
            </div>
          </div>

          {/* Quantity selector & Add button */}
          <div className="space-y-4 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cantidad:</label>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-bold text-kenpaku-navy">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_disponible, q + 1))}
                    className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 min-h-[44px]"
                    disabled={quantity >= product.stock_disponible}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isOutOfStock}
                icon={ShoppingCart}
                onClick={handleAddToCart}
              >
                {isOutOfStock ? 'Producto Agotado' : 'Agregar al carrito'}
              </Button>

              <Button
                variant="blue"
                size="lg"
                fullWidth
                icon={Bot}
                onClick={handleConsultAdvisor}
              >
                Consultar al asesor sobre este producto
              </Button>
            </div>
          </div>

          {/* Guarantee disclaimer */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Atención garantizada en almacén de Puente Piedra con entrega inmediata previa confirmación.</span>
          </div>
        </div>
      </div>

      {/* Tabs: Tech Spec / FAQs */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex border-b border-slate-200 space-x-6">
          <button
            onClick={() => setActiveTab('tech')}
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'tech'
                ? 'border-kenpaku-blue text-kenpaku-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ficha técnica</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'border-kenpaku-blue text-kenpaku-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Preguntas frecuentes</span>
          </button>
        </div>

        {/* Tab 1: Ficha Técnica */}
        {activeTab === 'tech' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-kenpaku-navy">Especificaciones de Fabricación</h3>
            {product.ficha_tecnica && product.ficha_tecnica.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700 border border-slate-200 rounded-xl overflow-hidden">
                  <tbody>
                    {product.ficha_tecnica.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-200 w-1/3">
                          {spec.clave}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{spec.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No se disponen de datos adicionales de ficha técnica.</p>
            )}
          </div>
        )}

        {/* Tab 2: FAQs */}
        {activeTab === 'faq' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-bold text-kenpaku-navy">Consultas Habituales de Clientes</h3>
            {product.faqs && product.faqs.length > 0 ? (
              <div className="space-y-3">
                {product.faqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-kenpaku-blue shrink-0" />
                      <span>{faq.pregunta}</span>
                    </h4>
                    <p className="text-xs text-slate-600 pl-5 leading-relaxed">{faq.respuesta}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No hay preguntas frecuentes registradas para este ítem.</p>
            )}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-kenpaku-navy border-b border-slate-200 pb-3">
            Productos relacionados en {product.categoria}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd.id} product={relProd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
