'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { chatApi, ChatConversationItem, ChatMessageItem } from '@/lib/api';
import { MessageCircle, Send, Plus, Trash2, Loader2, ArrowLeft, Crown, ChevronDown, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function NutricionistaPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const trialTotal = 7 + (user?.trial_bonus_days || 0);
  const trialDaysRemaining = user?.plan === 'free' ? Math.max(0, trialTotal - (user?.trial_days_used || 0)) : 0;
  const hasAccess = user?.plan === 'premium' || (user?.plan === 'free' && trialDaysRemaining > 0);

  useEffect(() => {
    if (hasAccess) {
      loadConversations();
    }
  }, [hasAccess]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      setLoading(true);
      const data = await chatApi.getConversation(id);
      setCurrentConversationId(id);
      setMessages(data.messages);
      setShowSidebar(false);
    } catch (err) {
      console.error('Erro ao carregar conversa:', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const tempUserMsg: ChatMessageItem = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatApi.sendMessage(userMessage, currentConversationId || undefined);
      
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        loadConversations();
      }

      setMessages(prev => [...prev, response.message]);
    } catch (err: any) {
      const errorMsg: ChatMessageItem = {
        id: Date.now() + 1,
        role: 'assistant',
        content: err.message || 'Erro ao enviar mensagem. Tente novamente.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        startNewConversation();
      }
    } catch (err) {
      console.error('Erro ao deletar conversa:', err);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 text-center max-w-md border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            NutraIA
          </h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Converse com nossa IA especializada em nutrição. Tire dúvidas sobre alimentação, dietas e hábitos saudáveis.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Seu período de teste gratuito expirou. Assine o plano Premium para continuar usando.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all"
          >
            <Crown className="w-5 h-5" />
            Assinar Premium - R$ 49,90/mês
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-2xl border-b border-gray-100">
        <div className="flex items-center gap-3">
          {currentConversationId && (
            <button
              onClick={startNewConversation}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-200/50">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">NutraIA</h1>
            <p className="text-xs text-gray-400">Sua nutricionista virtual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Nova conversa"
          >
            <Plus className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Historico"
          >
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showSidebar && (
        <div className="bg-white border-b border-gray-100 max-h-60 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Nenhuma conversa ainda</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  conv.id === currentConversationId ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(conv.updated_at || conv.created_at)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Olá! Sou a NutraIA</h3>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Pergunte sobre alimentacao, dietas, nutrientes ou habitos saudaveis. Estou aqui para ajudar!
            </p>
            <div className="mt-6 space-y-2 w-full max-w-sm">
              {[
                'Quais alimentos sao ricos em proteina?',
                'Como montar um prato equilibrado?',
                'Qual a importancia da fibra na dieta?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-6 max-w-xs">
              Esta IA nao substitui a consulta com um nutricionista ou medico.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-white border border-gray-100 text-gray-700 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-300'}`}>
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-sm text-gray-400">Pensando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-100 p-3 rounded-b-2xl">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
