import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, RotateCcw, MessageCircle } from 'lucide-react';
import { sendChatMessage } from '../../api/chat';
import { AIBanner } from './AIBanner';
import { MessageBubble } from './MessageBubble';
import { QuickReplies } from './QuickReplies';
import { TypingIndicator } from './TypingIndicator';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

const MAX_CHARS = 500;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');

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
        product_id: productId
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
        whatsappUrl: response.whatsapp_url || null
      };

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
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-[#0A2540] hover:bg-[#0F3256] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 min-h-[48px] border border-slate-700/50"
          aria-label="Abrir Asesor Virtual de IA"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#0284C7]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0A2540] rounded-full animate-pulse" />
          </div>
          <span>Asesor IA</span>
        </button>
      </div>

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-20 sm:right-6 z-50 w-full sm:w-[380px] h-[580px] max-h-[92vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up"
          role="dialog"
          aria-label="Ventana de chat con Asesor IA"
        >
          {/* Header */}
          <div className="bg-kenpaku-navy text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-kenpaku-blue flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-kenpaku-navy rounded-full" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">Asesor IA Kenpaku</h3>
                <p className="text-[10px] text-emerald-400 font-medium">● En línea · Responde al instante</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI Permanent Top Banner */}
          <AIBanner />

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Quick Suggestions Chips - Disappears after first user message */}
            {!hasUserSentMessage && !isLoading && (
              <QuickReplies onSelectOption={handleQuickReply} />
            )}

            {/* Network Error Box */}
            {networkError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-2 animate-fade-in my-2">
                <p className="font-bold">No pude conectar. Intenta de nuevo o escríbenos por WhatsApp.</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>

                  <a
                    href={buildWhatsAppUrl('Hola Comercial Kenpaku, el chat presentó un inconveniente de red.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-kenpaku-whatsapp hover:bg-kenpaku-whatsappHover text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Footer with 500 Char Counter & Legal Disclaimer */}
          <div className="p-3.5 bg-white border-t border-slate-200 space-y-2 shrink-0">
            <p className="text-[10px] text-slate-500 text-center leading-tight">
              El asesor orienta tu compra, pero no reemplaza a un ingeniero en usos estructurales.
            </p>

            <div className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                placeholder="Escribe tu consulta sobre acero..."
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-kenpaku-blue focus:ring-2 focus:ring-kenpaku-blue/20 disabled:bg-slate-100"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                <span className={`text-[10px] font-mono ${inputMessage.length > 450 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {inputMessage.length}/{MAX_CHARS}
                </span>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-2 bg-kenpaku-orange hover:bg-kenpaku-orangeHover disabled:bg-slate-300 text-white rounded-lg transition-colors min-h-[36px] flex items-center justify-center"
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
