import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Receipt,
  Globe,
  User,
  LogOut,
  Store,
  ExternalLink,
  Bell,
  Truck,
  X,
  ArrowRight,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../pages/NotFound';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../ui/Button';

export function CajeroLayout() {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Estados para notificaciones de pedidos web pendientes de flete
  const [pendingFleteOrders, setPendingFleteOrders] = useState([]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [dismissedOrderIds, setDismissedOrderIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('kenpaku_dismissed_flete_orders') || '[]');
    } catch {
      return [];
    }
  });

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
    { to: '/caja/pedidos', label: 'Pedidos', icon: Globe },
    { to: '/caja/perfil', label: 'Mi Perfil', icon: User }
  ];

  // Sondeo en segundo plano para capturar nuevos pedidos web que requieran flete
  const fetchPendingFleteOrders = async () => {
    try {
      const data = await getAdminOrders({ estado: 'todos' });
      const items = data?.items || [];
      const pending = items.filter(
        (o) =>
          !o.observaciones?.includes('[VENTA MOSTRADOR]') &&
          !o.observaciones?.includes('MOSTRADOR') &&
          !o.recojo_en_tienda &&
          (o.estado === 'pendiente' || o.estado === 'registrado') &&
          (!o.costo_flete || Number(o.costo_flete) === 0)
      );
      setPendingFleteOrders(pending);
    } catch {
      // Ignorar fallas silenciosas de sondeo en segundo plano
    }
  };

  useEffect(() => {
    fetchPendingFleteOrders();
    const interval = setInterval(fetchPendingFleteOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manejo de acciones en notificaciones
  const handleCotizar = (codigo) => {
    setIsBellOpen(false);
    navigate(`/caja/pedidos?codigo=${encodeURIComponent(codigo)}`);
  };

  const handleDismiss = (codigo) => {
    setDismissedOrderIds((prev) => {
      const next = [...new Set([...prev, codigo])];
      try {
        sessionStorage.setItem('kenpaku_dismissed_flete_orders', JSON.stringify(next));
      } catch {
        // Ignorar errores de almacenamiento
      }
      return next;
    });
  };

  // Pedido activo para la notificación flotante (el primer pedido no descartado)
  const activePopupOrder = pendingFleteOrders.find(
    (o) => !dismissedOrderIds.includes(o.codigo)
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Topbar Fija Superior Compacta y Centrada */}
      <header className="sticky top-0 z-40 bg-kenpaku-navy text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Columna Izquierda: Logo y Branding de la Sede */}
            <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
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

            {/* Columna Derecha: Notificaciones + Admin + Botón Cerrar Sesión */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 min-w-[200px]">
              {/* Campana de Notificaciones de Pedidos Web */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-cajero-notifications"
                  onClick={() => setIsBellOpen((prev) => !prev)}
                  className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                  title="Notificaciones de pedidos web pendientes de flete"
                >
                  <Bell className="w-4 h-4" />
                  {pendingFleteOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-900">
                      {pendingFleteOrders.length}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificaciones */}
                {isBellOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-3xl border border-slate-200 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-kenpaku-navy">
                          Notificaciones de Pedidos Web
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                        {pendingFleteOrders.length} pendiente(s)
                      </span>
                    </div>

                    {pendingFleteOrders.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-600">Al día sin pedidos pendientes</p>
                        <p className="text-[11px]">No hay pedidos web esperando cotización de flete.</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-1">
                        {pendingFleteOrders.map((o) => (
                          <div key={o.codigo} className="py-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-kenpaku-navy">{o.codigo}</span>
                              <span className="text-[10px] text-kenpaku-orange font-bold">{formatPEN(o.total)}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate">
                              Cliente: <strong>{o.cliente?.nombre || o.cliente_nombre || o.cliente_resumen || 'Cliente Web'}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={o.direccion}>
                              Destino: {o.direccion || 'Puente Piedra / Lima'}
                            </p>
                            <div className="pt-1 flex justify-end">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleCotizar(o.codigo)}
                              >
                                Cotizar Flete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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

      {/* Notificación Flotante Persistente para Nueva Cotización de Flete */}
      {activePopupOrder && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full bg-white rounded-3xl border-2 border-indigo-400 shadow-2xl p-5 animate-slide-up space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                  Nuevo Pedido Web • Requiere Flete
                </span>
                <h4 className="text-sm font-extrabold text-kenpaku-navy">
                  Pedido {activePopupOrder.codigo}
                </h4>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(activePopupOrder.codigo)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold truncate max-w-[200px]">
                {activePopupOrder.cliente?.nombre || activePopupOrder.cliente_nombre || activePopupOrder.cliente_resumen || 'Cliente Web'}
              </span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="text-slate-500 font-medium">Destino:</span>
              <span className="font-bold truncate max-w-[200px]" title={activePopupOrder.direccion}>
                {activePopupOrder.direccion || 'Dirección registrada'}
              </span>
            </div>
            <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200 font-extrabold">
              <span>Total Materiales:</span>
              <span className="text-kenpaku-orange">{formatPEN(activePopupOrder.total)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => handleCotizar(activePopupOrder.codigo)}
              icon={ArrowRight}
            >
              Cotizar ahora
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => handleDismiss(activePopupOrder.codigo)}
            >
              Ver más tarde
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
