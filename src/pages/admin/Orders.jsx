import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingBag, Eye, Phone, MapPin, CheckCircle2, Clock, XCircle, Truck, AlertTriangle, ShieldCheck, MessageCircle, CreditCard, FileText, ExternalLink, Zap } from 'lucide-react';
import { getAdminOrders, updateOrderStatus, triggerScheduledTasks } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { buildStatusWhatsAppUrl } from '../../utils/whatsapp';
import { getVoucherUrl } from '../../utils/voucher';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { sanitizeOrderCode } from '../../utils/sanitizers';

const ALLOWED_TRANSITIONS = {
  recojo: {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['listo_para_recojo', 'cancelado'],
    listo_para_recojo: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: []
  },
  despacho: {
    pendiente: ['flete_cotizado', 'confirmado', 'cancelado'],
    flete_cotizado: ['confirmado', 'cancelado'],
    confirmado: ['despachado', 'cancelado'],
    despachado: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: []
  }
};

const ACTION_LABELS = {
  flete_cotizado: 'Cotizar Flete',
  confirmado: 'Confirmar Pedido',
  despachado: 'Marcar Despachado a Obra',
  listo_para_recojo: 'Listo para Recojo en Almacén',
  entregado: 'Marcar como Entregado',
  cancelado: 'Cancelar Pedido'
};

const MODAL_FLOW_STEPS = {
  despacho: [
    { key: 'pendiente', label: '1. Registrado', sub: 'Pedido en web' },
    { key: 'flete_cotizado', label: '2. Flete Cotizado', sub: 'Cálculo de flete' },
    { key: 'confirmado', label: '3. En Preparación', sub: 'Pago validado' },
    { key: 'despachado', label: '4. Despachado', sub: 'Camión en ruta' },
    { key: 'entregado', label: '5. Entregado', sub: 'Conforme en obra' },
  ],
  recojo: [
    { key: 'pendiente', label: '1. Registrado', sub: 'Pedido en web' },
    { key: 'confirmado', label: '2. En Preparación', sub: 'Pago validado' },
    { key: 'listo_para_recojo', label: '3. Listo en Almacén', sub: 'Puente Piedra' },
    { key: 'entregado', label: '4. Entregado', sub: 'Retiro cliente' },
  ],
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
      return '📋 Se definirá el monto del flete de transporte para que el pedido esté listo para confirmación.';
    default:
      return '¿Deseas proceder con este cambio de fase operativa?';
  }
}

