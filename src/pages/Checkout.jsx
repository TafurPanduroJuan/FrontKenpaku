import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Truck, Store, AlertTriangle, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../api/orders';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { formatPEN } from '../utils/formatPEN';

const checkoutSchema = z.object({
  nombre: z.string().min(3, 'Ingrese su nombre completo (mínimo 3 caracteres)'),
  telefono: z.string().min(9, 'Ingrese un teléfono o WhatsApp válido (mínimo 9 dígitos)'),
  correo: z.string().email('Ingrese un correo electrónico válido'),
  delivery_type: z.enum(['despacho', 'recojo']),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
  acepto_privacidad: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar la política de privacidad para proceder'
  })
}).refine((data) => {
  if (data.delivery_type === 'despacho') {
    return !!data.direccion && data.direccion.trim().length >= 5;
  }
  return true;
}, {
  message: 'Ingrese una dirección de entrega completa para despacho a obra',
  path: ['direccion']
});

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, igv, total, clearCart } = useCart();

  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      correo: '',
      delivery_type: 'despacho',
      direccion: '',
      observaciones: '',
      acepto_privacidad: false
    }
  });

  const deliveryType = watch('delivery_type');
  const aceptoPrivacidad = watch('acepto_privacidad');

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-kenpaku-navy">Tu carrito está vacío</h2>
        <p className="text-xs text-slate-500">Agrega productos al carrito antes de proceder con el registro del pedido.</p>
        <Link to="/catalogo">
          <Button variant="primary">Ir al catálogo de acero</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      cliente: {
        nombre: data.nombre,
        telefono: data.telefono,
        correo: data.correo
      },
      recojo_en_tienda: data.delivery_type === 'recojo',
      direccion: data.delivery_type === 'despacho' ? data.direccion : null,
      observaciones: data.observaciones || null,
      acepto_privacidad: data.acepto_privacidad,
      items: items.map((i) => ({
        product_id: i.product.id,
        cantidad: i.cantidad
      }))
    };

    try {
      const response = await createOrder(payload);
      // Clear local cart
      clearCart();
      // Navigate to order confirmation page passing order response state
      navigate(`/pedido/${response.codigo}`, { state: { orderData: response } });
    } catch (err) {
      console.error('Error al registrar pedido:', err);
      const detail = err?.response?.data?.detail || 'Ocurrió un error inesperado al procesar su pedido.';
      const code = err?.response?.data?.code;
      const productName = err?.response?.data?.product_name;

      if (err?.response?.status === 409 || code === 'OUT_OF_STOCK') {
        setServerError({
          title: 'Stock insuficiente detectado',
          message: productName
            ? `El producto "${productName}" no cuenta con suficiente stock en almacén para completar la cantidad solicitada.`
            : detail
        });
      } else {
        setServerError({
          title: 'Error al enviar pedido',
          message: detail
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-2">
      <Breadcrumb items={[{ label: 'Catálogo', url: '/catalogo' }, { label: 'Registro de Pedido' }]} />

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-kenpaku-navy">Registro de Pedido</h1>
        <p className="text-xs text-slate-500 mt-1">
          Completa tus datos de contacto para coordinar la entrega o recojo en Puente Piedra.
        </p>
      </div>

      {/* 409 Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-900">{serverError.title}</h4>
            <p className="leading-relaxed">{serverError.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
          <h2 className="text-lg font-bold text-kenpaku-navy border-b border-slate-100 pb-3">
            1. Datos del Cliente
          </h2>

          <div className="space-y-4">
            <Input
              label="Nombre y Apellidos *"
              placeholder="Ej. Juan Pérez Tafur"
              error={errors.nombre?.message}
              {...register('nombre')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono / WhatsApp *"
                placeholder="Ej. 987654321"
                error={errors.telefono?.message}
                {...register('telefono')}
              />

              <Input
                label="Correo Electrónico *"
                type="email"
                placeholder="ejemplo@correo.com"
                error={errors.correo?.message}
                {...register('correo')}
              />
            </div>
          </div>

          <h2 className="text-lg font-bold text-kenpaku-navy border-b border-slate-100 pb-3 pt-4">
            2. Modalidad de Entrega
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                deliveryType === 'despacho'
                  ? 'border-kenpaku-blue bg-blue-50/50 text-kenpaku-navy'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                value="despacho"
                className="sr-only"
                {...register('delivery_type')}
              />
              <Truck className="w-6 h-6 text-kenpaku-blue shrink-0" />
              <div>
                <span className="block text-xs font-bold">Despacho a Obra</span>
                <span className="text-[11px] text-slate-500">Envío con camión (Flete post-orden)</span>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                deliveryType === 'recojo'
                  ? 'border-kenpaku-blue bg-blue-50/50 text-kenpaku-navy'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                value="recojo"
                className="sr-only"
                {...register('delivery_type')}
              />
              <Store className="w-6 h-6 text-kenpaku-blue shrink-0" />
              <div>
                <span className="block text-xs font-bold">Recojo en Tienda</span>
                <span className="text-[11px] text-slate-500">Almacén en Puente Piedra</span>
              </div>
            </label>
          </div>

          {deliveryType === 'despacho' && (
            <Input
              label="Dirección de entrega completa *"
              placeholder="Ej. Av. Néstor Gambetta 1420, Puente Piedra, Lima"
              error={errors.direccion?.message}
              {...register('direccion')}
            />
          )}

          <Textarea
            label="Observaciones o referencias adicionales"
            placeholder="Instrucciones para el chofer o detalles de corte preliminar..."
            rows={3}
            {...register('observaciones')}
          />

          {/* Mandatory Checkbox */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                id="acepto_privacidad_checkbox"
                className="w-4 h-4 mt-0.5 rounded text-kenpaku-blue border-slate-300 focus:ring-kenpaku-blue"
                {...register('acepto_privacidad')}
              />
              <span>
                He leído y acepto la{' '}
                <Link to="/politica-de-privacidad" target="_blank" className="text-kenpaku-blue font-bold hover:underline">
                  Política de Privacidad
                </Link>{' '}
                de Comercial Kenpaku S.A.C. *
              </span>
            </label>
            {errors.acepto_privacidad && (
              <p className="mt-1 text-xs text-red-600 font-medium pl-7">
                {errors.acepto_privacidad.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-kenpaku-navy border-b border-slate-100 pb-3">
            Resumen del Pedido
          </h2>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
            {items.map(({ product, cantidad }) => (
              <div key={product.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{product.nombre}</span>
                  <span className="text-slate-500">Cantidad: {cantidad}</span>
                </div>
                <span className="font-bold text-kenpaku-navy">
                  {formatPEN(product.precio_unitario * cantidad)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (sin IGV):</span>
              <span>{formatPEN(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IGV (18 %):</span>
              <span>{formatPEN(igv)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-kenpaku-navy pt-2 border-t border-slate-200">
              <span>Total a Confirmar:</span>
              <span className="text-kenpaku-orange">{formatPEN(total)}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug">
            ⚠️ Flete a coordinar con administración post-orden. Los montos son referenciales hasta la validación de un asesor.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!aceptoPrivacidad || isSubmitting}
            icon={ArrowRight}
          >
            Registrar pedido
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tus datos están seguros y protegidos</span>
          </div>
        </div>
      </form>
    </div>
  );
}
