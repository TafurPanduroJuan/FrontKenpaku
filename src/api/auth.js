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
      return { access_token: mockToken, token_type: 'bearer' };
    } else {
      throw { response: { status: 401, data: { detail: 'Credenciales inválidas. Verifique correo y contraseña.' } } };
    }
  }

  try {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (data.access_token) {
      localStorage.setItem('kenpaku_admin_token', data.access_token);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export function logoutAdmin() {
  localStorage.removeItem('kenpaku_admin_token');
}

export function isAdminAuthenticated() {
  return !!localStorage.getItem('kenpaku_admin_token');
}
