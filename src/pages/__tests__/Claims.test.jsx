import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Claims } from '../Claims';
import * as claimsApi from '../../api/claims';

vi.mock('../../api/claims', () => ({
  createClaim: vi.fn(),
}));

describe('Claims Page - Libro de Reclamaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderClaims = () => {
    return render(
      <BrowserRouter>
        <Claims />
      </BrowserRouter>
    );
  };

  it('renders the claims form with all required sections', () => {
    renderClaims();

    expect(screen.getByRole('heading', { name: /Libro de Reclamaciones Virtual/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombres y Apellidos completos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de Documento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de Documento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono de Contacto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
  });

  it('restricts name to letters and spaces only', () => {
    renderClaims();

    const nameInput = screen.getByLabelText(/Nombres y Apellidos completos/i);
    fireEvent.change(nameInput, { target: { value: 'Carlos 123 #$! Perez' } });

    expect(nameInput.value).toBe('Carlos   Perez');
  });

  it('restricts phone to 9 numeric digits max', () => {
    renderClaims();

    const phoneInput = screen.getByLabelText(/Teléfono de Contacto/i);
    fireEvent.change(phoneInput, { target: { value: '987-654-321000' } });

    expect(phoneInput.value).toBe('987654321');
  });

  it('adapts document number input according to document type', () => {
    renderClaims();

    const docTypeSelect = screen.getByLabelText(/Tipo de Documento/i);
    const docNumberInput = screen.getByLabelText(/Número de Documento/i);

    // Default is DNI (max 8 digits)
    fireEvent.change(docNumberInput, { target: { value: '45891234999' } });
    expect(docNumberInput.value).toBe('45891234');

    // Switch to RUC (max 11 digits)
    fireEvent.change(docTypeSelect, { target: { value: 'RUC' } });
    fireEvent.change(docNumberInput, { target: { value: '20601234567888' } });
    expect(docNumberInput.value).toBe('20601234567');

    // Switch to Pasaporte (alphanumeric max 12 chars)
    fireEvent.change(docTypeSelect, { target: { value: 'Pasaporte' } });
    fireEvent.change(docNumberInput, { target: { value: 'abc-123-def-456-extra' } });
    expect(docNumberInput.value).toBe('ABC123DEF456');
  });

  it('sanitizes product description and detail of claim', () => {
    renderClaims();

    const descInput = screen.getByLabelText(/Descripción del Producto o Servicio/i);
    fireEvent.change(descInput, { target: { value: 'Tubo 2" x 1.5mm <script>alert(1)</script>' } });
    expect(descInput.value).toBe('Tubo 2" x 1.5mm scriptalert1/script');

    const detailInput = screen.getByLabelText(/Detalle del Reclamo o Queja/i);
    fireEvent.change(detailInput, { target: { value: 'Material con defecto: 1 1/2" <bad>' } });
    expect(detailInput.value).toBe('Material con defecto: 1 1/2" bad');
  });
});
