import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { getProductById } from '../../api/products';
import { createAdminProduct, updateAdminProduct } from '../../api/admin';
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

const productSchema = z.object({
  nombre: z
    .string()
    .min(5, 'El nombre debe tener al menos 5 caracteres')
    .max(120, 'El nombre no puede exceder los 120 caracteres'),
  categoria: z.string().min(1, 'Seleccione la categoría'),
  acabado: z.string().min(1, 'Seleccione el acabado'),
  medida: z
    .string()
    .min(2, 'Ingrese la medida principal')
    .max(50, 'La medida no puede exceder los 50 caracteres'),
  espesor: z
    .string()
    .min(1, 'Ingrese el espesor')
    .max(30, 'El espesor no puede exceder los 30 caracteres'),
  precio_unitario: z.coerce
    .number({ invalid_type_error: 'El precio debe ser un número válido' })
    .positive('El precio debe ser un número positivo mayor a 0')
    .max(100000, 'El precio no puede exceder S/ 100,000'),
  stock_disponible: z.coerce
    .number({ invalid_type_error: 'El stock debe ser un número entero' })
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(1000000, 'El stock no puede exceder 1,000,000 unidades'),
  imagen_url: z.string().optional(),
  descripcion_corta: z
    .string()
    .min(10, 'Ingrese una descripción corta de al menos 10 caracteres')
    .max(300, 'La descripción no puede exceder los 300 caracteres'),
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
  const queryClient = useQueryClient();
  const isEditing = !!id && id !== 'nuevo';

  // Fetch product data if editing
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: () => getProductById(id),
    enabled: isEditing
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: '',
      categoria: 'tubos',
      acabado: 'negro',
      medida: '',
      espesor: '',
      precio_unitario: 100,
      stock_disponible: 10,
      imagen_url: '',
      descripcion_corta: '',
      ficha_tecnica: ''
    }
  });

  useEffect(() => {
    if (existingProduct) {
      reset({
        nombre: existingProduct.nombre,
        categoria: existingProduct.categoria,
        acabado: existingProduct.acabado || 'ninguno',
        medida: existingProduct.medida || '',
        espesor: existingProduct.espesor || '',
        precio_unitario: existingProduct.precio_unitario,
        stock_disponible: existingProduct.stock_disponible,
        imagen_url: existingProduct.imagen_url || '',
        descripcion_corta: existingProduct.descripcion_corta || '',
        ficha_tecnica: fichaToText(existingProduct.ficha_tecnica)
      });
    }
  }, [existingProduct, reset]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateAdminProduct(id, data) : createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/admin/productos');
    }
  });

  const onSubmit = (formData) => {
    saveMutation.mutate({
      ...formData,
      imagen_url: formData.imagen_url?.trim() || null,
      ficha_tecnica: formData.ficha_tecnica?.trim() || null
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
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
            {...register('categoria')}
          />

          <Select
            label="Tipo de Acabado *"
            options={[
              { value: 'negro', label: 'Acero Negro' },
              { value: 'galvanizado', label: 'Galvanizado' },
              { value: 'ninguno', label: 'Sin acabado' }
            ]}
            error={errors.acabado?.message}
            {...register('acabado')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Medida *"
            placeholder="Ej. 2 pulgadas (50.8 mm)"
            maxLength={50}
            error={errors.medida?.message}
            {...register('medida', {
              onChange: (e) => {
                e.target.value = sanitizeProductName(e.target.value);
              }
            })}
          />

          <Input
            label="Espesor *"
            placeholder="Ej. 2.0 mm"
            maxLength={30}
            error={errors.espesor?.message}
            {...register('espesor', {
              onChange: (e) => {
                e.target.value = sanitizeProductName(e.target.value);
              }
            })}
          />
        </div>

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
          label="URL de Imagen del Producto"
          placeholder="https://ejemplo.com/imagen.jpg o dejar en blanco para SVG autogenerado"
          error={errors.imagen_url?.message}
          {...register('imagen_url')}
        />

        <Textarea
          label="Descripción Corta *"
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
          <p className="text-xs font-semibold text-red-600">
            No se pudo guardar el producto. Revisa los datos e inténtalo nuevamente.
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
