import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  FileSpreadsheet,
  Check,
  CreditCard,
  DollarSign,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Phone,
  Mail,
  User,
  Building2,
  RefreshCw,
  X
} from 'lucide-react';
import { getProducts } from '../../api/products';
import { createOrder } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import { formatPEN } from '../../utils/formatPEN';
import { calcIGV } from '../../utils/calcIGV';
import {
  sanitizeDigits,
  sanitizeOnlyLettersAndSpaces,
  sanitizeEmailInput,
  isValidEmail,
  isValidPhonePE
} from '../../utils/sanitizers';
import { CATEGORIES_LIST } from '../../utils/constants';
import { ReceiptModal } from '../../components/pos/ReceiptModal';
import { Button } from '../../components/ui/Button';

export function PosView() {
  const { email: cashierEmail } = useAuth();

  // Estados de catálogo y búsqueda
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Estados de la Boleta / Factura en curso
  const [ticketItems, setTicketItems] = useState([]);
  const [comprobanteTipo, setComprobanteTipo] = useState('boleta'); // 'boleta' | 'factura'
  const [docNumero, setDocNumero] = useState('');
  const [clienteNombres, setClienteNombres] = useState('');
  const [clienteApellidos, setClienteApellidos] = useState('');
  const [clienteNombre, setClienteNombre] = useState(''); // Razón Social en Factura
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState('');

  // Método de pago y efectivo
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'yape' | 'bcp' | 'bbva'
  const [montoRecibido, setMontoRecibido] = useState('');

  // Estado de procesamiento y comprobante emitido
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [issuedSale, setIssuedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Referencia para enfocar buscador con atajo
  const searchInputRef = useRef(null);

  // Carga inicial de productos
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getProducts({ page_size: 100 });
      setProducts(data.items || []);
    } catch (err) {
      console.error('Error al cargar productos en POS:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Atajos de teclado: F2 para enfocar buscador, F4 para emitir comprobante
  useEffect(() => {
    const handlePosKeydown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handlePosKeydown);
    return () => window.removeEventListener('keydown', handlePosKeydown);
  }, []);

  // Filtrado de productos en tiempo real
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.medida && p.medida.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.descripcion_corta && p.descripcion_corta.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = !selectedCategory || p.categoria === selectedCategory;
      const matchStock = !onlyInStock || p.stock_disponible > 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, onlyInStock]);

  // Manejo de Items en el Ticket
  const handleAddItem = (product) => {
    if (product.stock_disponible <= 0) return;

    setTicketItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock_disponible) {
          return prev; // No superar stock disponible
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          nombre: product.nombre,
          precio_unitario: Number(product.precio_unitario),
          stock_disponible: product.stock_disponible,
          cantidad: 1
        }
      ];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.cantidad + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock_disponible) return item;
            return { ...item, cantidad: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (productId) => {
    setTicketItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setMontoRecibido('');
    setSubmitError(null);
    setClienteNombres('');
    setClienteApellidos('');
    setClienteNombre('');
    setDocNumero('');
    setClienteTelefono('');
    setClienteCorreo('');
  };

  // Cálculos económicos
  const grandTotal = useMemo(() => {
    return ticketItems.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  }, [ticketItems]);

  const { subtotal, igv, total } = useMemo(() => {
    return calcIGV(grandTotal);
  }, [grandTotal]);

  // Cálculo de vuelto para efectivo
  const numRecibido = parseFloat(montoRecibido) || 0;
  const vuelto = metodoPago === 'efectivo' && numRecibido >= total ? numRecibido - total : 0;
  const saldoFaltante = metodoPago === 'efectivo' && numRecibido < total ? total - numRecibido : 0;

  // Manejadores de campos de cliente
  const handleDocChange = (e) => {
    const maxLen = comprobanteTipo === 'factura' ? 11 : 8;
    setDocNumero(sanitizeDigits(e.target.value, maxLen));
  };

  const handleNombresChange = (e) => {
    setClienteNombres(sanitizeOnlyLettersAndSpaces(e.target.value));
  };

  const handleApellidosChange = (e) => {
    setClienteApellidos(sanitizeOnlyLettersAndSpaces(e.target.value));
  };

  const handleRazonSocialChange = (e) => {
    setClienteNombre(e.target.value);
  };

  const handlePhoneChange = (e) => {
    setClienteTelefono(sanitizeDigits(e.target.value, 9));
  };

  const handleEmailChange = (e) => {
    setClienteCorreo(sanitizeEmailInput(e.target.value));
  };

  // Procesar y Emitir Venta
  const handleProcessSale = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (ticketItems.length === 0) {
      setSubmitError('Agrega al menos un producto al ticket para emitir la venta.');
      return;
    }

    const nombreCompleto =
      comprobanteTipo === 'boleta'
        ? `${clienteNombres.trim()} ${clienteApellidos.trim()}`.trim()
        : clienteNombre.trim();

    if (comprobanteTipo === 'boleta') {
      if (!clienteNombres.trim()) {
        setSubmitError('Ingresa los nombres del cliente para la boleta.');
        return;
      }
      if (!clienteApellidos.trim()) {
        setSubmitError('Ingresa los apellidos del cliente para la boleta.');
        return;
      }
      if (!docNumero || docNumero.length !== 8) {
        setSubmitError('El DNI del cliente es obligatorio y debe tener exactamente 8 dígitos.');
        return;
      }
    } else {
      if (!docNumero || docNumero.length !== 11) {
        setSubmitError('El RUC para Factura Electrónica es obligatorio y debe tener exactamente 11 dígitos.');
        return;
      }
      if (!clienteNombre.trim()) {
        setSubmitError('Ingresa la Razón Social de la empresa para la factura.');
        return;
      }
    }

    if (clienteTelefono && !isValidPhonePE(clienteTelefono)) {
      setSubmitError('El número de celular debe comenzar con 9 y tener 9 dígitos.');
      return;
    }

    if (clienteCorreo && !isValidEmail(clienteCorreo)) {
      setSubmitError('El formato del correo electrónico ingresado no es válido.');
      return;
    }

    if (metodoPago === 'efectivo' && numRecibido < total) {
      setSubmitError(`El monto recibido en efectivo (S/ ${numRecibido.toFixed(2)}) es menor al total a pagar.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        cliente: {
          nombre: nombreCompleto,
          telefono: clienteTelefono.trim() || '999999999',
          correo: clienteCorreo.trim() || null
        },
        canal: 'pos_tienda',
        recojo_en_tienda: true,
        direccion: null,
        observaciones: `[VENTA MOSTRADOR] ${comprobanteTipo.toUpperCase()} | Doc: ${docNumero || 'Sin doc'} | Pago: ${metodoPago.toUpperCase()}${metodoPago === 'efectivo' ? ` (Recibido: S/ ${numRecibido.toFixed(2)} - Vuelto: S/ ${vuelto.toFixed(2)})` : ''} | Cajero: ${cashierEmail || 'cajero'}`,
        acepto_privacidad: true,
        items: ticketItems.map((it) => ({
          product_id: it.product_id,
          cantidad: it.cantidad
        }))
      };

      const result = await createOrder(orderPayload);

      // Preparar datos para el comprobante emitido
      const saleDetails = {
        codigo: result.codigo || 'KPK-000001',
        comprobanteTipo,
        numeroDocumento: docNumero,
        clienteNombre: nombreCompleto,
        clienteTelefono: clienteTelefono.trim(),
        clienteCorreo: clienteCorreo.trim(),
        metodoPago,
        montoRecibido: numRecibido,
        vuelto,
        items: ticketItems,
        subtotal,
        igv,
        total,
        fechaEmision: new Date()
      };

      setIssuedSale(saleDetails);
      setIsReceiptModalOpen(true);

      // Recargar catálogo para refrescar inventario actualizado
      fetchProducts();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Error al procesar la venta. Verifique los productos y el stock.';
      setSubmitError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNextSale = () => {
    handleClearTicket();
    setIssuedSale(null);
  };

  return (
    <div className="space-y-4">
      {/* Contenedor Principal: Pantalla Dividida (Split Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA: BUSCADOR Y CATÁLOGO DE TIENDA (7 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Filtros y Búsqueda Rápida */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-kenpaku-blue" />
                <h2 className="text-base font-extrabold text-kenpaku-navy">
                  Catálogo de Productos de Tienda
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Atajo: Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-slate-700 font-bold">F2</kbd>
              </span>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, medida (ej. 2 pulgadas, 6 m, 2 mm)..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kenpaku-blue focus:border-transparent transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Píldoras de Categoría */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  !selectedCategory
                    ? 'bg-kenpaku-navy text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-kenpaku-blue text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}

              <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-1 sm:pt-0">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-kenpaku-blue focus:ring-kenpaku-blue w-4 h-4"
                />
                <span>Solo con stock</span>
              </label>
            </div>
          </div>

          {/* Grilla de Productos */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto encontrado' : 'Productos encontrados'}
              </span>
              <button
                onClick={fetchProducts}
                className="text-xs font-semibold text-slate-500 hover:text-kenpaku-blue flex items-center gap-1"
                title="Actualizar catálogo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-kenpaku-blue" />
                <p className="text-sm">Cargando inventario de tienda...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No se encontraron productos</p>
                <p className="text-xs text-slate-400">Intenta con otros términos o limpia los filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const inStock = p.stock_disponible > 0;
                  const isLow = p.stock_disponible > 0 && p.stock_disponible <= 10;
                  const inTicket = ticketItems.find((it) => it.product_id === p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        inStock
                          ? 'border-slate-200 hover:border-sky-300 hover:shadow-xs bg-white'
                          : 'border-slate-200 bg-slate-50/70 opacity-70'
                      }`}
                    >
                      <div>
                        {/* Cabecera Tarjeta: Categoría y Medida */}
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-100 text-slate-600 text-[10px]">
                            {p.categoria}
                          </span>
                          {p.medida && (
                            <span className="text-slate-500 font-medium truncate max-w-[120px]">
                              {p.medida}
                            </span>
                          )}
                        </div>

                        {/* Nombre del Producto */}
                        <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 mb-1.5">
                          {p.nombre}
                        </h3>

                        {/* Badges de Acabado y Stock */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                          {p.acabado && p.acabado !== 'ninguno' && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold text-[10px]">
                              {p.acabado}
                            </span>
                          )}

                          {inStock ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              Stock: {p.stock_disponible} und
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-bold text-[10px]">
                              Agotado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pie de Tarjeta: Precio y Botón Agregar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">
                            Precio unitario
                          </div>
                          <div className="text-base font-extrabold text-kenpaku-blue">
                            {formatPEN(p.precio_unitario)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddItem(p)}
                          disabled={!inStock || (inTicket && inTicket.cantidad >= p.stock_disponible)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            !inStock || (inTicket && inTicket.cantidad >= p.stock_disponible)
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : inTicket
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-kenpaku-blue text-white hover:bg-sky-700 shadow-2xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inTicket ? `En ticket (${inTicket.cantidad})` : 'Agregar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMNA DERECHA: CONFECCIÓN DE BOLETA / TICKET (5 Cols)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleProcessSale}
            className="bg-white rounded-3xl p-5 shadow-md border border-slate-200 space-y-4 sticky top-20"
          >
            {/* Cabecera de la Boleta */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-kenpaku-navy" />
                <h2 className="text-base font-extrabold text-kenpaku-navy">
                  Comprobante de Venta
                </h2>
              </div>
              {ticketItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTicket}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Limpiar ticket
                </button>
              )}
            </div>

            {/* Selector de Tipo de Comprobante: Boleta vs Factura */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setComprobanteTipo('boleta')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  comprobanteTipo === 'boleta'
                    ? 'bg-white text-kenpaku-navy shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4 text-kenpaku-blue" />
                <span>Boleta de Venta</span>
              </button>
              <button
                type="button"
                onClick={() => setComprobanteTipo('factura')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  comprobanteTipo === 'factura'
                    ? 'bg-white text-kenpaku-navy shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Factura con RUC</span>
              </button>
            </div>

            {/* Datos del Cliente */}
            <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Datos del Comprador
              </span>

              {comprobanteTipo === 'boleta' ? (
                <>
                  {/* Nombres y Apellidos en 2 casillas diferentes con restricción de solo letras y espacios */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={clienteNombres}
                        onChange={handleNombresChange}
                        placeholder="Ej. Juan Carlos (Obligatorio)"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={clienteApellidos}
                        onChange={handleApellidosChange}
                        placeholder="Ej. Perez Gomez (Obligatorio)"
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                      />
                    </div>
                  </div>

                  {/* DNI del Cliente (estrictamente 8 dígitos, obligatorio) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      DNI del Cliente (8 dígitos) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={docNumero}
                      onChange={handleDocChange}
                      placeholder="Ej. 72819231 (Obligatorio)"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Factura con RUC (se mantiene tal como está con indicación obligatoria) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      RUC de la Empresa (11 dígitos) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={docNumero}
                      onChange={handleDocChange}
                      placeholder="Ej. 20601234567 (Obligatorio)"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={handleRazonSocialChange}
                      placeholder="Ej. Constructora del Norte S.A.C. (Obligatorio)"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                    />
                  </div>
                </>
              )}

              {/* Celular y Correo en 2 columnas (ambos opcionales) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Celular (9 dígitos)
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={clienteTelefono}
                    onChange={handlePhoneChange}
                    placeholder="Ej. 987654321 (Opcional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={clienteCorreo}
                    onChange={handleEmailChange}
                    placeholder="cliente@correo.com (Opcional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kenpaku-blue"
                  />
                </div>
              </div>
            </div>

            {/* Detalle de Productos en el Ticket */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Productos en el Ticket</span>
                <span className="text-kenpaku-blue font-extrabold">{ticketItems.length} items</span>
              </div>

              {ticketItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Ticket vacío</p>
                  <p className="text-[11px] text-slate-400">
                    Usa el catálogo de la izquierda para agregar tubos, planchas o perfiles.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {ticketItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {item.nombre}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatPEN(item.precio_unitario)} c/u
                        </div>
                      </div>

                      {/* Stepper de Cantidad */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product_id, -1)}
                          className="p-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold text-slate-800 w-5 text-center">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product_id, 1)}
                          disabled={item.cantidad >= item.stock_disponible}
                          className="p-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal Item y Borrar */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-kenpaku-navy">
                          {formatPEN(item.precio_unitario * item.cantidad)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-[10px] text-red-500 hover:text-red-700 p-0.5"
                          title="Quitar"
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen Económico */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5 shadow-inner">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Op. Gravada:</span>
                <span>{formatPEN(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>I.G.V. (18% incluido):</span>
                <span>{formatPEN(igv)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-white pt-1.5 border-t border-slate-800">
                <span>TOTAL:</span>
                <span className="text-amber-400">{formatPEN(total)}</span>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Método de Pago en Mostrador *
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'yape', label: 'Yape', icon: CreditCard },
                  { id: 'bcp', label: 'BCP', icon: Building2 },
                  { id: 'bbva', label: 'BBVA', icon: Building2 }
                ].map((m) => {
                  const Icon = m.icon;
                  const active = metodoPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoPago(m.id)}
                      className={`p-2 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all ${
                        active
                          ? 'border-kenpaku-blue bg-sky-50 text-kenpaku-blue shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Calculadora de Vuelto para Efectivo */}
              {metodoPago === 'efectivo' && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900">
                      Monto en Efectivo Recibido (S/):
                    </label>
                    <button
                      type="button"
                      onClick={() => setMontoRecibido(total.toFixed(2))}
                      className="text-[11px] font-bold text-kenpaku-blue hover:underline"
                    >
                      Monto Exacto
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    aria-label="Monto recibido en efectivo"
                    data-testid="monto-efectivo-input"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    placeholder={`Ej. ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />

                  {/* Atajos Rápidos de Billetes */}
                  <div className="flex gap-1.5">
                    {[20, 50, 100].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setMontoRecibido(String(billete))}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
                      >
                        S/ {billete}
                      </button>
                    ))}
                  </div>

                  {/* Indicador de Vuelto o Saldo Pendiente */}
                  {numRecibido > 0 && (
                    <div className="pt-1 text-xs">
                      {numRecibido >= total ? (
                        <div className="flex justify-between font-extrabold text-emerald-700 bg-emerald-100/60 p-2 rounded-xl border border-emerald-300">
                          <span>VUELTO A ENTREGAR:</span>
                          <span className="text-sm">{formatPEN(vuelto)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between font-bold text-red-700 bg-red-100/60 p-2 rounded-xl border border-red-300">
                          <span>MONTO INSUFICIENTE:</span>
                          <span>Falta {formatPEN(saldoFaltante)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error al emitir */}
            {submitError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Botón Principal de Emisión */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={ticketItems.length === 0}
              icon={Receipt}
            >
              Emitir Comprobante (F4)
            </Button>
          </form>
        </div>
      </div>

      {/* Modal de Comprobante / Ticket Térmico Emitido */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleData={issuedSale}
        onNewSale={handleResetForNextSale}
      />
    </div>
  );
}
