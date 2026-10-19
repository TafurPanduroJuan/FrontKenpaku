import React, { useState, useMemo } from 'react';
import {
  Bell,
  Truck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Store,
  CheckCheck,
  Trash2,
  ArrowRight,
  Inbox,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatTimeAgo } from '../../utils/cajeroNotifications';

export function CajeroNotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onToggleRead,
  onClearRead,
  onResetNotifications,
  onSelectOrder
}) {
  const [activeTab, setActiveTab] = useState('todas'); // 'todas', 'unread', 'flete', 'voucher'

  const counts = useMemo(() => {
    return {
      todas: notifications.length,
      unread: notifications.filter((n) => !n.leido).length,
      flete: notifications.filter((n) => n.tipo?.startsWith('flete')).length,
      voucher: notifications.filter((n) => n.tipo === 'voucher_subido').length
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.leido);
      case 'flete':
        return notifications.filter((n) => n.tipo?.startsWith('flete'));
      case 'voucher':
        return notifications.filter((n) => n.tipo === 'voucher_subido');
      case 'todas':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case 'flete_pendiente':
        return <Truck className="w-5 h-5 text-amber-500" />;
      case 'flete_aceptado':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'flete_rechazado':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'voucher_subido':
        return <CreditCard className="w-5 h-5 text-indigo-500" />;
      case 'recojo_tienda':
        return <Store className="w-5 h-5 text-sky-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeBg = (tipo) => {
    switch (tipo) {
      case 'flete_pendiente':
        return 'bg-amber-50 border-amber-200';
      case 'flete_aceptado':
        return 'bg-emerald-50 border-emerald-200';
      case 'flete_rechazado':
        return 'bg-rose-50 border-rose-200';
      case 'voucher_subido':
        return 'bg-indigo-50 border-indigo-200';
      case 'recojo_tienda':
        return 'bg-sky-50 border-sky-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getBadgeColor = (tipo) => {
    switch (tipo) {
      case 'flete_pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'flete_aceptado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'flete_rechazado':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'voucher_subido':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'recojo_tienda':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Notificaciones de Caja"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Barra superior de pestañas y acciones globales */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'todas'
                  ? 'bg-white text-kenpaku-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {counts.todas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'unread'
                  ? 'bg-white text-kenpaku-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>No leídas</span>
              {counts.unread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-extrabold animate-pulse">
                  {counts.unread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flete')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'flete'
                  ? 'bg-white text-kenpaku-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Fletes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {counts.flete}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voucher')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'voucher'
                  ? 'bg-white text-kenpaku-navy shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Vouchers</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                {counts.voucher}
              </span>
            </button>
          </div>

          {/* Acciones de Lote */}
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            {counts.unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs text-kenpaku-blue hover:text-blue-800 flex items-center gap-1 font-bold whitespace-nowrap"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar todas leídas</span>
              </Button>
            )}

            {notifications.some((n) => n.leido) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearRead}
                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 whitespace-nowrap"
                title="Eliminar historial de leídas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar leídas</span>
              </Button>
            )}

            {onResetNotifications && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetNotifications}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 whitespace-nowrap"
                title="Borrar historial anterior y empezar desde ahora"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Iniciar desde cero</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-600 text-sm">No hay notificaciones aquí</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'unread'
                ? '¡Excelente! Todas las notificaciones han sido revisadas.'
                : 'No se encontraron notificaciones en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
            {filteredNotifications.map((notif) => {
              const isUnread = !notif.leido;
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isUnread
                      ? 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Icono + Contenido */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getTypeBg(
                        notif.tipo
                      )}`}
                    >
                      {getTypeIcon(notif.tipo)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getBadgeColor(
                            notif.tipo
                          )}`}
                        >
                          {notif.badge || 'Aviso'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatTimeAgo(notif.fecha)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-200 shrink-0" />
                        )}
                      </div>

                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isUnread ? 'text-kenpaku-navy' : 'text-slate-700'
                        }`}
                      >
                        {notif.titulo}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {notif.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Acciones para el elemento */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleRead(notif.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title={isUnread ? 'Marcar como leída' : 'Marcar como no leída'}
                    >
                      {isUnread ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    {notif.order_codigo && (
                      <Button
                        variant="primary"
                        size="sm"
                        iconRight={ArrowRight}
                        onClick={() => onSelectOrder(notif.order_codigo, notif.id)}
                        className="text-xs whitespace-nowrap shrink-0"
                      >
                        Atender Pedido
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Informativo */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Mostrando <strong>{filteredNotifications.length}</strong> de {notifications.length} notificaciones
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
