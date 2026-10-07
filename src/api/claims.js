import { apiClient } from './client';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * POST /claims
 */
export async function createClaim(claimPayload) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 350));
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const codigo_seguimiento = `RC-2026-${randomSeq}`;
    const fecha = new Date().toISOString();

    return {
      codigo_seguimiento,
      fecha
    };
  }

  try {
    const { data } = await apiClient.post('/claims', claimPayload);
    return data;
  } catch (err) {
    throw err;
  }
}
