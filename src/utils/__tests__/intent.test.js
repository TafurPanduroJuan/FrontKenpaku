import { describe, it, expect } from 'vitest';
import { resumirIntencion } from '../intent';

const user = (intencion_modelo, probabilidad_modelo) => ({ rol: 'user', intencion_modelo, probabilidad_modelo });

describe('resumirIntencion', () => {
  it('prioriza reclamo sobre compra, cotización y consulta', () => {
    expect(resumirIntencion([user(0, 0.9), user(3, 0.95), user(2, 0.8)])).toEqual({ id: 2, prob: 0.8 });
    expect(resumirIntencion([user(0, 0.9), user(1, 0.7), user(3, 0.6)])).toEqual({ id: 3, prob: 0.6 });
  });

  it('ignora chats anteriores al modelo (sin predicción)', () => {
    expect(resumirIntencion([user(null, null), user(undefined, undefined)])).toBeNull();
  });

  it('ignora predicciones de baja confianza y mensajes del asistente', () => {
    expect(resumirIntencion([user(2, 0.4)])).toBeNull();
    expect(resumirIntencion([{ rol: 'assistant', intencion_modelo: 2, probabilidad_modelo: 0.99 }])).toBeNull();
  });

  it('toma la mayor confianza dentro de la misma clase', () => {
    expect(resumirIntencion([user(1, 0.6), user(1, 0.93)])).toEqual({ id: 1, prob: 0.93 });
  });
});
