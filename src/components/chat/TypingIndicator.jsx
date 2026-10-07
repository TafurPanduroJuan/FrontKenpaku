import React from 'react';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 mb-4 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-kenpaku-blue text-white flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span>Asesor escribiendo</span>
        <div className="flex gap-1 ml-1">
          <span className="w-1.5 h-1.5 bg-kenpaku-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-kenpaku-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-kenpaku-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
