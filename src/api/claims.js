import { apiClient } from './client';
import { MOCK_CLAIMS } from './mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/**
 * POST /claims
 */
export async function createClaim(claimPayload) {
  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 350));
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const codigo_seguimiento = `RC-2026-${randomSeq}`;
    const fecha = new Date().toISOString();

    return {
      codigo_seguimiento,
      fecha
    };
  }

  try {
    const { data } = await apiClient.post('/claims', claimPayload);
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * GET /claims/tracking?codigo=&documento=
 */
export async function getClaimTracking({ codigo, documento } = {}) {
  const cleanCodigo = (codigo || '').trim().toUpperCase();
  const cleanDoc = (documento || '').trim();

  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 300));
    const claim = MOCK_CLAIMS.find(
      (c) =>
        (c.codigo_seguimiento || '').trim().toUpperCase() === cleanCodigo &&
        (c.documento || '').trim() === cleanDoc
    );

    if (!claim) {
      const err = new Error('No se encontró ningún reclamo con los datos proporcionados.');
      err.response = {
        status: 404,
        data: { detail: 'No se encontró ningún reclamo con los datos proporcionados.' }
      };
      throw err;
    }

    // Excluir autor 'sistema'
    const mensajesFiltrados = (claim.mensajes || [])
      .filter((m) => m.autor !== 'sistema')
      .map((m) => ({
        autor: m.autor,
        texto: m.texto,
        created_at: m.created_at
      }));

    return {
      codigo_seguimiento: claim.codigo_seguimiento,
      tipo: claim.tipo,
      estado: claim.estado,
      fecha: claim.fecha,
      fecha_limite: claim.fecha_limite,
      dias_habiles_restantes: claim.estado === 'atendido' ? null : claim.dias_habiles_restantes,
      descripcion_bien: claim.descripcion_bien,
      mensajes: mensajesFiltrados
    };
  }

  try {
    const { data } = await apiClient.get('/claims/tracking', {
      params: { codigo: cleanCodigo, documento: cleanDoc }
    });
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * POST /claims/tracking/respuesta
 */
export async function sendClaimReply({ codigo, documento, texto, conforme } = {}) {
  const cleanCodigo = (codigo || '').trim().toUpperCase();
  const cleanDoc = (documento || '').trim();

  if (USE_MOCKS) {
    await new Promise((res) => setTimeout(res, 350));
    const claim = MOCK_CLAIMS.find(
      (c) =>
        (c.codigo_seguimiento || '').trim().toUpperCase() === cleanCodigo &&
        (c.documento || '').trim() === cleanDoc
    );

    if (!claim) {
      const err = new Error('No se encontró ningún reclamo con los datos proporcionados.');
      err.response = {
        status: 404,
        data: { detail: 'No se encontró ningún reclamo con los datos proporcionados.' }
      };
      throw err;
    }

    if (!claim.mensajes) {
      claim.mensajes = [];
    }

    const nuevoMensaje = {
      id: `msg-${Date.now()}`,
      autor: 'cliente',
      canal: 'web',
      texto: (texto || '').trim(),
      created_at: new Date().toISOString()
    };

    claim.mensajes.push(nuevoMensaje);
    claim.mensajes_count = (claim.mensajes_count || 0) + 1;

    if (claim.estado === 'atendido' && conforme === false) {
      claim.estado = 'en_proceso';
      claim.fecha_atencion = null;
    }

    const mensajesFiltrados = claim.mensajes
      .filter((m) => m.autor !== 'sistema')
      .map((m) => ({
        autor: m.autor,
        texto: m.texto,
        created_at: m.created_at
      }));

    return {
      codigo_seguimiento: claim.codigo_seguimiento,
      tipo: claim.tipo,
      estado: claim.estado,
      fecha: claim.fecha,
      fecha_limite: claim.fecha_limite,
      dias_habiles_restantes: claim.estado === 'atendido' ? null : claim.dias_habiles_restantes,
      descripcion_bien: claim.descripcion_bien,
      mensajes: mensajesFiltrados
    };
  }

  try {
    const payload = {
      codigo: cleanCodigo,
      documento: cleanDoc,
      texto: (texto || '').trim(),
    };
    if (conforme !== undefined && conforme !== null) {
      payload.conforme = conforme;
    }
    const { data } = await apiClient.post('/claims/tracking/respuesta', payload);
    return data;
  } catch (err) {
    throw err;
  }
}
