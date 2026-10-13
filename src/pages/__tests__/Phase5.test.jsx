import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingPage } from '../TrackingPage';
import { Orders } from '../admin/Orders';
import * as ordersApi from '../../api/orders';
import * as adminApi from '../../api/admin';

vi.mock('../../api/orders', () => ({
  getOrderTracking: vi.fn(),
  submitFleteDecision: vi.fn(),
  uploadOrderVoucher: vi.fn(),
}));

vi.mock('../../api/admin', () => ({
  getAdminOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  triggerScheduledTasks: vi.fn(),
}));

describe('Phase 5: Automatización con Tareas Programadas (Cron) - Frontend Tests', () => {
  let queryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const mockActiveOrder = {
    codigo: 'KPK-202610-CRON',
    estado: 'pendiente',
    recojo_en_tienda: false,
    subtotal: 500.0,
    igv: 90.0,
    costo_flete: 0.0,
    total: 590.0,
    tracking_token: 'token_cron_test',
    fecha_limite_pago: '2026-10-14T12:00:00Z',
    created_at: '2026-10-12T12:00:00Z',
    items: [{ nombre: 'Tubo Estructural 2x2', cantidad: 4, precio_unitario: 125 }],
    events: [],
    cliente_resumen: 'Alexis M.',
  };

  it('renders 48-hour stock reservation active banner on TrackingPage for pending orders', async () => {
    ordersApi.getOrderTracking.mockResolvedValueOnce(mockActiveOrder);

    render(
      <MemoryRouter initialEntries={['/seguimiento?token=token_cron_test']}>
        <TrackingPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Reserva de Stock Garantizada por 48 Horas')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText(/Tus perfiles y planchas de acero se encuentran temporalmente apartados/i)).toBeInTheDocument();
  });

  it('renders Cron trigger and +48h simulation buttons in Admin Orders page', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [mockActiveOrder],
      total: 1,
      page: 1,
      page_size: 12,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Gestión de Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Ejecutar Cron')).toBeInTheDocument();
    expect(screen.getByText('Simular +48h')).toBeInTheDocument();
  });

  it('calls triggerScheduledTasks(0) and shows toast when clicking Ejecutar Cron', async () => {
    adminApi.getAdminOrders.mockResolvedValue({
      items: [mockActiveOrder],
      total: 1,
      page: 1,
      page_size: 12,
    });

    adminApi.triggerScheduledTasks.mockResolvedValueOnce({
      success: true,
      recordatorios_enviados: 1,
      pedidos_cancelados_por_vencimiento: 0,
      stock_liberado_items: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const btnCron = await screen.findByText('Ejecutar Cron');
    fireEvent.click(btnCron);

    await waitFor(() => {
      expect(adminApi.triggerScheduledTasks).toHaveBeenCalledWith({ simulate_hours: 0 });
    });

    expect(await screen.findByText(/1 recordatorio\(s\)/i)).toBeInTheDocument();
  });

  it('calls triggerScheduledTasks(49) and shows toast when clicking Simular +48h Demo', async () => {
    adminApi.getAdminOrders.mockResolvedValue({
      items: [mockActiveOrder],
      total: 1,
      page: 1,
      page_size: 12,
    });

    adminApi.triggerScheduledTasks.mockResolvedValueOnce({
      success: true,
      recordatorios_enviados: 0,
      pedidos_cancelados_por_vencimiento: 2,
      stock_liberado_items: 6,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const btnSimulate = await screen.findByText('Simular +48h');
    fireEvent.click(btnSimulate);

    await waitFor(() => {
      expect(adminApi.triggerScheduledTasks).toHaveBeenCalledWith({ simulate_hours: 49 });
    });

    expect(await screen.findByText(/2 cancelado\(s\) por 48h/i)).toBeInTheDocument();
  });
});
