import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuoteComparisonPanel } from '../QuoteComparisonPanel';
import { SuggestionCard } from '../SuggestionCard';
import { StatusBadge } from '../../ui/StatusBadge';

const comparison = (difference) => ({
  proforma: { parent_codigo: 'KP-20261104-ABC234', fecha_emision: '2026-11-04T10:00:00-05:00' },
  total_anterior: '100.00',
  total_nuevo: String(100 + difference),
  diferencia: String(difference),
  diferencia_pct: String(difference),
  comparacion: [{
    texto_original: '1 producto',
    nombre_snapshot: 'Producto de acero',
    precio_anterior: '100.00',
    precio_nuevo: String(100 + difference),
    diferencia: String(difference),
    estado: 'con_precio',
  }],
});

describe('Componentes reutilizables de proforma', () => {
  it.each([
    [5, 'Subió'],
    [-5, 'Bajó'],
    [0, 'Igual'],
  ])('representa diferencia %s como %s', (difference, label) => {
    render(<QuoteComparisonPanel comparison={comparison(difference)} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('muestra la tarjeta de sugerencia y ejecuta la aceptación', () => {
    const onAccept = vi.fn();
    render(<SuggestionCard product={{ nombre: 'Tubo cuadrado', medida: '40x40', precio_unitario: '25.00' }} onAccept={onAccept} />);
    expect(screen.getByText('Sugerido')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Agregar a la cotización/ }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('muestra la etiqueta de estado', () => {
    render(<StatusBadge status="sin_stock" />);
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
  });
});
