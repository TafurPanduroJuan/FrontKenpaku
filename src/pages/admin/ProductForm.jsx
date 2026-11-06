import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { createAdminProduct, getAdminProductById, getProductFieldRules, updateAdminProduct, uploadAdminProductImage } from '../../api/admin';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import {
  sanitizeProductName,
  sanitizePositiveInteger,
  sanitizePositiveDecimal,
  sanitizeSafeText,
  sanitizeTechnicalSpecs,
  preventNonIntegerKeys,
  preventNegativeAndExpKeys
} from '../../utils/sanitizers';

const commonProductSchema = z.object({
  nombre: z
    .string()
    .min(5, 'El nombre debe tener al menos 5 caracteres')
    .max(120, 'El nombre no puede exceder los 120 caracteres'),
  categoria: z.string().min(1, 'Seleccione la categoría'),
  tipo: z.string().max(100).optional(),
  forma: z.string().max(50).optional(),
  acabado: z.string().optional(),
  medida: z.string().max(50).optional(),
  espesor: z.string().max(30).optional(),
  precio_unitario: z.coerce
    .number({ invalid_type_error: 'El precio debe ser un número válido' })
    .positive('El precio debe ser un número positivo mayor a 0')
    .max(100000, 'El precio no puede exceder S/ 100,000'),
  sku: z.string().max(100, 'El SKU no puede exceder 100 caracteres').optional(),
  precio_base_usd: z.preprocess(
    (value) => value === '' || value == null ? undefined : Number(value),
    z.number().min(0).optional()
  ),
  margen_pct: z.preprocess(
    (value) => value === '' || value == null ? undefined : Number(value),
    z.number().min(0).max(500).optional()
  ),
  stock_disponible: z.coerce
    .number({ invalid_type_error: 'El stock debe ser un número entero' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(1000000, 'El stock no puede exceder 1,000,000 unidades'),
  imagen_url: z.string().optional(),
  descripcion_corta: z
    .string()
    .max(300, 'La descripción no puede exceder los 300 caracteres')
    .optional(),
  ficha_tecnica: z
    .string()
    .max(3000, 'La ficha técnica no puede exceder 3000 caracteres')
    .optional()
});

// El backend guarda la ficha técnica como texto; si llega como lista (mocks) la convertimos
function fichaToText(ficha) {
  if (!ficha) return '';
  if (Array.isArray(ficha)) return ficha.map((f) => `${f.clave}: ${f.valor}`).join('\n');
  return String(ficha);
}

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== 'nuevo';
  const [imageFile, setImageFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: fieldRules = {} } = useQuery({
    queryKey: ['product-field-rules'],
    queryFn: getProductFieldRules,
  });
  const productSchema = useMemo(() => commonProductSchema.superRefine((values, context) => {
    const required = fieldRules[values.categoria]?.required || [];
    for (const field of required) {
      if (!String(values[field] || '').trim()) {
        const labels = {
          tipo: 'Ingrese el tipo',
          forma: 'Seleccione la forma',
          medida: 'Ingrese la medida',
          espesor: 'Ingrese el espesor',
          acabado: 'Seleccione el acabado',
        };
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: labels[field] || 'Campo obligatorio',
        });
      }
    }
  }), [fieldRules]);

  // Fetch product data if editing
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: () => getAdminProductById(id),
    enabled: isEditing
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: '',
      categoria: 'tubos',
      tipo: '',
      forma: '',
      acabado: 'negro',
      medida: '',
      espesor: '',
      precio_unitario: 100,
      sku: '',
      precio_base_usd: '',
      margen_pct: '',
      stock_disponible: 10,
      imagen_url: '',
      descripcion_corta: '',
      ficha_tecnica: ''
    }
  });
  const category = watch('categoria');
  const categoryRules = fieldRules[category] || { required: [], hidden_by_default: [] };
  const isRequired = (field) => categoryRules.required?.includes(field);
  const showField = (field) => (
    !categoryRules.hidden_by_default?.includes(field) ||
    (category === 'accesorios' && showAdvanced)
  );

  useEffect(() => {
    if (existingProduct) {
      reset({
        nombre: existingProduct.nombre,
        categoria: existingProduct.categoria,
        tipo: existingProduct.tipo || '',
        forma: existingProduct.forma || '',
        acabado: existingProduct.acabado || 'ninguno',
        medida: existingProduct.medida || '',
        espesor: existingProduct.espesor || '',
        precio_unitario: existingProduct.precio_unitario,
        sku: existingProduct.sku || '',
        precio_base_usd: existingProduct.precio_base_usd ?? '',
        margen_pct: existingProduct.margen_pct ?? '',
        stock_disponible: existingProduct.stock_disponible,
        imagen_url: existingProduct.imagen_url || '',
        descripcion_corta: existingProduct.descripcion_corta || '',
        ficha_tecnica: fichaToText(existingProduct.ficha_tecnica)
      });
    }
  }, [existingProduct, reset]);

  const saveMutation = useMutation({
    mutationFn: async ({ productData, selectedImage }) => {
      const saved = isEditing
        ? await updateAdminProduct(id, productData)
        : await createAdminProduct(productData);
      if (!selectedImage) return saved;
      try {
        const uploaded = await uploadAdminProductImage(saved.id, selectedImage);
        return { ...saved, ...uploaded };
      } catch {
        return { ...saved, imageUploadFailed: true };
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (saved.imageUploadFailed) {
        navigate(`/admin/productos/${saved.id}`, { state: { imageUploadFailed: true } });
      } else {
        navigate('/admin/productos');
      }
    }
  });

  const onSubmit = (formData) => {
    saveMutation.mutate({
      productData: {
        ...formData,
        tipo: formData.tipo?.trim() || null,
        forma: formData.forma?.trim() || null,
        acabado: formData.acabado || null,
        medida: formData.medida?.trim() || null,
        espesor: formData.espesor?.trim() || null,
        imagen_url: formData.imagen_url?.trim() || null,
        ficha_tecnica: formData.ficha_tecnica?.trim() || null,
        sku: formData.sku?.trim() || null,
        precio_base_usd: formData.precio_base_usd ?? null,
        margen_pct: formData.margen_pct ?? null
      },
      selectedImage: imageFile
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/productos')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-kenpaku-navy">
              {isEditing ? `Editar Producto` : `Crear Nuevo Producto`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ficha completa de especificaciones para el catálogo web</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
        {location.state?.imageUploadFailed && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            El producto se guardó, pero la imagen no se pudo subir. Configura el almacenamiento o selecciona otra imagen para reintentar.
          </p>
        )}
        <Input
          label="Nombre Comercial del Producto *"
          placeholder="Ej. Tubo Negro Estructural 2' x 2.0 mm x 6m"
          maxLength={120}
          error={errors.nombre?.message}
          {...register('nombre', {
            onChange: (e) => {
              e.target.value = sanitizeProductName(e.target.value);
            }
          })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoría *"
            options={[
              { value: 'tubos', label: 'Tubos' },
              { value: 'planchas', label: 'Planchas' },
              { value: 'perfiles', label: 'Perfiles' },
              { value: 'fierros', label: 'Fierros' },
              { value: 'accesorios', label: 'Accesorios' }
            ]}
            error={errors.categoria?.message}
            {...register('categoria', {
              onChange: (event) => {
                if (event.target.value === 'accesorios') {
                  for (const field of ['tipo', 'forma', 'acabado', 'medida', 'espesor']) {
                    setValue(field, '');
                  }
                }
              }
            })}
          />

          {showField('forma') && (
            <Select
            label={`Forma${isRequired('forma') ? ' *' : ''}`}
            options={[
              { value: '', label: 'Seleccione una forma' },
              { value: 'cuadrado', label: 'Cuadrado' },
              { value: 'rectangular', label: 'Rectangular' },
              { value: 'redondo', label: 'Redondo' }
            ]}
            error={errors.forma?.message}
            {...register('forma')}
          />
          )}
          {showField('tipo') && (
            <Input
              label={`Tipo${isRequired('tipo') ? ' *' : ''}`}
              placeholder="Ej. ángulo, LAC, corrugado"
              maxLength={100}
              error={errors.tipo?.message}
              {...register('tipo')}
            />
          )}
          {showField('acabado') && (
          <Select
            label={`Tipo de Acabado${isRequired('acabado') ? ' *' : ''}`}
            options={[
              { value: '', label: 'Seleccione acabado' },
              { value: 'negro', label: 'Acero Negro' },
              { value: 'galvanizado', label: 'Galvanizado' },
              { value: 'ninguno', label: 'Sin acabado' }
            ]}
            error={errors.acabado?.message}
            {...register('acabado')}
          />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="SKU del proveedor"
            placeholder="Código opcional"
            maxLength={100}
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Input
            label="Costo base del proveedor (USD)"
            type="number"
            min="0"
            step="0.0001"
            placeholder="Vacío para precio manual"
            onKeyDown={preventNegativeAndExpKeys}
            error={errors.precio_base_usd?.message}
            {...register('precio_base_usd')}
          />
          <Input
            label="Margen específico del producto (%)"
            type="number"
            min="0"
            max="500"
            step="0.001"
            placeholder="Vacío para usar margen de categoría/global"
            onKeyDown={preventNegativeAndExpKeys}
            error={errors.margen_pct?.message}
            {...register('margen_pct')}
          />
        </div>

        {category === 'accesorios' && (
          <button type="button" className="text-sm font-bold text-kenpaku-blue" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? 'Ocultar detalles opcionales' : 'Mostrar más detalles opcionales'}
          </button>
        )}

        {(showField('medida') || showField('espesor')) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showField('medida') && (
          <Input
            label={`Medida o diámetro${isRequired('medida') ? ' *' : ''}`}
            placeholder="Ej. 2 pulgadas (50.8 mm)"
            maxLength={50}
            error={errors.medida?.message}
            {...register('medida', {
              onChange: (e) => {
                e.target.value = sanitizeProductName(e.target.value);
              }
            })}
          />
          )}
          {showField('espesor') && (
          <Input
            label={`Espesor${isRequired('espesor') ? ' *' : ''}`}
            placeholder="Ej. 2.0 mm"
            maxLength={30}
            error={errors.espesor?.message}
            {...register('espesor', {
              onChange: (e) => {
                e.target.value = sanitizeProductName(e.target.value);
              }
            })}
          />
          )}
        </div>
        }

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Precio Unitario (S/ IGV incl.) *"
            type="number"
            min="0.01"
            step="0.10"
            placeholder="128.90"
            onKeyDown={preventNegativeAndExpKeys}
            error={errors.precio_unitario?.message}
            {...register('precio_unitario', {
              onChange: (e) => {
                e.target.value = sanitizePositiveDecimal(e.target.value);
              }
            })}
          />

          <Input
            label="Stock Disponible en Almacén *"
            type="number"
            min="0"
            step="1"
            placeholder="45"
            onKeyDown={preventNonIntegerKeys}
            error={errors.stock_disponible?.message}
            {...register('stock_disponible', {
              onChange: (e) => {
                e.target.value = sanitizePositiveInteger(e.target.value);
              }
            })}
          />
        </div>

        <Input
          label="URL manual de Imagen del Producto"
          placeholder="https://ejemplo.com/imagen.jpg o dejar en blanco para SVG autogenerado"
          error={errors.imagen_url?.message}
          {...register('imagen_url')}
        />

        <label className="block space-y-1 text-xs font-semibold text-slate-700">
          <span>O carga una imagen manual (JPG, PNG o WEBP; máximo 5 MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            className="block w-full rounded-md border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold"
          />
          {imageFile && <span className="block text-[10px] text-slate-500">Seleccionada: {imageFile.name}</span>}
        </label>

        <Textarea
          label="Descripción Corta (opcional)"
          placeholder="Resumen del uso y características principales del acero..."
          rows={3}
          maxLength={300}
          error={errors.descripcion_corta?.message}
          {...register('descripcion_corta', {
            onChange: (e) => {
              e.target.value = sanitizeSafeText(e.target.value);
            }
          })}
        />

        <Textarea
          label="Ficha Técnica (especificaciones, normas, usos y advertencias)"
          placeholder="Ej. Fabricado bajo norma ASTM A500. Usos recomendados: ..."
          rows={8}
          maxLength={3000}
          error={errors.ficha_tecnica?.message}
          {...register('ficha_tecnica', {
            onChange: (e) => {
              e.target.value = sanitizeTechnicalSpecs(e.target.value);
            }
          })}
        />

        {saveMutation.isError && (
          <p role="alert" className="text-xs font-semibold text-red-600">
            {saveMutation.error?.response?.data?.detail || 'No se pudo guardar el producto. Revisa los datos e inténtalo nuevamente.'}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/productos')}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} icon={Save}>
            Guardar Producto
          </Button>
        </div>
      </form>
    </div>
  );
}