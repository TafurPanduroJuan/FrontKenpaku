import React from 'react';

export function QuickReplies({ onSelectOption }) {
  const chips = [
    '¿Qué tubo uso para una estructura ligera?',
    'Diferencia entre fierro negro y galvanizado',
    'Medidas estándar de plancha LAF',
    'Necesito un cálculo estructural especial'
  ];

  return (
    <div className="space-y-1.5 pt-2 animate-fade-in">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sugerencias rápidas:</p>
      <div className="flex flex-col gap-1.5">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSelectOption(chip)}
            className="text-left text-xs bg-white hover:bg-blue-50 text-kenpaku-blue font-medium border border-slate-200 hover:border-kenpaku-blue/40 px-3.5 py-2.5 rounded-xl transition-all shadow-2xs leading-snug active:scale-[0.98]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
