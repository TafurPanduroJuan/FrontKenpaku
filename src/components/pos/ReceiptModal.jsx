import React from 'react';
import { Printer, Download, MessageSquare, CheckCircle2, X, FileText, ArrowRight } from 'lucide-react';
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

  const correlativo = `${comprobanteTipo === 'factura' ? 'F001' : 'B001'}-${String(codigo || '1001').replace(/\D/g, '').slice(-6) || '000001'}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textContent = `
========================================
       COMERCIAL KENPAKU S.A.C.
       RUC: ${STORE_INFO.ruc}
  Av. Panamericana Norte Km 25.5
      Puente Piedra, Lima - Perú
       Teléfono: ${STORE_INFO.phone}
========================================
${comprobanteTipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
Serie-Número: ${correlativo}
Pedido Ref: ${codigo}
Fecha: ${new Date(fechaEmision).toLocaleString('es-PE')}
----------------------------------------
CLIENTE: ${clienteNombre}
${numeroDocumento ? (comprobanteTipo === 'factura' ? `RUC: ${numeroDocumento}` : `DNI: ${numeroDocumento}`) : ''}
TELÉFONO: ${clienteTelefono}
CORREO: ${clienteCorreo}
----------------------------------------
CANT.  DESCRIPCIÓN             IMPORTE
----------------------------------------
${items.map(it => `${String(it.cantidad).padEnd(6)} ${(it.nombre || '').slice(0, 22).padEnd(23)} S/ ${(it.precio_unitario * it.cantidad).toFixed(2)}`).join('\n')}
----------------------------------------
OP. GRAVADA:          S/ ${Number(subtotal).toFixed(2)}
I.G.V. (18%):         S/ ${Number(igv).toFixed(2)}
TOTAL A PAGAR:        S/ ${Number(total).toFixed(2)}
----------------------------------------
FORMA DE PAGO: ${metodoPago.toUpperCase()}
${metodoPago === 'efectivo' && montoRecibido ? `Importe Recibido:     S/ ${Number(montoRecibido).toFixed(2)}\nVuelto al Cliente:    S/ ${Number(vuelto).toFixed(2)}` : ''}
========================================
 ¡Gracias por su compra en Kenpaku!
========================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprobante_${correlativo}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanPhone = String(clienteTelefono || '').replace(/\D/g, '');
  const whatsappMsg = encodeURIComponent(
    `¡Hola ${clienteNombre}! Comercial Kenpaku te envía el comprobante de tu compra (${comprobanteTipo === 'factura' ? 'Factura' : 'Boleta'} ${correlativo}) por un total de ${formatPEN(total)}. ¡Gracias por tu preferencia!`
  );
  const whatsappUrl = `https://wa.me/51${cleanPhone}?text=${whatsappMsg}`;

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

        {/* Acciones Rápidas */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-kenpaku-blue text-white hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar</span>
            </button>
          </div>

          {cleanPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </a>
          )}
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
              {numeroDocumento && (
                <div className="text-slate-600">
                  {comprobanteTipo === 'factura' ? 'RUC: ' : 'DNI: '}{numeroDocumento}
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
