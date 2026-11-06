import { describe, expect, it } from 'vitest';
import { buildQuoteViewModel } from '../quoteViewModel';
import { renderQuotePdf } from '../quotePdf';

function createPdfRecorder() {
  const pages = [[]];
  let currentPage = 0;
  const record = (operation) => (...args) => {
    pages[currentPage].push([operation, ...args]);
  };
  return {
    pages,
    addPage() {
      pages.push([]);
      currentPage = pages.length - 1;
    },
    getNumberOfPages: () => pages.length,
    setPage(page) {
      currentPage = page - 1;
    },
    splitTextToSize: (text) => [String(text)],
    setFillColor: record('setFillColor'),
    rect: record('rect'),
    roundedRect: record('roundedRect'),
    setTextColor: record('setTextColor'),
    setDrawColor: record('setDrawColor'),
    setFont: record('setFont'),
    setFontSize: record('setFontSize'),
    text: record('text'),
    line: record('line'),
  };
}

function searchablePdfText(pdf) {
  return pdf.pages.flatMap((page) => page)
    .filter(([operation]) => operation === 'text')
    .map(([, text]) => Array.isArray(text) ? text.join(' ') : String(text))
    .join('\n');
}

describe('renderQuotePdf', () => {
  it('repeats the table header and numbers every page for 50 rows', () => {
    const quote = {
      codigo: 'KP-50-ITEMS',
      fecha_emision: '2026-11-06T10:00:00-05:00',
      valida_hasta: '2026-11-06T23:59:59-05:00',
      aviso_validez: 'Válida hasta el fin del día.',
      subtotal: '5000',
      igv: '900',
      total: '5900',
      items_sin_cotizar: 0,
      items: Array.from({ length: 50 }, (_, index) => ({
        id: `line-${index + 1}`,
        nombre_snapshot: `Producto número ${index + 1}`,
        medida_snapshot: '1x1',
        estado_linea: 'con_precio',
        cantidad: '1',
        precio_unitario_snapshot: '118',
        subtotal_linea: '118',
      })),
    };
    const pdf = createPdfRecorder();

    renderQuotePdf(pdf, buildQuoteViewModel(quote));

    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    const pageHeaders = pdf.pages.map((page) => page.filter(
      ([operation, text]) => operation === 'text' && text === 'Descripción',
    ).length);
    expect(pageHeaders.every((count) => count === 1)).toBe(true);
    expect(searchablePdfText(pdf)).toContain('Página 1 de');
    expect(searchablePdfText(pdf)).toContain('Página 2 de');
  });

  it('uses the screen view model order and excludes alternative prices', () => {
    const quote = {
      codigo: 'KP-ORDER',
      fecha_emision: '2026-11-06T10:00:00-05:00',
      valida_hasta: '2026-11-06T23:59:59-05:00',
      aviso_validez: 'Válida hasta el fin del día.',
      subtotal: '100',
      igv: '18',
      total: '118',
      items_sin_cotizar: 1,
      items: [
        {
          id: 'priced',
          nombre_snapshot: 'Plancha LAF 3 mm',
          medida_snapshot: '1.20 x 2.40 m',
          espesor_snapshot: '3 mm',
          estado_linea: 'con_precio',
          cantidad: '2',
          precio_unitario_snapshot: '59',
          subtotal_linea: '118',
        },
        {
          id: 'unavailable',
          nombre_snapshot: 'Perfil no disponible',
          estado_linea: 'no_se_vende',
          opciones: [{
            nombre: 'Perfil alternativo',
            medida: '40x40',
            precio_unitario: '999.00',
          }],
        },
      ],
    };
    const model = buildQuoteViewModel(quote);
    const pdf = createPdfRecorder();

    renderQuotePdf(pdf, model);

    const text = searchablePdfText(pdf);
    expect(text.indexOf('Plancha LAF 3 mm')).toBeLessThan(text.indexOf('Productos sin stock o no disponibles'));
    expect(text).toContain('Alternativa disponible: Perfil alternativo · 40x40');
    expect(text).not.toContain('999.00');
    expect(text).not.toContain('1.20 x 2.40 m · 1.20 x 2.40 m');
    expect(text).toContain('Subtotal');
    expect(text).toContain('IGV (18%)');
    expect(text).toContain('Total de los productos con precio');
  });
});
