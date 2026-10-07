import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Package,
  FileText,
  Building,
  Shield,
  Box,
  MessageSquare,
  ShoppingCart,
  Truck,
  MapPin,
  Clock,
} from 'lucide-react';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { ProductCard } from '../components/catalog/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { STORE_INFO } from '../utils/constants';

const CATEGORY_CARDS_CONFIG = [
  {
    slug: 'tubos',
    nombre: 'Tubos',
    descripcion: 'Redondos, cuadrados y rectangulares',
    icon: Package,
  },
  {
    slug: 'planchas',
    nombre: 'Planchas',
    descripcion: 'LAF, LAC y galvanizadas',
    icon: FileText,
  },
  {
    slug: 'perfiles',
    nombre: 'Perfiles',
    descripcion: 'Ángulos, canales y platinas',
    icon: Building,
  },
  {
    slug: 'fierros',
    nombre: 'Fierros galvanizados',
    descripcion: 'Mayor resistencia a la corrosión',
    icon: Shield,
  },
  {
    slug: 'accesorios',
    nombre: 'Accesorios',
    descripcion: 'Complementos para tu proyecto',
    icon: Box,
  },
];

export function Home() {
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => getProducts({ page: 1, page_size: 4 }),
  });

  const featuredProducts = productsData?.items || [];

  const openAIChat = () => {
    const chatBtn = document.querySelector(
      'button[aria-label="Abrir Asesor Virtual de IA"]'
    );
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#F8FAFC] rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-extrabold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Asesoría Inteligente 24/7</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A2540] tracking-tight leading-[1.15]">
              Cotiza acero en <br />
              minutos, <br />
              <span className="text-[#0284C7]">a cualquier hora</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
              Tubos, perfiles y planchas con precios claros, stock actualizado y
              asesoría inteligente para elegir mejor.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#EA580C] hover:bg-[#D97706] text-white font-bold text-sm rounded-xl shadow-md transition-all min-h-[46px]"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={openAIChat}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-[#0A2540] border border-slate-300 font-bold text-sm rounded-xl shadow-xs transition-all min-h-[46px]"
              >
                <Bot className="w-4 h-4 text-[#0284C7]" />
                <span>Pregúntale al Asesor IA</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Precios con IGV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Stock visible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pedido sin pago online</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=800&auto=format&fit=crop&q=80"
                alt="Tubos de acero Comercial Kenpaku"
                className="w-full h-80 sm:h-96 object-cover opacity-90"
              />

              <div className="absolute top-4 right-4 w-20 h-20 bg-[#0A2540] text-white rounded-full flex flex-col items-center justify-center text-center p-2 shadow-2xl border-2 border-white/20">
                <span className="text-xl font-black leading-none">14</span>
                <span className="text-[9px] font-bold uppercase tracking-tight leading-tight text-slate-200 mt-0.5">
                  años en el rubro
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A2540]">
                    Estamos listos para ayudarte
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Respuesta inmediata con IA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPRA POR CATEGORÍA */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider block mb-1">
              ENCUENTRA LO QUE NECESITAS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540]">
              Compra por categoría
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="text-xs font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_CARDS_CONFIG.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/catalogo?categoria=${cat.slug}`}
                className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-[#0284C7]/50 transition-all flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-xl group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0284C7] transition-colors" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0A2540] group-hover:text-[#0284C7] transition-colors">
                    {cat.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-snug">
                    {cat.descripcion}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. PRODUCTOS DESTACADOS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider block mb-1">
              LOS MÁS PEDIDOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540]">
              Productos destacados
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="text-xs font-bold text-[#0284C7] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 4. ¿CÓMO FUNCIONA? (3 Pasos Horizontal Timeline) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xs space-y-8 text-center">
        <div className="max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#0284C7] uppercase tracking-wider">
            SIMPLE Y RÁPIDO
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540]">
            ¿Cómo funciona?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Haz tu pedido sin llamadas ni esperas. Nosotros confirmamos los detalles contigo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-5xl mx-auto pt-4">
          {/* Step 1 */}
          <div className="flex flex-col items-center space-y-3 relative group">
            <div className="relative">
              <span className="w-6 h-6 rounded-full bg-[#0A2540] text-white text-[11px] font-black flex items-center justify-center mx-auto mb-2 shadow-xs">
                01
              </span>
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] border-2 border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto shadow-xs">
                <MessageSquare className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0A2540]">
              Consulta al asesor
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
              Cuéntale qué vas a construir y recibe opciones claras.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center space-y-3 relative group">
            <div className="relative">
              <span className="w-6 h-6 rounded-full bg-[#0A2540] text-white text-[11px] font-black flex items-center justify-center mx-auto mb-2 shadow-xs">
                02
              </span>
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] border-2 border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto shadow-xs">
                <ShoppingCart className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0A2540]">
              Arma tu pedido
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
              Agrega productos y cantidades a tu carrito.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center space-y-3 relative group">
            <div className="relative">
              <span className="w-6 h-6 rounded-full bg-[#0A2540] text-white text-[11px] font-black flex items-center justify-center mx-auto mb-2 shadow-xs">
                03
              </span>
              <div className="w-16 h-16 rounded-full bg-[#E0F2FE] border-2 border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto shadow-xs">
                <Truck className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#0A2540]">
              Coordinamos la entrega
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
              Confirmamos stock, pago y flete por WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TU PROVEEDOR DE CONFIANZA EN LIMA NORTE */}
      <section className="bg-[#0A2540] text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              ACERO Y ATENCIÓN QUE RESPONDEN
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Tu proveedor de confianza en Lima Norte
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-lg">
              Atendemos a maestros, soldadores, talleres y familias con una recomendación honesta y sin complicaciones.
            </p>
          </div>

          {/* Right Column (3 Stats with Vertical Dividers) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-700/80 lg:pl-8">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-white">
                14 años
              </div>
              <p className="text-xs text-slate-300 font-medium">en el rubro</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 text-lg sm:text-xl font-bold">
                <MapPin className="w-5 h-5 shrink-0" />
                <span className="text-white font-extrabold text-base sm:text-lg">Puente Piedra</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">Panamericana Norte</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 text-lg sm:text-xl font-bold">
                <Clock className="w-5 h-5 shrink-0" />
                <span className="text-white font-extrabold text-base sm:text-lg">Lun – Sáb</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">8:00 a. m. – 6:00 p. m.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
