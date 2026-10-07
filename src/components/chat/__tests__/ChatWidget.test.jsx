import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatWidget } from '../ChatWidget';
import { CartProvider } from '../../../context/CartContext';

describe('ChatWidget AI virtual advisor component', () => {
  it('opens chat window and displays permanent AI banner and initial suggestions', () => {
    render(
      <CartProvider>
        <ChatWidget />
      </CartProvider>
    );

    const openBtn = screen.getByRole('button', { name: /Abrir Asesor Virtual de IA/i });
    fireEvent.click(openBtn);

    expect(screen.getByText(/Asesor IA Kenpaku/i)).toBeInTheDocument();
    expect(screen.getByText(/Estás conversando con un Asesor Virtual basado en Inteligencia Artificial/i)).toBeInTheDocument();
    expect(screen.getByText(/El asesor orienta tu compra, pero no reemplaza a un ingeniero/i)).toBeInTheDocument();
  });

  it('limits message input to 500 characters', () => {
    render(
      <CartProvider>
        <ChatWidget />
      </CartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Abrir Asesor Virtual de IA/i }));

    const input = screen.getByPlaceholderText(/Escribe tu consulta sobre acero/i);
    expect(input).toBeInTheDocument();

    const longString = 'a'.repeat(600);
    fireEvent.change(input, { target: { value: longString } });

    expect(input.value.length).toBe(500);
  });
});
