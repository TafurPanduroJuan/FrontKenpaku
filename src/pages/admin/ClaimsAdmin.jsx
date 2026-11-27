import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { getAdminClaims, getAdminClaimDetail, replyAdminClaim } from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { formatPEN } from '../../utils/formatPEN';

function renderPlazo(claim) {
  if (claim.estado === 'atendido') {
    return <span className="text-slate-400 font-medium">—</span>;
  }
  const dias = claim.dias_habiles_restantes;
  if (dias === null || dias === undefined) {
    return <span className="text-slate-400 font-medium">—</span>;
  }
  if (dias < 0) {
    return (
      <span className="text-red-600 font-semibold">
        Vencido hace {Math.abs(dias)} días háb.
      </span>
    );
  }
  if (dias <= 3) {
    return (
      <span className="text-amber-600 font-semibold">
        Vence en {dias} días háb.
      </span>
    );
  }
  return <span className="text-slate-600 font-medium">{dias} días háb.</span>;
}

function renderEstadoBadge(estado) {
  if (estado === 'en_proceso') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
        En proceso
      </span>
    );
  }
  if (estado === 'atendido') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
        Atendido
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
      Pendiente
    </span>
  );
}

export function ClaimsAdmin() {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [replyTexto, setReplyTexto] = useState('');
  const [replyEstado, setReplyEstado] = useState('en_proceso');
  const [enviarCorreo, setEnviarCorreo] = useState(true);
  const [replyError, setReplyError] = useState(null);

  const queryClient = useQueryClient();

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['admin-claims'],
    queryFn: getAdminClaims,
  });

  const selectedId = selectedClaim?.id ?? selectedClaim?.codigo_seguimiento;

  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-claim-detail', selectedId],
    queryFn: () => getAdminClaimDetail(selectedId),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    setReplyTexto('');
    setReplyEstado('en_proceso');
    setEnviarCorreo(true);
    setReplyError(null);
  }, [selectedId]);

  const replyMutation = useMutation({
    mutationFn: (payload) => replyAdminClaim(selectedId, payload),
    onSuccess: () => {
      setReplyTexto('');
      setReplyError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
      queryClient.invalidateQueries({ queryKey: ['admin-claim-detail', selectedId] });
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || err?.message || 'Error al enviar la respuesta';
      setReplyError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    },
  });

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (replyTexto.trim().length < 10) return;
    setReplyError(null);
    replyMutation.mutate({
      texto: replyTexto,
      estado: replyEstado,
      enviar_correo: enviarCorreo,
    });
  };

  // El backend responde { items, total, page, page_size }
  const claims = Array.isArray(claimsData) ? claimsData : claimsData?.items || [];
  const activeClaim = detailData || selectedClaim;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-kenpaku-navy flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <span>Libro de Reclamaciones (Registros)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestión y seguimiento formal de reclamos y quejas ingresados por consumidores
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay reclamaciones registradas en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Código / Fecha</th>
                  <th className="py-3.5 px-4">Consumidor</th>
                  <th className="py-3.5 px-4">Documento</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Plazo</th>
                  <th className="py-3.5 px-4">Bien Afectado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => (
                  <tr key={claim.id ?? claim.codigo_seguimiento} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-kenpaku-navy block">{claim.codigo_seguimiento}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(claim.fecha).toLocaleDateString('es-PE')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{claim.nombre}</td>
                    <td className="py-3.5 px-4 font-semibold">{claim.documento}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          claim.tipo === 'reclamo'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {claim.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {renderEstadoBadge(claim.estado)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPlazo(claim)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{claim.descripcion_bien}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Reclamación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <Modal
          isOpen={!!selectedClaim}
          onClose={() => setSelectedClaim(null)}
          title={`Hoja de Reclamación ${activeClaim?.codigo_seguimiento || ''}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Cabecera de estado y plazo */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Estado:</span>
                {renderEstadoBadge(activeClaim.estado)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Plazo:</span>
                {renderPlazo(activeClaim)}
              </div>
            </div>

            {/* Datos del consumidor y del bien */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Consumidor</span>
                <p className="font-bold text-slate-900">{activeClaim.nombre}</p>
                <p>Doc: {activeClaim.documento}</p>
                <p>Teléfono: {activeClaim.telefono}</p>
                <p>Correo: {activeClaim.correo}</p>
                <p>Dirección: {activeClaim.direccion}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Detalles del Bien</span>
                <p><strong>Tipo:</strong> {activeClaim.tipo_bien}</p>
                <p><strong>Monto:</strong> {activeClaim.monto_reclamado ? formatPEN(activeClaim.monto_reclamado) : 'N/A'}</p>
                <p><strong>Descripción:</strong> {activeClaim.descripcion_bien}</p>
              </div>
            </div>

            {/* Hechos y pedido */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Detalle de los Hechos:</span>
                <p className="text-slate-600 leading-relaxed">{activeClaim.detalle}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block">Pedido del Consumidor:</span>
                <p className="text-slate-600 leading-relaxed">{activeClaim.pedido_consumidor}</p>
              </div>
            </div>

            {/* Sección Conversación */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-kenpaku-blue" />
                <h4 className="font-bold text-slate-900 text-sm">Conversación</h4>
              </div>

              {isLoadingDetail ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="w-3/4 h-12" />
                  <Skeleton className="w-3/4 h-12 ml-auto" />
                </div>
              ) : !activeClaim?.mensajes || activeClaim.mensajes.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400 italic">
                  Aún no hay respuestas
                </p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto px-1 py-2">
                  {[...activeClaim.mensajes]
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((m, idx) => {
                      const isClient = m.autor === 'cliente';
                      const isAdmin = m.autor === 'admin';
                      const isSistema = m.autor === 'sistema';
                      const fechaStr = m.created_at
                        ? new Date(m.created_at).toLocaleString('es-PE')
                        : '';

                      if (isSistema) {
                        return (
                          <div key={m.id || idx} className="flex justify-center my-1">
                            <div className="max-w-[90%] rounded-xl px-3 py-1.5 text-[11px] bg-slate-100 text-slate-500 border border-slate-200 text-center">
                              <span className="font-semibold">Sistema {m.canal ? `· ${m.canal}` : ''}:</span>{' '}
                              <span className="whitespace-pre-wrap">{m.texto}</span>{' '}
                              {fechaStr && <span className="text-[10px] text-slate-400 ml-1">({fechaStr})</span>}
                            </div>
                          </div>
                        );
                      }

                      if (isAdmin) {
                        return (
                          <div key={m.id || idx} className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl p-3 text-xs shadow-sm bg-kenpaku-navy text-white rounded-tr-sm">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-[10px] font-bold text-blue-200">
                                  Administrador {m.canal ? `· ${m.canal}` : ''}
                                </span>
                                {fechaStr && (
                                  <span className="text-[10px] text-slate-300">
                                    {fechaStr}
                                  </span>
                                )}
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed">{m.texto}</div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id || idx} className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl p-3 text-xs shadow-sm bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="text-[10px] font-bold text-slate-600">
                                Cliente {m.canal ? `· ${m.canal}` : ''}
                              </span>
                              {fechaStr && (
                                <span className="text-[10px] text-slate-400">
                                  {fechaStr}
                                </span>
                              )}
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed">{m.texto}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Formulario de Respuesta o Aviso de Atendido */}
            <div className="border-t border-slate-200 pt-4">
              {activeClaim.estado === 'atendido' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Reclamo atendido el{' '}
                    {activeClaim.fecha_atencion
                      ? new Date(activeClaim.fecha_atencion).toLocaleDateString('es-PE')
                      : new Date().toLocaleDateString('es-PE')}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReply} className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Responder al Reclamo</h4>

                  {replyError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{replyError}</span>
                    </div>
                  )}

                  <div>
                    <textarea
                      rows={3}
                      value={replyTexto}
                      onChange={(e) => setReplyTexto(e.target.value)}
                      placeholder="Escriba su respuesta formal al consumidor (mínimo 10 caracteres)..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-kenpaku-blue focus:border-transparent outline-none resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>{replyTexto.length} / 4000 caracteres</span>
                      {replyTexto.length < 10 && (
                        <span className="text-amber-600 font-medium">Mínimo 10 caracteres requeridos</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <label className="text-slate-600 font-medium text-xs">Estado:</label>
                        <select
                          value={replyEstado}
                          onChange={(e) => setReplyEstado(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-kenpaku-blue outline-none cursor-pointer"
                        >
                          <option value="en_proceso">En proceso</option>
                          <option value="atendido">Atendido</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enviarCorreo}
                          onChange={(e) => setEnviarCorreo(e.target.checked)}
                          className="w-4 h-4 rounded text-kenpaku-blue focus:ring-kenpaku-blue border-slate-300"
                        />
                        <span>Enviar por correo a {activeClaim.correo}</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={replyTexto.trim().length < 10 || replyMutation.isPending}
                      className="px-4 py-2 bg-kenpaku-navy hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{replyMutation.isPending ? 'Enviando...' : 'Enviar respuesta'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
