import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  ArrowRight,
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
  Boxes,
  Award,
  Zap,
  Receipt,
  Eye,
  Ban,
  Navigation,
  Quote,
  Star,
} from 'lucide-react';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { ProductCard } from '../components/catalog/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { STORE_INFO } from '../utils/constants';

/* ─── Ilustración isométrica de perfiles de acero para background y cards ─── */
const circle = (cx, cy, r, n = 28) =>
  Array.from({ length: n }, (_, i) => [
    cx + r * Math.cos((i / n) * 6.2832),
    cy + r * Math.sin((i / n) * 6.2832),
  ]);
const rect = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const SHAPES = {
  angle: { pts: [[0, 0], [11, 0], [11, 49], [60, 49], [60, 60], [0, 60]], e: [110, -42] },
  channel: { pts: [[0, 0], [40, 0], [40, 9], [9, 9], [9, 51], [40, 51], [40, 60], [0, 60]], e: [110, -42] },
  square: { pts: rect(0, 0, 50, 50), hole: rect(7, 7, 36, 36), e: [110, -42] },
  rect: { pts: rect(0, 0, 70, 38), hole: rect(7, 7, 56, 24), e: [105, -40] },
  round: { pts: circle(28, 28, 28), hole: circle(28, 28, 21), e: [110, -42] },
  plate: { pts: rect(0, 0, 100, 7), e: [50, -48] },
  rebar: { pts: circle(9, 9, 9, 16), e: [140, -52] },
  acc: { pts: circle(30, 30, 30, 6), hole: circle(30, 30, 12, 18), e: [14, -6] },
};

function SteelArt({ kind = 'round', finish = 'Negro', className = '' }) {
  const shape = SHAPES[kind] || SHAPES.round;
  const { pts, hole, e } = shape;
  const gal = finish === 'Galvanizado';
  const tone = (l) =>
    gal
      ? `hsl(212 16% ${58 + l * 34}%)`
      : finish === 'Sin acabado'
      ? `hsl(25 8% ${34 + l * 32}%)`
      : `hsl(215 14% ${14 + l * 34}%)`;
  const all = [...pts, ...pts.map((p) => [p[0] + e[0], p[1] + e[1]])];
  const xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]);
  const pad = 8,
    minX = Math.min(...xs) - pad,
    minY = Math.min(...ys) - pad;
  const W = Math.max(...xs) + pad - minX,
    H = Math.max(...ys) + pad - minY;
  const faces = pts
    .map((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const dx = q[0] - p[0],
        dy = q[1] - p[1],
        len = Math.hypot(dx, dy) || 1;
      const n = [dy / len, -dx / len];
      return { p, q, n, vis: n[0] * e[0] + n[1] * e[1] > 0.01 };
    })
    .filter((f) => f.vis);
  const d = (poly) => 'M' + poly.map((p) => p.join(',')).join('L') + 'Z';
  const id = `g_art_${kind}_${finish}`.replace(/\s+/g, '_');

  return (
    <svg
      viewBox={`${minX} ${minY} ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`${kind} ${finish}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone(0.85)} />
          <stop offset="1" stopColor={tone(0.45)} />
        </linearGradient>
      </defs>
      <ellipse cx={minX + W / 2} cy={minY + H - 4} rx={W * 0.4} ry={3.5} fill="#0b1a33" opacity={0.12} />
      {faces.map((f, i) => {
        const poly = [f.p, f.q, [f.q[0] + e[0], f.q[1] + e[1]], [f.p[0] + e[0], f.p[1] + e[1]]];
        const light = Math.max(0, Math.min(1, 0.5 - f.n[1] * 0.45 - f.n[0] * 0.1));
        return <path key={i} d={d(poly)} fill={tone(light)} stroke={tone(light * 0.7)} strokeWidth={0.3} />;
      })}
      <path d={d(pts) + (hole ? d(hole) : '')} fillRule="evenodd" fill={`url(#${id})`} stroke={tone(0.15)} strokeWidth={0.5} />
      {hole && <path d={d(hole)} fill={tone(0.02)} opacity={0.75} />}
    </svg>
  );
}

