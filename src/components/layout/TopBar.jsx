import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { STORE_INFO } from '../../utils/constants';

export function TopBar() {
  // STORE_INFO.locationBadge ya contiene "Atención en Puente Piedra, Lima"
  // Corregimos la duplicación visual asegurando que solo muestre el texto sin anteponer otro "Atención en"
  const locationText = STORE_INFO.locationBadge?.startsWith('Atención en ')
    ? STORE_INFO.locationBadge
    : `Atención en ${STORE_INFO.locationBadge || 'Puente Piedra, Lima'}`;

  return (
    <div className="bg-navy-950 text-steel-200 text-micro py-2 px-4 border-b border-navy-900 transition-colors">
      <div className="max-w-site mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-accent-400 shrink-0" />
          <span className="font-medium text-steel-200">
            {locationText}
          </span>
        </div>

        <div className="flex items-center gap-2 text-steel-300">
          <Clock className="w-3.5 h-3.5 text-accent-400 shrink-0" />
          <span className="font-medium">{STORE_INFO.schedule}</span>
        </div>
      </div>
    </div>
  );
}
