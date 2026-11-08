import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  Truck,
  Clock,
  QrCode,
  Building2,
  Copy,
  Check,
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Store,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatPEN } from '../utils/formatPEN';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getOrderTracking, submitFleteDecision, uploadOrderVoucher } from '../api/orders';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { getVoucherList } from '../utils/voucher';
import { extractOrderPaymentMethod, extractOrderDocumentInfo } from '../utils/paymentMethod';

const BANK_ACCOUNTS = [
  {
    id: 'yape',
    name: 'Yape',
    badge: 'Inmediato sin comisión',
    number: '987 654 321',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: QrCode,
    note: 'Escanea el código QR o transfiere directo al número de celular desde tu app Yape.'
  },
  {
    id: 'bcp',
    name: 'BCP Soles',
    badge: 'Cuenta Corriente',
    number: '191-2345678-0-12',
    cci: '002-191-002345678012-55',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: Building2,
    note: 'Transferencia directa o interbancaria (CCI) a nuestra cuenta corriente empresarial BCP.'
  },
  {
    id: 'interbank',
    name: 'Interbank Soles',
    badge: 'Cuenta Corriente',
    number: '200-3001234567',
    cci: '003-200-003001234567-31',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: Building2,
    note: 'Depósitos y transferencias inmediatas vía Interbank Empresas.'
  }
];

