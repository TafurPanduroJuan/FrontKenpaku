import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { MessageSquare, ExternalLink, Bot, CheckCircle, ShieldOff, Filter, Eye } from 'lucide-react';
import { getAdminChatLogs } from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { INTENT_INFO, INTENT_UMBRAL, resumirIntencion } from '../../utils/intent';
import { CHAT_RETENTION_DAYS } from '../../utils/constants';

export function ChatLogs() {
  const [offtopicFilter, setOfftopicFilter] = useState('all'); // 'all' | 'offtopic' | 'inscope'
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const queryParams = useMemo(() => {
    const params = { page };
    if (offtopicFilter === 'offtopic') params.fuera_de_alcance = true;
    else if (offtopicFilter === 'inscope') params.fuera_de_alcance = false;
    return params;
  }, [offtopicFilter, page]);

  const { data: chatData, isLoading } = useQuery({
    queryKey: ['admin-chat-logs', queryParams],
    queryFn: () => getAdminChatLogs(queryParams),
    placeholderData: keepPreviousData,
  });

  const total = chatData?.total ?? (Array.isArray(chatData) ? chatData.length : 0);
  const pageSize = chatData?.page_size || 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // El backend responde { items, total, page, page_size } con UN registro por mensaje
  // (id_conversacion, timestamp, rol, mensaje_texto, ...). Los agrupamos por conversación.
  const chatLogs = useMemo(() => {
    const raw = Array.isArray(chatData) ? chatData : chatData?.items || [];
    const groups = new Map();

    raw.forEach((m) => {
      // Compatibilidad con el formato mock (una fila por sesión)
      if (m.mensajes_count !== undefined) {
        groups.set(m.id, {
          ...m,
          id: m.id,
          fecha: m.fecha,
          fecha_inicio: m.fecha_inicio || m.fecha,
          mensajes_count: m.mensajes_count,
          resumen: m.resumen,
          ultimo_mensaje: m.resumen,
          ultimo_rol: null,
          handoff: m.handoff,
        });
        return;
      }
      const key = m.id_conversacion || m.id;
      if (!groups.has(key)) groups.set(key, { id: key, mensajes: [] });
      groups.get(key).mensajes.push(m);
    });

    return Array.from(groups.values())
      .map((g) => {
        if (!g.mensajes) {
          return {
            ...g,
            ultimo_mensaje: g.ultimo_mensaje ?? g.resumen ?? '',
            ultimo_rol: null,
          };
        }
        const ordered = [...g.mensajes].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        const firstUser = ordered.find((x) => x.rol === 'user') || ordered[0];
        const ultimo = ordered[ordered.length - 1];
        const hasOfftopic = ordered.some((x) => x.fuera_de_alcance === true);
        return {
          id: g.id,
          fecha: ultimo?.timestamp,
          fecha_inicio: ordered[0]?.timestamp,
          mensajes_count: ordered.length,
          resumen: firstUser?.mensaje_texto || '',
          ultimo_mensaje: ultimo?.mensaje_texto || '',
          ultimo_rol: ultimo?.rol || null,
          mensajes: ordered,
          handoff: null, // el backend no persiste este dato
          fuera_de_alcance: hasOfftopic,
          intencion: resumirIntencion(ordered),
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [chatData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-kenpaku-navy flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-kenpaku-blue" />
          <span>Historial de Conversaciones del Chat IA</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Registro de consultas recibidas por el Asesor Virtual e interacciones derivadas (Handoff)
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Las conversaciones se eliminan automáticamente tras {CHAT_RETENTION_DAYS} días sin actividad.
        </p>
        {/* Filtro fuera de alcance */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filtrar:</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setOfftopicFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                offtopicFilter === 'all'
                  ? 'bg-kenpaku-navy text-white border-kenpaku-navy'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => {
                setOfftopicFilter('inscope');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                offtopicFilter === 'inscope'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              En alcance
            </button>
            <button
              onClick={() => {
                setOfftopicFilter('offtopic');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                offtopicFilter === 'offtopic'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <ShieldOff className="w-3 h-3" />
                Fuera de alcance
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : chatLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay registros de chat guardados aún.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Sesión ID</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Mensajes</th>
                  <th className="py-3.5 px-4">Último mensaje</th>
                  <th className="py-3.5 px-4">Alcance</th>
                  <th className="py-3.5 px-4">Intención (IA)</th>
                  <th className="py-3.5 px-4">Estado Handoff</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chatLogs.map((log) => (
                  <tr
                    key={log.id}
                    tabIndex={0}
                    onClick={() => setSelected(log)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(log);
                      }
                    }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50"
                  >
                    <td className="py-3.5 px-4 font-bold text-kenpaku-navy" title={log.session_id || log.id}>
                      {String(log.session_id || log.id || '').slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.fecha ? new Date(log.fecha).toLocaleString('es-PE') : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.mensajes_count} msgs</td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-start gap-1.5">
                        {log.ultimo_rol && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              log.ultimo_rol === 'user'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {log.ultimo_rol === 'user' ? 'Cliente' : 'Asistente'}
                          </span>
                        )}
                        <span className="line-clamp-2" title={log.ultimo_mensaje}>
                          {log.ultimo_mensaje}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.fuera_de_alcance ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          <ShieldOff className="w-3 h-3" />
                          <span>Fuera de alcance</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>En alcance</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4" data-testid="intencion-ia">
                      {log.intencion ? (
                        <span
                          title={`Confianza del modelo: ${Math.round(log.intencion.prob * 100)}%`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${INTENT_INFO[log.intencion.id].className}`}
                        >
                          {INTENT_INFO[log.intencion.id].label} · {Math.round(log.intencion.prob * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.handoff === null || log.handoff === undefined ? (
                        <span className="text-slate-400">—</span>
                      ) : log.handoff ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <ExternalLink className="w-3 h-3" />
                          <span>Derivado WhatsApp</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Atendido por IA</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(log);
                        }}
                        aria-label="Ver conversación"
                        className="p-1.5 text-slate-500 hover:text-kenpaku-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs text-slate-600 font-medium">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </>
        )}
      </div>

      {/* Modal de Detalle de Conversación */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Conversación ${String(selected.session_id || selected.id || '').slice(0, 8)}` : ''}
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            {/* Cabecera con resumen */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-semibold text-slate-700">
                Total:{' '}
                <span className="font-bold text-slate-900">
                  {selected.mensajes_count || selected.mensajes?.length || 0} mensajes
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                {selected.fecha_inicio && (
                  <div>
                    <span className="text-slate-400">Inicio:</span>{' '}
                    <span className="font-medium">
                      {new Date(selected.fecha_inicio).toLocaleString('es-PE')}
                    </span>
                  </div>
                )}
                {selected.fecha && (
                  <div>
                    <span className="text-slate-400">Último:</span>{' '}
                    <span className="font-medium">
                      {new Date(selected.fecha).toLocaleString('es-PE')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contenido / Lista de mensajes */}
            {!selected.mensajes || selected.mensajes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Esta sesión de demostración no tiene el detalle de mensajes.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 py-2">
                {selected.mensajes.map((m) => {
                  const isUser = m.rol === 'user';
                  const hora = m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';
                  const hasValidIntent =
                    isUser &&
                    m.intencion_modelo !== null &&
                    m.intencion_modelo !== undefined &&
                    INTENT_INFO[m.intencion_modelo] &&
                    Number(m.probabilidad_modelo) >= INTENT_UMBRAL;

                  return (
                    <div
                      key={m.id || `${m.timestamp}-${m.rol}`}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                          isUser
                            ? 'bg-kenpaku-navy text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span
                            className={`text-[10px] font-bold ${
                              isUser ? 'text-blue-200' : 'text-slate-500'
                            }`}
                          >
                            {isUser ? 'Cliente' : 'Asistente'}
                          </span>
                          {hora && (
                            <span
                              className={`text-[10px] ${
                                isUser ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {hora}
                            </span>
                          )}
                        </div>

                        <div className="whitespace-pre-wrap leading-relaxed">
                          {m.mensaje_texto}
                        </div>

                        {(m.fuera_de_alcance || hasValidIntent) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-200/30">
                            {m.fuera_de_alcance && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <ShieldOff className="w-3 h-3" />
                                <span>Fuera de alcance</span>
                              </span>
                            )}
                            {hasValidIntent && (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${INTENT_INFO[m.intencion_modelo].className}`}
                              >
                                {INTENT_INFO[m.intencion_modelo].label} ·{' '}
                                {Math.round(Number(m.probabilidad_modelo) * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
