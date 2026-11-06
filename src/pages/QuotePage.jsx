import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileImage, FileText, LoaderCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { chooseQuoteItem, getQuote, recalculateQuote } from '../api/quotes';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { formatPEN } from '../utils/formatPEN';
import { QuoteComparisonPanel } from '../components/quotes/QuoteComparisonPanel';
import { SuggestionCard } from '../components/quotes/SuggestionCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';

function lineLabel(item) {
  if (item.estado_linea === 'sin_stock') return 'Sin stock';
  if (item.estado_linea === 'no_se_vende') return 'Sin stock';
  if (item.estado_linea === 'ambiguo') return 'Elige una opción';
  if (item.estado_linea === 'faltan_datos') return 'Faltan datos';
  return null;
}

export function QuotePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const documentRef = useRef(null);
  const [busyDownload, setBusyDownload] = useState('');
  const comparison = location.state?.comparison;
  const quoteQuery = useQuery({
    queryKey: ['quote', codigo],
    queryFn: () => getQuote(codigo),
    retry: false,
  });
  const quote = quoteQuery.data;
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
    onSuccess: (data) => queryClient.setQueryData(['quote', codigo], data),
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
      doc.setFillColor(10, 37, 64);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('K', 15, 20);
      doc.setFontSize(12);
      doc.text('COMERCIAL KENPAKU S.A.C.', 25, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('PROFORMA REFERENCIAL', 25, 23);
      doc.setTextColor(25, 35, 45);
      doc.setFontSize(10);
      doc.text(`Código: ${quote.codigo}`, 15, 43);
      doc.text(`Emisión: ${new Date(quote.fecha_emision).toLocaleString('es-PE')}`, 15, 50);
      doc.text(`Válida hasta: ${new Date(quote.valida_hasta).toLocaleString('es-PE')}`, 15, 57);
      doc.setDrawColor(210, 218, 226);
      doc.line(15, 62, 195, 62);
      let y = 70;
      const col = [15, 92, 130, 160, 195];
      doc.setFont('helvetica', 'bold');
      doc.text('Producto', col[0], y);
      doc.text('Cant.', col[1], y);
      doc.text('Precio unit.', col[2], y);
      doc.text('Subtotal', col[3], y);
      doc.line(15, y + 3, 195, y + 3);
      y += 11;
      doc.setFont('helvetica', 'normal');
      quote.items.forEach((item) => {
        if (y > 260) { doc.addPage(); y = 20; }
        const name = doc.splitTextToSize(`${item.nombre_snapshot}${item.medida_snapshot ? ` · ${item.medida_snapshot}` : ''}`, 72);
        doc.text(name, col[0], y);
        if (item.precio_unitario_snapshot == null) {
          doc.setTextColor(110, 120, 130);
          doc.text(lineLabel(item) || 'No disponible / no se vende', col[2], y);
          doc.setTextColor(25, 35, 45);
        } else {
          doc.text(String(Number(item.cantidad)), col[1], y);
          doc.text(formatPEN(item.precio_unitario_snapshot), col[2], y);
          doc.text(formatPEN(item.subtotal_linea), col[3], y);
          if (item.estado_linea === 'sin_stock') {
            doc.setTextColor(166, 83, 30);
            doc.text('Sin stock', col[0], y + 5);
            doc.setTextColor(25, 35, 45);
          }
        }
        y += Math.max(9, name.length * 5 + 2);
      });
      y += 4;
      doc.line(115, y, 195, y);
      y += 8;
      doc.text('Subtotal:', 140, y); doc.text(formatPEN(quote.subtotal), 195, y, { align: 'right' }); y += 7;
      doc.text('IGV (18%):', 140, y); doc.text(formatPEN(quote.igv), 195, y, { align: 'right' }); y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Total de los productos con precio:', 15, y);
      doc.text(formatPEN(quote.total), 195, y, { align: 'right' }); y += 10;
      doc.setFont('helvetica', 'normal');
      const notice = doc.splitTextToSize(quote.aviso_validez, 180);
      doc.setFontSize(8);
      doc.text(notice, 15, y);
      y += notice.length * 4 + 8;
      doc.setFontSize(8);
      doc.text(`Ítems sin cotizar: ${quote.items_sin_cotizar}`, 15, y);
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
      const canvas = await html2canvas(documentRef.current, { backgroundColor: '#ffffff', scale: 2 });
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
        <span className={`rounded-md px-3 py-1 text-xs font-extrabold ${expired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{expired ? 'VENCIDA' : 'VIGENTE'}</span>
      </div>

      <QuoteComparisonPanel comparison={comparison} />

      <section ref={documentRef} className="space-y-5 rounded-2xl border border-kenpaku-border bg-kenpaku-card p-5 shadow-soft sm:p-8">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase text-kenpaku-blue">Comercial Kenpaku S.A.C.</p>
            <h1 className="mt-1 text-2xl font-extrabold text-kenpaku-navy">Proforma referencial</h1>
            <p className="mt-1 font-mono text-sm text-slate-600">{quote.codigo}</p>
          </div>
          <div className="text-xs text-slate-600 sm:text-right">
            <p>Emisión: {new Date(quote.fecha_emision).toLocaleString('es-PE')}</p>
            <p>Válida hasta: {new Date(quote.valida_hasta).toLocaleString('es-PE', { timeZone: 'America/Lima' })} (Lima)</p>
          </div>
        </header>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><tr><th className="py-3 pr-3">Producto</th><th className="py-3 px-3">Medida</th><th className="py-3 px-3 text-right">Cantidad</th><th className="py-3 px-3 text-right">Precio unitario</th><th className="py-3 pl-3 text-right">Subtotal</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {quote.items.map((item) => {
                const unavailable = item.estado_linea === 'no_se_vende';
                const ambiguous = item.estado_linea === 'ambiguo';
                const noStock = item.estado_linea === 'sin_stock';
                const missingData = item.estado_linea === 'faltan_datos';
                return (
                  <tr key={item.id} className={unavailable || ambiguous || missingData ? 'bg-slate-50 text-slate-500' : ''}>
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-900">{item.nombre_snapshot}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{item.texto_original}</p>
                      {(noStock || unavailable || missingData) && <span className="mt-1 inline-block"><StatusBadge status={item.estado_linea} /></span>}
                      {ambiguous && <span className="mt-1 block text-[11px] font-semibold">Selecciona la opción correcta</span>}
                      {missingData && <p className="mt-1 text-[11px] font-semibold text-amber-700">Falta: {(item.faltantes || []).join(', ')}</p>}
                      {ambiguous && (
                        <select aria-label={`Elegir producto para ${item.texto_original}`} defaultValue="" onChange={(event) => chooseMutation.mutate({ itemId: item.id, productId: event.target.value })} className="mt-2 w-full max-w-sm rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800">
                          <option value="">Elegir coincidencia...</option>
                          {item.opciones.map((option) => <option key={option.product_id} value={option.product_id}>{option.nombre} · {option.medida || 'sin medida'} · {formatPEN(option.precio_unitario)}</option>)}
                        </select>
                      )}
                      {unavailable && item.opciones?.[0] && (
                        <SuggestionCard
                          product={item.opciones[0]}
                          disabled={chooseMutation.isPending || expired}
                          onAccept={() => chooseMutation.mutate({ itemId: item.id, productId: item.opciones[0].product_id })}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.medida_snapshot || '—'}</td>
                    <td className="py-3 px-3 text-right">{Number(item.cantidad)} {item.unidad || ''}{item.cantidad_asumida ? <span className="block text-[10px] text-amber-700">Cantidad asumida: 1</span> : null}</td>
                    <td className="py-3 px-3 text-right">{item.precio_unitario_snapshot == null ? '—' : formatPEN(item.precio_unitario_snapshot)}</td>
                    <td className="py-3 pl-3 text-right font-semibold">{item.subtotal_linea == null ? '—' : formatPEN(item.subtotal_linea)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 sm:hidden">
          {quote.items.map((item) => (
            <article key={item.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-bold text-kenpaku-navy">{item.nombre_snapshot}</h2>
                {['con_precio', 'sin_stock', 'no_se_vende', 'faltan_datos'].includes(item.estado_linea) && <StatusBadge status={item.estado_linea} />}
              </div>
              <p className="text-xs text-slate-600">{item.texto_original}</p>
              {item.medida_snapshot && <p className="text-xs text-slate-600">Medida: {item.medida_snapshot}</p>}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>Cantidad</span><span className="text-right">{Number(item.cantidad)} {item.unidad || ''}</span>
                <span>Precio unitario</span><span className="text-right">{item.precio_unitario_snapshot == null ? '—' : formatPEN(item.precio_unitario_snapshot)}</span>
                <span>Subtotal de línea</span><span className="text-right font-bold">{item.subtotal_linea == null ? '—' : formatPEN(item.subtotal_linea)}</span>
              </div>
              {item.estado_linea === 'faltan_datos' && <p className="text-xs font-semibold text-amber-700">Falta: {(item.faltantes || []).join(', ')}</p>}
              {item.estado_linea === 'no_se_vende' && item.opciones?.[0] && (
                <SuggestionCard product={item.opciones[0]} disabled={chooseMutation.isPending || expired} onAccept={() => chooseMutation.mutate({ itemId: item.id, productId: item.opciones[0].product_id })} />
              )}
            </article>
          ))}
        </div>

        <div className="ml-auto grid max-w-sm grid-cols-2 gap-y-2 border-t border-slate-200 pt-4 text-sm">
          <span className="text-slate-600">Subtotal</span><span className="text-right">{formatPEN(quote.subtotal)}</span>
          <span className="text-slate-600">IGV (18%)</span><span className="text-right">{formatPEN(quote.igv)}</span>
          <span className="font-extrabold text-slate-900">Total de los productos con precio</span><span className="text-right text-lg font-extrabold text-kenpaku-navy">{formatPEN(quote.total)}</span>
          <span className="text-xs text-slate-500">Ítems sin cotizar</span><span className="text-right text-xs text-slate-500">{quote.items_sin_cotizar}</span>
        </div>

        <p className={`border-l-4 p-3 text-xs leading-relaxed ${expired ? 'border-red-500 bg-red-50 text-red-900' : 'border-amber-500 bg-amber-50 text-amber-950'}`}>
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