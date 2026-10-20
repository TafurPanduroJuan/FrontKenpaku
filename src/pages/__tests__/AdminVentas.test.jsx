import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminVentas } from '../admin/AdminVentas';
import * as adminApi from '../../api/admin';
import * as excelUtil from '../../utils/exportSalesToExcel';

vi.mock('../../api/admin', () => ({
  getAdminOrders: vi.fn(),
}));

vi.mock('../../utils/exportSalesToExcel', () => ({
  exportSalesToExcel: vi.fn(),
}));

describe('AdminVentas Component - Reporte de Ventas', () => {
  const mockOrders = [
    {
      id: 'ord-001',
      codigo: 'KPK-000001',
      cliente_nombre: 'Carlos Sanchez',
      cliente_telefono: '987654321',
      cliente_correo: 'carlos@example.com',
      recojo_en_tienda: false,
      direccion: 'Av. Industrial 450, Los Olivos',
      canal: 'web',
      observaciones: 'Pago: Transferencia BCP',
      subtotal: 120.00,
      igv: 21.60,
      costo_flete: 30.00,
      total: 171.60,
      estado: 'confirmado',
      created_at: '2026-10-20T10:00:00Z',
      items: [
        { nombre: 'Tubo galvanizado redondo 1 1/2"', cantidad: 2, precio_unitario: 60.00 }
      ]
    },
    {
      id: 'ord-002',
      codigo: 'KPK-000002',
      cliente_nombre: 'Constructora Lima S.A.C.',
      cliente_telefono: '912345678',
      cliente_correo: 'contacto@constructora.pe',
      recojo_en_tienda: true,
      direccion: null,
      canal: 'pos_tienda',
      observaciones: '[VENTA MOSTRADOR] FACTURA | Doc: 20601234567 | Pago: EFECTIVO (Recibido: S/ 80.00 - Vuelto: S/ 5.00)',
      subtotal: 63.56,
      igv: 11.44,
      costo_flete: 0,
      total: 75.00,
      estado: 'entregado',
      created_at: '2026-10-20T11:30:00Z',
      items: [
        { nombre: 'Plancha LAC 2 mm', cantidad: 1, precio_unitario: 75.00 }
      ]
    },
    {
      id: 'ord-003',
      codigo: 'KPK-000003',
      cliente_nombre: 'María Rodriguez',
      cliente_telefono: '998877665',
      cliente_correo: 'maria@example.com',
      recojo_en_tienda: true,
      direccion: null,
      canal: 'web',
      observaciones: 'Pago: YAPE | Comprobante BOLETA',
      subtotal: 250.00,
      igv: 45.00,
      costo_flete: 0,
      total: 295.00,
      estado: 'registrado',
      created_at: '2026-10-20T14:15:00Z',
      items: [
        { nombre: 'Platina de fierro 2" x 1/4"', cantidad: 3, precio_unitario: 83.33 }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getAdminOrders.mockResolvedValue({
      items: mockOrders,
      total: 3
    });
    excelUtil.exportSalesToExcel.mockReturnValue({
      success: true,
      count: 3,
      fileName: 'Reporte_Ventas_Kenpaku.xlsx'
    });
  });

  it('renders sales dashboard with dynamic KPI cards and orders table', async () => {
    render(<AdminVentas />);

    expect(screen.getByRole('heading', { name: /Reporte de Ventas/i, level: 2 })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('KPK-000001')).toBeInTheDocument();
      expect(screen.getByText('KPK-000002')).toBeInTheDocument();
      expect(screen.getByText('KPK-000003')).toBeInTheDocument();
    });

    // Validar KPIs
    expect(screen.getByText(/Total Facturado/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Transacciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Ticket Promedio/i)).toBeInTheDocument();
    expect(screen.getByText(/Físico vs Virtual/i)).toBeInTheDocument();
  });

  it('filters sales by channel (Web vs Mostrador)', async () => {
    render(<AdminVentas />);

    await waitFor(() => {
      expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    });

    // Seleccionar canal "Caja POS"
    const canalSelect = screen.getByDisplayValue(/Todos los canales/i);
    fireEvent.change(canalSelect, { target: { value: 'mostrador' } });

    expect(screen.getByText('KPK-000002')).toBeInTheDocument();
    expect(screen.queryByText('KPK-000001')).not.toBeInTheDocument();
    expect(screen.queryByText('KPK-000003')).not.toBeInTheDocument();
  });

  it('filters sales with quick preset for amounts > S/ 100', async () => {
    render(<AdminVentas />);

    await waitFor(() => {
      expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    });

    // Clic en botón preset > S/ 100
    const btnMayor100 = screen.getByRole('button', { name: /> S\/ 100/i });
    fireEvent.click(btnMayor100);

    expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    expect(screen.getByText('KPK-000003')).toBeInTheDocument();
    expect(screen.queryByText('KPK-000002')).not.toBeInTheDocument();
  });

  it('filters sales by delivery mode (Recojo vs Despacho)', async () => {
    render(<AdminVentas />);

    await waitFor(() => {
      expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    });

    // Seleccionar modalidad "Despacho a Obra"
    const entregaSelect = screen.getByDisplayValue(/Todas las entregas/i);
    fireEvent.change(entregaSelect, { target: { value: 'despacho' } });

    expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    expect(screen.queryByText('KPK-000002')).not.toBeInTheDocument();
    expect(screen.queryByText('KPK-000003')).not.toBeInTheDocument();
  });

  it('exports filtered sales to Excel when clicking Exportar a Excel', async () => {
    render(<AdminVentas />);

    await waitFor(() => {
      expect(screen.getByText('KPK-000001')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Exportar a Excel/i });
    expect(exportBtn).toBeInTheDocument();

    fireEvent.click(exportBtn);

    expect(excelUtil.exportSalesToExcel).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Se descargó el archivo/i)).toBeInTheDocument();
  });

  it('opens detail modal when clicking Detalle button on a sale', async () => {
    render(<AdminVentas />);

    await waitFor(() => {
      expect(screen.getByText('KPK-000003')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByRole('button', { name: /Detalle/i });
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText(/Detalle de Venta • KPK-000003/i)).toBeInTheDocument();
    expect(screen.getByText(/Platina de fierro 2" x 1\/4"/i)).toBeInTheDocument();
  });
});
