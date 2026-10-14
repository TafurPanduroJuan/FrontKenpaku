import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input } from '../Input';

describe('Input component with password toggle', () => {
  it('renders standard text input without eye toggle', () => {
    render(<Input label="Nombre" placeholder="Tu nombre" />);
    const input = screen.getByPlaceholderText('Tu nombre');
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.queryByRole('button', { name: /contraseña/i })).not.toBeInTheDocument();
  });

  it('renders password input with eye toggle button', () => {
    render(<Input label="Contraseña" type="password" placeholder="••••••••" />);
    const input = screen.getByPlaceholderText('••••••••');
    expect(input).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i });
    expect(toggleBtn).toBeInTheDocument();

    // Click to show password
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument();

    // Click again to hide password
    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('allows disabling password toggle with showPasswordToggle={false}', () => {
    render(<Input label="Clave Secreta" type="password" showPasswordToggle={false} placeholder="secreto" />);
    expect(screen.queryByRole('button', { name: /contraseña/i })).not.toBeInTheDocument();
  });
});