/* ─── Scroll Reveal Wrapper ─── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.add('in');
            }, delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

const CATEGORY_CARDS_CONFIG = [
  {
    slug: 'tubos',
    nombre: 'Tubos',
    descripcion: 'Redondos, cuadrados y rectangulares',
    kind: 'round',
    finish: 'Negro',
    icon: Package,
  },
  {
    slug: 'planchas',
    nombre: 'Planchas',
    descripcion: 'LAF, LAC y galvanizadas',
    kind: 'plate',
    finish: 'Galvanizado',
    icon: FileText,
  },
  {
    slug: 'perfiles',
    nombre: 'Perfiles',
    descripcion: 'Ángulos, canales y platinas',
    kind: 'angle',
    finish: 'Negro',
    icon: Building,
  },
  {
    slug: 'fierros',
    nombre: 'Fierros galvanizados',
    descripcion: 'Mayor resistencia a la corrosión',
    kind: 'rebar',
    finish: 'Galvanizado',
    icon: Shield,
  },
  {
    slug: 'accesorios',
    nombre: 'Accesorios',
    descripcion: 'Complementos para tu proyecto',
    kind: 'acc',
    finish: 'Negro',
    icon: Box,
  },
];

const TRUST_PILLS = [
  { icon: Receipt, title: 'Precios con IGV', desc: 'Sin sorpresas al cotizar' },
  { icon: Eye, title: 'Stock visible', desc: 'Disponibilidad real en tienda' },
  { icon: Ban, title: 'Pedido sin pagos online', desc: 'Pagas al confirmar con tu asesor' },
];

const TESTIMONIALS = [
  {
    quote: 'Con la lista pegada me cotizaron todo en minutos. Retiré mis tubos el mismo día.',
    name: 'Jorge Ramírez',
    role: 'Taller de soldadura · Comas',
  },
  {
    quote: 'El stock que ven en la web es el real. Ya no pierdo viajes por materiales que no hay.',
    name: 'Marcos Huamán',
    role: 'Maestro de obra · Carabayllo',
  },
  {
    quote: 'Me asesoraron qué ángulo usar para el portón de mi casa. Atención honesta y rápida.',
    name: 'Rosa Velásquez',
    role: 'Cliente particular · Puente Piedra',
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
    const chatBtn = document.querySelector('button[aria-label="Abrir Asesor Virtual de IA"]');
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative overflow-hidden rounded-hero border border-steel-200 bg-gradient-to-br from-white via-steel-50 to-steel-150 shadow-card">
        <div className="grid-lines absolute inset-0 opacity-40 pointer-events-none" />
        <div className="relative grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="cut inline-flex items-center gap-2 bg-brand-50 border border-brand-500/20 px-3.5 py-1.5 text-micro font-bold text-brand-700 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Asesoría Inteligente 24/7</span>
            </span>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-hero font-extrabold text-navy-900 tracking-tight leading-display">
              Cotiza acero en minutos,{' '}
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent block sm:inline">
                a cualquier hora
              </span>
            </h1>

            <p className="text-steel-600 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
              Tubos, perfiles y planchas con precios claros, stock actualizado y asesoría inteligente para elegir mejor.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold text-sm rounded-btn shadow-cta hover:shadow-cta-hover transition-all min-h-[48px] hover:-translate-y-px active:scale-[0.98]"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>

              <button
                onClick={openAIChat}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-steel-50 text-navy-900 border border-steel-300 font-semibold text-sm rounded-btn shadow-sm transition-all min-h-[48px] hover:border-navy-900 active:scale-[0.98]"
              >
                <Bot className="w-4.5 h-4.5 text-brand-600" />
                <span>Pregúntale al Asesor IA</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-steel-600 pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Precios con IGV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Stock visible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pedido sin pago online</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Steel Artwork Showcase */}
          <div className="lg:col-span-5 relative mx-auto aspect-5/4 w-full max-w-md">
            <div className="steel-texture absolute inset-0 overflow-hidden rounded-hero bg-gradient-to-br from-navy-700 via-navy-900 to-navy-950 shadow-lift border border-navy-800">
              <div className="grid-lines absolute inset-0 opacity-40 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-accent-500/20 to-transparent pointer-events-none" />
              
              {/* Isometric Extrusion SVGs */}
              <SteelArt kind="plate" finish="Galvanizado" className="absolute -bottom-2 left-2 w-3/4 opacity-90" />
              <SteelArt kind="square" finish="Negro" className="animate-float absolute top-8 -left-2 w-3/5 drop-shadow-2xl" />
              <SteelArt kind="angle" finish="Galvanizado" className="animate-float absolute top-1/3 -right-6 w-2/3 drop-shadow-2xl" />
              <SteelArt kind="round" finish="Negro" className="animate-float absolute bottom-8 left-6 w-1/2 drop-shadow-2xl" />
            </div>

            {/* Floating Badge 1: Stock */}
            <div className="animate-float absolute top-4 -left-3 flex items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-lift border border-steel-100 sm:-left-6">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Boxes className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-xs font-bold text-navy-900">Stock en tiempo real</span>
                <span className="num text-micro font-semibold text-steel-500">+80 productos</span>
              </span>
            </div>

            {/* Floating Badge 2: Experience */}
            <div className="animate-float absolute top-1/2 -right-3 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-4 shadow-lift border border-steel-100 sm:flex sm:-right-6">
              <span className="grid size-10 place-items-center rounded-xl bg-orange-100 text-accent-600">
                <Award className="w-5 h-5" />
              </span>
              <span>
                <span className="num block text-lg font-extrabold text-navy-900 leading-none">14 años</span>
                <span className="text-micro font-semibold text-steel-500">de experiencia</span>
              </span>
            </div>

            {/* Floating Badge 3: IA Ready */}
            <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-lift backdrop-blur-sm border border-steel-100 sm:right-auto sm:left-6 sm:w-72">
              <span className="relative grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Zap className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              <div>
                <span className="block text-xs font-bold text-navy-900">Respuesta inmediata con IA</span>
                <span className="text-micro text-steel-500 font-medium">Estamos listos para ayudarte</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STRIP (3 Pills de Confianza) ─── */}
      <Reveal>
        <div className="grid gap-px overflow-hidden rounded-card border border-steel-200 bg-steel-200 sm:grid-cols-3 shadow-card">
          {TRUST_PILLS.map((pill) => {
            const Icon = pill.icon;
            return (
              <div key={pill.title} className="flex items-center gap-4 bg-white p-5">
                <span className="cut grid size-12 place-items-center bg-navy-900 text-accent-400 shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <span className="block font-display font-bold text-sm text-navy-900">{pill.title}</span>
                  <span className="text-xs text-steel-500 font-medium">{pill.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* ─── 3. COMPRA POR CATEGORÍA ─── */}
      <section className="space-y-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-steel-200 pb-4">
            <div>
              <p className="text-micro font-bold tracking-eyebrow text-brand-600 uppercase mb-1">
                ENCUENTRA LO QUE NECESITAS
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                Compra por categoría
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 transition-colors group"
            >
              <span>Ver todo el catálogo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_CARDS_CONFIG.map((cat, idx) => {
            const matchingApiCat = categories.find((c) => c.slug === cat.slug);
            const count = matchingApiCat?.total || 0;

            return (
              <Reveal key={cat.slug} delay={idx * 60}>
                <Link
                  to={`/catalogo?categoria=${cat.slug}`}
                  className="group relative flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-card border border-steel-200 bg-white p-5 text-left shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-500/50 hover:shadow-lift select-none"
                >
                  {/* SteelArt de fondo translúcido */}
                  <SteelArt
                    kind={cat.kind}
                    finish={cat.finish}
                    className="absolute -right-8 -bottom-3 w-40 opacity-15 transition-all duration-500 group-hover:scale-110 group-hover:opacity-25 pointer-events-none"
                  />

                  {/* Icono con corte angular .cut */}
                  <span className="cut relative grid size-12 place-items-center bg-gradient-to-br from-brand-50 to-steel-100 p-2 shadow-xs">
                    <SteelArt kind={cat.kind} finish={cat.finish} className="size-full" />
                  </span>

                  <span className="relative mt-4 font-display text-base font-bold text-navy-900 group-hover:text-brand-600 transition-colors">
                    {cat.nombre}
                  </span>
                  <span className="relative mt-1 text-xs text-steel-500 font-medium leading-relaxed">
                    {cat.descripcion}
                  </span>

                  <div className="relative mt-auto flex items-center justify-between pt-4 text-xs font-bold">
                    <span className="num rounded-full bg-steel-100 px-2.5 py-0.5 text-micro font-semibold text-steel-600">
                      {count > 0 ? `${count} productos` : 'Ver catálogo'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-accent-600 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ─── 4. PRODUCTOS DESTACADOS ─── */}
      <section className="space-y-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-steel-200 pb-4">
            <div>
              <p className="text-micro font-bold tracking-eyebrow text-brand-600 uppercase mb-1">
                LOS MÁS PEDIDOS
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                Productos destacados
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5 transition-colors group"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>

        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((prod, idx) => (
              <Reveal key={prod.id} delay={idx * 75}>
                <ProductCard product={prod} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ─── 5. ¿CÓMO FUNCIONA? (Horizontal Steps con Dashed Line) ─── */}
      <section className="rounded-hero border border-steel-200 bg-white p-8 sm:p-12 shadow-card">
        <Reveal className="mb-12 text-center max-w-xl mx-auto space-y-2">
          <p className="text-micro font-bold tracking-eyebrow text-brand-600 uppercase">
            SIMPLE Y RÁPIDO
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900">
            ¿Cómo funciona?
          </h2>
          <p className="text-xs sm:text-sm text-steel-600 font-medium">
            Haz tu pedido sin llamadas ni esperas. Nosotros confirmamos los detalles contigo.
          </p>
        </Reveal>

        <div className="relative grid gap-10 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Líneas conectadas en desktop y mobile */}
          <div className="dashed-line absolute top-12 right-1/6 left-1/6 hidden h-0.5 md:block pointer-events-none" />
          <div className="dashed-line-v absolute top-12 bottom-12 left-1/2 w-0.5 -translate-x-1/2 md:hidden pointer-events-none" />

          {/* Paso 1 */}
          <Reveal delay={0} className="relative text-center">
            <span className="relative mx-auto grid size-24 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-brand-50 to-steel-100 text-brand-600 shadow-lift">
              <MessageSquare className="w-8 h-8" />
              <span className="num absolute -top-1 -right-1 z-10 grid size-8 place-items-center rounded-full border-2 border-white bg-accent-600 text-xs font-extrabold text-white shadow-cta-soft">
                1
              </span>
            </span>
            <div className="relative mt-4 bg-white pt-2 pb-1">
              <h3 className="font-display text-base font-bold text-navy-900">Consulta al asesor</h3>
              <p className="mx-auto mt-1 max-w-64 text-xs text-steel-600 font-medium leading-relaxed">
                Cuéntale qué vas a construir y recibe opciones claras en segundos.
              </p>
            </div>
          </Reveal>

          {/* Paso 2 */}
          <Reveal delay={120} className="relative text-center">
            <span className="relative mx-auto grid size-24 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-brand-50 to-steel-100 text-brand-600 shadow-lift">
              <ShoppingCart className="w-8 h-8" />
              <span className="num absolute -top-1 -right-1 z-10 grid size-8 place-items-center rounded-full border-2 border-white bg-accent-600 text-xs font-extrabold text-white shadow-cta-soft">
                2
              </span>
            </span>
            <div className="relative mt-4 bg-white pt-2 pb-1">
              <h3 className="font-display text-base font-bold text-navy-900">Arma tu pedido</h3>
              <p className="mx-auto mt-1 max-w-64 text-xs text-steel-600 font-medium leading-relaxed">
                Agrega productos y cantidades directamente a tu carrito con precios claros.
              </p>
            </div>
          </Reveal>

          {/* Paso 3 */}
          <Reveal delay={240} className="relative text-center">
            <span className="relative mx-auto grid size-24 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-brand-50 to-steel-100 text-brand-600 shadow-lift">
              <Truck className="w-8 h-8" />
              <span className="num absolute -top-1 -right-1 z-10 grid size-8 place-items-center rounded-full border-2 border-white bg-accent-600 text-xs font-extrabold text-white shadow-cta-soft">
                3
              </span>
            </span>
            <div className="relative mt-4 bg-white pt-2 pb-1">
              <h3 className="font-display text-base font-bold text-navy-900">Coordinamos la entrega</h3>
              <p className="mx-auto mt-1 max-w-64 text-xs text-steel-600 font-medium leading-relaxed">
                Confirmamos stock, pago y flete por WhatsApp antes de cualquier cobro.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 6. TU PROVEEDOR DE CONFIANZA EN LIMA NORTE ─── */}
      <Reveal>
        <section className="relative overflow-hidden rounded-panel bg-navy-900 p-8 text-white sm:p-12 shadow-2xl border border-navy-800">
          <div className="grid-lines absolute inset-0 opacity-25 pointer-events-none" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            {/* Left Content */}
            <div className="space-y-4">
              <p className="text-micro font-bold tracking-eyebrow text-accent-400 uppercase">
                ACERO Y ATENCIÓN QUE RESPONDEN
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Tu proveedor de confianza en Lima Norte
              </h2>
              <p className="text-sm text-steel-200 leading-relaxed font-normal max-w-md">
                Atendemos a maestros, soldadores, talleres y familias con una recomendación honesta y sin complicaciones.
              </p>

              <div className="pt-4 flex flex-wrap items-end gap-8">
                <div>
                  <span className="num block text-5xl sm:text-6xl font-extrabold text-white leading-none">
                    14
                  </span>
                  <span className="mt-2 block text-sm font-bold text-accent-400 tracking-wide">
                    años en el rubro
                  </span>
                </div>
                <div className="space-y-2 pb-1 text-xs text-steel-200">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent-400 shrink-0" />
                    <span>Puente Piedra · Panamericana Norte</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-400 shrink-0" />
                    <span>Lun – Sáb · 8:00 am – 6:00 pm</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Map Card */}
            <div className="overflow-hidden rounded-card border border-white/10 bg-white/5 backdrop-blur-sm shadow-lift">
              <div className="relative h-48 bg-[#16294d] overflow-hidden">
                <svg viewBox="0 0 400 200" className="absolute inset-0 size-full" aria-hidden="true">
                  <g stroke="#2b4577" fill="none" strokeWidth="1">
                    <path d="M0 150 L400 60" strokeWidth="14" stroke="#20386a" />
                    <path d="M120 0 L170 200M260 0 L230 200M0 60 L400 130" />
                    <path d="M0 100h400M0 30h400" strokeDasharray="4 6" />
                  </g>
                  <text x="30" y="145" fill="#8fa5cc" fontSize="10" transform="rotate(-12 30 145)">
                    Av. Panamericana Norte
                  </text>
                </svg>
                <div className="absolute top-2/5 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute -inset-3 animate-ping rounded-full bg-accent-500/40" />
                  <span className="relative grid size-11 place-items-center rounded-full bg-accent-600 text-white shadow-lift">
                    <MapPin className="w-5 h-5" />
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="font-display font-bold text-white text-sm">Comercial Kenpaku S.A.C.</p>
                  <p className="text-xs text-steel-200 mt-0.5">{STORE_INFO.address}</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Av.+Panamericana+Norte+Km+25.5+Puente+Piedra"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold rounded-btn shadow-cta transition-all active:scale-[0.98]"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Cómo llegar</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── 7. TESTIMONIOS (CLIENTES FRECUENTES) ─── */}
      <section className="space-y-6">
        <Reveal>
          <div className="space-y-1 border-b border-steel-200 pb-4">
            <p className="text-micro font-bold tracking-eyebrow text-brand-600 uppercase">
              CLIENTES FRECUENTES
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Talleres y maestros que confían en Kenpaku
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <Reveal key={t.name} delay={idx * 80}>
              <figure className="relative h-full flex flex-col justify-between rounded-card border border-steel-200 bg-white p-6 shadow-card hover:shadow-lift transition-shadow duration-300">
                <Quote className="absolute top-5 right-5 text-steel-200 w-8 h-8 pointer-events-none" />
                <div>
                  <div className="mb-3 flex gap-0.5 text-accent-500">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-xs sm:text-sm text-steel-600 leading-relaxed font-medium">
                    “{t.quote}”
                  </blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3 pt-3 border-t border-steel-100">
                  <span className="grid size-10 place-items-center rounded-full bg-navy-900 font-bold text-xs text-white">
                    {t.name[0]}
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-navy-900">{t.name}</span>
                    <span className="text-micro text-steel-500 font-medium">{t.role}</span>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── 8. FINAL CTA STRIP (¿Tienes una lista?) ─── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-hero bg-gradient-to-br from-accent-600 to-accent-700 p-8 text-white sm:p-12 shadow-lift">
          <SteelArt
            kind="angle"
            finish="Galvanizado"
            className="absolute -right-10 -bottom-10 w-80 opacity-20 pointer-events-none"
          />
          <div className="relative max-w-xl space-y-4">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Tienes una lista de materiales?
            </h2>
            <p className="text-sm sm:text-base text-white/90 font-medium">
              Pégala o sube tu Excel y te armamos la cotización en minutos.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/cotizador"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm rounded-btn shadow-lift transition-all active:scale-[0.98]"
              >
                <FileText className="w-4 h-4" />
                <span>Cotizar por lista</span>
              </Link>
              <button
                onClick={openAIChat}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-sm rounded-btn transition-all active:scale-[0.98]"
              >
                <Bot className="w-4 h-4" />
                <span>Preguntar al Asesor</span>
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
