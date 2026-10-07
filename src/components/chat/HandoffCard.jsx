import React from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function HandoffCard({ whatsappUrl }) {
  const url = whatsappUrl || buildWhatsAppUrl('Hola Comercial Kenpaku, requiero asesoría técnica personalizada.');

  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3 text-left w-full shadow-xs">
      <div className="flex items-start gap-2.5">
        <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900">
            No tengo certeza sobre esto. ¿Quieres hablar con un asesor?
          </h4>
          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
            Nuestros especialistas en estructuras de acero en Puente Piedra te responderán inmediatamente por WhatsApp.
          </p>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-kenpaku-whatsapp hover:bg-kenpaku-whatsappHover text-white text-xs font-bold rounded-xl shadow-xs transition-all min-h-[44px]">
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Continuar por WhatsApp</span>
        </button>
      </a>
    </div>
  );
}
