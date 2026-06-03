'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  activeSection: string;
  resumeContext: string;
}

// Simple helper to parse basic markdown to React elements
function parseMarkdown(text: string) {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line.trim();

    // Check for headers (### or h3)
    if (cleanLine.startsWith('###')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-slate-800 mt-2 mb-1">
          {cleanLine.replace('###', '').trim()}
        </h4>
      );
    }
    
    // Check for bold text (**text**)
    let parts: React.ReactNode[] = [];
    let currentText = cleanLine;
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    
    // Handle list items
    const isBullet = cleanLine.startsWith('*') || cleanLine.startsWith('-');
    if (isBullet) {
      currentText = cleanLine.substring(1).trim();
    }

    while ((match = boldRegex.exec(currentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(currentText.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < currentText.length) {
      parts.push(currentText.substring(lastIndex));
    }

    const content = parts.length > 0 ? parts : currentText;

    if (isBullet) {
      return (
        <li key={idx} className="ml-4 list-disc text-slate-700 text-xs my-0.5">
          {content}
        </li>
      );
    }

    return (
      <p key={idx} className="text-slate-700 text-xs my-1 leading-relaxed min-h-[1em]">
        {content}
      </p>
    );
  });
}

export default function ChatAssistant({ activeSection, resumeContext }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Escribe el **puesto objetivo** al que deseas aplicar arriba para poder darte sugerencias alineadas. Luego, puedes preguntarme lo que quieras o pedirme que analice tu currículum.',
    },
  ]);
  const [targetJob, setTargetJob] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    if (!textToSend) {
      setInput('');
    }

    setError(null);
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          currentSection: activeSection,
          resumeContext: resumeContext,
          targetJob: targetJob,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo establecer comunicación con el asistente.');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMsg = data.choices?.[0]?.message;
      if (assistantMsg) {
        setMessages((prev) => [...prev, { role: 'assistant', content: assistantMsg.content }]);
      } else {
        throw new Error('Respuesta inválida del servidor.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerQuickAction = () => {
    const prompt = `Dame recomendaciones para redactar y mejorar mi sección de "${activeSection}" si quiero postularme como "${targetJob || 'mi puesto objetivo'}".`;
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Target Job Config Area */}
      <div className="bg-white p-3 border-b border-slate-200">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Puesto al que aspiras:
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Ej: Frontend Developer, Contador, etc."
            value={targetJob}
            onChange={(e) => setTargetJob(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-lg outline-none transition-all font-semibold"
          />
          <Sparkles className="absolute right-2.5 top-2 w-3.5 h-3.5 text-violet-400 pointer-events-none" />
        </div>
      </div>

      {/* Active Section Context Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border-b border-violet-100 text-violet-800 text-[11px] font-medium">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
          <span className="truncate">
            Sección activa: <span className="font-bold">{activeSection}</span>
          </span>
        </div>
        
        {/* Quick Suggestion Button */}
        {activeSection !== 'General' && (
          <button
            onClick={triggerQuickAction}
            className="px-2 py-0.5 bg-white text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-md font-semibold text-[10px] cursor-pointer shadow-2xs active:scale-95 transition-all flex-shrink-0"
          >
            Sugerir
          </button>
        )}
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#f8fafc]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="p-1.5 bg-violet-600 text-white rounded-lg flex-shrink-0 shadow-sm mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-3xs ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="leading-relaxed">{msg.content}</p>
              ) : (
                <div className="space-y-1">{parseMarkdown(msg.content)}</div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="p-1.5 bg-slate-200 text-slate-600 rounded-lg flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-violet-600 text-white rounded-lg flex-shrink-0 shadow-sm animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-3xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Form Control */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex gap-2"
      >
        <input
          type="text"
          placeholder="Pregúntale al asistente..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
