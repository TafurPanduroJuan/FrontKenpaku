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
  CreditCard,
  UploadCloud,
  FileText,
  Check,
  ExternalLink,
  QrCode,
  DollarSign,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { getOrderTracking, submitFleteDecision, uploadOrderVoucher } from '../api/orders';
import { formatPEN } from '../utils/formatPEN';
import { getVoucherUrl } from '../utils/voucher';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { sanitizeOrderCode, sanitizeDigits } from '../utils/sanitizers';

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
    description: 'Hemos calculado el costo de flete para tu obra. Revisa y acepta el costo para realizar el abono.',
    stepIndex: 2,
  },
  confirmado: {
    label: 'En Preparación',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Pago validado y materiales en preparación',
    description: 'Tus materiales han sido reservados en almacén y están en proceso de preparación en patio.',
    stepIndex: 3,
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

const BANK_ACCOUNTS = [
  {
    id: 'yape',
    name: 'Yape / Plin',
    badge: 'Inmediato sin comisión',
    number: '987 654 321',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: QrCode,
    note: 'Escanea el QR o transfiere al número directo desde tu app de Yape o Plin.',
  },
  {
    id: 'bcp',
    name: 'BCP Soles',
    badge: 'Cuenta Corriente',
    number: '191-2345678-0-12',
    cci: '002-191-002345678012-55',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: Building2,
    note: 'Transferencia directa o interbancaria a la cuenta corriente empresarial.',
  },
  {
    id: 'bbva',
    name: 'BBVA Soles',
    badge: 'Cuenta Corriente',
    number: '0011-0123-0100456789',
    cci: '011-123-000100456789-78',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: CreditCard,
    note: 'Abonos directos en ventanilla, agentes o banca por internet.',
  },
];

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

  // Estados para Fase 4: Flete
  const [isSubmittingFlete, setIsSubmittingFlete] = useState(false);
  const [fleteActionMsg, setFleteActionMsg] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Estados para Fase 4: Pago & Voucher
  const [activeBankTab, setActiveBankTab] = useState('yape');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [isUploadingVoucher, setIsUploadingVoucher] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState(null);

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
          // ignore
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
    const cleanCodigo = sanitizeOrderCode(codigoInput).trim();
    const cleanTelefono = sanitizeDigits(telefonoInput, 9).trim();
    if (!cleanCodigo || !cleanTelefono) {
      setErrorMsg('Por favor ingrese tanto el código de pedido (ej. KPK-000001) como el teléfono registrado.');
      return;
    }
    if (cleanTelefono.length !== 9) {
      setErrorMsg('El número de celular debe tener exactamente 9 dígitos.');
      return;
    }
    handleSearch({ codigo: cleanCodigo, telefono: cleanTelefono });
  };

  const handleSelectRecent = (recent) => {
    if (recent.tracking_token) {
      setSearchParams({ token: recent.tracking_token });
      handleSearch({ token: recent.tracking_token });
    } else {
      setCodigoInput(recent.codigo);
    }
  };

  // Manejar decisión de flete (Aceptar / Rechazar)
  const handleFleteDecision = async (decision) => {
    setIsSubmittingFlete(true);
    setFleteActionMsg(null);
    try {
      await submitFleteDecision({
        token: order.tracking_token || tokenFromUrl,
        codigo: order.codigo,
        telefono: telefonoInput,
        decision,
        nota: decision === 'rechazar' ? rejectReason : undefined,
      });
      setFleteActionMsg({
        type: decision === 'aceptar' ? 'success' : 'warning',
        text: decision === 'aceptar'
          ? '¡Costo de flete aceptado! Ahora puedes proceder con el pago usando las cuentas oficiales abajo.'
          : 'Has indicado que el flete requiere revisión. Un asesor de ventas se comunicará contigo vía WhatsApp.',
      });
      setShowRejectInput(false);
      // Recargar datos actualizados
      await handleSearch({
        token: order.tracking_token || tokenFromUrl,
        codigo: order.codigo,
        telefono: telefonoInput,
      });
    } catch (err) {
      const errDetail = err?.response?.data?.detail || 'No se pudo procesar la decisión de flete.';
      setFleteActionMsg({ type: 'error', text: typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail) });
    } finally {
      setIsSubmittingFlete(false);
    }
  };

  // Manejar selección de archivo de voucher
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setVoucherMsg({ type: 'error', text: 'El archivo excede el tamaño máximo permitido de 5 MB.' });
      return;
    }

    setVoucherFile(file);
    if (file.type.startsWith('image/') && typeof URL.createObjectURL === 'function') {
      setVoucherPreview(URL.createObjectURL(file));
    } else {
      setVoucherPreview(null);
    }
    setVoucherMsg(null);
  };

  // Subir voucher
  const handleUploadVoucher = async () => {
    if (!voucherFile) {
      setVoucherMsg({ type: 'error', text: 'Por favor seleccione una imagen o PDF del comprobante.' });
      return;
    }

    setIsUploadingVoucher(true);
    setVoucherMsg(null);

    try {
      await uploadOrderVoucher({
        token: order.tracking_token || tokenFromUrl,
        codigo: order.codigo,
        telefono: telefonoInput,
        file: voucherFile,
      });
      setVoucherMsg({
        type: 'success',
        text: '¡Comprobante recibido con éxito! Nuestro equipo de caja lo está validando para confirmar tu pedido.',
      });
      setVoucherFile(null);
      setVoucherPreview(null);
      await handleSearch({
        token: order.tracking_token || tokenFromUrl,
        codigo: order.codigo,
        telefono: telefonoInput,
      });
    } catch (err) {
      const errDetail = err?.response?.data?.detail || 'No se pudo subir el comprobante. Intenta nuevamente.';
      setVoucherMsg({ type: 'error', text: typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail) });
    } finally {
      setIsUploadingVoucher(false);
    }
  };

  const statusInfo = order ? (STATUS_CONFIG[order.estado] || STATUS_CONFIG.pendiente) : null;
  const isTerminalCancelled = order?.estado === 'cancelado';

  // Configuración de los pasos según modalidad
  const steps = order?.recojo_en_tienda
    ? [
        { label: 'Registrado', desc: 'Recibido en web', match: ['pendiente'] },
        { label: 'En Preparación', desc: 'Materiales en patio', match: ['confirmado'] },
        { label: 'Listo para Recojo', desc: 'Almacén Puente Piedra', match: ['listo_para_recojo'] },
        { label: 'Entregado', desc: 'Retirado por cliente', match: ['entregado'] },
      ]
    : [
        { label: 'Registrado', desc: 'Recibido en web', match: ['pendiente'] },
        { label: 'Flete Cotizado', desc: 'Costo calculado y abono', match: ['flete_cotizado'] },
        { label: 'En Preparación', desc: 'Pago validado en patio', match: ['confirmado'] },
        { label: 'Despachado', desc: 'En camión a obra', match: ['despachado'] },
        { label: 'Entregado', desc: 'Conforme en obra', match: ['entregado'] },
      ];

  const getStepStatus = (stepIndex, orderState) => {
    if (orderState === 'cancelado') return 'cancelled';
    const stateOrderRecojo = ['pendiente', 'confirmado', 'listo_para_recojo', 'entregado'];
    const stateOrderDespacho = ['pendiente', 'flete_cotizado', 'confirmado', 'despachado', 'entregado'];
    const flow = order?.recojo_en_tienda ? stateOrderRecojo : stateOrderDespacho;

    const currentOrderIndex = flow.indexOf(orderState);
    const targetStep = steps[stepIndex];
    const minStepFlowIndex = Math.min(...targetStep.match.map((st) => flow.indexOf(st)).filter((idx) => idx !== -1));

    if (targetStep.match.includes(orderState)) return 'current';
    if (currentOrderIndex > minStepFlowIndex) return 'passed';
    return 'upcoming';
  };

  // Extraer nota de cotización de flete ingresada por el asesor comercial (si existe)
  const fleteQuoteEvent = (order?.events || [])
    .slice()
    .reverse()
    .find((ev) => ev.estado_nuevo === 'flete_cotizado' && ev.nota);
  const fleteQuoteNote = fleteQuoteEvent?.nota || '';

  // Mostrar bloque de flete si el pedido es despacho y está en flete_cotizado
  const showFleteCard = order && !order.recojo_en_tienda && order.estado === 'flete_cotizado';

  // Si ya fue confirmado, despachado, listo para recojo o entregado: el pago ya fue validado por caja y está en preparación o posterior
  const isPaymentConfirmed =
    order &&
    ['confirmado', 'despachado', 'listo_para_recojo', 'entregado'].includes(order.estado);

  // Mostrar bloque de cuentas bancarias y formulario de voucher SOLO MIENTRAS ESTÉ PENDIENTE DE PAGO:
  // - Si es recojo en tienda: se habilita automáticamente desde estado 'pendiente' (flete S/ 0).
  // - Si es despacho a obra: NO se habilita en 'pendiente'; debe esperar a que el admin cotice el flete ('flete_cotizado' o flete aceptado).
  const isAwaitingPayment =
    order &&
    !isTerminalCancelled &&
    !isPaymentConfirmed &&
    (order.recojo_en_tienda
      ? order.estado === 'pendiente'
      : (order.estado === 'flete_cotizado' || order.estado_flete === 'aceptado'));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in font-sans">
      <Breadcrumb items={[{ label: 'Inicio', to: '/' }, { label: 'Seguimiento de Pedido' }]} />

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5 text-kenpaku-orange" />
          <span>Localizador de Pedidos y Flete</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">
          Consulta el Estado de tu Pedido
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Consulta en tiempo real la cotización de flete, abona tu pedido y revisa la preparación de tus materiales de acero.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft">
        <form onSubmit={onSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="codigo-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Código de Pedido
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="codigo-input"
                  type="text"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(sanitizeOrderCode(e.target.value))}
                  placeholder="Ej. KPK-123456"
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:border-[#0284C7] focus:ring-3 focus:ring-[#0284C7]/10 text-xs font-mono uppercase font-bold text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Teléfono Celular Registrado
              </label>
              <input
                id="telefono-input"
                type="tel"
                value={telefonoInput}
                onChange={(e) => setTelefonoInput(sanitizeDigits(e.target.value, 9))}
                placeholder="Ej. 987654321"
                maxLength={9}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:border-[#0284C7] focus:ring-3 focus:ring-[#0284C7]/10 text-xs font-semibold text-slate-900 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              * Si compraste con enlace directo, tu código y token se cargan automáticamente.
            </span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              icon={Search}
              className="w-full sm:w-auto"
            >
              Consultar Estado
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">No pudimos localizar el pedido</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Recent Orders Chips */}
        {recentOrders.length > 0 && !order && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Tus Pedidos Recientes en este Dispositivo:
            </span>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((rec, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRecent(rec)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-kenpaku-navy flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-kenpaku-orange" />
                  <span>{rec.codigo}</span>
                  <span className="text-[10px] text-slate-400 font-sans">({formatPEN(rec.total)})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracking Details Display */}
      {order && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Status & Stepper Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold font-mono text-kenpaku-navy">
                    {order.codigo}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${statusInfo.badge}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cliente: <strong className="text-slate-800">{order.cliente_resumen || 'Cliente'}</strong> • Registrado el{' '}
                  {new Date(order.created_at).toLocaleDateString('es-PE', { dateStyle: 'long' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch({ token: order.tracking_token || tokenFromUrl, codigo: order.codigo, telefono: telefonoInput })}
                  icon={RefreshCw}
                  title="Actualizar estado en vivo"
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Status Highlight Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Estado Actual</span>
                <h3 className="text-base font-extrabold text-kenpaku-navy">{statusInfo.title}</h3>
                <p className="text-xs text-slate-600 max-w-xl">{statusInfo.description}</p>
              </div>

              <div className="text-right sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Modalidad</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-kenpaku-navy">
                  {order.recojo_en_tienda ? (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Recojo en Almacén</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Despacho a Obra</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Stock Reservation 48h Deadline Notice (Fase 5) */}
            {!isTerminalCancelled && ['pendiente', 'flete_cotizado'].includes(order.estado) && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xs text-amber-900 space-y-0.5">
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5">
                    <span>Reserva de Stock Garantizada por 48 Horas</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">Activa</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Tus perfiles y planchas de acero se encuentran temporalmente apartados en almacén.
                    {order.fecha_limite_pago ? (
                      <> Plazo límite para validar abono: <strong className="text-amber-950">{new Date(order.fecha_limite_pago).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</strong>. </>
                    ) : (
                      <> Cuentas con 48 horas desde la emisión del pedido para completar la confirmación. </>
                    )}
                    Transcurrido este plazo sin comprobante, el sistema liberará los materiales automáticamente.
                  </p>
                </div>
              </div>
            )}

            {/* Visual Stepper */}
            {!isTerminalCancelled ? (
              <div className={`grid grid-cols-2 ${steps.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2.5 pt-2`}>
                {steps.map((st, idx) => {
                  const stepStatus = getStepStatus(idx, order.estado);
                  const isCurrent = stepStatus === 'current';
                  const isPassed = stepStatus === 'passed';
                  const stepNumber = idx + 1;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Línea de Tiempo del Pedido
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Más reciente primero)
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(order.events || []).slice().reverse().map((ev, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-all ${
                          isLatest
                            ? 'bg-sky-50/80 border-[#0284C7]/40 ring-1 ring-[#0284C7]/20 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-85'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLatest ? 'text-[#0284C7]' : 'text-emerald-600'}`} />
                          <span className="font-extrabold text-kenpaku-navy capitalize">
                            {ev.estado_nuevo.replace(/_/g, ' ')}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#0284C7] text-white text-[9px] font-extrabold uppercase">
                              Estado Actual
                            </span>
                          )}
                          {ev.nota && (
                            <span className="text-slate-600 italic">
                              — {ev.nota}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(ev.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FASE 4: TARJETA DE DECISIÓN DE FLETE */}
          {showFleteCard && (
            <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 p-6 sm:p-8 rounded-3xl border-2 border-purple-200 shadow-soft space-y-4 animate-scale-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                      Acción Requerida para Despacho
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Aprobación de Cotización de Flete a Obra
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  order.estado_flete === 'aceptado'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.estado_flete === 'rechazado'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {order.estado_flete}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600">
                Nuestro departamento de logística ha cubicado el peso y la distancia hacia su obra. El costo de transporte ha sido estimado en:
              </p>

              {/* Freight Figures Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-purple-100 shadow-2xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Materiales (con IGV)</span>
                  <span className="text-sm font-bold text-slate-800">{formatPEN(Number(order.subtotal) + Number(order.igv))}</span>
                </div>
                <div>
                  <span className="text-[11px] text-purple-600 font-bold block">Costo de Flete</span>
                  <span className="text-base font-extrabold text-purple-700">{formatPEN(order.costo_flete)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Final a Pagar</span>
                  <span className="text-base font-extrabold text-kenpaku-orange">{formatPEN(order.total)}</span>
                </div>
              </div>

              {/* Nota o condiciones de transporte ingresadas por el asesor comercial */}
              {fleteQuoteNote && (
                <div className="p-4 rounded-2xl bg-purple-100/70 border border-purple-200 text-xs text-purple-950 flex items-start gap-3 shadow-2xs">
                  <FileText className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase text-[10px] tracking-wider text-purple-800 block">
                      Condiciones y Detalle de Cotización (Asesor Comercial):
                    </span>
                    <p className="text-purple-900 leading-relaxed font-medium">{fleteQuoteNote}</p>
                  </div>
                </div>
              )}

              {/* Action Feedback Message */}
              {fleteActionMsg && (
                <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  fleteActionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : fleteActionMsg.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fleteActionMsg.text}</span>
                </div>
              )}

              {/* Flete Action Buttons */}
              {order.estado_flete === 'cotizado' && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      data-testid="flete-accept-btn"
                      disabled={isSubmittingFlete}
                      onClick={() => handleFleteDecision('aceptar')}
                      className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Aceptar Flete y Proceder al Pago</span>
                    </button>

                    <button
                      type="button"
                      data-testid="flete-reject-btn"
                      disabled={isSubmittingFlete}
                      onClick={() => setShowRejectInput(!showRejectInput)}
                      className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ThumbsDown className="w-4 h-4 text-slate-400" />
                      <span>Rechazar o Coordinar Flete</span>
                    </button>
                  </div>

                  {showRejectInput && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 animate-fade-in">
                      <label className="block text-xs font-bold text-slate-700">
                        Motivo del rechazo o consulta sobre el flete (opcional):
                      </label>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ej. El flete supera mi presupuesto, prefiero coordinar recojo o consultar descuento..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-red-400"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRejectInput(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={isSubmittingFlete}
                          onClick={() => handleFleteDecision('rechazar')}
                        >
                          Confirmar Rechazo de Flete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FASE 4: BANNER DE PAGO CONFIRMADO Y EN PREPARACIÓN */}
          {isPaymentConfirmed && (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-6 sm:p-7 rounded-3xl border border-emerald-200 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                      Abono Verificado y Validado
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
                      Pago Validado por Caja — Pedido en Preparación
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 max-w-xl">
                      Tu abono fue verificado satisfactoriamente por nuestro equipo de finanzas. Tus materiales están reservados y en proceso de preparación en patio para su entrega.
                    </p>
                  </div>
                </div>

                {order.voucher_referencia && (
                  <a
                    href={getVoucherUrl(order.voucher_referencia)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    <span>Ver Comprobante Validado</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* AVISO INFORMATIVO: DESPACHO A OBRA PENDIENTE DE COTIZACIÓN DE FLETE */}
          {order && !order.recojo_en_tienda && order.estado === 'pendiente' && !isTerminalCancelled && (
            <div className="bg-amber-50/80 border border-amber-200 p-6 sm:p-7 rounded-3xl shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
                      Paso Siguiente: Cotización de Flete a Obra
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-amber-950">
                      Cálculo de Transporte en Proceso
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold self-start sm:self-auto">
                  Esperando Cotización del Administrador
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-amber-900">
                <p>
                  Tu pedido tiene modalidad <strong>Despacho a Obra</strong> con entrega en: <em>{order.direccion || 'Dirección indicada'}</em>.
                </p>
                <p className="text-amber-800 text-xs">
                  Para tu seguridad, <strong>las cuentas bancarias y la carga de comprobante de pago se habilitarán una vez que el administrador cotice el costo exacto del flete</strong> según la distancia y el peso de tus materiales.
                </p>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2 text-xs text-amber-800 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Te notificaremos por correo electrónico y podrás consultar esta misma pantalla para revisar el flete y realizar el abono.</span>
              </div>
            </div>
          )}

          {/* FASE 4: MÉTODOS DE PAGO Y CARGA DE VOUCHER (SOLO MIENTRAS ESPERA ABONO) */}
          {isAwaitingPayment && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                      Pago Manual Sin Comisión
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Cuentas de Abono y Subida de Comprobante
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Total a Transferir</span>
                  <span className="text-lg font-extrabold text-emerald-600">{formatPEN(order.total)}</span>
                </div>
              </div>

              {/* Sub-Sección 1: Datos Bancarios Oficiales */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  1. Cuentas Oficiales de Comercial Kenpaku S.A.C.:
                </span>

                {/* Tabs Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {BANK_ACCOUNTS.map((bank) => {
                    const isActive = activeBankTab === bank.id;
                    const IconComp = bank.icon;
                    return (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setActiveBankTab(bank.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 mx-auto mb-1 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold block ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {bank.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{bank.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Account Detail Box */}
                {(() => {
                  const currentBank = BANK_ACCOUNTS.find((b) => b.id === activeBankTab) || BANK_ACCOUNTS[0];
                  return (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-500">Titular de Cuenta:</span>
                        <span className="font-extrabold text-slate-900">{currentBank.holder}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-slate-500">Número de Cuenta / Celular:</span>
                        <span className="font-mono font-extrabold text-sm text-kenpaku-navy select-all bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {currentBank.number}
                        </span>
                      </div>
                      {currentBank.cci && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-slate-500">Código Interbancario (CCI):</span>
                          <span className="font-mono text-xs text-slate-700 select-all bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            {currentBank.cci}
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/80">
                        {currentBank.note}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Sub-Sección 2: Carga del Comprobante (Voucher) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  2. Carga del Comprobante de Pago (Voucher):
                </span>

                {/* Si ya hay voucher subido */}
                {order.voucher_referencia && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-emerald-950 text-xs block">
                          Comprobante de Pago Registrado
                        </span>
                        <span className="text-[11px] text-emerald-700 block">
                          En proceso de verificación por caja. {order.fecha_pago ? `Subido el ${new Date(order.fecha_pago).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}.` : ''}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getVoucherUrl(order.voucher_referencia)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ver Comprobante</span>
                    </a>
                  </div>
                )}

                {/* Selector de Archivo / Drag & Drop */}
                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-3 text-center">
                  <input
                    type="file"
                    id="voucher-input"
                    data-testid="voucher-input"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="voucher-input"
                    className="cursor-pointer block space-y-2 py-2"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {voucherFile ? voucherFile.name : 'Haz clic aquí para seleccionar o arrastrar tu voucher'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Formatos permitidos: JPG, PNG, WEBP o PDF (Máximo 5 MB)
                    </span>
                  </label>

                  {/* Preview de imagen */}
                  {voucherPreview && (
                    <div className="pt-2">
                      <img
                        src={voucherPreview}
                        alt="Vista previa del comprobante"
                        className="max-h-40 mx-auto rounded-xl border border-slate-200 shadow-xs"
                      />
                    </div>
                  )}

                  {/* Feedback Message */}
                  {voucherMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
                      voucherMsg.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-red-100 text-red-900 border border-red-200'
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{voucherMsg.text}</span>
                    </div>
                  )}

                  {/* Botón de Enviar */}
                  {voucherFile && (
                    <div className="pt-2 flex justify-center">
                      <Button
                        type="button"
                        data-testid="voucher-submit-btn"
                        variant="primary"
                        size="md"
                        isLoading={isUploadingVoucher}
                        onClick={handleUploadVoucher}
                        icon={UploadCloud}
                      >
                        Subir Comprobante de Pago
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
