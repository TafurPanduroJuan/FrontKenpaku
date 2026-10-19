import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CajeroOrders } from '../cajero/CajeroOrders';
import * as adminApi from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getAdminOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  triggerScheduledTasks: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const mockOrders = [
  {
    id: 'ord-1',
    codigo: 'KPK-000033',
    cliente_nombre: 'Alexis Jair Maza',
    cliente_telefono: '987654321',
    cliente_dni: '72819283',
    estado: 'confirmado',
    recojo_en_tienda: false,
    costo_flete: 50.0,
    subtotal: 152.0,
    igv: 27.36,
    total: 202.0,
    items: [
      {
        nombre: 'Tubo galvanizado redondo 1 1/2" x 6 m',
        cantidad: 1,
        precio_unitario: 152.0
      }
    ],
    created_at: '2026-10-18T18:41:00Z',
    order_events: []
  },
  {
    id: 'ord-2',
    codigo: 'KPK-000034',
    cliente_nombre: 'Maria Flores',
    cliente_telefono: '912345678',
    cliente_dni: '45678912',
    estado: 'pendiente',
    recojo_en_tienda: true,
    costo_flete: 0,
    subtotal: 100.0,
    igv: 18.0,
    total: 118.0,
    items: [],
    created_at: '2026-10-18T18:45:00Z',
    order_events: []
  }
];

describe('CajeroOrders Ver Boleta Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders "Ver Boleta" button next to "Ver Detalle" for confirmed orders, but not for pending orders', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: mockOrders,
      total: 2,
      page: 1,
      page_size: 12
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CajeroOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Both orders should display their action buttons
    await waitFor(() => {
      expect(screen.getByText('KPK-000033')).toBeInTheDocument();
      expect(screen.getByText('KPK-000034')).toBeInTheDocument();
    });

    // "Ver Boleta" should only appear for KPK-000033 (confirmado)
    const verBoletaButtons = screen.getAllByRole('button', { name: /ver boleta/i });
    expect(verBoletaButtons).toHaveLength(1);

    // Both should have "Ver Detalle"
    const verDetalleButtons = screen.getAllByRole('button', { name: /ver detalle/i });
    expect(verDetalleButtons).toHaveLength(2);
  });

  it('clicking "Ver Boleta" directly from table opens ReceiptModal with thermal ticket preview', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: mockOrders,
      total: 2,
      page: 1,
      page_size: 12
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CajeroOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('KPK-000033')).toBeInTheDocument();
    });

    const verBoletaBtn = screen.getByRole('button', { name: /ver boleta/i });
    fireEvent.click(verBoletaBtn);

    // Boleta modal should now be open
    expect(await screen.findByText('Boleta de Venta Electrónica')).toBeInTheDocument();
    expect(screen.getByText('Imprimir Boleta')).toBeInTheDocument();
    expect(screen.getByText('Descargar Boleta')).toBeInTheDocument();
    expect(screen.getByText('Flete / Transporte a Obra:')).toBeInTheDocument();

    // Closing boleta closes it cleanly
    const cerrarVistaBtn = screen.getByRole('button', { name: /cerrar vista/i });
    fireEvent.click(cerrarVistaBtn);

    await waitFor(() => {
      expect(screen.queryByText('Boleta de Venta Electrónica')).not.toBeInTheDocument();
    });
  });

  it('opening order detail and clicking "Ver / Imprimir Boleta" shows boleta and allows closing boleta without exiting details', async () => {
    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: mockOrders,
      total: 2,
      page: 1,
      page_size: 12
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CajeroOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('KPK-000033')).toBeInTheDocument();
    });

    // Click "Ver Detalle" on KPK-000033
    const verDetalleButtons = screen.getAllByRole('button', { name: /ver detalle/i });
    fireEvent.click(verDetalleButtons[0]);

    // Order detail modal opens
    expect(await screen.findByText('Gestión de Pedido KPK-000033')).toBeInTheDocument();

    // Inside detail modal, find "Ver / Imprimir Boleta"
    const verImprimirBoletaBtn = screen.getByRole('button', { name: /ver \/ imprimir boleta/i });
    fireEvent.click(verImprimirBoletaBtn);

    // Boleta modal opens
    expect(await screen.findByText('Boleta de Venta Electrónica')).toBeInTheDocument();

    // Close boleta modal
    const cerrarVistaBtn = screen.getByRole('button', { name: /cerrar vista/i });
    fireEvent.click(cerrarVistaBtn);

    // Boleta closes, but Order Details modal stays open
    await waitFor(() => {
      expect(screen.queryByText('Boleta de Venta Electrónica')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Gestión de Pedido KPK-000033')).toBeInTheDocument();

    // Now close order detail modal
    const cerrarVentanaBtn = screen.getByTestId('modal-bottom-close-button');
    fireEvent.click(cerrarVentanaBtn);

    await waitFor(() => {
      expect(screen.queryByText('Gestión de Pedido KPK-000033')).not.toBeInTheDocument();
    });
  });
});
