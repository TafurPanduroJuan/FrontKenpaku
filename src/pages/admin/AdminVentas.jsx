import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  Globe,
  Store,
  Truck,
  CreditCard,
  Wallet,
  Eye,
  RefreshCw,
  X,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAdminOrders } from '../../api/admin';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { exportSalesToExcel } from '../../utils/exportSalesToExcel';

export function AdminVentas() {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [canalFilter, setCanalFilter] = useState('todos'); // 'todos', 'web', 'mostrador'
  const [metodoPagoFilter, setMetodoPagoFilter] = useState('todos'); // 'todos', 'efectivo', 'yape_plin', 'transferencia', 'tarjeta'
  const [entregaFilter, setEntregaFilter] = useState('todos'); // 'todos', 'recojo', 'despacho'
  const [montoPreset, setMontoPreset] = useState('todos'); // 'todos', 'mayor_100', 'mayor_500', 'custom'
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [fechaPreset, setFechaPreset] = useState('todos'); // 'todos', 'hoy', '7dias', 'mes', 'custom'
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [comprobanteFilter, setComprobanteFilter] = useState('todos'); // 'todos', 'boleta', 'factura'

  // Modal de Detalle de Venta
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState(null);

  // Carga de todas las ventas consolidadas
  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Obtener ventas físicas locales registradas en caja si existen
      let localSales = [];
      try {
        localSales = JSON.parse(localStorage.getItem('kenpaku_pos_sales') || '[]');
      } catch {
        localSales = [];
      }

      // 2. Obtener órdenes del backend
      let apiOrders = [];
      try {
        const response = await getAdminOrders({ page_size: 1000 });
        apiOrders = response?.items || [];
      } catch (err) {
        console.warn('Fallo al obtener pedidos del API:', err);
      }

      // 3. Unificar ambas fuentes sin duplicados por código
      const salesMap = new Map();

      // Priorizar datos de API
      apiOrders.forEach((o) => {
        if (!o || !o.codigo) return;
        const isMostrador =
          o.canal === 'pos_tienda' ||
          o.observaciones?.includes('[VENTA MOSTRADOR]') ||
          o.observaciones?.includes('MOSTRADOR');

        const obsUpper = (o.observaciones || '').toUpperCase();
        let metodo = 'No especificado';
        if (obsUpper.includes('PAGO: EFECTIVO') || obsUpper.includes('EFECTIVO')) {
          metodo = 'efectivo';
        } else if (obsUpper.includes('YAPE') || obsUpper.includes('PLIN')) {
          metodo = 'yape_plin';
        } else if (obsUpper.includes('BCP') || obsUpper.includes('BBVA') || obsUpper.includes('TRANSFERENCIA')) {
          metodo = 'transferencia';
        } else if (obsUpper.includes('TARJETA') || obsUpper.includes('POS')) {
          metodo = 'tarjeta';
        } else if (o.voucher_referencia || o.fecha_pago) {
          metodo = 'transferencia';
        }

        const isFactura = obsUpper.includes('FACTURA');
        let docNum = '';
        const matchDoc = o.observaciones?.match(/Doc:\s*([0-9A-Za-z]+)/i);
        if (matchDoc) docNum = matchDoc[1];

        salesMap.set(o.codigo, {
          id: o.id,
          codigo: o.codigo,
          canal: isMostrador ? 'mostrador' : 'web',
          clienteNombre: o.cliente_nombre || o.cliente?.nombre || 'Cliente Web',
          clienteTelefono: o.cliente_telefono || o.cliente?.telefono || '',
          clienteCorreo: o.cliente_correo || o.cliente?.correo || '',
          docNumero: docNum,
          comprobanteTipo: isFactura ? 'factura' : 'boleta',
          recojo_en_tienda: Boolean(o.recojo_en_tienda),
          direccion: o.direccion || (o.recojo_en_tienda ? 'Puente Piedra - Almacén Principal' : ''),
          metodoPago: metodo,
          observaciones: o.observaciones || '',
          subtotal: Number(o.subtotal || 0),
          igv: Number(o.igv || 0),
          costo_flete: Number(o.costo_flete || 0),
          total: Number(o.total || 0),
          estado: o.estado || 'registrado',
          created_at: o.created_at || new Date().toISOString(),
          items: (o.items || []).map((it) => ({
            nombre: it.nombre || it.nombre_snapshot || 'Producto',
            cantidad: Number(it.cantidad || 1),
            precio_unitario: Number(it.precio_unitario || it.precio_unitario_snapshot || 0)
          }))
        });
      });

      // Agregar ventas locales que no estén en la API
      localSales.forEach((loc) => {
        if (!loc || !loc.codigo || salesMap.has(loc.codigo)) return;
        salesMap.set(loc.codigo, {
          id: loc.id || loc.codigo,
          codigo: loc.codigo,
          canal: 'mostrador',
          clienteNombre: loc.clienteNombre || 'Cliente General',
          clienteTelefono: loc.clienteTelefono || '',
          clienteCorreo: loc.clienteCorreo || '',
          docNumero: loc.docNumero || loc.numeroDocumento || '',
          comprobanteTipo: loc.comprobanteTipo || 'boleta',
          recojo_en_tienda: true,
          direccion: 'Puente Piedra - Almacén Principal',
          metodoPago: loc.metodoPago || 'efectivo',
          observaciones: loc.observaciones || '[VENTA MOSTRADOR]',
          subtotal: Number(loc.subtotal || 0),
          igv: Number(loc.igv || 0),
          costo_flete: 0,
          total: Number(loc.total || 0),
          estado: 'entregado',
          created_at: loc.created_at || new Date().toISOString(),
          items: loc.items || []
        });
      });

      const consolidated = Array.from(salesMap.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setSales(consolidated);
    } catch (err) {
      setError('Ocurrió un inconveniente al cargar las ventas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Manejo de presets de monto
  const handleMontoPresetChange = (preset) => {
    setMontoPreset(preset);
    if (preset === 'mayor_100') {
      setMontoMin('100');
      setMontoMax('');
    } else if (preset === 'mayor_500') {
      setMontoMin('500');
      setMontoMax('');
    } else if (preset === 'todos') {
      setMontoMin('');
      setMontoMax('');
    }
  };

  // Manejo de presets de fecha
  const handleFechaPresetChange = (preset) => {
    setFechaPreset(preset);
    const now = new Date();
    if (preset === 'hoy') {
      const todayStr = now.toISOString().split('T')[0];
      setFechaDesde(todayStr);
      setFechaHasta(todayStr);
    } else if (preset === '7dias') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      setFechaDesde(past7.toISOString().split('T')[0]);
      setFechaHasta(now.toISOString().split('T')[0]);
    } else if (preset === 'mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFechaDesde(firstDay.toISOString().split('T')[0]);
      setFechaHasta(now.toISOString().split('T')[0]);
    } else if (preset === 'todos') {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    setSearchTerm('');
    setCanalFilter('todos');
    setMetodoPagoFilter('todos');
    setEntregaFilter('todos');
    setMontoPreset('todos');
    setMontoMin('');
    setMontoMax('');
    setFechaPreset('todos');
    setFechaDesde('');
    setFechaHasta('');
    setComprobanteFilter('todos');
  };

  // Filtrado reactivo en memoria
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Búsqueda por texto (código, cliente, doc)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const codigo = (sale.codigo || '').toLowerCase();
        const cliente = (sale.clienteNombre || '').toLowerCase();
        const doc = (sale.docNumero || '').toLowerCase();
        const tel = (sale.clienteTelefono || '').toLowerCase();
        if (!codigo.includes(q) && !cliente.includes(q) && !doc.includes(q) && !tel.includes(q)) {
          return false;
        }
      }

      // 2. Canal (web vs mostrador)
      if (canalFilter !== 'todos' && sale.canal !== canalFilter) {
        return false;
      }

      // 3. Medio de Pago
      if (metodoPagoFilter !== 'todos') {
        if (metodoPagoFilter === 'yape_plin') {
          if (sale.metodoPago !== 'yape_plin' && sale.metodoPago !== 'yape' && sale.metodoPago !== 'plin') {
            return false;
          }
        } else if (sale.metodoPago !== metodoPagoFilter) {
          return false;
        }
      }

      // 4. Modalidad de Entrega (recojo vs despacho)
      if (entregaFilter === 'recojo' && !sale.recojo_en_tienda) return false;
      if (entregaFilter === 'despacho' && sale.recojo_en_tienda) return false;

      // 5. Filtro de Monto
      const totalNum = Number(sale.total || 0);
      if (montoMin !== '' && totalNum < Number(montoMin)) {
        return false;
      }
      if (montoMax !== '' && totalNum > Number(montoMax)) {
        return false;
      }

      // 6. Filtro de Fechas
      if (fechaDesde !== '' || fechaHasta !== '') {
        const saleDateStr = new Date(sale.created_at).toISOString().split('T')[0];
        if (fechaDesde !== '' && saleDateStr < fechaDesde) {
          return false;
        }
        if (fechaHasta !== '' && saleDateStr > fechaHasta) {
          return false;
        }
      }

      // 7. Tipo de Comprobante
      if (comprobanteFilter !== 'todos' && sale.comprobanteTipo !== comprobanteFilter) {
        return false;
      }

      return true;
    });
  }, [
    sales,
    searchTerm,
    canalFilter,
    metodoPagoFilter,
    entregaFilter,
    montoMin,
    montoMax,
    fechaDesde,
    fechaHasta,
    comprobanteFilter
  ]);

  // Cálculos estadísticos dinámicos basados en filtros activos
  const stats = useMemo(() => {
    const totalAmount = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const count = filteredSales.length;
    const avgTicket = count > 0 ? totalAmount / count : 0;
    const webCount = filteredSales.filter((s) => s.canal === 'web').length;
    const posCount = filteredSales.filter((s) => s.canal === 'mostrador').length;

    return {
      totalAmount,
      count,
      avgTicket,
      webCount,
      posCount
    };
  }, [filteredSales]);

  // Exportar exactamente lo filtrado a Excel
  const handleExport = () => {
    try {
      setExportMessage(null);
      const res = exportSalesToExcel(filteredSales);
      setExportMessage({
        type: 'success',
        text: `¡Éxito! Se descargó el archivo ${res.fileName} con ${res.count} ventas.`
      });
      setTimeout(() => setExportMessage(null), 5000);
    } catch (err) {
      setExportMessage({
        type: 'error',
        text: err.message || 'Error al exportar a Excel.'
      });
    }
  };

  const getPaymentBadge = (metodo) => {
    switch (metodo) {
      case 'efectivo':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Efectivo</span>;
      case 'yape_plin':
      case 'yape':
      case 'plin':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Yape / Plin</span>;
      case 'transferencia':
      case 'bcp':
      case 'bbva':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Transferencia</span>;
      case 'tarjeta':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Tarjeta</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">Digital</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Principal de Exportar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-kenpaku-blue/10 text-kenpaku-blue flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-kenpaku-navy">
                Reporte de Ventas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Consolidado de ventas físicas en caja y tienda virtual con filtros avanzados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSalesData}
            isLoading={isLoading}
            icon={RefreshCw}
            className="text-xs"
          >
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            id="btn-export-excel"
            onClick={handleExport}
            disabled={filteredSales.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            icon={FileSpreadsheet}
          >
            <span>Exportar a Excel ({filteredSales.length})</span>
          </Button>
        </div>
      </div>

      {/* Notificación de Éxito o Error de Exportación */}
      {exportMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-fade-in ${
            exportMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {exportMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{exportMessage.text}</span>
        </div>
      )}

      {/* Tarjetas de Métricas KPI Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-kenpaku-orange/10 text-kenpaku-orange flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Facturado
            </span>
            <span className="text-xl sm:text-2xl font-black text-kenpaku-navy">
              {formatPEN(stats.totalAmount)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              En {stats.count} venta(s) filtrada(s)
            </span>
          </div>
        </div>

        {/* N° de Ventas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-kenpaku-blue/10 text-kenpaku-blue flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Transacciones
            </span>
            <span className="text-xl sm:text-2xl font-black text-kenpaku-navy">
              {stats.count}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Tickets y boletas procesadas
            </span>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Ticket Promedio
            </span>
            <span className="text-xl sm:text-2xl font-black text-kenpaku-navy">
              {formatPEN(stats.avgTicket)}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Promedio por compra
            </span>
          </div>
        </div>

        {/* Distribución por Canal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Canal de Venta
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                Web: {stats.webCount}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Caja: {stats.posCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Físico vs Virtual
            </span>
          </div>
        </div>
      </div>

      {/* Panel de Filtros Avanzados */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-kenpaku-navy">
            <Filter className="w-4 h-4 text-kenpaku-blue" />
            <span>Filtros de Búsqueda y Segmentación</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-kenpaku-blue flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        </div>

        {/* Fila 1: Búsqueda de Texto + Canal + Medio de Pago + Entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Buscador */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Buscar venta
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Código, cliente, DNI/RUC..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Canal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Canal de Venta
            </label>
            <select
              value={canalFilter}
              onChange={(e) => setCanalFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue text-xs font-medium"
            >
              <option value="todos">Todos los canales</option>
              <option value="web">Virtual (Tienda Web)</option>
              <option value="mostrador">Físico (Mostrador / Caja POS)</option>
            </select>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Medio de Pago
            </label>
            <select
              value={metodoPagoFilter}
              onChange={(e) => setMetodoPagoFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue text-xs font-medium"
            >
              <option value="todos">Todos los medios de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape_plin">Yape / Plin</option>
              <option value="transferencia">Transferencia (BCP / BBVA)</option>
              <option value="tarjeta">Tarjeta (POS)</option>
            </select>
          </div>

          {/* Modalidad de Entrega */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Modalidad de Entrega
            </label>
            <select
              value={entregaFilter}
              onChange={(e) => setEntregaFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue text-xs font-medium"
            >
              <option value="todos">Todas las entregas</option>
              <option value="recojo">Recojo en Almacén (Puente Piedra)</option>
              <option value="despacho">Despacho a Obra (Delivery)</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Filtros de Monto + Rango de Fechas + Comprobante */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          {/* Segmentación por Monto */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-600">
              Filtro por Monto
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleMontoPresetChange('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  montoPreset === 'todos' && !montoMin
                    ? 'bg-kenpaku-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                id="btn-filter-monto-100"
                onClick={() => handleMontoPresetChange('mayor_100')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  montoPreset === 'mayor_100'
                    ? 'bg-kenpaku-orange text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                &gt; S/ 100
              </button>
              <button
                type="button"
                onClick={() => handleMontoPresetChange('mayor_500')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  montoPreset === 'mayor_500'
                    ? 'bg-kenpaku-orange text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                &gt; S/ 500
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                placeholder="Mínimo S/"
                value={montoMin}
                onChange={(e) => {
                  setMontoPreset('custom');
                  setMontoMin(e.target.value);
                }}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Máximo S/"
                value={montoMax}
                onChange={(e) => {
                  setMontoPreset('custom');
                  setMontoMax(e.target.value);
                }}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Segmentación por Fecha */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-600">
              Rango de Fechas
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleFechaPresetChange('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fechaPreset === 'todos' && !fechaDesde
                    ? 'bg-kenpaku-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => handleFechaPresetChange('hoy')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fechaPreset === 'hoy'
                    ? 'bg-kenpaku-blue text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => handleFechaPresetChange('7dias')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fechaPreset === '7dias'
                    ? 'bg-kenpaku-blue text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => handleFechaPresetChange('mes')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  fechaPreset === 'mes'
                    ? 'bg-kenpaku-blue text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Este mes
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaPreset('custom');
                  setFechaDesde(e.target.value);
                }}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                title="Fecha Desde"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaPreset('custom');
                  setFechaHasta(e.target.value);
                }}
                className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                title="Fecha Hasta"
              />
            </div>
          </div>

          {/* Tipo de Comprobante */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-600">
              Tipo de Comprobante
            </span>
            <select
              value={comprobanteFilter}
              onChange={(e) => setComprobanteFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue text-xs font-medium"
            >
              <option value="todos">Todos los comprobantes</option>
              <option value="boleta">Boleta de Venta</option>
              <option value="factura">Factura Electrónica</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Mostrando <strong>{filteredSales.length}</strong> de {sales.length} transacciones registradas.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Ventas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-kenpaku-blue" />
            <p className="font-bold text-sm text-slate-600">Cargando reporte de ventas...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">
              No se encontraron ventas con los filtros seleccionados
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Intenta cambiar los parámetros de búsqueda, ampliar el rango de fechas o restablecer los filtros.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Restablecer filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Cliente / RUC</th>
                  <th className="py-3 px-4">Medio Pago</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4 text-right">Total (S/)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const isWeb = sale.canal === 'web';
                  const dateObj = new Date(sale.created_at);
                  const fechaStr = dateObj.toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short'
                  });
                  const horaStr = dateObj.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={sale.codigo}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4 font-extrabold text-kenpaku-navy whitespace-nowrap">
                        {sale.codigo}
                      </td>

                      {/* Fecha / Hora */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <span className="font-bold text-slate-700 block">{fechaStr}</span>
                        <span className="text-[10px] text-slate-400">{horaStr}</span>
                      </td>

                      {/* Canal */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isWeb ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                            <Globe className="w-3 h-3 text-sky-600" />
                            <span>Virtual Web</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Store className="w-3 h-3 text-emerald-600" />
                            <span>Caja POS</span>
                          </span>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-bold text-slate-800 truncate" title={sale.clienteNombre}>
                          {sale.clienteNombre}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {sale.docNumero ? `Doc: ${sale.docNumero}` : (sale.clienteTelefono || 'Sin doc')}
                        </p>
                      </td>

                      {/* Medio de Pago */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPaymentBadge(sale.metodoPago)}
                      </td>

                      {/* Entrega */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sale.recojo_en_tienda ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Store className="w-3 h-3" />
                            <span>Recojo Almacén</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Truck className="w-3 h-3" />
                            <span>Despacho Obra</span>
                          </span>
                        )}
                      </td>

                      {/* Comprobante */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600 uppercase text-[11px]">
                        {sale.comprobanteTipo}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-kenpaku-orange text-sm">
                        {formatPEN(sale.total)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-xs px-2.5 py-1"
                          icon={Eye}
                        >
                          Detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSale(null);
          }}
          title={`Detalle de Venta • ${selectedSale.codigo}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Cabecera del pedido */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Canal</span>
                <span className="font-bold text-slate-800">
                  {selectedSale.canal === 'web' ? 'Tienda Virtual Web' : 'Punto de Venta Mostrador'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Comprobante</span>
                <span className="font-bold text-slate-800 uppercase">
                  {selectedSale.comprobanteTipo} {selectedSale.docNumero ? `(${selectedSale.docNumero})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Medio de Pago</span>
                <div className="mt-0.5">{getPaymentBadge(selectedSale.metodoPago)}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Cliente</span>
                <span className="font-bold text-slate-800">{selectedSale.clienteNombre}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Teléfono</span>
                <span className="font-bold text-slate-800">{selectedSale.clienteTelefono || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Modalidad Entrega</span>
                <span className="font-bold text-slate-800">
                  {selectedSale.recojo_en_tienda ? 'Retiro en Almacén' : 'Despacho a Obra'}
                </span>
              </div>
            </div>

            {/* Dirección si aplica */}
            {!selectedSale.recojo_en_tienda && selectedSale.direccion && (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                <span className="font-bold text-indigo-900 block">Dirección de Destino:</span>
                <span className="text-indigo-800">{selectedSale.direccion}</span>
              </div>
            )}

            {/* Tabla de Productos Comprados */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Productos Comprados ({selectedSale.items?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-extrabold">
                    <tr>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 text-center">Cant.</th>
                      <th className="p-2.5 text-right">P. Unitario</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedSale.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{it.nombre}</td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{it.cantidad}</td>
                        <td className="p-2.5 text-right text-slate-600">{formatPEN(it.precio_unitario)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-800">
                          {formatPEN(it.cantidad * it.precio_unitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales Económicos */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{formatPEN(selectedSale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>I.G.V. (18%):</span>
                <span className="font-bold text-slate-800">{formatPEN(selectedSale.igv)}</span>
              </div>
              {Number(selectedSale.costo_flete) > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Costo de Flete:</span>
                  <span>{formatPEN(selectedSale.costo_flete)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-kenpaku-orange pt-2 border-t border-slate-200">
                <span>Total Venta:</span>
                <span>{formatPEN(selectedSale.total)}</span>
              </div>
            </div>

            {/* Botón Cerrar */}
            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSale(null);
                }}
              >
                Cerrar Detalle
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
