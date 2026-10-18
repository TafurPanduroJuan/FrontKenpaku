import React from 'react';
import {
  User,
  ShieldCheck,
  Store,
  Clock,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STORE_INFO } from '../../utils/constants';

export function CajeroProfile() {
  const { email, role } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
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
        </div>

        {/* Información del Establecimiento a lo largo */}
        <div className="pt-6">
          <div className="space-y-4 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-kenpaku-blue" />
                <span>Datos del Establecimiento</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Sede Principal de Ventas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Razón Social
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {STORE_INFO.name}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  RUC
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 font-mono">
                  {STORE_INFO.ruc}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Teléfono de Atención
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 font-mono">
                  {STORE_INFO.phone}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Dirección
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                  {STORE_INFO.address}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Horario de Caja
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 whitespace-nowrap">
                  {STORE_INFO.schedule}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
