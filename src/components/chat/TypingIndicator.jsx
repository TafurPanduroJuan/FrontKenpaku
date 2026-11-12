import React from 'react';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-steel-200 bg-white px-3.5 py-2.5 shadow-2xs text-xs text-steel-500 font-medium">
        <span>Asesor escribiendo</span>
        <div className="flex gap-1 ml-1 items-center">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
