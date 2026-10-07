import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, CartContext } from '../CartContext';

const TestComponent = () => {
  const { items, addToCart, removeFromCart, itemCount, total, clearCart } = React.useContext(CartContext);
  return (
    <div>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="total">{total}</span>
      <button
        data-testid="add-btn"
        onClick={() =>
          addToCart({ id: 'p1', nombre: 'Tubo Test', precio_unitario: 100, stock_disponible: 10 }, 2)
        }
      >
        Agregar
      </button>
      <button data-testid="remove-btn" onClick={() => removeFromCart('p1')}>
        Quitar
      </button>
      <button data-testid="clear-btn" onClick={clearCart}>
        Limpiar
      </button>
      <ul data-testid="items-list">
        {items.map((i) => (
          <li key={i.product.id}>{i.product.nombre} - Cantidad: {i.cantidad}</li>
        ))}
      </ul>
    </div>
  );
};

describe('CartContext unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows adding items to cart and computes itemCount and totals correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');

    act(() => {
      screen.getByTestId('add-btn').click();
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    expect(screen.getByTestId('total')).toHaveTextContent('200');
  });

  it('allows removing items from cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId('add-btn').click();
    });
    expect(screen.getByTestId('item-count')).toHaveTextContent('2');

    act(() => {
      screen.getByTestId('remove-btn').click();
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });
});
