'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, ChevronDown, ChevronUp, Loader2, Sparkles, Sun, Star } from 'lucide-react';
import { api } from '@/lib/api';

interface Post {
  id: number;
  content: string;
  image_url: string | null;
  date: string;
}

export default function MotivacionalPage() {
  const [todayPost, setTodayPost] = useState<Post | null>(null);
  const [history, setHistory] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadTodayPost();
  }, []);

  async function loadTodayPost() {
    try {
      const post = await api<Post>('/motivacional/today');
      setTodayPost(post);
    } catch (err) {
      console.error('Erro ao carregar post motivacional:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (history.length > 0) {
      setShowHistory(!showHistory);
      return;
    }
    setLoadingHistory(true);
    try {
      const posts = await api<Post[]>('/motivacional/history');
      setHistory(posts.filter(p => p.date !== todayPost?.date));
      setShowHistory(true);
    } catch (err) {
      console.error('Erro ao carregar historico:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-');
    const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${day} de ${months[parseInt(month) - 1]}`;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center animate-pulse shadow-2xl shadow-orange-300/50">
          <Sun className="w-10 h-10 text-white animate-spin-slow" />
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Preparando sua inspiracao do dia...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:20px_20px]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
        <div className="relative px-6 py-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Sun className="w-9 h-9 text-white drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-md">Momento Inspiracao</h1>
          <p className="text-white/90 text-base font-medium">Sua dose diaria de motivacao e bem-estar</p>
        </div>
      </div>

      {todayPost ? (
        <div className="relative bg-white rounded-3xl shadow-2xl shadow-orange-100/50 border-2 border-orange-100 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-orange-700">{formatDate(todayPost.date)}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white">HOJE</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-8 relative">
            <div className="absolute top-4 left-4 text-6xl text-orange-100 font-serif leading-none">"</div>
            <div className="relative z-10 pl-6">
              {todayPost.content.split('\n').map((paragraph, i) => (
                paragraph.trim() && (
                  <p key={i} className="text-gray-800 text-lg leading-relaxed mb-4 last:mb-0 font-medium">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
            <div className="absolute bottom-4 right-4 text-6xl text-orange-100 font-serif leading-none rotate-180">"</div>
          </div>
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-orange-100">
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-sm font-semibold">Cuide de voce, um passo de cada vez</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border-2 border-gray-100 p-10 text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-4">Nao foi possivel carregar a mensagem de hoje.</p>
          <button
            onClick={() => { setLoading(true); loadTodayPost(); }}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 text-gray-700 hover:border-orange-200 hover:from-orange-50 hover:to-amber-50 transition-all font-bold text-base"
      >
        {loadingHistory ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : showHistory ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
        {showHistory ? 'Esconder mensagens anteriores' : 'Ver mensagens anteriores'}
      </button>

      {showHistory && history.length > 0 && (
        <div className="mt-6 space-y-4">
          {history.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:border-orange-100 transition-all">
              <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">{formatDate(post.date)}</span>
                </div>
              </div>
              <div className="px-5 py-5">
                {post.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="text-gray-700 text-base leading-relaxed mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <div className="mt-6 text-center py-10 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
          <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma mensagem anterior ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Volte amanha para mais inspiracao!</p>
        </div>
      )}
    </div>
  );
}
