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

  it('opening order detail modal displays the Fase Operativa Actual at the top and closes with modal-close-button', async () => {
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

    // Order detail modal opens with Fase Operativa Actual at top
    expect(await screen.findByText('Gestión de Pedido KPK-000033')).toBeInTheDocument();
    expect(screen.getByText('Fase Operativa Actual')).toBeInTheDocument();
    expect(screen.getByText('Progreso del Flujo de Fases:')).toBeInTheDocument();

    // Now close order detail modal using the top close button (X)
    const cerrarModalBtn = screen.getByTestId('modal-close-button');
    fireEvent.click(cerrarModalBtn);

    await waitFor(() => {
      expect(screen.queryByText('Gestión de Pedido KPK-000033')).not.toBeInTheDocument();
    });
  });

  it('highlights orders requiring freight quote with "Cotización Pendiente" badge and "Cotizar Flete" action button', async () => {
    const freightOrder = {
      id: 'ord-freight',
      codigo: 'KPK-000099',
      cliente_nombre: 'Constructora Lima Norte',
      cliente_telefono: '999888777',
      cliente_dni: '20123456789',
      estado: 'pendiente',
      estado_flete: 'sin_cotizar',
      recojo_en_tienda: false,
      costo_flete: 0,
      subtotal: 350.0,
      igv: 63.0,
      total: 413.0,
      items: [
        {
          nombre: 'Bolsa de Cemento Andino',
          cantidad: 10,
          precio_unitario: 35.0,
        },
      ],
      created_at: '2026-10-18T19:00:00Z',
      order_events: [],
    };

    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [freightOrder],
      total: 1,
      page: 1,
      page_size: 12,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CajeroOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('KPK-000099')).toBeInTheDocument();
    });

    // Should display the prominent "Cotización Pendiente" badge
    expect(screen.getByText('Cotización Pendiente')).toBeInTheDocument();

    // Should render the emphasized "Cotizar Flete" action button instead of generic "Ver Detalle"
    const cotizarBtn = screen.getByRole('button', { name: /cotizar flete/i });
    expect(cotizarBtn).toBeInTheDocument();

    // Clicking "Cotizar Flete" opens the modal and displays the freight quotation banner
    fireEvent.click(cotizarBtn);

    expect(await screen.findByText(/Cotización de Flete Pendiente Requerida/i)).toBeInTheDocument();
    expect(screen.getByText('Cotizar Flete Ahora')).toBeInTheDocument();
  });

  it('renders multiple vouchers (2 vouchers) in cashier modal when customer uploaded multiple receipts', async () => {
    const multiVoucherOrder = {
      id: 'ord-multi',
      codigo: 'KPK-000088',
      cliente_nombre: 'Juan Perez',
      cliente_telefono: '988776655',
      cliente_dni: '44556677',
      estado: 'pendiente',
      recojo_en_tienda: true,
      costo_flete: 0,
      subtotal: 500.0,
      igv: 90.0,
      total: 590.0,
      voucher_referencia: 'https://supabase.co/voucher1.png, /api/orders/voucher/voucher2.pdf',
      fecha_pago: '2026-10-18T19:15:00Z',
      items: [],
      created_at: '2026-10-18T19:10:00Z',
      order_events: [],
    };

    adminApi.getAdminOrders.mockResolvedValueOnce({
      items: [multiVoucherOrder],
      total: 1,
      page: 1,
      page_size: 12,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CajeroOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('KPK-000088')).toBeInTheDocument();
    });

    // Click "Verificar Pago"
    const verificarBtn = screen.getByRole('button', { name: /verificar pago/i });
    fireEvent.click(verificarBtn);

    // Modal opens and shows "2 Comprobantes" count badge
    expect(await screen.findByText('2 Comprobantes')).toBeInTheDocument();
    expect(screen.getByText('Comprobante #1')).toBeInTheDocument();
    expect(screen.getByText('Comprobante #2')).toBeInTheDocument();

    // Check that both complete opening links are rendered
    const abrirCompletoLinks = screen.getAllByRole('link', { name: /abrir completo/i });
    expect(abrirCompletoLinks).toHaveLength(2);
  });
});
