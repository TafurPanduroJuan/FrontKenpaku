import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  getAdminMeasurementEquivalences,
  getAdminPricingSettings,
  updateAdminMeasurementEquivalences,
  updateAdminPricingSettings,
} from '../../api/admin';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const CATEGORIES = [
  { value: 'tubos', label: 'Tubos' },
  { value: 'planchas', label: 'Planchas' },
  { value: 'perfiles', label: 'Perfiles' },
  { value: 'fierros', label: 'Fierros' },
  { value: 'accesorios', label: 'Accesorios' },
];

export function PricingSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [equivalences, setEquivalences] = useState([]);
  const [equivalenceError, setEquivalenceError] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-pricing-settings'],
    queryFn: getAdminPricingSettings,
  });
  const equivalenceQuery = useQuery({
    queryKey: ['admin-measurement-equivalences'],
    queryFn: getAdminMeasurementEquivalences,
  });

  useEffect(() => {
    if (!data) return;
    const categoryMargins = Object.fromEntries(
      (data.margenes_por_categoria || []).map((item) => [item.categoria, String(item.margen_pct)])
    );
    setForm({
      margen_global_pct: String(data.margen_global_pct),
      costo_incluye_igv: data.costo_incluye_igv,
      redondeo: String(data.redondeo),
      categoryMargins,
      tipo_cambio_manual: '',
    });
  }, [data]);

  useEffect(() => {
    if (equivalenceQuery.data) setEquivalences(equivalenceQuery.data.items || []);
  }, [equivalenceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateAdminPricingSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-pricing-settings'], saved);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setForm((current) => ({ ...current, tipo_cambio_manual: '' }));
    },
  });
  const equivalenceMutation = useMutation({
    mutationFn: updateAdminMeasurementEquivalences,
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-measurement-equivalences'], saved);
      setEquivalenceError('');
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      setEquivalenceError(Array.isArray(detail)
        ? detail.map((item) => item.msg).join(' ')
        : detail || 'No se pudieron guardar las equivalencias. Revisa los valores.');
    },
  });

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setCategoryMargin = (category, value) => {
    setForm((current) => ({
      ...current,
      categoryMargins: { ...current.categoryMargins, [category]: value },
    }));
  };
  const updateEquivalence = (index, field, value) => {
    setEquivalences((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };
  const addEquivalence = () => {
    setEquivalences((current) => [
      ...current,
      {
        tipo_medida: 'dimension',
        pulgada: '',
        mm_minimo: '',
        mm_maximo: '',
        categoria: null,
        tolerancia_mm: '1.5',
      },
    ]);
  };
  const saveEquivalences = (event) => {
    event.preventDefault();
    equivalenceMutation.mutate({
      items: equivalences.map((item) => ({
        tipo_medida: item.tipo_medida,
        pulgada: item.pulgada.trim(),
        mm_minimo: Number(item.mm_minimo),
        mm_maximo: Number(item.mm_maximo),
        categoria: item.categoria || null,
        tolerancia_mm: Number(item.tolerancia_mm),
      })),
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate({
      margen_global_pct: Number(form.margen_global_pct),
      costo_incluye_igv: form.costo_incluye_igv,
      redondeo: Number(form.redondeo),
      margenes_por_categoria: CATEGORIES
        .filter(({ value }) => (form.categoryMargins[value] ?? '') !== '')
        .map(({ value }) => ({ categoria: value, margen_pct: Number(form.categoryMargins[value]) })),
      tipo_cambio_manual: form.tipo_cambio_manual ? Number(form.tipo_cambio_manual) : null,
    });
  };

  if (isLoading) {
    return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (isError || !form) {
    return <p role="alert" className="text-sm font-semibold text-red-600">No se pudo cargar la configuración de precios.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <header className="border-b border-slate-200 pb-4">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-kenpaku-navy">
          <SlidersHorizontal className="h-5 w-5 text-kenpaku-blue" />
          Precios y tipo de cambio
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Los cambios recalculan los productos con costo USD. Los precios manuales se conservan.
        </p>
      </header>

      {saveMutation.isError && <p role="alert" className="text-sm font-semibold text-red-600">No se pudo guardar. Revisa los valores e inténtalo otra vez.</p>}
      {saveMutation.isSuccess && <p role="status" className="text-sm font-semibold text-emerald-700">Configuración guardada y precios actualizados.</p>}
      {equivalenceQuery.isError && <p role="alert" className="text-sm font-semibold text-red-600">No se pudieron cargar las equivalencias de medidas.</p>}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Reglas globales</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>Margen global (%)</span>
              <input type="number" min="0" max="500" step="0.001" required value={form.margen_global_pct}
                onChange={(event) => setField('margen_global_pct', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-700">
              <span>Redondeo en céntimos</span>
              <input type="number" min="1" max="100" step="1" required value={form.redondeo}
                onChange={(event) => setField('redondeo', event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.costo_incluye_igv}
              onChange={(event) => setField('costo_incluye_igv', event.target.checked)} />
            El costo USD del proveedor ya incluye IGV
          </label>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Margen por categoría</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map(({ value, label }) => (
              <label key={value} className="space-y-1 text-xs font-semibold text-slate-700">
                <span>{label} (%)</span>
                <input type="number" min="0" max="500" step="0.001"
                  placeholder={`Global: ${form.margen_global_pct}`}
                  value={form.categoryMargins[value] ?? ''}
                  onChange={(event) => setCategoryMargin(value, event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Tipo de cambio USD/PEN</h3>
          <p className="text-xs text-slate-600">
            Actual: {data.tipo_cambio_actual ? `S/ ${data.tipo_cambio_actual} por USD` : 'Sin registrar'}
            {data.fecha_tipo_cambio ? ` · ${data.fecha_tipo_cambio}` : ''}
            {data.fuente_tipo_cambio ? ` · ${data.fuente_tipo_cambio}` : ''}
          </p>
          <label className="block max-w-sm space-y-1 text-xs font-semibold text-slate-700">
            <span>Tipo de cambio manual del día (opcional)</span>
            <input type="number" min="0.000001" step="0.000001" value={form.tipo_cambio_manual}
              onChange={(event) => setField('tipo_cambio_manual', event.target.value)}
              placeholder="Ej. 3.750000"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </section>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <Button type="submit" variant="primary" icon={Save} isLoading={saveMutation.isPending}>
            Guardar y recalcular
          </Button>
        </div>
      </form>

      <form onSubmit={saveEquivalences} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Equivalencias de medidas</h3>
            <p className="mt-1 max-w-3xl text-xs text-slate-600">
              Valores iniciales referenciales: confirma las medidas comerciales con el proveedor. Las reglas por categoría tienen prioridad; tolerancia por defecto ±1.5 mm.
            </p>
          </div>
          <Button type="button" variant="secondary" icon={Plus} onClick={addEquivalence}>Agregar equivalencia</Button>
        </div>
        {equivalenceMutation.isError && <p role="alert" className="text-sm font-semibold text-red-600">{equivalenceError}</p>}
        {equivalenceMutation.isSuccess && <p role="status" className="text-sm font-semibold text-emerald-700">Equivalencias guardadas.</p>}
        {equivalenceQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="space-y-3">
            {equivalences.map((item, index) => (
              <div key={item.id ?? `new-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-7">
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>Tipo</span>
                  <select aria-label={`Tipo de equivalencia ${index + 1}`} value={item.tipo_medida}
                    onChange={(event) => updateEquivalence(index, 'tipo_medida', event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
                    <option value="dimension">Dimensión</option>
                    <option value="espesor">Espesor</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>Pulgada</span>
                  <input aria-label={`Pulgada ${index + 1}`} required value={item.pulgada}
                    onChange={(event) => updateEquivalence(index, 'pulgada', event.target.value)}
                    placeholder="1 1/2" className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>mm mínimo</span>
                  <input aria-label={`mm mínimo ${index + 1}`} type="number" min="0.001" step="0.001" required value={item.mm_minimo}
                    onChange={(event) => updateEquivalence(index, 'mm_minimo', event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>mm máximo</span>
                  <input aria-label={`mm máximo ${index + 1}`} type="number" min="0.001" step="0.001" required value={item.mm_maximo}
                    onChange={(event) => updateEquivalence(index, 'mm_maximo', event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>Categoría (opcional)</span>
                  <select aria-label={`Categoría de equivalencia ${index + 1}`} value={item.categoria || ''}
                    onChange={(event) => updateEquivalence(index, 'categoria', event.target.value || null)}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
                    <option value="">Todas</option>
                    {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-700">
                  <span>Tolerancia (mm)</span>
                  <input aria-label={`Tolerancia ${index + 1}`} type="number" min="0" max="10" step="0.1" required value={item.tolerancia_mm}
                    onChange={(event) => updateEquivalence(index, 'tolerancia_mm', event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
                </label>
                <button type="button" aria-label={`Eliminar equivalencia ${index + 1}`}
                  onClick={() => setEquivalences((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="inline-flex items-center justify-center self-end rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" variant="primary" icon={Save} isLoading={equivalenceMutation.isPending} disabled={!equivalences.length}>
            Guardar equivalencias
          </Button>
        </div>
      </form>
    </div>
  );
}