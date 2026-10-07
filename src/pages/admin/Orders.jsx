import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Eye, Phone, MapPin, CheckCircle2, Clock, XCircle, Truck } from 'lucide-react';
import { getAdminOrders, updateOrderStatus } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';

export function Orders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', selectedStatus],
    queryFn: () => getAdminOrders({ estado: selectedStatus })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, estado }) => updateOrderStatus(id, estado),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setToastMessage(`Estado del pedido ${variables.id} actualizado a "${variables.estado}".`);
      setShowToast(true);
      if (selectedOrder && selectedOrder.codigo === variables.id) {
        setSelectedOrder((prev) => ({ ...prev, estado: variables.estado }));
      }
    }
  });

  const orders = ordersData?.items || [];

  const statusBadgeClasses = {
    pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
    entregado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelado: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-kenpaku-navy">Gestión de Pedidos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Filtra y actualiza el estado comercial de los pedidos registrados</p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
          {['todos', 'pendiente', 'confirmado', 'entregado', 'cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                selectedStatus === st
                  ? 'bg-kenpaku-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
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
                {orders.map((order) => (
                  <tr key={order.codigo} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-kenpaku-navy block">{order.codigo}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.fecha).toLocaleDateString('es-PE')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{order.cliente?.nombre}</td>
                    <td className="py-3.5 px-4">{order.cliente?.telefono}</td>
                    <td className="py-3.5 px-4">
                      {order.recojo_en_tienda ? 'Recojo en tienda' : 'Despacho a obra'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-kenpaku-navy">{formatPEN(order.total)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          statusBadgeClasses[order.estado] || statusBadgeClasses.pendiente
                        }`}
                      >
                        {order.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
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
          title={`Detalle de Pedido ${selectedOrder.codigo}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                <p className="font-bold text-slate-900">{selectedOrder.cliente?.nombre}</p>
                <p>Teléfono: {selectedOrder.cliente?.telefono}</p>
                <p>Correo: {selectedOrder.cliente?.correo}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Modalidad de Entrega</span>
                <p className="font-bold text-slate-900">
                  {selectedOrder.recojo_en_tienda ? 'Recojo en Almacén Puente Piedra' : 'Despacho a Obra'}
                </p>
                {selectedOrder.direccion && <p>Dirección: {selectedOrder.direccion}</p>}
                {selectedOrder.observaciones && <p className="italic text-slate-500">Obs: {selectedOrder.observaciones}</p>}
              </div>
            </div>

            {/* Change Status Controls */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                Cambiar Estado del Pedido:
              </label>
              <div className="flex flex-wrap gap-2">
                {['pendiente', 'confirmado', 'entregado', 'cancelado'].map((st) => (
                  <button
                    key={st}
                    onClick={() => updateStatusMutation.mutate({ id: selectedOrder.codigo, estado: st })}
                    disabled={selectedOrder.estado === st}
                    className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] border transition-all ${
                      selectedOrder.estado === st
                        ? 'bg-kenpaku-navy text-white border-kenpaku-navy'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

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
              <span>Total Pedido:</span>
              <span className="text-xl font-extrabold text-amber-400">{formatPEN(selectedOrder.total)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
