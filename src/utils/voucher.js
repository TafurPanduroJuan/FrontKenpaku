/**
 * Utilidades para manejo de comprobantes y vouchers de pago.
 */

/**
 * Convierte una URL relativa o absoluta del voucher en una URL completa accesible por el navegador.
 * - Si es URL completa (ej. Supabase Storage https://...), la retorna directamente.
 * - Si es blob / objeto local (ej. blob:http://...), la retorna tal cual.
 * - Si es ruta relativa (ej. /api/orders/voucher/...), le antepone el host del backend.
 *
 * @param {string} url - URL del voucher devuelta por la API o almacenada en el pedido.
 * @returns {string} URL lista para abrir o previsualizar.
 */
export function getVoucherUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Obtener URL base del backend desde variables de entorno de Vite o fallback estándar
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:8000/api';

  // Remover sufijo '/api' si la ruta ya lo incluye
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${backendBase}${cleanPath}`;
}
