/**
 * Utilitario centralizado para extracción y normalización de método de pago y tipo de comprobante.
 * Garantiza sincronización total entre la vista de cajero y la boleta/comprobante que visualiza el cliente.
 */

export function extractOrderPaymentMethod(order) {
  if (!order) return 'Efectivo';

  // 1. Si ya tiene metodo_pago o metodoPago explícito normalizado
  const rawMetodo = (order.metodo_pago || order.metodoPago || '').toString().toLowerCase().trim();
  if (rawMetodo.includes('interbank')) return 'Transferencia Interbank';
  if (rawMetodo.includes('bcp')) return 'Transferencia BCP';
  if (rawMetodo.includes('yape') || rawMetodo.includes('plin')) return 'Yape';
  if (rawMetodo.includes('efectivo')) return 'Efectivo';

  // 2. Historial de eventos de auditoría (por si el cajero ajustó el medio de pago)
  const events = order.events || order.order_events || [];
  if (Array.isArray(events)) {
    for (let i = events.length - 1; i >= 0; i--) {
      const nota = (events[i]?.nota || '').toUpperCase();
      if (nota.includes('MEDIO DE PAGO') || nota.includes('AJUSTADO') || nota.includes('VERIFICADO')) {
        if (nota.includes('INTERBANK')) return 'Transferencia Interbank';
        if (nota.includes('BCP')) return 'Transferencia BCP';
        if (nota.includes('YAPE') || nota.includes('PLIN')) return 'Yape';
        if (nota.includes('EFECTIVO')) return 'Efectivo';
      }
    }
  }

  // 3. Parseo exhaustivo de observaciones del pedido
  const obsUpper = (order.observaciones || '').toUpperCase();

  // 3.1. Priorizar etiquetas de confirmación de caja
  if (obsUpper.includes('[PAGO: YAPE]') || obsUpper.includes('PAGO: YAPE')) {
    return 'Yape';
  }
  if (obsUpper.includes('[PAGO: TRANSFERENCIA INTERBANK]') || obsUpper.includes('PAGO: INTERBANK') || obsUpper.includes('INTERBANK')) {
    return 'Transferencia Interbank';
  }
  if (obsUpper.includes('[PAGO: TRANSFERENCIA BCP]') || obsUpper.includes('PAGO: BCP')) {
    return 'Transferencia BCP';
  }
  if (obsUpper.includes('[PAGO: EFECTIVO]') || obsUpper.includes('PAGO: EFECTIVO')) {
    return 'Efectivo';
  }

  // 3.2. Etiquetas de declaración de cliente
  if (obsUpper.includes('PAGO DECLARADO: YAPE')) return 'Yape';
  if (obsUpper.includes('PAGO DECLARADO: INTERBANK')) return 'Transferencia Interbank';
  if (obsUpper.includes('PAGO DECLARADO: BCP')) return 'Transferencia BCP';

  // 3.3. Coincidencias de palabras clave sueltas
  if (obsUpper.includes('YAPE') || obsUpper.includes('PLIN')) return 'Yape';
  if (obsUpper.includes('INTERBANK')) return 'Transferencia Interbank';
  if (obsUpper.includes('BCP')) return 'Transferencia BCP';
  if (obsUpper.includes('EFECTIVO')) return 'Efectivo';

  // 4. Si tiene voucher o fecha de pago
  if (order.voucher_referencia || order.fecha_pago) {
    return 'Transferencia BCP';
  }

  // 5. Fallback por canal (mostrador: efectivo, web: BCP)
  if (order.canal === 'pos_tienda' || obsUpper.includes('MOSTRADOR')) {
    return 'Efectivo';
  }

  return 'Transferencia BCP';
}

export function extractOrderDocumentInfo(order) {
  if (!order) return { comprobanteTipo: 'boleta', docNumero: '' };
  const obsUpper = (order.observaciones || '').toUpperCase();
  const rawTipo = (order.comprobante_tipo || order.comprobanteTipo || '').toString().toLowerCase();

  const isFactura =
    rawTipo === 'factura' ||
    obsUpper.includes('FACTURA') ||
    obsUpper.includes('[DOC: RUC') ||
    obsUpper.includes('[RUC:');

  let docNumero = order.doc_numero || order.numeroDocumento || order.docNumero || order.cliente_dni || order.cliente_ruc || '';
  if (!docNumero) {
    const match = order.observaciones?.match(/(?:DOC:\s*(?:RUC|DNI)?|Doc:\s*|DNI:\s*|RUC:\s*)([0-9A-Za-z]+)/i);
    if (match) docNumero = match[1];
  }

  return {
    comprobanteTipo: isFactura ? 'factura' : 'boleta',
    docNumero: docNumero || (isFactura ? 'Sin RUC' : 'Sin DNI')
  };
}
