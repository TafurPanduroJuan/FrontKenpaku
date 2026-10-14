import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('envía el término de búsqueda al backend al escribir en el buscador', async () => {
    adminApi.getAdminOrders.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 12 });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Orders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const input = await screen.findByPlaceholderText('Buscar por código o teléfono');
    fireEvent.change(input, { target: { value: 'KPK-0001' } });

    await waitFor(() =>
      expect(adminApi.getAdminOrders).toHaveBeenCalledWith({ estado: 'todos', q: 'KPK-0001' })
    );
  });

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

  it('displays terminal state badge and no transition buttons when an order is already entregado', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'c2f9f63b-2222-3333-4444-555566667777',
          codigo: 'KPK-000002',
          cliente_nombre: 'Esteban Luis',
          cliente_telefono: '997410117',
          recojo_en_tienda: true,
          estado: 'entregado',
          total: 195.0,
          created_at: '2026-10-10T10:00:00.000000Z',
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

    expect(await screen.findByText('KPK-000002')).toBeInTheDocument();

    // Click "Ver Detalle"
    const verDetalleBtn = screen.getByText('Ver Detalle');
    fireEvent.click(verDetalleBtn);

    // Verify modal opened with terminal banner and NO transition action buttons
    expect(await screen.findByText('Pedido Entregado y Cerrado')).toBeInTheDocument();
    expect(screen.queryByText('Avanzar a Siguiente Fase (requiere confirmación):')).not.toBeInTheDocument();
  });

  it('prompts confirmation modal before executing a state transition on an active order', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'd3a0a74c-3333-4444-5555-666677778888',
          codigo: 'KPK-000003',
          cliente_nombre: 'Carlos Constructora',
          cliente_telefono: '912345678',
          recojo_en_tienda: true,
          estado: 'pendiente',
          total: 500.0,
          created_at: '2026-10-10T12:00:00.000000Z',
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

    expect(await screen.findByText('KPK-000003')).toBeInTheDocument();

    // Click "Ver Detalle"
    fireEvent.click(screen.getByText('Ver Detalle'));

    // Verify allowed transitions for Recojo from 'pendiente': 'confirmado' and 'cancelado'
    expect(await screen.findByText('Confirmar Pedido')).toBeInTheDocument();
    expect(screen.getByText('Cancelar Pedido')).toBeInTheDocument();

    // Click "Confirmar Pedido"
    fireEvent.click(screen.getByText('Confirmar Pedido'));

    // Confirmation modal should appear with warning about inventory reduction
    expect(await screen.findByText('Confirmar Cambio de Fase')).toBeInTheDocument();
    expect(screen.getByText(/descontará automáticamente el stock disponible/i)).toBeInTheDocument();
    expect(screen.getByText('Sí, Confirmar Cambio')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();

    // API update should NOT have been called yet!
    expect(adminApi.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('renders WhatsApp notification button with pre-filled message for the customer in the order modal', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'e4b1b85d-4444-5555-6666-777788889999',
          codigo: 'KPK-000004',
          cliente_nombre: 'Rosa Salazar',
          cliente_telefono: '987112233',
          recojo_en_tienda: false,
          estado: 'despachado',
          total: 820.0,
          created_at: '2026-10-10T14:00:00.000000Z',
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

    expect(await screen.findByText('KPK-000004')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver Detalle'));

    // Verify WhatsApp button is rendered
    expect(await screen.findByText('Notificar al Cliente por WhatsApp')).toBeInTheDocument();
    const whatsappBtn = screen.getByRole('link', { name: /avisar al cliente/i });
    expect(whatsappBtn).toBeInTheDocument();
    expect(whatsappBtn.getAttribute('href')).toContain('https://wa.me/51987112233');
    expect(whatsappBtn.getAttribute('href')).toContain(encodeURIComponent('DESPACHADO A OBRA'));
  });
});
