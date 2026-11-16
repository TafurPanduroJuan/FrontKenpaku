// Intención del mensaje según el modelo de ML (APF3). 0 consulta, 1 cotización, 2 reclamo, 3 compra.
export const INTENT_UMBRAL = 0.5;

export const INTENT_INFO = {
  0: { label: 'Consulta', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  1: { label: 'Cotización', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  2: { label: 'Reclamo', className: 'bg-red-100 text-red-800 border-red-200' },
  3: { label: 'Compra', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

// Prioridad para resumir una conversación: lo que requiere acción humana primero.
const PRIORIDAD = [2, 3, 1, 0];

/**
 * Intención dominante de una conversación a partir de sus mensajes de cliente.
 * Ignora mensajes sin predicción (chats anteriores al modelo) o con confianza menor al umbral.
 * Devuelve { id, prob } o null si no hay ninguna predicción confiable.
 */
export function resumirIntencion(mensajes = []) {
  const validos = mensajes.filter(
    (m) =>
      m.rol === 'user' &&
      m.intencion_modelo !== null &&
      m.intencion_modelo !== undefined &&
      Number(m.probabilidad_modelo) >= INTENT_UMBRAL &&
      INTENT_INFO[m.intencion_modelo]
  );
  for (const id of PRIORIDAD) {
    const delClase = validos.filter((m) => m.intencion_modelo === id);
    if (delClase.length) {
      return { id, prob: Math.max(...delClase.map((m) => Number(m.probabilidad_modelo))) };
    }
  }
  return null;
}
