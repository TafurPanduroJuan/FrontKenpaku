import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClaimsAdmin } from '../admin/ClaimsAdmin';
import * as adminApi from '../../api/admin';

vi.mock('../../api/admin', () => ({
  getAdminClaims: vi.fn(),
  getAdminClaimDetail: vi.fn(),
  replyAdminClaim: vi.fn(),
  updateAdminClaimStatus: vi.fn(),
}));

const sampleClaim = {
  id: 'claim-123',
  codigo_seguimiento: 'RC-2026-000100',
  nombre: 'Carlos Mendoza',
  documento: '45891234',
  telefono: '912345678',
  correo: 'carlos@ejemplo.com',
  direccion: 'Jr. Los Olivos 345, Puente Piedra',
  tipo_bien: 'producto',
  monto_reclamado: 150.0,
  descripcion_bien: 'Tubo 2 pulgadas',
  tipo: 'reclamo',
  detalle: 'Tubo doblado en el centro',
  pedido_consumidor: 'Cambio de producto',
  fecha: '2026-10-05T14:20:00Z',
  estado: 'pendiente',
  fecha_limite: '2026-10-26T23:59:59Z',
  dias_habiles_restantes: -2,
  mensajes_count: 2,
};

const sampleClaimDetail = {
  ...sampleClaim,
  mensajes: [
    {
      id: 'm1',
      autor: 'cliente',
      canal: 'web',
      texto: 'Primer mensaje: reclamo inicial del cliente',
      created_at: '2026-10-05T15:00:00Z',
    },
    {
      id: 'm2',
      autor: 'admin',
      canal: 'panel',
      texto: 'Segundo mensaje: respuesta del administrador',
      created_at: '2026-10-06T10:00:00Z',
    },
  ],
};

function renderClaimsAdmin() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClaimsAdmin />
    </QueryClientProvider>
  );
}

describe('ClaimsAdmin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la tabla muestra el badge de estado y Vencido hace 2 días háb. cuando dias_habiles_restantes = -2', async () => {
    adminApi.getAdminClaims.mockResolvedValue({
      items: [sampleClaim],
      total: 1,
      page: 1,
      page_size: 20,
    });

    renderClaimsAdmin();

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Vencido hace 2 días háb.')).toBeInTheDocument();
  });

  it('abrir el modal muestra los mensajes del detalle en orden', async () => {
    adminApi.getAdminClaims.mockResolvedValue({
      items: [sampleClaim],
      total: 1,
      page: 1,
      page_size: 20,
    });
    adminApi.getAdminClaimDetail.mockResolvedValue(sampleClaimDetail);

    renderClaimsAdmin();

    const verBtn = await screen.findByText('Ver Reclamación');
    fireEvent.click(verBtn);

    expect(
      await screen.findByText('Hoja de Reclamación RC-2026-000100')
    ).toBeInTheDocument();

    const msg1 = await screen.findByText('Primer mensaje: reclamo inicial del cliente');
    const msg2 = screen.getByText('Segundo mensaje: respuesta del administrador');
    expect(msg1).toBeInTheDocument();
    expect(msg2).toBeInTheDocument();

    // Comprobar orden cronológico en el DOM
    expect(msg1.compareDocumentPosition(msg2)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('el botón Enviar está deshabilitado con menos de 10 caracteres y habilitado con 10 o más; al enviar llama a replyAdminClaim con { texto, estado, enviar_correo }', async () => {
    adminApi.getAdminClaims.mockResolvedValue({
      items: [sampleClaim],
      total: 1,
      page: 1,
      page_size: 20,
    });
    adminApi.getAdminClaimDetail.mockResolvedValue(sampleClaimDetail);
    adminApi.replyAdminClaim.mockResolvedValue({
      ...sampleClaimDetail,
      mensajes: [
        ...sampleClaimDetail.mensajes,
        {
          id: 'm3',
          autor: 'admin',
          canal: 'panel',
          texto: 'Estimado cliente, su reclamo está en revisión técnica.',
          created_at: new Date().toISOString(),
        },
      ],
    });

    renderClaimsAdmin();

    fireEvent.click(await screen.findByText('Ver Reclamación'));

    const textarea = await screen.findByPlaceholderText(
      /Escriba su respuesta formal al consumidor/i
    );
    const submitBtn = screen.getByRole('button', { name: /Enviar respuesta/i });

    // Deshabilitado inicialmente (< 10 caracteres)
    expect(submitBtn).toBeDisabled();

    // Deshabilitado con menos de 10 caracteres
    fireEvent.change(textarea, { target: { value: 'Hola 123' } });
    expect(submitBtn).toBeDisabled();

    // Habilitado con 10 o más caracteres
    const validText = 'Estimado cliente, su reclamo está en revisión técnica.';
    fireEvent.change(textarea, { target: { value: validText } });
    expect(submitBtn).toBeEnabled();

    // Enviar respuesta
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminApi.replyAdminClaim).toHaveBeenCalledWith('claim-123', {
        texto: validText,
        estado: 'en_proceso',
        enviar_correo: true,
      });
    });
  });

  it('un error 409 muestra el aviso rojo', async () => {
    adminApi.getAdminClaims.mockResolvedValue({
      items: [sampleClaim],
      total: 1,
      page: 1,
      page_size: 20,
    });
    adminApi.getAdminClaimDetail.mockResolvedValue(sampleClaimDetail);

    const error409 = new Error('Conflict');
    error409.response = {
      status: 409,
      data: { detail: 'El reclamo ya fue atendido' },
    };
    adminApi.replyAdminClaim.mockRejectedValue(error409);

    renderClaimsAdmin();

    fireEvent.click(await screen.findByText('Ver Reclamación'));

    const textarea = await screen.findByPlaceholderText(
      /Escriba su respuesta formal al consumidor/i
    );
    fireEvent.change(textarea, {
      target: { value: 'Respuesta formal que intentará enviarse.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Enviar respuesta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El reclamo ya fue atendido')).toBeInTheDocument();
  });

  it('con estado atendido no se ve el formulario', async () => {
    const atendidoClaim = {
      ...sampleClaim,
      estado: 'atendido',
      fecha_atencion: '2026-10-10T12:00:00Z',
    };
    adminApi.getAdminClaims.mockResolvedValue({
      items: [atendidoClaim],
      total: 1,
      page: 1,
      page_size: 20,
    });
    adminApi.getAdminClaimDetail.mockResolvedValue(atendidoClaim);

    renderClaimsAdmin();

    fireEvent.click(await screen.findByText('Ver Reclamación'));

    expect(await screen.findByText(/Reclamo atendido el/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/Escriba su respuesta formal al consumidor/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Enviar respuesta/i })
    ).not.toBeInTheDocument();
  });
});
