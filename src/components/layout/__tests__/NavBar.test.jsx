import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { NavBar } from '../NavBar';
import { AuthContext } from '../../../context/AuthContext';

describe('NavBar component - Admin Access Button', () => {
  it('does NOT render "Acceso Admin" or any admin link when user is not authenticated', () => {
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

  it('renders "Panel Admin" pointing to /admin when user is authenticated', () => {
    const authValue = {
      isAuthenticated: true,
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

    const adminLinks = screen.getAllByRole('link', { name: /Panel Admin/i });
    expect(adminLinks.length).toBeGreaterThan(0);
    expect(adminLinks[0]).toHaveAttribute('href', '/admin');
  });
});
