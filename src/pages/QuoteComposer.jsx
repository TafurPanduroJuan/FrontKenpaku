import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText, LoaderCircle, ArrowRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { analyzeQuote, createQuote, getQuoteFieldRules } from '../api/quotes';
import { getProducts } from '../api/products';
import { useDebounce } from '../hooks/useDebounce';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SuggestionCard } from '../components/quotes/SuggestionCard';
import { Breadcrumb } from '../components/ui/Breadcrumb';

function normalizedHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function productAttribute(product, field) {
  if (product[field]) return String(product[field]);
  const name = product.nombre.toLowerCase();
  if (field === 'forma') return ['cuadrado', 'rectangular', 'redondo'].find((value) => name.includes(value)) || '';
  if (field === 'tipo') return ['corrugado', 'liso', 'lac', 'laf', 'ángulo', 'angulo', 'platina', 'canal'].find((value) => name.includes(value)) || '';
  if (field === 'acabado') return ['galvanizado', 'negro'].find((value) => name.includes(value)) || '';
  if (field === 'espesor') return name.match(/\d+(?:[.,]\d+)?\s*mm/)?.[0] || '';
  return '';
}

async function getAllProducts() {
  const firstPage = await getProducts({ page: 1, page_size: 100 });
  const pageSize = firstPage.page_size || 100;
  const pageCount = Math.ceil(firstPage.total / pageSize);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getProducts({ page: index + 2, page_size: pageSize })
    )
  );
  return {
    ...firstPage,
    items: [firstPage, ...remainingPages].flatMap((page) => page.items),
  };
}

async function spreadsheetItems(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => [normalizedHeader(key), value]);
    const product = entries.find(([key]) => ['producto', 'descripcion', 'nombre', 'item', 'material'].includes(key))?.[1];
    const quantity = entries.find(([key]) => ['cantidad', 'cant', 'qty', 'unidades'].includes(key))?.[1];
    if (!product) return null;
    return {
      texto_original: String(product).trim(),
      ...(quantity !== '' && quantity != null ? { cantidad: String(quantity).replace(',', '.') } : {}),
    };
  }).filter(Boolean);
}

