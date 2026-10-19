import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { NavBar } from '../NavBar';
import { AuthContext } from '../../../context/AuthContext';

describe('NavBar component - Clean Public Navigation', () => {
  it('does NOT render "Acceso Admin" or "Panel Admin" when user is not authenticated', () => {
    const authValue = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn()
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <NavBar isMobileMenuOpen={false} setIsMobileMenuOpen={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByText(/Acceso Admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Panel Admin/i)).not.toBeInTheDocument();
  });

  it('does NOT render administrative or staff links on the public navbar even when authenticated', () => {
    const authValue = {
      isAuthenticated: true,
      role: 'admin',
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn()
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <NavBar isMobileMenuOpen={false} setIsMobileMenuOpen={vi.fn()} />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByText(/Panel Admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Punto de Venta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Acceso Admin/i)).not.toBeInTheDocument();
  });
});
