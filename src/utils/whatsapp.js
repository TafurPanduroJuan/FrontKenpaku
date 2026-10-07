/**
 * Genera una URL directa a WhatsApp con un mensaje prediseñado.
 * @param {string} customMessage 
 * @returns {string}
 */
export function buildWhatsAppUrl(customMessage = '') {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '51987654321';
  const defaultMsg = 'Hola Comercial Kenpaku S.A.C., deseo cotizar acero o solicitar atención con un asesor.';
  const message = customMessage.trim() ? customMessage : defaultMsg;
  const encodedText = encodeURIComponent(message);

  return `https://wa.me/${number}?text=${encodedText}`;
}
