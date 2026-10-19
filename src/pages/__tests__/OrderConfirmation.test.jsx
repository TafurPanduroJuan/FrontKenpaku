import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderConfirmation } from '../OrderConfirmation';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/orders', () => ({
  getOrderTracking: vi.fn(),
}));

describe('OrderConfirmation Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order confirmation successfully when orderData is in location.state', () => {
    const mockOrder = {
      codigo: 'KPK-000999',
      estado: 'confirmado',
      subtotal: 100,
      igv: 18,
      total: 118,
      items: [
        { nombre: 'Tubo Redondo 2 pulg', cantidad: 1, precio_unitario: 100, subtotal: 100 }
      ],
      whatsapp_url: 'https://wa.me/51999999999'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/pedido/KPK-000999', state: { orderData: mockOrder } }]}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('¡Pedido Registrado con Éxito!')).toBeInTheDocument();
    expect(screen.getByText('KPK-000999')).toBeInTheDocument();
    expect(screen.getByText('Tubo Redondo 2 pulg')).toBeInTheDocument();
  });

  it('renders fallback state with link to seguimiento when no orderData is available', () => {
    render(
      <MemoryRouter initialEntries={['/pedido/KPK-000888']}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/no se pudieron recuperar los datos de tu pedido/i)).toBeInTheDocument();
    const btnLink = screen.getByRole('link', { name: /buscar mi pedido/i });
    expect(btnLink).toHaveAttribute('href', '/seguimiento?codigo=KPK-000888');
  });

  it('fetches tracking info and displays order when token is in URL', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce({
      codigo: 'KPK-000777',
      estado: 'pendiente',
      subtotal: 50,
      igv: 9,
      total: 59,
      items: [],
      tracking_token: 'secret_tok_777'
    });

    render(
      <MemoryRouter initialEntries={['/pedido/KPK-000777?token=secret_tok_777']}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('KPK-000777')).toBeInTheDocument();
    expect(screen.getByText('¡Pedido Registrado con Éxito!')).toBeInTheDocument();
  });

  it('renders payment confirmed banner and hides upload form when order is confirmed', () => {
    const confirmedOrder = {
      codigo: 'KPK-000555',
      estado: 'confirmado',
      recojo_en_tienda: true,
      subtotal: 100,
      igv: 18,
      total: 118,
      items: [],
      whatsapp_url: 'https://wa.me/51999999999',
      fecha_pago: '2026-10-18T10:00:00Z',
      voucher_referencia: 'vouchers/test.jpg'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/pedido/KPK-000555', state: { orderData: confirmedOrder } }]}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('¡Pago Validado y Confirmado por Caja!')).toBeInTheDocument();
    expect(screen.getByText('Tu abono ha sido verificado con éxito')).toBeInTheDocument();
    // Dropzone / upload button should NOT be present
    expect(screen.queryByText(/subir comprobante\(s\) de pago/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/haz clic para seleccionar tu\(s\) comprobante\(s\)/i)).not.toBeInTheDocument();
  });

  it('locks voucher upload and shows in-review banner when voucher has been uploaded but not yet confirmed', () => {
    const orderWithVoucher = {
      codigo: 'KPK-000444',
      estado: 'pendiente',
      recojo_en_tienda: true,
      subtotal: 100,
      igv: 18,
      total: 118,
      items: [],
      whatsapp_url: 'https://wa.me/51999999999',
      voucher_referencia: 'vouchers/pending.png',
      fecha_pago: '2026-10-18T11:00:00Z'
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/pedido/KPK-000444', state: { orderData: orderWithVoucher } }]}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Comprobante en Revisión por Caja')).toBeInTheDocument();
    expect(screen.getByText('¡Comprobante de Pago Recibido!')).toBeInTheDocument();
    expect(screen.getByText(/comprobante registrado en el pedido/i)).toBeInTheDocument();
    // Dropzone / upload button must be locked / not rendered
    expect(screen.queryByText(/subir comprobante\(s\) de pago/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/haz clic para seleccionar tu\(s\) comprobante\(s\)/i)).not.toBeInTheDocument();
  });

  it('renders synchronized 6-phase stepper for despacho con flete', () => {
    const despachoOrder = {
      codigo: 'KPK-000333',
      estado: 'flete_cotizado',
      estado_flete: 'cotizado',
      costo_flete: 45.0,
      recojo_en_tienda: false,
      direccion: 'Av. Las Palmeras 123, Los Olivos',
      subtotal: 200,
      igv: 36,
      total: 281,
      items: []
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/pedido/KPK-000333', state: { orderData: despachoOrder } }]}>
        <Routes>
          <Route path="/pedido/:codigo" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Cotización Flete')).toBeInTheDocument();
    expect(screen.getByText('Pedido en Camino')).toBeInTheDocument();
    expect(screen.getByText('Entregado Conforme')).toBeInTheDocument();
  });
});
