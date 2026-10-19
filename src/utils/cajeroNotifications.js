import { formatPEN } from './formatPEN';

export const CAJERO_NOTIFICATIONS_STORAGE_KEY = 'kenpaku_cajero_notifications_history_v1';

export function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(CAJERO_NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifications) {
  try {
    localStorage.setItem(
      CAJERO_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications.slice(0, 100))
    );
  } catch {
    // Ignorar errores de almacenamiento local
  }
}

export function extractNotificationsFromOrders(orders = [], existingNotifications = []) {
  const existingMap = new Map();
  for (const n of existingNotifications) {
    if (n && n.id) {
      existingMap.set(n.id, n);
    }
  }

  const generated = [];

  for (const o of orders) {
    if (!o || !o.codigo) continue;
    const isMostrador =
      o.observaciones?.includes('[VENTA MOSTRADOR]') ||
      o.observaciones?.includes('MOSTRADOR');

    const clienteName =
      o.cliente?.nombre || o.cliente_nombre || o.cliente_resumen || 'Cliente Web';
    const totalFormatted = formatPEN(o.total || 0);
    const createdAt = o.created_at || new Date().toISOString();

    // 1. Flete Pendiente de Cotización (Despacho a obra sin cotizar)
    if (
      !o.recojo_en_tienda &&
      !isMostrador &&
      (o.estado === 'pendiente' || o.estado === 'registrado') &&
      (!o.costo_flete || Number(o.costo_flete) === 0)
    ) {
      const id = `notif-${o.codigo}-flete-pendiente`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        order_codigo: o.codigo,
        tipo: 'flete_pendiente',
        badge: 'Flete Pendiente',
        titulo: `Pedido ${o.codigo} • Requiere Flete`,
        descripcion: `${clienteName} • Destino: ${o.direccion || 'Dirección de obra'} • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        fecha: prev?.fecha || createdAt,
        leido: prev ? Boolean(prev.leido) : false,
        urgente: true
      });
    }

    // 2. Voucher de Pago Subido (esperando validación de caja)
    const hasVoucher = Boolean(
      o.voucher_referencia || o.voucher_url || o.vouchers?.length
    );
    const isUnconfirmed = !['confirmado', 'despachado', 'listo_para_recojo', 'entregado', 'cancelado'].includes(
      o.estado
    );
    if (hasVoucher && isUnconfirmed) {
      const id = `notif-${o.codigo}-voucher-subido`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        order_codigo: o.codigo,
        tipo: 'voucher_subido',
        badge: 'Voucher por Validar',
        titulo: `Voucher Subido • Pedido ${o.codigo}`,
        descripcion: `${clienteName} cargó su comprobante de pago • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        fecha: prev?.fecha || o.fecha_pago || createdAt,
        leido: prev ? Boolean(prev.leido) : false,
        urgente: true
      });
    }

    // 3. Flete Aceptado por el Cliente
    if (!o.recojo_en_tienda && o.estado_flete === 'aceptado') {
      const id = `notif-${o.codigo}-flete-aceptado`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        order_codigo: o.codigo,
        tipo: 'flete_aceptado',
        badge: 'Flete Aceptado',
        titulo: `Flete Aceptado • Pedido ${o.codigo}`,
        descripcion: `${clienteName} aceptó el costo de flete (S/ ${Number(o.costo_flete || 0).toFixed(2)}) • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        fecha: prev?.fecha || createdAt,
        leido: prev ? Boolean(prev.leido) : false,
        urgente: false
      });
    }

    // 4. Flete Rechazado por el Cliente
    if (!o.recojo_en_tienda && o.estado_flete === 'rechazado') {
      const id = `notif-${o.codigo}-flete-rechazado`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        order_codigo: o.codigo,
        tipo: 'flete_rechazado',
        badge: 'Flete Rechazado',
        titulo: `Flete Rechazado • Pedido ${o.codigo}`,
        descripcion: `${clienteName} rechazó la cotización de flete • Coordinar vía WhatsApp`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        fecha: prev?.fecha || createdAt,
        leido: prev ? Boolean(prev.leido) : false,
        urgente: true
      });
    }

    // 5. Nueva Venta Web con Recojo en Almacén
    if (
      o.recojo_en_tienda &&
      !isMostrador &&
      (o.estado === 'pendiente' || o.estado === 'registrado')
    ) {
      const id = `notif-${o.codigo}-recojo-tienda`;
      const prev = existingMap.get(id);
      generated.push({
        id,
        order_codigo: o.codigo,
        tipo: 'recojo_tienda',
        badge: 'Recojo en Almacén',
        titulo: `Venta Web Recojo • Pedido ${o.codigo}`,
        descripcion: `${clienteName} • Retiro en almacén Puente Piedra • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        fecha: prev?.fecha || createdAt,
        leido: prev ? Boolean(prev.leido) : false,
        urgente: false
      });
    }
  }

  // Mantener notificaciones históricas que ya no figuren activas en el listado
  const generatedIds = new Set(generated.map((g) => g.id));
  const historical = existingNotifications.filter((n) => !generatedIds.has(n.id));

  // Combinar y ordenar por fecha descendente
  const combined = [...generated, ...historical].sort((a, b) => {
    const timeA = new Date(a.fecha || 0).getTime();
    const timeB = new Date(b.fecha || 0).getTime();
    return timeB - timeA;
  });

  return combined;
}

export function formatTimeAgo(isoString) {
  if (!isoString) return 'Reciente';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(isoString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Reciente';
  }
}
