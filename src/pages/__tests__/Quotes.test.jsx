import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuoteComposer } from '../QuoteComposer';
import { QuotePage } from '../QuotePage';
import * as quoteApi from '../../api/quotes';

vi.mock('../../api/quotes', () => ({
  analyzeQuote: vi.fn(),
  createQuote: vi.fn(),
  getQuote: vi.fn(),
  getQuoteFieldRules: vi.fn(),
  chooseQuoteItem: vi.fn(),
  recalculateQuote: vi.fn(),
}));

vi.mock('../../api/products', () => ({
  getProducts: vi.fn(),
}));

import * as productsApi from '../../api/products';

const quote = {
  id: 'quote-id',
  codigo: 'KP-20261104-ABCD23',
  subtotal: '200.00',
  igv: '36.00',
  total: '236.00',
  fecha_emision: '2026-11-04T10:00:00-05:00',
  valida_hasta: '2026-11-04T23:59:59-05:00',
  estado: 'vigente',
  items_sin_cotizar: 1,
  aviso_validez: 'Proforma referencial. Los precios pueden variar a diario por el tipo de cambio del dólar. Válida solo hasta el 04/11/2026 a las 11:59 pm (hora de Lima). No reserva stock ni constituye un comprobante de venta. Para recalcular otro día, ingresa tu código KP-20261104-ABCD23 en el asesor.',
  items: [
    {
      id: 'line-1',
      texto_original: '2 tubos cuadrados 2x2',
      nombre_snapshot: 'Tubo cuadrado negro 2x2',
      medida_snapshot: '2x2',
      cantidad: '2',
      unidad: 'unidad',
      cantidad_asumida: false,
      precio_unitario_snapshot: '118.00',
      subtotal_linea: '236.00',
      estado_linea: 'ambiguo',
      opciones: [
        { product_id: 'p-1', nombre: 'Tubo negro 2x2', medida: '2x2', precio_unitario: '118.00', stock_disponible: 10 },
      ],
    },
    {
      id: 'line-2',
      texto_original: '3 perfiles especiales',
      nombre_snapshot: 'Perfiles especiales',
      medida_snapshot: null,
      cantidad: '3',
      unidad: null,
      cantidad_asumida: true,
      precio_unitario_snapshot: null,
      subtotal_linea: null,
      estado_linea: 'no_se_vende',
      opciones: [],
    },
  ],
};

function renderWithRouter(element, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Flujo de proformas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quoteApi.analyzeQuote.mockResolvedValue({ items: [] });
    quoteApi.getQuoteFieldRules.mockResolvedValue({
      tubos: { required: ['forma', 'medida', 'espesor', 'acabado'] },
      accesorios: { required: [] },
    });
  });

  it('envía una lista del cotizador y navega a la proforma', async () => {
    quoteApi.createQuote.mockResolvedValue(quote);
    renderWithRouter(
      <Routes>
        <Route path="/cotizador" element={<QuoteComposer />} />
        <Route path="/proforma/:codigo" element={<p>Proforma abierta</p>} />
      </Routes>,
      '/cotizador'
    );

    fireEvent.change(screen.getByLabelText('Lista de materiales'), {
      target: { value: '10 tubos cuadrados 2x2 de 1.5mm' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }));

    expect(await screen.findByText('Proforma abierta')).toBeInTheDocument();
    expect(quoteApi.createQuote).toHaveBeenCalledWith({ texto: '10 tubos cuadrados 2x2 de 1.5mm' });
  });

  it('muestra la proforma, exige resolver ambigüedad y no ofrece confirmar compra', async () => {
    quoteApi.getQuote.mockResolvedValue(quote);
    quoteApi.chooseQuoteItem.mockResolvedValue({ ...quote, items: quote.items.map((item) => item.id === 'line-1' ? { ...item, estado_linea: 'con_precio', opciones: [] } : item) });
    renderWithRouter(
      <Routes><Route path="/proforma/:codigo" element={<QuotePage />} /></Routes>,
      `/proforma/${quote.codigo}`
    );

    expect(await screen.findByText('VIGENTE')).toBeInTheDocument();
    expect(screen.getAllByText('Sin stock').length).toBeGreaterThan(0);
    expect(screen.getByText(/Válida solo hasta el 04\/11\/2026/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Elegir producto para 2 tubos cuadrados 2x2'), {
      target: { value: 'p-1' },
    });
    await waitFor(() => expect(quoteApi.chooseQuoteItem).toHaveBeenCalledWith(quote.codigo, 'line-1', 'p-1'));
  });

  it('carga el catálogo paginado y conserva el artículo accesorio al cambiar cantidad', async () => {
    const accessory = {
      id: 'accessory-id',
      nombre: 'Careta de soldar',
      categoria: 'accesorios',
      precio_unitario: '25.00',
      stock_disponible: 4,
    };
    productsApi.getProducts.mockImplementation(({ page }) => Promise.resolve({
      items: page === 1 ? [] : [accessory],
      total: 101,
      page,
      page_size: 100,
    }));
    quoteApi.createQuote.mockResolvedValue(quote);
    renderWithRouter(
      <Routes>
        <Route path="/cotizador" element={<QuoteComposer />} />
        <Route path="/proforma/:codigo" element={<p>Proforma abierta</p>} />
      </Routes>,
      '/cotizador'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Armar mi lista' }));
    await screen.findByRole('option', { name: 'Accesorios' });
    fireEvent.change(screen.getByLabelText('Producto'), { target: { value: 'accesorios' } });
    fireEvent.change(await screen.findByLabelText('Artículo'), { target: { value: 'accessory-id' } });
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }));

    await waitFor(() => expect(quoteApi.createQuote).toHaveBeenCalledWith({
      items: [{ texto_original: '3 Careta de soldar', cantidad: '3', product_id: 'accessory-id' }],
    }));
    expect(productsApi.getProducts).toHaveBeenCalledWith({ page: 2, page_size: 100 });
  });
});