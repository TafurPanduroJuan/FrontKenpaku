import { apiClient } from './client';
import { MOCK_CATEGORIES } from './mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * Obtener listado de categorías con total de productos.
 * GET /categories
 */
export async function getCategories() {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 150));
    return MOCK_CATEGORIES;
  }

  try {
    const { data } = await apiClient.get('/categories');
    return data;
  } catch (err) {
    console.warn('Error al conectar con API de Categorías:', err);
    throw err;
  }
}
