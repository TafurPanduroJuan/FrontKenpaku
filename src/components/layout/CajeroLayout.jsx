import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Receipt,
  Globe,
  User,
  LogOut,
  Store,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../pages/NotFound';

export function CajeroLayout() {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Protección de acceso: si no está autenticado, muestra 404
  if (!isAuthenticated) {
    return <NotFound />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navTabs = [
    { to: '/caja', label: 'Punto de Venta', icon: ShoppingBag, end: true },
    { to: '/caja/mis-ventas', label: 'Mis Ventas', icon: Receipt },
    { to: '/caja/ventas-virtuales', label: 'Ventas Virtuales', icon: Globe },
    { to: '/caja/perfil', label: 'Mi Perfil', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Topbar Fija Superior Compacta y Centrada */}
      <header className="sticky top-0 z-40 bg-kenpaku-navy text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Columna Izquierda: Logo y Branding de la Sede */}
            <div className="flex items-center gap-3 shrink-0 min-w-[220px]">
              <div className="w-9 h-9 rounded-xl bg-kenpaku-blue flex items-center justify-center font-extrabold text-white text-base shadow-sm">
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

            {/* Columna Centro: Pestañas de Navegación Perfectamente Centradas */}
            <div className="flex-1 flex justify-center">
              <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-xs">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
            </div>

            {/* Columna Derecha: Botón Cerrar Sesión */}
            <div className="flex items-center justify-end gap-2.5 shrink-0 min-w-[220px]">
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors border border-slate-700"
                  title="Ir al panel de control de administrador"
                >
                  <span>Panel Admin</span>
                  <ExternalLink className="w-3 h-3" />
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 shadow-2xs"
                title="Cerrar sesión del sistema"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-5">
        <Outlet />
      </main>
    </div>
  );
}
