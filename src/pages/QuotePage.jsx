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
      <div className="max-w-site mx-auto space-y-4 px-4 py-8 sm:px-6 lg:px-8" aria-label="Cargando proforma">
        <Skeleton className="h-8 w-40 rounded-btn" />
        <Skeleton className="h-80 w-full rounded-panel" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    );
  }
  if (quoteQuery.isError || !quote) {
    return (
      <div className="max-w-site mx-auto px-4 py-12 sm:px-6 lg:px-8">
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
    <div className="max-w-site mx-auto space-y-6 px-4 py-6 animate-fade-in font-sans sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/cotizador"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-steel-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al cotizador
        </Link>
      </div>

      <QuoteComparisonPanel comparison={comparison} />

      <section
        ref={documentRef}
        className="space-y-6 rounded-panel border border-steel-200 bg-white p-6 sm:p-8 shadow-card"
      >
        <header className="flex flex-col justify-between gap-4 border-b border-steel-200 pb-5 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <p className="text-micro font-extrabold uppercase tracking-wider text-brand-600">
              Comercial Kenpaku S.A.C.
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-navy-900 tracking-tight">
              Proforma referencial
            </h1>
            <p className="font-mono num text-sm font-bold text-steel-700">{quote.codigo}</p>
            <p className="text-[11px] text-steel-500">
              RUC {viewModel.company.ruc} · {viewModel.company.phone}
            </p>
            <p className="text-[11px] text-steel-500">{viewModel.company.address}</p>
          </div>
          <div className="text-xs text-steel-600 sm:text-right space-y-1.5">
            <div>
              <span
                className={`cut inline-flex px-3 py-1 text-micro font-bold uppercase tracking-wider border ${
                  expired
                    ? 'border-steel-300 bg-steel-100 text-steel-600'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {expired ? 'VENCIDA' : 'VIGENTE'}
              </span>
            </div>
            <p className="text-[11px]">
              Emisión: <span className="font-semibold text-steel-800">{new Date(quote.fecha_emision).toLocaleString('es-PE')}</span>
            </p>
            <p className="text-[11px]">
              Válida hasta:{' '}
              <span className="font-semibold text-steel-800">
                {new Date(quote.valida_hasta).toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Lima)
              </span>
            </p>
          </div>
        </header>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-24" />
              <col className="w-32" />
              <col className="w-32" />
            </colgroup>
            <thead className="border-b border-steel-200 text-micro uppercase tracking-wider text-steel-500 font-bold">
              <tr>
                <th className="py-3 pr-2 text-right">N°</th>
                <th className="py-3 px-3">Descripción</th>
                <th className="py-3 px-2 text-right">Cant.</th>
                <th className="py-3 px-2 text-right">P. unit.</th>
                <th className="py-3 pl-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {viewModel.pricedItems.map((item, index) => (
                <tr key={item.id} className={index % 2 ? 'bg-steel-50/50' : 'hover:bg-steel-50/30'}>
                  <td className="py-3 pr-2 text-right text-xs font-mono num text-steel-500">{item.number}</td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-navy-900">{item.description}</p>
                    {item.attributeLine && <p className="mt-0.5 text-xs text-steel-500">{item.attributeLine}</p>}
                    {item.equivalenceNote && <p className="mt-0.5 text-[11px] text-steel-500">{item.equivalenceNote}</p>}
                    {acceptedAlternativeIds.has(item.id) && (
                      <p className="mt-0.5 text-micro font-bold text-brand-600">Alternativa agregada</p>
                    )}
                    {item.quantityAssumed && <p className="text-micro font-bold text-amber-700">Cantidad asumida: 1</p>}
                  </td>
                  <td className="py-3 px-2 text-right font-mono num text-steel-700">
                    {Number(item.quantity)} {item.unit}
                  </td>
                  <td className="py-3 px-2 text-right font-mono num text-steel-700">{formatPEN(item.unitPrice)}</td>
                  <td className="py-3 pl-2 text-right font-mono num font-bold text-navy-900">
                    {formatPEN(item.lineSubtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {viewModel.pricedItems.map((item) => (
            <article key={item.id} className="space-y-2 rounded-card border border-steel-200 bg-white p-4 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <span className="text-xs font-mono num font-bold text-steel-500">{item.number}.</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-navy-900">{item.description}</h2>
                  {item.attributeLine && <p className="mt-1 text-xs text-steel-600">{item.attributeLine}</p>}
                  {item.equivalenceNote && <p className="mt-1 text-[11px] text-steel-500">{item.equivalenceNote}</p>}
                  {acceptedAlternativeIds.has(item.id) && (
                    <p className="mt-1 text-micro font-bold text-brand-600">Alternativa agregada</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-steel-100 pt-2.5 text-xs">
                <span className="text-steel-500">Cant.</span>
                <span className="text-right font-mono num font-semibold text-navy-900">
                  {Number(item.quantity)} {item.unit}
                </span>
                <span className="text-steel-500">P. unit.</span>
                <span className="text-right font-mono num font-semibold text-navy-900">
                  {formatPEN(item.unitPrice)}
                </span>
                <span className="text-steel-500 font-bold">Subtotal</span>
                <span className="text-right font-mono num font-bold text-navy-900">
                  {formatPEN(item.lineSubtotal)}
                </span>
              </div>
              {item.quantityAssumed && <p className="text-micro font-bold text-amber-700">Cantidad asumida: 1</p>}
            </article>
          ))}
        </div>

        {/* Unavailable items / Alternatives */}
        {viewModel.unavailableItems.length > 0 && (
          <section className="space-y-3 border-t border-steel-200 pt-5" aria-label="Productos sin stock o no disponibles">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-900">Productos sin stock o no disponibles</h2>
              {suggestionCount > 2 && (
                <button
                  type="button"
                  data-export-hide
                  aria-expanded={suggestionsVisible}
                  onClick={() => setShowSuggestions((visible) => !visible)}
                  className="rounded-btn px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {suggestionsVisible ? 'Ocultar alternativas' : `${suggestionCount} productos tienen alternativas`}
                </button>
              )}
            </div>
            <div className="divide-y divide-steel-100 rounded-card border border-steel-200 bg-steel-50/40 p-3 sm:p-4">
              {viewModel.unavailableItems.map((item) => {
                const original = quote.items.find((line) => line.id === item.id);
                const ambiguous = item.status === 'ambiguo';
                return (
                  <article key={item.id} className="py-3 text-steel-700 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-mono num font-bold text-steel-500">{item.number}.</span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-sm font-semibold text-navy-900">{item.description}</p>
                        {item.attributeLine && <p className="text-xs text-steel-500">{item.attributeLine}</p>}
                        {item.equivalenceNote && <p className="text-[11px] text-steel-500">{item.equivalenceNote}</p>}
                        <div>
                          <StatusBadge status={item.status} />
                        </div>
                        {item.missingFields.length > 0 && (
                          <p className="text-[11px] text-steel-500">Falta: {item.missingFields.join(', ')}</p>
                        )}
                        {item.alternative && (
                          <p
                            data-export-alternative={item.alternative}
                            className={`text-[11px] font-medium text-steel-600 ${
                              item.options.length && suggestionsVisible ? 'hidden' : ''
                            }`}
                          >
                            {item.options.length && suggestionsVisible ? '' : `Alternativa disponible: ${item.alternative}`}
                          </p>
                        )}
                        {ambiguous && (
                          <select
                            data-export-hide
                            aria-label={`Elegir producto para ${original.texto_original}`}
                            defaultValue=""
                            onChange={(event) =>
                              chooseMutation.mutate({ itemId: item.id, productId: event.target.value })
                            }
                            className="mt-2 w-full max-w-sm rounded-btn border border-steel-300 bg-white px-3 py-2 text-xs text-navy-900 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                          >
                            <option value="">Elegir coincidencia...</option>
                            {item.options.map((option) => (
                              <option key={option.product_id} value={option.product_id}>
                                {option.nombre} · {option.medida || 'sin medida'} · {formatPEN(option.precio_unitario)}
                              </option>
                            ))}
                          </select>
                        )}
                        {item.options.length > 0 && !ambiguous && suggestionsVisible && (
                          <div data-export-hide className="pt-1">
                            <SuggestionCard
                              products={item.options}
                              disabled={chooseMutation.isPending || expired}
                              onAccept={(option) =>
                                chooseMutation.mutate({ itemId: item.id, productId: option.product_id })
                              }
                            />
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

        {/* Financial Summary */}
        <div className="ml-auto max-w-sm rounded-card border border-steel-200 bg-steel-50/70 p-4 space-y-2 text-xs">
          <div className="flex justify-between text-steel-600">
            <span>Subtotal</span>
            <span className="font-mono num font-semibold text-navy-900">{formatPEN(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-steel-600">
            <span>IGV (18%)</span>
            <span className="font-mono num font-semibold text-navy-900">{formatPEN(quote.igv)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-steel-200 pt-2">
            <span className="font-bold text-navy-900">Total productos con precio</span>
            <span className="font-display font-extrabold text-price num text-navy-900">
              {formatPEN(quote.total)}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-steel-500 pt-1 border-t border-steel-100">
            <span>Los precios unitarios incluyen IGV</span>
            <span>Ítems sin cotizar: <strong className="font-mono num">{quote.items_sin_cotizar}</strong></span>
          </div>
        </div>

        <p className="rounded-btn border border-steel-200 bg-steel-50 p-3.5 text-xs leading-relaxed text-steel-600">
          {quote.aviso_validez}
        </p>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={!!busyDownload}
          className="inline-flex min-h-10 items-center gap-2 rounded-btn border border-steel-300 bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:bg-steel-50 hover:border-steel-400 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {busyDownload === 'pdf' ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
          ) : (
            <FileText className="h-4 w-4 text-steel-600" />
          )}{' '}
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={downloadImage}
          disabled={!!busyDownload}
          className="inline-flex min-h-10 items-center gap-2 rounded-btn border border-steel-300 bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:bg-steel-50 hover:border-steel-400 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          {busyDownload === 'image' ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
          ) : (
            <FileImage className="h-4 w-4 text-steel-600" />
          )}{' '}
          Descargar imagen
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-btn bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2 text-xs font-bold text-white shadow-wa transition-all"
        >
          <MessageCircle className="h-4 w-4" /> Pedir por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => recalcMutation.mutate()}
          disabled={recalcMutation.isPending}
          className="inline-flex min-h-10 items-center gap-2 rounded-btn bg-brand-600 hover:bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-cta transition-all disabled:opacity-50 cursor-pointer"
        >
          {recalcMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}{' '}
          Recalcular con precios de hoy
        </button>
      </div>
      {chooseMutation.isError && (
        <p role="alert" className="text-xs text-red-700 font-semibold">
          No se pudo seleccionar esa opción.
        </p>
      )}
      {recalcMutation.isError && (
        <p role="alert" className="text-xs text-red-700 font-semibold">
          No se pudo recalcular la proforma.
        </p>
      )}
    </div>
  );
}