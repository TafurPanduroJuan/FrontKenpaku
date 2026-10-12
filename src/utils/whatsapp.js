/**
 * Normaliza un número telefónico al formato internacional de Perú (51XXXXXXXXX)
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhoneForWhatsApp(phone = '') {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) {
    return `51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('51')) {
    return digits;
  }
  return digits;
}

/**
 * Genera una URL directa a WhatsApp con un mensaje prediseñado hacia el número de Kenpaku.
 * @param {string} customMessage 
 * @returns {string}
 */
export function buildWhatsAppUrl(customMessage = '') {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '51987654321';
  const defaultMsg = 'Hola Comercial Kenpaku S.A.C., deseo cotizar acero o solicitar atención con un asesor.';
  const message = customMessage.trim() ? customMessage : defaultMsg;
  const encodedText = encodeURIComponent(message);

  return `https://wa.me/${number}?text=${encodedText}`;
}

/**
 * Genera una URL de WhatsApp desde el panel de administración hacia el cliente,
 * con un mensaje personalizado y profesional según el estado operativo del pedido.
 * @param {object} order
 * @returns {string}
 */
export function buildStatusWhatsAppUrl(order) {
  if (!order) return '';

  const phone = normalizePhoneForWhatsApp(order.cliente_telefono || order.cliente?.telefono);
  if (!phone) return '';
  const clienteNombre = order.cliente_nombre || order.cliente?.nombre || 'Estimado cliente';
  const codigo = order.codigo || 'KPK-000000';
  const total = Number(order.total || 0).toFixed(2);
  const flete = Number(order.costo_flete || 0).toFixed(2);

  let statusMsg = '';

  switch (order.estado) {
    case 'flete_cotizado':
      statusMsg = `¡Hola ${clienteNombre}! Le saludamos de *Comercial Kenpaku S.A.C.* sobre su pedido *${codigo}*.\n\nLe informamos que el costo de flete para su despacho a obra ha sido cotizado por *S/ ${flete}*.\nTotal final del pedido: *S/ ${total}*.\n\n¿Desea que procedamos con la confirmación para separar sus materiales?`;
      break;

    case 'confirmado':
      statusMsg = `¡Hola ${clienteNombre}! Le saludamos de *Comercial Kenpaku S.A.C.* para confirmarle que su pedido *${codigo}* ha sido *CONFIRMADO* con éxito.\n\nHemos validado su pago y sus materiales ya han sido reservados en nuestro almacén.`;
      break;

    case 'listo_para_recojo':
      statusMsg = `¡Hola ${clienteNombre}! Le informamos que sus materiales del pedido *${codigo}* ya se encuentran *LISTOS PARA RECOJO* en nuestro almacén central de Puente Piedra (Panamericana Norte Km 28).\n\nPuede pasar a retirarlos en nuestro horario de atención presentando su DNI.`;
      break;

    case 'despachado':
      statusMsg = `¡Hola ${clienteNombre}! Le informamos que su pedido *${codigo}* ha sido *DESPACHADO A OBRA* en nuestro camión de reparto.\n\nEl chofer se comunicará a este número telefónico al aproximarse al destino para coordinar la descarga.`;
      break;

    case 'entregado':
      statusMsg = `¡Hola ${clienteNombre}! Le confirmamos que su pedido *${codigo}* ha sido *ENTREGADO* con total conformidad.\n\n¡Muchas gracias por su preferencia y confianza en Comercial Kenpaku S.A.C.!`;
      break;

    case 'cancelado':
      statusMsg = `¡Hola ${clienteNombre}! Le informamos que su pedido *${codigo}* ha sido cancelado en nuestro sistema.\n\nSi tiene alguna duda o desea realizar una nueva cotización de materiales, con gusto le atenderemos.`;
      break;

    case 'pendiente':
    default:
      statusMsg = `¡Hola ${clienteNombre}! Le saludamos de *Comercial Kenpaku S.A.C.* Le confirmamos que hemos recibido su pedido *${codigo}* por un monto de *S/ ${total}*.\n\nNos contactamos para coordinar los detalles de pago y entrega de sus materiales.`;
      break;
  }

  // Si tiene token de seguimiento, adjuntar el enlace
  if (order.tracking_token) {
    const trackingUrl = `${window.location.origin}/seguimiento?token=${encodeURIComponent(order.tracking_token)}`;
    statusMsg += `\n\nPuede consultar el seguimiento en vivo aquí:\n${trackingUrl}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(statusMsg)}`;
}
