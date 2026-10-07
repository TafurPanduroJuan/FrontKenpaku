import React from 'react';
import { Lock, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { STORE_INFO } from '../utils/constants';

export function Terms() {
  const sections = [
    { id: 't-1', title: '1. Aspectos Generales y Titularidad' },
    { id: 't-2', title: '2. Cotizaciones, Precios e IGV (18%)' },
    { id: 't-3', title: '3. Disponibilidad de Stock y Validez' },
    { id: 't-4', title: '4. Registro de Pedidos sin Pago Directo Online' },
    { id: 't-5', title: '5. Despacho, Flete y Entrega en Obra' },
    { id: 't-6', title: '6. Asesor Virtual IA (Deslinde Técnico)' },
    { id: 't-7', title: '7. Garantías y Reclamaciones' }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 py-4 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'Términos y Condiciones' }]} />

      {/* Header */}
      <div className="bg-kenpaku-navy text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Condiciones de Uso del Servicio E-Commerce</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Términos y Condiciones de Uso</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Reglas y condiciones comerciales aplicables a la comercialización de acero por Comercial Kenpaku S.A.C. en Puente Piedra, Lima.
        </p>

        {/* Draft Notice Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Aviso Legal:</strong> Este documento corresponde a un borrador base editable sujeto a homologación de gerencia legal.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Side Table of Contents */}
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-soft sticky top-24 space-y-3">
          <h3 className="text-xs font-bold text-kenpaku-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            Índice de Secciones
          </h3>
          <nav className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="w-full text-left text-xs font-medium text-slate-600 hover:text-kenpaku-blue hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span>{sec.title}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Body Content */}
        <main className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-8 text-xs text-slate-700 leading-relaxed">
          <section id="t-1" className="space-y-3 scroll-mt-28">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              1. Aspectos Generales y Titularidad
            </h2>
            <p>
              El presente sitio web de e-commerce es operado por <strong>{STORE_INFO.name}</strong> (RUC N.º <strong>{STORE_INFO.ruc}</strong>). Toda navegación y registro de pedidos implica la aceptación sin reservas de los presentes términos.
            </p>
          </section>

          <section id="t-2" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              2. Cotizaciones, Precios e IGV (18%)
            </h2>
            <p>
              Todos los precios mostrados en el catálogo web se encuentran expresados en Soles Peruanos (PEN) e <strong>incluyen el 18 % del Impuesto General a las Ventas (IGV)</strong>.
            </p>
          </section>

          <section id="t-3" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              3. Disponibilidad de Stock y Validez
            </h2>
            <p>
              Las existencias visibles en la plataforma son actualizadas periódicamente. En caso de variaciones imprevistas de inventario por alta demanda física en almacén, un asesor notificará al cliente de inmediato.
            </p>
          </section>

          <section id="t-4" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              4. Registro de Pedidos sin Pago Directo Online
            </h2>
            <p>
              El registro de una orden en este sitio web <strong>no requiere el ingreso inmediato de tarjetas de crédito o débito</strong>. La orden generada tiene carácter referencial y es enviada a nuestra mesa de ventas para validación directa.
            </p>
          </section>

          <section id="t-5" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              5. Despacho, Flete y Entrega en Obra
            </h2>
            <p>
              El costo de flete para el traslado de perfiles, planchas, fierros o tubos de 6 metros no se encuentra precalculado automáticamente. El valor exacto del flete se coordina directamente con la administración comercial post-orden según la dirección exacta en Lima Norte o Callao.
            </p>
          </section>

          <section id="t-6" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              6. Asesor Virtual de Inteligencia Artificial (Deslinde Técnico)
            </h2>
            <p>
              El Asesor IA brinda orientación general sobre dimensiones, tipos de acabado y disponibilidad de stock. Sus respuestas <strong>no constituyen ni reemplazan un cálculo ni proyecto firmado por un ingeniero colegiado</strong> para usos de carga estructural compleja.
            </p>
          </section>

          <section id="t-7" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              7. Garantías y Reclamaciones
            </h2>
            <p>
              Todos nuestros productos de acero cumplen con las normas técnicas peruanas e internacionales de fabricación. Los reclamos formales se canalizan libremente mediante el Libro de Reclamaciones Virtual en este portal.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
