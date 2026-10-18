import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RefreshCw,
  Package,
  Calendar,
  Store,
  DollarSign,
  FileText,
  Eye,
  CreditCard,
  Download
} from 'lucide-react';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { Button } from '../../components/ui/Button';

export function CajeroMisVentas() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchPhysicalSales = async () => {
    setIsLoading(true);
    try {
      // 1. Obtener ventas guardadas de inmediato en el terminal local
      let localSales = [];
      try {
        localSales = JSON.parse(localStorage.getItem('kenpaku_pos_sales') || '[]');
      } catch (e) {
        console.error('Error leyendo registro local de caja:', e);
      }

      // 2. Obtener pedidos registrados en el backend
      let apiSales = [];
      try {
        const data = await getAdminOrders({ page_size: 100 });
        const allOrders = data.items || [];
        apiSales = allOrders.filter(
          (o) =>
            o.observaciones?.includes('[VENTA MOSTRADOR]') ||
            o.observaciones?.includes('MOSTRADOR') ||
            (o.recojo_en_tienda && !o.costo_flete)
        );
      } catch (err) {
        console.warn('Nota: usando ventas locales por estado de red/auth:', err);
      }

      // 3. Unificar ambas fuentes evitando duplicados por código
      const combined = [...localSales];
      apiSales.forEach((apiOrder) => {
        if (!combined.some((item) => item.codigo === apiOrder.codigo)) {
          let docNum = '';
          const matchDoc = apiOrder.observaciones?.match(/Doc:\s*([0-9]+)/i);
          if (matchDoc) {
            docNum = matchDoc[1];
          }

          const isFactura = apiOrder.observaciones?.toUpperCase().includes('FACTURA') || false;
          let metodoPago = 'efectivo';
          if (apiOrder.observaciones?.includes('YAPE')) metodoPago = 'yape';
          else if (apiOrder.observaciones?.includes('BCP')) metodoPago = 'bcp';
          else if (apiOrder.observaciones?.includes('BBVA')) metodoPago = 'bbva';

          combined.push({
            id: apiOrder.id,
            codigo: apiOrder.codigo,
            comprobanteTipo: isFactura ? 'factura' : 'boleta',
            docNumero: docNum || '44444444',
            clienteNombre: apiOrder.cliente_nombre || 'Cliente General',
            clienteTelefono: apiOrder.cliente_telefono || '',
            clienteCorreo: apiOrder.cliente_correo || '',
            metodoPago,
            items: (apiOrder.items || []).map((it) => ({
              product_id: it.id || it.product_id,
              nombre: it.nombre || it.nombre_snapshot,
              cantidad: it.cantidad,
              precio_unitario: Number(it.precio_unitario || it.precio_unitario_snapshot || 0)
            })),
            subtotal: Number(apiOrder.subtotal || 0),
            igv: Number(apiOrder.igv || 0),
            total: Number(apiOrder.total || 0),
            created_at: apiOrder.created_at || new Date().toISOString()
          });
        }
      });

      // Ordenar cronológicamente (más recientes primero)
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(combined);
    } catch (err) {
      console.error('Error al consolidar ventas físicas en caja:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhysicalSales();
  }, []);

  // Filtrado reactivo en memoria por término de búsqueda (ID o DNI)
  const filteredSales = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const codigo = (o.codigo || '').toLowerCase();
    const dni = (o.docNumero || '').toLowerCase();
    const cliente = (o.clienteNombre || o.cliente_nombre || '').toLowerCase();

    return codigo.includes(term) || dni.includes(term) || cliente.includes(term);
  });

  // Métricas financieras acumuladas en caja
  const totalEnCaja = filteredSales.reduce((acc, o) => acc + Number(o.total || 0), 0);

  const handleOpenReceipt = (order) => {
    setSelectedOrderForReceipt({
      codigo: order.codigo,
      comprobanteTipo: order.comprobanteTipo || 'boleta',
      docNumero: order.docNumero || '44444444',
      clienteNombre: order.clienteNombre || order.cliente_nombre || 'Cliente General',
      clienteTelefono: order.clienteTelefono || order.cliente_telefono || '',
      clienteCorreo: order.clienteCorreo || order.cliente_correo || '',
      metodoPago: order.metodoPago || 'efectivo',
      montoRecibido: order.montoRecibido || order.total,
      vuelto: order.vuelto || 0,
      items: order.items || [],
      subtotal: Number(order.subtotal || 0),
      igv: Number(order.igv || 0),
      total: Number(order.total || 0),
      fechaEmision: order.created_at || new Date()
    });
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-6 h-6 text-kenpaku-blue" />
            <h1 className="text-xl font-extrabold text-kenpaku-navy">
              Mis Ventas
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Registro de ventas físicas emitidas en mostrador con acceso directo para ver, descargar e imprimir la boleta de venta.
          </p>
        </div>

        {/* Buscador y Botón de Recargar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              maxLength={50}
              onChange={(e) => setSearchTerm(e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '').slice(0, 50))}
              placeholder="Buscar por ID (KPK-...), DNI o RUC..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue w-64"
            />
          </div>

          <button
            type="button"
            onClick={fetchPhysicalSales}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Actualizar registro de ventas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumen de Caja / Total Ingresado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Total Ingresado en Caja
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {formatPEN(totalEnCaja)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-kenpaku-blue flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Ventas Físicas Realizadas
            </div>
            <div className="text-2xl font-black text-kenpaku-navy">
              {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Simplificada de Ventas: ID del Pedido | DNI | Botón Ver Boleta */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-kenpaku-blue" />
            <p className="text-sm font-semibold">Cargando ventas de mostrador...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No hay ventas registradas</p>
            <p className="text-xs text-slate-400">
              Al confirmar una venta en el Punto de Venta aparecerá aquí de forma automática.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">ID del Pedido</th>
                  <th className="py-4 px-6">DNI del Cliente</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredSales.map((sale) => (
                  <tr key={sale.id || sale.codigo} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID del Pedido */}
                    <td className="py-4 px-6">
                      <div className="font-mono font-black text-sm text-kenpaku-blue">
                        {sale.codigo}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sale.created_at).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* DNI del Cliente */}
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                        {sale.docNumero || 'Sin DNI'}
                      </span>
                      {sale.clienteNombre && (
                        <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[200px]">
                          {sale.clienteNombre}
                        </div>
                      )}
                    </td>

                    {/* Botón para Ver la Boleta de Venta */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(sale)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-kenpaku-blue text-white hover:bg-sky-700 transition-colors shadow-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Boleta de Venta</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Comprobante / Boleta de Venta con Imprimir y Descargar */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={selectedOrderForReceipt}
      />
    </div>
  );
}
