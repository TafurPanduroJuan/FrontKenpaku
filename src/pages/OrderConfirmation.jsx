import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ShoppingBag, Truck, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatPEN } from '../utils/formatPEN';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getOrderTracking } from '../api/orders';

export function OrderConfirmation() {
  const { codigo } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromUrl = searchParams.get('token') || '';

  const initialData = location.state?.orderData || null;
  const [orderData, setOrderData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData && !!tokenFromUrl);

  const activeToken = orderData?.tracking_token || tokenFromUrl;

  // Si se recarga la página y no hay state pero sí token en URL, recuperar datos del backend
  useEffect(() => {
    if (!orderData && tokenFromUrl) {
      setIsLoading(true);
      getOrderTracking({ token: tokenFromUrl })
        .then((data) => {
          setOrderData(data);
        })
        .catch(() => {
          // Fallback a vista base
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [orderData, tokenFromUrl]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Recuperando datos de tu pedido...</p>
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

  const whatsappLink = displayOrder.whatsapp_url || buildWhatsAppUrl(`Hola, requiero información del pedido ${displayOrder.codigo}`);
  const trackingLink = activeToken
    ? `/seguimiento?token=${encodeURIComponent(activeToken)}`
    : `/seguimiento?codigo=${encodeURIComponent(displayOrder.codigo)}`;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 animate-fade-in">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-soft space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          {displayOrder.estado?.replace(/_/g, ' ') || 'Pendiente de confirmación'}
        </span>

        <h1 className="text-3xl font-extrabold text-kenpaku-navy">¡Pedido Registrado con Éxito!</h1>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block">
          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Código de Pedido</span>
          <span className="text-2xl font-extrabold text-kenpaku-orange">{displayOrder.codigo}</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          Un asesor comercial de <strong>Comercial Kenpaku S.A.C.</strong> confirmará precio, stock y costo de flete a la brevedad vía WhatsApp o llamada telefónica.
        </p>

        {/* Action Buttons: Seguimiento en Vivo + WhatsApp */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link to={trackingLink} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth icon={Truck}>
              Ver Seguimiento en Vivo
            </Button>
          </Link>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="whatsapp" size="lg" fullWidth icon={MessageCircle}>
              Escribir por WhatsApp
            </Button>
          </a>

          <Link to="/catalogo" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth icon={ShoppingBag}>
              Seguir comprando
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Summary Details */}
      {displayOrder.items && displayOrder.items.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-4">
          <h2 className="text-base font-bold text-kenpaku-navy border-b border-slate-100 pb-3">
            Detalle del Registro de Pedido
          </h2>

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
            {Number(displayOrder.costo_flete) > 0 && (
              <div className="flex justify-between font-semibold text-indigo-700">
                <span>Flete de Transporte:</span>
                <span>{formatPEN(displayOrder.costo_flete)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-kenpaku-navy pt-2 border-t border-slate-200">
              <span>Total Estimado:</span>
              <span className="text-kenpaku-orange">{formatPEN(displayOrder.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
