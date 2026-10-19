import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingBag,
  Eye,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  AlertTriangle,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  FileText,
  ExternalLink,
  Zap,
  Globe,
  RefreshCw,
  Store
} from 'lucide-react';
import { getAdminOrders, updateOrderStatus, triggerScheduledTasks } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { buildStatusWhatsAppUrl } from '../../utils/whatsapp';
import { getVoucherUrl, getVoucherList } from '../../utils/voucher';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { sanitizeOrderCode } from '../../utils/sanitizers';
import { ReceiptModal } from '../../components/pos/ReceiptModal';

const ALLOWED_TRANSITIONS = {
  recojo: {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['listo_para_recojo', 'cancelado'],
    listo_para_recojo: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: []
  },
  despacho: {
    pendiente: ['flete_cotizado', 'cancelado'],
    flete_cotizado: ['confirmado', 'cancelado'],
    confirmado: ['despachado', 'cancelado'],
    despachado: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: []
  }
};

const ACTION_LABELS = {
  flete_cotizado: 'Cotizar Flete de Transporte',
  confirmado: 'Confirmar Pedido y Preparar',
  despachado: 'Despachar Pedido en Camino',
  listo_para_recojo: 'Listo para Entrega en Tienda',
  entregado: 'Confirmar Pedido Entregado Conforme',
  cancelado: 'Cancelar Pedido'
};

function getTransitionImpactMessage(targetState) {
  switch (targetState) {
    case 'confirmado':
      return '📦 Al confirmar este pedido, se reservará y descontará automáticamente el stock disponible de los productos incluidos en el inventario.';
    case 'cancelado':
      return '⚠️ Al cancelar el pedido, la acción es irreversible. Se liberará cualquier stock que haya sido reservado para que vuelva a estar disponible en tienda.';
    case 'entregado':
      return '🏁 Al marcar como ENTREGADO, el pedido pasará a estado terminal y se dará por concluido. No podrá modificarse posteriormente.';
    case 'despachado':
      return '🚚 Se registrará la salida del pedido en camión hacia la obra indicada por el cliente.';
    case 'listo_para_recojo':
      return '🏬 Se notificará que los materiales están listos en el almacén de Puente Piedra para el retiro del cliente.';
    case 'flete_cotizado':
      return '';
    default:
      return '¿Deseas proceder con este cambio de fase operativa?';
  }
}

