import React from 'react';
import { Sparkles } from 'lucide-react';

export function AIBanner() {
  return (
    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-[11px] text-slate-700 font-medium">
      <Sparkles className="w-3.5 h-3.5 text-kenpaku-blue shrink-0" />
      <span>Estás conversando con un Asesor Virtual basado en Inteligencia Artificial.</span>
    </div>
  );
}
