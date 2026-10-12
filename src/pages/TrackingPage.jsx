import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  ArrowRight,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { getOrderTracking } from '../api/orders';
import { formatPEN } from '../utils/formatPEN';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente de Confirmación',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    title: 'Hemos recibido tu pedido',
    description: 'Un asesor comercial revisará la disponibilidad de stock y se contactará para coordinar el pago y flete.',
    stepIndex: 1,
  },
  flete_cotizado: {
    label: 'Flete Cotizado',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    title: 'Flete de transporte calculado',
    description: 'Hemos calculado el costo de flete para tu obra. Listo para que valides el pago.',
    stepIndex: 2,
  },
  confirmado: {
    label: 'Confirmado y En Preparación',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Pago validado y stock reservado',
    description: 'Tus materiales han sido reservados en almacén y están en proceso de preparación.',
    stepIndex: 2,
  },
  listo_para_recojo: {
    label: 'Listo para Recojo',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    title: '¡Tus materiales están listos!',
    description: 'Puedes acercarte a nuestro almacén en Puente Piedra a retirar tus perfiles y planchas.',
    stepIndex: 3,
  },
  despachado: {
    label: 'Despachado a Obra',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    title: 'En ruta hacia tu obra',
    description: 'El camión con tus materiales ha salido de Puente Piedra con destino a la obra.',
    stepIndex: 3,
  },
  entregado: {
    label: 'Entregado con Conformidad',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'Pedido entregado exitosamente',
    description: 'La entrega fue completada con conformidad. ¡Gracias por confiar en Comercial Kenpaku!',
    stepIndex: 4,
  },
  cancelado: {
    label: 'Pedido Cancelado',
    badge: 'bg-red-100 text-red-800 border-red-200',
    title: 'Pedido anulado',
    description: 'Este pedido ha sido cancelado y su inventario fue liberado.',
    stepIndex: 0,
  },
};

