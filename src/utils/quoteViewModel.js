import { STORE_INFO } from './constants';

const GENERIC_VALUES = new Set(['estandar', 'ninguno', 'na', 'n a', '-', '--', '—']);

function compact(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function useful(value) {
  const text = String(value ?? '').trim();
  const key = compact(text);
  return text && key && !GENERIC_VALUES.has(key) ? text : '';
}

function appearsInName(name, attribute) {
  const normalizedName = compact(name);
  const normalizedAttribute = compact(attribute);
  return Boolean(normalizedAttribute && normalizedName.includes(normalizedAttribute));
}

function uniqueAttributes(name, values) {
  const seen = new Set();
  return values
    .map(useful)
    .filter((value) => {
      if (!value || appearsInName(name, value)) return false;
      const key = compact(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatAlternative(product) {
  if (!product) return '';
  return [useful(product.nombre), useful(product.medida), useful(product.acabado)]
    .filter(Boolean)
    .join(' · ');
}

export function buildQuoteViewModel(quote) {
  const items = (quote?.items || []).map((item, index) => {
    const description = String(item.nombre_snapshot || item.texto_original || '').trim();
    const attributes = uniqueAttributes(description, [
      item.medida_snapshot,
      item.espesor_snapshot,
      item.acabado_snapshot,
    ]);
    const alternative = formatAlternative(item.opciones?.[0]);
    return {
      id: item.id || `line-${index + 1}`,
      number: index + 1,
      description,
      attributes,
      attributeLine: attributes.join(' · '),
      equivalenceNote: useful(item.equivalencia_nota),
      quantity: item.cantidad,
      unit: useful(item.unidad),
      quantityAssumed: Boolean(item.cantidad_asumida),
      unitPrice: item.precio_unitario_snapshot,
      lineSubtotal: item.subtotal_linea,
      status: item.estado_linea,
      missingFields: item.faltantes || [],
      options: item.opciones || [],
      alternative,
      priced: item.precio_unitario_snapshot != null && item.estado_linea === 'con_precio',
    };
  });
  const pricedItems = items.filter((item) => item.priced);
  const unavailableItems = items.filter((item) => !item.priced);

  return {
    company: {
      name: STORE_INFO.name,
      ruc: STORE_INFO.ruc,
      address: STORE_INFO.address,
      phone: STORE_INFO.phone,
    },
    code: quote?.codigo || '',
    status: quote?.estado || 'vigente',
    issuedAt: quote?.fecha_emision || null,
    validUntil: quote?.valida_hasta || null,
    validityNotice: quote?.aviso_validez || '',
    pricedItems,
    unavailableItems,
    totals: {
      subtotal: quote?.subtotal ?? 0,
      tax: quote?.igv ?? 0,
      total: quote?.total ?? 0,
      unquotedCount: quote?.items_sin_cotizar ?? unavailableItems.length,
      includesTax: true,
    },
  };
}
