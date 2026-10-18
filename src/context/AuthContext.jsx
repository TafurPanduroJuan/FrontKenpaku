import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  loginAdmin as apiLoginAdmin,
  logoutAdmin as apiLogoutAdmin,
  isAdminAuthenticated,
  getUserRole,
  getUserEmail
} from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [role, setRole] = useState(() => getUserRole());
  const [email, setEmail] = useState(() => getUserEmail());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (userEmail, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiLoginAdmin(userEmail, password);
      setIsAuthenticated(true);
      const userRole = data?.rol || getUserRole() || 'admin';
      const userMail = data?.email || userEmail;
      setRole(userRole);
      setEmail(userMail);
      return { success: true, rol: userRole, email: userMail, ...data };
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Error al iniciar sesión';
      setError(msg);
      setIsAuthenticated(false);
      setRole(null);
      setEmail('');
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogoutAdmin();
    setIsAuthenticated(false);
    setRole(null);
    setEmail('');
  };

  const isAdmin = role === 'admin';
  const isCajero = role === 'cajero';
  const isStaff = isAuthenticated && (isAdmin || isCajero);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        email,
        isAdmin,
        isCajero,
        isStaff,
        isLoading,
        error,
        login,
        logout
      }}
    >
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
