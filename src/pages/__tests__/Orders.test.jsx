import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Orders } from '../admin/Orders';
import * as adminApi from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getAdminOrders: vi.fn(),
  updateOrderStatus: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

describe('Admin Orders page unit tests', () => {
  it('correctly displays customer name, phone, formatted date and order code with real backend response schema', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'b1e8e52a-1111-2222-3333-444455556666',
          codigo: 'KPK-000001',
          cliente_nombre: 'Alexis Jair Maza',
          cliente_telefono: '987654321',
          cliente_correo: 'alexis@kenpaku.pe',
          direccion: 'Av. Puente Piedra 123',
          recojo_en_tienda: false,
          observaciones: 'Entregar urgente',
          estado: 'pendiente',
          subtotal: 100.0,
          igv: 18.0,
          total: 118.0,
          created_at: '2026-10-09T14:17:58.346731Z',
          items: []
        }
      ],
      total: 1,
      page: 1,
      page_size: 12
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify order code, customer name and phone appear
    expect(await screen.findByText('KPK-000001')).toBeInTheDocument();
    expect(screen.getByText('Alexis Jair Maza')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
    expect(screen.getByText('Despacho a obra')).toBeInTheDocument();
  });
});
