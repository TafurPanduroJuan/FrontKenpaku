/**
 * Utilitario centralizado para extracción y normalización de método de pago y tipo de comprobante
 */

export function extractOrderPaymentMethod(order) {
  if (!order) return 'Efectivo';

  // Si ya tiene metodo_pago o metodoPago explícito normalizado
  const rawMetodo = (order.metodo_pago || order.metodoPago || '').toString().toLowerCase().trim();
  if (rawMetodo === 'yape' || rawMetodo === 'yape_plin' || rawMetodo === 'plin') return 'Yape';
  if (rawMetodo === 'bcp' || rawMetodo === 'transferencia_bcp' || rawMetodo === 'transferencia bcp') return 'Transferencia BCP';
  if (rawMetodo === 'interbank' || rawMetodo === 'transferencia_interbank' || rawMetodo === 'transferencia interbank') return 'Transferencia Interbank';
  if (rawMetodo === 'efectivo') return 'Efectivo';

  // Parseo exhaustivo de observaciones del pedido
  const obsUpper = (order.observaciones || '').toUpperCase();

  // 1. Priorizar etiquetas de confirmación de caja
  if (obsUpper.includes('[PAGO: YAPE]') || obsUpper.includes('PAGO: YAPE')) {
    return 'Yape';
  }
  if (obsUpper.includes('[PAGO: TRANSFERENCIA INTERBANK]') || obsUpper.includes('PAGO: INTERBANK')) {
    return 'Transferencia Interbank';
  }
  if (obsUpper.includes('[PAGO: TRANSFERENCIA BCP]') || obsUpper.includes('PAGO: BCP')) {
    return 'Transferencia BCP';
  }
  if (obsUpper.includes('[PAGO: EFECTIVO]') || obsUpper.includes('PAGO: EFECTIVO')) {
    return 'Efectivo';
  }

  // 2. Etiquetas de declaración de cliente
  if (obsUpper.includes('PAGO DECLARADO: YAPE')) return 'Yape';
  if (obsUpper.includes('PAGO DECLARADO: INTERBANK')) return 'Transferencia Interbank';
  if (obsUpper.includes('PAGO DECLARADO: BCP')) return 'Transferencia BCP';

  // 3. Coincidencias de texto sueltas
  if (obsUpper.includes('YAPE') || obsUpper.includes('PLIN')) return 'Yape';
  if (obsUpper.includes('INTERBANK')) return 'Transferencia Interbank';
  if (obsUpper.includes('BCP')) return 'Transferencia BCP';
  if (obsUpper.includes('EFECTIVO')) return 'Efectivo';

  // 4. Si tiene voucher o fecha de pago
  if (order.voucher_referencia || order.fecha_pago) {
    return 'Transferencia BCP';
  }

  // Mostrador por defecto efectivo, web por defecto BCP
  if (order.canal === 'pos_tienda' || obsUpper.includes('MOSTRADOR')) {
    return 'Efectivo';
  }

  return 'Transferencia BCP';
}

export function extractOrderDocumentInfo(order) {
  if (!order) return { comprobanteTipo: 'boleta', docNumero: '' };
  const obsUpper = (order.observaciones || '').toUpperCase();
  const isFactura =
    obsUpper.includes('FACTURA') ||
    obsUpper.includes('[DOC: RUC') ||
    obsUpper.includes('[RUC:') ||
    order.comprobanteTipo === 'factura';

  let docNumero = order.numeroDocumento || order.docNumero || order.cliente_dni || order.cliente_ruc || '';
  if (!docNumero) {
    const match = order.observaciones?.match(/(?:DOC:\s*(?:RUC|DNI)?|Doc:\s*|DNI:\s*|RUC:\s*)([0-9A-Za-z]+)/i);
    if (match) docNumero = match[1];
  }

  return {
    comprobanteTipo: isFactura ? 'factura' : 'boleta',
    docNumero: docNumero || (isFactura ? 'Sin RUC' : 'Sin DNI')
  };
}
