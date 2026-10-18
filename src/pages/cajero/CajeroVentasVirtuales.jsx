import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  Package,
  Calendar,
  Truck,
  Store,
  MessageSquare,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../../components/ui/Button';

export function CajeroVentasVirtuales() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalityFilter, setModalityFilter] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchVirtualSales = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminOrders({ page_size: 100 });
      const allOrders = data.items || [];

      // Filtrar pedidos virtuales (los que NO fueron emitidos directamente por el POS físico)
      const virtualOnly = allOrders.filter(
        (o) => !o.observaciones?.includes('[VENTA MOSTRADOR]')
      );

      setOrders(virtualOnly);
    } catch (err) {
      console.error('Error al cargar ventas virtuales en caja:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualSales();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'todos' && o.estado !== statusFilter) return false;
    if (modalityFilter === 'recojo' && !o.recojo_en_tienda) return false;
    if (modalityFilter === 'despacho' && o.recojo_en_tienda) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const codigo = (o.codigo || '').toLowerCase();
    const cliente = (o.cliente_nombre || '').toLowerCase();
    const tel = (o.cliente_telefono || '').toLowerCase();
    const email = (o.cliente_correo || '').toLowerCase();

    return (
      codigo.includes(term) ||
      cliente.includes(term) ||
      tel.includes(term) ||
      email.includes(term)
    );
  });

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'entregado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pagado':
      case 'confirmado':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'listo_para_recojo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'flete_cotizado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'despachado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const pendingCount = orders.filter((o) => o.estado === 'pendiente').length;
  const recojoCount = orders.filter((o) => o.recojo_en_tienda).length;
  const despachoCount = orders.filter((o) => !o.recojo_en_tienda).length;

  return (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-kenpaku-navy">
              Ventas Virtuales (Tienda Online y Web)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Supervisa los pedidos realizados por clientes a través de la web, pedidos de recojo en tienda y despachos a obra.
          </p>
        </div>

        {/* Buscador y Controles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar código, cliente o celular..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="listo_para_recojo">Listo para Recojo</option>
            <option value="despachado">Despachado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
          >
            <option value="todos">Toda modalidad</option>
            <option value="recojo">Recojo en Tienda</option>
            <option value="despacho">Despacho a Obra</option>
          </select>

          <button
            type="button"
            onClick={fetchVirtualSales}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Actualizar pedidos virtuales"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Total Pedidos Web
            </div>
            <div className="text-lg font-black text-kenpaku-navy">
              {orders.length} pedidos
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Recojo en Tienda
            </div>
            <div className="text-lg font-black text-amber-700">
              {recojoCount} clientes
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Despacho a Obra
            </div>
            <div className="text-lg font-black text-sky-700">
              {despachoCount} envíos
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos Virtuales */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-kenpaku-blue" />
            <p className="text-sm font-semibold">Cargando ventas virtuales...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No hay ventas virtuales</p>
            <p className="text-xs text-slate-400">
              Los pedidos realizados desde la tienda web se mostrarán en esta lista.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código Web</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente / Celular</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Monto Total</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredOrders.map((order) => {
                  const itemsCount = (order.items || []).reduce(
                    (sum, it) => sum + (it.cantidad || 1),
                    0
                  );
                  const isRecojo = order.recojo_en_tienda;
                  const rawPhone = (order.cliente_telefono || '').replace(/\D/g, '');
                  const waUrl = rawPhone
                    ? `https://wa.me/51${rawPhone}?text=${encodeURIComponent(
                        `Hola ${order.cliente_nombre || ''}, te saludamos de Comercial Kenpaku sobre tu pedido web ${order.codigo}.`
                      )}`
                    : null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {order.codigo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {order.cliente_nombre || 'Cliente Web'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{order.cliente_telefono || 'Sin celular'}</span>
                          {order.cliente_correo && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px] text-slate-400">
                                {order.cliente_correo}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isRecojo
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}
                        >
                          {isRecojo ? (
                            <>
                              <Store className="w-3 h-3 text-amber-600" />
                              <span>Recojo Tienda</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3 h-3 text-sky-600" />
                              <span>Despacho Obra</span>
                            </>
                          )}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(
                            order.estado
                          )}`}
                        >
                          {order.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-kenpaku-navy">
                        {formatPEN(order.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Ver detalle del pedido"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Contactar al cliente por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
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

      {/* Modal de Detalle de Pedido Virtual */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-kenpaku-navy">
                  Pedido Virtual {selectedOrder.codigo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-800">Cliente:</strong> {selectedOrder.cliente_nombre}
                </div>
                <div>
                  <strong className="text-slate-800">Teléfono:</strong> {selectedOrder.cliente_telefono}
                </div>
                {selectedOrder.cliente_correo && (
                  <div>
                    <strong className="text-slate-800">Correo:</strong> {selectedOrder.cliente_correo}
                  </div>
                )}
                <div>
                  <strong className="text-slate-800">Modalidad:</strong>{' '}
                  {selectedOrder.recojo_en_tienda ? 'Recojo en tienda' : `Despacho a obra (${selectedOrder.direccion || 'Sin dirección'})`}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  Productos solicitados
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="font-semibold text-slate-800">
                        {it.nombre || it.nombre_snapshot}
                      </div>
                      <div className="font-mono text-slate-600">
                        {it.cantidad} × {formatPEN(it.precio_unitario || it.precio_unitario_snapshot || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-kenpaku-navy">
                <span>Total del Pedido:</span>
                <span className="text-base text-kenpaku-blue">{formatPEN(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