export function OrderConfirmation() {
  const { codigo } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromUrl = searchParams.get('token') || '';

  const initialData = location.state?.orderData || null;
  const [orderData, setOrderData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData && !!tokenFromUrl);

  const activeToken = orderData?.tracking_token || tokenFromUrl;

  // Estados de Pago & Cuentas Bancarias
  const [activeBankTab, setActiveBankTab] = useState('yape');
  const [copiedField, setCopiedField] = useState(null);

  // Estados de Flete Interactivo
  const [isSubmittingFlete, setIsSubmittingFlete] = useState(false);
  const [fleteFeedback, setFleteFeedback] = useState(null);

  // Estado del Modal de Boleta de Venta Electrónica
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Estados de Subida de Vouchers (Máx 2 archivos)
  const [voucherFiles, setVoucherFiles] = useState([]);
  const [isUploadingVouchers, setIsUploadingVouchers] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState(
    Boolean(
      orderData?.voucher_referencia ||
      orderData?.voucher_url ||
      orderData?.fecha_pago ||
      orderData?.vouchers?.length
    )
  );
  const [voucherError, setVoucherError] = useState(null);
  const fileInputRef = useRef(null);

  const updateOrderData = (data) => {
    setOrderData(data);
    try {
      if (window.history?.replaceState && data) {
        const cur = window.history.state || {};
        window.history.replaceState(
          { ...cur, usr: { ...(cur.usr || {}), orderData: data } },
          ''
        );
      }
    } catch {
      // Ignorar restricciones en entornos sin acceso a replaceState
    }
  };

  const fetchLatestOrder = async () => {
    try {
      const data = await getOrderTracking({
        token: activeToken || undefined,
        codigo: codigo || orderData?.codigo || undefined
      });
      if (data) {
        updateOrderData(data);
        if (
          data.voucher_referencia ||
          data.voucher_url ||
          data.fecha_pago ||
          data.vouchers?.length
        ) {
          setVoucherSuccess(true);
        }
      }
    } catch {
      // Ignorar fallas temporales de sondeo
    }
  };

  useEffect(() => {
    if (!orderData && tokenFromUrl) {
      setIsLoading(true);
      fetchLatestOrder().finally(() => setIsLoading(false));
    } else {
      fetchLatestOrder();
    }
  }, [activeToken, codigo, tokenFromUrl]);

  useEffect(() => {
    if (!orderData) return;
    const isTerminal = ['entregado', 'cancelado'].includes(orderData.estado);
    if (isTerminal) return;

    const interval = setInterval(() => {
      fetchLatestOrder();
    }, 3500);

    return () => clearInterval(interval);
  }, [orderData?.estado, activeToken, codigo]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFleteDecision = async (decision) => {
    setIsSubmittingFlete(true);
    setFleteFeedback(null);
    try {
      await submitFleteDecision({
        token: activeToken || undefined,
        codigo: orderData?.codigo || codigo,
        decision
      });
      setFleteFeedback({
        type: 'success',
        message: decision === 'aceptar'
          ? '¡Flete aceptado con éxito! Ya puedes proceder a realizar el pago.'
          : 'Has rechazado la cotización de flete. Puedes coordinar un cambio por WhatsApp.'
      });
      const updated = {
        ...(orderData || {}),
        estado_flete: decision === 'aceptar' ? 'aceptado' : 'rechazado'
      };
      updateOrderData(updated);
      fetchLatestOrder();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudo registrar la decisión del flete.';
      setFleteFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingFlete(false);
    }
  };

  const handleFileChange = (e) => {
    setVoucherError(null);
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const validFiles = [];

    for (const f of selected) {
      const ext = f.name.toLowerCase().split('.').pop();
      const isValidExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext);
      const isValidMime = allowedMime.includes(f.type) || isValidExt;

      if (!isValidMime) {
        setVoucherError(`El archivo "${f.name}" no es válido. Solo se admiten imágenes (JPG, PNG, WEBP) o documentos PDF.`);
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        setVoucherError(`El archivo "${f.name}" excede el límite máximo de 8 MB.`);
        return;
      }
      validFiles.push(f);
    }

    if (voucherFiles.length + validFiles.length > 2) {
      setVoucherError('Solo se permite adjuntar un máximo de 2 comprobantes por pedido.');
      return;
    }

    setVoucherFiles((prev) => [...prev, ...validFiles].slice(0, 2));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setVoucherFiles((prev) => prev.filter((_, i) => i !== index));
    setVoucherError(null);
  };

  const handleUploadVouchers = async () => {
    if (!voucherFiles.length) {
      setVoucherError('Selecciona al menos 1 comprobante de pago para enviar.');
      return;
    }

    setIsUploadingVouchers(true);
    setVoucherError(null);

    try {
      for (const file of voucherFiles) {
        await uploadOrderVoucher({
          token: activeToken || undefined,
          codigo: orderData?.codigo || codigo,
          file,
          metodo_pago: activeBankTab
        });
      }
      setVoucherSuccess(true);
      setVoucherFiles([]);
      fetchLatestOrder();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al subir el comprobante. Inténtelo nuevamente.';
      setVoucherError(msg);
    } finally {
      setIsUploadingVouchers(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-steel-600 text-sm font-semibold">Cargando el estado en vivo de tu pedido...</p>
      </div>
    );
  }

  const displayOrder = orderData;

  if (!displayOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fade-in bg-white rounded-card border border-steel-200 p-8 shadow-card">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-navy-900">No se pudieron recuperar los datos de tu pedido</h2>
        <p className="text-steel-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Si acabas de realizar una compra o recargaste la página, usa tu código de pedido para consultar el estado en vivo.
        </p>
        <Link to={codigo ? `/seguimiento?codigo=${encodeURIComponent(codigo)}` : '/seguimiento'}>
          <Button variant="primary">Buscar mi pedido</Button>
        </Link>
      </div>
    );
  }

  const isRecojo = Boolean(displayOrder.recojo_en_tienda);
  const costoFleteNum = Number(displayOrder.costo_flete || 0);
  const fleteCotizado = costoFleteNum > 0 || displayOrder.estado === 'flete_cotizado';
  const fleteAceptado = displayOrder.estado_flete === 'aceptado';
  const canPay = isRecojo || fleteAceptado;

  const hasUploadedVoucher = Boolean(
    displayOrder.voucher_referencia ||
    displayOrder.voucher_url ||
    displayOrder.fecha_pago ||
    displayOrder.vouchers?.length ||
    voucherSuccess
  );

  const isPaymentConfirmed = ['confirmado', 'listo_para_recojo', 'despachado', 'entregado'].includes(
    displayOrder.estado
  );

  const isTerminalDelivered = displayOrder.estado === 'entregado';

  let activeStepIndex = 1;
  if (isRecojo) {
    if (isTerminalDelivered) {
      activeStepIndex = 4;
    } else if (displayOrder.estado === 'listo_para_recojo') {
      activeStepIndex = 3;
    } else if (isPaymentConfirmed || displayOrder.estado === 'confirmado') {
      activeStepIndex = 2;
    } else {
      activeStepIndex = 1;
    }
  } else {
    if (isTerminalDelivered) {
      activeStepIndex = 5;
    } else if (displayOrder.estado === 'despachado') {
      activeStepIndex = 4;
    } else if (isPaymentConfirmed || displayOrder.estado === 'confirmado') {
      activeStepIndex = 3;
    } else if (fleteAceptado) {
      activeStepIndex = 2;
    } else {
      activeStepIndex = 1;
    }
  }

  const stepperSteps = isRecojo
    ? [
        { key: 'registrado', fase: 'Fase 1', label: 'Registrado', sub: 'Registrado con éxito' },
        {
          key: 'pago',
          fase: 'Fase 2',
          label: 'Pago y Voucher',
          sub: isPaymentConfirmed
            ? 'Abono verificado'
            : hasUploadedVoucher
            ? 'Voucher en revisión'
            : 'Pendiente abono'
        },
        { key: 'preparacion', fase: 'Fase 3', label: 'En Preparación', sub: 'Alistando en patio' },
        { key: 'listo', fase: 'Fase 4', label: 'Listo para Entrega', sub: 'Almacén Puente Piedra' },
        { key: 'entregado', fase: 'Fase 5', label: 'Entregado Conforme', sub: 'Retiro en almacén' }
      ]
    : [
        { key: 'registrado', fase: 'Fase 1', label: 'Registrado', sub: 'Registrado con éxito' },
        {
          key: 'cotizacion',
          fase: 'Fase 2',
          label: 'Cotización Flete',
          sub: fleteAceptado
            ? 'Flete aceptado'
            : fleteCotizado
            ? 'Esperando tu decisión'
            : 'Cotizando por caja'
        },
        {
          key: 'pago',
          fase: 'Fase 3',
          label: 'Pago y Voucher',
          sub: isPaymentConfirmed
            ? 'Abono verificado'
            : hasUploadedVoucher
            ? 'Voucher en revisión'
            : fleteAceptado
            ? 'Abono habilitado'
            : 'Espera flete'
        },
        { key: 'preparacion', fase: 'Fase 4', label: 'En Preparación', sub: 'Alistando en patio' },
        { key: 'camino', fase: 'Fase 5', label: 'Pedido en Camino', sub: 'Camión en ruta a obra' },
        { key: 'entregado', fase: 'Fase 6', label: 'Entregado Conforme', sub: 'Descargado en obra' }
      ];

  const whatsappLink = displayOrder.whatsapp_url || buildWhatsAppUrl(
    `Hola Comercial Kenpaku, consulto por mi pedido *${displayOrder.codigo}* por S/ ${Number(displayOrder.total || 0).toFixed(2)}.`
  );

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in px-3 sm:px-0">
      
      {/* 1. HERO CONFIRMATION CARD */}
      <div className="bg-white rounded-panel border border-steel-200 p-6 sm:p-8 text-center shadow-card space-y-4">
        {/* Checkmark icon con clase .pop */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="pop w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {displayOrder.estado === 'pendiente' ? (
            <>
              <span className="cut inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-micro font-bold border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                REGISTRADO
              </span>
              {!isRecojo && !fleteCotizado && (
                <span className="cut inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-micro font-bold border border-brand-500/30">
                  <Clock className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                  FASE 2: COTIZACIÓN DE FLETE
                </span>
              )}
              {isRecojo && (
                <span className="cut inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-micro font-bold border border-brand-500/30">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  FASE 2: PAGO Y VOUCHER
                </span>
              )}
            </>
          ) : (
            <span className="cut inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-micro font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {displayOrder.estado?.replace(/_/g, ' ')?.toUpperCase() || 'REGISTRADO'}
            </span>
          )}
          <span className={`cut inline-flex items-center gap-1.5 px-3 py-1 text-micro font-bold border ${
            isRecojo
              ? 'bg-steel-100 text-navy-900 border-steel-200'
              : 'bg-orange-50 text-accent-700 border-orange-200'
          }`}>
            {isRecojo ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            {isRecojo ? 'Recojo en Almacén Puente Piedra' : 'Despacho con Flete a Obra'}
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          ¡Pedido Registrado con Éxito!
        </h1>

        {/* Código con .cut y .num sobre navy-900 */}
        <div className="p-3 bg-steel-50 border border-steel-200 rounded-card inline-block">
          <span className="text-micro text-steel-500 block uppercase font-bold tracking-wider">Código de Pedido</span>
          <div className="cut num mt-1 bg-navy-900 px-6 py-2.5 text-2xl sm:text-3xl font-extrabold text-white shadow-lift">
            {displayOrder.codigo}
          </div>
        </div>

        {/* Fases Visuales del Pedido (Stepper Sincronizado) */}
        <div className="pt-4 border-t border-steel-100">
          <div className={`grid grid-cols-2 ${isRecojo ? 'sm:grid-cols-5' : 'sm:grid-cols-3 lg:grid-cols-6'} gap-2 text-left`}>
            {stepperSteps.map((step, idx) => {
              const isPassed = isTerminalDelivered ? true : idx < activeStepIndex;
              const isCurrent = !isTerminalDelivered && idx === activeStepIndex;
              const isNext = !isTerminalDelivered && idx === activeStepIndex + 1;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-btn border transition-all ${
                    isPassed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                      : isCurrent
                      ? 'bg-orange-50 border-accent-500 ring-2 ring-accent-500/20 text-accent-900 shadow-xs'
                      : isNext
                      ? 'bg-amber-50/80 border-amber-300 border-dashed text-amber-950'
                      : 'bg-steel-50 border-steel-200 text-steel-400 opacity-60'
                  }`}
                >
                  <span className={`text-micro font-bold block uppercase tracking-wider ${
                    isPassed ? 'text-emerald-700' : isCurrent ? 'text-accent-700' : isNext ? 'text-amber-700' : 'text-steel-400'
                  }`}>
                    {step.fase}
                  </span>
                  <span className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
                    {isPassed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-accent-600 shrink-0 animate-pulse" />
                    ) : isNext ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-steel-300 shrink-0" />
                    )}
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className={`text-micro block truncate mt-0.5 ${
                    isPassed ? 'text-emerald-700' : isCurrent ? 'text-accent-800 font-bold' : isNext ? 'text-amber-800' : 'text-steel-400'
                  }`}>
                    {step.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. GESTIÓN DE FLETE PARA DESPACHO A OBRA */}
      {!isRecojo && !fleteAceptado && !isPaymentConfirmed && (
        <div className="bg-white rounded-panel border border-steel-200 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center gap-3 border-b border-steel-200 pb-3">
            <div className="w-10 h-10 rounded-btn bg-brand-50 text-brand-600 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-navy-900">
                Cotización de Flete de Transporte
              </h2>
              <p className="text-xs text-steel-500">
                Destino de obra: <strong className="text-navy-900">{displayOrder.direccion || 'Dirección registrada'}</strong>
              </p>
            </div>
          </div>

          {!fleteCotizado && (
            <div className="p-5 rounded-card bg-amber-50/80 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                <div>
                  <h3 className="font-display font-bold text-sm text-amber-950">
                    Un asesor / cajero está cotizando el costo del flete para tu dirección
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Por favor espera unos momentos. Esta pantalla se actualizará de forma instantánea tan pronto nuestro personal ingrese el costo de flete.
                  </p>
                </div>
              </div>
              <div className="text-micro text-amber-800 bg-amber-100/70 p-2.5 rounded-btn font-medium">
                💡 <strong>Nota:</strong> Los métodos de pago y la subida de comprobantes se habilitarán de inmediato una vez confirmado el monto del transporte.
              </div>
            </div>
          )}

          {fleteCotizado && !fleteAceptado && (
            <div className="p-5 rounded-card bg-orange-50/90 border border-orange-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-micro font-bold text-accent-700 uppercase tracking-wider block">
                    Costo de Transporte Calculado
                  </span>
                  <div className="num text-2xl font-black text-navy-900 mt-0.5">
                    {formatPEN(costoFleteNum)}
                  </div>
                  <p className="text-xs text-steel-600 mt-1">
                    Cálculo para camión plataforma hasta la dirección registrada. Total con flete: <strong className="num text-navy-900 font-bold">{formatPEN(displayOrder.total)}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    icon={ThumbsUp}
                    disabled={isSubmittingFlete}
                    onClick={() => handleFleteDecision('aceptar')}
                  >
                    {isSubmittingFlete ? 'Procesando...' : 'Aceptar Flete y Proceder al Pago'}
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    icon={ThumbsDown}
                    disabled={isSubmittingFlete}
                    onClick={() => handleFleteDecision('rechazar')}
                  >
                    Rechazar Flete
                  </Button>
                </div>
              </div>

              {fleteFeedback && (
                <div className={`p-3 rounded-btn text-xs font-bold ${
                  fleteFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {fleteFeedback.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ESTADO CONFIRMADO CON BOTÓN OBLIGATORIO DE BOLETA DE VENTA */}
      {isPaymentConfirmed ? (
        <div className="bg-white rounded-panel border border-emerald-200 p-6 sm:p-8 shadow-card text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="pop w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="cut inline-block px-3.5 py-1 text-micro font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
            ¡Pago Validado y Confirmado por Caja!
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-navy-900">
            Tu abono ha sido verificado con éxito
          </h2>
          <p className="text-xs sm:text-sm text-steel-600 max-w-xl mx-auto leading-relaxed font-medium">
            Tus materiales han sido reservados y se encuentran en preparación en nuestro patio de materiales. El proceso de pago está 100% verificado y no requieres subir más comprobantes.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-navy-900 font-bold">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-emerald-50 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="num">Monto Total Liquidado: {formatPEN(displayOrder.total)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-emerald-50 border border-emerald-200">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Estado: {displayOrder.estado === 'despachado' ? 'En Camino a Obra' : displayOrder.estado === 'entregado' ? 'Entregado Conforme' : 'Materiales en Preparación'}</span>
            </span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold shadow-lift transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-accent-400" />
              <span>Descargar o Imprimir Boleta de Venta</span>
            </button>
          </div>
        </div>
      ) : canPay ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cuentas Bancarias & Billeteras */}
            <div className="lg:col-span-7 bg-white rounded-panel border border-steel-200 p-6 sm:p-8 shadow-card space-y-5">
              <div className="border-b border-steel-200 pb-3">
                <h2 className="font-display text-base sm:text-lg font-bold text-navy-900">
                  Opciones y Cuentas de Pago
                </h2>
                <p className="text-xs text-steel-500 mt-0.5">
                  Realiza el depósito o transferencia por el monto exacto: <strong className="num text-accent-600 font-extrabold text-sm">{formatPEN(displayOrder.total)}</strong>
                </p>
              </div>

              {/* Selector de Bancos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BANK_ACCOUNTS.map((bank) => {
                  const Icon = bank.icon;
                  const isSelected = activeBankTab === bank.id;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setActiveBankTab(bank.id)}
                      className={`p-3 rounded-card border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/60 shadow-xs'
                          : 'border-steel-200 bg-white hover:bg-steel-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-brand-600' : 'text-steel-400'}`} />
                      <span className={`text-xs font-bold block ${isSelected ? 'text-brand-700' : 'text-steel-600'}`}>
                        {bank.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Detalle de Cuenta Seleccionada */}
              {(() => {
                const currentBank = BANK_ACCOUNTS.find((b) => b.id === activeBankTab) || BANK_ACCOUNTS[0];
                return (
                  <div className="p-4 rounded-card bg-steel-50 border border-steel-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-micro font-bold text-steel-500 uppercase tracking-wider block">Titular de la Cuenta</span>
                        <span className="text-xs font-bold text-navy-900">{currentBank.holder}</span>
                      </div>
                      <span className="cut text-micro font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {currentBank.badge}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-btn border border-steel-200 flex items-center justify-between shadow-inset">
                      <div>
                        <span className="text-micro text-steel-500 block font-bold">
                          {currentBank.id === 'yape' ? 'Número Yape / Plin:' : 'Número de Cuenta Soles:'}
                        </span>
                        <span className="num text-sm font-extrabold text-navy-900 tracking-wide">{currentBank.number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentBank.number, 'acc')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold bg-steel-100 hover:bg-steel-200 text-navy-900 transition-colors cursor-pointer"
                        title="Copiar número"
                      >
                        {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'acc' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>

                    {currentBank.cci && (
                      <div className="p-3 bg-white rounded-btn border border-steel-200 flex items-center justify-between shadow-inset">
                        <div>
                          <span className="text-micro text-steel-500 block font-bold">Código Interbancario (CCI):</span>
                          <span className="num text-xs font-mono font-bold text-navy-900 tracking-wide">{currentBank.cci}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentBank.cci, 'cci')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold bg-steel-100 hover:bg-steel-200 text-navy-900 transition-colors cursor-pointer"
                          title="Copiar CCI"
                        >
                          {copiedField === 'cci' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'cci' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    )}

                    <p className="text-micro text-steel-500 italic leading-relaxed pt-1">
                      {currentBank.note}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Subida o Estado del Comprobante */}
            <div className="lg:col-span-5 bg-white rounded-panel border border-steel-200 p-6 sm:p-8 shadow-card space-y-4">
              <div className="border-b border-steel-200 pb-3">
                <h2 className="font-display text-base sm:text-lg font-bold text-navy-900">
                  Comprobante de Pago
                </h2>
                <p className="text-xs text-steel-500 mt-0.5">
                  {hasUploadedVoucher ? 'Estado del comprobante enviado' : 'Sube tu voucher (máximo 2 archivos: imagen o PDF).'}
                </p>
              </div>

              {hasUploadedVoucher ? (
                <div className="p-6 rounded-card bg-brand-50/70 border-2 border-brand-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="cut inline-block px-3 py-0.5 text-micro font-bold uppercase tracking-wider bg-brand-600 text-white shadow-xs">
                    Comprobante en Revisión por Caja
                  </span>
                  <h4 className="font-display font-bold text-sm text-navy-900">
                    ¡Comprobante de Pago Recibido!
                  </h4>
                  <p className="text-xs text-steel-600 leading-relaxed font-medium">
                    Nuestro cajero se encuentra verificando la transferencia en el sistema bancario. Esta pantalla se actualizará de forma instantánea al confirmarse.
                  </p>
                  <div className="p-3 bg-white rounded-btn border border-steel-200 text-xs text-navy-900 font-semibold space-y-2">
                    <p className="flex items-center justify-center gap-1.5 text-emerald-700">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Comprobante registrado en el pedido</span>
                    </p>
                    {(() => {
                      const vList = getVoucherList(
                        displayOrder.voucher_referencia,
                        displayOrder.events || displayOrder.order_events
                      );
                      if (!vList.length) return null;
                      return (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          {vList.map((v, i) => (
                            <a
                              key={v.url || i}
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-btn bg-steel-100 hover:bg-steel-200 text-navy-900 border border-steel-200 text-micro font-bold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-brand-600" />
                              <span>{v.label || `Comprobante #${i + 1}`}</span>
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                    <p className="text-micro text-steel-500 font-normal">
                      🔒 No necesitas volver a adjuntar archivos ni subir duplicados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-steel-300 hover:border-brand-500 bg-steel-50 hover:bg-brand-50/30 rounded-card p-5 text-center cursor-pointer transition-all space-y-2"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      multiple
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-steel-400 mx-auto" />
                    <div>
                      <span className="text-xs font-bold text-navy-900 block">
                        Haz clic para seleccionar tu(s) comprobante(s)
                      </span>
                      <span className="text-micro text-steel-500 block mt-0.5">
                        JPG, PNG, WEBP o PDF (máx. 2 archivos, hasta 8 MB c/u)
                      </span>
                    </div>
                  </div>

                  {voucherFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-micro font-bold text-steel-500 uppercase tracking-wider block">
                        Archivos listos para enviar ({voucherFiles.length}/2):
                      </span>
                      {voucherFiles.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-btn bg-steel-100 border border-steel-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                            <span className="font-semibold text-navy-900 truncate">{f.name}</span>
                            <span className="num text-micro text-steel-500 shrink-0">
                              ({(f.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="p-1 rounded-btn hover:bg-steel-200 text-steel-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {voucherError && (
                    <div className="p-3 rounded-btn bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{voucherError}</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={isUploadingVouchers || voucherFiles.length === 0}
                    onClick={handleUploadVouchers}
                    icon={UploadCloud}
                  >
                    {isUploadingVouchers ? 'Enviando comprobante(s)...' : 'Subir Comprobante(s) de Pago'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. RESUMEN DE PRODUCTOS & DETALLES DEL PEDIDO (SIEMPRE VISIBLE) */}
      {displayOrder.items && displayOrder.items.length > 0 && (
        <div className="bg-white rounded-panel border border-steel-200 p-6 sm:p-8 shadow-card space-y-4">
          <div className="border-b border-steel-200 pb-3">
            <h2 className="font-display text-base font-bold text-navy-900">
              Detalle del Registro de Pedido
            </h2>
          </div>

          <div className="divide-y divide-steel-100">
            {displayOrder.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-navy-900 block">{item.nombre}</span>
                  <span className="text-micro text-steel-500">
                    Cantidad: {item.cantidad} x {formatPEN(item.precio_unitario)}
                  </span>
                </div>
                <span className="num font-bold text-navy-900">
                  {formatPEN(item.cantidad * item.precio_unitario)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-btn bg-steel-50 border border-steel-200 space-y-1.5 text-xs text-navy-900">
            <div className="flex justify-between text-steel-600">
              <span>Subtotal:</span>
              <span className="num font-semibold text-navy-900">{formatPEN(displayOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-steel-600">
              <span>IGV (18 %):</span>
              <span className="num font-semibold text-navy-900">{formatPEN(displayOrder.igv)}</span>
            </div>
            {costoFleteNum > 0 && (
              <div className="flex justify-between font-semibold text-accent-700">
                <span>Flete de Transporte:</span>
                <span className="num">{formatPEN(costoFleteNum)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-navy-900 pt-2 border-t border-steel-200">
              <span>Total Liquidado:</span>
              <span className="num text-accent-600 text-base font-black">{formatPEN(displayOrder.total)}</span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp + Seguir comprando */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-steel-200">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="whatsapp" size="md" fullWidth icon={MessageCircle}>
                Escribir por WhatsApp
              </Button>
            </a>

            <Link to="/catalogo" className="w-full sm:w-auto">
              <Button variant="outline" size="md" fullWidth icon={ShoppingBag}>
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Modal de Boleta de Venta Oficial (ReceiptModal) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleData={displayOrder ? (() => {
          const docInfo = extractOrderDocumentInfo(displayOrder);
          const paymentMethod = extractOrderPaymentMethod(displayOrder);
          return {
            codigo: displayOrder.codigo,
            comprobanteTipo: docInfo.comprobanteTipo,
            docNumero: docInfo.docNumero,
            clienteNombre: displayOrder.cliente_nombre || displayOrder.clienteNombre || 'Cliente General',
            clienteTelefono: displayOrder.cliente_telefono || displayOrder.clienteTelefono || '',
            clienteCorreo: displayOrder.cliente_correo || displayOrder.clienteCorreo || '',
            metodoPago: paymentMethod,
            montoRecibido: Number(displayOrder.total || 0),
            vuelto: 0,
            items: (displayOrder.items || []).map((it) => ({
              nombre: it.nombre || it.nombre_snapshot || 'Producto de Acero',
              cantidad: Number(it.cantidad || 1),
              precio_unitario: Number(it.precio_unitario || it.precio_unitario_snapshot || 0)
            })),
            subtotal: Number(displayOrder.subtotal || 0),
            costo_flete: Number(displayOrder.costo_flete || 0),
            igv: Number(displayOrder.igv || 0),
            total: Number(displayOrder.total || 0),
            fechaEmision: displayOrder.created_at || new Date()
          };
        })() : null}
      />
    </div>
  );
}
