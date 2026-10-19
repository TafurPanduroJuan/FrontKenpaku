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
  CreditCard,
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
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatPEN } from '../utils/formatPEN';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getOrderTracking, submitFleteDecision, uploadOrderVoucher } from '../api/orders';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { getVoucherList } from '../utils/voucher';

const BANK_ACCOUNTS = [
  {
    id: 'yape',
    name: 'Yape / Plin',
    badge: 'Inmediato sin comisión',
    number: '987 654 321',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: QrCode,
    note: 'Escanea el código QR o transfiere directo al número de celular desde Yape o Plin.'
  },
  {
    id: 'bcp',
    name: 'BCP Soles',
    badge: 'Cuenta Corriente',
    number: '191-2345678-0-12',
    cci: '002-191-002345678012-55',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: Building2,
    note: 'Transferencia directa o interbancaria (CCI) a nuestra cuenta corriente empresarial.'
  },
  {
    id: 'bbva',
    name: 'BBVA Soles',
    badge: 'Cuenta Corriente',
    number: '0011-0123-0100456789',
    cci: '011-123-000100456789-78',
    holder: 'Comercial Kenpaku S.A.C.',
    icon: CreditCard,
    note: 'Abonos directos por banca por internet, agentes o ventanilla BBVA.'
  },
  {
    id: 'interbank',
    name: 'Interbank',
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

  // Sincronizar estado local y actualizar el historial de sesión del navegador para recargas (F5)
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

  // Función para refrescar datos del pedido en vivo
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
      // Ignorar fallas temporales de sondeo en segundo plano
    }
  };

  // Carga inmediata al montar la pantalla para reflejar el estado actual de la BD sin demora
  useEffect(() => {
    if (!orderData && tokenFromUrl) {
      setIsLoading(true);
      fetchLatestOrder().finally(() => setIsLoading(false));
    } else {
      fetchLatestOrder();
    }
  }, [activeToken, codigo, tokenFromUrl]);

  // Sondeo en vivo cada 3.5 segundos para detectar cotización de flete o aprobación de voucher
  useEffect(() => {
    if (!orderData) return;
    const isTerminal = ['entregado', 'cancelado'].includes(orderData.estado);
    if (isTerminal) return;

    const interval = setInterval(() => {
      fetchLatestOrder();
    }, 3500);

    return () => clearInterval(interval);
  }, [orderData?.estado, activeToken, codigo]);

  // Copiar al portapapeles
  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Manejo de Decisión de Flete (Aceptar / Rechazar)
  const handleFleteDecision = async (decision) => {
    setIsSubmittingFlete(true);
    setFleteFeedback(null);
    try {
      const res = await submitFleteDecision({
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
      // Actualizar estado local e historial del navegador inmediatamente
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

  // Manejo de Selección de Archivos de Voucher (Máx 2, imágenes o PDF)
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

  // Enviar Vouchers
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
          file
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
        <div className="w-12 h-12 border-3 border-kenpaku-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 text-sm font-semibold">Cargando el estado en vivo de tu pedido...</p>
      </div>
    );
  }

  const displayOrder = orderData;

  if (!displayOrder) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fade-in bg-white rounded-3xl border border-slate-200 p-8 shadow-soft">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-kenpaku-navy">No se pudieron recuperar los datos de tu pedido</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
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
    // Despacho con flete a obra
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
        {
          key: 'registrado',
          fase: 'Fase 1',
          label: 'Registrado',
          sub: 'Registrado con éxito'
        },
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
        {
          key: 'preparacion',
          fase: 'Fase 3',
          label: 'En Preparación',
          sub: 'Alistando en patio'
        },
        {
          key: 'listo',
          fase: 'Fase 4',
          label: 'Listo para Entrega',
          sub: 'Almacén Puente Piedra'
        },
        {
          key: 'entregado',
          fase: 'Fase 5',
          label: 'Entregado Conforme',
          sub: 'Retiro en almacén'
        }
      ]
    : [
        {
          key: 'registrado',
          fase: 'Fase 1',
          label: 'Registrado',
          sub: 'Registrado con éxito'
        },
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
        {
          key: 'preparacion',
          fase: 'Fase 4',
          label: 'En Preparación',
          sub: 'Alistando en patio'
        },
        {
          key: 'camino',
          fase: 'Fase 5',
          label: 'Pedido en Camino',
          sub: 'Camión en ruta a obra'
        },
        {
          key: 'entregado',
          fase: 'Fase 6',
          label: 'Entregado Conforme',
          sub: 'Descargado en obra'
        }
      ];

  const whatsappLink = displayOrder.whatsapp_url || buildWhatsAppUrl(
    `Hola Comercial Kenpaku, consulto por mi pedido *${displayOrder.codigo}* por S/ ${Number(displayOrder.total || 0).toFixed(2)}.`
  );

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in px-3 sm:px-0">
      
      {/* 1. HERO CARD: ¡Pedido Registrado con Éxito! */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 text-center shadow-soft space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {displayOrder.estado === 'pendiente' ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                REGISTRADO
              </span>
              {!isRecojo && !fleteCotizado && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-300 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                  FASE 2: COTIZACIÓN DE FLETE
                </span>
              )}
              {isRecojo && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-300 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  FASE 2: PAGO Y VOUCHER
                </span>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {displayOrder.estado?.replace(/_/g, ' ')?.toUpperCase() || 'REGISTRADO'}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isRecojo
              ? 'bg-sky-100 text-sky-800 border-sky-200'
              : 'bg-indigo-100 text-indigo-800 border-indigo-200'
          }`}>
            {isRecojo ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
            {isRecojo ? 'Recojo en Almacén Puente Piedra' : 'Despacho con Flete a Obra'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">
          ¡Pedido Registrado con Éxito!
        </h1>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
          <span className="text-[11px] text-slate-500 block uppercase font-bold tracking-wider">Código de Pedido</span>
          <span className="text-2xl sm:text-3xl font-black text-kenpaku-orange tracking-tight">{displayOrder.codigo}</span>
        </div>

        {/* Fases Visuales del Pedido (Stepper Sincronizado: Verde=Completado, Azul=Actual, Amarillo=Siguiente) */}
        <div className="pt-4 border-t border-slate-100">
          <div className={`grid grid-cols-2 ${isRecojo ? 'sm:grid-cols-5' : 'sm:grid-cols-3 lg:grid-cols-6'} gap-2 text-left`}>
            {stepperSteps.map((step, idx) => {
              const isPassed = isTerminalDelivered ? true : idx < activeStepIndex;
              const isCurrent = !isTerminalDelivered && idx === activeStepIndex;
              const isNext = !isTerminalDelivered && idx === activeStepIndex + 1;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border transition-all ${
                    isPassed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                      : isCurrent
                      ? 'bg-sky-50 border-kenpaku-blue ring-2 ring-sky-500/25 text-sky-950 shadow-xs'
                      : isNext
                      ? 'bg-amber-50/90 border-amber-300 border-dashed text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${
                    isPassed ? 'text-emerald-700' : isCurrent ? 'text-sky-700' : isNext ? 'text-amber-700' : 'text-slate-400'
                  }`}>
                    {step.fase}
                  </span>
                  <span className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
                    {isPassed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-kenpaku-blue shrink-0 animate-pulse" />
                    ) : isNext ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{step.label}</span>
                  </span>
                  <span className={`text-[10px] block truncate mt-0.5 ${
                    isPassed ? 'text-emerald-700' : isCurrent ? 'text-sky-800 font-bold' : isNext ? 'text-amber-800' : 'text-slate-400'
                  }`}>
                    {step.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. GESTIÓN DE FLETE PARA DESPACHO A OBRA:
          Solo se muestra mientras se esté cotizando o esperando la decisión del cliente en Fase 2,
          y se retira automáticamente una vez aceptado o cuando el pago ya está confirmado */}
      {!isRecojo && !fleteAceptado && !isPaymentConfirmed && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-kenpaku-navy">
                Cotización de Flete de Transporte
              </h2>
              <p className="text-xs text-slate-500">
                Destino de obra: <strong className="text-slate-800">{displayOrder.direccion || 'Dirección registrada'}</strong>
              </p>
            </div>
          </div>

          {/* Subcaso 1: Esperando cotización del cajero */}
          {!fleteCotizado && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm text-amber-950">
                    Un asesor / cajero está cotizando el costo del flete para tu dirección
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Por favor espera unos momentos. Esta pantalla se actualizará de forma instantánea tan pronto nuestro personal ingrese el costo de flete.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-amber-700 bg-amber-100/60 p-2.5 rounded-xl">
                💡 <strong>Nota:</strong> Los métodos de pago y la subida de comprobantes se habilitarán de inmediato una vez confirmado el monto del transporte.
              </div>
            </div>
          )}

          {/* Subcaso 2: Flete cotizado esperando decisión del cliente */}
          {fleteCotizado && !fleteAceptado && (
            <div className="p-5 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider block">
                    Costo de Transporte Calculado
                  </span>
                  <div className="text-2xl font-black text-purple-900 mt-0.5">
                    {formatPEN(costoFleteNum)}
                  </div>
                  <p className="text-xs text-purple-800 mt-1">
                    Cálculo para camión plataforma hasta la dirección registrada. Total con flete: <strong className="text-slate-900">{formatPEN(displayOrder.total)}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    icon={ThumbsUp}
                    disabled={isSubmittingFlete}
                    onClick={() => handleFleteDecision('aceptar')}
                    className="shadow-sm"
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
                <div className={`p-3 rounded-xl text-xs font-bold ${
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
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-soft text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
            ¡Pago Validado y Confirmado por Caja!
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
            Tu abono ha sido verificado con éxito
          </h2>
          <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto leading-relaxed">
            Tus materiales han sido reservados y se encuentran en preparación en nuestro patio de materiales. El proceso de pago está 100% verificado y no requieres subir más comprobantes.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-emerald-900 font-bold">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600" />
              Monto Total Liquidado: {formatPEN(displayOrder.total)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
              <Store className="w-4 h-4 text-emerald-600" />
              Estado: {displayOrder.estado === 'despachado' ? 'En Camino a Obra' : displayOrder.estado === 'entregado' ? 'Entregado Conforme' : 'Materiales en Preparación'}
            </span>
          </div>

          {/* Botón Obligatorio para Descargar / Imprimir Boleta de Venta */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-kenpaku-navy hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Descargar o Imprimir Boleta de Venta</span>
            </button>
          </div>
        </div>
      ) : canPay ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cuentas Bancarias & Billeteras */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-kenpaku-navy">
                    Opciones y Cuentas de Pago
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Realiza el depósito o transferencia por el monto exacto: <strong className="text-kenpaku-orange text-sm">{formatPEN(displayOrder.total)}</strong>
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
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-kenpaku-blue bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-kenpaku-blue' : 'text-slate-400'}`} />
                        <span className={`text-xs font-extrabold block ${isSelected ? 'text-kenpaku-blue' : 'text-slate-700'}`}>
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
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Titular de la Cuenta</span>
                          <span className="text-xs font-black text-kenpaku-navy">{currentBank.holder}</span>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {currentBank.badge}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">
                            {currentBank.id === 'yape' ? 'Número Yape / Plin:' : 'Número de Cuenta Soles:'}
                          </span>
                          <span className="text-sm font-black text-slate-900 tracking-wide">{currentBank.number}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentBank.number, 'acc')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Copiar número"
                        >
                          {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'acc' ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>

                      {currentBank.cci && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Código Interbancario (CCI):</span>
                            <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">{currentBank.cci}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentBank.cci, 'cci')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Copiar CCI"
                          >
                            {copiedField === 'cci' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'cci' ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 italic leading-relaxed pt-1">
                        {currentBank.note}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Subida o Estado del Comprobante */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-kenpaku-navy">
                    Comprobante de Pago
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hasUploadedVoucher ? 'Estado del comprobante enviado' : 'Sube tu voucher (máximo 2 archivos: imagen o PDF).'}
                  </p>
                </div>

                {hasUploadedVoucher ? (
                  <div className="p-6 rounded-2xl bg-sky-50 border-2 border-sky-300 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-2xs">
                      Comprobante en Revisión por Caja
                    </span>
                    <h4 className="font-extrabold text-sm text-sky-950">
                      ¡Comprobante de Pago Recibido!
                    </h4>
                    <p className="text-xs text-sky-800 leading-relaxed">
                      Nuestro cajero se encuentra verificando la transferencia en el sistema bancario. Esta pantalla se actualizará de forma instantánea al confirmarse.
                    </p>
                    <div className="p-3 bg-white/90 rounded-2xl border border-sky-200 text-xs text-sky-900 font-semibold space-y-2">
                      <p className="flex items-center justify-center gap-1.5 text-emerald-700">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Comprobante registrado en el pedido
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-sky-600" />
                                <span>{v.label || `Comprobante #${i + 1}`}</span>
                              </a>
                            ))}
                          </div>
                        );
                      })()}
                      <p className="text-[11px] text-slate-500 font-normal">
                        🔒 No necesitas volver a adjuntar archivos ni subir duplicados.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Zona de Drop / Carga de Archivos */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-kenpaku-blue bg-slate-50 hover:bg-sky-50/40 rounded-2xl p-5 text-center cursor-pointer transition-all space-y-2"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        multiple
                        className="hidden"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <div>
                        <span className="text-xs font-extrabold text-kenpaku-navy block">
                          Haz clic para seleccionar tu(s) comprobante(s)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          JPG, PNG, WEBP o PDF (máx. 2 archivos, hasta 8 MB c/u)
                        </span>
                      </div>
                    </div>

                    {/* Lista de Archivos Seleccionados */}
                    {voucherFiles.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Archivos listos para enviar ({voucherFiles.length}/2):
                        </span>
                        {voucherFiles.map((f, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                              <span className="font-medium text-slate-800 truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({(f.size / 1024).toFixed(0)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(i)}
                              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {voucherError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
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
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-kenpaku-navy">
              Detalle del Registro de Pedido
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {displayOrder.items.map((item, idx) => (
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

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPEN(displayOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18 %):</span>
              <span>{formatPEN(displayOrder.igv)}</span>
            </div>
            {costoFleteNum > 0 && (
              <div className="flex justify-between font-semibold text-purple-700">
                <span>Flete de Transporte:</span>
                <span>{formatPEN(costoFleteNum)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-kenpaku-navy pt-2 border-t border-slate-200">
              <span>Total Liquidado:</span>
              <span className="text-kenpaku-orange text-base">{formatPEN(displayOrder.total)}</span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp + Seguir comprando */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-slate-100">
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

      {/* Modal de Boleta de Venta Oficial (Imprimir 80mm o Descargar PDF) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleData={displayOrder ? {
          codigo: displayOrder.codigo,
          comprobanteTipo: 'boleta',
          docNumero: displayOrder.cliente_dni || displayOrder.cliente_ruc || displayOrder.docNumero || '',
          clienteNombre: displayOrder.cliente_nombre || displayOrder.clienteNombre || 'Cliente General',
          clienteTelefono: displayOrder.cliente_telefono || displayOrder.clienteTelefono || '',
          clienteCorreo: displayOrder.cliente_correo || displayOrder.clienteCorreo || '',
          metodoPago: displayOrder.metodo_pago || 'transferencia',
          montoRecibido: Number(displayOrder.total || 0),
          vuelto: 0,
          items: displayOrder.items || [],
          subtotal: Number(displayOrder.subtotal || 0),
          costo_flete: Number(displayOrder.costo_flete || 0),
          igv: Number(displayOrder.igv || 0),
          total: Number(displayOrder.total || 0),
          fechaEmision: displayOrder.created_at || new Date()
        } : null}
      />
    </div>
  );
}
