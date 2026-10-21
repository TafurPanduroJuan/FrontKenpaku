import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Truck, Store, AlertTriangle, ArrowRight, ShoppingBag, MapPin, User, Building2, FileText } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../api/orders';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { formatPEN } from '../utils/formatPEN';
import { STORE_INFO } from '../utils/constants';
import {
  sanitizeOnlyLettersAndSpaces,
  sanitizeDigits,
  sanitizeEmailInput,
  isValidEmail,
  sanitizeAddress,
  sanitizeSafeText
} from '../utils/sanitizers';

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const ADDRESS_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s/.\-º°#,()]+$/;

const checkoutSchema = z
  .object({
    tipo_documento: z.enum(['dni', 'ruc']).default('dni'),
    nombres: z.string().optional(),
    apellidos: z.string().optional(),
    dni: z.string().optional(),
    ruc: z.string().optional(),
    razon_social: z.string().optional(),
    contacto_nombre: z.string().optional(),
    telefono: z
      .string()
      .min(1, 'Ingrese su número de teléfono o WhatsApp')
      .superRefine((val, ctx) => {
        const trimmed = val.trim();
        if (!trimmed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ingrese su número de teléfono o WhatsApp'
          });
          return;
        }
        if (!/^\d+$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El teléfono solo debe contener números (sin letras, espacios ni caracteres especiales)'
          });
          return;
        }
        if (trimmed.length !== 9) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `El teléfono debe tener exactamente 9 dígitos (ingresó ${trimmed.length})`
          });
          return;
        }
        if (!trimmed.startsWith('9')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El número de teléfono o WhatsApp debe empezar con 9 (ej. 987654321)'
          });
          return;
        }
      }),
    correo: z
      .string()
      .min(1, 'Ingrese su correo electrónico')
      .superRefine((val, ctx) => {
        const trimmed = val.trim();
        if (!trimmed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ingrese su correo electrónico'
          });
          return;
        }
        if (!trimmed.includes('@')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El correo debe incluir el símbolo '@' (ejemplo: usuario@correo.com)"
          });
          return;
        }
        if (!isValidEmail(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El correo debe tener un formato válido con dominio (ejemplo: usuario@correo.com)'
          });
          return;
        }
      }),
    delivery_type: z.enum(['despacho', 'recojo']),
    direccion: z.string().optional(),
    observaciones: z
      .string()
      .max(500, 'Las observaciones no pueden exceder los 500 caracteres')
      .optional(),
    acepto_privacidad: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar la política de privacidad para proceder'
    })
  })
  .superRefine((data, ctx) => {
    // 1. Validación condicional por tipo de comprobante / documento
    if (data.tipo_documento === 'dni') {
      const nom = data.nombres ? data.nombres.trim() : '';
      if (!nom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese sus nombres',
          path: ['nombres']
        });
      } else if (nom.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre debe tener al menos 2 caracteres',
          path: ['nombres']
        });
      } else if (nom.length > 80) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre no puede exceder los 80 caracteres',
          path: ['nombres']
        });
      } else if (!NAME_REGEX.test(nom)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los nombres solo deben contener letras y espacios',
          path: ['nombres']
        });
      }

      const ape = data.apellidos ? data.apellidos.trim() : '';
      if (!ape) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese sus apellidos',
          path: ['apellidos']
        });
      } else if (ape.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los apellidos deben tener al menos 2 caracteres',
          path: ['apellidos']
        });
      } else if (ape.length > 80) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los apellidos no pueden exceder los 80 caracteres',
          path: ['apellidos']
        });
      } else if (!NAME_REGEX.test(ape)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los apellidos solo deben contener letras y espacios',
          path: ['apellidos']
        });
      }

      const dniVal = data.dni ? data.dni.trim() : '';
      if (!dniVal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese su número de DNI',
          path: ['dni']
        });
      } else if (!/^\d+$/.test(dniVal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El DNI solo debe contener números',
          path: ['dni']
        });
      } else if (dniVal.length !== 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El DNI debe tener exactamente 8 dígitos (ingresó ${dniVal.length})`,
          path: ['dni']
        });
      }
    } else if (data.tipo_documento === 'ruc') {
      const rucVal = data.ruc ? data.ruc.trim() : '';
      if (!rucVal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese el número de RUC',
          path: ['ruc']
        });
      } else if (!/^\d+$/.test(rucVal)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El RUC solo debe contener números',
          path: ['ruc']
        });
      } else if (rucVal.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El RUC debe tener exactamente 11 dígitos (ingresó ${rucVal.length})`,
          path: ['ruc']
        });
      } else if (
        !rucVal.startsWith('10') &&
        !rucVal.startsWith('20') &&
        !rucVal.startsWith('15') &&
        !rucVal.startsWith('17')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El RUC debe iniciar con 10, 20 o dígitos válidos de SUNAT',
          path: ['ruc']
        });
      }

      const rz = data.razon_social ? data.razon_social.trim() : '';
      if (!rz) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese la Razón Social de la empresa',
          path: ['razon_social']
        });
      } else if (rz.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La Razón Social debe tener al menos 3 caracteres',
          path: ['razon_social']
        });
      } else if (rz.length > 150) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La Razón Social no puede exceder 150 caracteres',
          path: ['razon_social']
        });
      }

      const cont = data.contacto_nombre ? data.contacto_nombre.trim() : '';
      if (!cont) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese el nombre de la persona de contacto o recepción',
          path: ['contacto_nombre']
        });
      } else if (cont.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre de contacto debe tener al menos 2 caracteres',
          path: ['contacto_nombre']
        });
      } else if (!NAME_REGEX.test(cont)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El nombre de contacto solo debe contener letras y espacios',
          path: ['contacto_nombre']
        });
      }
    }

    // 2. Validación condicional por despacho a obra
    if (data.delivery_type === 'despacho') {
      const dir = data.direccion ? data.direccion.trim() : '';
      if (!dir) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección de entrega es obligatoria para despacho a obra',
          path: ['direccion']
        });
      } else if (dir.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección es muy corta: ingrese una dirección más completa (mínimo 5 caracteres)',
          path: ['direccion']
        });
      } else if (dir.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección no puede exceder los 200 caracteres',
          path: ['direccion']
        });
      } else if (!ADDRESS_REGEX.test(dir)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección contiene caracteres especiales no válidos (solo letras, números, #, °, -, /)',
          path: ['direccion']
        });
      } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(dir)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La dirección debe incluir el nombre de la vía, calle o manzana',
          path: ['direccion']
        });
      }
    }
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
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      tipo_documento: 'dni',
      nombres: '',
      apellidos: '',
      dni: '',
      ruc: '',
      razon_social: '',
      contacto_nombre: '',
      telefono: '',
      correo: '',
      delivery_type: 'despacho',
      direccion: '',
      observaciones: '',
      acepto_privacidad: false
    }
  });

  const tipoDocumento = watch('tipo_documento');
  const deliveryType = watch('delivery_type');
  const aceptoPrivacidad = watch('acepto_privacidad');

  useEffect(() => {
    if (deliveryType === 'recojo') {
      clearErrors('direccion');
    }
  }, [deliveryType, clearErrors]);

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

    let clienteNombre = '';
    let docTag = '';
    if (data.tipo_documento === 'ruc') {
      const rz = data.razon_social?.trim() || 'Empresa';
      const contacto = data.contacto_nombre?.trim() || '';
      clienteNombre = contacto ? `${rz} (${contacto})` : rz;
      docTag = `[DOC: RUC ${data.ruc?.trim()}] [FACTURA] [EMPRESA: ${rz}]`;
    } else {
      clienteNombre = `${data.nombres?.trim() || ''} ${data.apellidos?.trim() || ''}`.trim();
      docTag = `[DNI: ${data.dni?.trim()}]`;
    }

    const obsText = data.observaciones?.trim() ? ` | ${data.observaciones.trim()}` : '';

    const payload = {
      cliente: {
        nombre: clienteNombre,
        telefono: data.telefono.trim(),
        correo: data.correo.trim().toLowerCase()
      },
      recojo_en_tienda: data.delivery_type === 'recojo',
      direccion: data.delivery_type === 'despacho' ? (data.direccion?.trim() || null) : null,
      observaciones: `${docTag}${obsText}`,
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

      // Guardar en pedidos recientes del dispositivo para consulta rápida
      try {
        const recent = {
          codigo: response.codigo,
          tracking_token: response.tracking_token || '',
          total: response.total,
          fecha: new Date().toISOString()
        };
        const existing = JSON.parse(localStorage.getItem('kenpaku_recent_orders') || '[]');
        const filtered = existing.filter((o) => o.codigo !== response.codigo);
        localStorage.setItem('kenpaku_recent_orders', JSON.stringify([recent, ...filtered].slice(0, 5)));
      } catch {
        // ignore localStorage errors
      }

      // Redirigir pasando token secreto en query y orderData garantizando recojo_en_tienda
      const tokenQuery = response.tracking_token ? `?token=${encodeURIComponent(response.tracking_token)}` : '';
      navigate(`/pedido/${response.codigo}${tokenQuery}`, {
        state: {
          orderData: {
            ...response,
            recojo_en_tienda: response.recojo_en_tienda ?? payload.recojo_en_tienda,
            direccion: response.direccion ?? payload.direccion
          }
        }
      });
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Client Details */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-soft space-y-6">
          {/* Header con Selector de Comprobante / Tipo de Documento */}
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-kenpaku-navy">
                1. Datos del Cliente y Comprobante
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona si requieres Boleta de Venta personal o Factura con RUC.
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setValue('tipo_documento', 'dni');
                  clearErrors(['ruc', 'razon_social', 'contacto_nombre']);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  tipoDocumento === 'dni'
                    ? 'bg-white text-kenpaku-navy shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-kenpaku-blue" />
                <span>Boleta (DNI)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('tipo_documento', 'ruc');
                  clearErrors(['dni', 'nombres', 'apellidos']);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  tipoDocumento === 'ruc'
                    ? 'bg-white text-kenpaku-blue shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-kenpaku-blue" />
                <span>Factura (RUC)</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tipoDocumento === 'dni' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombres *"
                    placeholder="Ej. Juan Carlos"
                    maxLength={80}
                    error={errors.nombres?.message}
                    {...register('nombres', {
                      onChange: (e) => {
                        e.target.value = sanitizeOnlyLettersAndSpaces(e.target.value);
                      }
                    })}
                  />

                  <Input
                    label="Apellidos *"
                    placeholder="Ej. Pérez Tafur"
                    maxLength={80}
                    error={errors.apellidos?.message}
                    {...register('apellidos', {
                      onChange: (e) => {
                        e.target.value = sanitizeOnlyLettersAndSpaces(e.target.value);
                      }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="DNI *"
                    type="text"
                    maxLength={8}
                    placeholder="8 dígitos (Ej. 12345678)"
                    error={errors.dni?.message}
                    {...register('dni', {
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 8);
                      }
                    })}
                  />

                  <Input
                    label="Teléfono o WhatsApp *"
                    type="tel"
                    maxLength={9}
                    placeholder="Ej. 987654321"
                    error={errors.telefono?.message}
                    {...register('telefono', {
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 9);
                      }
                    })}
                  />

                  <Input
                    label="Correo Electrónico *"
                    type="email"
                    maxLength={100}
                    placeholder="ejemplo@correo.com"
                    error={errors.correo?.message}
                    {...register('correo', {
                      onChange: (e) => {
                        e.target.value = sanitizeEmailInput(e.target.value);
                      }
                    })}
                  />
                </div>
              </>
            ) : (
              <>
                <Input
                  label="Razón Social / Nombre Comercial *"
                  placeholder="Ej. Constructora & Inversiones Los Andes S.A.C."
                  maxLength={150}
                  error={errors.razon_social?.message}
                  {...register('razon_social', {
                    onChange: (e) => {
                      e.target.value = sanitizeSafeText(e.target.value);
                    }
                  })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="RUC (11 dígitos) *"
                    type="text"
                    maxLength={11}
                    placeholder="Ej. 20521664623"
                    error={errors.ruc?.message}
                    {...register('ruc', {
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 11);
                      }
                    })}
                  />

                  <Input
                    label="Persona de Contacto / Encargado *"
                    placeholder="Ej. Ing. Carlos Mendoza"
                    maxLength={80}
                    error={errors.contacto_nombre?.message}
                    {...register('contacto_nombre', {
                      onChange: (e) => {
                        e.target.value = sanitizeOnlyLettersAndSpaces(e.target.value);
                      }
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Teléfono o WhatsApp de Coordinación *"
                    type="tel"
                    maxLength={9}
                    placeholder="Ej. 987654321"
                    error={errors.telefono?.message}
                    {...register('telefono', {
                      onChange: (e) => {
                        e.target.value = sanitizeDigits(e.target.value, 9);
                      }
                    })}
                  />

                  <Input
                    label="Correo Electrónico para Factura Electrónica *"
                    type="email"
                    maxLength={100}
                    placeholder="facturacion@empresa.com"
                    error={errors.correo?.message}
                    {...register('correo', {
                      onChange: (e) => {
                        e.target.value = sanitizeEmailInput(e.target.value);
                      }
                    })}
                  />
                </div>
              </>
            )}
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
              label="Dirección de entrega en obra *"
              placeholder="Ej. Av. Néstor Gambetta 1420 Mz. B Lt. 12, Puente Piedra"
              maxLength={200}
              error={errors.direccion?.message}
              {...register('direccion', {
                onChange: (e) => {
                  e.target.value = sanitizeAddress(e.target.value);
                }
              })}
            />
          )}

          {deliveryType === 'recojo' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-kenpaku-navy space-y-1.5 text-xs animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-kenpaku-blue">
                <Store className="w-4 h-4 shrink-0" />
                <span>Punto de Retiro: Almacén Central Puente Piedra</span>
              </div>
              <p className="text-slate-600 pl-6 leading-relaxed">
                {STORE_INFO.address}
              </p>
              <p className="text-slate-500 pl-6 text-[11px]">
                Horario: {STORE_INFO.schedule}. En recojo en tienda no es necesario ingresar dirección de entrega.
              </p>
            </div>
          )}

          <Textarea
            label="Observaciones o referencias adicionales (Opcional)"
            placeholder="Instrucciones para el chofer, punto de referencia (ej. frente a la posta) o corte preliminar..."
            rows={3}
            maxLength={500}
            error={errors.observaciones?.message}
            {...register('observaciones', {
              onChange: (e) => {
                e.target.value = sanitizeSafeText(e.target.value);
              }
            })}
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

          {deliveryType === 'despacho' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-snug">
              ⚠️ Flete a coordinar con administración post-orden. Los montos son referenciales hasta la validación de un asesor.
            </div>
          )}

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
