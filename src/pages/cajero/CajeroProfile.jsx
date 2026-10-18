import React from 'react';
import {
  User,
  ShieldCheck,
  Store,
  Clock,
  KeyRound,
  LogOut,
  Keyboard,
  CheckCircle2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { STORE_INFO } from '../../utils/constants';
import { Button } from '../../components/ui/Button';

export function CajeroProfile() {
  const { email, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tarjeta Principal de Perfil */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-kenpaku-navy text-white flex items-center justify-center font-black text-3xl shadow-md shrink-0">
            K
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-kenpaku-navy">
                {email || 'cajero@kenpaku.pe'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                {role === 'cajero' ? 'Cajero de Mostrador' : 'Administrador'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Comercial Kenpaku S.A.C. - Sistema de Ventas y Facturación
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-kenpaku-blue" />
                <span>Sede Puente Piedra</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Turno Activo</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Detalles de la Tienda y Turno */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Información del Establecimiento */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-kenpaku-blue" />
              <span>Datos del Establecimiento</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <strong className="text-slate-800">Razón Social:</strong> {STORE_INFO.name}
              </li>
              <li>
                <strong className="text-slate-800">RUC:</strong> {STORE_INFO.ruc}
              </li>
              <li>
                <strong className="text-slate-800">Dirección:</strong> {STORE_INFO.address}
              </li>
              <li>
                <strong className="text-slate-800">Teléfono:</strong> {STORE_INFO.phone}
              </li>
              <li>
                <strong className="text-slate-800">Horario de Caja:</strong> {STORE_INFO.schedule}
              </li>
            </ul>
          </div>

          {/* Atajos Rápidos de Teclado en POS */}
          <div className="space-y-3 p-5 rounded-2xl bg-sky-50/60 border border-sky-200/80">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-kenpaku-navy flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-kenpaku-blue" />
              <span>Atajos de Teclado en Caja</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center justify-between">
                <span>Enfocar buscador de productos:</span>
                <kbd className="px-2 py-0.5 rounded bg-white border border-sky-300 font-mono font-bold text-sky-800 shadow-2xs">
                  F2
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Atajo confidencial de acceso:</span>
                <kbd className="px-2 py-0.5 rounded bg-white border border-sky-300 font-mono font-bold text-sky-800 shadow-2xs">
                  Ctrl + Shift + K
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Ruta confidencial interna:</span>
                <code className="text-[11px] font-bold text-kenpaku-navy">/colaboradoreskupanke</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
