import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CajeroLayout } from '../CajeroLayout';
import { AuthContext } from '../../../context/AuthContext';

describe('CajeroLayout Component', () => {
  const mockLogout = vi.fn();

  const renderLayout = (authProps = {}) => {
    const defaultAuth = {
      isAuthenticated: true,
      role: 'cajero',
      email: 'cajero@kenpaku.pe',
      isAdmin: false,
      isCajero: true,
      logout: mockLogout,
      ...authProps
    };

    return render(
      <BrowserRouter>
        <AuthContext.Provider value={defaultAuth}>
          <CajeroLayout />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders the 4 centered navigation tabs for the cashier', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: /Punto de Venta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mis Ventas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ventas Virtuales/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mi Perfil/i })).toBeInTheDocument();
  });

  it('does NOT render the digital clock or Turno Activo badge in the topbar', () => {
    renderLayout();

    expect(screen.queryByText(/Turno Activo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/a\. m\./i)).not.toBeInTheDocument();
    expect(screen.queryByText(/p\. m\./i)).not.toBeInTheDocument();
  });

  it('renders establishment information and clean logout button', () => {
    renderLayout();

    expect(screen.getByText(/Puente Piedra - Sede Principal/i)).toBeInTheDocument();
    const logoutBtn = screen.getByRole('button', { name: /Cerrar sesión/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