export function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const codigoFromUrl = searchParams.get('codigo') || '';

  const [codigoInput, setCodigoInput] = useState(codigoFromUrl);
  const [telefonoInput, setTelefonoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // Cargar pedidos recientes guardados en el navegador
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kenpaku_recent_orders') || '[]');
      if (Array.isArray(stored)) {
        setRecentOrders(stored);
      }
    } catch {
      setRecentOrders([]);
    }
  }, []);

  // Consultar automáticamente si viene con token en la URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleSearch({ token: tokenFromUrl });
    }
  }, [tokenFromUrl]);

  const handleSearch = async ({ token, codigo, telefono }) => {
    setErrorMsg('');
    setIsLoading(true);

    try {
      const data = await getOrderTracking({
        token: token || undefined,
        codigo: codigo || undefined,
        telefono: telefono || undefined,
      });
      setOrder(data);

      // Si obtuvimos un pedido con token, guardarlo en pedidos recientes
      if (data?.codigo) {
        const entry = {
          codigo: data.codigo,
          tracking_token: data.tracking_token || token || '',
          total: data.total,
          fecha: data.created_at || new Date().toISOString(),
        };
        try {
          const current = JSON.parse(localStorage.getItem('kenpaku_recent_orders') || '[]');
          const filtered = current.filter((o) => o.codigo !== data.codigo);
          const updated = [entry, ...filtered].slice(0, 5);
          localStorage.setItem('kenpaku_recent_orders', JSON.stringify(updated));
          setRecentOrders(updated);
        } catch {
          // ignore localStorage issues
        }
      }
    } catch (err) {
      setOrder(null);
      const detail =
        err?.response?.data?.detail ||
        'No se encontró ningún pedido con los datos proporcionados. Verifique el código y teléfono.';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    if (!codigoInput.trim() || !telefonoInput.trim()) {
      setErrorMsg('Por favor ingrese tanto el código de pedido (ej. KPK-000001) como el teléfono registrado.');
      return;
    }
    handleSearch({ codigo: codigoInput.trim(), telefono: telefonoInput.trim() });
  };

  const handleSelectRecent = (recent) => {
    if (recent.tracking_token) {
      setSearchParams({ token: recent.tracking_token });
      handleSearch({ token: recent.tracking_token });
    } else {
      setCodigoInput(recent.codigo);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setErrorMsg('');
    setSearchParams({});
    setCodigoInput('');
    setTelefonoInput('');
  };

  const statusMeta = order ? (STATUS_CONFIG[order.estado] || STATUS_CONFIG.pendiente) : null;
  const isCancelled = order?.estado === 'cancelado';

  // Stepper definition
  const steps = order?.recojo_en_tienda
    ? [
        { label: 'Registrado', desc: 'Recibido en web' },
        { label: 'Confirmado', desc: 'Pago validado' },
        { label: 'Listo en Almacén', desc: 'Puente Piedra' },
        { label: 'Entregado', desc: 'Retiro conforme' },
      ]
    : [
        { label: 'Registrado', desc: 'Recibido en web' },
        { label: 'Confirmado', desc: 'Stock y flete' },
        { label: 'Despachado', desc: 'Camión en ruta' },
        { label: 'Entregado', desc: 'En obra' },
      ];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-fade-in">
      <Breadcrumb items={[{ label: 'Inicio', url: '/' }, { label: 'Seguimiento de Pedido' }]} />

      {/* Header Banner */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#0284C7] text-xs font-bold border border-sky-200">
          <Truck className="w-3.5 h-3.5" />
          Seguimiento en Vivo y Sin Cuenta
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">
          Consulta el Estado de tu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Ingresa tu código de compra y teléfono, o usa el enlace secreto recibido para conocer la ubicación y fase de tus materiales.
        </p>
      </div>

      {/* Search Box Card */}
      {!order && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft max-w-xl mx-auto space-y-5">
          <form onSubmit={onSubmitForm} className="space-y-4">
            <div>
              <label htmlFor="codigo-input" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Código de Pedido
              </label>
              <input
                id="codigo-input"
                type="text"
                placeholder="Ej. KPK-000001"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold tracking-wider text-slate-900 focus:ring-2 focus:ring-[#0284C7] focus:outline-none uppercase"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="telefono-input" className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Teléfono Celular Registrado
              </label>
              <input
                id="telefono-input"
                type="tel"
                placeholder="Ej. 987654321"
                value={telefonoInput}
                onChange={(e) => setTelefonoInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#0284C7] focus:outline-none"
                disabled={isLoading}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Por seguridad, validamos tu número telefónico para proteger tus datos de compra.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon={Search}
            >
              {isLoading ? 'Buscando pedido...' : 'Consultar Estado'}
            </Button>
          </form>

          {/* Recent Orders in device */}
          {recentOrders.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
                Compras recientes en este dispositivo:
              </span>
              <div className="flex flex-wrap gap-2">
                {recentOrders.map((ro) => (
                  <button
                    key={ro.codigo}
                    type="button"
                    onClick={() => handleSelectRecent(ro)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-kenpaku-navy transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{ro.codigo}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Results Detail */}
      {order && (
        <div className="space-y-6">
          {/* Top Bar with Code & Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-extrabold text-kenpaku-navy tracking-tight">
                  {order.codigo}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${statusMeta.badge}`}>
                  {statusMeta.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                  {order.recojo_en_tienda ? 'Recojo en Almacén' : 'Despacho a Obra'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Registrado el {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                {order.cliente_resumen && (
                  <span className="text-slate-600 font-medium ml-1">
                    • Cliente: <strong>{order.cliente_resumen}</strong>
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Consultar otro pedido</span>
            </button>
          </div>

          {/* Stepper Timeline Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft space-y-6">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-kenpaku-navy">
                {statusMeta.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {statusMeta.description}
              </p>
            </div>

            {/* Visual Stepper */}
            {!isCancelled ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {steps.map((st, idx) => {
                  const stepNumber = idx + 1;
                  const isCurrent = statusMeta.stepIndex === stepNumber;
                  const isPassed = statusMeta.stepIndex > stepNumber;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-sky-50/80 border-[#0284C7] shadow-xs'
                          : isPassed
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrent
                              ? 'bg-[#0284C7] text-white'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPassed ? '✓' : stepNumber}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{st.label}</span>
                        <span className="text-[11px] text-slate-500">{st.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-extrabold text-red-900">Pedido Anulado</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    Este pedido fue cancelado. Si consideras que se trata de un error o deseas volver a cotizar, por favor comunícate directamente con nuestro equipo.
                  </p>
                </div>
              </div>
            )}

            {/* Events Timeline Log */}
            {order.events && order.events.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Línea de Tiempo del Pedido
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {order.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-kenpaku-navy capitalize">
                          {ev.estado_nuevo.replace(/_/g, ' ')}
                        </span>
                        {ev.nota && (
                          <span className="text-slate-500 italic">
                            — {ev.nota}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Products & Totals Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-3">
              Materiales Incluidos en este Pedido
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
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

            {/* Financial Totals */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal (sin IGV):</span>
                <span>{formatPEN(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGV (18 %):</span>
                <span>{formatPEN(order.igv)}</span>
              </div>
              {Number(order.costo_flete) > 0 && (
                <div className="flex justify-between font-semibold text-indigo-700">
                  <span>Flete de Transporte:</span>
                  <span>{formatPEN(order.costo_flete)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-kenpaku-navy pt-2 border-t border-slate-200">
                <span>Total General:</span>
                <span className="text-kenpaku-orange">{formatPEN(order.total)}</span>
              </div>
            </div>

            {/* WhatsApp Contact Button */}
            {order.whatsapp_url && (
              <div className="pt-2">
                <a
                  href={order.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button variant="whatsapp" size="lg" fullWidth icon={MessageCircle}>
                    Consultar este Pedido por WhatsApp
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
