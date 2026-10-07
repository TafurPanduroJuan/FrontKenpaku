import React from 'react';
import { Clock } from 'lucide-react';
import { STORE_INFO } from '../../utils/constants';

export function TopBar() {
  return (
    <div className="bg-[#0A2540] text-white text-xs py-2 px-4 border-b border-[#0F3256]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-100">
            Atención en {STORE_INFO.locationBadge}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-200">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{STORE_INFO.schedule}</span>
        </div>
      </div>
    </div>
  );
}
