import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, RotateCcw, MessageCircle } from 'lucide-react';
import { sendChatMessage } from '../../api/chat';
import { AIBanner } from './AIBanner';
import { MessageBubble } from './MessageBubble';
import { QuickReplies } from './QuickReplies';
import { TypingIndicator } from './TypingIndicator';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

const MAX_CHARS = 1500;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [pendingQuoteText, setPendingQuoteText] = useState(
    () => sessionStorage.getItem('kenpaku_pending_quote') || ''
  );

  // Read conversation_id from sessionStorage or initialize
  const [conversationId, setConversationId] = useState(() => {
    return sessionStorage.getItem('kenpaku_conversation_id') || null;
  });

  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: '¡Hola! Soy el Asesor Virtual de Comercial Kenpaku. ¿En qué estructura o producto de acero puedo orientarte hoy?'
    }
  ]);

  const messagesEndRef = useRef(null);

  // Último enlace de WhatsApp enviado por el backend (incluye resumen de la conversación).
  // Si aún no hay ninguno, el botón usa el mensaje genérico.
  const latestWhatsappUrl =
    [...messages].reverse().find((m) => m.sender === 'bot' && m.whatsappUrl)?.whatsappUrl ||
    buildWhatsAppUrl('Hola Comercial Kenpaku, quisiera hablar con un asesor de ventas.');

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend, isRetry = false) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || (isLoading && !isRetry)) return;

    if (text.length > MAX_CHARS) return;

    setNetworkError(false);

    // Append user message if not retrying
    if (!isRetry) {
      const userMsgObj = { id: `user-${Date.now()}`, sender: 'user', text };
      setMessages((prev) => [...prev, userMsgObj]);
      setInputMessage('');
      setHasUserSentMessage(true);
      setLastUserMessage(text);
    }

    setIsLoading(true);

    // Retrieve active product_id if set from product detail page
    const productId = sessionStorage.getItem('kenpaku_chat_product_id') || null;

    try {
      const response = await sendChatMessage({
        conversation_id: conversationId,
        message: text,
        product_id: productId,
        pending_quote_text: pendingQuoteText || null,
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
        sessionStorage.setItem('kenpaku_conversation_id', response.conversation_id);
      }

      const botMsgObj = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        products: response.products || [],
        handoff: response.handoff || false,
        whatsappUrl: response.whatsapp_url || null,
        quote: response.quote || null,
        pendingQuoteText: response.pending_quote_text || '',
        quoteMissingFields: response.quote_missing_fields || [],
      };
      if (response.pending_quote_text) {
        setPendingQuoteText(response.pending_quote_text);
        sessionStorage.setItem('kenpaku_pending_quote', response.pending_quote_text);
      } else if (response.quote || pendingQuoteText) {
        setPendingQuoteText('');
        sessionStorage.removeItem('kenpaku_pending_quote');
      }

      setMessages((prev) => [...prev, botMsgObj]);
    } catch (err) {
      console.error('Chat API Error:', err);
      setNetworkError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (selectedText) => {
    handleSendMessage(selectedText);
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage, true);
    }
  };

  return (
    <>
      {/* Floating Trigger Button - Bottom Right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pulse-ring fixed right-4 bottom-4 z-40 flex min-h-14 items-center gap-3 rounded-2xl bg-navy-900 py-2 pr-5 pl-3 text-white shadow-lift transition hover:-translate-y-0.5 sm:right-6 sm:bottom-6 cursor-pointer border border-navy-800"
          aria-label="Abrir Asesor Virtual de IA"
        >
          <span className="relative grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-xs">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-navy-900 bg-emerald-400" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold font-display">Asesor IA</span>
            <span className="block text-micro text-emerald-300 font-semibold">En línea</span>
          </span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          className="slide-up fixed inset-x-3 top-3 bottom-3 z-50 flex flex-col sm:inset-auto sm:right-6 sm:bottom-24 sm:w-[400px] sm:h-[min(640px,calc(100vh-8rem))] sm:max-h-[min(640px,calc(100vh-8rem))] overflow-hidden rounded-chat border border-steel-200 bg-white shadow-lift"
          role="dialog"
          aria-label="Ventana de chat con Asesor IA"
        >
          {/* Header */}
          <div className="steel-texture flex items-center gap-3 bg-navy-900 p-4 text-white shrink-0">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm leading-tight text-white">Asesor IA Kenpaku</h3>
              <p className="flex items-center gap-1.5 text-micro text-emerald-300 font-medium">
                <span className="size-2 rounded-full bg-emerald-400" />
                En línea · Responde al instante
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid size-11 place-items-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI Permanent Top Banner */}
          <AIBanner />

          {/* Messages Body */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-steel-50 p-4">
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <MessageBubble message={msg} />
                {msg.pendingQuoteText && (
                  <div className="mb-3 ml-9 flex flex-wrap gap-1.5" aria-label="Respuestas rápidas para completar la cotización">
                    {(msg.quoteMissingFields || []).flatMap((field) => ({
                      forma: ['Cuadrado', 'Rectangular', 'Redondo'],
                      tipo: ['Corrugado', 'Liso', 'LAC', 'LAF'],
                      medida: ['1/2 pulgada', '1 pulgada', '2 pulgadas'],
                      espesor: ['1.5 mm', '2 mm', '3 mm'],
                      acabado: ['Negro', 'Galvanizado'],
                    }[field] || [])).map((reply) => (
                      <button
                        key={`${msg.id}-${reply}`}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSendMessage(reply)}
                        className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-micro font-bold text-brand-700 hover:bg-brand-50 shadow-2xs transition-colors disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Quick Suggestions Chips - Disappears after first user message */}
            {!hasUserSentMessage && !isLoading && (
              <QuickReplies onSelectOption={handleQuickReply} />
            )}

            {/* Network Error Box */}
            {networkError && (
              <div className="p-3.5 rounded-card bg-red-50 border border-red-200 text-red-900 text-xs space-y-2 animate-fade-in my-2 shadow-2xs">
                <p className="font-bold">No pude conectar. Intenta de nuevo o escríbenos por WhatsApp.</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-btn font-bold flex items-center gap-1 transition-colors text-xs cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>

                  <a
                    href={buildWhatsAppUrl('Hola Comercial Kenpaku, el chat presentó un inconveniente de red.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-btn font-bold flex items-center gap-1 transition-colors text-xs shadow-wa"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Footer with character counter and legal disclaimer */}
          <div className="space-y-2 border-t border-steel-200 bg-white p-3 shrink-0">
            <a
              href={latestWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="chat-whatsapp-button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-btn shadow-wa transition-all min-h-11"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Hablar con un asesor por WhatsApp</span>
            </a>

            <p className="text-center text-micro text-steel-500 leading-tight">
              El asesor orienta tu compra, pero no reemplaza a un ingeniero en usos estructurales.
            </p>

            <div className="relative flex items-center">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                disabled={isLoading}
                placeholder="Escribe tu consulta o lista de materiales…"
                className="max-h-36 min-h-11 w-full resize-none overflow-y-auto rounded-xl border border-steel-200 py-3 pl-3.5 pr-20 text-xs text-navy-900 placeholder-steel-500 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-500/15 disabled:bg-steel-100 shadow-inset"
                onInput={(event) => {
                  event.currentTarget.style.height = 'auto';
                  event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 144)}px`;
                }}
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                <span className={`text-micro font-mono num ${inputMessage.length > 1400 ? 'text-amber-600 font-bold' : 'text-steel-500'}`}>
                  {inputMessage.length}/{MAX_CHARS}
                </span>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="grid size-9 place-items-center rounded-lg bg-navy-900 hover:bg-navy-950 disabled:bg-steel-200 text-white disabled:text-steel-500 transition-colors cursor-pointer"
                  aria-label="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}