export function Orders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [costoFleteInput, setCostoFleteInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCronRunning, setIsCronRunning] = useState(false);

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

  const { data: ordersData, isLoading } = useQuery({
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
              autor: 'admin',
              nota: variables.nota || 'Cambio manual de estado',
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

  const orders = ordersData?.items || [];

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold text-kenpaku-navy">Gestión de Pedidos</h2>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-run-cron"
                onClick={() => handleRunCron(0)}
                disabled={isCronRunning}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                title="Ejecutar tareas programadas ahora mismo (recordatorios y vencimientos)"
              >
                <Zap className={`w-3 h-3 text-amber-400 ${isCronRunning ? 'animate-spin' : ''}`} />
                <span>{isCronRunning ? 'Procesando...' : 'Ejecutar Cron'}</span>
              </button>
              <button
                id="btn-simulate-cron-48h"
                onClick={() => handleRunCron(49)}
                disabled={isCronRunning}
                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-xl transition-all disabled:opacity-50"
                title="Simular +48h para demostración de cancelación automática de pedidos y liberación de stock"
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Simular +48h</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Filtra y actualiza el estado comercial y logístico de los pedidos</p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all ${selectedStatus === st
                ? 'bg-kenpaku-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Buscador por código o teléfono */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="input-buscar-pedido"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(sanitizeOrderCode(e.target.value))}
          placeholder="Buscar por código o teléfono"
          maxLength={50}
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue/30"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No se encontraron pedidos registrados con el filtro seleccionado.
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
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const clienteNombre = order.cliente_nombre || order.cliente?.nombre || 'Sin nombre';
                  const clienteTelefono = order.cliente_telefono || order.cliente?.telefono || 'Sin teléfono';
                  const rawDate = order.created_at || order.fecha;
                  const fechaFormateada = rawDate ? new Date(rawDate).toLocaleDateString('es-PE') : 'Fecha no disp.';

                  const hasPendingVoucher =
                    Boolean(order.voucher_referencia) &&
                    order.estado !== 'confirmado' &&
                    !['despachado', 'listo_para_recojo', 'entregado', 'cancelado'].includes(order.estado);

                  return (
                    <tr
                      key={order.codigo || order.id}
                      className={`transition-colors ${hasPendingVoucher
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
                      <td className="py-3.5 px-4">{clienteTelefono}</td>
                      <td className="py-3.5 px-4">
                        {order.recojo_en_tienda ? 'Recojo en tienda' : 'Despacho a obra'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-kenpaku-navy">{formatPEN(order.total)}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadgeClasses[order.estado] || statusBadgeClasses.pendiente
                              }`}
                          >
                            {order.estado?.replace(/_/g, ' ')}
                          </span>
                          {hasPendingVoucher && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs animate-pulse">
                                <CreditCard className="w-3 h-3" />
                                <span>Verificar Pago</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`px-2.5 py-1.5 font-semibold rounded-lg transition-colors cursor-pointer text-xs ${hasPendingVoucher
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {hasPendingVoucher ? 'Verificar Pago' : 'Ver Detalle'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Detalle del Pedido ${selectedOrder.codigo}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Visual Operational Pipeline Roadmap */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/80 pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Ruta de Fases Operativas ({selectedOrder.recojo_en_tienda ? 'Recojo en Almacén' : 'Despacho a Obra'})
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  Fase actual: <strong className="text-kenpaku-navy uppercase">{selectedOrder.estado?.replace(/_/g, ' ')}</strong>
                </span>
              </div>

              <div className={`grid grid-cols-2 ${selectedOrder.recojo_en_tienda ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-2`}>
                {(selectedOrder.recojo_en_tienda ? MODAL_FLOW_STEPS.recojo : MODAL_FLOW_STEPS.despacho).map((step, idx, arr) => {
                  const isCancelled = selectedOrder.estado === 'cancelado';
                  const currentIndex = arr.findIndex((s) => s.key === selectedOrder.estado);
                  const isPassed = !isCancelled && currentIndex > idx;
                  const isCurrent = !isCancelled && currentIndex === idx;
                  const isNext = !isCancelled && currentIndex + 1 === idx;

                  return (
                    <div
                      key={step.key}
                      className={`p-2.5 rounded-xl border text-center transition-all ${isCancelled
                        ? 'bg-white border-slate-200 opacity-50'
                        : isCurrent
                          ? 'bg-sky-50 border-[#0284C7] ring-2 ring-[#0284C7]/20 shadow-xs'
                          : isPassed
                            ? 'bg-emerald-50 border-emerald-300'
                            : isNext
                              ? 'bg-amber-50/70 border-amber-300 border-dashed'
                              : 'bg-white border-slate-200 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent
                            ? 'bg-[#0284C7] text-white'
                            : isPassed
                              ? 'bg-emerald-600 text-white'
                              : isNext
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </span>
                      </div>
                      <span className={`block text-[11px] font-extrabold ${isCurrent ? 'text-sky-950' : isPassed ? 'text-emerald-950' : isNext ? 'text-amber-950' : 'text-slate-700'}`}>
                        {step.label}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {isCurrent ? '● Fase Actual' : isNext ? '➡️ Siguiente' : isPassed ? '✓ Listo' : step.sub}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Next Step Operational Guidance Tip */}
              {!['entregado', 'cancelado'].includes(selectedOrder.estado) && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-kenpaku-navy shrink-0">💡 Próximo paso:</span>
                  <span>
                    {selectedOrder.estado === 'pendiente' && !selectedOrder.recojo_en_tienda && 'Cotizar el costo de flete según el volumen y distancia a obra.'}
                    {selectedOrder.estado === 'pendiente' && selectedOrder.recojo_en_tienda && 'Validar el pago del cliente y pasar el pedido a preparación.'}
                    {selectedOrder.estado === 'flete_cotizado' && 'Esperar que el cliente acepte el flete y suba su comprobante de pago para validar.'}
                    {selectedOrder.estado === 'confirmado' && !selectedOrder.recojo_en_tienda && 'Finalizar la preparación de materiales y marcar el pedido como despachado en camión.'}
                    {selectedOrder.estado === 'confirmado' && selectedOrder.recojo_en_tienda && 'Preparar los materiales en patio y marcar como listo para recojo en almacén.'}
                    {selectedOrder.estado === 'listo_para_recojo' && 'Entregar los materiales al cliente y registrar la conformidad de retiro.'}
                    {selectedOrder.estado === 'despachado' && 'Confirmar la llegada y descarga conforme en obra para marcar como entregado.'}
                  </span>
                </div>
              )}
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                <p className="font-bold text-slate-900">{selectedOrder.cliente_nombre || selectedOrder.cliente?.nombre || 'Sin nombre'}</p>
                <p>Teléfono: {selectedOrder.cliente_telefono || selectedOrder.cliente?.telefono || 'Sin teléfono'}</p>
                <p>Correo: {selectedOrder.cliente_correo || selectedOrder.cliente?.correo || 'Sin correo'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Modalidad de Entrega</span>
                <p className="font-bold text-slate-900">
                  {selectedOrder.recojo_en_tienda ? 'Recojo en Almacén Puente Piedra' : 'Despacho a Obra'}
                </p>
                {selectedOrder.direccion && <p>Dirección: {selectedOrder.direccion}</p>}
                {Number(selectedOrder.costo_flete) > 0 && (
                  <p className="font-bold text-indigo-700">Flete: {formatPEN(selectedOrder.costo_flete)} ({selectedOrder.estado_flete || 'cotizado'})</p>
                )}
                {selectedOrder.observaciones && <p className="italic text-slate-500">Obs: {selectedOrder.observaciones}</p>}
              </div>
            </div>

            {/* WhatsApp Notification Action for Admin */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-emerald-950 block">
                    Notificar al Cliente por WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Mensaje pre-redactado listo para enviar según fase actual ({selectedOrder.estado?.replace(/_/g, ' ')})
                  </span>
                </div>
              </div>

              <a
                href={buildStatusWhatsAppUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Avisar al Cliente</span>
              </a>
            </div>

            {/* Voucher Verification Section (Fase 4) */}
            {selectedOrder.voucher_referencia && (() => {
              const isPaymentAlreadyValidated = ['confirmado', 'despachado', 'listo_para_recojo', 'entregado'].includes(selectedOrder.estado);
              const isPendingValidation = ['pendiente', 'flete_cotizado'].includes(selectedOrder.estado);

              return (
                <div className={`p-4 rounded-2xl space-y-3 shadow-2xs transition-all ${isPaymentAlreadyValidated
                  ? 'bg-emerald-50/80 border border-emerald-200'
                  : 'bg-sky-50/80 border border-sky-200'
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 ${isPaymentAlreadyValidated ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}>
                        {isPaymentAlreadyValidated ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className={`text-[11px] font-extrabold block ${isPaymentAlreadyValidated ? 'text-emerald-950' : 'text-sky-950'
                          }`}>
                          {isPaymentAlreadyValidated
                            ? 'Comprobante de Pago Verificado y Aprobado'
                            : 'Comprobante de Pago Subido por el Cliente'}
                        </span>
                        <span className={`text-[10px] ${isPaymentAlreadyValidated ? 'text-emerald-700' : 'text-sky-700'
                          }`}>
                          {selectedOrder.fecha_pago
                            ? `Registrado: ${new Date(selectedOrder.fecha_pago).toLocaleString('es-PE')}`
                            : 'Fecha no registrada'}
                          {isPaymentAlreadyValidated && ' • Abono verificado por caja'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getVoucherUrl(selectedOrder.voucher_referencia)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto shrink-0 ${isPaymentAlreadyValidated
                        ? 'bg-white hover:bg-emerald-100/50 border-emerald-300 text-emerald-900'
                        : 'bg-white hover:bg-sky-100/50 border-sky-300 text-sky-900'
                        }`}
                    >
                      <ExternalLink className={`w-3.5 h-3.5 ${isPaymentAlreadyValidated ? 'text-emerald-600' : 'text-sky-600'}`} />
                      <span>Ver Voucher Completo</span>
                    </a>
                  </div>

                  {/* Vista previa compacta si es imagen */}
                  {(() => {
                    const voucherUrl = getVoucherUrl(selectedOrder.voucher_referencia);
                    const isImage = !voucherUrl.toLowerCase().endsWith('.pdf');
                    if (!isImage) return null;
                    return (
                      <div className="pt-2 border-t border-sky-200/60 flex items-center gap-3">
                        <a
                          href={voucherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group relative overflow-hidden rounded-xl border border-sky-200 bg-white shadow-2xs shrink-0"
                          title="Haga clic para abrir en tamaño completo"
                        >
                          <img
                            src={voucherUrl}
                            alt="Vista previa del comprobante"
                            className="w-24 h-24 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            Ampliar
                          </div>
                        </a>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p className="font-bold text-gray-900">Vista previa del comprobante</p>
                          <p className="text-[11px] text-gray-500">
                            Haz clic en la miniatura o en &quot;Ver Voucher Completo&quot; para abrir la imagen en tamaño original.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

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
                          setTransitionNote('Pago validado por caja tras revisión de voucher');
                          setPendingTransition({ order: selectedOrder, targetState: 'confirmado' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validar Abono y Confirmar Pedido</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* State Management Section */}
            <div>
              {isTerminal ? (
                <div>
                  {selectedOrder.estado === 'entregado' ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-xs">Pedido Entregado y Cerrado</h4>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Este pedido completó su ciclo de entrega con éxito. Se encuentra en estado terminal definitivo y ya no admite modificaciones.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                        <XCircle className="w-5 h-5" />
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

                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-2">
                      Avanzar a Siguiente Fase (requiere confirmación):
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
                </div>
              )}
            </div>

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
      )}

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
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
              {getTransitionImpactMessage(pendingTransition?.targetState)}
            </div>

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
    </div>
  );
}
