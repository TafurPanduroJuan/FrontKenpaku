import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../admin/Dashboard';
import * as adminApi from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getAdminDashboard: vi.fn(),
  getAdminOrders: vi.fn(),
  getAdminActionRequired: vi.fn(),
}));

const item = (codigo, motivo) => ({
  id: `id-${codigo}`,
  codigo,
  cliente_nombre: 'Alexis Jair Maza',
  estado: 'pendiente',
  total: 100,
  motivo,
  created_at: '2026-10-13T10:00:00Z',
  fecha_limite_pago: null,
});

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getAdminDashboard.mockResolvedValue({
      pedidos_pendientes: 1,
      pedidos_hoy: 3,
      consultas_chat_hoy: 42,
      porcentaje_derivadas: 10,
    });
    adminApi.getAdminOrders.mockResolvedValue({
      items: [
        {
          id: 'o1',
          codigo: 'KPK-000001',
          cliente_nombre: 'Alexis Jair Maza',
          cliente_telefono: '987654321',
          recojo_en_tienda: false,
          estado: 'pendiente',
          total: 100,
        },
      ],
      total: 1,
      page: 1,
      page_size: 5,
    });
  });

  it('muestra las acciones agrupadas y los reclamos pendientes', async () => {
    adminApi.getAdminActionRequired.mockResolvedValue({
      flete_por_cotizar: [item('KPK-000010', 'Falta cotizar el flete')],
      voucher_por_validar: [item('KPK-000011', 'Voucher subido: validar el pago')],
      pedidos_por_vencer: [],
      reclamos_pendientes: 2,
      total_acciones: 4,
    });
    renderDashboard();

    expect(await screen.findByText('KPK-000010')).toBeInTheDocument();
    expect(screen.getByText('KPK-000011')).toBeInTheDocument();
    expect(screen.getByText('Flete por cotizar (1)')).toBeInTheDocument();
    expect(screen.getByText('Voucher por validar (1)')).toBeInTheDocument();
    expect(screen.queryByText(/Pedidos por vencer/)).not.toBeInTheDocument();
    expect(screen.getByText('2 reclamos pendientes')).toBeInTheDocument();
  });

  it('muestra el mensaje de todo al día cuando no hay acciones', async () => {
    adminApi.getAdminActionRequired.mockResolvedValue({
      flete_por_cotizar: [],
      voucher_por_validar: [],
      pedidos_por_vencer: [],
      reclamos_pendientes: 0,
      total_acciones: 0,
    });
    renderDashboard();

    expect(await screen.findByText(/Todo al día/)).toBeInTheDocument();
  });

  it('usa los campos reales del backend en métricas y últimos pedidos', async () => {
    adminApi.getAdminActionRequired.mockResolvedValue({
      flete_por_cotizar: [],
      voucher_por_validar: [],
      pedidos_por_vencer: [],
      reclamos_pendientes: 0,
      total_acciones: 0,
    });
    renderDashboard();

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByText('Alexis Jair Maza')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
    expect(adminApi.getAdminOrders).toHaveBeenCalledWith({ page: 1, page_size: 5 });
  });
});