import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, CheckCircle2, ShieldCheck, AlertCircle, Send, ArrowLeft, Printer } from 'lucide-react';
import { createClaim } from '../api/claims';
import { STORE_INFO } from '../utils/constants';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';

const claimSchema = z.object({
  nombre: z.string().min(3, 'Ingrese su nombre completo (mínimo 3 caracteres)'),
  tipo_documento: z.string().min(1, 'Seleccione el tipo de documento'),
  documento: z.string().min(8, 'Ingrese un número de documento válido (mínimo 8 dígitos)'),
  telefono: z.string().min(9, 'Ingrese un teléfono de contacto válido (mínimo 9 dígitos)'),
  correo: z.string().email('Ingrese un correo electrónico válido'),
  direccion: z.string().min(5, 'Ingrese su domicilio completo'),
  tipo_bien: z.enum(['producto', 'servicio']),
  monto_reclamado: z.string().optional(),
  descripcion_bien: z.string().min(5, 'Describa el producto o servicio contratado'),
  tipo: z.enum(['reclamo', 'queja']),
  detalle: z.string().min(15, 'Explique detalladamente el motivo de su reclamo o queja (mínimo 15 caracteres)'),
  pedido_consumidor: z.string().min(10, 'Especifique su pedido concreto de solución'),
  acepto_terminos: z.boolean().refine((val) => val === true, {
    message: 'Debe declarar la conformidad y aceptación de tratamiento de datos personales'
  })
});

