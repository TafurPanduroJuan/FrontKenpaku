import React from 'react';
import { ShieldCheck, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { STORE_INFO } from '../utils/constants';

export function Privacy() {
  const sections = [
    { id: 'sec-1', title: '1. Responsable del Tratamiento de Datos' },
    { id: 'sec-2', title: '2. Datos Personales Recolectados' },
    { id: 'sec-3', title: '3. Finalidad del Tratamiento' },
    { id: 'sec-4', title: '4. Conservación y Medidas de Seguridad' },
    { id: 'sec-5', title: '5. Derechos ARCO y Mecanismos de Ejercicio' },
    { id: 'sec-6', title: '6. Transferencia y Encargados de Procesamiento' },
    { id: 'sec-7', title: '7. Modificaciones a la Política' }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 py-4 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'Política de Privacidad' }]} />

      {/* Header */}
      <div className="bg-kenpaku-navy text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kenpaku-blue/30 text-blue-300 border border-kenpaku-blue/40 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protección de Datos Personales - Ley N.º 29733</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Política de Privacidad</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Comercial Kenpaku S.A.C. (RUC {STORE_INFO.ruc}) garantiza la confidencialidad y el uso transparente de la información suministrada por nuestros clientes en Puente Piedra y Lima Norte.
        </p>

        {/* Draft Notice Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Aviso Legal:</strong> Este documento corresponde a un borrador base editable sujeto a revisión y homologación por la administración legal de la empresa.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Side Table of Contents */}
        <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-soft sticky top-24 space-y-3">
          <h3 className="text-xs font-bold text-kenpaku-navy uppercase tracking-wider border-b border-slate-100 pb-2">
            Índice de Contenido
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
          <section id="sec-1" className="space-y-3 scroll-mt-28">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              1. Responsable del Tratamiento de Datos
            </h2>
            <p>
              El titular del banco de datos personales involucrado en los servicios de este sitio web es <strong>{STORE_INFO.name}</strong>, identificado con RUC N.º <strong>{STORE_INFO.ruc}</strong>, con domicilio principal en {STORE_INFO.address}.
            </p>
          </section>

          <section id="sec-2" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              2. Datos Personales Recolectados
            </h2>
            <p>A través de nuestros formularios digitales recabamos únicamente la siguiente información básica necesaria:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombres y apellidos completos</li>
              <li>Número de documento de identidad (DNI, RUC, CE, Pasaporte)</li>
              <li>Número telefónico y de WhatsApp</li>
              <li>Correo electrónico</li>
              <li>Dirección de despacho o entrega en obra</li>
            </ul>
          </section>

          <section id="sec-3" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              3. Finalidad del Tratamiento
            </h2>
            <p>Los datos suministrados se utilizarán estrictamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>El procesamiento y confirmación de cotizaciones de tubos, planchas, perfiles y fierros.</li>
              <li>La gestión de despachos a obra y coordinación de fletes.</li>
              <li>La atención de consultas a través del Asesor Virtual de Inteligencia Artificial.</li>
              <li>El registro de hojas de reclamo en cumplimiento con la Ley N.º 29571.</li>
            </ul>
          </section>

          <section id="sec-4" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              4. Conservación y Medidas de Seguridad
            </h2>
            <p>
              Comercial Kenpaku aplica medidas técnicas y organizativas de seguridad informática para evitar la alteración, pérdida, tratamiento o acceso no autorizado de sus datos personales.
            </p>
          </section>

          <section id="sec-5" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              5. Derechos ARCO y Mecanismos de Ejercicio
            </h2>
            <p>
              El usuario puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO) enviando una solicitud formal a nuestro canal de atención por correo o directamente en nuestro almacén de Puente Piedra.
            </p>
          </section>

          <section id="sec-6" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              6. Transferencia y Encargados de Procesamiento
            </h2>
            <p>
              No comercializamos ni transferimos sus datos personales a terceros con fines publicitarios. Unicamente compartimos datos con empresas de transporte y flete contratadas directamente para cumplir con la entrega física del acero en su obra.
            </p>
          </section>

          <section id="sec-7" className="space-y-3 scroll-mt-28 border-t border-slate-100 pt-6">
            <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-2">
              7. Modificaciones a la Política
            </h2>
            <p>
              Comercial Kenpaku S.A.C. se reserva el derecho de actualizar esta política de privacidad para adecuarla a modificaciones legislativas en el Perú.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
