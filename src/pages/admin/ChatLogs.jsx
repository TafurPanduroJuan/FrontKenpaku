import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ExternalLink, Bot, CheckCircle } from 'lucide-react';
import { getAdminChatLogs } from '../../api/admin';
import { Skeleton } from '../../components/ui/Skeleton';

export function ChatLogs() {
  const { data: chatLogs = [], isLoading } = useQuery({
    queryKey: ['admin-chat-logs'],
    queryFn: getAdminChatLogs
  });

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
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Sesión ID</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Mensajes</th>
                  <th className="py-3.5 px-4">Resumen de Consulta</th>
                  <th className="py-3.5 px-4">Estado Handoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chatLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-kenpaku-navy">{log.session_id || log.id}</td>
                    <td className="py-3.5 px-4">
                      {new Date(log.fecha).toLocaleString('es-PE')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.mensajes_count} msgs</td>
                    <td className="py-3.5 px-4 max-w-sm">{log.resumen}</td>
                    <td className="py-3.5 px-4">
                      {log.handoff ? (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
