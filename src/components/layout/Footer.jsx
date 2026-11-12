import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, BookOpen, ShieldCheck, Lock } from 'lucide-react';
import { STORE_INFO } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="steel-texture bg-navy-900 text-steel-300 border-t border-navy-800 mt-auto pb-24 sm:pb-0">
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Store Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                K
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                COMERCIAL KENPAKU
              </span>
            </div>
            <p className="text-xs text-steel-300 leading-relaxed">
              Especialistas en la comercialización de tubos, perfiles, fierros y planchas de acero con más de 14 años de experiencia en Puente Piedra, Lima.
            </p>
            <div className="pt-1">
              <span className="cut inline-block px-3 py-1 text-xs font-semibold bg-accent-500/10 text-accent-400 border border-accent-500/30">
                RUC: {STORE_INFO.ruc}
              </span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-eyebrow mb-4 border-b border-white/10 pb-2.5">
              Categorías de Acero
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/catalogo?categoria=tubos" className="text-steel-300 hover:text-white transition-colors">
                  Tubos Estructurales y Galvanizados
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=planchas" className="text-steel-300 hover:text-white transition-colors">
                  Planchas LAC y LAF
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=perfiles" className="text-steel-300 hover:text-white transition-colors">
                  Perfiles C y BEAM
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=fierros" className="text-steel-300 hover:text-white transition-colors">
                  Fierro Corrugado y Redondo Liso
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-accent-400 transition-colors font-semibold text-accent-400 flex items-center gap-1 mt-1">
                  Ver Todo el Catálogo &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Store */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-eyebrow mb-4 border-b border-white/10 pb-2.5">
              Atención en Tienda
            </h4>
            <ul className="space-y-3.5 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span className="text-steel-300">{STORE_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-steel-300">{STORE_INFO.schedule}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-steel-300">{STORE_INFO.phone} / WA: +{STORE_INFO.whatsappNumber}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Complaints */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-eyebrow mb-4 border-b border-white/10 pb-2.5">
              Atención al Cliente
            </h4>
            <div className="space-y-3 text-xs">
              <Link
                to="/libro-de-reclamaciones"
                className="flex items-center gap-2.5 p-3 rounded-card bg-white/5 hover:bg-white/10 border border-accent-500/30 hover:border-accent-500 text-steel-200 transition-all duration-200"
              >
                <BookOpen className="w-5 h-5 text-accent-400 shrink-0" />
                <div>
                  <span className="block font-bold text-white">Libro de Reclamaciones</span>
                  <span className="text-micro text-steel-300">Virtual (Conforme a Ley)</span>
                </div>
              </Link>
              <ul className="space-y-2 pt-1">
                <li>
                  <Link to="/politica-de-privacidad" className="text-steel-300 hover:text-white transition-colors flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-steel-500" />
                    <span>Política de Privacidad</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terminos" className="text-steel-300 hover:text-white transition-colors flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-steel-500" />
                    <span>Términos y Condiciones</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-steel-500 gap-4">
          <p>© {new Date().getFullYear()} Comercial Kenpaku S.A.C. Todos los derechos reservados. Puente Piedra, Lima - Perú.</p>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-steel-300">Precios con IGV incluido</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
