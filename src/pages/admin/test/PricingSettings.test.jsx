import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PricingSettings } from '../PricingSettings';
import * as adminApi from '../../../api/admin';

vi.mock('../../../api/admin', () => ({
  getAdminPricingSettings: vi.fn(),
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
});