import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BrainCircuit, RefreshCw, CheckCircle2, FileText, Database } from 'lucide-react';
import { reindexKnowledgeBase } from '../../api/admin';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

export function Knowledge() {
  const [reindexResult, setReindexResult] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const reindexMutation = useMutation({
    mutationFn: reindexKnowledgeBase,
    onSuccess: (data) => {
      setReindexResult(data);
      setShowToast(true);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <Toast
        message="Base de conocimiento del Asesor IA reindexada con éxito."
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-kenpaku-navy flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-kenpaku-blue" />
          <span>Base de Conocimiento del Asesor IA</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestión y reindexación de fichas técnicas, precios e inventario para el agente virtual.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Indexación Vectorial de Productos</h3>
            <p className="text-xs text-slate-500">
              Sincroniza las últimas modificaciones de precios, stock y fichas técnicas con el motor de IA.
            </p>
          </div>

          <Button
            variant="primary"
            isLoading={reindexMutation.isPending}
            icon={RefreshCw}
            onClick={() => reindexMutation.mutate()}
          >
            Actualizar conocimiento del asesor
          </Button>
        </div>

        {reindexResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">{reindexResult.message}</p>
              <p className="text-[11px] text-emerald-800">
                Documentos procesados e indexados: <strong>{reindexResult.total_documents}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <Database className="w-6 h-6 text-kenpaku-blue" />
            <h4 className="font-bold text-slate-900">Información del Catálogo</h4>
            <p className="text-slate-500 leading-relaxed">
              Dimensiones de tubos, normas ASTM/INACAL, planchas LAF/LAC y perfiles C/H.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <FileText className="w-6 h-6 text-kenpaku-orange" />
            <h4 className="font-bold text-slate-900">Políticas y Preguntas Frecuentes</h4>
            <p className="text-slate-500 leading-relaxed">
              Dirección de almacén en Puente Piedra, horario de atención y flujo de fletes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
