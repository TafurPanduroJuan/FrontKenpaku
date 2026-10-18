import React from 'react';
import { Printer, Download, CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { STORE_INFO } from '../../utils/constants';
import { formatPEN } from '../../utils/formatPEN';
import { Button } from '../ui/Button';

export function ReceiptModal({ isOpen, onClose, saleData, onNewSale }) {
  if (!isOpen || !saleData) return null;

  const {
    codigo,
    comprobanteTipo = 'boleta', // 'boleta' o 'factura'
    numeroDocumento = '',
    clienteNombre = '',
    clienteTelefono = '',
    clienteCorreo = '',
    metodoPago = 'efectivo',
    montoRecibido = 0,
    vuelto = 0,
    items = [],
    subtotal = 0,
    igv = 0,
    total = 0,
    fechaEmision = new Date()
  } = saleData;

  const docFinal = saleData.numeroDocumento || saleData.docNumero || '';

  const correlativo = `${comprobanteTipo === 'factura' ? 'F001' : 'B001'}-${String(codigo || '1001').replace(/\D/g, '').slice(-6) || '000001'}`;

  // Plantilla HTML pura para impresión térmica de 80mm y descarga de comprobante
  const generateTicketHtml = () => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta'} ${correlativo} - Comercial Kenpaku</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 76mm !important;
        margin: 0 auto !important;
        padding: 6px 2px !important;
        background: #fff !important;
        color: #000 !important;
      }
    }
    body {
      font-family: 'Courier New', Courier, monospace, sans-serif;
      width: 76mm;
      margin: 0 auto;
      padding: 12px 6px;
      color: #111;
      background: #fff;
      font-size: 11px;
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .divider { border-top: 1px dashed #333; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin: 4px 0; }
    th { border-bottom: 1px dashed #333; padding: 2px 0; text-align: left; font-size: 10px; }
    td { padding: 3px 0; vertical-align: top; }
    .logo-box { width: 26px; height: 26px; background: #0c1b33; color: white; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="logo-box">K</div>
    <div class="font-bold" style="font-size: 12px;">COMERCIAL KENPAKU S.A.C.</div>
    <div class="font-bold">RUC: ${STORE_INFO.ruc}</div>
    <div>${STORE_INFO.address}</div>
    <div>Puente Piedra, Lima - Perú</div>
    <div>Tel: ${STORE_INFO.phone}</div>
  </div>
  <div class="divider"></div>
  <div class="text-center font-bold" style="font-size: 12px;">
    ${comprobanteTipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
  </div>
  <div class="text-center font-bold" style="color: #0284c7; margin-bottom: 4px;">${correlativo}</div>
  <div class="row"><span>Pedido Ref:</span><span class="font-bold">${codigo}</span></div>
  <div class="row"><span>Fecha:</span><span>${new Date(fechaEmision).toLocaleDateString('es-PE')}</span></div>
  <div class="row"><span>Hora:</span><span>${new Date(fechaEmision).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
  <div class="divider"></div>
  <div><span class="font-bold">CLIENTE:</span> ${clienteNombre}</div>
  ${docFinal ? `<div><span class="font-bold">${comprobanteTipo === 'factura' ? 'RUC' : 'DNI'}:</span> ${docFinal}</div>` : ''}
  ${clienteTelefono ? `<div><span class="font-bold">TEL:</span> ${clienteTelefono}</div>` : ''}
  ${clienteCorreo ? `<div><span class="font-bold">EMAIL:</span> ${clienteCorreo}</div>` : ''}
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">CANT</th>
        <th style="width: 55%;">PRODUCTO</th>
        <th style="width: 30%; text-align: right;">IMPORTE</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td class="font-bold">${it.cantidad}</td>
          <td>${it.nombre}</td>
          <td class="text-right">${formatPEN(it.precio_unitario * it.cantidad)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="divider"></div>
  <div class="row"><span>Op. Gravada:</span><span>${formatPEN(subtotal)}</span></div>
  <div class="row"><span>I.G.V. (18%):</span><span>${formatPEN(igv)}</span></div>
  <div class="row font-bold" style="font-size: 13px; margin-top: 3px;"><span>TOTAL:</span><span>${formatPEN(total)}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Forma de Pago:</span><span class="font-bold" style="text-transform: uppercase;">${metodoPago}</span></div>
  ${metodoPago === 'efectivo' && montoRecibido > 0 ? `
    <div class="row"><span>Efectivo recibido:</span><span>${formatPEN(montoRecibido)}</span></div>
    <div class="row font-bold" style="color: #047857;"><span>Vuelto entregado:</span><span>${formatPEN(vuelto)}</span></div>
  ` : ''}
  <div class="divider"></div>
  <div class="text-center" style="font-size: 9.5px; color: #444; margin-top: 6px;">
    <div>Representación impresa de la ${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta de Venta'} Electrónica</div>
    <div class="font-bold" style="color: #111; margin: 2px 0;">¡Gracias por su compra!</div>
    <div>Comercial Kenpaku - Especialistas en Acero</div>
  </div>
</body>
</html>`;

  // Impresión aislada térmica limpia en 80mm sin marcos ni sombras de modal
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.title = 'TicketPrintFrame';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(generateTicketHtml());
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.error('Error al imprimir comprobante:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1500);
      }
    }, 250);
  };

  // Descarga inmediata del comprobante en formato PDF
  const handleDownload = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, Math.max(180, 140 + items.length * 8)]
      });

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text('COMERCIAL KENPAKU S.A.C.', 40, 10, { align: 'center' });
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`RUC: ${STORE_INFO.ruc}`, 40, 14, { align: 'center' });
      doc.text(STORE_INFO.address, 40, 18, { align: 'center' });
      doc.text('Puente Piedra, Lima - Perú', 40, 22, { align: 'center' });
      doc.text(`Tel: ${STORE_INFO.phone}`, 40, 26, { align: 'center' });

      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, 29, 75, 29);

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text(
        comprobanteTipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA',
        40,
        34,
        { align: 'center' }
      );
      doc.setTextColor(2, 132, 199);
      doc.text(correlativo, 40, 39, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      let y = 44;
      doc.text(`Pedido Ref: ${codigo}`, 6, y);
      y += 4;
      doc.text(`Fecha: ${new Date(fechaEmision).toLocaleDateString('es-PE')} ${new Date(fechaEmision).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, 6, y);
      y += 4;
      doc.line(5, y, 75, y);
      y += 4;

      doc.setFont('courier', 'bold');
      doc.text(`CLIENTE: ${clienteNombre}`, 6, y);
      y += 4;
      doc.setFont('courier', 'normal');
      if (docFinal) {
        doc.text(`${comprobanteTipo === 'factura' ? 'RUC' : 'DNI'}: ${docFinal}`, 6, y);
        y += 4;
      }
      if (clienteTelefono) {
        doc.text(`TEL: ${clienteTelefono}`, 6, y);
        y += 4;
      }
      doc.line(5, y, 75, y);
      y += 4;

      // Encabezado de productos
      doc.setFont('courier', 'bold');
      doc.text('CANT', 6, y);
      doc.text('DESCRIPCIÓN', 18, y);
      doc.text('TOTAL', 74, y, { align: 'right' });
      y += 3;
      doc.line(5, y, 75, y);
      y += 4;

      doc.setFont('courier', 'normal');
      items.forEach((it) => {
        const itemTotal = `S/ ${(it.precio_unitario * it.cantidad).toFixed(2)}`;
        const nameShort = (it.nombre || '').length > 22 ? (it.nombre || '').slice(0, 21) + '..' : (it.nombre || '');
        doc.text(String(it.cantidad), 6, y);
        doc.text(nameShort, 18, y);
        doc.text(itemTotal, 74, y, { align: 'right' });
        y += 4.5;
      });

      doc.line(5, y, 75, y);
      y += 4.5;

      doc.text('Op. Gravada:', 6, y);
      doc.text(`S/ ${Number(subtotal).toFixed(2)}`, 74, y, { align: 'right' });
      y += 4;

      doc.text('I.G.V. (18%):', 6, y);
      doc.text(`S/ ${Number(igv).toFixed(2)}`, 74, y, { align: 'right' });
      y += 4.5;

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL:', 6, y);
      doc.text(`S/ ${Number(total).toFixed(2)}`, 74, y, { align: 'right' });
      y += 4;

      doc.line(5, y, 75, y);
      y += 4;

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Forma de Pago: ${metodoPago.toUpperCase()}`, 6, y);
      y += 4;
      if (metodoPago === 'efectivo' && montoRecibido > 0) {
        doc.text(`Efectivo recibido: S/ ${Number(montoRecibido).toFixed(2)}`, 6, y);
        y += 4;
        doc.text(`Vuelto entregado: S/ ${Number(vuelto).toFixed(2)}`, 6, y);
        y += 4;
      }

      doc.line(5, y, 75, y);
      y += 5;
      doc.setFontSize(6.5);
      doc.text(`Representación impresa de la ${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta de Venta'} Electrónica`, 40, y, { align: 'center' });
      y += 3.5;
      doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });
      y += 3.5;
      doc.text('Comercial Kenpaku - Especialistas en Acero', 40, y, { align: 'center' });

      doc.save(`${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta'}_${correlativo}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF de comprobante:', err);
      // Fallback a HTML visual si el navegador tuviera bloqueo
      const htmlContent = generateTicketHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta'}_${correlativo}.html`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Contenedor Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in">
        {/* Cabecera Superior del Modal */}
        <div className="bg-kenpaku-navy text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base text-white">Venta Emitida con Éxito</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones Rápidas Centradas: Imprimir Boleta y Descargar Boleta */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-kenpaku-blue text-white hover:bg-sky-700 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{comprobanteTipo === 'factura' ? 'Imprimir Factura' : 'Imprimir Boleta'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Descargar comprobante en formato PDF"
          >
            <Download className="w-4 h-4 text-kenpaku-blue" />
            <span>{comprobanteTipo === 'factura' ? 'Descargar Factura' : 'Descargar Boleta'}</span>
          </button>
        </div>

        {/* Comprobante Térmico para Impresión y Previsualización */}
        <div className="p-6 max-h-[60vh] overflow-y-auto receipt-print-area font-mono text-slate-800 text-xs">
          <div className="max-w-[320px] mx-auto bg-white p-4 rounded-xl border border-dashed border-slate-300 shadow-2xs receipt-ticket">
            {/* Cabecera Empresa */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="w-8 h-8 rounded-lg bg-kenpaku-navy text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-1">
                K
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">COMERCIAL KENPAKU S.A.C.</h4>
              <p className="text-[11px] font-bold text-slate-700">RUC: {STORE_INFO.ruc}</p>
              <p className="text-[10px] text-slate-500">{STORE_INFO.address}</p>
              <p className="text-[10px] text-slate-500">Puente Piedra, Lima - Perú</p>
              <p className="text-[10px] text-slate-500">Tel: {STORE_INFO.phone}</p>
            </div>

            {/* Datos del Comprobante */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="text-center font-extrabold text-xs text-slate-900 uppercase">
                {comprobanteTipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
              </div>
              <div className="text-center font-bold text-xs text-kenpaku-blue">
                {correlativo}
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Pedido Ref:</span>
                <span className="font-bold">{codigo}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Fecha:</span>
                <span>{new Date(fechaEmision).toLocaleDateString('es-PE')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Hora:</span>
                <span>{new Date(fechaEmision).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="font-bold text-slate-800 truncate">CLIENTE: {clienteNombre}</div>
              {docFinal && (
                <div className="text-slate-600">
                  {comprobanteTipo === 'factura' ? 'RUC: ' : 'DNI: '}{docFinal}
                </div>
              )}
              {clienteTelefono && <div className="text-slate-600">CEL: {clienteTelefono}</div>}
              {clienteCorreo && <div className="text-slate-600 truncate">EMAIL: {clienteCorreo}</div>}
            </div>

            {/* Lista de Productos */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-slate-600 pb-1 border-b border-slate-200">
                <span className="col-span-2">Cant</span>
                <span className="col-span-6">Producto</span>
                <span className="col-span-4 text-right">Importe</span>
              </div>
              <div className="divide-y divide-slate-100 py-1 space-y-1">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] pt-1">
                    <span className="col-span-2 font-bold">{it.cantidad}</span>
                    <span className="col-span-6 leading-tight pr-1">{it.nombre}</span>
                    <span className="col-span-4 text-right font-medium">
                      {formatPEN(it.precio_unitario * it.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen Económico */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Op. Gravada:</span>
                <span>{formatPEN(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span>{formatPEN(igv)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatPEN(total)}</span>
              </div>
            </div>

            {/* Detalle de Pago y Vuelto */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Forma de Pago:</span>
                <span className="font-bold uppercase text-slate-800">{metodoPago}</span>
              </div>
              {metodoPago === 'efectivo' && montoRecibido > 0 && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Efectivo recibido:</span>
                    <span>{formatPEN(montoRecibido)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Vuelto entregado:</span>
                    <span>{formatPEN(vuelto)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pie de Comprobante */}
            <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
              <p>Representación impresa de la {comprobanteTipo === 'factura' ? 'Factura' : 'Boleta de Venta'} Electrónica</p>
              <p className="font-bold text-slate-700">¡Gracias por su compra!</p>
              <p>Comercial Kenpaku - Especialistas en Acero</p>
            </div>
          </div>
        </div>

        {/* Pie de Página del Modal */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 no-print">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cerrar Vista
          </Button>
          <Button
            variant="primary"
            icon={ArrowRight}
            onClick={() => {
              onClose();
              if (onNewSale) onNewSale();
            }}
          >
            Siguiente Venta
          </Button>
        </div>
      </div>
    </div>
  );
}
