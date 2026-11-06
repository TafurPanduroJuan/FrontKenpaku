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

  it('muestra una sugerencia compacta, neutral y ejecuta la aceptación', () => {
    const onAccept = vi.fn();
    const { container } = render(<SuggestionCard product={{ nombre: 'Tubo cuadrado', medida: '40x40', precio_unitario: '25.00' }} onAccept={onAccept} />);
    expect(screen.getByText('Sugerido')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-50, .border-blue-200, .bg-kenpaku-orange')).not.toBeInTheDocument();
    expect(screen.getByText(/Alternativa disponible: Tubo cuadrado · 40x40/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('mantiene una opción visible y despliega las demás cuando se solicita', () => {
    render(<SuggestionCard products={[
      { product_id: 'p1', nombre: 'Tubo negro', medida: '40x40', precio_unitario: '25.00' },
      { product_id: 'p2', nombre: 'Tubo galvanizado', medida: '40x40', precio_unitario: '28.00' },
      { product_id: 'p3', nombre: 'Tubo rectangular', medida: '40x20', precio_unitario: '30.00' },
    ]} onAccept={vi.fn()} />);

    expect(screen.getByText(/Tubo negro/)).toBeInTheDocument();
    expect(screen.queryByText(/Tubo galvanizado/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver más opciones' }));
    expect(screen.getByText(/Tubo galvanizado/)).toBeInTheDocument();
    expect(screen.getByText(/Tubo rectangular/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver menos opciones' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('muestra la etiqueta de estado', () => {
    render(<StatusBadge status="sin_stock" />);
    expect(screen.getByText('Sin stock')).toBeInTheDocument();
  });
});
