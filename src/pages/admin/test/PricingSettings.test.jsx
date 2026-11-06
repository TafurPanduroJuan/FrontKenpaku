import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingSettings } from '../PricingSettings';
import * as adminApi from '../../../api/admin';

vi.mock('../../../api/admin', () => ({
  getAdminMeasurementEquivalences: vi.fn(),
  getAdminPricingSettings: vi.fn(),
  updateAdminMeasurementEquivalences: vi.fn(),
  updateAdminPricingSettings: vi.fn(),
}));

function renderPricingSettings() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PricingSettings />
    </QueryClientProvider>
  );
}

describe('PricingSettings admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getAdminPricingSettings.mockResolvedValue({
      margen_global_pct: '20.000',
      costo_incluye_igv: false,
      redondeo: 5,
      margenes_por_categoria: [],
      tipo_cambio_actual: '3.750000',
      fecha_tipo_cambio: '2026-11-04',
      fuente_tipo_cambio: 'manual',
    });
    adminApi.updateAdminPricingSettings.mockImplementation(async (payload) => ({
      ...payload,
      tipo_cambio_actual: payload.tipo_cambio_manual,
      fecha_tipo_cambio: '2026-11-04',
      fuente_tipo_cambio: 'manual',
    }));
    adminApi.getAdminMeasurementEquivalences.mockResolvedValue({
      items: [{
        id: 1,
        tipo_medida: 'dimension',
        pulgada: '1',
        mm_minimo: '24',
        mm_maximo: '26',
        categoria: null,
        tolerancia_mm: '1.50',
      }],
    });
    adminApi.updateAdminMeasurementEquivalences.mockImplementation(async ({ items }) => ({ items }));
  });

  it('guarda reglas, margen por categoría y tipo de cambio manual', async () => {
    renderPricingSettings();

    fireEvent.change(await screen.findByLabelText('Margen global (%)'), { target: { value: '22.5' } });
    fireEvent.change(screen.getByLabelText('Redondeo en céntimos'), { target: { value: '10' } });
    fireEvent.click(screen.getByLabelText('El costo USD del proveedor ya incluye IGV'));
    fireEvent.change(screen.getByLabelText('Tubos (%)'), { target: { value: '27' } });
    fireEvent.change(screen.getByLabelText('Tipo de cambio manual del día (opcional)'), { target: { value: '3.81' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y recalcular' }));

    await waitFor(() => expect(adminApi.updateAdminPricingSettings.mock.calls[0][0]).toEqual({
      margen_global_pct: 22.5,
      costo_incluye_igv: true,
      redondeo: 10,
      margenes_por_categoria: [{ categoria: 'tubos', margen_pct: 27 }],
      tipo_cambio_manual: 3.81,
    }));
  });

  it('permite editar y guardar equivalencias con tolerancia', async () => {
    renderPricingSettings();

    fireEvent.change(await screen.findByLabelText('mm mínimo 1'), { target: { value: '23' } });
    fireEvent.change(screen.getByLabelText('Tolerancia 1'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar equivalencias' }));

    await waitFor(() => expect(adminApi.updateAdminMeasurementEquivalences.mock.calls[0][0]).toEqual({
      items: [{
        tipo_medida: 'dimension',
        pulgada: '1',
        mm_minimo: 23,
        mm_maximo: 26,
        categoria: null,
        tolerancia_mm: 1,
      }],
    }));
    expect(await screen.findByText('Equivalencias guardadas.')).toBeInTheDocument();
  });
});