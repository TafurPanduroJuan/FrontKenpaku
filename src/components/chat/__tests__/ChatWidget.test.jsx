import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ChatWidget } from '../ChatWidget';
import { CartProvider } from '../../../context/CartContext';
import { sendChatMessage } from '../../../api/chat';

vi.mock('../../../api/chat', () => ({ sendChatMessage: vi.fn() }));

describe('ChatWidget AI virtual advisor component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    sendChatMessage.mockResolvedValue({
      conversation_id: 'conversation-1',
      reply: 'Recibí tu lista.',
      products: [],
    });
  });

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

  it('limits message input to 1500 characters', () => {
    render(
      <CartProvider>
        <ChatWidget />
      </CartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Abrir Asesor Virtual de IA/i }));

    const input = screen.getByPlaceholderText(/Escribe tu consulta o lista de materiales/i);
    expect(input).toBeInTheDocument();

    const longString = 'a'.repeat(1600);
    fireEvent.change(input, { target: { value: longString } });

    expect(input.value.length).toBe(1500);
  });

  it('keeps Shift+Enter as a newline and sends on Enter', async () => {
    render(
      <CartProvider>
        <ChatWidget />
      </CartProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Abrir Asesor Virtual de IA/i }));
    const input = screen.getByPlaceholderText(/Escribe tu consulta o lista de materiales/i);
    fireEvent.change(input, { target: { value: '10 tubos cuadrados\n5 planchas LAC' } });

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(sendChatMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(sendChatMessage).toHaveBeenCalledWith(expect.objectContaining({
      message: '10 tubos cuadrados\n5 planchas LAC',
    })));
  });

  it('always shows the WhatsApp advisor button with a wa.me link', () => {
    render(
      <CartProvider>
        <ChatWidget />
      </CartProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Abrir Asesor Virtual de IA/i }));

    const link = screen.getByTestId('chat-whatsapp-button');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//);
  });
});