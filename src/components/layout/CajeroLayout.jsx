import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  CheckCheck,
  CreditCard,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotFound } from '../../pages/NotFound';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../ui/Button';
import { CajeroNotificationsModal } from '../cajero/CajeroNotificationsModal';
import {
  loadStoredNotifications,
  saveStoredNotifications,
  extractNotificationsFromOrders,
  formatTimeAgo
} from '../../utils/cajeroNotifications';

export function CajeroLayout() {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Estados para notificaciones de pedidos web
  const [pendingFleteOrders, setPendingFleteOrders] = useState([]);
  const [notifications, setNotifications] = useState(() => loadStoredNotifications());
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const bellDropdownRef = useRef(null);

  const [dismissedOrderIds, setDismissedOrderIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('kenpaku_dismissed_flete_orders') || '[]');
    } catch {
      return [];
    }
  });

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        bellDropdownRef.current &&
        !bellDropdownRef.current.contains(event.target)
      ) {
        setIsBellOpen(false);
      }
    };
    if (isBellOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBellOpen]);

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

  // Sondeo en segundo plano para capturar pedidos y actualizar notificaciones
  const fetchOrdersAndNotifications = async () => {
    try {
      const data = await getAdminOrders({ estado: 'todos' });
      const items = data?.items || [];

      // Pedidos pendientes de flete para popup emergente
      const pending = items.filter(
        (o) =>
          !o.observaciones?.includes('[VENTA MOSTRADOR]') &&
          !o.observaciones?.includes('MOSTRADOR') &&
          !o.recojo_en_tienda &&
          (o.estado === 'pendiente' || o.estado === 'registrado') &&
          (!o.costo_flete || Number(o.costo_flete) === 0)
      );
      setPendingFleteOrders(pending);

      // Sincronizar centro de notificaciones preservando el estado de leídos
      setNotifications((prev) => {
        const updated = extractNotificationsFromOrders(items, prev);
        saveStoredNotifications(updated);
        return updated;
      });
    } catch {
      // Ignorar fallas silenciosas de sondeo en segundo plano
    }
  };

  useEffect(() => {
    fetchOrdersAndNotifications();
    const interval = setInterval(fetchOrdersAndNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Manejo de acciones en notificaciones
  const handleSelectOrder = (codigo, notifId = null) => {
    if (notifId) {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notifId ? { ...n, leido: true } : n
        );
        saveStoredNotifications(updated);
        return updated;
      });
    }
    setIsBellOpen(false);
    setIsModalOpen(false);
    navigate(`/caja/pedidos?codigo=${encodeURIComponent(codigo)}`);
  };

  const handleCotizar = (codigo) => {
    const notif = notifications.find((n) => n.order_codigo === codigo);
    handleSelectOrder(codigo, notif?.id);
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, leido: !n.leido } : n
      );
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, leido: true }));
      saveStoredNotifications(updated);
      return updated;
    });
  };

  const handleClearRead = () => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => !n.leido);
      saveStoredNotifications(updated);
      return updated;
    });
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

  const unreadCount = notifications.filter((n) => !n.leido).length;

  // Pedido activo para la notificación flotante (el primer pedido no descartado)
  const activePopupOrder = pendingFleteOrders.find(
    (o) => !dismissedOrderIds.includes(o.codigo)
  );

  const getDropdownIcon = (tipo) => {
    switch (tipo) {
      case 'flete_pendiente':
        return <Truck className="w-4 h-4 text-amber-500" />;
      case 'flete_aceptado':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'flete_rechazado':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'voucher_subido':
        return <CreditCard className="w-4 h-4 text-indigo-500" />;
      case 'recojo_tienda':
        return <Store className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

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
              <div className="relative" ref={bellDropdownRef}>
                <button
                  type="button"
                  id="btn-cajero-notifications"
                  onClick={() => setIsBellOpen((prev) => !prev)}
                  className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue cursor-pointer"
                  title="Centro de notificaciones de caja"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificaciones Recientes */}
                {isBellOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-3xl border border-slate-200 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-kenpaku-blue" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-kenpaku-navy">
                          Notificaciones de Caja
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold">
                            {unreadCount} sin leer
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            Al día
                          </span>
                        )}
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] font-bold text-kenpaku-blue hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Marcar todas como leídas</span>
                        </button>
                      </div>
                    )}

                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-600">Al día sin notificaciones</p>
                        <p className="text-[11px]">No hay eventos ni pedidos pendientes en este momento.</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
                        {notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                              !n.leido
                                ? 'bg-blue-50/50 hover:bg-blue-50'
                                : 'hover:bg-slate-50'
                            }`}
                            onClick={() => handleSelectOrder(n.order_codigo, n.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 p-1 rounded-lg bg-white border border-slate-200 shrink-0">
                                {getDropdownIcon(n.tipo)}
                              </div>
                              <div className="flex-1 min-w-0 text-xs">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-extrabold text-kenpaku-navy truncate">
                                    {n.titulo}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {formatTimeAgo(n.fecha)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-1">
                                  {n.descripcion}
                                </p>
                              </div>
                              {!n.leido && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-200 mt-1 shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botón Ver todas las notificaciones */}
                    <div className="pt-2 border-t border-slate-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        id="btn-ver-todas-notificaciones"
                        onClick={() => {
                          setIsBellOpen(false);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 font-bold text-xs"
                      >
                        <span>Ver todas las notificaciones</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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

      {/* Modal Completo del Centro de Notificaciones */}
      <CajeroNotificationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onToggleRead={handleToggleRead}
        onClearRead={handleClearRead}
        onSelectOrder={handleSelectOrder}
      />
    </div>
  );
}
