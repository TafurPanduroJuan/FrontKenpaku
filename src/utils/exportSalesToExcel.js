import * as XLSX from 'xlsx';

export function exportSalesToExcel(sales = [], filterSummary = {}) {
  if (!sales || sales.length === 0) {
    throw new Error('No hay ventas para exportar con los filtros seleccionados.');
  }

  // 1. Mapeo estructurado para Excel
  const rows = sales.map((sale) => {
    const isMostrador =
      sale.canal === 'pos_tienda' ||
      sale.observaciones?.includes('[VENTA MOSTRADOR]') ||
      sale.observaciones?.includes('MOSTRADOR');

    // Parseo de método de pago
    let metodo = 'No especificado';
    const rawMetodo = (sale.metodoPago || '').toLowerCase();
    const obsUpper = (sale.observaciones || '').toUpperCase();
    if (rawMetodo === 'efectivo' || obsUpper.includes('PAGO: EFECTIVO') || obsUpper.includes('EFECTIVO')) {
      metodo = 'Efectivo';
    } else if (rawMetodo === 'yape' || obsUpper.includes('PAGO: YAPE') || obsUpper.includes('YAPE') || obsUpper.includes('PLIN')) {
      metodo = 'Yape';
    } else if (rawMetodo === 'interbank' || obsUpper.includes('PAGO: TRANSFERENCIA INTERBANK') || obsUpper.includes('INTERBANK')) {
      metodo = 'Transferencia Interbank';
    } else if (rawMetodo === 'bcp' || obsUpper.includes('PAGO: TRANSFERENCIA BCP') || obsUpper.includes('BCP') || obsUpper.includes('BBVA') || obsUpper.includes('TRANSFERENCIA') || sale.voucher_referencia || sale.fecha_pago) {
      metodo = 'Transferencia BCP';
    }

    // Parseo de comprobante y documento
    const isFactura = obsUpper.includes('FACTURA') || obsUpper.includes('[DOC: RUC') || sale.comprobanteTipo === 'factura';
    const comprobanteTipo = isFactura ? 'Factura' : 'Boleta';

    let docNumero = sale.docNumero || sale.numeroDocumento || '';
    if (!docNumero) {
      const matchDoc = sale.observaciones?.match(/(?:DOC:\s*(?:RUC|DNI)?|Doc:\s*|DNI:\s*|RUC:\s*)([0-9A-Za-z]+)/i);
      if (matchDoc) docNumero = matchDoc[1];
    }

    const createdDate = sale.created_at ? new Date(sale.created_at) : new Date();
    const fechaFormatted = createdDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const horaFormatted = createdDate.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const clienteName =
      sale.clienteNombre ||
      sale.cliente_nombre ||
      sale.cliente?.nombre ||
      'Cliente Web';

    const clienteTel =
      sale.clienteTelefono ||
      sale.cliente_telefono ||
      sale.cliente?.telefono ||
      '';

    const clienteEmail =
      sale.clienteCorreo ||
      sale.cliente_correo ||
      sale.cliente?.correo ||
      '';

    const modalidad = sale.recojo_en_tienda ? 'Recojo en Almacén' : 'Despacho a Obra';
    const direccion = sale.direccion || (sale.recojo_en_tienda ? 'Puente Piedra - Sede Principal' : 'No registrada');

    return {
      'Código de Venta': sale.codigo || 'S/N',
      'Fecha': fechaFormatted,
      'Hora': horaFormatted,
      'Canal': isMostrador ? 'Físico (Mostrador)' : 'Virtual (Web)',
      'Comprobante': comprobanteTipo,
      'Documento / RUC': docNumero || 'Sin doc',
      'Cliente / Razón Social': clienteName,
      'Teléfono / Celular': clienteTel,
      'Correo Electrónico': clienteEmail,
      'Medio de Pago': metodo,
      'Modalidad de Entrega': modalidad,
      'Dirección de Entrega': direccion,
      'Costo Flete (S/)': Number(Number(sale.costo_flete || 0).toFixed(2)),
      'Subtotal (S/)': Number(Number(sale.subtotal || 0).toFixed(2)),
      'I.G.V. (18%) (S/)': Number(Number(sale.igv || 0).toFixed(2)),
      'Total Venta (S/)': Number(Number(sale.total || 0).toFixed(2)),
      'Estado del Pedido': (sale.estado || 'registrado').toUpperCase()
    };
  });

  // 2. Crear libro y hoja
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. Ajuste de ancho de columnas automático para visualización óptima
  const columnWidths = [
    { wch: 16 }, // Código
    { wch: 12 }, // Fecha
    { wch: 10 }, // Hora
    { wch: 20 }, // Canal
    { wch: 14 }, // Comprobante
    { wch: 16 }, // Documento / RUC
    { wch: 30 }, // Cliente
    { wch: 16 }, // Teléfono
    { wch: 26 }, // Correo
    { wch: 22 }, // Medio de Pago
    { wch: 22 }, // Modalidad de Entrega
    { wch: 32 }, // Dirección
    { wch: 16 }, // Flete
    { wch: 14 }, // Subtotal
    { wch: 16 }, // IGV
    { wch: 16 }, // Total
    { wch: 18 }  // Estado
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Ventas');

  // 4. Nombre dinámico de archivo con fecha actual
  const today = new Date().toISOString().split('T')[0];
  const fileName = `Reporte_Ventas_Kenpaku_${today}.xlsx`;

  // 5. Descarga directa en el navegador
  XLSX.writeFile(workbook, fileName);

  return { success: true, count: rows.length, fileName };
}
