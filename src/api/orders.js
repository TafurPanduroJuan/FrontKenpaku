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
