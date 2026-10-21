import { apiClient } from './client';
import { MOCK_PRODUCTS } from './mockData';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { calcIGV } from '../utils/calcIGV';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * POST /orders
 */
export async function createOrder(orderPayload) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 400));
    
    const orderItems = [];
    let grandTotal = 0;

    for (const item of orderPayload.items) {
      const prod = MOCK_PRODUCTS.find(p => p.id === item.product_id);
      if (!prod) {
        throw { response: { status: 400, data: { detail: `Producto no encontrado (ID: ${item.product_id})` } } };
      }

      if (prod.stock_disponible < item.cantidad) {
        throw { 
          response: { 
            status: 409, 
            data: { 
              detail: `Stock insuficiente para el producto "${prod.nombre}". Solicitado: ${item.cantidad}, Disponible: ${prod.stock_disponible}`,
              code: 'STOCK_INSUFFICIENT',
              productos_afectados: [{ product_id: prod.id, nombre: prod.nombre, stock_disponible: prod.stock_disponible, solicitado: item.cantidad }]
            } 
          } 
        };
      }

      const lineTotal = prod.precio_unitario * item.cantidad;
      grandTotal += lineTotal;

      orderItems.push({
        product_id: prod.id,
        nombre: prod.nombre,
        cantidad: item.cantidad,
        precio_unitario: prod.precio_unitario
      });
    }

    const { subtotal, igv, total } = calcIGV(grandTotal);
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const codigo = `KPK-${randomNum}`;

    const msg = `¡Hola Comercial Kenpaku! He registrado el pedido *${codigo}* a nombre de *${orderPayload.cliente.nombre}* por un total de *S/ ${total.toFixed(2)}*. Deseo coordinar el pago y el flete.`;
    const whatsapp_url = buildWhatsAppUrl(msg);

    return {
      codigo,
      estado: 'pendiente',
      subtotal,
      igv,
      total,
      items: orderItems,
      whatsapp_url
    };
  }

  try {
    const { data } = await apiClient.post('/orders', orderPayload);
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * GET /orders/tracking?token=... o GET /orders/tracking?codigo=...&telefono=...
 */
export async function getOrderTracking({ token, codigo, telefono } = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));
    const cleanToken = token?.trim();
    const cleanCodigo = codigo?.trim()?.toUpperCase();

    const mockOrder = MOCK_PRODUCTS ? {
      codigo: cleanCodigo || 'KPK-000001',
      estado: 'confirmado',
      recojo_en_tienda: false,
      subtotal: 195.0,
      igv: 35.1,
      costo_flete: 25.0,
      estado_flete: 'cotizado',
      total: 255.1,
      tracking_token: cleanToken || 'kpk_mocktoken_abcdef123456',
      created_at: new Date().toISOString(),
      items: [
        {
          nombre: 'Plancha LAF 1.5 mm 1.20 × 2.40 m',
          cantidad: 1,
          precio_unitario: 195.0
        }
      ],
      events: [
        {
          estado_nuevo: 'pendiente',
          nota: 'Pedido registrado en la web',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          estado_nuevo: 'confirmado',
          nota: 'Depósito validado y stock reservado',
          created_at: new Date().toISOString()
        }
      ],
      whatsapp_url: buildWhatsAppUrl(`Hola Comercial Kenpaku, consulto por mi pedido ${cleanCodigo || 'KPK-000001'}`),
      cliente_resumen: 'Alexis M.'
    } : null;

    return mockOrder;
  }

  const params = {};
  if (token) params.token = token.trim();
  if (codigo) params.codigo = codigo.trim();
  if (telefono) params.telefono = telefono.trim();

  const { data } = await apiClient.get('/orders/tracking', { params });
  return data;
}

/**
 * POST /orders/tracking/flete-decision
 */
export async function submitFleteDecision({ token, codigo, telefono, decision, nota } = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));
    return {
      ok: true,
      estado_flete: decision === 'aceptar' ? 'aceptado' : 'rechazado',
      mensaje: 'Decisión de flete registrada con éxito.'
    };
  }

  const params = {};
  if (token) params.token = token.trim();
  if (codigo) params.codigo = codigo.trim();
  if (telefono) params.telefono = telefono.trim();

  const { data } = await apiClient.post(
    '/orders/tracking/flete-decision',
    { decision, nota },
    { params }
  );
  return data;
}

/**
 * POST /orders/tracking/voucher
 */
export async function uploadOrderVoucher({ token, codigo, telefono, file, metodo_pago } = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 500));
    return {
      ok: true,
      voucher_url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : 'mock-voucher-url',
      fecha_pago: new Date().toISOString(),
      mensaje: 'Comprobante de pago recibido con éxito.'
    };
  }

  const params = {};
  if (token) params.token = token.trim();
  if (codigo) params.codigo = codigo.trim();
  if (telefono) params.telefono = telefono.trim();

  const formData = new FormData();
  formData.append('file', file);
  if (metodo_pago) {
    formData.append('metodo_pago', metodo_pago);
  }

  const { data } = await apiClient.post('/orders/tracking/voucher', formData, {
    params,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

/**
 * PUT /admin/orders/{orderId}/validate-voucher
 */
export async function validateOrderVoucher({ orderId, aprobado, nota, metodo_pago } = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));
    return { ok: true, estado: aprobado ? 'confirmado' : 'pendiente' };
  }

  const { data } = await apiClient.put(`/admin/orders/${orderId}/validate-voucher`, {
    aprobado,
    nota,
    metodo_pago
  });
  return data;
}

/**
 * PUT /admin/orders/{orderId}/metodo-pago
 */
export async function updateOrderPaymentMethod({ orderId, metodo_pago, nota } = {}) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));
    return { ok: true, metodo_pago };
  }

  const { data } = await apiClient.put(`/admin/orders/${orderId}/metodo-pago`, {
    metodo_pago,
    nota
  });
  return data;
}


