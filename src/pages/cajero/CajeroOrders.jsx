import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Printer,
  MessageSquare,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { Button } from '../../components/ui/Button';

export function CajeroOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = { page_size: 50 };
      if (statusFilter !== 'todos') params.estado = statusFilter;
      if (searchTerm) params.q = searchTerm;

      const data = await getAdminOrders(params);
      setOrders(data.items || []);
    } catch (err) {
      console.error('Error al cargar ventas en caja:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleOpenReceipt = (order) => {
    // Determinar si es factura o boleta a partir de observaciones o formato
    const isFactura = order.observaciones?.includes('FACTURA') || false;
    const items = (order.items || []).map((it) => ({
      product_id: it.id || it.product_id,
      nombre: it.nombre || it.nombre_snapshot,
      cantidad: it.cantidad,
      precio_unitario: Number(it.precio_unitario || it.precio_unitario_snapshot || 0)
    }));

    setSelectedOrderForReceipt({
      codigo: order.codigo,
      comprobanteTipo: isFactura ? 'factura' : 'boleta',
      clienteNombre: order.cliente_nombre || order.cliente?.nombre || 'Cliente General',
      clienteTelefono: order.cliente_telefono || order.cliente?.telefono || '',
      clienteCorreo: order.cliente_correo || order.cliente?.correo || '',
      metodoPago: order.observaciones?.includes('YAPE')
        ? 'yape'
        : order.observaciones?.includes('BCP')
        ? 'bcp'
        : order.observaciones?.includes('BBVA')
        ? 'bbva'
        : 'efectivo',
      items,
      subtotal: Number(order.subtotal || 0),
      igv: Number(order.igv || 0),
      total: Number(order.total || 0),
      fechaEmision: order.created_at || new Date()
    });
    setIsReceiptOpen(true);
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'entregado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pagado':
      case 'confirmado':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'listo_para_recojo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera y Resumen de Ventas */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-kenpaku-blue" />
            <h1 className="text-xl font-extrabold text-kenpaku-navy">
              Historial de Ventas y Pedidos en Tienda
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Consulta comprobantes emitidos, verifica estados y reimprime tickets de mostrador.
          </p>
        </div>

        {/* Buscador y Filtros */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar código o teléfono..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
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
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <Button type="submit" variant="primary" size="sm" icon={Search}>
            Buscar
          </Button>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-kenpaku-blue" />
            <p className="text-sm font-semibold">Cargando registros de venta...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No se encontraron ventas</p>
            <p className="text-xs text-slate-400">
              No hay pedidos que coincidan con los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Cliente / Contacto</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {orders.map((o) => {
                  const itemsCount = (o.items || []).reduce((sum, it) => sum + (it.cantidad || 1), 0);
                  const isRecojo = o.recojo_en_tienda;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-kenpaku-blue">
                        {o.codigo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[180px]">
                          {o.cliente_nombre || o.cliente?.nombre || 'Cliente General'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {o.cliente_telefono || o.cliente?.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isRecojo
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {isRecojo ? 'Recojo en tienda' : 'Despacho obra'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(
                            o.estado
                          )}`}
                        >
                          {o.estado.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-kenpaku-navy">
                        {formatPEN(o.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(o)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-kenpaku-blue hover:bg-sky-100 border border-sky-200 transition-colors shadow-2xs"
                          title="Ver o imprimir comprobante"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
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

      {/* Modal de Comprobante / Ticket */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={selectedOrderForReceipt}
      />
    </div>
  );
}
