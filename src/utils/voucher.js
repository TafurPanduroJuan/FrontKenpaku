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

/**
 * Retorna la lista normalizada de todos los comprobantes asociados a un pedido.
 * Soporta:
 * - URLs separadas por comas o saltos de línea en `voucherReferencia`.
 * - Recuperación histórica de comprobantes registrados en los eventos (`events`) del pedido.
 * - Formatos de imagen (JPG, PNG, WEBP) y PDF.
 *
 * @param {string|null|undefined} voucherReferencia
 * @param {Array|null|undefined} events
 * @returns {Array<{ rawUrl: string, url: string, label: string, isPdf: boolean }>}
 */
export function getVoucherList(voucherReferencia, events = []) {
  const result = [];
  const seenUrls = new Set();

  const addVoucher = (rawUrl, label) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    const fullUrl = getVoucherUrl(trimmed);
    if (!seenUrls.has(fullUrl)) {
      seenUrls.add(fullUrl);
      result.push({
        rawUrl: trimmed,
        url: fullUrl,
        label: label || `Comprobante #${result.length + 1}`,
        isPdf: trimmed.toLowerCase().endsWith('.pdf') || fullUrl.toLowerCase().endsWith('.pdf'),
      });
    }
  };

  // 1. Procesar voucher_referencia (puede contener 1 o múltiples URLs separadas por coma, punto y coma o salto de línea)
  if (voucherReferencia && typeof voucherReferencia === 'string') {
    const parts = voucherReferencia.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean);
    parts.forEach((p, idx) => {
      addVoucher(p, `Comprobante #${idx + 1}`);
    });
  }

  // 2. Recuperar comprobantes de eventos del historial del pedido (por si alguna versión anterior sobreescribió el campo)
  if (Array.isArray(events)) {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );
    sortedEvents.forEach((ev) => {
      if (!ev?.nota) return;
      const match = ev.nota.match(/Comprobante de pago cargado \(([^)]+)\)/i);
      if (match && match[1]) {
        const filename = match[1].trim();
        const candidateUrl = `/api/orders/voucher/${filename}`;
        const alreadyInList = result.some(
          (item) => item.rawUrl.includes(filename) || item.url.includes(filename)
        );
        if (!alreadyInList) {
          addVoucher(candidateUrl, `Comprobante #${result.length + 1}`);
        }
      }
    });
  }

  return result;
}
