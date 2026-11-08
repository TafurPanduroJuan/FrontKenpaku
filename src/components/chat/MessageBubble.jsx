import React from 'react';
import { Bot, User } from 'lucide-react';
import { ProductChatCard } from './ProductChatCard';
import { HandoffCard } from './HandoffCard';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export function MessageBubble({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3.5 animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
          isUser ? 'bg-navy-900 text-white' : 'bg-brand-600 text-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        {/* Main Text Bubble - Rendered strictly as PLAIN TEXT */}
        {message.text && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
              isUser
                ? 'bg-brand-600 text-white rounded-tr-none font-medium shadow-xs'
                : 'bg-white text-navy-900 border border-steel-200 rounded-tl-none shadow-2xs'
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

        {message.quote && (
          <Link
            to={`/proforma/${encodeURIComponent(message.quote.codigo)}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-btn bg-accent-600 hover:bg-accent-700 px-4 py-2.5 text-xs font-bold text-white shadow-cta transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Ver / descargar proforma <strong className="font-mono num">{message.quote.codigo}</strong></span>
          </Link>
        )}
      </div>
    </div>
  );
}
