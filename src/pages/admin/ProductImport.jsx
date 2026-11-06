import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Download, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  commitProductImport,
  getProductImportHistory,
  previewProductImport,
} from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';

const FIELDS = [
  ['sku', 'SKU / código proveedor'],
  ['nombre', 'Nombre / descripción'],
  ['precio_usd', 'Precio USD'],
  ['categoria', 'Categoría'],
  ['tipo', 'Tipo'],
  ['forma', 'Forma'],
  ['acabado', 'Acabado'],
  ['medida', 'Medida'],
  ['espesor', 'Espesor'],
  ['stock', 'Stock'],
  ['imagen_url', 'URL de imagen (opcional)'],
];
const CATEGORIES = ['tubos', 'planchas', 'perfiles', 'fierros', 'accesorios'];
const STEP_LABELS = ['Fuente', 'Columnas', 'Revisión', 'Confirmar'];

function downloadTemplate() {
  const content = '\uFEFFSKU,Nombre,Precio USD,Categoria,Tipo,Forma,Acabado,Medida,Espesor,Stock,URL imagen\nKPK-001,Tubo cuadrado negro 40x40x1.5mm,10.00,tubos,,cuadrado,negro,40x40,1.5 mm,0,https://placehold.co/400x400.png?text=Tubo\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla_importacion_kenpaku.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function fileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ProductImport() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [categoryOverrides, setCategoryOverrides] = useState({});
  const [excludedRows, setExcludedRows] = useState(() => new Set());
  const [updateMode, setUpdateMode] = useState('todo');
  const [newProductsActive, setNewProductsActive] = useState(false);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);

  const historyQuery = useQuery({
    queryKey: ['product-import-history'],
    queryFn: getProductImportHistory,
    refetchInterval: (query) => query.state.data?.items?.some((item) => ['queued', 'indexing'].includes(item.indexing_status)) ? 2000 : false,
  });

  const previewMutation = useMutation({
    mutationFn: previewProductImport,
    onSuccess: (data) => {
      setPreview(data);
      setMapping(data.mapping || data.suggested_mapping || {});
    },
  });

  const commitMutation = useMutation({
    mutationFn: commitProductImport,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['product-import-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const source = useMemo(() => ({ file, pastedText: file ? '' : pastedText }), [file, pastedText]);
  const rows = preview?.rows || [];
  const counts = useMemo(() => rows.reduce((total, row) => {
    total[row.status] = (total[row.status] || 0) + 1;
    return total;
  }, {}), [rows]);
  const pageSize = 25;
  const displayedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const requestPreview = (nextMapping = mapping, nextOverrides = categoryOverrides, nextMode = updateMode) =>
    previewMutation.mutateAsync({
      ...source,
      mapping: nextMapping && Object.keys(nextMapping).length ? nextMapping : null,
      categoryOverrides: nextOverrides,
      updateMode: nextMode,
    });

  const startMapping = async () => {
    if (!file && !pastedText.trim()) return;
    const data = await requestPreview(null, {}, updateMode);
    setMapping(data.suggested_mapping || {});
    setCategoryOverrides({});
    setExcludedRows(new Set());
    setStep(2);
  };

  const validateMapping = async () => {
    await requestPreview(mapping, {}, updateMode);
    setCategoryOverrides({});
    setExcludedRows(new Set());
    setStep(3);
    setPage(0);
  };

  const updateCategory = async (rowNumber, category) => {
    const next = { ...categoryOverrides, [rowNumber]: category };
    setCategoryOverrides(next);
    await requestPreview(mapping, next, updateMode);
  };

  const changeUpdateMode = async (mode) => {
    setUpdateMode(mode);
    await requestPreview(mapping, categoryOverrides, mode);
  };

  const toggleExcluded = (rowNumber) => {
    setExcludedRows((current) => {
      const next = new Set(current);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const confirmImport = () => {
    commitMutation.mutate({
      ...source,
      mapping,
      categoryOverrides,
      excludedRows: Array.from(excludedRows),
      updateMode,
      newProductsActive,
    });
  };

  const errorMessage = previewMutation.error?.response?.data?.detail || previewMutation.error?.message;
  const commitError = commitMutation.error?.response?.data?.detail || commitMutation.error?.message;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin/productos" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a productos
          </Link>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-kenpaku-navy">
            <FileSpreadsheet className="h-5 w-5 text-kenpaku-blue" /> Importar lista del proveedor
          </h2>
        </div>
        <button type="button" onClick={downloadTemplate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" /> Descargar plantilla
        </button>
      </header>

      <nav aria-label="Pasos de importación" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEP_LABELS.map((label, index) => {
          const number = index + 1;
          return (
            <div key={label} className={`flex items-center gap-2 border-b-2 px-2 py-2 text-xs font-bold ${step === number ? 'border-kenpaku-blue text-kenpaku-navy' : 'border-slate-200 text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === number ? 'bg-kenpaku-blue text-white' : 'bg-slate-100'}`}>{number}</span>
              {label}
            </div>
          );
        })}
      </nav>

      {errorMessage && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
      {commitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{commitError}</p>}

      {step === 1 && (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div>
            <h3 className="text-sm font-bold text-slate-900">1. Selecciona la lista</h3>
            <p className="mt-1 text-xs text-slate-500">Formatos admitidos: XLSX y CSV. También puedes pegar celdas copiadas de Excel.</p>
          </div>
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-kenpaku-blue">
            <Upload className="h-6 w-6 text-slate-500" />
            <span className="text-sm font-bold text-slate-800">{file ? file.name : 'Elegir archivo .xlsx o .csv'}</span>
            <span className="text-xs text-slate-500">{file ? fileSize(file.size) : 'Tamaño máximo: 5 MB; hasta 2.000 filas'}</span>
            <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setPastedText('');
            }} />
          </label>
          <div className="space-y-2">
            <label htmlFor="supplier-paste" className="text-xs font-bold text-slate-700">O pega la tabla copiada de Excel</label>
            <textarea id="supplier-paste" rows={5} value={pastedText} onChange={(event) => {
              setPastedText(event.target.value);
              setFile(null);
            }} placeholder="Pega aquí filas y columnas separadas por tabuladores" className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-kenpaku-blue focus:outline-none" />
          </div>
          <div className="flex justify-end">
            <button type="button" disabled={previewMutation.isPending || (!file && !pastedText.trim())} onClick={startMapping} className="inline-flex items-center gap-2 rounded-lg bg-kenpaku-blue px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
              {previewMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Analizar columnas <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {step === 2 && preview && (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div>
            <h3 className="text-sm font-bold text-slate-900">2. Mapea las columnas</h3>
            <p className="mt-1 text-xs text-slate-500">Solo se importan los campos asignados. Las demás columnas se ignoran.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map(([field, label]) => (
              <label key={field} className="space-y-1 text-xs font-semibold text-slate-700">
                <span>{label}{['nombre', 'precio_usd'].includes(field) ? ' *' : ''}</span>
                <select value={mapping[field] || ''} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm">
                  <option value="">No asignar</option>
                  {preview.headers.map((header) => <option key={header.key} value={header.key}>{header.label}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Atrás</button>
            <button type="button" disabled={previewMutation.isPending} onClick={validateMapping} className="inline-flex items-center gap-2 rounded-lg bg-kenpaku-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              Validar y previsualizar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && preview && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Revisa antes de guardar</h3>
              <p className="mt-1 text-xs text-slate-500">Tipo de cambio de la vista previa: {preview.tipo_cambio ? `S/ ${preview.tipo_cambio}` : 'sin registrar'}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{counts.NUEVO || 0} nuevos</span>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">{counts.ACTUALIZA || 0} actualiza</span>
              <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">{counts.ERROR || 0} error</span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{counts.REVISAR || 0} revisar</span>
            </div>
          </div>
          {previewMutation.isPending && <p role="status" className="text-xs text-kenpaku-blue">Actualizando vista previa...</p>}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="p-2.5">Incluir</th><th className="p-2.5">Fila</th><th className="p-2.5">Estado / revisión</th><th className="p-2.5">SKU / producto</th><th className="p-2.5">Categoría</th><th className="p-2.5">Costo USD</th><th className="p-2.5">Tipo cambio</th><th className="p-2.5">Final PEN</th><th className="p-2.5">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((row) => (
                  <tr key={row.row_number} className={excludedRows.has(row.row_number) ? 'bg-slate-50 opacity-50' : 'hover:bg-slate-50'}>
                    <td className="p-2.5"><input type="checkbox" checked={!excludedRows.has(row.row_number)} onChange={() => toggleExcluded(row.row_number)} aria-label={`Incluir fila ${row.row_number}`} /></td>
                    <td className="p-2.5 text-slate-500">{row.row_number}</td>
                    <td className="p-2.5">
                      <span className={`rounded px-1.5 py-1 text-[10px] font-bold ${row.status === 'NUEVO' ? 'bg-emerald-100 text-emerald-800' : row.status === 'ACTUALIZA' ? 'bg-blue-100 text-blue-800' : row.status === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{row.status}</span>
                      {row.inferidos?.length > 0 && <span className="ml-1 text-[10px] text-amber-700">Inferido: {row.inferidos.join(', ')}</span>}
                      {row.motivos?.length > 0 && <p className="mt-1 max-w-xs text-[10px] text-red-700">{row.motivos.join(' ')}</p>}
                    </td>
                    <td className="p-2.5"><span className="font-semibold">{row.sku || '—'}</span><p className="max-w-xs text-slate-600">{row.nombre}</p>{row.match_product_name && <p className="text-[10px] text-blue-700">Coincide: {row.match_product_name}</p>}</td>
                    <td className="p-2.5">
                      {row.status === 'REVISAR' ? (
                        <select value={categoryOverrides[row.row_number] || ''} onChange={(event) => updateCategory(row.row_number, event.target.value)} aria-label={`Asignar categoría fila ${row.row_number}`} className="rounded border border-amber-300 bg-white px-2 py-1">
                          <option value="">Asignar...</option>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      ) : row.categoria || '—'}
                    </td>
                    <td className="p-2.5">{row.precio_usd ? `$ ${row.precio_usd}` : '—'}</td>
                    <td className="p-2.5">{row.tipo_cambio || '—'}</td>
                    <td className="p-2.5 font-bold">{row.precio_final_pen ? `S/ ${row.precio_final_pen}` : '—'}</td>
                    <td className="p-2.5">{row.stock ?? 'No indicado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Filas {rows.length ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, rows.length)} de {rows.length}; {excludedRows.size} excluidas</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40">Anterior</button>
              <button type="button" disabled={(page + 1) * pageSize >= rows.length} onClick={() => setPage((value) => value + 1)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Atrás</button>
            <button type="button" onClick={() => setStep(4)} className="inline-flex items-center gap-2 rounded-lg bg-kenpaku-blue px-4 py-2 text-xs font-bold text-white">Continuar <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      )}

      {step === 4 && preview && (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
          <div>
            <h3 className="text-sm font-bold text-slate-900">4. Confirma la importación</h3>
            <p className="mt-1 text-xs text-slate-500">Los errores y filas sin categoría asignada se omiten; los demás cambios se guardan en una transacción.</p>
          </div>
          <label className="block max-w-lg space-y-1 text-xs font-semibold text-slate-700">
            <span>Productos existentes</span>
            <select value={updateMode} onChange={(event) => changeUpdateMode(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="todo">Actualizar todos los campos disponibles</option>
              <option value="precio_stock">Actualizar solo costo/precio y stock</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={newProductsActive} onChange={(event) => setNewProductsActive(event.target.checked)} />
            Crear productos nuevos activos (desmarcado: inactivos hasta revisión)
          </label>
          <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            <p><strong>{rows.filter((row) => ['NUEVO', 'ACTUALIZA'].includes(row.status) && !excludedRows.has(row.row_number)).length}</strong> filas válidas incluidas</p>
            <p><strong>{rows.filter((row) => ['ERROR', 'REVISAR'].includes(row.status) && !excludedRows.has(row.row_number)).length}</strong> filas con error o revisión pendiente</p>
            <p>La imagen no se importa; puedes asignarla luego desde la edición del producto.</p>
          </div>
          {result && (
            <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" /> Importación {result.import_id} guardada</p>
              <p className="mt-1 text-xs">{result.nuevos} nuevos · {result.actualizados} actualizados · {result.errores} omitidos por error</p>
              <p className="mt-1 text-xs">Indexación: {result.indexing_status === 'queued' ? 'En cola' : result.indexing_status}</p>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setStep(3)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Atrás</button>
            <button type="button" disabled={commitMutation.isPending || !!result} onClick={confirmImport} className="inline-flex items-center gap-2 rounded-lg bg-kenpaku-orange px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
              {commitMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Confirmar y guardar
            </button>
          </div>
        </section>
      )}

      <section className="space-y-3 border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-900">Historial de importaciones</h3>
        {historyQuery.isLoading ? <Skeleton className="h-10 w-full" /> : historyQuery.data?.items?.length ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="p-3">Fecha</th><th className="p-3">Usuario</th><th className="p-3">Nuevos</th><th className="p-3">Actualizados</th><th className="p-3">Errores</th><th className="p-3">Embeddings</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{historyQuery.data.items.map((item) => (
                <tr key={item.id}><td className="p-3">{new Date(item.created_at).toLocaleString('es-PE')}</td><td className="p-3">{item.usuario_email}</td><td className="p-3">{item.nuevos}</td><td className="p-3">{item.actualizados}</td><td className="p-3">{item.errores}</td><td className="p-3">{['queued', 'indexing'].includes(item.indexing_status) ? <span className="inline-flex items-center gap-1 text-blue-700"><LoaderCircle className="h-3 w-3 animate-spin" /> Indexando {item.indexing_completed}/{item.indexing_total}</span> : item.indexing_status === 'error' ? <span className="text-red-700">Error</span> : 'Completo'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-xs text-slate-500">Aún no hay importaciones registradas.</p>}
      </section>
    </div>
  );
}