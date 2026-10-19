import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Checkout } from '../Checkout';
import { CartContext } from '../../context/CartContext';
import * as ordersApi from '../../api/orders';

vi.mock('../../api/orders', () => ({
  createOrder: vi.fn(),
}));

const mockCartContextValue = {
  items: [
    {
      product: {
        id: 'p1',
        nombre: 'Tubo Negro Estructural 2"',
        precio_unitario: 128.9,
        stock_disponible: 10
      },
      cantidad: 2
    }
  ],
  subtotal: 218.47,
  igv: 39.33,
  total: 257.8,
  clearCart: vi.fn()
};

describe('Checkout page unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCheckout = () => {
    return render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );
  };

  it('does NOT display static restriction texts under inputs before the user writes', () => {
    renderCheckout();

    // Verificación: No hay textos grises de restricción estáticos visibles inicialmente
    expect(screen.queryByText(/Solo letras y espacios \(sin números ni símbolos especiales\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Exactamente 9 dígitos numéricos \(comenzando con 9\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Formato: usuario@dominio.com/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Obligatorio para despacho a obra \(mínimo 5 caracteres\)/i)).not.toBeInTheDocument();
  });

  it('disables the "Registrar pedido" submit button until the privacy policy checkbox is checked', () => {
    renderCheckout();

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    expect(submitBtn).toBeDisabled();

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(submitBtn).not.toBeDisabled();
  });

  it('blocks numbers and special characters in nombres and apellidos while typing', () => {
    renderCheckout();

    const nombresInput = screen.getByLabelText(/^Nombres \*/i);
    fireEvent.change(nombresInput, { target: { value: 'Juan123 #$! Carlos' } });
    expect(nombresInput.value).toBe('Juan  Carlos');

    const apellidosInput = screen.getByLabelText(/^Apellidos \*/i);
    fireEvent.change(apellidosInput, { target: { value: 'Pérez456 %& Tafur' } });
    expect(apellidosInput.value).toBe('Pérez  Tafur');
  });

  it('blocks non-digits in DNI and limits to 8 digits', () => {
    renderCheckout();

    const dniInput = screen.getByLabelText(/^DNI \*/i);
    fireEvent.change(dniInput, { target: { value: 'abc-12345678-extra99' } });
    expect(dniInput.value).toBe('12345678');
  });

  it('blocks letters and symbols in phone while typing up to 9 digits', () => {
    renderCheckout();

    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: 'abc-987-654-321-extra-000' } });

    // Bloqueado en tiempo real: solo 9 dígitos numéricos
    expect(phoneInput.value).toBe('987654321');
  });

  it('shows error when phone does not start with 9 when submitting or saving', async () => {
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/^Nombres \*/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/^Apellidos \*/i), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByLabelText(/^DNI \*/i), { target: { value: '12345678' } });

    // Número de 9 dígitos pero que NO empieza con 9
    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: '887654321' } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'juan@ejemplo.com' } });

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/El número de teléfono o WhatsApp debe empezar con 9/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error when phone has fewer than 9 digits on save', async () => {
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/^Nombres \*/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/^Apellidos \*/i), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByLabelText(/^DNI \*/i), { target: { value: '12345678' } });

    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: '98765' } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'juan@ejemplo.com' } });

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/El teléfono debe tener exactamente 9 dígitos \(ingresó 5\)/i)
      ).toBeInTheDocument();
    });
  });

  it('shows dynamic validation error when email is missing @ or has invalid domain', async () => {
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/^Nombres \*/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/^Apellidos \*/i), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByLabelText(/^DNI \*/i), { target: { value: '12345678' } });

    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: '987654321' } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'cliente-sin-arroba' } });

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/El correo debe incluir el símbolo '@'/i)
      ).toBeInTheDocument();
    });
  });

  it('validates mandatory address for despacho a obra when submitting empty address', async () => {
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/^Nombres \*/i), { target: { value: 'Juan Carlos' } });
    fireEvent.change(screen.getByLabelText(/^Apellidos \*/i), { target: { value: 'Perez Tafur' } });
    fireEvent.change(screen.getByLabelText(/^DNI \*/i), { target: { value: '12345678' } });

    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: '987654321' } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'juan@ejemplo.com' } });

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/La dirección de entrega es obligatoria para despacho a obra/i)).toBeInTheDocument();
    });
    expect(ordersApi.createOrder).not.toHaveBeenCalled();
  });

  it('allows order completion in recojo en tienda without requiring address or observaciones', async () => {
    ordersApi.createOrder.mockResolvedValueOnce({
      codigo: 'KPK-TEST01',
      tracking_token: 'secret-token-123',
      total: 257.8
    });

    renderCheckout();

    fireEvent.change(screen.getByLabelText(/^Nombres \*/i), { target: { value: 'María' } });
    fireEvent.change(screen.getByLabelText(/^Apellidos \*/i), { target: { value: 'López Prado' } });
    fireEvent.change(screen.getByLabelText(/^DNI \*/i), { target: { value: '87654321' } });

    const phoneInput = screen.getByLabelText(/Teléfono o WhatsApp/i);
    fireEvent.change(phoneInput, { target: { value: '912345678' } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, { target: { value: 'maria@ejemplo.com' } });

    // Switch to Recojo en Tienda
    const recojoRadio = screen.getByDisplayValue('recojo');
    fireEvent.click(recojoRadio);

    // Verify address field is hidden and store pickup information is displayed
    expect(screen.queryByLabelText(/Dirección de entrega en obra/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Punto de Retiro: Almacén Central Puente Piedra/i)).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ordersApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: {
            nombre: 'María López Prado',
            telefono: '912345678',
            correo: 'maria@ejemplo.com'
          },
          recojo_en_tienda: true,
          direccion: null,
          observaciones: '[DNI: 87654321]',
          acepto_privacidad: true
        })
      );
    });
  });
});
