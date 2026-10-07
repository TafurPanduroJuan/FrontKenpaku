import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginAdmin as apiLoginAdmin, logoutAdmin as apiLogoutAdmin, isAdminAuthenticated } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLoginAdmin(email, password);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Error al iniciar sesión';
      setError(msg);
      setIsAuthenticated(false);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogoutAdmin();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
