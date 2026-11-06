import { describe, expect, it } from 'vitest';
import { buildQuoteViewModel } from '../quoteViewModel';

describe('buildQuoteViewModel', () => {
  it('omits duplicated and generic attributes and preserves the display order', () => {
    const model = buildQuoteViewModel({
      codigo: 'KP-TEST',
      subtotal: '100',
      igv: '18',
      total: '118',
      items: [{
        id: 'line-1',
        nombre_snapshot: 'Plancha LAF 1.5 mm 1.20 x 2.40 m',
        medida_snapshot: '1.20 x 2.40 m',
        espesor_snapshot: '1.5 mm',
        acabado_snapshot: 'Estándar',
        estado_linea: 'con_precio',
        precio_unitario_snapshot: '118',
        subtotal_linea: '118',
        equivalencia_nota: 'Medida equivalente: 1/8" = 3 mm',
      }],
    });

    expect(model.pricedItems[0].description).toBe('Plancha LAF 1.5 mm 1.20 x 2.40 m');
    expect(model.pricedItems[0].attributeLine).toBe('');
    expect(model.pricedItems[0].equivalenceNote).toBe('Medida equivalente: 1/8" = 3 mm');
    expect(model.unavailableItems).toEqual([]);
  });

  it('omits generic values and keeps only distinct attributes not present in the description', () => {
    const model = buildQuoteViewModel({
      items: [{
        nombre_snapshot: 'Plancha LAC',
        medida_snapshot: 'Estándar',
        espesor_snapshot: '3 mm',
        acabado_snapshot: 'ninguno',
        estado_linea: 'con_precio',
        precio_unitario_snapshot: '5',
      }],
    });

    expect(model.pricedItems[0].attributeLine).toBe('3 mm');
  });

  it('keeps alternatives text-only in the export view model', () => {
    const model = buildQuoteViewModel({
      items: [{
        nombre_snapshot: 'Tubo cuadrado agotado',
        estado_linea: 'no_se_vende',
        opciones: [{
          nombre: 'Tubo galvanizado',
          medida: '40x40',
          acabado: 'galvanizado',
          precio_unitario: '999.00',
        }],
      }],
    });

    expect(model.unavailableItems[0].alternative).toBe('Tubo galvanizado · 40x40 · galvanizado');
    expect(model.unavailableItems[0].alternative).not.toContain('999');
  });
});
