import React from 'react';

export function QuickReplies({ onSelectOption }) {
  const chips = [
    '¿Qué tubo uso para una estructura ligera?',
    'Diferencia entre fierro negro y galvanizado',
    'Medidas estándar de plancha LAF',
    'Necesito un cálculo estructural especial'
  ];

  return (
    <div className="space-y-2 pt-2 animate-fade-in">
      <p className="text-micro font-extrabold tracking-widest text-steel-500 uppercase">
        Sugerencias rápidas:
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectOption(chip)}
            className="min-h-10 rounded-full border border-brand-500/30 bg-white hover:bg-brand-50 px-3.5 py-2 text-left text-xs font-semibold text-brand-700 transition-colors shadow-2xs active:scale-95 cursor-pointer leading-snug"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
