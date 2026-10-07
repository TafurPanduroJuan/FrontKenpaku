import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, BookOpen, ShieldCheck, Lock } from 'lucide-react';
import { STORE_INFO } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="bg-kenpaku-navy text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Store Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-kenpaku-blue flex items-center justify-center text-white font-extrabold text-base">
                K
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                COMERCIAL KENPAKU S.A.C.
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Especialistas en la comercialización de tubos, perfiles, fierros y planchas de acero con más de 14 años de experiencia en Puente Piedra, Lima.
            </p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-slate-800 text-amber-400 rounded-md border border-slate-700">
                RUC: {STORE_INFO.ruc}
              </span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Categorías de Acero
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/catalogo?categoria=tubos" className="hover:text-kenpaku-blue transition-colors">
                  Tubos Estructurales y Galvanizados
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=planchas" className="hover:text-kenpaku-blue transition-colors">
                  Planchas LAC y LAF
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=perfiles" className="hover:text-kenpaku-blue transition-colors">
                  Perfiles C y BEAM
                </Link>
              </li>
              <li>
                <Link to="/catalogo?categoria=fierros" className="hover:text-kenpaku-blue transition-colors">
                  Fierro Corrugado y Redondo Liso
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-kenpaku-blue transition-colors font-semibold text-kenpaku-blue">
                  Ver Todo el Catálogo &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Store */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Atención en Tienda
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kenpaku-blue shrink-0 mt-0.5" />
                <span>{STORE_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-kenpaku-blue shrink-0" />
                <span>{STORE_INFO.schedule}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-kenpaku-blue shrink-0" />
                <span>{STORE_INFO.phone} / WA: +{STORE_INFO.whatsappNumber}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Complaints */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Atención al Cliente
            </h4>
            <div className="space-y-3 text-xs">
              <Link
                to="/libro-de-reclamaciones"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 font-medium transition-colors"
              >
                <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="block font-bold text-white">Libro de Reclamaciones</span>
                  <span className="text-[11px] text-slate-400">Virtual (Conforme a Ley)</span>
                </div>
              </Link>
              <ul className="space-y-1.5 pt-1">
                <li>
                  <Link to="/politica-de-privacidad" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Política de Privacidad</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terminos" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Términos y Condiciones</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Comercial Kenpaku S.A.C. Todos los derechos reservados. Puente Piedra, Lima - Perú.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Precios con IGV incluido</span>
            <span className="text-slate-600">•</span>
            <Link to="/admin/login" className="hover:text-slate-200 transition-colors">
              Acceso Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