export function CajeroOrders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [searchParams, setSearchParams] = useSearchParams();
  const codigoParam = searchParams.get('codigo');
  const [searchInput, setSearchInput] = useState(codigoParam || searchParams.get('q') || '');
  const [searchTerm, setSearchTerm] = useState(codigoParam || searchParams.get('q') || '');
  const hasAutoOpenedRef = useRef(null);

  useEffect(() => {
    const term = searchParams.get('codigo') || searchParams.get('q') || '';
    if (term) {
      setSearchInput(term);
      setSearchTerm(term);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleCloseModal = () => {
    setSelectedOrder(null);
    hasAutoOpenedRef.current = 'CLOSED';
    if (searchParams.get('codigo')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('codigo');
      setSearchParams(nextParams, { replace: true });
    }
  };
  const [pendingTransition, setPendingTransition] = useState(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [costoFleteInput, setCostoFleteInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenReceipt = (order) => {
    setReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleRunCron = async (simulateHours = 0) => {
    setIsCronRunning(true);
    try {
      const res = await triggerScheduledTasks({ simulate_hours: simulateHours });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-required'] });

      const parts = [];
      if (res.recordatorios_enviados > 0) {
        parts.push(`${res.recordatorios_enviados} recordatorio(s)`);
      }
      if (res.pedidos_cancelados_por_vencimiento > 0) {
        parts.push(`${res.pedidos_cancelados_por_vencimiento} cancelado(s) por 48h`);
      }
      if (res.stock_liberado_items > 0) {
        parts.push(`${res.stock_liberado_items} und stock liberado`);
      }

      const summaryText = parts.length > 0
        ? parts.join(', ')
        : 'Sin pedidos pendientes por vencer ni recordar.';

      setToastMessage(`⚙️ Cron Ejecutado (+${simulateHours}h): ${summaryText}`);
      setShowToast(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : err.message;
      setToastMessage(`Error al ejecutar cron: ${errorMsg}`);
      setShowToast(true);
    } finally {
      setIsCronRunning(false);
    }
  };

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', selectedStatus, searchTerm],
    queryFn: () =>
      getAdminOrders({
        estado: selectedStatus,
        ...(searchTerm.length >= 2 ? { q: searchTerm } : {})
      })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, estado, nota, costo_flete }) => updateOrderStatus(id, { estado, nota, costo_flete }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-action-required'] });
      setToastMessage(`Estado del pedido ${variables.codigo || variables.id} actualizado a "${variables.estado.replace(/_/g, ' ')}".`);
      setShowToast(true);
      setPendingTransition(null);
      if (selectedOrder && (selectedOrder.id === variables.id || selectedOrder.codigo === variables.id)) {
        setSelectedOrder((prev) => ({
          ...prev,
          estado: variables.estado,
          costo_flete: variables.costo_flete !== undefined ? variables.costo_flete : prev.costo_flete,
          estado_flete: variables.estado === 'flete_cotizado' ? 'cotizado' : prev.estado_flete,
          events: data?.events || [
            ...(prev.events || []),
            {
              estado_nuevo: variables.estado,
              autor: 'cajero',
              nota: variables.nota || 'Cambio manual de estado por caja',
              created_at: new Date().toISOString()
            }
          ]
        }));
      }
    },
    onError: (error) => {
      const detail = error.response?.data?.detail;
      let errorMsg = 'No se pudo actualizar el estado del pedido.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (detail && typeof detail === 'object') {
        errorMsg = detail.detail || JSON.stringify(detail);
      }
      setToastMessage(`Error: ${errorMsg}`);
      setShowToast(true);
    }
  });

  const handleConfirmTransition = () => {
    if (!pendingTransition) return;
    const { order, targetState } = pendingTransition;
    const payload = {
      estado: targetState,
      nota: transitionNote.trim() || undefined,
      costo_flete: targetState === 'flete_cotizado' && costoFleteInput ? Number(costoFleteInput) : undefined
    };
    updateStatusMutation.mutate({
      id: order.id || order.codigo,
      codigo: order.codigo,
      ...payload
    });
  };

  const allOrders = ordersData?.items || [];
  // Exclusivo para ventas por internet (pedidos web). Las ventas físicas de mostrador se gestionan en Mis Ventas.
  const orders = allOrders.filter(
    (o) => !o.observaciones?.includes('[VENTA MOSTRADOR]') && !o.observaciones?.includes('MOSTRADOR')
  );

  useEffect(() => {
    if (codigoParam && orders.length > 0 && !selectedOrder && hasAutoOpenedRef.current !== 'CLOSED' && hasAutoOpenedRef.current !== codigoParam) {
      const match = orders.find((o) => o.codigo === codigoParam || o.id === codigoParam);
      if (match) {
        setSelectedOrder(match);
        hasAutoOpenedRef.current = codigoParam;
      }
    }
  }, [codigoParam, orders, selectedOrder]);

  const statusBadgeClasses = {
    pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
    flete_cotizado: 'bg-purple-100 text-purple-800 border-purple-200',
    confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
    despachado: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    listo_para_recojo: 'bg-teal-100 text-teal-800 border-teal-200',
    entregado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelado: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusOptions = [
    'todos',
    'pendiente',
    'flete_cotizado',
    'confirmado',
    'despachado',
    'listo_para_recojo',
    'entregado',
    'cancelado'
  ];

  const modalidadKey = selectedOrder?.recojo_en_tienda ? 'recojo' : 'despacho';
  const allowedNext = selectedOrder ? (ALLOWED_TRANSITIONS[modalidadKey]?.[selectedOrder.estado] || []) : [];
  const isTerminal = selectedOrder ? allowedNext.length === 0 : false;

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Cabecera Principal del Módulo de Pedidos en Caja */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-kenpaku-blue flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-kenpaku-navy">Gestión de Pedidos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ventas por Internet (Tienda Virtual): cotización de flete, validación de vouchers, confirmación y despacho.
              </p>
            </div>
          </div>
        </div>

        {/* Herramientas de Control Operativo */}
        <div className="flex items-center gap-2">
          <button
            id="btn-run-cron"
            onClick={() => handleRunCron(0)}
            disabled={isCronRunning}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
            title="Ejecutar tareas programadas (recordatorios de pago y vencimientos)"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isCronRunning ? 'animate-spin' : ''}`} />
            <span>{isCronRunning ? 'Procesando...' : 'Ejecutar Cron'}</span>
          </button>
          <button
            id="btn-simulate-cron-48h"
            onClick={() => handleRunCron(49)}
            disabled={isCronRunning}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            title="Simular +48h para cancelación automática de pedidos no pagados y liberación de stock"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Simular +48h</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refrescar lista de pedidos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros por Estado y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador por código o teléfono */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-buscar-pedido"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(sanitizeOrderCode(e.target.value))}
            placeholder="Buscar por código o teléfono"
            maxLength={50}
            className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue/30 shadow-2xs"
          />
        </div>

        {/* Botones de Filtro de Estado */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${selectedStatus === st
                ? 'bg-kenpaku-navy text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No hay pedidos con el filtro actual</p>
            <p className="text-slate-400">Intenta buscar con otro término o selecciona &quot;Todos&quot;.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Código / Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Fase Operativa</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const clienteNombre = order.cliente_nombre ?? order.cliente?.nombre ?? 'Cliente Desconocido';
                  const clienteTelefono = order.cliente_telefono ?? order.cliente?.telefono ?? 'Sin teléfono';
                  const fechaFormateada = order.created_at
                    ? new Date(order.created_at).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })
                    : 'Sin fecha';

                  const needsFreightQuote =
                    !order.recojo_en_tienda &&
                    order.estado === 'pendiente' &&
                    (order.estado_flete === 'sin_cotizar' || !order.costo_flete || Number(order.costo_flete) <= 0);

                  const hasPendingVoucher =
                    Boolean(order.voucher_referencia) &&
                    order.estado !== 'confirmado' &&
                    !['despachado', 'listo_para_recojo', 'entregado', 'cancelado'].includes(order.estado);

                  return (
                    <tr
                      key={order.codigo || order.id}
                      className={`transition-colors ${needsFreightQuote
                        ? 'bg-amber-50/90 border-l-4 border-l-amber-500 hover:bg-amber-100/70'
                        : hasPendingVoucher
                        ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500 hover:bg-emerald-100/60'
                        : 'hover:bg-slate-50'
                        }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-kenpaku-navy block">{order.codigo}</span>
                        <span className="text-[10px] text-slate-400">
                          {fechaFormateada}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{clienteNombre}</td>
                      <td className="py-3.5 px-4 font-mono">{clienteTelefono}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                          {order.recojo_en_tienda ? 'Recojo en tienda' : 'Despacho a obra'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">{formatPEN(order.total)}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClasses[order.estado] || statusBadgeClasses.pendiente
                              }`}
                          >
                            {order.estado?.replace(/_/g, ' ')}
                          </span>
                          {needsFreightQuote && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs animate-pulse">
                                <Truck className="w-3 h-3" />
                                <span>Cotización Pendiente</span>
                              </span>
                            </div>
                          )}
                          {!needsFreightQuote && hasPendingVoucher && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs animate-pulse">
                                <CreditCard className="w-3 h-3" />
                                <span>Verificar Pago</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              hasAutoOpenedRef.current = order.codigo;
                              setSelectedOrder(order);
                            }}
                            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 ${needsFreightQuote
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md ring-2 ring-amber-300 ring-offset-1 animate-pulse font-extrabold'
                              : hasPendingVoucher
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-kenpaku-blue hover:bg-sky-700 text-white shadow-2xs'
                              }`}
                          >
                            {needsFreightQuote ? (
                              <>
                                <Truck className="w-3.5 h-3.5" />
                                <span>Cotizar Flete</span>
                              </>
                            ) : hasPendingVoucher ? (
                              'Verificar Pago'
                            ) : (
                              'Ver Detalle'
                            )}
                          </button>

                          {['confirmado', 'despachado', 'listo_para_recojo', 'entregado'].includes(order.estado) && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer text-xs"
                              title="Ver, descargar o imprimir boleta de venta"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Boleta</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle y Operación del Pedido */}
      {selectedOrder && (() => {
        const selectedOrderNeedsFreightQuote =
          !selectedOrder.recojo_en_tienda &&
          selectedOrder.estado === 'pendiente' &&
          (selectedOrder.estado_flete === 'sin_cotizar' || !selectedOrder.costo_flete || Number(selectedOrder.costo_flete) <= 0);

        return (
          <Modal
            isOpen={!!selectedOrder}
            onClose={handleCloseModal}
            title={`Gestión de Pedido ${selectedOrder.codigo}`}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-6 text-xs text-slate-700">
              {/* Aviso destacado si requiere cotización de flete */}
              {selectedOrderNeedsFreightQuote && (
                <div className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Truck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                        <span>⚠️ Cotización de Flete Pendiente Requerida</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 border border-amber-300">
                          Atención Caja
                        </span>
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Este pedido es con despacho a obra y requiere definir el costo de transporte para que el cliente pueda proceder a pagar.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCostoFleteInput(selectedOrder.costo_flete ? String(selectedOrder.costo_flete) : '');
                      setTransitionNote('');
                      setPendingTransition({ order: selectedOrder, targetState: 'flete_cotizado' });
                    }}
                    className="px-4 py-2 rounded-xl font-extrabold uppercase text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Cotizar Flete Ahora</span>
                  </button>
                </div>
              )}

              {/* Gestión Operativa y Fases (Fase Operativa Actual en la parte superior) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fase Operativa Actual</span>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${statusBadgeClasses[selectedOrder.estado] || statusBadgeClasses.pendiente}`}>
                    {selectedOrder.estado?.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Flujo: <strong className="text-slate-700">{selectedOrder.recojo_en_tienda ? 'Recojo en Almacén' : 'Despacho a Obra'}</strong>
                </span>
              </div>

              {/* Roadmap Visual de Fases: Fase anterior = Verde, Fase actual = Azul, Fase siguiente = Amarillo. Al entregarse, todo 100% Verde */}
              {(() => {
                const isRecojo = Boolean(selectedOrder.recojo_en_tienda);
                let cajeroActiveStep = 1;
                if (isRecojo) {
                  if (selectedOrder.estado === 'entregado') cajeroActiveStep = 4;
                  else if (selectedOrder.estado === 'listo_para_recojo') cajeroActiveStep = 3;
                  else if (['confirmado', 'despachado'].includes(selectedOrder.estado)) cajeroActiveStep = 2;
                  else cajeroActiveStep = 1;
                } else {
                  if (selectedOrder.estado === 'entregado') cajeroActiveStep = 5;
                  else if (selectedOrder.estado === 'despachado') cajeroActiveStep = 4;
                  else if (selectedOrder.estado === 'confirmado') cajeroActiveStep = 3;
                  else if (selectedOrder.estado === 'flete_cotizado') cajeroActiveStep = 2;
                  else cajeroActiveStep = 1;
                }

                const cajeroSteps = isRecojo
                  ? [
                      { fase: 'Fase 1', label: 'Registrado', sub: 'Pedido registrado' },
                      { fase: 'Fase 2', label: 'Pago y Voucher', sub: 'Pendiente abono' },
                      { fase: 'Fase 3', label: 'En Preparación', sub: 'Alistando patio' },
                      { fase: 'Fase 4', label: 'Listo Entrega', sub: 'Almacén Puente Piedra' },
                      { fase: 'Fase 5', label: 'Entregado', sub: 'Retiro conforme' },
                    ]
                  : [
                      { fase: 'Fase 1', label: 'Registrado', sub: 'Pedido registrado' },
                      { fase: 'Fase 2', label: 'Cotizar Flete', sub: 'Pendiente por caja' },
                      { fase: 'Fase 3', label: 'Flete Cotizado', sub: 'Espera pago/voucher' },
                      { fase: 'Fase 4', label: 'En Preparación', sub: 'Alistando patio' },
                      { fase: 'Fase 5', label: 'Pedido en Camino', sub: 'Camión en ruta' },
                      { fase: 'Fase 6', label: 'Entregado', sub: 'Conforme en obra' },
                    ];

                const isDelivered = selectedOrder.estado === 'entregado';

                return (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                      Progreso del Flujo de Fases:
                    </span>
                    <div className={`grid grid-cols-2 ${isRecojo ? 'sm:grid-cols-5' : 'sm:grid-cols-3 lg:grid-cols-6'} gap-2`}>
                      {cajeroSteps.map((step, idx) => {
                        const isPassed = isDelivered ? true : idx < cajeroActiveStep;
                        const isCurrent = !isDelivered && idx === cajeroActiveStep;
                        const isNext = !isDelivered && idx === cajeroActiveStep + 1;

                        return (
                          <div
                            key={step.label}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isPassed
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                                : isCurrent
                                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/25 text-sky-950 shadow-xs'
                                : isNext
                                ? 'bg-amber-50/90 border-amber-300 border-dashed text-amber-950'
                                : 'bg-white border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-extrabold uppercase block tracking-wider ${
                                isPassed
                                  ? 'text-emerald-700'
                                  : isCurrent
                                  ? 'text-sky-700'
                                  : isNext
                                  ? 'text-amber-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.fase}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isPassed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : isCurrent ? (
                                <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse shrink-0" />
                              ) : isNext ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500 shrink-0" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                              )}
                              <span className="text-[11px] font-bold truncate">{step.label}</span>
                            </div>
                            <span
                              className={`text-[9px] block truncate mt-0.5 ${
                                isPassed
                                  ? 'text-emerald-700'
                                  : isCurrent
                                  ? 'text-sky-800 font-bold'
                                  : isNext
                                  ? 'text-amber-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Acciones de Fase o Mensaje Terminal */}
              {isTerminal ? (
                <div className="pt-2 border-t border-slate-200/80">
                  {selectedOrder.estado === 'entregado' ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-xs">Pedido Entregado y Cerrado</h4>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Este pedido completó su ciclo de entrega con éxito. Se encuentra en estado terminal definitivo y ya no admite modificaciones.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-red-950 text-xs">Pedido Cancelado</h4>
                        <p className="text-[11px] text-red-700 mt-0.5">
                          Este pedido fue cancelado y su inventario fue liberado. Se encuentra en estado terminal definitivo y ya no admite modificaciones.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-2">
                    Avanzar a Siguiente Fase (por Caja):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allowedNext.map((st) => {
                      const isCancel = st === 'cancelado';
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setCostoFleteInput(selectedOrder.costo_flete ? String(selectedOrder.costo_flete) : '');
                            setTransitionNote('');
                            setPendingTransition({ order: selectedOrder, targetState: st });
                          }}
                          className={`px-3.5 py-2 rounded-xl font-bold uppercase text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${isCancel
                            ? 'bg-white hover:bg-red-50 text-red-700 border border-red-300'
                            : 'bg-kenpaku-navy hover:bg-slate-800 text-white'
                            }`}
                        >
                          {isCancel ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{ACTION_LABELS[st] || st.replace(/_/g, ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Delivery Information Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Columna Izquierda: Datos del Cliente */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Datos del Cliente
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-slate-900 text-sm">
                      {selectedOrder.cliente_nombre || selectedOrder.cliente?.nombre || 'Cliente General'}
                    </p>
                    {selectedOrder.observaciones?.includes('[VENTA MOSTRADOR]') && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        Venta Mostrador POS
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 pt-0.5 text-xs">
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedOrder.cliente_telefono || selectedOrder.cliente?.telefono || 'Sin teléfono'}
                    </span>
                    {selectedOrder.cliente_correo && (
                      <span className="text-slate-500 font-medium">{selectedOrder.cliente_correo}</span>
                    )}
                  </div>
                  {selectedOrder.observaciones && (
                    <div className="pt-1.5 border-t border-slate-100 mt-1">
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-mono">
                        <strong className="font-sans font-bold text-slate-700">Detalle / Nota:</strong> {selectedOrder.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Modalidad de Entrega */}
                <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Modalidad y Entrega
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedOrder.recojo_en_tienda ? (
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Truck className="w-4 h-4 text-kenpaku-blue shrink-0" />
                    )}
                    <p className="font-bold text-slate-900 text-xs">
                      {selectedOrder.recojo_en_tienda ? 'Recojo en Almacén Puente Piedra' : 'Despacho a Obra'}
                    </p>
                  </div>
                  {!selectedOrder.recojo_en_tienda && selectedOrder.direccion && (
                    <p className="flex items-start gap-1.5 text-slate-600 font-medium pt-1 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{selectedOrder.direccion}</span>
                    </p>
                  )}
                  {Number(selectedOrder.costo_flete) > 0 && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        Flete Cotizado: {formatPEN(selectedOrder.costo_flete)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notificación al Cliente por WhatsApp (Banner Independiente Ancho Completo) */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-950 block">
                    Notificar al Cliente por WhatsApp
                  </span>
                  <span className="text-[11px] sm:text-xs text-emerald-700 block mt-0.5">
                    Mensaje pre-redactado listo para enviar según fase actual ({selectedOrder.estado?.replace(/_/g, ' ')})
                  </span>
                </div>
              </div>

              <a
                href={buildStatusWhatsAppUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer self-start sm:self-auto"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Avisar al Cliente</span>
              </a>
            </div>

            {/* Voucher Verification Section (Soporta múltiples comprobantes 1 o 2) */}
            {(() => {
              const vouchers = getVoucherList(
                selectedOrder.voucher_referencia,
                selectedOrder.events || selectedOrder.order_events
              );
              if (!vouchers.length) return null;

              const isPaymentAlreadyValidated = ['confirmado', 'despachado', 'listo_para_recojo', 'entregado'].includes(
                selectedOrder.estado
              );
              const isPendingValidation = ['pendiente', 'flete_cotizado'].includes(selectedOrder.estado);

              return (
                <div
                  className={`p-4 rounded-2xl space-y-3.5 shadow-2xs transition-all ${
                    isPaymentAlreadyValidated
                      ? 'bg-emerald-50/80 border border-emerald-200'
                      : 'bg-sky-50/80 border border-sky-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 ${
                          isPaymentAlreadyValidated ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                      >
                        {isPaymentAlreadyValidated ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-extrabold block ${
                              isPaymentAlreadyValidated ? 'text-emerald-950' : 'text-sky-950'
                            }`}
                          >
                            {isPaymentAlreadyValidated
                              ? 'Comprobante(s) de Pago Verificado(s) y Aprobado(s)'
                              : 'Comprobante(s) de Pago Subido(s) por el Cliente'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isPaymentAlreadyValidated
                                ? 'bg-emerald-200/70 text-emerald-900 border border-emerald-300'
                                : 'bg-sky-200/70 text-sky-900 border border-sky-300'
                            }`}
                          >
                            {vouchers.length} {vouchers.length === 1 ? 'Comprobante' : 'Comprobantes'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] ${
                            isPaymentAlreadyValidated ? 'text-emerald-700' : 'text-sky-700'
                          }`}
                        >
                          {selectedOrder.fecha_pago
                            ? `Registrado: ${new Date(selectedOrder.fecha_pago).toLocaleString('es-PE')}`
                            : 'Fecha no registrada'}
                          {isPaymentAlreadyValidated && ' • Abono verificado por caja'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Comprobantes (Permite ver ambos comprobantes claramente) */}
                  <div
                    className={`grid grid-cols-1 ${
                      vouchers.length > 1 ? 'sm:grid-cols-2' : ''
                    } gap-3 pt-2 border-t ${
                      isPaymentAlreadyValidated ? 'border-emerald-200/60' : 'border-sky-200/60'
                    }`}
                  >
                    {vouchers.map((voucher, index) => (
                      <div
                        key={voucher.url || index}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </span>
                            {voucher.label || `Comprobante #${index + 1}`}
                          </span>
                          <a
                            href={voucher.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isPaymentAlreadyValidated
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
                            }`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir Completo</span>
                          </a>
                        </div>

                        {!voucher.isPdf ? (
                          <a
                            href={voucher.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xs h-36 flex items-center justify-center"
                            title={`Haga clic para ver ${voucher.label} en tamaño completo`}
                          >
                            <img
                              src={voucher.url}
                              alt={`Comprobante de pago ${index + 1}`}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Ampliar Imagen</span>
                            </div>
                          </a>
                        ) : (
                          <a
                            href={voucher.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100/70 transition-colors h-36 justify-center"
                          >
                            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-red-950">Documento PDF</p>
                              <p className="text-[10px] text-red-700">Haz clic para abrir</p>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Estado cuando el abono ya fue validado */}
                  {isPaymentAlreadyValidated && (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-2 text-[11px] text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Abono validado y stock reservado en almacén. Pedido en preparación o fases posteriores.</span>
                    </div>
                  )}

                  {/* Acciones directas SOLO si el abono está pendiente de revisión */}
                  {isPendingValidation && (
                    <div className="pt-2 border-t border-sky-200/80 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTransitionNote('');
                          setPendingTransition({ order: selectedOrder, targetState: 'confirmado' });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Validar Abono, Aceptar Pedido y Pasar a Preparación</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}



            {/* Timeline Events */}
            {selectedOrder.events && selectedOrder.events.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="font-bold text-slate-900">Línea de Tiempo (Historial)</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Más reciente primero</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(selectedOrder.events || []).slice().reverse().map((ev, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-[11px] flex justify-between items-center transition-all ${isLatest
                          ? 'bg-sky-50/80 border-[#0284C7]/40 ring-1 ring-[#0284C7]/20 shadow-2xs font-medium'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-kenpaku-navy capitalize">
                            {ev.estado_nuevo?.replace(/_/g, ' ')}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#0284C7] text-white text-[9px] font-extrabold uppercase">
                              Estado Actual
                            </span>
                          )}
                          <span className="text-slate-500 ml-1">
                            ({ev.autor}): {ev.nota || 'Sin nota'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {ev.created_at
                            ? new Date(ev.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
                            : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Ítems del Pedido</h4>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.nombre}</span>
                      <span className="text-slate-500">
                        Cantidad: {item.cantidad} x {formatPEN(item.precio_unitario)}
                      </span>
                    </div>
                    <span className="font-bold text-kenpaku-navy">
                      {formatPEN(item.cantidad * item.precio_unitario)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center text-sm">
              <span>Total Pedido (con IGV y Flete):</span>
              <span className="text-xl font-extrabold text-amber-400">{formatPEN(selectedOrder.total)}</span>
            </div>


          </div>
        </Modal>
        );
      })()}

      {/* Confirmation Modal for State Transition */}
      {pendingTransition && (
        <Modal
          isOpen={!!pendingTransition}
          onClose={() => {
            if (!updateStatusMutation.isPending) setPendingTransition(null);
          }}
          title="Confirmar Cambio de Fase"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  ¿Estás seguro de cambiar el estado del pedido {pendingTransition?.order?.codigo}?
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  De <strong className="uppercase">{pendingTransition?.order?.estado?.replace(/_/g, ' ')}</strong> a{' '}
                  <strong className="uppercase text-kenpaku-navy">{pendingTransition?.targetState?.replace(/_/g, ' ')}</strong>.
                </p>
              </div>
            </div>

            {/* Detailed operational impact note */}
            {getTransitionImpactMessage(pendingTransition?.targetState) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                {getTransitionImpactMessage(pendingTransition?.targetState)}
              </div>
            )}

            {/* Optional Freight Cost Input when target is flete_cotizado */}
            {pendingTransition?.targetState === 'flete_cotizado' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] block">
                  Costo de flete cotizado (S/):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costoFleteInput}
                  onChange={(e) => setCostoFleteInput(e.target.value)}
                  placeholder="Ej. 35.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-kenpaku-blue focus:outline-none"
                />
              </div>
            )}

            {/* Optional Note for order_events history */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 text-[11px] block">
                Nota u observación para el historial (opcional):
              </label>
              <input
                type="text"
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Ej. Depósito verificado / Conductor asignado..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-kenpaku-blue focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingTransition(null)}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={updateStatusMutation.isPending}
                className={`px-4 py-2 rounded-xl text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${pendingTransition?.targetState === 'cancelado'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-kenpaku-navy hover:bg-slate-800'
                  }`}
              >
                {updateStatusMutation.isPending ? 'Guardando...' : 'Sí, Confirmar Cambio'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Boleta de Venta */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptOrder(null);
        }}
        saleData={receiptOrder ? {
          codigo: receiptOrder.codigo,
          comprobanteTipo: 'boleta',
          docNumero: receiptOrder.cliente_dni || receiptOrder.cliente_ruc || receiptOrder.docNumero || '',
          clienteNombre: receiptOrder.cliente_nombre || receiptOrder.clienteNombre || 'Cliente General',
          clienteTelefono: receiptOrder.cliente_telefono || receiptOrder.clienteTelefono || '',
          clienteCorreo: receiptOrder.cliente_correo || receiptOrder.clienteCorreo || '',
          metodoPago: receiptOrder.metodo_pago || 'transferencia',
          montoRecibido: Number(receiptOrder.total || 0),
          vuelto: 0,
          items: receiptOrder.items || [],
          subtotal: Number(receiptOrder.subtotal || 0),
          costo_flete: Number(receiptOrder.costo_flete || 0),
          igv: Number(receiptOrder.igv || 0),
          total: Number(receiptOrder.total || 0),
          fechaEmision: receiptOrder.created_at || new Date()
        } : null}
      />
    </div>
  );
}

export { CajeroOrders as Orders };
