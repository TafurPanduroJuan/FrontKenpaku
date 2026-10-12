import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingPage } from '../TrackingPage';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/orders', () => ({
  getOrderTracking: vi.fn(),
  submitFleteDecision: vi.fn(),
  uploadOrderVoucher: vi.fn(),
  createOrder: vi.fn(),
}));

describe('Phase 4: Flete y Pago con Voucher - Frontend Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  const mockOrderFleteCotizado = {
    codigo: 'KPK-202610-FLETE',
    estado: 'flete_cotizado',
    recojo_en_tienda: false,
    subtotal: 1000.0,
    igv: 180.0,
    costo_flete: 65.0,
    estado_flete: 'cotizado',
    total: 1245.0,
    tracking_token: 'token_flete_test',
    created_at: '2026-10-11T12:00:00Z',
    items: [{ nombre: 'Fierro Corrugado 1/2 pulg', cantidad: 10, precio_unitario: 100 }],
    events: [],
    cliente_resumen: 'Alexis M.',
  };

  it('renders the Flete Decision card with accept and reject buttons when flete is cotizado', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce(mockOrderFleteCotizado);

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Aprobación de Cotización de Flete a Obra')).toBeInTheDocument();
    expect(screen.getAllByText('S/ 65.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Aceptar Flete y Proceder al Pago')).toBeInTheDocument();
    expect(screen.getByText('Rechazar o Coordinar Flete')).toBeInTheDocument();
  });

  it('calls submitFleteDecision when clicking accept button', async () => {
    ordersApi.getOrderTracking.mockResolvedValue(mockOrderFleteCotizado);
    ordersApi.submitFleteDecision.mockResolvedValueOnce({ ok: true, estado_flete: 'aceptado' });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    const acceptBtn = await screen.findByTestId('flete-accept-btn');
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(ordersApi.submitFleteDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          decision: 'aceptar',
          token: 'token_flete_test',
        })
      );
    });
  });

  it('renders bank accounts and allows switching tabs to see account details', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce({
      ...mockOrderFleteCotizado,
      estado_flete: 'aceptado',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Cuentas de Abono y Subida de Comprobante')).toBeInTheDocument();
    expect(screen.getByText('Yape / Plin')).toBeInTheDocument();
    expect(screen.getByText('BCP Soles')).toBeInTheDocument();
    expect(screen.getByText('BBVA Soles')).toBeInTheDocument();

    // Switch to BCP tab
    fireEvent.click(screen.getByText('BCP Soles'));
    expect(screen.getByText('191-2345678-0-12')).toBeInTheDocument();
  });

  it('allows file selection and voucher submission', async () => {
    ordersApi.getOrderTracking.mockResolvedValue(mockOrderFleteCotizado);
    ordersApi.uploadOrderVoucher.mockResolvedValueOnce({
      ok: true,
      voucher_url: '/api/orders/voucher/test.jpg',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    await screen.findByText('Cuentas de Abono y Subida de Comprobante');

    const file = new File(['fake-voucher-image'], 'voucher.png', { type: 'image/png' });
    const input = screen.getByTestId('voucher-input');

    fireEvent.change(input, { target: { files: [file] } });

    const submitBtn = await screen.findByTestId('voucher-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ordersApi.uploadOrderVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token_flete_test',
          file,
        })
      );
    });
  });

  it('renders uploaded voucher status banner when order has voucher_referencia', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce({
      ...mockOrderFleteCotizado,
      voucher_referencia: 'https://supabase.co/storage/v1/object/public/vouchers/voucher_123.jpg',
      fecha_pago: '2026-10-11T13:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Comprobante de Pago Registrado')).toBeInTheDocument();
    expect(screen.getByText('Ver Comprobante')).toBeInTheDocument();
  });

  it('displays the admin freight quote note inside the flete decision card', async () => {
    ordersApi.getOrderTracking.mockResolvedValue({
      ...mockOrderFleteCotizado,
      events: [
        {
          estado_nuevo: 'flete_cotizado',
          nota: 'Camión plataforma de 5TN, entrega a pie de obra en Av. Trapiche',
          created_at: '2026-10-11T12:30:00Z',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Condiciones y Detalle de Cotización/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Camión plataforma de 5TN/i).length).toBeGreaterThan(0);
  });

  it('hides bank accounts and file dropzone when order is already confirmed / en preparacion', async () => {
    ordersApi.getOrderTracking.mockResolvedValue({
      ...mockOrderFleteCotizado,
      estado: 'confirmado',
      voucher_referencia: 'https://supabase.co/storage/v1/object/public/vouchers/voucher_123.jpg',
      fecha_pago: '2026-10-11T13:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_flete_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    // Should display the confirmed payment banner
    expect(await screen.findByText('Pago Validado por Caja — Pedido en Preparación')).toBeInTheDocument();
    expect(screen.getByText('Ver Comprobante Validado')).toBeInTheDocument();

    // Should NOT show the bank accounts or voucher upload input
    expect(screen.queryByText('Cuentas de Abono y Subida de Comprobante')).not.toBeInTheDocument();
    expect(screen.queryByTestId('voucher-input')).not.toBeInTheDocument();
  });
});
