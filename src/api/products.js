import { apiClient } from './client';
import { MOCK_PRODUCTS } from './mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * GET /products?q=&categoria=&acabado=&min_precio=&max_precio=&solo_stock=&orden=&page=&page_size=
 */
export async function getProducts(params = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 200));
    let filtered = [...MOCK_PRODUCTS];

    const { q, categoria, acabado, min_precio, max_precio, solo_stock, orden, page = 1, page_size = 12 } = params;

    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(term) ||
        p.categoria.toLowerCase().includes(term) ||
        (p.descripcion_corta && p.descripcion_corta.toLowerCase().includes(term)) ||
        (p.medida && p.medida.toLowerCase().includes(term))
      );
    }

    if (categoria) {
      filtered = filtered.filter(p => p.categoria === categoria);
    }

    if (acabado) {
      filtered = filtered.filter(p => p.acabado === acabado);
    }

    if (min_precio) {
      filtered = filtered.filter(p => p.precio_unitario >= parseFloat(min_precio));
    }

    if (max_precio) {
      filtered = filtered.filter(p => p.precio_unitario <= parseFloat(max_precio));
    }

    if (solo_stock === 'true' || solo_stock === true) {
      filtered = filtered.filter(p => p.stock_disponible > 0);
    }

    if (orden === 'precio_asc') {
      filtered.sort((a, b) => a.precio_unitario - b.precio_unitario);
    } else if (orden === 'precio_desc') {
      filtered.sort((a, b) => b.precio_unitario - a.precio_unitario);
    } else if (orden === 'nombre') {
      filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const total = filtered.length;
    const start = (page - 1) * page_size;
    const items = filtered.slice(start, start + page_size);

    return { items, total, page: Number(page), page_size: Number(page_size) };
  }

  try {
    const { data } = await apiClient.get('/products', { params });
    return data;
  } catch (err) {
    console.error('Error cargando catálogo de productos:', err);
    throw err;
  }
}

/**
 * GET /products/{id}
 */
export async function getProductById(id) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 150));
    const prod = MOCK_PRODUCTS.find(p => p.id === id);
    if (!prod) throw { response: { status: 404, data: { detail: 'Producto no encontrado' } } };
    return prod;
  }

  try {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  } catch (err) {
    console.error(`Error cargando producto con ID ${id}:`, err);
    throw err;
  }
}
