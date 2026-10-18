import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from '../Layout';
import { AdminLayout } from '../AdminLayout';
import { AuthContext } from '../../../context/AuthContext';
import { CartProvider } from '../../../context/CartContext';
import { ADMIN_ENTRY_PATH } from '../../../utils/constants';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Admin Security & Access Controls', () => {
  it('triggers navigation to ADMIN_ENTRY_PATH when unauthenticated user presses Ctrl + Shift + K', () => {
    const authValue = {
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      error: null,
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <CartProvider>
            <Layout />
          </CartProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'K', ctrlKey: true, shiftKey: true });
    expect(mockNavigate).toHaveBeenCalledWith(ADMIN_ENTRY_PATH);
  });

  it('triggers navigation to /admin when authenticated user presses Ctrl + Shift + K', () => {
    const authValue = {
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      error: null,
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <CartProvider>
            <Layout />
          </CartProvider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true, shiftKey: true });
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('renders NotFound component when unauthenticated user visits AdminLayout', () => {
    const authValue = {
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
      error: null,
    };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <AdminLayout />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText(/404 - Página no encontrada/i)).toBeInTheDocument();
    expect(screen.queryByText(/KENPAKU ADMIN/i)).not.toBeInTheDocument();
  });
});
