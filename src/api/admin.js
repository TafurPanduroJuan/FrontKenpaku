import { apiClient } from './client';
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_CLAIMS, MOCK_CHAT_LOGS } from './mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Helper to check token for mocks
function checkAuth() {
  const token = localStorage.getItem('kenpaku_admin_token');
  if (!token) {
    const error = new Error('Unauthorized');
    error.response = { status: 401, data: { detail: 'Token inválido o expirado' } };
    throw error;
  }
}

export async function getAdminDashboard() {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    return {
      pedidos_pendientes: MOCK_ORDERS.filter(o => o.estado === 'pendiente').length,
      pedidos_hoy: MOCK_ORDERS.length,
      consultas_chat_hoy: 142,
      porcentaje_derivadas: 12.5
    };
  }
  const { data } = await apiClient.get('/admin/dashboard');
  return data;
}

export async function getAdminOrders(params = {}) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    let items = [...MOCK_ORDERS];
    if (params.estado && params.estado !== 'todos') {
      items = items.filter(o => o.estado === params.estado);
    }
    return { items, total: items.length, page: 1, page_size: 12 };
  }
  // 'todos' no es un estado válido en el backend: se omite el filtro
  const query = { ...params };
  if (query.estado === 'todos') delete query.estado;
  const { data } = await apiClient.get('/admin/orders', { params: query });
  return data;
}

export async function getAdminOrderById(id) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 150));
    const order = MOCK_ORDERS.find(o => o.codigo === id || o.id === id);
    if (!order) throw { response: { status: 404, data: { detail: 'Pedido no encontrado' } } };
    return order;
  }
  const { data } = await apiClient.get(`/admin/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id, estadoOrData, maybeNota, maybeCostoFlete) {
  let payload = {};
  if (typeof estadoOrData === 'object' && estadoOrData !== null) {
    payload = { ...estadoOrData };
  } else {
    payload = {
      estado: estadoOrData,
      ...(maybeNota ? { nota: maybeNota } : {}),
      ...(maybeCostoFlete !== undefined && maybeCostoFlete !== null ? { costo_flete: Number(maybeCostoFlete) } : {})
    };
  }

  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    const order = MOCK_ORDERS.find(o => o.id === id || o.codigo === id);
    if (order) order.estado = payload.estado;
    return { success: true, ...payload };
  }
  const { data } = await apiClient.patch(`/admin/orders/${id}/estado`, payload);
  return data;
}

export async function getAdminProducts(params = {}) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    return { items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length, page: 1, page_size: 12 };
  }
  const { data } = await apiClient.get('/admin/products', { params });
  return data;
}

export async function createAdminProduct(productData) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 250));
    const newProd = {
      id: `prod-00${MOCK_PRODUCTS.length + 1}`,
      ...productData,
      stock_estado: productData.stock_disponible > 5 ? 'disponible' : (productData.stock_disponible > 0 ? 'pocas_unidades' : 'agotado'),
      imagen_url: productData.imagen_url || 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=600'
    };
    MOCK_PRODUCTS.unshift(newProd);
    return newProd;
  }
  const { data } = await apiClient.post('/admin/products', productData);
  return data;
}

export async function updateAdminProduct(id, productData) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 250));
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS[idx] = {
        ...MOCK_PRODUCTS[idx],
        ...productData,
        stock_estado: productData.stock_disponible > 5 ? 'disponible' : (productData.stock_disponible > 0 ? 'pocas_unidades' : 'agotado')
      };
      return MOCK_PRODUCTS[idx];
    }
    throw { response: { status: 404, data: { detail: 'Producto no encontrado' } } };
  }
  const { data } = await apiClient.put(`/admin/products/${id}`, productData);
  return data;
}

export async function updateQuickStockPrice(id, { stock_disponible, precio_unitario }) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 150));
    const prod = MOCK_PRODUCTS.find(p => p.id === id);
    if (prod) {
      if (stock_disponible !== undefined) {
        prod.stock_disponible = Number(stock_disponible);
        prod.stock_estado = prod.stock_disponible > 5 ? 'disponible' : (prod.stock_disponible > 0 ? 'pocas_unidades' : 'agotado');
      }
      if (precio_unitario !== undefined) {
        prod.precio_unitario = Number(precio_unitario);
      }
      return prod;
    }
    throw { response: { status: 404, data: { detail: 'Producto no encontrado' } } };
  }
  const { data } = await apiClient.patch(`/admin/products/${id}/stock-precio`, { stock_disponible, precio_unitario });
  return data;
}

export async function deleteAdminProduct(id) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS.splice(idx, 1);
      return { success: true, message: 'Producto dado de baja lógicamente.' };
    }
    throw { response: { status: 404, data: { detail: 'Producto no encontrado' } } };
  }
  const { data } = await apiClient.delete(`/admin/products/${id}`);
  return data;
}

export async function reindexKnowledgeBase() {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 800));
    return { detail: 'Base de conocimiento del Asesor IA reindexada con éxito.', total_reindexed: MOCK_PRODUCTS.length };
  }
  const { data } = await apiClient.post('/admin/knowledge/reindex');
  return data;
}

export async function getAdminChatLogs(params = {}) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    return { items: MOCK_CHAT_LOGS, total: MOCK_CHAT_LOGS.length, page: 1, page_size: 20 };
  }
  const { data } = await apiClient.get('/admin/chat-logs', { params });
  return data;
}

export async function getAdminClaims(params = {}) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 200));
    return { items: MOCK_CLAIMS, total: MOCK_CLAIMS.length, page: 1, page_size: 20 };
  }
  const { data } = await apiClient.get('/admin/claims', { params });
  return data;
}

export async function triggerScheduledTasks(params = {}) {
  if (USE_MOCKS) {
    checkAuth();
    await new Promise((res) => setTimeout(res, 300));
    const simulateHours = params.simulate_hours || 0;
    return {
      success: true,
      ejecutado_en: new Date().toISOString(),
      simulate_hours: simulateHours,
      keepalive_db: true,
      recordatorios_enviados: simulateHours >= 24 && simulateHours < 48 ? 1 : 0,
      pedidos_cancelados_por_vencimiento: simulateHours >= 48 ? 1 : 0,
      stock_liberado_items: simulateHours >= 48 ? 4 : 0,
      pedidos_recordatorio: simulateHours >= 24 && simulateHours < 48 ? ['KPK-000101'] : [],
      pedidos_cancelados: simulateHours >= 48 ? ['KPK-000099'] : [],
      detalles: ['Tareas programadas procesadas con éxito (Modo Simulación)'],
    };
  }
  const { data } = await apiClient.post('/cron/process-scheduled-tasks', null, { params });
  return data;
}

