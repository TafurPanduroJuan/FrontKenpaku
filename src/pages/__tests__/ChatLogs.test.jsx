import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatLogs } from '../admin/ChatLogs';
import * as adminApi from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getAdminChatLogs: vi.fn(),
}));

function renderChatLogs() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChatLogs />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ChatLogs admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('con una conversación de 3 mensajes (user, assistant, user), la tabla muestra el texto del ÚLTIMO mensaje y no el primero', async () => {
    const rawMessages = [
      {
        id: 'msg-1',
        id_conversacion: 'conv-12345678-uuid-full',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Primer mensaje: Hola, quisiera saber precios.',
        fuera_de_alcance: false,
      },
      {
        id: 'msg-2',
        id_conversacion: 'conv-12345678-uuid-full',
        timestamp: '2026-10-15T10:01:00Z',
        rol: 'assistant',
        mensaje_texto: 'Segundo mensaje: Claro, con gusto le ayudamos.',
        fuera_de_alcance: false,
      },
      {
        id: 'msg-3',
        id_conversacion: 'conv-12345678-uuid-full',
        timestamp: '2026-10-15T10:02:00Z',
        rol: 'user',
        mensaje_texto: 'Último mensaje: Perfecto, me llevo 10 tubos.',
        fuera_de_alcance: false,
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 3,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(await screen.findByText('Último mensaje')).toBeInTheDocument();
    expect(screen.getByText('Último mensaje: Perfecto, me llevo 10 tubos.')).toBeInTheDocument();
    expect(screen.queryByText('Primer mensaje: Hola, quisiera saber precios.')).not.toBeInTheDocument();

    const sessionCell = screen.getByText('conv-123');
    expect(sessionCell).toBeInTheDocument();
    expect(sessionCell).toHaveAttribute('title', 'conv-12345678-uuid-full');

    const lastMsgSpan = screen.getByTitle('Último mensaje: Perfecto, me llevo 10 tubos.');
    expect(lastMsgSpan).toBeInTheDocument();
    expect(lastMsgSpan).toHaveClass('line-clamp-2');

    // Botón con ícono Eye y aria-label
    expect(screen.getByRole('button', { name: 'Ver conversación' })).toBeInTheDocument();
  });

  it('la etiqueta de rol corresponde al último mensaje', async () => {
    const rawMessages = [
      {
        id: 'msg-1',
        id_conversacion: 'conv-assistant-last',
        timestamp: '2026-10-15T11:00:00Z',
        rol: 'user',
        mensaje_texto: '¿Tienen entrega inmediata?',
      },
      {
        id: 'msg-2',
        id_conversacion: 'conv-assistant-last',
        timestamp: '2026-10-15T11:05:00Z',
        rol: 'assistant',
        mensaje_texto: 'Sí, contamos con stock disponible para despacho hoy.',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 2,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(await screen.findByText('Sí, contamos con stock disponible para despacho hoy.')).toBeInTheDocument();
    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.queryByText('Cliente')).not.toBeInTheDocument();
  });

  it('el formato mock (sin mensajes) no rompe la tabla', async () => {
    const mockData = [
      {
        id: 'session-8921-test',
        fecha: '2026-10-06T11:00:00Z',
        mensajes_count: 4,
        handoff: false,
        resumen: 'Consulta sobre tipo de tubo para tijeral de 6 metros.',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: mockData,
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(
      await screen.findByText('Consulta sobre tipo de tubo para tijeral de 6 metros.')
    ).toBeInTheDocument();
    expect(screen.getByText('4 msgs')).toBeInTheDocument();
    expect(screen.queryByText('Cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Asistente')).not.toBeInTheDocument();
    expect(screen.getByText('session-')).toBeInTheDocument();
  });

  it('click en una fila abre el modal y muestra TODOS los mensajes en orden cronológico', async () => {
    const rawMessages = [
      {
        id: 'msg-3',
        id_conversacion: 'conv-ord-12345678',
        timestamp: '2026-10-15T10:04:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje C (tercero cronológicamente)',
      },
      {
        id: 'msg-1',
        id_conversacion: 'conv-ord-12345678',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje A (primero cronológicamente)',
      },
      {
        id: 'msg-2',
        id_conversacion: 'conv-ord-12345678',
        timestamp: '2026-10-15T10:02:00Z',
        rol: 'assistant',
        mensaje_texto: 'Mensaje B (segundo cronológicamente)',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 3,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    const row = await screen.findByText('conv-ord');
    fireEvent.click(row);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Conversación conv-ord')).toBeInTheDocument();
    expect(within(dialog).getByText(/3 mensajes/)).toBeInTheDocument();

    const textA = within(dialog).getByText('Mensaje A (primero cronológicamente)');
    const textB = within(dialog).getByText('Mensaje B (segundo cronológicamente)');
    const textC = within(dialog).getByText('Mensaje C (tercero cronológicamente)');

    expect(textA).toBeInTheDocument();
    expect(textB).toBeInTheDocument();
    expect(textC).toBeInTheDocument();

    // Comprobar orden cronológico en el DOM
    expect(textA.compareDocumentPosition(textB) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(textB.compareDocumentPosition(textC) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('el botón de cerrar (data-testid="modal-close-button") y la tecla Escape cierran el modal', async () => {
    const rawMessages = [
      {
        id: 'msg-1',
        id_conversacion: 'conv-close-test',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Probando cierre de modal',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    const sessionCell = await screen.findByText('conv-clo');
    fireEvent.click(sessionCell);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cerrar con el botón
    const closeBtn = screen.getByTestId('modal-close-button');
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Reabrir con tecla Enter sobre la fila
    const row = sessionCell.closest('tr');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Cerrar con tecla Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('la insignia "Fuera de alcance" aparece solo en el mensaje marcado', async () => {
    const rawMessages = [
      {
        id: 'msg-1',
        id_conversacion: 'conv-offtopic-test',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje en alcance: ¿tienen fierro corrugado?',
        fuera_de_alcance: false,
      },
      {
        id: 'msg-2',
        id_conversacion: 'conv-offtopic-test',
        timestamp: '2026-10-15T10:01:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje desubicado: ¿cuál es la capital de Francia?',
        fuera_de_alcance: true,
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 2,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    // Abrir modal usando el botón Eye
    const eyeBtn = await screen.findByRole('button', { name: 'Ver conversación' });
    fireEvent.click(eyeBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Dentro del modal solo el segundo mensaje debe tener la insignia
    const offtopicBadges = within(dialog).getAllByText('Fuera de alcance');
    expect(offtopicBadges).toHaveLength(1);
  });

  it('la insignia de intención aparece solo si la probabilidad es >= 0.5', async () => {
    const rawMessages = [
      {
        id: 'msg-1',
        id_conversacion: 'conv-intent-test',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Quiero consultar precios de tubos',
        intencion_modelo: 1, // Cotización
        probabilidad_modelo: 0.49, // menor que 0.5 -> NO debe aparecer
      },
      {
        id: 'msg-2',
        id_conversacion: 'conv-intent-test',
        timestamp: '2026-10-15T10:01:00Z',
        rol: 'user',
        mensaje_texto: 'Tengo un problema con el pedido anterior',
        intencion_modelo: 2, // Reclamo
        probabilidad_modelo: 0.85, // mayor o igual a 0.5 -> SÍ debe aparecer
      },
      {
        id: 'msg-3',
        id_conversacion: 'conv-intent-test',
        timestamp: '2026-10-15T10:02:00Z',
        rol: 'assistant',
        mensaje_texto: 'Lamentamos el inconveniente, déjeme verificar',
        intencion_modelo: 2,
        probabilidad_modelo: 0.9, // mensaje de asistente -> NO debe tener insignia de intención de cliente
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 3,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    const row = await screen.findByText('conv-int');
    fireEvent.click(row);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Cotización con 0.49 NO debe aparecer dentro del modal
    expect(within(dialog).queryByText(/Cotización/)).not.toBeInTheDocument();

    // Reclamo con 0.85 SÍ debe aparecer dentro del modal
    expect(within(dialog).getByText(/Reclamo · 85%/)).toBeInTheDocument();
  });

  it('el caso mock muestra el aviso sin errores', async () => {
    const mockData = [
      {
        id: 'session-demo-mock-99',
        fecha: '2026-10-06T11:00:00Z',
        mensajes_count: 5,
        handoff: false,
        resumen: 'Consulta mock sin mensajes reales.',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: mockData,
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    const row = await screen.findByText('session-');
    fireEvent.click(row);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Conversación session-')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Esta sesión de demostración no tiene el detalle de mensajes.')
    ).toBeInTheDocument();
  });

  it('con total: 45, page_size: 20 se muestra "Página 1 de 3"; Siguiente pide page: 2 a getAdminChatLogs', async () => {
    const rawMessages = [
      {
        id: 'msg-p1',
        id_conversacion: 'conv-page-1234',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje de prueba paginación',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 45,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();
    expect(adminApi.getAdminChatLogs).toHaveBeenCalledWith({ page: 1 });

    const prevBtn = screen.getByRole('button', { name: 'Anterior' });
    const nextBtn = screen.getByRole('button', { name: 'Siguiente' });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);

    expect(adminApi.getAdminChatLogs).toHaveBeenCalledWith({ page: 2 });
  });

  it('cambiar el filtro de alcance reinicia a la página 1', async () => {
    const rawMessages = [
      {
        id: 'msg-p1',
        id_conversacion: 'conv-filter-page',
        timestamp: '2026-10-15T10:00:00Z',
        rol: 'user',
        mensaje_texto: 'Mensaje filtro página',
      },
    ];

    adminApi.getAdminChatLogs.mockResolvedValue({
      items: rawMessages,
      total: 50,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: 'Siguiente' });
    fireEvent.click(nextBtn);

    expect(adminApi.getAdminChatLogs).toHaveBeenCalledWith({ page: 2 });

    const inscopeBtn = screen.getByRole('button', { name: 'En alcance' });
    fireEvent.click(inscopeBtn);

    expect(adminApi.getAdminChatLogs).toHaveBeenCalledWith({
      page: 1,
      fuera_de_alcance: false,
    });
  });

  it('se muestra la nota con los 90 días', async () => {
    adminApi.getAdminChatLogs.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
    });

    renderChatLogs();

    expect(
      await screen.findByText(/Las conversaciones se eliminan automáticamente tras 90 días sin actividad\./)
    ).toBeInTheDocument();
  });
});
