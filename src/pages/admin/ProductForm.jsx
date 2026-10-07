import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { getProductById } from '../../api/products';
import { createAdminProduct, updateAdminProduct } from '../../api/admin';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

const productSchema = z.object({
  nombre: z.string().min(5, 'El nombre debe tener al menos 5 caracteres'),
  categoria: z.string().min(1, 'Seleccione la categoría'),
  acabado: z.string().min(1, 'Seleccione el acabado'),
  medida: z.string().min(2, 'Ingrese la medida principal'),
  espesor: z.string().min(1, 'Ingrese el espesor'),
  precio_unitario: z.coerce.number().min(0.1, 'Ingrese un precio unitario válido'),
  stock_disponible: z.coerce.number().min(0, 'El stock no puede ser negativo'),
  imagen_url: z.string().optional(),
  descripcion_corta: z.string().min(10, 'Ingrese una descripción corta de al menos 10 caracteres'),
  ficha_tecnica: z.array(
    z.object({
      clave: z.string().min(1, 'Clave requerida'),
      valor: z.string().min(1, 'Valor requerido')
    })
  ).optional()
});

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
    control,
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
      ficha_tecnica: [{ clave: 'Longitud estándar', valor: '6.00 metros' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ficha_tecnica'
  });

  useEffect(() => {
    if (existingProduct) {
      reset({
        nombre: existingProduct.nombre,
        categoria: existingProduct.categoria,
        acabado: existingProduct.acabado,
        medida: existingProduct.medida,
        espesor: existingProduct.espesor,
        precio_unitario: existingProduct.precio_unitario,
        stock_disponible: existingProduct.stock_disponible,
        imagen_url: existingProduct.imagen_url,
        descripcion_corta: existingProduct.descripcion_corta,
        ficha_tecnica: existingProduct.ficha_tecnica || []
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
    saveMutation.mutate(formData);
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
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Categoría *"
            options={[
              { value: 'tubos', label: 'Tubos' },
              { value: 'planchas', label: 'Planchas' },
              { value: 'perfiles', label: 'Perfiles' },
              { value: 'fierros', label: 'Fierros' }
            ]}
            error={errors.categoria?.message}
            {...register('categoria')}
          />

          <Select
            label="Tipo de Acabado *"
            options={[
              { value: 'negro', label: 'Acero Negro' },
              { value: 'galvanizado', label: 'Galvanizado' },
              { value: 'laf', label: 'LAF (Frío)' },
              { value: 'lac', label: 'LAC (Caliente)' },
              { value: 'corrugado', label: 'Corrugado' }
            ]}
            error={errors.acabado?.message}
            {...register('acabado')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Medida *"
            placeholder="Ej. 2 pulgadas (50.8 mm)"
            error={errors.medida?.message}
            {...register('medida')}
          />

          <Input
            label="Espesor *"
            placeholder="Ej. 2.0 mm"
            error={errors.espesor?.message}
            {...register('espesor')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Precio Unitario (S/ IGV incl.) *"
            type="number"
            step="0.10"
            placeholder="128.90"
            error={errors.precio_unitario?.message}
            {...register('precio_unitario')}
          />

          <Input
            label="Stock Disponible en Almacén *"
            type="number"
            placeholder="45"
            error={errors.stock_disponible?.message}
            {...register('stock_disponible')}
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
          error={errors.descripcion_corta?.message}
          {...register('descripcion_corta')}
        />

        {/* Ficha Técnica Arrays */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Especificaciones de Ficha Técnica
            </h3>
            <button
              type="button"
              onClick={() => append({ clave: '', valor: '' })}
              className="text-xs font-bold text-kenpaku-blue hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar especificación
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Característica (ej. Norma)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  {...register(`ficha_tecnica.${index}.clave`)}
                />
                <input
                  type="text"
                  placeholder="Valor (ej. ASTM A500)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  {...register(`ficha_tecnica.${index}.valor`)}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

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
