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
});