export function QuoteComposer() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('texto');
  const [builderLines, setBuilderLines] = useState([{
    categoria: '', forma: '', tipo: '', medida: '', acabado: '', espesor: '', productId: '', cantidad: '1',
  }]);
  const debouncedText = useDebounce(text, 450);
  const productsQuery = useQuery({
    queryKey: ['quote-builder-products'],
    queryFn: getAllProducts,
    enabled: mode === 'lista',
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
  const fieldRulesQuery = useQuery({
    queryKey: ['quote-field-rules'],
    queryFn: getQuoteFieldRules,
    enabled: mode === 'lista',
    staleTime: 60 * 60 * 1000,
  });
  const catalogProducts = productsQuery.data?.items || [];
  const fieldRules = fieldRulesQuery.data || {};
  const builderLinesWithMatches = useMemo(() => builderLines.map((line) => {
    let matches = catalogProducts.filter((product) => !line.categoria || product.categoria === line.categoria);
    for (const field of ['forma', 'tipo', 'medida', 'acabado', 'espesor']) {
      if (line[field]) matches = matches.filter((product) => productAttribute(product, field) === line[field]);
    }
    if (line.productId) matches = matches.filter((product) => product.id === line.productId);
    const required = fieldRules[line.categoria]?.required || [];
    const complete = Boolean(line.categoria) && fieldRulesQuery.isSuccess &&
      required.every((field) => Boolean(line[field])) &&
      (line.categoria !== 'accesorios' || Boolean(line.productId));
    return { ...line, matches, complete };
  }), [builderLines, catalogProducts, fieldRules, fieldRulesQuery.isSuccess]);
  const builderItems = builderLinesWithMatches
    .filter((line) => line.complete && line.matches.length && line.cantidad && Number(line.cantidad) > 0)
    .map((line) => ({
      texto_original: `${line.cantidad} ${line.matches[0].nombre}`,
      cantidad: String(line.cantidad),
      ...(line.categoria === 'accesorios' ? { product_id: line.productId } : {}),
    }));
  const analysisQuery = useQuery({
    queryKey: ['quote-analysis', debouncedText],
    queryFn: () => analyzeQuote({ texto: debouncedText }),
    enabled: mode === 'texto' && Boolean(debouncedText.trim()) && !file,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
  const analysisItems = analysisQuery.data?.items || [];
  const missingItems = analysisItems.filter((item) => item.estado_linea === 'faltan_datos');
  const allComplete = analysisItems.length > 0 && missingItems.length === 0;
  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'lista') {
        if (!builderItems.length) throw new Error('Selecciona al menos un producto disponible del catálogo.');
        return createQuote({ items: builderItems });
      }
      if (file) {
        const items = await spreadsheetItems(file);
        if (!items.length) throw new Error('No encontré columnas de producto y cantidad en el archivo.');
        if (items.length > 50) throw new Error('Una proforma admite como máximo 50 ítems.');
        return createQuote({ items });
      }
      return createQuote({ texto: text });
    },
    onSuccess: (quote) => navigate(`/proforma/${encodeURIComponent(quote.codigo)}`),
  });
  const error = mutation.error?.response?.data?.detail || mutation.error?.message;

  const handleSubmit = (event) => {
    event.preventDefault();
    if ((mode === 'texto' && !text.trim() && !file) || (mode === 'lista' && !builderItems.length) || mutation.isPending) return;
    mutation.mutate();
  };

  const updateBuilderLine = (index, field, value) => {
    setBuilderLines((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;
      const next = { ...line, [field]: value };
      if (field === 'productId') next.productId = value;
      else if (field !== 'cantidad') next.productId = '';
      if (field === 'categoria') {
        return { ...next, forma: '', tipo: '', medida: '', acabado: '', espesor: '' };
      }
      if (field === 'forma' || field === 'tipo') {
        return { ...next, medida: '', acabado: '', espesor: '' };
      }
      if (field === 'medida') return { ...next, acabado: '', espesor: '' };
      if (field === 'acabado') return { ...next, espesor: '' };
      return next;
    }));
  };

  const optionsFor = (products, field) => [...new Set(products.map((product) => productAttribute(product, field)).filter(Boolean))]
    .map((value) => ({ value: String(value), label: String(value) }));
  const categoryLabel = (category) => ({
    tubos: 'Tubos',
    perfiles: 'Perfiles',
    planchas: 'Planchas',
    fierros: 'Fierros',
    accesorios: 'Accesorios',
  }[category] || category);

  return (
    <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Inicio', url: '/' }, { label: 'Cotizador de Materiales' }]} />

      <header className="border-b border-steel-200 pb-4">
        <p className="text-micro font-bold uppercase tracking-eyebrow text-brand-600">Comercial Kenpaku S.A.C.</p>
        <h1 className="font-display mt-1 text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Cotizador de materiales
        </h1>
        <p className="mt-1 text-xs text-steel-500 font-medium max-w-2xl">
          Escribe o pega tu lista de obra. Revisaremos las especificaciones antes de generar la proforma oficial.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-panel border border-steel-200 bg-white p-6 shadow-card sm:p-8">
        {/* Selector de modo estilo Figma tabs */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Modo de cotización">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'texto'}
            onClick={() => setMode('texto')}
            className={`rounded-btn px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'texto'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'border border-steel-200 bg-white text-steel-600 hover:bg-steel-50'
            }`}
          >
            Escribir mi lista
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'lista'}
            onClick={() => { setFile(null); setMode('lista'); }}
            className={`rounded-btn px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              mode === 'lista'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'border border-steel-200 bg-white text-steel-600 hover:bg-steel-50'
            }`}
          >
            Armar mi lista del catálogo
          </button>
        </div>

        {mode === 'texto' ? (
          <>
            <section className="rounded-card border border-brand-500/20 bg-brand-50/50 p-4">
              <h2 className="font-display text-xs font-extrabold text-navy-900 uppercase tracking-wide">
                ¿Qué indicar por producto?
              </h2>
              <p className="mt-1 text-xs text-steel-600">
                Para tubos: forma, medida, acabado (negro o galvanizado) y espesor. Haz clic en un ejemplo para probar:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  '10 tubos cuadrados 40x40 de 1.5mm negro',
                  '5 planchas LAC 1.20x2.40m de 2mm',
                  '8 fierros corrugados de 1/2 pulgada',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => { setText((current) => `${current}${current.trim() ? '\n' : ''}${example}`); setFile(null); }}
                    className="rounded-btn border border-brand-500/30 bg-white px-3 py-1.5 text-left text-xs font-semibold text-brand-700 hover:bg-brand-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </section>

            <div>
              <label htmlFor="quote-list" className="block text-xs font-bold text-steel-600 uppercase tracking-wide mb-1.5">
                Lista de materiales
              </label>
              <textarea
                id="quote-list"
                value={text}
                onChange={(event) => { setText(event.target.value); setFile(null); }}
                rows={9}
                maxLength={5000}
                placeholder={'10 tubos cuadrados 2x2 de 1.5mm\n5 ángulos de 1 1/2\n3 planchas LAC 1/8'}
                className="w-full rounded-btn border border-steel-200 bg-white p-4 text-xs font-mono leading-relaxed text-navy-900 shadow-inset focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 transition-all"
              />
              <div className="flex items-center justify-between text-micro text-steel-500 mt-1">
                <span>Máximo 50 ítems admitidos por proforma</span>
                <span className="num">{text.length}/5000</span>
              </div>
            </div>

            {text.trim() && (
              <section aria-live="polite" className="space-y-3 rounded-card border border-steel-200 p-4 bg-steel-50/50">
                <h2 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wide">
                  Revisión en tiempo real de la lista
                </h2>
                {analysisQuery.isFetching && <p className="text-micro text-steel-500">Revisando especificaciones con el catálogo...</p>}
                {analysisQuery.isError && (
                  <p role="alert" className="text-xs text-red-700">
                    No se pudo analizar la lista. Puedes volver a intentarlo o continuar con los datos ingresados.
                  </p>
                )}
                <div className="divide-y divide-steel-200/80">
                  {analysisItems.map((item, index) => (
                    <div key={`${item.texto_original}-${index}`} className="space-y-1.5 py-2.5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-semibold text-navy-900">{item.texto_original}</p>
                        {item.faltantes?.length ? (
                          <span className="inline-flex items-center gap-1 text-micro font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <CircleAlert className="h-3.5 w-3.5 text-amber-600" /> Falta: {item.faltantes.join(', ')}
                          </span>
                        ) : ['no_se_vende', 'sin_stock'].includes(item.estado_linea) ? (
                          <span className="inline-flex items-center gap-1 text-micro font-bold text-steel-500 bg-steel-100 px-2 py-0.5 rounded border border-steel-200">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {item.estado_linea === 'sin_stock' || item.sugerencia || item.sugerencias?.length ? 'Sin stock' : 'No disponible'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-micro font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Especificación completa
                          </span>
                        )}
                      </div>
                      {(item.sugerencias?.length || item.sugerencia) && (
                        <SuggestionCard products={item.sugerencias?.length ? item.sugerencias : [item.sugerencia]} />
                      )}
                    </div>
                  ))}
                </div>
                {missingItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-steel-200 pt-3">
                    <span className="text-micro font-bold text-steel-500 uppercase tracking-wide">Completa con un clic:</span>
                    {['cuadrado', 'redondo', 'negro', 'galvanizado', '1.5 mm', '2 mm'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setText((current) => `${current.trim()} ${value}`)}
                        className="rounded-full border border-steel-300 bg-white px-2.5 py-1 text-micro font-semibold text-navy-900 hover:border-brand-500 hover:text-brand-600 transition-colors cursor-pointer"
                      >
                        +{value}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <section className="space-y-4">
            <p className="text-xs text-steel-500 font-medium">
              Elige especificaciones disponibles en el catálogo; las opciones se actualizan en cascada según stock real.
            </p>
            {productsQuery.isLoading && <p className="text-xs text-steel-500">Cargando productos del catálogo...</p>}
            {productsQuery.isError && <p role="alert" className="text-xs text-red-700">No se pudo cargar el catálogo. Vuelve a intentar o escribe tu lista.</p>}
            {fieldRulesQuery.isError && <p role="alert" className="text-xs text-red-700">No se pudieron cargar las reglas por categoría. Intenta de nuevo antes de cotizar.</p>}
            
            {builderLinesWithMatches.map((line, index) => {
              const categoryProducts = catalogProducts.filter((product) => !line.categoria || product.categoria === line.categoria);
              const filteredProducts = line.matches;
              const uniqueValues = (source, field) => optionsFor(source, field);
              return (
                <div key={index} className="space-y-3 rounded-card border border-steel-200 bg-steel-50/40 p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-steel-200 pb-2">
                    <h2 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wide">
                      Producto {index + 1}
                    </h2>
                    {builderLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBuilderLines((current) => current.filter((_, i) => i !== index))}
                        className="text-micro font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Select id={`quote-category-${index}`} label="Producto" placeholder="Selecciona categoría" options={[...new Set(catalogProducts.map((product) => product.categoria))].map((value) => ({ value, label: categoryLabel(value) }))} value={line.categoria} onChange={(event) => updateBuilderLine(index, 'categoria', event.target.value)} />
                    {line.categoria && line.categoria !== 'accesorios' && uniqueValues(categoryProducts, 'tipo').length > 0 && <Select id={`quote-type-${index}`} label="Tipo" placeholder="Cualquier tipo" options={uniqueValues(categoryProducts, 'tipo')} value={line.tipo} onChange={(event) => updateBuilderLine(index, 'tipo', event.target.value)} />}
                    {line.categoria === 'tubos' && <Select id={`quote-shape-${index}`} label="Forma" placeholder="Selecciona forma" options={uniqueValues(categoryProducts, 'forma')} value={line.forma} onChange={(event) => updateBuilderLine(index, 'forma', event.target.value)} />}
                    {line.categoria && line.categoria !== 'accesorios' && <Select id={`quote-measure-${index}`} label="Medida" placeholder="Selecciona medida" options={uniqueValues(filteredProducts, 'medida')} value={line.medida} onChange={(event) => updateBuilderLine(index, 'medida', event.target.value)} />}
                    {line.categoria && line.categoria !== 'fierros' && line.categoria !== 'accesorios' && <Select id={`quote-finish-${index}`} label="Acabado" placeholder="Cualquier acabado" options={uniqueValues(filteredProducts, 'acabado')} value={line.acabado} onChange={(event) => updateBuilderLine(index, 'acabado', event.target.value)} />}
                    {line.categoria && !['fierros', 'accesorios'].includes(line.categoria) && <Select id={`quote-thickness-${index}`} label="Espesor" placeholder="Selecciona espesor" options={uniqueValues(filteredProducts, 'espesor')} value={line.espesor} onChange={(event) => updateBuilderLine(index, 'espesor', event.target.value)} />}
                    {line.categoria === 'accesorios' && <Select id={`quote-accessory-${index}`} label="Artículo" placeholder="Selecciona artículo" options={categoryProducts.map((product) => ({ value: product.id, label: product.nombre }))} value={line.productId} onChange={(event) => updateBuilderLine(index, 'productId', event.target.value)} />}
                    <Input label="Cantidad" type="number" min="0.001" step="0.001" value={line.cantidad} onChange={(event) => updateBuilderLine(index, 'cantidad', event.target.value)} />
                  </div>
                  {filteredProducts.length > 0 && line.categoria && (
                    <p className="text-micro font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-btn border border-emerald-200">
                      ✓ Coincidencia: {filteredProducts[0].nombre} · {filteredProducts[0].stock_disponible > 0 ? `${filteredProducts[0].stock_disponible} disponibles` : 'Sin stock'} · S/ {filteredProducts[0].precio_unitario}
                    </p>
                  )}
                  {line.categoria && !filteredProducts.length && (
                    <p className="text-micro font-semibold text-amber-700 bg-amber-50 p-2 rounded-btn border border-amber-200">
                      No hay coincidencia exacta con esos filtros en inventario.
                    </p>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setBuilderLines((current) => [...current, { categoria: '', forma: '', tipo: '', medida: '', acabado: '', espesor: '', productId: '', cantidad: '1' }])}
              className="rounded-btn border border-steel-300 bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:border-navy-900 hover:bg-steel-50 transition-colors cursor-pointer"
            >
              + Agregar otro producto
            </button>
          </section>
        )}

        <div className="flex flex-col gap-3 border-t border-steel-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {mode === 'texto' && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-btn border border-steel-300 bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:border-navy-900 hover:bg-steel-50 shadow-xs transition-colors">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{file ? file.name : 'Importar archivo XLSX o CSV'}</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  if (event.target.files?.[0]) setText('');
                }}
              />
            </label>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || (mode === 'texto' && !text.trim() && !file) || (mode === 'lista' && !builderItems.length)}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-btn bg-accent-600 px-6 py-2.5 text-xs font-semibold text-white shadow-cta hover:bg-accent-700 hover:shadow-cta-hover transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-98"
          >
            {mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            <span>{mode === 'texto' && (missingItems.length > 0 || (analysisQuery.isError && !allComplete)) ? 'Cotizar igual' : 'Generar proforma'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <p role="alert" className="rounded-btn border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {Array.isArray(error) ? error.map((item) => item.msg).join('. ') : error}
          </p>
        )}
      </form>
    </div>
  );
}
