import React from 'react';
import { Sparkles } from 'lucide-react';

export function AIBanner() {
  return (
    <div className="flex items-center gap-2 bg-brand-50 border-b border-brand-100 px-4 py-2 text-micro text-brand-700 font-medium">
      <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0" />
      <span>Estás conversando con un Asesor Virtual basado en Inteligencia Artificial.</span>
    </div>
  );
}
