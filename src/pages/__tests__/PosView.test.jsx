import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosView } from '../cajero/PosView';
import { AuthContext } from '../../context/AuthContext';
import * as productsApi from '../../api/products';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/products', () => ({
  getProducts: vi.fn()
}));

vi.mock('../../api/orders', () => ({
  createOrder: vi.fn()
}));

const mockProducts = [
  {
    id: 'prod-1',
    nombre: 'Tubo negro redondo 2 pulg x 6 m',
    categoria: 'tubos',
    acabado: 'negro',
    medida: '2 pulg x 6 m',
    precio_unitario: 50.00,
    stock_disponible: 25,
    descripcion_corta: 'Tubo de acero para estructuras'
  },
  {
    id: 'prod-2',
    nombre: 'Plancha estriada LAC 1.5 mm',
    categoria: 'planchas',
    acabado: 'ninguno',
    medida: '1.2 x 2.4 m',
    precio_unitario: 120.00,
    stock_disponible: 8,
    descripcion_corta: 'Plancha antideslizante'
  }
];

describe('PosView Component - Cajero Punto de Venta', () => {
  const authValue = {
    isAuthenticated: true,
    role: 'cajero',
    email: 'cajero@kenpaku.pe',
    isAdmin: false,
    isCajero: true,
    logout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productsApi.getProducts.mockResolvedValue({
      items: mockProducts,
      total: 2,
      page: 1,
      page_size: 100
    });
  });

  const renderPos = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <PosView />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders POS split-screen layout with product catalog on the left and receipt panel on the right', async () => {
    renderPos();

    expect(screen.getByText(/Catálogo de Productos de Tienda/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprobante de Venta/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tubo negro redondo 2 pulg x 6 m')).toBeInTheDocument();
      expect(screen.getByText('Plancha estriada LAC 1.5 mm')).toBeInTheDocument();
    });
  });

  it('adds product to the ticket and updates subtotal and total', async () => {
    renderPos();

    await waitFor(() => {
      expect(screen.getByText('Tubo negro redondo 2 pulg x 6 m')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /Agregar/i });
    fireEvent.click(addButtons[0]);

    // Check item appears in ticket
    expect(screen.getByText('1 items')).toBeInTheDocument();
    expect(screen.getAllByText('S/ 50.00').length).toBeGreaterThan(0);
  });

  it('switches between Boleta and Factura and updates input labels', async () => {
    renderPos();

    const facturaBtn = screen.getByRole('button', { name: /Factura con RUC/i });
    fireEvent.click(facturaBtn);

    expect(screen.getByText(/RUC de la Empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/Razón Social/i)).toBeInTheDocument();

    const boletaBtn = screen.getByRole('button', { name: /Boleta de Venta/i });
    fireEvent.click(boletaBtn);

    expect(screen.getByText(/Nombres \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Apellidos \*/i)).toBeInTheDocument();
    expect(screen.getByText(/DNI del Cliente/i)).toBeInTheDocument();
  });

  it('calculates change (vuelto) when Efectivo is selected and amount received is entered', async () => {
    renderPos();

    await waitFor(() => {
      expect(screen.getByText('Tubo negro redondo 2 pulg x 6 m')).toBeInTheDocument();
    });

    // Add product of S/ 50.00
    const addButtons = screen.getAllByRole('button', { name: /Agregar/i });
    fireEvent.click(addButtons[0]);

    // Select Efectivo
    const efectivoBtn = screen.getByRole('button', { name: /Efectivo/i });
    fireEvent.click(efectivoBtn);

    // Enter S/ 100 received
    const montoInput = screen.getByTestId('monto-efectivo-input');
    fireEvent.change(montoInput, { target: { value: '100' } });

    // Vuelto should be S/ 50.00
    await waitFor(() => {
      expect(screen.getByText(/VUELTO A ENTREGAR:/i)).toBeInTheDocument();
      expect(screen.getAllByText('S/ 50.00').length).toBeGreaterThan(0);
    });
  });

  it('processes sale successfully and opens receipt modal', async () => {
    ordersApi.createOrder.mockResolvedValue({
      codigo: 'KPK-000150',
      total: 50.00
    });

    renderPos();

    await waitFor(() => {
      expect(screen.getByText('Tubo negro redondo 2 pulg x 6 m')).toBeInTheDocument();
    });

    // Add product
    const addButtons = screen.getAllByRole('button', { name: /Agregar/i });
    fireEvent.click(addButtons[0]);

    // Enter customer names, last names, and required DNI
    const nombresInput = screen.getByPlaceholderText(/Ej\. Juan Carlos/i);
    fireEvent.change(nombresInput, { target: { value: 'Pedro' } });
    const apellidosInput = screen.getByPlaceholderText(/Ej\. Perez Gomez/i);
    fireEvent.change(apellidosInput, { target: { value: 'Garcia Lopez' } });
    const dniInput = screen.getByPlaceholderText(/Ej\. 72819231/i);
    fireEvent.change(dniInput, { target: { value: '72819231' } });

    // Select Yape payment method
    const yapeBtn = screen.getByRole('button', { name: /Yape/i });
    fireEvent.click(yapeBtn);

    // Click Emitir Comprobante
    const submitBtn = screen.getByRole('button', { name: /Emitir Comprobante/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ordersApi.createOrder).toHaveBeenCalled();
      expect(screen.getByText(/Venta Emitida con Éxito/i)).toBeInTheDocument();
      expect(screen.getByText(/Imprimir Ticket/i)).toBeInTheDocument();
    });
  });
});
