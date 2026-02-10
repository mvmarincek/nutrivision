'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  content: string;
  show_register_button: boolean;
  show_login_button: boolean;
}

export default function ReceptionistChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem('picnutra_visited');
    const hasToken = localStorage.getItem('refreshToken');
    if (hasVisited || hasToken) {
      setIsReturning(true);
    }
    localStorage.setItem('picnutra_visited', 'true');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !greeted) {
        setIsOpen(true);
        loadGreeting();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadGreeting = async () => {
    if (greeted) return;
    setGreeted(true);
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/receptionist/greeting?returning=${isReturning}`);
      const data: ChatResponse = await res.json();
      setMessages([{ role: 'assistant', content: data.content }]);
      setShowRegister(data.show_register_button);
      setShowLogin(data.show_login_button);
    } catch {
      setMessages([{
        role: 'assistant',
        content: 'Ola! Bem-vindo ao PicNutra! Quer descobrir como transformar sua alimentacao com inteligencia artificial?'
      }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setPulse(false);
    if (!greeted) {
      loadGreeting();
    } else {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const allMessages = [...messages, { role: 'user' as const, content: userMsg }];
      const res = await fetch(`${API_URL}/receptionist/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          is_returning_user: isReturning
        })
      });
      const data: ChatResponse = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      if (data.show_register_button) setShowRegister(true);
      if (data.show_login_button) setShowLogin(true);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, tive um probleminha. Mas posso te dizer: o PicNutra vai transformar sua alimentacao!'
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-300/50 flex items-center justify-center hover:scale-110 transition-all ${pulse ? 'animate-bounce' : ''}`}
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-gray-400/30 border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">NutriBot</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-white/80 text-xs">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50" style={{ minHeight: '200px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {(showRegister || showLogin) && (
              <div className="flex flex-col gap-2 pt-2">
                {showRegister && (
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                  >
                    Comecar Gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {showLogin && (
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-all"
                  >
                    Entrar no App
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-100 p-3 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite aqui..."
                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl disabled:opacity-50 hover:shadow-lg transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
