import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Checkout } from '../Checkout';
import { CartContext } from '../../context/CartContext';

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
  it('disables the "Registrar pedido" submit button until the privacy policy checkbox is checked', () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Registrar pedido/i });
    expect(submitBtn).toBeDisabled();

    const checkbox = screen.getByRole('checkbox', { id: 'acepto_privacidad_checkbox' });
    expect(checkbox).not.toBeChecked();
  });
});
