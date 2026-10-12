import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingPage } from '../TrackingPage';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/orders', () => ({
  getOrderTracking: vi.fn(),
  createOrder: vi.fn(),
}));

describe('TrackingPage Component - Phase 2 Public Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the tracking search form by default with code and phone inputs', () => {
    render(
      <MemoryRouter initialEntries={['/seguimiento']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Consulta el Estado de tu Pedido')).toBeInTheDocument();
    expect(screen.getByLabelText(/código de pedido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono celular registrado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /consultar estado/i })).toBeInTheDocument();
  });

  it('validates empty inputs before triggering API request', () => {
    render(
      <MemoryRouter initialEntries={['/seguimiento']}>
        <TrackingPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /consultar estado/i }));

    expect(screen.getByText(/por favor ingrese tanto el código de pedido/i)).toBeInTheDocument();
    expect(ordersApi.getOrderTracking).not.toHaveBeenCalled();
  });

  it('auto-fetches order details and renders visual stepper when a secret token is in URL', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce({
      codigo: 'KPK-000005',
      estado: 'confirmado',
      recojo_en_tienda: false,
      subtotal: 300.0,
      igv: 54.0,
      costo_flete: 35.0,
      estado_flete: 'cotizado',
      total: 389.0,
      tracking_token: 'kpk_valid_secret_token_123',
      created_at: '2026-10-10T14:30:00.000Z',
      items: [
        {
          nombre: 'Tubo Redondo LAC 2 pulg',
          cantidad: 2,
          precio_unitario: 150.0,
        },
      ],
      events: [
        {
          estado_nuevo: 'pendiente',
          nota: 'Pedido registrado en web',
          created_at: '2026-10-10T14:30:00.000Z',
        },
        {
          estado_nuevo: 'confirmado',
          nota: 'Depósito validado y stock reservado',
          created_at: '2026-10-10T15:00:00.000Z',
        },
      ],
      whatsapp_url: 'https://wa.me/51999999999?text=Hola',
      cliente_resumen: 'Carlos M.',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=kpk_valid_secret_token_123']}>
        <TrackingPage />
      </MemoryRouter>
    );

    // Should call API with token
    await waitFor(() => {
      expect(ordersApi.getOrderTracking).toHaveBeenCalledWith({
        token: 'kpk_valid_secret_token_123',
        codigo: undefined,
        telefono: undefined,
      });
    });

    // Verify order details rendered
    expect(await screen.findByText('KPK-000005')).toBeInTheDocument();
    expect(screen.getByText('Carlos M.')).toBeInTheDocument();
    expect(screen.getByText('Tubo Redondo LAC 2 pulg')).toBeInTheDocument();
    expect(screen.getByText('Línea de Tiempo del Pedido')).toBeInTheDocument();
    expect(screen.getByText('Consultar este Pedido por WhatsApp')).toBeInTheDocument();
  });

  it('searches by code and phone successfully and saves recent order to localStorage', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce({
      codigo: 'KPK-000006',
      estado: 'listo_para_recojo',
      recojo_en_tienda: true,
      subtotal: 100.0,
      igv: 18.0,
      costo_flete: 0,
      estado_flete: 'sin_flete',
      total: 118.0,
      tracking_token: 'kpk_token_666',
      created_at: '2026-10-10T16:00:00.000Z',
      items: [],
      events: [],
      cliente_resumen: 'Lucía F.',
    });

    render(
      <MemoryRouter initialEntries={['/seguimiento']}>
        <TrackingPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/código de pedido/i), {
      target: { value: 'KPK-000006' },
    });
    fireEvent.change(screen.getByLabelText(/teléfono celular registrado/i), {
      target: { value: '987654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: /consultar estado/i }));

    expect(await screen.findByText('KPK-000006')).toBeInTheDocument();
    expect(screen.getByText('Lucía F.')).toBeInTheDocument();
    expect(screen.getByText('Recojo en Almacén')).toBeInTheDocument();

    // Check localStorage saved
    const saved = JSON.parse(localStorage.getItem('kenpaku_recent_orders') || '[]');
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].codigo).toBe('KPK-000006');
  });
});
