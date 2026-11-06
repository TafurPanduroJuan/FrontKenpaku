import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileImage, FileText, LoaderCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { chooseQuoteItem, getQuote, recalculateQuote } from '../api/quotes';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { formatPEN } from '../utils/formatPEN';
import { buildQuoteViewModel } from '../utils/quoteViewModel';
import { renderQuotePdf } from '../utils/quotePdf';
import { prepareQuoteImageExport } from '../utils/quoteExport';
import { QuoteComparisonPanel } from '../components/quotes/QuoteComparisonPanel';
import { SuggestionCard } from '../components/quotes/SuggestionCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';

export function QuotePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const documentRef = useRef(null);
  const [busyDownload, setBusyDownload] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [acceptedAlternativeIds, setAcceptedAlternativeIds] = useState(() => new Set());
  const comparison = location.state?.comparison;
  const quoteQuery = useQuery({
    queryKey: ['quote', codigo],
    queryFn: () => getQuote(codigo),
    retry: false,
  });
  const quote = quoteQuery.data;
  const viewModel = useMemo(() => buildQuoteViewModel(quote), [quote]);
  const suggestionCount = viewModel.unavailableItems.filter((item) => item.options.length > 0).length;
  const suggestionsVisible = suggestionCount <= 2 || showSuggestions;
  const expired = quote?.estado === 'vencida';
  const recalcMutation = useMutation({
    mutationFn: () => recalculateQuote(codigo),
    onSuccess: (data) => {
      queryClient.setQueryData(['quote', data.proforma.codigo], data.proforma);
      navigate(`/proforma/${encodeURIComponent(data.proforma.codigo)}`, {
        replace: true,
        state: { comparison: data },
      });
    },
  });
  const chooseMutation = useMutation({
    mutationFn: ({ itemId, productId }) => chooseQuoteItem(codigo, itemId, productId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['quote', codigo], data);
      setAcceptedAlternativeIds((current) => new Set(current).add(variables.itemId));
    },
  });

  const whatsappUrl = useMemo(() => {
    if (!quote) return '';
    return buildWhatsAppUrl(`Hola Comercial Kenpaku, quisiera consultar la proforma ${quote.codigo}.`);
  }, [quote]);

  const downloadPdf = async () => {
    if (!quote) return;
    setBusyDownload('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      renderQuotePdf(doc, viewModel);
      doc.save(`Proforma_${quote.codigo}.pdf`);
    } finally {
      setBusyDownload('');
    }
  };

  const downloadImage = async () => {
    if (!documentRef.current) return;
    setBusyDownload('image');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(documentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        onclone: prepareQuoteImageExport,
      });
      const link = document.createElement('a');
      link.download = `Proforma_${quote.codigo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setBusyDownload('');
    }
  };

  if (quoteQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8" aria-label="Cargando proforma">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (quoteQuery.isError || !quote) {
    return (
      <div className="px-4 py-12">
        <EmptyState
          icon={FileText}
          title="No encontré esa proforma"
          description="El enlace puede ser incorrecto o la proforma ya no está disponible."
          actionLabel="Crear una nueva"
          onAction={() => navigate('/cotizador')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-2 animate-fade-in sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/cotizador" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Cotizador</Link>
      </div>

      <QuoteComparisonPanel comparison={comparison} />

      <section ref={documentRef} className="space-y-5 rounded-2xl border border-kenpaku-border bg-kenpaku-card p-5 shadow-soft sm:p-8">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase text-kenpaku-blue">Comercial Kenpaku S.A.C.</p>
            <h1 className="mt-1 text-2xl font-extrabold text-kenpaku-navy">Proforma referencial</h1>
            <p className="mt-1 font-mono text-sm text-slate-600">{quote.codigo}</p>
            <p className="mt-1 text-[11px] text-slate-500">RUC {viewModel.company.ruc} · {viewModel.company.phone}</p>
            <p className="text-[11px] text-slate-500">{viewModel.company.address}</p>
          </div>
          <div className="text-xs text-slate-600 sm:text-right">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${expired ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{expired ? 'VENCIDA' : 'VIGENTE'}</span>
            <p>Emisión: {new Date(quote.fecha_emision).toLocaleString('es-PE')}</p>
            <p>Válida hasta: {new Date(quote.valida_hasta).toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Lima)</p>
          </div>
        </header>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup><col className="w-10" /><col /><col className="w-20" /><col className="w-28" /><col className="w-28" /></colgroup>
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
              <tr><th className="py-3 pr-2 text-right">N°</th><th className="py-3 px-3">Descripción</th><th className="py-3 px-2 text-right">Cant.</th><th className="py-3 px-2 text-right">P. unit.</th><th className="py-3 pl-2 text-right">Subtotal</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewModel.pricedItems.map((item, index) => (
                <tr key={item.id} className={index % 2 ? 'bg-slate-50/60' : ''}>
                  <td className="py-3 pr-2 text-right text-xs text-slate-500">{item.number}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    {item.attributeLine && <p className="mt-0.5 text-[11px] text-slate-500">{item.attributeLine}</p>}
                    {item.equivalenceNote && <p className="mt-0.5 text-[11px] text-slate-400">{item.equivalenceNote}</p>}
                    {acceptedAlternativeIds.has(item.id) && <p className="mt-0.5 text-[11px] font-medium text-slate-500">Alternativa agregada</p>}
                    {item.quantityAssumed && <p className="text-[10px] text-amber-700">Cantidad asumida: 1</p>}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-600">{Number(item.quantity)} {item.unit}</td>
                  <td className="py-3 px-2 text-right text-slate-600">{formatPEN(item.unitPrice)}</td>
                  <td className="py-3 pl-2 text-right font-semibold text-slate-800">{formatPEN(item.lineSubtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 sm:hidden">
          {viewModel.pricedItems.map((item) => (
            <article key={item.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-400">{item.number}.</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-kenpaku-navy">{item.description}</h2>
                  {item.attributeLine && <p className="mt-1 text-xs text-slate-600">{item.attributeLine}</p>}
                  {item.equivalenceNote && <p className="mt-1 text-[11px] text-slate-400">{item.equivalenceNote}</p>}
                  {acceptedAlternativeIds.has(item.id) && <p className="mt-1 text-[11px] font-medium text-slate-500">Alternativa agregada</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs">
                <span className="text-slate-500">Cant.</span><span className="text-right">{Number(item.quantity)} {item.unit}</span>
                <span className="text-slate-500">P. unit.</span><span className="text-right">{formatPEN(item.unitPrice)}</span>
                <span className="text-slate-500">Subtotal</span><span className="text-right font-semibold">{formatPEN(item.lineSubtotal)}</span>
              </div>
              {item.quantityAssumed && <p className="text-[10px] text-amber-700">Cantidad asumida: 1</p>}
            </article>
          ))}
        </div>

        {viewModel.unavailableItems.length > 0 && (
          <section className="space-y-3 border-t border-slate-200 pt-4" aria-label="Productos sin stock o no disponibles">
            <h2 className="text-sm font-bold text-slate-600">Productos sin stock o no disponibles</h2>
            {suggestionCount > 2 && (
              <button type="button" data-export-hide aria-expanded={suggestionsVisible}
                onClick={() => setShowSuggestions((visible) => !visible)}
                className="min-h-10 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenpaku-blue">
                {suggestionsVisible ? 'Ocultar alternativas' : `${suggestionCount} productos tienen alternativas`}
              </button>
            )}
            <div className="divide-y divide-slate-100">
              {viewModel.unavailableItems.map((item) => {
                const original = quote.items.find((line) => line.id === item.id);
                const ambiguous = item.status === 'ambiguo';
                return (
                  <article key={item.id} className="py-3 text-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-slate-400">{item.number}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700">{item.description}</p>
                        {item.attributeLine && <p className="mt-0.5 text-[11px] text-slate-500">{item.attributeLine}</p>}
                        {item.equivalenceNote && <p className="mt-0.5 text-[11px] text-slate-400">{item.equivalenceNote}</p>}
                        <StatusBadge status={item.status} />
                        {item.missingFields.length > 0 && <p className="mt-1 text-[11px] text-slate-500">Falta: {item.missingFields.join(', ')}</p>}
                        {item.alternative && (
                          <p data-export-alternative={item.alternative}
                            className={`mt-1 text-[11px] text-slate-500 ${item.options.length && suggestionsVisible ? 'hidden' : ''}`}>
                            {item.options.length && suggestionsVisible ? '' : `Alternativa disponible: ${item.alternative}`}
                          </p>
                        )}
                        {ambiguous && (
                          <select data-export-hide aria-label={`Elegir producto para ${original.texto_original}`} defaultValue=""
                            onChange={(event) => chooseMutation.mutate({ itemId: item.id, productId: event.target.value })}
                            className="mt-2 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2 py-2 text-xs text-slate-800 focus-visible:outline-2 focus-visible:outline-kenpaku-blue">
                            <option value="">Elegir coincidencia...</option>
                            {item.options.map((option) => <option key={option.product_id} value={option.product_id}>{option.nombre} · {option.medida || 'sin medida'} · {formatPEN(option.precio_unitario)}</option>)}
                          </select>
                        )}
                        {item.options.length > 0 && !ambiguous && suggestionsVisible && (
                          <div data-export-hide>
                            <SuggestionCard products={item.options} disabled={chooseMutation.isPending || expired}
                              onAccept={(option) => chooseMutation.mutate({ itemId: item.id, productId: option.product_id })} />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="ml-auto grid max-w-sm grid-cols-2 gap-y-2 border-t border-slate-200 pt-4 text-sm">
          <span className="text-slate-600">Subtotal</span><span className="text-right">{formatPEN(quote.subtotal)}</span>
          <span className="text-slate-600">IGV (18%)</span><span className="text-right">{formatPEN(quote.igv)}</span>
          <span className="font-extrabold text-slate-900">Total de los productos con precio</span><span className="text-right text-lg font-extrabold text-kenpaku-navy">{formatPEN(quote.total)}</span>
          <span className="col-span-2 text-right text-[11px] text-slate-500">Los precios unitarios incluyen IGV</span>
          <span className="text-xs text-slate-500">Ítems sin cotizar</span><span className="text-right text-xs text-slate-500">{quote.items_sin_cotizar}</span>
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          {quote.aviso_validez}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadPdf} disabled={!!busyDownload} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {busyDownload === 'pdf' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Descargar PDF
        </button>
        <button type="button" onClick={downloadImage} disabled={!!busyDownload} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {busyDownload === 'image' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />} Descargar imagen
        </button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
          <MessageCircle className="h-4 w-4" /> Pedir por WhatsApp
        </a>
        <button type="button" onClick={() => recalcMutation.mutate()} disabled={recalcMutation.isPending} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-kenpaku-blue px-3 py-2 text-xs font-bold text-white hover:bg-kenpaku-blueHover disabled:opacity-50">
          {recalcMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Recalcular con precios de hoy
        </button>
      </div>
      {chooseMutation.isError && <p role="alert" className="text-xs text-red-700">No se pudo seleccionar esa opción.</p>}
      {recalcMutation.isError && <p role="alert" className="text-xs text-red-700">No se pudo recalcular la proforma.</p>}
    </div>
  );
}