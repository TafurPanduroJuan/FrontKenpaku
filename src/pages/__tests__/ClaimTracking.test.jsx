import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ClaimTracking } from '../ClaimTracking';
import * as claimsApi from '../../api/claims';

vi.mock('../../api/claims', () => ({
  getClaimTracking: vi.fn(),
  sendClaimReply: vi.fn(),
}));

function renderWithClient(ui, { initialEntries = ['/seguimiento-reclamo'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/seguimiento-reclamo" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ClaimTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('precarga el código desde ?codigo= en la URL', () => {
    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-2026-9999'],
    });

    const codigoInput = screen.getByLabelText(/código de reclamación/i);
    expect(codigoInput.value).toBe('RC-2026-9999');

    const docInput = screen.getByLabelText(/número de documento/i);
    expect(docInput.value).toBe('');
  });

  it('consulta exitosa muestra estado, fecha límite y mensajes en orden', async () => {
    claimsApi.getClaimTracking.mockResolvedValueOnce({
      codigo_seguimiento: 'RC-2026-000100',
      tipo: 'reclamo',
      estado: 'en_proceso',
      fecha: '2026-10-05T14:20:00Z',
      fecha_limite: '2026-10-26T23:59:59Z',
      dias_habiles_restantes: 10,
      descripcion_bien: 'Tubo de acero 2"',
      mensajes: [
        {
          autor: 'cliente',
          texto: 'Primer mensaje del cliente',
          created_at: '2026-10-05T14:25:00Z',
        },
        {
          autor: 'admin',
          texto: 'Respuesta de la empresa',
          created_at: '2026-10-06T09:00:00Z',
        },
      ],
    });

    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-2026-000100'],
    });

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '45891234' } });

    const submitBtn = screen.getByRole('button', { name: /consultar reclamo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('claim-details')).toBeInTheDocument();
    });

    expect(screen.getByText('RC-2026-000100')).toBeInTheDocument();
    expect(screen.getByText(/En Proceso/i)).toBeInTheDocument();
    expect(screen.getByText(/10 días hábiles restantes/i)).toBeInTheDocument();
    expect(screen.getByText('Tubo de acero 2"')).toBeInTheDocument();

    // Mensajes y sus remitentes
    expect(screen.getByText('Primer mensaje del cliente')).toBeInTheDocument();
    expect(screen.getByText('Respuesta de la empresa')).toBeInTheDocument();
    expect(screen.getByText('Comercial Kenpaku')).toBeInTheDocument();
    expect(screen.getByText('Tú')).toBeInTheDocument();
  });

  it('404 muestra mensaje de error amigable', async () => {
    const error404 = new Error('Not found');
    error404.response = { status: 404, data: { detail: 'Not found' } };
    claimsApi.getClaimTracking.mockRejectedValueOnce(error404);

    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-INVALID'],
    });

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '00000000' } });

    const submitBtn = screen.getByRole('button', { name: /consultar reclamo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('No encontramos un reclamo con esos datos. Revisa el código y tu documento.')
      ).toBeInTheDocument();
    });
  });

  it('con estado atendido muestra botones de conformidad y llamar a "Estoy conforme" envía conforme: true', async () => {
    claimsApi.getClaimTracking.mockResolvedValueOnce({
      codigo_seguimiento: 'RC-2026-000100',
      tipo: 'reclamo',
      estado: 'atendido',
      fecha: '2026-10-05T14:20:00Z',
      fecha_limite: '2026-10-26T23:59:59Z',
      dias_habiles_restantes: null,
      descripcion_bien: 'Tubo de acero 2"',
      mensajes: [
        {
          autor: 'admin',
          texto: 'Estimado cliente, su pedido de cambio ha sido aprobado.',
          created_at: '2026-10-06T09:00:00Z',
        },
      ],
    });

    claimsApi.sendClaimReply.mockResolvedValueOnce({
      codigo_seguimiento: 'RC-2026-000100',
      tipo: 'reclamo',
      estado: 'atendido',
      fecha: '2026-10-05T14:20:00Z',
      fecha_limite: '2026-10-26T23:59:59Z',
      dias_habiles_restantes: null,
      descripcion_bien: 'Tubo de acero 2"',
      mensajes: [
        {
          autor: 'admin',
          texto: 'Estimado cliente, su pedido de cambio ha sido aprobado.',
          created_at: '2026-10-06T09:00:00Z',
        },
        {
          autor: 'cliente',
          texto: 'Estoy conforme con la respuesta recibida.',
          created_at: '2026-10-06T10:00:00Z',
        },
      ],
    });

    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-2026-000100'],
    });

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '45891234' } });

    const submitBtn = screen.getByRole('button', { name: /consultar reclamo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Estoy conforme')).toBeInTheDocument();
      expect(screen.getByText('No estoy conforme')).toBeInTheDocument();
    });

    const btnConforme = screen.getByText('Estoy conforme');
    fireEvent.click(btnConforme);

    await waitFor(() => {
      expect(claimsApi.sendClaimReply).toHaveBeenCalledWith({
        codigo: 'RC-2026-000100',
        documento: '45891234',
        texto: 'Estoy conforme con la respuesta recibida.',
        conforme: true,
      });
    });
  });

  it('"No estoy conforme" sin texto no envía la respuesta', async () => {
    claimsApi.getClaimTracking.mockResolvedValueOnce({
      codigo_seguimiento: 'RC-2026-000100',
      tipo: 'reclamo',
      estado: 'atendido',
      fecha: '2026-10-05T14:20:00Z',
      fecha_limite: '2026-10-26T23:59:59Z',
      dias_habiles_restantes: null,
      descripcion_bien: 'Tubo de acero 2"',
      mensajes: [],
    });

    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-2026-000100'],
    });

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '45891234' } });

    const submitBtn = screen.getByRole('button', { name: /consultar reclamo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('No estoy conforme')).toBeInTheDocument();
    });

    const btnNoConforme = screen.getByText('No estoy conforme');
    fireEvent.click(btnNoConforme);

    expect(claimsApi.sendClaimReply).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Por favor ingresa un mensaje explicando el motivo de tu disconformidad/i)
    ).toBeInTheDocument();
  });

  it('el documento no se almacena en localStorage ni en la URL', async () => {
    claimsApi.getClaimTracking.mockResolvedValueOnce({
      codigo_seguimiento: 'RC-2026-000100',
      tipo: 'reclamo',
      estado: 'en_proceso',
      fecha: '2026-10-05T14:20:00Z',
      fecha_limite: '2026-10-26T23:59:59Z',
      dias_habiles_restantes: 5,
      descripcion_bien: 'Plancha LAC',
      mensajes: [],
    });

    renderWithClient(<ClaimTracking />, {
      initialEntries: ['/seguimiento-reclamo?codigo=RC-2026-000100'],
    });

    const docInput = screen.getByLabelText(/número de documento/i);
    fireEvent.change(docInput, { target: { value: '87654321' } });

    const submitBtn = screen.getByRole('button', { name: /consultar reclamo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('claim-details')).toBeInTheDocument();
    });

    // Validar que no está en localStorage
    expect(localStorage.getItem('documento')).toBeNull();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      expect(localStorage.getItem(key)).not.toContain('87654321');
    }

    // Validar que window.location no contiene el documento
    expect(window.location.search).not.toContain('87654321');
  });
});
