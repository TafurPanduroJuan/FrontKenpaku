import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../admin/Login';
import { AuthContext } from '../../context/AuthContext';

describe('Admin Login Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = (contextOverrides = {}) => {
    const authValue = {
      isAuthenticated: false,
      login: mockLogin,
      isLoading: false,
      error: null,
      ...contextOverrides,
    };

    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Login />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders the login form with email, password and eye toggle', () => {
    renderLogin();

    expect(screen.getByLabelText(/correo de administrador/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mostrar contraseña/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', () => {
    renderLogin();

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument();
  });

  it('shows validation error when email format is invalid', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/correo de administrador/i);

    // Enter email without @ or domain and trigger blur
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.blur(emailInput);

    expect(await screen.findByText(/ingresa un correo válido con @ y dominio/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login when valid email and password are submitted', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/correo de administrador/i);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'admin@kenpaku.pe' } });
    fireEvent.change(passwordInput, { target: { value: 'AdminKenpaku2026!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@kenpaku.pe', 'AdminKenpaku2026!');
    });
  });
});