export function Claims() {
  const [claimResult, setClaimResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const currentDate = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      nombre: '',
      tipo_documento: 'DNI',
      documento: '',
      telefono: '',
      correo: '',
      direccion: '',
      tipo_bien: 'producto',
      monto_reclamado: '',
      descripcion_bien: '',
      tipo: 'reclamo',
      detalle: '',
      pedido_consumidor: '',
      acepto_terminos: false
    }
  });

  const aceptoTerminos = watch('acepto_terminos');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...data,
      monto_reclamado: data.monto_reclamado ? parseFloat(data.monto_reclamado) : null
    };

    try {
      const res = await createClaim(payload);
      setClaimResult({
        codigo: res.codigo_seguimiento,
        fecha: new Date(res.fecha).toLocaleString('es-PE'),
        data
      });
    } catch (err) {
      console.error('Error al enviar reclamación:', err);
      setSubmitError('Ocurrió un inconveniente al registrar su reclamación. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (claimResult) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 animate-fade-in">
        <Breadcrumb items={[{ label: 'Libro de Reclamaciones', url: '/libro-de-reclamaciones' }, { label: 'Constancia' }]} />

        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-soft space-y-6">
          <div className="text-center space-y-3 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-kenpaku-navy">Constancia de Registro de Reclamación</h1>
            <p className="text-xs text-slate-500">
              Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571)
            </p>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Código de Seguimiento</span>
              <span className="text-lg font-extrabold text-kenpaku-orange">{claimResult.codigo}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Fecha y Hora de Recepción</span>
              <span className="text-sm font-bold text-slate-800">{claimResult.fecha}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Razón Social del Proveedor</span>
              <span className="font-semibold text-slate-800">{STORE_INFO.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">RUC del Proveedor</span>
              <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 inline-block">
                {STORE_INFO.ruc}
              </span>
            </div>
          </div>

          {/* Details Summary */}
          <div className="space-y-3 text-xs text-slate-700">
            <h3 className="font-bold text-kenpaku-navy border-b border-slate-100 pb-2">Resumen de la Reclamación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p><strong>Consumidor:</strong> {claimResult.data.nombre}</p>
              <p><strong>Documento:</strong> {claimResult.data.tipo_documento} {claimResult.data.documento}</p>
              <p><strong>Teléfono:</strong> {claimResult.data.telefono}</p>
              <p><strong>Correo:</strong> {claimResult.data.correo}</p>
              <p><strong>Tipo de Hoja:</strong> <span className="uppercase font-bold text-kenpaku-blue">{claimResult.data.tipo}</span></p>
              <p><strong>Bien afectado:</strong> {claimResult.data.tipo_bien} - {claimResult.data.descripcion_bien}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 mt-2">
              <p className="font-bold text-slate-900">Detalle:</p>
              <p className="text-slate-600 leading-relaxed">{claimResult.data.detalle}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="font-bold text-slate-900">Pedido del Consumidor:</p>
              <p className="text-slate-600 leading-relaxed">{claimResult.data.pedido_consumidor}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-kenpaku-blue" />
              <span>Plazo de Respuesta Legal</span>
            </p>
            <p className="leading-relaxed">
              La empresa dará respuesta a su reclamación o queja en un plazo no mayor a quince (15) días hábiles improrrogables, enviando la comunicación oficial a su correo electrónico registrado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="navy" fullWidth icon={Printer} onClick={() => window.print()}>
              Imprimir constancia
            </Button>
            <Button variant="outline" fullWidth icon={ArrowLeft} onClick={() => setClaimResult(null)}>
              Volver al formulario
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <Breadcrumb items={[{ label: 'Libro de Reclamaciones Virtual' }]} />

      {/* Header Banner */}
      <div className="bg-kenpaku-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-kenpaku-navy flex items-center justify-center font-extrabold shadow-md">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Libro de Reclamaciones Virtual</h1>
              <p className="text-xs text-amber-300 font-medium">Conforme a la Ley N.º 29571 - Código de Protección y Defensa del Consumidor</p>
            </div>
          </div>

          <div className="text-right sm:text-right text-xs text-slate-300">
            <span className="block font-bold text-white">Fecha: {currentDate}</span>
            <span className="text-[11px] text-slate-400">Puente Piedra, Lima</span>
          </div>
        </div>

        {/* Real RUC Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Razón Social del Proveedor</span>
            <span className="font-extrabold text-white text-sm">{STORE_INFO.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">RUC del Proveedor (REAL)</span>
            <span className="font-extrabold text-amber-400 text-sm tracking-wider bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700 inline-block">
              RUC: {STORE_INFO.ruc}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Dirección del Almacén</span>
            <span>{STORE_INFO.address}</span>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-soft space-y-8">
        {/* SECCIÓN 1: DATOS DEL CONSUMIDOR */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-kenpaku-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-kenpaku-blue text-white text-xs font-bold flex items-center justify-center">1</span>
            Identificación del Consumidor Reclamante
          </h2>

          <Input
            label="Nombres y Apellidos completos *"
            placeholder="Ej. Carlos Mendoza Vargas"
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Tipo de Documento *"
              options={[
                { value: 'DNI', label: 'DNI' },
                { value: 'RUC', label: 'RUC' },
                { value: 'CE', label: 'Carné de Extranjería' },
                { value: 'Pasaporte', label: 'Pasaporte' }
              ]}
              error={errors.tipo_documento?.message}
              {...register('tipo_documento')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Número de Documento *"
                placeholder="Ej. 45891234"
                error={errors.documento?.message}
                {...register('documento')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono de Contacto *"
              placeholder="Ej. 912345678"
              error={errors.telefono?.message}
              {...register('telefono')}
            />

            <Input
              label="Correo Electrónico *"
              type="email"
              placeholder="carlos.mendoza@ejemplo.com"
              error={errors.correo?.message}
              {...register('correo')}
            />
          </div>

          <Input
            label="Domicilio (Dirección, Distrito, Provincia) *"
            placeholder="Ej. Jr. Los Olivos 345, Puente Piedra, Lima"
            error={errors.direccion?.message}
            {...register('direccion')}
          />
        </div>

        {/* SECCIÓN 2: IDENTIFICACIÓN DEL BIEN CONTRATADO */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-kenpaku-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-kenpaku-blue text-white text-xs font-bold flex items-center justify-center">2</span>
            Identificación del Bien Contratado
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Tipo de Bien *"
              options={[
                { value: 'producto', label: 'Producto (Tubo, Plancha, Perfil, Fierro)' },
                { value: 'servicio', label: 'Servicio de corte o atención' }
              ]}
              error={errors.tipo_bien?.message}
              {...register('tipo_bien')}
            />

            <Input
              label="Monto Reclamado en Soles (S/) (Opcional)"
              type="number"
              step="0.01"
              placeholder="Ej. 128.90"
              error={errors.monto_reclamado?.message}
              {...register('monto_reclamado')}
            />
          </div>

          <Input
            label="Descripción del Producto o Servicio *"
            placeholder="Ej. Tubo Negro Estructural de 2 pulgadas x 2.0mm x 6m"
            error={errors.descripcion_bien?.message}
            {...register('descripcion_bien')}
          />
        </div>

        {/* SECCIÓN 3: DETALLE DE LA SOLICITUD Y PEDIDO DEL CONSUMIDOR */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-kenpaku-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-kenpaku-blue text-white text-xs font-bold flex items-center justify-center">3</span>
            Detalle de la Solicitud y Pedido del Consumidor
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Tipo de Hoja de Reclamación *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="radio"
                  value="reclamo"
                  className="mt-1"
                  {...register('tipo')}
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">RECLAMO</span>
                  <span className="text-[11px] text-slate-500">Disconformidad relacionada directamente a los productos o servicios contratados.</span>
                </div>
              </label>

              <label className="p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="radio"
                  value="queja"
                  className="mt-1"
                  {...register('tipo')}
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">QUEJA</span>
                  <span className="text-[11px] text-slate-500">Disconformidad no relacionada directamente a los productos, sino a la atención al cliente.</span>
                </div>
              </label>
            </div>
          </div>

          <Textarea
            label="Detalle del Reclamo o Queja *"
            placeholder="Describa de forma clara y cronológica los hechos ocurridos..."
            rows={4}
            error={errors.detalle?.message}
            {...register('detalle')}
          />

          <Textarea
            label="Pedido Concreto del Consumidor *"
            placeholder="Indique la solución o cambio que solicita a Comercial Kenpaku S.A.C..."
            rows={3}
            error={errors.pedido_consumidor?.message}
            {...register('pedido_consumidor')}
          />
        </div>

        {/* Checkbox de Conformidad */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              className="w-4 h-4 mt-0.5 rounded text-kenpaku-blue border-slate-300 focus:ring-kenpaku-blue"
              {...register('acepto_terminos')}
            />
            <span>
              Declaro ser el titular del bien/servicio objeto de este reclamo y acepto el tratamiento de mis datos personales de acuerdo con la Ley N.º 29733 para la atención formal de la reclamación. *
            </span>
          </label>
          {errors.acepto_terminos && (
            <p className="text-xs text-red-600 font-medium">{errors.acepto_terminos.message}</p>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Nota de constancia legal:</p>
            <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!aceptoTerminos || isSubmitting}
            icon={Send}
          >
            Enviar reclamación
          </Button>
        </div>
      </form>
    </div>
  );
}
