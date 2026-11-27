import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Info,
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';
import { getClaimTracking, sendClaimReply } from '../api/claims';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';

const ESTADO_BADGES = {
  pendiente: {
    label: 'Pendiente',
    classes: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  en_proceso: {
    label: 'En Proceso',
    classes: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  atendido: {
    label: 'Atendido',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
};

export function ClaimTracking() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialCodigo = (searchParams.get('codigo') || '').trim();

  // Estados del formulario de búsqueda
  const [codigoInput, setCodigoInput] = useState(initialCodigo);
  const [documentoInput, setDocumentoInput] = useState('');

  // Credenciales activas para la consulta (el documento NUNCA va a la URL ni a localStorage)
  const [activeQuery, setActiveQuery] = useState(() => {
    return null;
  });

  // Estado para el mensaje de respuesta
  const [replyText, setReplyText] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Consulta react-query
  const {
    data: claim,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['claim-tracking', activeQuery?.codigo, activeQuery?.documento],
    queryFn: () => getClaimTracking(activeQuery),
    enabled: Boolean(activeQuery?.codigo && activeQuery?.documento),
    retry: false
  });

  // Mutación para responder
  const replyMutation = useMutation({
    mutationFn: (variables) =>
      sendClaimReply({
        codigo: activeQuery.codigo,
        documento: activeQuery.documento,
        ...variables
      }),
    onSuccess: (updatedClaim) => {
      queryClient.setQueryData(
        ['claim-tracking', activeQuery?.codigo, activeQuery?.documento],
        updatedClaim
      );
      setReplyText('');
      setActionError(null);
      setActionSuccess('Tu mensaje fue enviado con éxito.');
    },
    onError: (err) => {
      setActionSuccess(null);
      if (err?.response?.status === 429) {
        setActionError('Demasiados mensajes enviados. Vuelve a intentarlo más tarde.');
      } else {
        setActionError(
          err?.response?.data?.detail || 'No se pudo enviar la respuesta. Intenta nuevamente.'
        );
      }
    }
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const cleanCodigo = codigoInput.trim();
    const cleanDoc = documentoInput.trim();

    if (!cleanCodigo || !cleanDoc) return;

    setActiveQuery({
      codigo: cleanCodigo,
      documento: cleanDoc
    });
  };

  const handleSendTextMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim() || replyText.trim().length < 3) return;
    setActionError(null);
    setActionSuccess(null);

    replyMutation.mutate({
      texto: replyText.trim()
    });
  };

  const handleConforme = () => {
    setActionError(null);
    setActionSuccess(null);
    replyMutation.mutate({
      texto: 'Estoy conforme con la respuesta recibida.',
      conforme: true
    });
  };

  const handleNoConforme = () => {
    if (!replyText.trim() || replyText.trim().length < 3) {
      setActionError('Por favor ingresa un mensaje explicando el motivo de tu disconformidad (mínimo 3 caracteres).');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    replyMutation.mutate({
      texto: replyText.trim(),
      conforme: false
    });
  };

  const renderErrorMessage = (err) => {
    const status = err?.response?.status;
    if (status === 404) {
      return 'No encontramos un reclamo con esos datos. Revisa el código y tu documento.';
    }
    if (status === 429) {
      return 'Demasiados intentos. Vuelve a intentarlo en unos minutos.';
    }
    return (
      err?.response?.data?.detail ||
      'Ocurrió un error al consultar el reclamo. Por favor intenta nuevamente.'
    );
  };

  const formatFecha = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return d;
    }
  };

  const badgeConfig = claim ? ESTADO_BADGES[claim.estado] || ESTADO_BADGES.pendiente : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in font-sans">
      <Breadcrumb
        items={[
          { label: 'Libro de Reclamaciones', href: '/libro-de-reclamaciones' },
          { label: 'Seguimiento de Reclamo' }
        ]}
      />

      {/* Header Banner */}
      <div className="steel-texture bg-navy-900 text-white rounded-panel p-6 sm:p-8 shadow-card border border-navy-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-card bg-brand-500 text-white flex items-center justify-center font-extrabold shadow-cta shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight">
              Consulta el Estado de tu Reclamo o Queja
            </h1>
            <p className="text-xs sm:text-sm text-steel-400">
              Ingresa el código asignado y tu número de documento para revisar el avance y comunicarte con nosotros.
            </p>
          </div>
        </div>
      </div>

      {/* Search Form Card */}
      <div className="bg-white rounded-panel border border-steel-200 p-6 shadow-card">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="codigo-input" className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                Código de Reclamación
              </label>
              <input
                id="codigo-input"
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                placeholder="Ej. RC-2026-0001"
                required
                className="w-full px-3.5 py-2.5 bg-steel-50 border border-steel-300 rounded-btn text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 uppercase"
              />
            </div>
            <div>
              <label htmlFor="documento-input" className="block text-xs font-bold uppercase tracking-wider text-steel-700 mb-1">
                Número de Documento (DNI / RUC / CE)
              </label>
              <input
                id="documento-input"
                type="text"
                value={documentoInput}
                onChange={(e) => setDocumentoInput(e.target.value)}
                placeholder="Ingresa tu documento"
                required
                className="w-full px-3.5 py-2.5 bg-steel-50 border border-steel-300 rounded-btn text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              icon={Search}
              disabled={isLoading || !codigoInput.trim() || !documentoInput.trim()}
            >
              {isLoading ? 'Consultando...' : 'Consultar Reclamo'}
            </Button>
          </div>
        </form>

        {isError && (
          <div
            data-testid="claim-error"
            className="mt-4 p-4 rounded-card bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">No se pudo realizar la consulta</p>
              <p className="text-xs text-red-700 mt-0.5">{renderErrorMessage(error)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Claim Details & Thread */}
      {claim && (
        <div data-testid="claim-details" className="space-y-6">
          {/* Claim Summary Card */}
          <div className="bg-white rounded-panel border border-steel-200 p-6 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-steel-100">
              <div>
                <span className="text-micro font-extrabold uppercase tracking-wider text-steel-500">
                  Hoja de Reclamación
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-xl font-display font-extrabold text-navy-900 font-mono">
                    {claim.codigo_seguimiento}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                      badgeConfig?.classes
                    }`}
                  >
                    {badgeConfig?.label || claim.estado}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-micro font-extrabold uppercase tracking-wider text-steel-500 block">
                  Tipo
                </span>
                <span className="text-sm font-bold text-navy-900 uppercase">
                  {claim.tipo}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-steel-50 rounded-card border border-steel-200/60">
                <span className="text-micro uppercase font-extrabold text-steel-500 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Fecha de Registro
                </span>
                <p className="text-sm font-semibold text-navy-900">
                  {formatFecha(claim.fecha)}
                </p>
              </div>

              <div className="p-3 bg-steel-50 rounded-card border border-steel-200/60 sm:col-span-2">
                <span className="text-micro uppercase font-extrabold text-steel-500 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" /> Plazo Máximo Legal
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-navy-900">
                    Respuesta máxima: {formatFecha(claim.fecha_limite)}
                  </p>
                  {claim.estado !== 'atendido' && claim.dias_habiles_restantes !== null && claim.dias_habiles_restantes !== undefined && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        claim.dias_habiles_restantes < 0
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : claim.dias_habiles_restantes <= 3
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {claim.dias_habiles_restantes < 0
                        ? `Vencido hace ${Math.abs(claim.dias_habiles_restantes)} días hábiles`
                        : claim.dias_habiles_restantes === 0
                        ? 'Vence hoy'
                        : `${claim.dias_habiles_restantes} días hábiles restantes`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {claim.descripcion_bien && (
              <div className="p-3.5 bg-steel-50 rounded-card border border-steel-200/60 text-xs">
                <span className="text-micro uppercase font-extrabold text-steel-500 block mb-1">
                  Bien Contratado
                </span>
                <p className="text-steel-800 font-medium">
                  {claim.descripcion_bien}
                </p>
              </div>
            )}
          </div>

          {/* Messages Thread Card */}
          <div className="bg-white rounded-panel border border-steel-200 p-6 shadow-card space-y-6">
            <h3 className="text-base font-display font-extrabold text-navy-900 border-b border-steel-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Historial de Comunicación
            </h3>

            {/* Bubbles */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {!claim.mensajes || claim.mensajes.length === 0 ? (
                <div className="p-6 text-center text-steel-500 text-sm bg-steel-50 rounded-card border border-steel-200/60">
                  Aún no hay respuesta. Te responderemos dentro del plazo legal.
                </div>
              ) : (
                claim.mensajes.map((m, idx) => {
                  const isAdmin = m.autor === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="text-micro text-steel-500 mb-1 px-1">
                        <span className="font-bold text-navy-900">
                          {isAdmin ? 'Comercial Kenpaku' : 'Tú'}
                        </span>
                        {' • '}
                        <span>{formatDateTime(m.created_at)}</span>
                      </div>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-card text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isAdmin
                            ? 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200'
                            : 'bg-navy-900 text-white rounded-tr-xs shadow-xs'
                        }`}
                      >
                        {m.texto}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Feedback alerts */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-btn text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-btn text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Conformity Notice & Controls if Atendido */}
            {claim.estado === 'atendido' && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-card space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <p className="font-bold">
                      Tu reclamación ha sido marcada como atendida por nuestro equipo.
                    </p>
                    <p>
                      Indícanos si te encuentras conforme con la resolución brindada. Si no estás conforme con la respuesta, también puedes acudir al INDECOPI.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    icon={ThumbsUp}
                    disabled={replyMutation.isPending}
                    onClick={handleConforme}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Estoy conforme
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    icon={ThumbsDown}
                    disabled={replyMutation.isPending}
                    onClick={handleNoConforme}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    No estoy conforme
                  </Button>
                </div>
              </div>
            )}

            {/* Reply Input Form */}
            <form onSubmit={handleSendTextMessage} className="space-y-3 pt-2 border-t border-steel-100">
              <label htmlFor="reply-textarea" className="block text-xs font-bold text-steel-700">
                {claim.estado === 'atendido'
                  ? 'Si no estás conforme o requieres mayor información, escribe tu mensaje aquí:'
                  : 'Enviar un mensaje o aportar mayor información:'}
              </label>
              <textarea
                id="reply-textarea"
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe tu respuesta o comentario (mínimo 3 caracteres)..."
                className="w-full px-3.5 py-2.5 bg-steel-50 border border-steel-300 rounded-card text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex justify-between items-center text-micro text-steel-500">
                <span>Mínimo 3 caracteres</span>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Send}
                  disabled={replyMutation.isPending || replyText.trim().length < 3}
                >
                  {replyMutation.isPending ? 'Enviando...' : 'Enviar mensaje'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ClaimTracking;
