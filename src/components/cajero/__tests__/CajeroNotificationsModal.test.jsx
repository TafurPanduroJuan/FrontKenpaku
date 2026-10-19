import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CajeroNotificationsModal } from '../CajeroNotificationsModal';

describe('CajeroNotificationsModal Component', () => {
  const mockNotifications = [
    {
      id: 'notif-PED-001-flete-pendiente',
      order_codigo: 'PED-001',
      tipo: 'flete_pendiente',
      badge: 'Flete Pendiente',
      titulo: 'Pedido PED-001 • Requiere Flete',
      descripcion: 'Juan Perez • Destino: Av. Los Rosales 123 • Total: S/ 450.00',
      cliente_nombre: 'Juan Perez',
      total: 450,
      fecha: new Date().toISOString(),
      leido: false,
      urgente: true
    },
    {
      id: 'notif-PED-002-voucher-subido',
      order_codigo: 'PED-002',
      tipo: 'voucher_subido',
      badge: 'Voucher por Validar',
      titulo: 'Voucher Subido • Pedido PED-002',
      descripcion: 'Maria Lopez cargó su comprobante • Total: S/ 280.00',
      cliente_nombre: 'Maria Lopez',
      total: 280,
      fecha: new Date().toISOString(),
      leido: false,
      urgente: true
    },
    {
      id: 'notif-PED-003-flete-aceptado',
      order_codigo: 'PED-003',
      tipo: 'flete_aceptado',
      badge: 'Flete Aceptado',
      titulo: 'Flete Aceptado • Pedido PED-003',
      descripcion: 'Carlos Ruiz aceptó el flete • Total: S/ 920.00',
      cliente_nombre: 'Carlos Ruiz',
      total: 920,
      fecha: new Date().toISOString(),
      leido: true,
      urgente: false
    }
  ];

  it('renders modal with notification cards and counts correctly', () => {
    render(
      <CajeroNotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        onMarkAllAsRead={vi.fn()}
        onToggleRead={vi.fn()}
        onClearRead={vi.fn()}
        onSelectOrder={vi.fn()}
      />
    );

    expect(screen.getByText(/Centro de Notificaciones de Caja/i)).toBeInTheDocument();
    expect(screen.getByText(/Pedido PED-001 • Requiere Flete/i)).toBeInTheDocument();
    expect(screen.getByText(/Voucher Subido • Pedido PED-002/i)).toBeInTheDocument();
    expect(screen.getByText(/Flete Aceptado • Pedido PED-003/i)).toBeInTheDocument();
    expect(screen.getByText(/de 3 notificaciones/i)).toBeInTheDocument();
  });

  it('filters notifications correctly when clicking tabs', () => {
    render(
      <CajeroNotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        onMarkAllAsRead={vi.fn()}
        onToggleRead={vi.fn()}
        onClearRead={vi.fn()}
        onSelectOrder={vi.fn()}
      />
    );

    // Tab "No leídas" (should show only 2 items)
    fireEvent.click(screen.getByRole('button', { name: /No leídas/i }));
    expect(screen.getByText(/Pedido PED-001 • Requiere Flete/i)).toBeInTheDocument();
    expect(screen.getByText(/Voucher Subido • Pedido PED-002/i)).toBeInTheDocument();
    expect(screen.queryByText(/Flete Aceptado • Pedido PED-003/i)).not.toBeInTheDocument();

    // Tab "Vouchers" (should show only PED-002)
    fireEvent.click(screen.getByRole('button', { name: /Vouchers/i }));
    expect(screen.getByText(/Voucher Subido • Pedido PED-002/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pedido PED-001 • Requiere Flete/i)).not.toBeInTheDocument();
  });

  it('calls onSelectOrder when "Atender Pedido" is clicked', () => {
    const handleSelectOrder = vi.fn();
    render(
      <CajeroNotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        onMarkAllAsRead={vi.fn()}
        onToggleRead={vi.fn()}
        onClearRead={vi.fn()}
        onSelectOrder={handleSelectOrder}
      />
    );

    const atenderButtons = screen.getAllByRole('button', { name: /Atender Pedido/i });
    expect(atenderButtons.length).toBeGreaterThan(0);
    fireEvent.click(atenderButtons[0]);

    expect(handleSelectOrder).toHaveBeenCalledWith('PED-001', 'notif-PED-001-flete-pendiente');
  });

  it('calls onMarkAllAsRead when "Marcar todas leídas" is clicked', () => {
    const handleMarkAllAsRead = vi.fn();
    render(
      <CajeroNotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onToggleRead={vi.fn()}
        onClearRead={vi.fn()}
        onSelectOrder={vi.fn()}
      />
    );

    const markAllBtn = screen.getByRole('button', { name: /Marcar todas leídas/i });
    fireEvent.click(markAllBtn);
    expect(handleMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleRead when the eye icon button is clicked', () => {
    const handleToggleRead = vi.fn();
    render(
      <CajeroNotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        notifications={mockNotifications}
        onMarkAllAsRead={vi.fn()}
        onToggleRead={handleToggleRead}
        onSelectOrder={vi.fn()}
      />
    );

    const toggleBtn = screen.getAllByTitle(/Marcar como/i)[0];
    fireEvent.click(toggleBtn);
    expect(handleToggleRead).toHaveBeenCalledWith('notif-PED-001-flete-pendiente');
  });
});
