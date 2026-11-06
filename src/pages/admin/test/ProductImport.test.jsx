import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductImport } from '../ProductImport';
import * as adminApi from '../../../api/admin';

vi.mock('../../../api/admin', () => ({
  commitProductImport: vi.fn(),
  getProductImportHistory: vi.fn(),
  previewProductImport: vi.fn(),
}));

const preview = {
  headers: [
    { key: '0', label: 'SKU' },
    { key: '1', label: 'Nombre' },
    { key: '2', label: 'Precio USD' },
    { key: '3', label: 'Categoria' },
  ],
  suggested_mapping: { sku: '0', nombre: '1', precio_usd: '2', categoria: '3' },
  mapping: { sku: '0', nombre: '1', precio_usd: '2', categoria: '3' },
  tipo_cambio: '3.750000',
  rows: [{
    row_number: 2,
    status: 'NUEVO',
    motivos: [],
    inferidos: [],
    sku: 'A-1',
    nombre: 'Tubo de prueba',
    precio_usd: '10.00',
    categoria: 'tubos',
    acabado: null,
    medida: null,
    espesor: null,
    stock: null,
    precio_final_pen: '53.10',
    tipo_cambio: '3.750000',
    match_product_id: null,
    match_product_name: null,
  }],
};

function renderImportPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><ProductImport /></MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductImport admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getProductImportHistory.mockResolvedValue({ items: [] });
    adminApi.previewProductImport.mockResolvedValue(preview);
    adminApi.commitProductImport.mockResolvedValue({
      import_id: 7,
      nuevos: 1,
      actualizados: 0,
      errores: 0,
      indexing_status: 'queued',
      indexing_total: 1,
    });
  });

  it('recorre los cuatro pasos, previsualiza y confirma la importación', async () => {
    renderImportPage();
    fireEvent.change(screen.getByLabelText('O pega la tabla copiada de Excel'), {
      target: { value: 'SKU\tNombre\tPrecio USD\tCategoria\nA-1\tTubo de prueba\t10\ttubos' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Analizar columnas/ }));

    expect(await screen.findByText('2. Mapea las columnas')).toBeInTheDocument();
    await waitFor(() => expect(adminApi.previewProductImport.mock.calls[0][0]).toEqual(expect.objectContaining({ mapping: null })));
    fireEvent.click(screen.getByRole('button', { name: /Validar y previsualizar/ }));

    expect(await screen.findByText('3. Revisa antes de guardar')).toBeInTheDocument();
    expect(screen.getByText('S/ 53.10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(await screen.findByText('4. Confirma la importación')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar y guardar/ }));

    expect(await screen.findByText(/Importación 7 guardada/)).toBeInTheDocument();
    expect(adminApi.commitProductImport.mock.calls[0][0]).toEqual(expect.objectContaining({
      updateMode: 'todo',
      newProductsActive: false,
      excludedRows: [],
    }));
  });
});