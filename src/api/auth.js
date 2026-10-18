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
  return !!localStorage.getItem('kenpaku_admin_token');
}

export function getUserRole() {
  return localStorage.getItem('kenpaku_user_role') || (isAdminAuthenticated() ? 'admin' : null);
}

export function getUserEmail() {
  return localStorage.getItem('kenpaku_user_email') || '';
}
