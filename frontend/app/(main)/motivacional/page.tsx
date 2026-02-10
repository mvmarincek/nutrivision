'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 flex items-center justify-center animate-pulse shadow-xl shadow-pink-200/50">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <p className="mt-4 text-gray-500">Preparando sua mensagem do dia...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5C15 5 5 20 5 30s10 25 25 25 25-10 25-25S45 5 30 5z\' fill=\'%23fff\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")',
          backgroundSize: '60px 60px'
        }} />
        <div className="relative px-6 py-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Motivacional</h1>
          <p className="text-white/80 text-sm">Sua mensagem diaria de bem-estar</p>
        </div>
      </div>

      {todayPost ? (
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Hoje - {formatDate(todayPost.date)}</span>
            </div>
          </div>
          <div className="px-6 py-5">
            {todayPost.content.split('\n').map((paragraph, i) => (
              paragraph.trim() && (
                <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-8 text-center mb-6">
          <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nao foi possivel carregar o post de hoje.</p>
          <button
            onClick={() => { setLoading(true); loadTodayPost(); }}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <button
        onClick={loadHistory}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
      >
        {loadingHistory ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : showHistory ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {showHistory ? 'Esconder posts anteriores' : 'Ver posts anteriores'}
      </button>

      {showHistory && history.length > 0 && (
        <div className="mt-4 space-y-4">
          {history.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{formatDate(post.date)}</span>
                </div>
              </div>
              <div className="px-5 py-4">
                {post.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="text-gray-600 text-sm leading-relaxed mb-2 last:mb-0">
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
        <div className="mt-4 text-center py-8">
          <p className="text-gray-400 text-sm">Nenhum post anterior ainda. Volte amanha!</p>
        </div>
      )}
    </div>
  );
}
