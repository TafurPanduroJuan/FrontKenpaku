import { apiClient } from './client';
import { MOCK_PRODUCTS } from './mockData';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * POST /chat
 */
export async function sendChatMessage({ conversation_id, message, product_id }) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 600));

    const convId = conversation_id || `conv-${Math.random().toString(36).substr(2, 9)}`;
    const lowerMsg = message.toLowerCase();

    let reply = 'Gracias por escribir a Comercial Kenpaku. En Comercial Kenpaku contamos con tubos estructurales, planchas LAC/LAF, perfiles C/H y fierros corrugados para entrega inmediata en Puente Piedra.';
    let products = [];
    let handoff = false;
    let whatsapp_url = null;

    if (lowerMsg.includes('tubo') || lowerMsg.includes('estructura')) {
      reply = 'Para estructuras livianas y tijerales, te recomendamos nuestros Tubos Negros Estructurales de 2" o Tubos Galvanizados. Tienen excelente rigidez y resistencia.';
      products = [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]];
    } else if (lowerMsg.includes('diferencia') || lowerMsg.includes('negro') || lowerMsg.includes('galvanizado')) {
      reply = 'El acero negro es ideal para pintura posterior o uso bajo techo/soldadura pesada. El acero galvanizado posee un recubrimiento de zinc que evita la corrosión en la intemperie.';
      products = [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]];
    } else if (lowerMsg.includes('plancha') || lowerMsg.includes('laf') || lowerMsg.includes('lac')) {
      reply = 'Las planchas LAF (laminadas en frío) son de superficie pulida e ideal para tableros o doblados finos (1.2mm). Las planchas LAC (laminadas en caliente) son para cerrajería y tolvas pesadas (3mm/1/8").';
      products = [MOCK_PRODUCTS[2], MOCK_PRODUCTS[3]];
    } else if (lowerMsg.includes('calculo') || lowerMsg.includes('especial') || lowerMsg.includes('descuento') || lowerMsg.includes('asesor')) {
      reply = 'No tengo certeza exacta sobre cálculos de ingeniería específicos o solicitudes especiales de volumen masivo. Te sugiero derivar tu consulta directamente con un asesor técnico por WhatsApp.';
      handoff = true;
      whatsapp_url = buildWhatsAppUrl(`Hola, requiero asesoría especializada: ${message}`);
    } else if (product_id) {
      const prod = MOCK_PRODUCTS.find(p => p.id === product_id);
      if (prod) {
        reply = `Sobre el producto "${prod.nombre}": Cuenta con un precio de S/ ${prod.precio_unitario.toFixed(2)} IGV incl. Su estado de stock actual es ${prod.stock_estado.replace('_', ' ')}.`;
        products = [prod];
      }
    }

    return {
      conversation_id: convId,
      reply,
      products,
      handoff,
      whatsapp_url,
      generated_by_ai: true,
    };
  }

  try {
    const { data } = await apiClient.post('/chat', { conversation_id, message, product_id });
    return data;
  } catch (err) {
    throw err;
  }
}
