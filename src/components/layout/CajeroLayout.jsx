import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ClipboardList,
  User,
  LogOut,
  Clock,
  ShieldAlert,
  ArrowRight,
  Store,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../pages/NotFound';
import { STORE_INFO } from '../../utils/constants';

export function CajeroLayout() {
  const { isAuthenticated, role, email, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  // Reloj digital en vivo para el mostrador de caja
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Protección de acceso: si no está autenticado, muestra 404
  if (!isAuthenticated) {
    return <NotFound />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navTabs = [
    { to: '/caja', label: 'Punto de Venta (POS)', icon: ShoppingBag, end: true },
    { to: '/caja/pedidos', label: 'Ventas de Tienda', icon: ClipboardList },
    { to: '/caja/perfil', label: 'Mi Perfil', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Topbar Fija Superior Compacta */}
      <header className="sticky top-0 z-40 bg-kenpaku-navy text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Columna Izquierda: Logo y Branding */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-kenpaku-blue flex items-center justify-center font-extrabold text-white text-base shadow-sm">
                K
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    KENPAKU
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Punto de Venta
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Store className="w-3 h-3 text-amber-400" />
                  <span>Puente Piedra - Sede Principal</span>
                </div>
              </div>
            </div>

            {/* Columna Centro: Pestañas de Navegación Principales */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-kenpaku-blue text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Columna Derecha: Reloj, Datos del Cajero y Salir */}
            <div className="flex items-center gap-3">
              {/* Reloj en vivo */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{timeStr}</span>
              </div>

              {/* Botón de acceso a admin si tiene rol de administrador */}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors border border-slate-700"
                  title="Ir al panel de control de administrador"
                >
                  <span>Panel Admin</span>
                  <ExternalLink className="w-3 h-3" />
                </NavLink>
              )}

              {/* Usuario cajero y Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden xl:block text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[140px]">
                    {email || 'Cajero en Turno'}
                  </div>
                  <div className="text-[10px] font-medium text-emerald-400 flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Turno Activo</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Cerrar turno y salir"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <Outlet />
      </main>
    </div>
  );
}
