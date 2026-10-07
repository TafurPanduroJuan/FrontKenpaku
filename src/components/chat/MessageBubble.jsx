import React from 'react';
import { Bot, User } from 'lucide-react';
import { ProductChatCard } from './ProductChatCard';
import { HandoffCard } from './HandoffCard';

export function MessageBubble({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4 animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-kenpaku-navy text-white' : 'bg-kenpaku-blue text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        {/* Main Text Bubble - Rendered strictly as PLAIN TEXT */}
        {message.text && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
              isUser
                ? 'bg-kenpaku-blue text-white rounded-tr-none font-medium'
                : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
            }`}
          >
            {/* Safe plain text rendering - NO dangerouslySetInnerHTML */}
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        )}

        {/* Embedded Products Cards */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-2 pt-1 w-full">
            {message.products.map((prod) => (
              <ProductChatCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {/* Handoff Card */}
        {message.handoff && (
          <HandoffCard whatsappUrl={message.whatsappUrl} />
        )}
      </div>
    </div>
  );
}
