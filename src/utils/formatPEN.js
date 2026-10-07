/**
 * Formatea un número como soles peruanos (PEN / S/).
 * @param {number|string} amount 
 * @returns {string} Ejemplo: "S/ 128.90"
 */
export function formatPEN(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return 'S/ 0.00';
  
  const formatted = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);

  // Normalizar espacio no-rompible \u00A0 o \u202F generado por Intl a un espacio estándar
  return formatted.replace(/\s+/g, ' ');
}
