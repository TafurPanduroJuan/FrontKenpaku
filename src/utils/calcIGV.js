/**
 * Calcula el desglose de IGV (18%) a partir del total que incluye IGV.
 * En Comercial Kenpaku los precios mostrados INCLUYEN IGV.
 * 
 * @param {number} totalWithIGV 
 * @returns {{ total: number, subtotal: number, igv: number }}
 */
export function calcIGV(totalWithIGV) {
  const total = typeof totalWithIGV === 'number' ? totalWithIGV : parseFloat(totalWithIGV) || 0;
  const subtotal = total / 1.18;
  const igv = total - subtotal;

  return {
    total: Math.round(total * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    igv: Math.round(igv * 100) / 100
  };
}
