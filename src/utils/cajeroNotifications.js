import { formatPEN } from './formatPEN';

export const CAJERO_NOTIFICATIONS_STORAGE_KEY = 'kenpaku_cajero_notifications_v2';
export const CAJERO_NOTIFICATIONS_READ_KEY = 'kenpaku_cajero_notifications_read_v2';
export const CAJERO_NOTIFICATIONS_CLEARED_KEY = 'kenpaku_cajero_notifications_cleared_v2';
export const CAJERO_NOTIFICATIONS_BASELINE_KEY = 'kenpaku_cajero_notifications_baseline_v2';

export function purgeLegacyNotifications() {
  try {
    localStorage.removeItem('kenpaku_cajero_notifications_history_v1');
  } catch {
    // Ignorar errores de localStorage
  }
}

export function getNotificationBaseline() {
  try {
    let baseline = localStorage.getItem(CAJERO_NOTIFICATIONS_BASELINE_KEY);
    if (!baseline) {
      baseline = new Date().toISOString();
      localStorage.setItem(CAJERO_NOTIFICATIONS_BASELINE_KEY, baseline);
    }
    return baseline;
  } catch {
    return new Date().toISOString();
  }
}

export function resetNotificationBaseline() {
  try {
    const now = new Date().toISOString();
    localStorage.setItem(CAJERO_NOTIFICATIONS_BASELINE_KEY, now);
    localStorage.removeItem(CAJERO_NOTIFICATIONS_STORAGE_KEY);
    localStorage.removeItem(CAJERO_NOTIFICATIONS_READ_KEY);
    localStorage.removeItem(CAJERO_NOTIFICATIONS_CLEARED_KEY);
    purgeLegacyNotifications();
    return now;
  } catch {
    return new Date().toISOString();
  }
}

export function loadReadIds() {
  try {
    const raw = localStorage.getItem(CAJERO_NOTIFICATIONS_READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveReadIds(readIds) {
  try {
    const list = Array.from(readIds).slice(-300);
    localStorage.setItem(CAJERO_NOTIFICATIONS_READ_KEY, JSON.stringify(list));
  } catch {
    // Ignorar errores de localStorage
  }
}

export function loadClearedIds() {
  try {
    const raw = localStorage.getItem(CAJERO_NOTIFICATIONS_CLEARED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveClearedIds(clearedIds) {
  try {
    const list = Array.from(clearedIds).slice(-300);
    localStorage.setItem(CAJERO_NOTIFICATIONS_CLEARED_KEY, JSON.stringify(list));
  } catch {
    // Ignorar errores de localStorage
  }
}

export function loadStoredNotifications() {
  purgeLegacyNotifications();
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
  purgeLegacyNotifications();
  const readIds = loadReadIds();
  const clearedIds = loadClearedIds();
  const baselineIso = getNotificationBaseline();
  const baselineTime = new Date(baselineIso).getTime();

  const existingMap = new Map();
  for (const n of existingNotifications) {
    if (n && n.id) {
      existingMap.set(n.id, n);
    }
  }

  const generated = [];

  for (const o of orders) {
    if (!o || !o.codigo) continue;

    const orderTime = new Date(o.created_at || Date.now()).getTime();
    // Solo órdenes creadas desde el baseline (o que ya estaban activas en memoria) generan notificaciones
    const isNewSinceBaseline = orderTime >= baselineTime - 1000;

    const isMostrador =
      o.observaciones?.includes('[VENTA MOSTRADOR]') ||
      o.observaciones?.includes('MOSTRADOR');

    const clienteName =
      o.cliente?.nombre || o.cliente_nombre || o.cliente_resumen || 'Cliente Web';
    const totalFormatted = formatPEN(o.total || 0);
    const createdAt = o.created_at || new Date().toISOString();

    const checkAndPush = (id, notifData) => {
      // 1. Si el usuario ya la limpió/eliminó, no resucitarla
      if (clearedIds.has(id)) return;

      // 2. Si la orden es anterior a la fecha de inicio limpia y no estaba en memoria, ignorar
      const prev = existingMap.get(id);
      if (!isNewSinceBaseline && !prev) return;

      // 3. Determinar estado de lectura de forma inmutable
      const isLeido = readIds.has(id) || Boolean(prev?.leido);

      generated.push({
        id,
        order_codigo: o.codigo,
        ...notifData,
        fecha: prev?.fecha || createdAt,
        leido: isLeido
      });
    };

    // 1. Flete Pendiente de Cotización (Despacho a obra sin cotizar)
    if (
      !o.recojo_en_tienda &&
      !isMostrador &&
      (o.estado === 'pendiente' || o.estado === 'registrado') &&
      (!o.costo_flete || Number(o.costo_flete) === 0)
    ) {
      checkAndPush(`notif-${o.codigo}-flete-pendiente`, {
        tipo: 'flete_pendiente',
        badge: 'Flete Pendiente',
        titulo: `Pedido ${o.codigo} • Requiere Flete`,
        descripcion: `${clienteName} • Destino: ${o.direccion || 'Dirección de obra'} • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
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
      checkAndPush(`notif-${o.codigo}-voucher-subido`, {
        tipo: 'voucher_subido',
        badge: 'Voucher por Validar',
        titulo: `Voucher Subido • Pedido ${o.codigo}`,
        descripcion: `${clienteName} cargó su comprobante de pago • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        urgente: true
      });
    }

    // 3. Flete Aceptado por el Cliente
    if (!o.recojo_en_tienda && o.estado_flete === 'aceptado') {
      checkAndPush(`notif-${o.codigo}-flete-aceptado`, {
        tipo: 'flete_aceptado',
        badge: 'Flete Aceptado',
        titulo: `Flete Aceptado • Pedido ${o.codigo}`,
        descripcion: `${clienteName} aceptó el costo de flete (S/ ${Number(o.costo_flete || 0).toFixed(2)}) • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        urgente: false
      });
    }

    // 4. Flete Rechazado por el Cliente
    if (!o.recojo_en_tienda && o.estado_flete === 'rechazado') {
      checkAndPush(`notif-${o.codigo}-flete-rechazado`, {
        tipo: 'flete_rechazado',
        badge: 'Flete Rechazado',
        titulo: `Flete Rechazado • Pedido ${o.codigo}`,
        descripcion: `${clienteName} rechazó la cotización de flete • Coordinar vía WhatsApp`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        urgente: true
      });
    }

    // 5. Nueva Venta Web con Recojo en Almacén
    if (
      o.recojo_en_tienda &&
      !isMostrador &&
      (o.estado === 'pendiente' || o.estado === 'registrado')
    ) {
      checkAndPush(`notif-${o.codigo}-recojo-tienda`, {
        tipo: 'recojo_tienda',
        badge: 'Recojo en Almacén',
        titulo: `Venta Web Recojo • Pedido ${o.codigo}`,
        descripcion: `${clienteName} • Retiro en almacén Puente Piedra • Total: ${totalFormatted}`,
        cliente_nombre: clienteName,
        total: Number(o.total || 0),
        urgente: false
      });
    }
  }

  // Mantener notificaciones en memoria que no hayan sido limpiadas
  const generatedIds = new Set(generated.map((g) => g.id));
  const historical = existingNotifications.filter(
    (n) => !generatedIds.has(n.id) && !clearedIds.has(n.id)
  );

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
