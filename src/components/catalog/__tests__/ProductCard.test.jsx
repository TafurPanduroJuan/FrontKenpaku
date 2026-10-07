import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from '../ProductCard';
import { CartProvider } from '../../../context/CartContext';

const mockProductInStock = {
  id: 'prod-001',
  nombre: 'Tubo Negro Estructural 2"',
  categoria: 'tubos',
  acabado: 'negro',
  medida: '2 pulgadas',
  espesor: '2.0 mm',
  precio_unitario: 128.90,
  stock_disponible: 10,
  stock_estado: 'disponible',
  imagen_url: 'http://example.com/image.jpg'
};

const mockProductOutOfStock = {
  ...mockProductInStock,
  id: 'prod-004',
  stock_disponible: 0,
  stock_estado: 'agotado'
};

describe('ProductCard component', () => {
  it('renders product details and enabled Add button when in stock', () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <ProductCard product={mockProductInStock} />
        </CartProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Tubo Negro Estructural/i)).toBeInTheDocument();
    expect(screen.getByText('S/ 128.90')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Agregar/i });
    expect(addBtn).not.toBeDisabled();
  });

  it('disables the Add button when product is out of stock (agotado)', () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <ProductCard product={mockProductOutOfStock} />
        </CartProvider>
      </BrowserRouter>
    );

    const disabledBtn = screen.getByRole('button', { name: /Agotado/i });
    expect(disabledBtn).toBeDisabled();
  });
});
