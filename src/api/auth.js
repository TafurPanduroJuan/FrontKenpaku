import { apiClient } from './client';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * POST /auth/login
 */
export async function loginAdmin(email, password) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));

    if (email === 'admin@kenpaku.pe' && password === 'AdminKenpaku2026!') {
      const mockToken = 'mock-jwt-token-kenpaku-admin-secret-2026';
      localStorage.setItem('kenpaku_admin_token', mockToken);
      localStorage.setItem('kenpaku_user_role', 'admin');
      localStorage.setItem('kenpaku_user_email', email);
      return { access_token: mockToken, token_type: 'bearer', rol: 'admin', email };
    } else if (email === 'cajero@kenpaku.pe' && password === 'CajeroKenpaku2026!') {
      const mockToken = 'mock-jwt-token-kenpaku-cajero-secret-2026';
      localStorage.setItem('kenpaku_admin_token', mockToken);
      localStorage.setItem('kenpaku_user_role', 'cajero');
      localStorage.setItem('kenpaku_user_email', email);
      return { access_token: mockToken, token_type: 'bearer', rol: 'cajero', email };
    } else {
      throw { response: { status: 401, data: { detail: 'Credenciales inválidas. Verifique correo y contraseña.' } } };
    }
  }

  try {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (data.access_token) {
      localStorage.setItem('kenpaku_admin_token', data.access_token);
      localStorage.setItem('kenpaku_user_role', data.rol || 'admin');
      localStorage.setItem('kenpaku_user_email', data.email || email);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export function logoutAdmin() {
  localStorage.removeItem('kenpaku_admin_token');
  localStorage.removeItem('kenpaku_user_role');
  localStorage.removeItem('kenpaku_user_email');
}

export function isAdminAuthenticated() {
  const token = localStorage.getItem('kenpaku_admin_token');
  if (!token) return false;

  // Check if token is an expired JWT
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logoutAdmin();
        return false;
      }
    }
  } catch {
    if (!token.startsWith('mock-jwt-token-')) {
      logoutAdmin();
      return false;
    }
  }

  return true;
}

export function getUserRole() {
  return localStorage.getItem('kenpaku_user_role') || (isAdminAuthenticated() ? 'admin' : null);
}

export function getUserEmail() {
  return localStorage.getItem('kenpaku_user_email') || '';
}
